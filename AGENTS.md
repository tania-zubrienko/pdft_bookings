# AI Agent Specifications: Dance Academy Booking System

## Project Overview

A reservation and credit-based booking system for a dance academy. Students browse classes via a calendar view and reserve spots using pre-purchased credit packages. Admins manage class schedules via a week-based planner with a "duplicate previous week" strategy.

**Stack:** React + TypeScript + Vite + Tailwind CSS  
**Data Layer:** Mock data (in-memory, simulated async) — Firebase integration planned for production  
**Authentication:** Not implemented (deferred to future phase)  
**Current Scale:** ~20 students  
**Target Scale:** 500+ students with concurrent bookings

### Functional Scope

The system currently supports:

- Calendar-based class browsing (week/month view)
- Credit-based reservations (1 credit = 1 class)
- Credit balance display when reserving
- Mobile-responsive UI with hamburger menu
- No per-class pricing — all bookings use credits
- Package information display (pricing reference only, no purchases)
- Admin: week-based class scheduling with ClassDefinition picker
- Admin: "Duplicate to Next Week" for fast schedule planning
- Admin: cancel/restore individual scheduled classes
- Admin: reservation viewer with search and stats
- Admin: manual credit management — add credits to students with custom validity dates

**Note:** Payment integration is **not implemented**. Credits are manually assigned by admins to students with configurable start and expiration dates.

---

## Current Architecture

### Frontend Structure

```
src/
├── App.tsx                          # Routes (student + admin)
├── main.tsx                         # Entry (BrowserRouter, no auth)
├── index.css                        # Tailwind + custom components
├── types/index.ts                   # All TypeScript interfaces
├── lib/
│   ├── firebase.ts                  # Firebase config (unused, kept for future)
│   └── mockData.ts                  # Mock data layer (replaces Firebase)
├── components/
│   ├── Calendar/CalendarView.tsx    # Week/month calendar grid
│   ├── Classes/ClassCard.tsx        # Compact class card
│   └── Layout/
│       ├── Layout.tsx               # Student header, nav, footer, mobile menu
│       └── AdminLayout.tsx          # Admin dark-themed layout
└── pages/
    ├── admin/
    │   ├── ClassScheduler.tsx       # Week-based class planner
    │   └── AdminReservations.tsx    # Reservation viewer + stats
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

| Path                  | Component             | Description                         |
| --------------------- | --------------------- | ----------------------------------- |
| `/classes`            | ClassList             | Calendar + day class list (default) |
| `/classes/:classId`   | ClassDetail           | Class detail + booking              |
| `/packages`           | Packages              | Credit packages (reference only)    |
| `/my-reservations`    | MyReservations        | Student's reservation list          |
| `/booking/success`    | BookingResult         | Post-booking success                |
| `/booking/cancelled`  | BookingResult         | Post-booking cancelled              |
| `/admin/schedule`     | ClassScheduler        | Week-based class planner            |
| `/admin/reservations` | AdminReservations     | Reservation viewer + stats          |
| `/admin/credits`      | CreditManagement      | Manual credit assignment to students |
| `/admin`              | Redirect → schedule   | Admin landing                       |
| `/` or `*`            | Redirect → `/classes` | Default/fallback                    |

### Navigation

- **Desktop:** Horizontal nav in header (Classes, Buy Credits, My Reservations)
- **Mobile:** Hamburger menu (☰/✕ toggle) with same links in dropdown
- **Admin:** Separate dark-themed layout with Schedule / Reservations / Credits nav

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

- Credits are manually assigned by admins to students
- Each credit assignment creates a new credit pool with custom validity dates
- Admin specifies start date and expiration date for each pool
- Multiple pools can exist per student
- Stored in `creditPools` collection (mock data currently)

### Booking Flow (Credit-Based)

1. Student browses scheduled classes via calendar view
2. Clicks "Reserve" → navigates to class detail
3. Class detail shows credit balance (e.g., 5/10)
4. If credits available: "Use 1 Credit to Reserve" button
5. If no credits: "Get Credits to Reserve" → links to `/packages`
6. On booking: 1 credit deducted, reservation created as `confirmed`

### Package Display (Informational Only)

1. Student navigates to `/packages` (via "Buy Credits" nav link)
2. Views 4 package tiers with pricing and savings
3. "Buy" button shows alert (no actual purchase flow)

**Note:** Package purchases are **not implemented**. The page exists to display pricing information only. Credit pools must be created manually in mock data or via Firebase console in production.

---

## Data Models

### ClassDefinition

Path: `classes/{classId}`

A reusable "class type" (e.g. "Salsa Basics"). Admins pick from these when scheduling.

```typescript
interface ClassDefinition {
  id: string;
  title: string;
  defaultDuration: number; // minutes
  defaultCapacity: number;
  active: boolean;
}
```

**Notes:**

- Serves as a template — does not represent a scheduled event
- No `price` field — pricing is package-based only
- `defaultDuration` and `defaultCapacity` are copied to `ScheduledClass` on creation

### ScheduledClass

Path: `scheduledClasses/{scheduledId}`

A concrete class instance planned for a specific date/time.

```typescript
interface ScheduledClass {
  id: string;
  classId: string; // → classes/{classId}
  instructorId: string; // → instructors/{instructorId}
  date: Date; // specific date + time
  duration: number; // minutes
  capacity: number;
  status: 'active' | 'cancelled';

