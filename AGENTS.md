# AI Agent Specifications: Dance Academy Booking System

## Project Overview

A reservation and credit-based booking system for a dance academy. Students browse classes via a calendar view and reserve spots using pre-purchased credit packages.

**Stack:** React + TypeScript + Vite + Tailwind CSS  
**Data Layer:** Mock data (in-memory, simulated async) — Firebase integration planned for production  
**Authentication:** Not implemented (deferred to future phase)  
**Current Scale:** ~20 students  
**Target Scale:** 500+ students with concurrent bookings

### Functional Scope

The system currently supports:

- Calendar-based class browsing (week/month view)
- Credit-based reservations (1 credit = 1 class)
- Purchase of class packages (1, 4, 8, 14 credits)
- Credit pool management per student
- Expiration policy (30/60/90 days per package)
- Credit balance display when reserving
- Mobile-responsive UI with hamburger menu
- No per-class pricing — all bookings use credits

---

## Current Architecture

### Frontend Structure

```
src/
├── App.tsx                          # Routes
├── main.tsx                         # Entry (BrowserRouter, no auth)
├── index.css                        # Tailwind + custom components
├── types/index.ts                   # All TypeScript interfaces
├── lib/
│   ├── firebase.ts                  # Firebase config (unused, kept for future)
│   └── mockData.ts                  # Mock data layer (replaces Firebase)
├── components/
│   ├── Calendar/CalendarView.tsx    # Week/month calendar grid
│   ├── Classes/ClassCard.tsx        # Compact class card
│   └── Layout/Layout.tsx            # Header, nav, footer, mobile menu
└── pages/
    ├── classes/
    │   ├── ClassList.tsx            # Main page: calendar + day class list
    │   └── ClassDetail.tsx          # Class info + credit booking card
    ├── packages/
    │   └── Packages.tsx             # Package purchase page (4 tiers)
    ├── reservations/
    │   └── MyReservations.tsx       # Reservation list
    └── booking/
        └── BookingResult.tsx        # Success/cancelled feedback
```

### Routes

| Path                 | Component             | Description                         |
| -------------------- | --------------------- | ----------------------------------- |
| `/classes`           | ClassList             | Calendar + day class list (default) |
| `/classes/:classId`  | ClassDetail           | Class detail + booking              |
| `/packages`          | Packages              | Credit packages for purchase        |
| `/my-reservations`   | MyReservations        | Student's reservation list          |
| `/booking/success`   | BookingResult         | Post-booking success                |
| `/booking/cancelled` | BookingResult         | Post-booking cancelled              |
| `/` or `*`           | Redirect → `/classes` | Default/fallback                    |

### Navigation

- **Desktop:** Horizontal nav in header (Classes, Buy Credits, My Reservations)
- **Mobile:** Hamburger menu (☰/✕ toggle) with same links in dropdown

---

## Core Domain Concepts

### Payment Model: Credit-Only

Classes do **not** have individual prices. All reservations consume 1 credit from the student's balance. Credits are purchased via packages.

| Package        | Credits | Price   | Per Class | Validity |
| -------------- | ------- | ------- | --------- | -------- |
| Single Class   | 1       | $25.00  | $25.00    | 30 days  |
| Starter Pack   | 4       | $80.00  | $20.00    | 30 days  |
| Regular Pack   | 8       | $144.00 | $18.00    | 60 days  |
| Unlimited Pack | 14      | $224.00 | $16.00    | 90 days  |

### Credit Pools

- Credits are purchased in packages (bundles)
- Each purchase creates a new credit pool with an expiration date
- Multiple pools can exist per student
- Stored in `creditPools` collection (mock data currently)

### Booking Flow (Credit-Based)

1. Student browses classes via calendar view
2. Clicks "Reserve" → navigates to class detail
3. Class detail shows credit balance (e.g., 5/10)
4. If credits available: "Use 1 Credit to Reserve" button
5. If no credits: "Get Credits to Reserve" → links to `/packages`
6. On booking: 1 credit deducted, reservation created as `paid`

### Package Purchase Flow

1. Student navigates to `/packages` (via "Buy Credits" nav link)
2. Views 4 package tiers with pricing and savings
3. Clicks "Buy" → Stripe checkout (mock alert currently)
4. On webhook confirmation: credit pool created with expiration
5. Credits become available for booking

