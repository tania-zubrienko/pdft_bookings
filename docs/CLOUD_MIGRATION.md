# Cloud Functions Migration

Move booking, credit, and reservation logic off the client and into Cloud Functions.
Goal: eliminate client-side writes to sensitive collections (`creditPools`, `reservations`, `scheduledClasses`), enforce security server-side, and lock down Firestore rules.

---

## Why

- Any authenticated user can currently call `addDoc`/`updateDoc` directly on `creditPools` and `reservations`
- The client picks which credit pool to deduct from — violates FIFO and allows pool forgery
- `getCreditBalance` only reads 1 pool and returns an incorrect total
- Admin credit creation has no server-side role check

---

## Todos

### Cloud Functions (functions/src/index.ts)

- [x] **Align types with current data model**
  - Replace legacy `Class`/`Reservation` interfaces with `ScheduledClass`/`CreditPool`/`Reservation` matching `src/types/index.ts`
  - Remove Stripe-specific fields from types (not used)
  - Update collection references (`classes` → `scheduledClasses`)
  - Remove `createSingleClassSession` (Stripe) and `cleanupPendingReservations` (uses removed `pending` status)
  - Export types and `ERROR_CODES`; `functions/` deps installed and build passes

- [ ] **bookWithCredits**
  - Input: `{ classId: string }`
  - Auth: required (student)
  - Transaction:
    1. Check `scheduledClass.status === 'active'`
    2. Check `enrolledCount < capacity` (INV-002)
    3. Check no existing reservation for `(studentId, classId)` (INV-003)
    4. Query valid credit pools: `studentId == uid`, `remainingCredits > 0`, `startDate <= now`, `expiresAt > now`, ordered by `expiresAt asc` (FIFO)
    5. Throw `NO_VALID_CREDITS` if none found
    6. Decrement `remainingCredits` on earliest pool (INV-001)
    7. Increment `enrolledCount` + `arrayUnion(studentId)` on class
    8. Create reservation: `status: 'confirmed'`, `paymentMode: 'credit'`, `creditPoolId`
  - Output: `{ success: true, reservationId: string }`

- [ ] **cancelReservation**
  - Input: `{ reservationId: string }`
  - Auth: required (student owns reservation OR admin)
  - Transaction:
    1. Fetch reservation, verify ownership
    2. Check cancellation window (policy TBD)
    3. If `paymentMode === 'credit'`: restore 1 credit to `creditPoolId` (if pool not expired — policy decision required)
    4. Set `reservation.status = 'cancelled'`, set `cancelledAt`
    5. Decrement `enrolledCount`, `arrayRemove(studentId)` on class
  - Output: `{ success: true }`

- [ ] **getStudentCreditBalance**
  - Input: none (uses `context.auth.uid`)
  - Auth: required
  - Server-side: query all pools for student where `startDate <= now AND expiresAt > now AND remainingCredits > 0`
  - Sum `remainingCredits` and `totalCredits` across all valid pools
  - Output: `{ remaining: number, total: number, pools: CreditPool[] }`

- [ ] **getMyReservations**
  - Input: none (uses `context.auth.uid`)
  - Auth: required
  - Fetch reservations scoped to `studentId == uid`
  - Join with `scheduledClasses` for class details
  - Output: `Reservation[]` with denormalized class info

- [ ] **adminCreateCreditPool**
  - Input: `{ studentId, credits, startDate, expiresAt, packageId?, notes? }`
  - Auth: required, must have `isAdmin` custom claim
  - Validate: `startDate < expiresAt`, `credits > 0`
  - Create `creditPool` document with `createdBy: context.auth.uid`
  - Output: `{ success: true, poolId: string }`

---

### Client callable wrappers (src/services/callable.ts)

- [ ] Add `bookWithCredits(classId: string)`
- [ ] Add `cancelReservation(reservationId: string)`
- [ ] Add `getStudentCreditBalance()`
- [ ] Add `adminCreateCreditPool(params)`
- [ ] Remove `createSingleClassSession` (Stripe — not used)

---

### Client service cleanup

- [ ] **credit.service.ts**
  - Remove `withdrawCredit(creditPoolId)` — replaced by `bookWithCredits` CF
  - Remove `createCreditPool(...)` — replaced by `adminCreateCreditPool` CF
  - Fix `getCreditBalance`: aggregate all valid pools (not just 1), filter by `startDate/expiresAt`, return `CreditBalance` not `CreditPool`