  // Denormalized for fast reads
  classTitle: string;
  instructorName: string;

  // Embedded student list (fast UI reads)
  enrolledCount: number;
  studentIds: string[];
}
```

**Notes:**

- `date` uses `Date` (will be `Timestamp` in Firestore)
- `enrolledCount` is denormalized (ADR-001)
- `studentIds` is an embedded array for fast UI reads
- `classTitle` and `instructorName` are denormalized from related documents
- `status: 'cancelled'` means the class was cancelled by admin (not individual bookings)

### Reservation

Path: `reservations/{reservationId}`

Audit trail for bookings (separate from embedded `studentIds` on ScheduledClass).

```typescript
interface Reservation {
  id: string;
  studentId: string;
  scheduledClassId: string; // → scheduledClasses/{id}
  status: 'confirmed' | 'cancelled';
  paymentMode: 'single' | 'credit';
  createdAt: Date;
  cancelledAt?: Date;
  creditPoolId?: string; // If paid with credits
}
```

**Notes:**

- `confirmed` is the only active booking state (no `pending` state)
- `paymentMode = 'single'` is reserved for future direct payment support
- `cancelledAt` is set when a reservation is cancelled

### Instructor

Path: `instructors/{instructorId}`

```typescript
interface Instructor {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  active: boolean;
}
```

### Student

Path: `students/{studentId}`

```typescript
interface Student {
  id: string;
  name: string;
  email: string;
}
```

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

### CreditPool

Path: `creditPools/{poolId}`

```typescript
interface CreditPool {
  id: string;
  studentId: string;
  remainingCredits: number;
  totalCredits: number;
  startDate: Date; // When credits become valid
  expiresAt: Date; // When credits expire
  packageId?: string; // Optional reference for display/reporting
  createdAt: Date;
  createdBy: string; // Admin who created the pool
  notes?: string; // Optional admin notes
}
```

**Rules:**

- `remainingCredits` cannot be negative
- Expired pools cannot be used
- Credits are only valid between `startDate` and `expiresAt`
- Credits are consumed FIFO (earliest expiration first)

### CreditBalance

Aggregated view (not a Firestore document):

```typescript
interface CreditBalance {
  remaining: number;
  total: number;
}
```

---

## Mock Data Layer

All data is served from `src/lib/mockData.ts` with simulated async delays (200-300ms).

### Available Mock Data

| Data             | Count | Description                                               |
| ---------------- | ----- | --------------------------------------------------------- |
| ClassDefinitions | 16    | Reusable class types (Salsa, Bachata, Stretch, etc.)      |
| Instructors      | 4     | With email, specialties, active flag                      |
| Students         | 5     | Basic profiles (name, email)                              |
| ScheduledClasses | 16    | Spread across days 0-14, various styles/times, studentIds |
| Reservations     | 11    | All confirmed, credit payment mode                        |
| Credit Pools     | 1     | 5/10 remaining, expires in 60 days                        |
| Packages         | 4     | 1/4/8/14 credits at $25/$80/$144/$224                     |

### Exported Functions

```typescript
getClassDefinitions(): Promise<ClassDefinition[]>
getScheduledClasses(): Promise<ScheduledClass[]>
getScheduledClassById(id: string): Promise<ScheduledClass | null>
getReservations(): Promise<Reservation[]>
getCreditBalance(): Promise<CreditBalance>
getPackages(): Promise<Package[]>
getInstructors(): Promise<Instructor[]>
getStudents(): Promise<Student[]>
getAdminReservations(): Promise<AdminReservation[]>
duplicateWeek(sourceClasses: ScheduledClass[], offsetWeeks: number): ScheduledClass[]
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