---

## Data Models

### Class

Path: `classes/{classId}`

```typescript
interface Class {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  scheduledAt: Date;
  duration: number; // in minutes
  capacity: number;
  enrolledCount: number; // Denormalized counter
  active: boolean;
  imageUrl?: string;
  location?: string;
}
```

**Notes:**

- No `price` field — pricing is package-based only
- `enrolledCount` is denormalized (ADR-001)
- `scheduledAt` uses `Date` (will be `Timestamp` in Firestore)

### Package

Path: `packages/{packageId}`

```typescript
interface Package {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  validityDays: number;
  active: boolean;
  description?: string;
  highlight?: boolean; // featured/recommended badge
}
```

**Rules:**

- Only admin can modify (future)
- Public read (authenticated, future)

### Reservation

Path: `reservations/{reservationId}`

```typescript
interface Reservation {
  id: string;
  studentId: string;
  classId: string;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMode: 'single' | 'credit';
  createdAt: Date;
  paidAt?: Date;
  creditPoolId?: string; // If paid with credits
  paymentIntentId?: string; // If paid with Stripe
}
```

**Rules:**

- If `paymentMode = 'credit'`: Must decrement `remainingCredits`, no Stripe payment required
- If `paymentMode = 'single'`: Reserved for future direct payment support

### CreditPool

Path: `creditPools/{poolId}`

```typescript
interface CreditPool {
  id: string;
  studentId: string;
  remainingCredits: number;
  totalCredits: number;
  expiresAt: Date;
  packageId: string; // Reference to packages collection
  createdAt: Date;
}
```

**Rules:**

- `remainingCredits` cannot be negative
- Expired pools cannot be used
- Credits are consumed FIFO (earliest expiration first)

### CreditBalance

Aggregated view (not a Firestore document):

```typescript
interface CreditBalance {
  remaining: number;
  total: number;
}
```

### User