- [ ] **reservation.service.ts**
  - Remove `createReservationForStudent(...)` — replaced by `bookWithCredits` CF
  - Keep `getReservationsByStudent` as read-only fallback until `getMyReservations` CF is live

---

### Page updates

- [ ] **ClassDetail** (`src/pages/classes/ClassDetail.tsx`)
  - Replace call to `reservationService.createReservationForStudent(...)` with `bookWithCredits(classId)` callable
  - Remove `creditPoolId` selection logic from the component

- [ ] **CreditManagement** (`src/pages/admin/CreditManagement.tsx`)
  - Replace call to `creditService.createCreditPool(...)` with `adminCreateCreditPool(...)` callable

- [ ] **MyReservations** (`src/pages/reservations/MyReservations.tsx`)
  - Replace call to `reservationService.getReservationsByStudent(...)` with `getMyReservations()` callable

---

### Firestore Security Rules (`firestore.rules`)

- [ ] Deploy rules that block all client writes to sensitive collections:
  ```
  creditPools   → read: owner only, write: false (CF only)
  reservations  → read: owner only, write: false (CF only)
  scheduledClasses → read: authenticated, write: admin only
  classes       → read: authenticated, write: admin only
  users         → read: self only, write: false
  packages      → read: authenticated, write: admin only
  ```

---

## Security Hardening

> These actions protect the Firebase project against API key leakage, cost abuse, and unauthorized data access. Complete before going to production.

### Priority 1 — Critical (block before launch)

- [ ] **Deploy Firestore Security Rules** (see section below)
  - Blocks unauthorized writes to `creditPools`, `reservations`, `scheduledClasses` even with a valid auth token
  - Without these rules, any authenticated user can write to any collection

- [ ] **Set hard billing cap with auto-disable**
  - GCP Console → Billing → Budgets & Alerts → Create budget
  - Set amount (e.g., $15/month) with alert thresholds at 25% and 90%
  - Add Pub/Sub action → link to a Cloud Function that calls `billingbudgets.disableBillingForProject()`
  - This **cuts billing entirely** when the cap is hit — app goes read-only, no surprise bill
  - Email alerts alone are not sufficient against exfiltration attacks

- [ ] **Restrict API key to production domain**
  - GCP Console → APIs & Services → Credentials → select the browser API key
  - Set HTTP referrers to `https://yourdomain.com/*` only
  - Restrict to only required APIs: Firebase Auth, Cloud Firestore, Cloud Storage, Cloud Functions
  - Key becomes inert if used from any other origin (scripts, Postman, other sites)

### Priority 2 — High (complete shortly after launch)

- [ ] **Enable Firebase App Check (reCAPTCHA v3)**
  - Firebase Console → App Check → register web app with reCAPTCHA v3 (free)
  - Cryptographically binds requests to the actual web app — scrapers using a leaked key get a 403
  - Note: enforce only after verifying it does not break legitimate flows in staging

- [ ] **Enable Email Enumeration Protection**
  - Firebase Console → Authentication → Settings → enable "Email enumeration protection"
  - Prevents attackers from probing which emails are registered

### Priority 3 — Good Practice

- [ ] **Verify `.env` files are not committed to git**
  - Confirm `.env*.local` is in `.gitignore`
  - Run `git log --all --full-history -- "**/.env*"` to check history for accidental commits
  - If found: rotate all Firebase credentials immediately

- [ ] **Add Firebase Storage security rules (if avatars are implemented)**
  - Restrict writes to owner only, max 2 MB, image content type only
  - Rule: `allow write: if request.auth.uid == userId && request.resource.size < 2 * 1024 * 1024 && request.resource.contentType.matches('image/.*')`
  - Prevents storage flooding

---

## Invariants to enforce in every booking CF

| ID      | Rule                                                                  |
| ------- | --------------------------------------------------------------------- |
| INV-001 | `remainingCredits >= 0` — checked in transaction before decrement     |
| INV-002 | `enrolledCount <= capacity` — checked in transaction before increment |
| INV-003 | No duplicate `(studentId, scheduledClassId)` reservation              |
| INV-004 | Only Cloud Functions set `reservation.status = 'confirmed'`           |
| INV-005 | Credits only consumed within `startDate ≤ now ≤ expiresAt`            |