- Compact card: title, instructor, time, enrolled count, spots left, duration
- No price display
- Color-coded availability (green/amber/red)
- "Reserve" button → links to class detail
- "Full" state disables interaction

### ClassDetail (`pages/classes/ClassDetail.tsx`)

- Class info grid (date, time, spots, duration)
- Instructor section with avatar initial
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

### CreditManagement (`pages/admin/CreditManagement.tsx`)

- Student selector (dropdown or search)
- Credit pool creation form:
  - Number of credits to add
  - Start date picker (when credits become valid)
  - Expiration date picker
  - Optional package reference (for display/categorization)
  - Optional notes field
- List of existing credit pools for selected student
- Pool details: total/remaining, validity period, status (active/expired/future)
- Action buttons: view usage history, deactivate pool
- Summary stats: total active credits, expiring soon alerts

---

## Invariants (MUST ALWAYS HOLD)

### Critical Invariants

These conditions must **never** be violated under any circumstances:

| ID      | Invariant                                                             | Enforcement                                     |
| ------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| INV-001 | `remainingCredits >= 0`                                               | Firestore transaction with pre-check            |
| INV-002 | `enrolledCount <= capacity`                                           | Firestore transaction with pre-check            |
| INV-003 | No duplicate reservation for same `(studentId, scheduledClassId)`     | Composite unique constraint / transaction check |
| INV-004 | `reservation.status === 'confirmed'` is the ONLY active booking state | Server-side status management only              |
| INV-005 | Credits cannot be consumed after `expiresAt`                          | Server-side expiration validation               |

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

// reservations - READ for owner, CREATE with 'confirmed' only via Cloud Functions
match /reservations/{resId} {
  allow read: if request.auth.uid == resource.data.studentId;
  allow create, update, delete: if false; // Only Cloud Functions
}

// classDefinitions - Public read (authenticated), Admin write
match /classes/{classId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.admin == true;
}