Path: `users/{userId}` (future — no auth currently)

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'instructor' | 'admin';
  createdAt: Date;
  photoURL?: string;
}
```

### Payment

Path: `payments/{paymentId}`

```typescript
interface Payment {
  id: string;
  studentId: string;
  amount: number;
  type: 'single_class' | 'package';
  stripePaymentIntentId: string;
  reservationId?: string;
  creditPoolId?: string;
  createdAt: Date;
}
```

---

## Mock Data Layer

All data is served from `src/lib/mockData.ts` with simulated async delays (200-300ms).

### Available Mock Data

| Data         | Count | Description                                   |
| ------------ | ----- | --------------------------------------------- |
| Classes      | 16    | Spread across days 0-14, various styles/times |
| Reservations | 3     | Mix of paid, pending, credit & single modes   |
| Credit Pools | 1     | 5/10 remaining, expires in 60 days            |
| Packages     | 4     | 1/4/8/14 credits at $25/$80/$144/$224         |

### Exported Functions

```typescript
getClasses(): Promise<Class[]>
getClassById(id: string): Promise<Class | null>
getReservations(): Promise<Reservation[]>
getCreditBalance(): Promise<CreditBalance>
getPackages(): Promise<Package[]>
```

---

## UI Components

### CalendarView (`components/Calendar/CalendarView.tsx`)

- Week and month view toggle
- Navigation arrows for prev/next period
- Responsive: single-letter day names on mobile, dot indicators vs text badges
- Touch-friendly cells (min-h-[44px])
- Color-coded dots for days with classes
- Click on day → shows that day's classes below

### ClassCard (`components/Classes/ClassCard.tsx`)

- Compact card: title, instructor, time, enrolled count, spots left, location, duration
- No price display
- Color-coded availability (green/amber/red)
- "Reserve" button → links to class detail
- "Full" state disables interaction

### ClassDetail (`pages/classes/ClassDetail.tsx`)

- Class info grid (date, time, spots, duration)
- Instructor section with avatar initial
- Location section
- **Booking card (sidebar):**
  - Credit balance (remaining/total with progress bar) — if credits > 0
  - "No Credits Available" prompt with "Buy Credits" link — if credits = 0
  - Availability status (green/red)
  - "Use 1 Credit to Reserve" button — if credits available
  - "Get Credits to Reserve" link — if no credits
  - What's Included list

### Packages (`pages/packages/Packages.tsx`)

- 4-column responsive grid (1 col mobile → 2 col sm → 4 col lg)
- Each card: credit count, package name, description, price, per-class price, validity, features, buy button
- "Most Popular" badge on highlighted package (Regular Pack)
- Current credit balance shown at top if credits exist
- Mock purchase via alert

### Layout (`components/Layout/Layout.tsx`)

- Sticky header with logo + nav
- Desktop: horizontal nav links (Classes, Buy Credits, My Reservations)
- Mobile: hamburger menu toggle (☰/✕) with dropdown nav
- Footer with copyright
- Wraps all pages

---

## Invariants (MUST ALWAYS HOLD)

### Critical Invariants

These conditions must **never** be violated under any circumstances:

| ID      | Invariant                                                   | Enforcement                                     |
| ------- | ----------------------------------------------------------- | ----------------------------------------------- |
| INV-001 | `remainingCredits >= 0`                                     | Firestore transaction with pre-check            |
| INV-002 | `enrolledCount <= capacity`                                 | Firestore transaction with pre-check            |
| INV-003 | No duplicate reservation for same `(studentId, classId)`    | Composite unique constraint / transaction check |
| INV-004 | `reservation.status === 'paid'` is the ONLY confirmed state | Server-side status management only              |
| INV-005 | Credits cannot be consumed after `expiresAt`                | Server-side expiration validation               |

### Invariant Violation Response

If any invariant would be violated:

1. Abort the transaction
2. Return appropriate error code
3. Log the attempted violation for audit
4. **Never** proceed with partial state

---

## Security Boundaries (Production)

> **Note:** Authentication is not yet implemented. These rules apply to the future Firebase production deployment.

### Client Trust Model

**NEVER trust the client for:**
| Data | Reason | Server Action |
|------|--------|---------------|
| Credit availability | Client can fabricate balances | Query `creditPools` server-side |
| Seat availability | Race conditions possible | Check `enrolledCount` in transaction |
| Payment confirmation | Can be spoofed | Only accept Stripe webhook |
| Credit pool selection | Must enforce FIFO | Server selects earliest expiring pool |
| `remainingCredits` value | Direct modification forbidden | Only Cloud Functions modify |

**Client MAY provide:**

- Intent to book (studentId, classId)
- UI state (non-authoritative)

### Firestore Security Rules (Production)

```javascript
// packages - Public read (authenticated), Admin write only
match /packages/{packageId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.admin == true;
}

// creditPools - READ only for owner, NO client writes
match /creditPools/{poolId} {
  allow read: if request.auth.uid == resource.data.studentId;
  allow write: if false; // Only Cloud Functions
}

// reservations - READ for owner, CREATE with 'pending' only
match /reservations/{resId} {
  allow read: if request.auth.uid == resource.data.studentId;
  allow create: if request.auth.uid == request.resource.data.studentId
                && request.resource.data.status == 'pending';
  allow update, delete: if false; // Only Cloud Functions
}

// classes - Public read (authenticated)
match /classes/{classId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.admin == true;
}
```

---

## Transaction Requirements (Production)

### When Transactions Are REQUIRED

| Operation                    | Transaction Required | Reason                     |
| ---------------------------- | -------------------- | -------------------------- |
| Credit decrement             | ✅ YES               | Prevent double-spend       |
| Seat booking (counter-based) | ✅ YES               | Prevent overbooking        |
| Reservation creation         | ✅ YES               | Prevent duplicate bookings |
| Credit pool expiration check | ✅ YES               | Atomic read-then-validate  |

### Transaction Pattern: Credit Booking

```typescript
// PSEUDOCODE - All credit bookings must follow this pattern
async function bookWithCredits(studentId: string, classId: string) {
  return firestore.runTransaction(async (tx) => {
    // 1. Get class and validate capacity
    const classDoc = await tx.get(classRef);
    if (classDoc.data().enrolledCount >= classDoc.data().capacity) {
      throw new Error('CLASS_FULL');
    }

    // 2. Check for existing reservation
    const existingRes = await tx.get(
      reservationsRef
        .where('studentId', '==', studentId)
        .where('classId', '==', classId),
    );
    if (!existingRes.empty) {
      throw new Error('ALREADY_BOOKED');
    }

    // 3. Get valid credit pools (FIFO order)
    const pools = await tx.get(
      creditPoolsRef
        .where('studentId', '==', studentId)
        .where('remainingCredits', '>', 0)
        .where('expiresAt', '>', Timestamp.now())
        .orderBy('expiresAt', 'asc'),
    );
    if (pools.empty) {
      throw new Error('NO_VALID_CREDITS');
    }

    const pool = pools.docs[0];

    // 4. Decrement credits
    tx.update(pool.ref, {
      remainingCredits: FieldValue.increment(-1),
    });

    // 5. Increment class enrollment
    tx.update(classRef, {
      enrolledCount: FieldValue.increment(1),
    });

    // 6. Create confirmed reservation
    tx.create(newReservationRef, {
      studentId,
      classId,
      status: 'paid',
      paymentMode: 'credits',
      creditPoolId: pool.id,
      createdAt: Timestamp.now(),
      paidAt: Timestamp.now(),
    });

    return { success: true, reservationId: newReservationRef.id };
  });
}
```

---

## Cloud Function Requirements (Production)

### Function Specifications

#### bookWithCredits()

**Authentication:** Required  
**Role:** Student

**Input:**

```typescript
{
  classId: string;
}
```

**Validation:**

- Class is active
- Capacity available
- Valid credit pool exists (`remainingCredits > 0`, `expiresAt > now`)

**Transaction:**

1. Decrement `remainingCredits` from earliest expiring pool
2. Increment `enrolledCount` on class
3. Create reservation (`paymentMode = 'credit'`, `status = 'paid'`)

**Output:**

```typescript
{
  success: boolean;
  reservationId: string;
}
```

#### createPackageSession()

**Authentication:** Required  
**Role:** Student

**Input:**

```typescript
{
  packageId: string;
}
```

**Validation:**

- Package exists
- Package is active

**Action:**

1. Create Stripe Checkout session
2. Include `packageId` and `studentId` in metadata

**Output:**

```typescript
{
  checkoutUrl: string;
}
```

#### cancelReservation()

**Authentication:** Required  
**Role:** Student (own reservations) or Admin

**Input:**

```typescript
{
  reservationId: string;
}
```

**Validation:**

- Reservation exists and belongs to student
- Within cancellation window (policy-defined)

**Transaction:**

- Restore 1 credit to original `creditPoolId`
- Set `reservation.status = 'cancelled'`
- Decrement `enrolledCount` on class

### Stripe Integration

| Requirement                  | Implementation                                         |
| ---------------------------- | ------------------------------------------------------ |
| Webhook signature validation | **MANDATORY** - Use `stripe.webhooks.constructEvent()` |
| Idempotency                  | Check if pool already created before processing        |
| Event types to handle        | `checkout.session.completed`                           |

### stripeWebhook() Handler

```typescript
// PSEUDOCODE — handles package purchases only
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Validate signature (MANDATORY)
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send('Invalid signature');
  }

  // 2. Handle package purchase
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const packageId = session.metadata.packageId;
    const studentId = session.metadata.studentId;

    const packageDoc = await packagesRef.doc(packageId).get();
    const pkg = packageDoc.data();

    // Create credit pool
    const poolRef = await creditPoolsRef.add({
      studentId,
      totalCredits: pkg.credits,
      remainingCredits: pkg.credits,
      expiresAt: Timestamp.fromMillis(
        Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000,
      ),
      packageId,
      createdAt: Timestamp.now(),
    });

    // Create payment record
    await paymentsRef.add({
      studentId,
      amount: session.amount_total,
      type: 'package',
      stripePaymentIntentId: session.payment_intent,
      creditPoolId: poolRef.id,
      createdAt: Timestamp.now(),
    });
  }

  res.json({ received: true });
});
```

---

## Credit System Rules

### FIFO Consumption

Credits **MUST** be consumed in First-In-First-Out order based on expiration:

```
Pool A: 3 credits, expires Feb 20 ← Use first
Pool B: 5 credits, expires Mar 15 ← Use second
Pool C: 2 credits, expires Apr 01 ← Use last
```

### Expiration Handling

- Expiration checked **server-side only**
- Query filter: `expiresAt > Timestamp.now()`
- Cron job recommended for marking expired pools
- Expired credits are non-recoverable
- Pool expires same day: Must compare timestamps, not date-only

### Credit Purchase Flow

```
1. Student navigates to /packages
2. Selects a package (1/4/8/14 credits)
3. Stripe checkout session created
4. Client redirected to Stripe
5. Stripe webhook received
6. Cloud Function creates creditPool with expiration
7. Credits become available for booking
```

### Partial Pool Usage

- `remainingCredits` is decremented individually per booking
- Multiple pools may exist with partial balances
- Always consume from earliest expiring pool first

---

## Error Codes

| Code                          | Meaning                                  | Client Action             |
| ----------------------------- | ---------------------------------------- | ------------------------- |
| `CLASS_FULL`                  | No seats available                       | Show "class full" message |
| `ALREADY_BOOKED`              | Student already has reservation          | Show existing reservation |
| `NO_VALID_CREDITS`            | No unexpired credits with balance        | Redirect to /packages     |
| `CREDITS_EXPIRED`             | Selected pool expired during transaction | Retry with fresh query    |
| `PAYMENT_REQUIRED`            | Package payment not confirmed            | Redirect to Stripe        |
| `INVALID_PAYMENT_MODE`        | Unknown payment mode                     | Bug - log and alert       |
| `CANCELLATION_WINDOW_EXPIRED` | Past allowed cancellation time           | Show policy message       |
| `POOL_EXPIRED`                | Credit pool expired during restore       | Policy decision required  |

---

## Testing Requirements

### Unit Tests Must Verify

- [ ] Credit decrement respects `remainingCredits >= 0`
- [ ] FIFO ordering of credit consumption
- [ ] Duplicate reservation prevention
- [ ] Capacity enforcement
- [ ] Expiration validation

### Integration Tests Must Verify

- [ ] Concurrent booking attempts (race conditions)
- [ ] Stripe webhook signature validation
- [ ] Transaction rollback on failure
- [ ] End-to-end credit booking flow
- [ ] Package purchase → credit pool creation

### Load Tests (Target: 500+ students)

- [ ] 50 concurrent booking attempts for same class
- [ ] Credit consumption under contention
- [ ] Webhook processing throughput

---

## Common Pitfalls to Avoid

### ❌ DO NOT

```typescript
// BAD: Client-side credit check
const credits = await getCreditsFromClient();
if (credits > 0) {
  book();
}