// scheduledClasses - Public read (authenticated), Admin write
match /scheduledClasses/{scheduledId} {
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
        .where('scheduledClassId', '==', classId),
    );
    if (!existingRes.empty) {
      throw new Error('ALREADY_BOOKED');
    }

    // 3. Get valid credit pools (FIFO order)
    const pools = await tx.get(
      creditPoolsRef
        .where('studentId', '==', studentId)
        .where('remainingCredits', '>', 0)
        .where('startDate', '<=', Timestamp.now())
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
      scheduledClassId: classId,
      status: 'confirmed',
      paymentMode: 'credit',
      creditPoolId: pool.id,
      createdAt: Timestamp.now(),
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
3. Create reservation (`paymentMode = 'credit'`, `status = 'confirmed'`)

**Output:**

```typescript
{
  success: boolean;
  reservationId: string;
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

---

## Admin Credit Management System

**Note:** Credits are assigned manually by admins through the admin UI or directly via Firebase.

### Admin UI (Recommended)

Admins use the `/admin/credits` page to:

1. Select a student from the dropdown
2. Enter credit pool details:
   - Number of credits to assign
   - Start date (when credits become valid)
   - Expiration date
   - Optional package reference (e.g., "Monthly Pass", "Trial Credits")
   - Optional notes (e.g., "Comp for referral", "Makeup credits")
3. Submit to create credit pool
4. View and manage existing pools for each student

### Development (Mock Data)
Update `src/lib/mockData.ts` to add credit pools:
```typescript
export const mockCreditPools: CreditPool[] = [
  {
    id: 'pool_1',
    studentId: 'student_1',
    totalCredits: 10,
    remainingCredits: 5,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Expires in 60 days
    packageId: 'pkg_regular',
    createdAt: new Date(),
    createdBy: 'admin_1',
    notes: 'Monthly subscription',
  },
];
```

### Production (Firebase Console / Admin SDK)
Create credit pools via Firebase Console or Admin SDK:
```typescript
await admin.firestore().collection('creditPools').add({
  studentId: 'student_id_here',
  totalCredits: 10,
  remainingCredits: 10,
  startDate: admin.firestore.Timestamp.now(),
  expiresAt: admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  ),
  packageId: 'custom_monthly', // Optional
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: 'admin_user_id',
  notes: 'Monthly membership credits',
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

### Validity Period Handling

- Validity checked **server-side only**
- Query filters: `startDate <= Timestamp.now()` AND `expiresAt > Timestamp.now()`
- Credits are only usable within their validity window
- Cron job recommended for marking expired pools
- Expired or not-yet-started credits cannot be used
- Same-day validity: Must compare timestamps, not date-only

### Credit Provisioning (Admin-Managed)

**Note:** Credits are manually assigned by admins:

```
1. Admin navigates to /admin/credits
2. Selects student from dropdown
3. Configures credit pool:
   - Number of credits
   - Start date (when credits become active)
   - Expiration date
   - Optional: package type, notes
4. Submits form to create credit pool
5. Credits become available for booking based on start date
```

**Alternative:** Admin can create pools via Firebase Console/Admin SDK.

The `/packages` page displays pricing information for reference only.

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
| `NO_VALID_CREDITS`            | No credits within validity period        | Show "no credits" message |
| `CREDITS_EXPIRED`             | Selected pool expired during transaction | Retry with fresh query    |
| `CREDITS_NOT_YET_VALID`       | Start date is in the future              | Show "not yet active" message |
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
- [ ] Transaction rollback on failure
- [ ] End-to-end credit booking flow
- [ ] Manual credit pool creation and consumption

### Load Tests (Target: 500+ students)

- [ ] 50 concurrent booking attempts for same class
- [ ] Credit consumption under contention

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
await updateDoc(resRef, { status: 'confirmed' }); // FORBIDDEN
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

// GOOD: Admin-created credit pools
await admin.firestore().collection('creditPools').add({
  studentId,
  totalCredits: pkg.credits,
  remainingCredits: pkg.credits,
  expiresAt: expirationDate,
  packageId,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

---

## Implementation Checklist

When implementing any booking-related feature, verify:

- [ ] All credit operations use transactions
- [ ] Capacity checks are server-side and transactional
- [ ] FIFO credit consumption is enforced
- [ ] No client can directly modify `remainingCredits`
- [ ] No client can set `reservation.status = 'confirmed'`
- [ ] Duplicate reservations are prevented
- [ ] Both `startDate` and `expiresAt` are validated server-side
- [ ] Error handling returns appropriate codes
- [ ] Audit logging for sensitive operations (credit creation, admin actions)
- [ ] Admin credit management UI validates date ranges (startDate < expiresAt)
- [ ] Credit pools track `createdBy` for audit trail

---

## Architecture Decision Records

### ADR-001: Denormalized Enrollment Counter

**Decision:** Use `enrolledCount` on ScheduledClass document instead of counting reservations.  
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

### ADR-006: ClassDefinition + ScheduledClass Split

**Decision:** Separate reusable class types (`ClassDefinition`) from concrete scheduled instances (`ScheduledClass`).  
**Rationale:** Admins define class types once, then schedule them for specific dates/times. Avoids duplicating class metadata across every instance.  
**Trade-off:** Two collections to manage; `classTitle` and `instructorName` denormalized on ScheduledClass for fast reads.

### ADR-007: Duplicate-Week Scheduling Strategy

**Decision:** Admin schedules classes week-by-week with a "Duplicate to Next Week" action instead of a template-based approach.  
**Rationale:** Simpler mental model — admins see exactly what's scheduled and copy it forward. No template/instance sync issues.  
**Trade-off:** Requires manual duplication each week (but one-click operation).

### ADR-008: No Payment Integration (MVP)

**Decision:** Payment processing is **not implemented** in the current system. Credit pools must be created manually.  
**Rationale:** Focus on core booking functionality first. Payment can be added later without restructuring the data model.  
**Trade-off:** Admin must manually provision credits for students via Firebase Console or Admin SDK. The `/packages` page displays pricing information only.

### ADR-009: Admin-Managed Credit System

**Decision:** Credits are assigned manually by admins through a dedicated UI, with configurable start and expiration dates.  
**Rationale:** Provides maximum flexibility for academy operations—admins can offer trial credits, comp credits, custom validity periods, and handle special cases without code changes. Supports various business models (memberships, punch cards, promotions) through admin configuration.  
**Trade-off:** Requires admin action for every credit assignment. No self-service purchase flow. Scales to ~500 students with proper tooling but may need automation for larger operations.

---

## Business Rules

### Booking Priority

- If student has valid credits: show "Use 1 Credit to Reserve" button
- If no credits: show "Get Credits to Reserve" linking to packages page
- Server validates credit availability (production)

### Overbooking Prevention

Reservation creation must:

1. Check `enrolledCount < capacity` in transaction
2. Check for duplicate `(studentId, scheduledClassId)` reservation
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

| Scenario                    | Resolution                                      |
| --------------------------- | ----------------------------------------------- |
| Student has multiple pools  | Always consume earliest expiration first (FIFO) |
| Pool expires same day       | Compare full timestamps, not date-only          |
| Future-dated pool           | Only consume after startDate passes             |
| Partial usage of pool       | `remainingCredits` decremented individually     |
| Refund after expiration     | Policy decision: restore credit or deny         |
| Concurrent booking attempts | Transaction ensures only one succeeds           |
| No credits when booking     | UI shows "Contact admin" or admin adds credits  |
| Admin retroactive credits   | startDate can be set to past date               |

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

### Phase 1.5: Admin View & Data Model ✅

- [x] ClassDefinition + ScheduledClass data model
- [x] Week-based class scheduler with ClassDefinition picker
- [x] "Duplicate to Next Week" for fast planning
- [x] Cancel/restore individual scheduled classes
- [x] Instructor assignment via dropdown
- [x] Reservation viewer (week/month filter + search)
- [x] Stats dashboard (total, confirmed, unique students/classes)
- [x] Admin layout with dark theme

### Phase 1.75: Admin Credit Management 🔄

- [ ] Credit management page UI
- [ ] Student selector with search
- [ ] Credit pool creation form (credits, start date, expiration)
- [ ] Credit pool list view per student
- [x] Mock data functions for credit management
- [ ] Validation for date ranges and credit amounts

### Phase 2: Authentication & Firebase

- [ ] Firebase Auth integration
- [ ] Firestore data migration (replace mocks)
- [ ] Firestore security rules deployment
- [ ] User profile page
- [ ] Admin interface for manual credit pool creation

### Phase 3: Core Backend Functions

- [ ] Credit consumption (bookWithCredits Cloud Function)
- [ ] FIFO enforcement
- [ ] Expiration validation
- [ ] Transaction-based booking flow
- [ ] Admin SDK for credit pool management

### Phase 4: Advanced Features

- [ ] Cancellation with credit restore logic
- [ ] Expiration handling (scheduled function)
- [ ] Admin dashboard for credit pool management
- [ ] Booking history
- [ ] Email notifications

### Future Consideration: Payment Integration

- [ ] Stripe integration for package purchases
- [ ] Stripe webhook handler
- [ ] Automated credit pool creation on purchase
- [ ] Payment history tracking

---

## Glossary

| Term            | Definition                                                   |
| --------------- | ------------------------------------------------------------ |
| Credit Pool     | A bundle of class credits with defined validity period       |
| FIFO            | First-In-First-Out - consume earliest expiring credits first |
| Reservation     | A student's booking for a specific class                     |
| Package         | Display-only pricing reference (not purchasable)             |
| Capacity        | Maximum students allowed in a class                          |
| Enrolled Count  | Current number of confirmed students                         |
| Validity Period | Time window between startDate and expiresAt for credit pool  |
| Credit Balance  | Aggregated remaining/total from all active pools             |
| Mock Data       | In-memory simulated data layer for development               |
| ClassDefinition | A reusable class type (e.g. "Salsa Basics")                  |
| ScheduledClass  | A concrete class instance planned for a specific date/time   |
| Duplicate Week  | Admin action to copy a week's classes to the following week  |
| Start Date      | Date when credit pool becomes valid for use                  |
| Admin Credit Mgmt | Admin interface for manually assigning credits to students |