// BAD: Non-transactional decrement
await updateDoc(poolRef, { remainingCredits: pool.remainingCredits - 1 });

// BAD: Trusting client for availability
const isAvailable = req.body.seatsAvailable; // NEVER

// BAD: Direct status update from client
await updateDoc(resRef, { status: 'paid' }); // FORBIDDEN
```

### ✅ DO

```typescript
// GOOD: Server-side validation in transaction
await runTransaction(async (tx) => {
  const pool = await tx.get(poolRef);
  if (pool.data().remainingCredits < 1) throw new Error('NO_CREDITS');
  if (pool.data().expiresAt < Timestamp.now()) throw new Error('EXPIRED');
  tx.update(poolRef, { remainingCredits: FieldValue.increment(-1) });
});

// GOOD: Webhook-confirmed payments only
if (event.type === 'checkout.session.completed') {
  await createCreditPool(
    session.metadata.packageId,
    session.metadata.studentId,
  );
}
```

---

## Implementation Checklist

When implementing any booking-related feature, verify:

- [ ] All credit operations use transactions
- [ ] Capacity checks are server-side and transactional
- [ ] FIFO credit consumption is enforced
- [ ] No client can directly modify `remainingCredits`
- [ ] No client can set `reservation.status = 'paid'`
- [ ] Stripe webhooks validate signatures
- [ ] Duplicate reservations are prevented
- [ ] Expiration is validated server-side
- [ ] Error handling returns appropriate codes
- [ ] Audit logging for sensitive operations

---

## Architecture Decision Records

### ADR-001: Denormalized Enrollment Counter

**Decision:** Use `enrolledCount` on Class document instead of counting reservations.  
**Rationale:** Faster reads, simpler capacity checks.  
**Trade-off:** Must maintain consistency via transactions.

### ADR-002: Credit Pool per Purchase

**Decision:** Each package purchase creates a new `creditPool` document.  
**Rationale:** Enables per-purchase expiration, cleaner FIFO logic.  
**Trade-off:** More documents to query.

### ADR-003: Credit-Only Pricing Model

**Decision:** Classes have no individual price. All bookings consume 1 credit from a pre-purchased package.  
**Rationale:** Simplifies booking flow, encourages package purchases, enables flexible pricing via package tiers.  
**Trade-off:** Students must purchase at least 1 credit before reserving.

### ADR-004: Mock Data Layer

**Decision:** Use in-memory mock data with simulated async delays instead of Firebase during development.  
**Rationale:** Enables frontend development without backend dependencies. Easy to swap for Firebase later.  
**Trade-off:** No persistence, no multi-user state.

### ADR-005: No Authentication (MVP)

**Decision:** Defer authentication to a future phase. All data assumes a single hardcoded student.  
**Rationale:** Faster iteration on UI/UX. Auth can be layered on top without restructuring.  
**Trade-off:** Cannot distinguish users; mock studentId used throughout.

---

## Business Rules

### Booking Priority

- If student has valid credits: show "Use 1 Credit to Reserve" button
- If no credits: show "Get Credits to Reserve" linking to packages page
- Server validates credit availability (production)

### Overbooking Prevention

Reservation creation must:

1. Check `enrolledCount < capacity` in transaction
2. Check for duplicate `(studentId, classId)` reservation
3. Abort if either check fails

### Cancellation Logic

| Payment Mode | Cancellation Action                         |
| ------------ | ------------------------------------------- |
| `credit`     | Restore 1 credit to original `creditPoolId` |

**Cancellation Rules:**

- Must be within cancellation window
- Must be transaction-safe
- Decrement `enrolledCount` on class

### Credit Restoration Edge Case

If original pool has expired when cancellation is requested:

- **Option A:** Deny credit restoration (credits lost)
- **Option B:** Create new pool with original expiration
- **Policy decision required** - document chosen approach

---

## Edge Cases

| Scenario                        | Resolution                                      |
| ------------------------------- | ----------------------------------------------- |
| Student has multiple pools      | Always consume earliest expiration first (FIFO) |
| Pool expires same day           | Compare full timestamps, not date-only          |
| Partial usage of pool           | `remainingCredits` decremented individually     |
| Refund after expiration         | Policy decision: restore credit or deny         |
| Concurrent booking attempts     | Transaction ensures only one succeeds           |
| Webhook delivered twice         | Idempotency check prevents duplicate processing |
| Package purchase during booking | Credits not available until webhook confirmed   |
| No credits when booking         | UI redirects to /packages, button disabled      |

---

## MVP Roadmap

### Phase 1: Core UI ✅

- [x] Calendar-based class browsing (week/month)
- [x] Mobile-responsive calendar and layout
- [x] Hamburger menu for mobile navigation
- [x] Class cards with enrollment/spots display
- [x] Class detail page with booking card
- [x] Credit balance display (remaining/total)
- [x] Package purchase page (4 tiers)
- [x] Reservation list page
- [x] Mock data layer

### Phase 2: Authentication & Firebase

- [ ] Firebase Auth integration
- [ ] Firestore data migration (replace mocks)
- [ ] Firestore security rules deployment
- [ ] User profile page

### Phase 3: Payments & Credits

- [ ] Stripe integration for package purchases
- [ ] Stripe webhook handler
- [ ] Credit pool creation on purchase
- [ ] Credit consumption (bookWithCredits Cloud Function)
- [ ] FIFO enforcement
- [ ] Expiration validation

### Phase 4: Advanced Features

- [ ] Cancellation with credit restore logic
- [ ] Expiration handling (scheduled function)
- [ ] Admin package dashboard
- [ ] Booking history
- [ ] Push notifications

---

## Glossary

| Term           | Definition                                                   |
| -------------- | ------------------------------------------------------------ |
| Credit Pool    | A bundle of class credits with shared expiration             |
| FIFO           | First-In-First-Out - consume earliest expiring credits first |
| Reservation    | A student's booking for a specific class                     |
| Package        | A purchasable bundle defining credits, price, and validity   |
| Capacity       | Maximum students allowed in a class                          |
| Enrolled Count | Current number of confirmed students                         |
| Validity Days  | Number of days until credits expire (30/60/90)               |
| Credit Balance | Aggregated remaining/total from all active pools             |
| Mock Data      | In-memory simulated data layer for development               |
