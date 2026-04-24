# Dance Academy Booking System

A reservation and credit-based booking system for a dance academy. Students browse classes via a calendar view and reserve spots using pre-purchased credit packages.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Data Layer:** Firestore (via typed service classes in `src/services/`)
- **Authentication:** Firebase Auth (email/password, role-based via `VITE_ADMIN_EMAILS`)
- **Functions:** Firebase Cloud Functions (prep complete, deployment pending)

## Implemented Features

### Student View

- ✅ Calendar-based class browsing (week/month toggle with navigation)
- ✅ Mobile-responsive calendar (single-letter days, dot indicators, touch-friendly)
- ✅ Compact class cards (instructor, time, enrolled/spots, location, duration)
- ✅ Class detail page with credit-based booking card
- ✅ Credit balance display (remaining/total with progress bar)
- ✅ Credit package purchase page (4 tiers: 1/4/8/14 credits)
- ✅ Reservation list page
- ✅ Booking success/cancelled feedback pages
- ✅ Mobile hamburger menu (☰/✕ toggle)
- ✅ Responsive layout (desktop nav + mobile dropdown)

### Admin View

- ✅ Week-based class scheduler with ClassDefinition picker
- ✅ "Duplicate to Next Week" for fast schedule planning
- ✅ Cancel/restore individual scheduled classes
- ✅ Instructor assignment via dropdown
- ✅ Reservation viewer (current week/month filter)
- ✅ Search reservations by student or class
- ✅ Stats dashboard (total, confirmed, unique students/classes)
- ✅ Dark-themed admin layout with mobile support
- ✅ Manual credit management (create pools with custom start/expiration dates)

## Project Structure

```
pdft_bookings/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── RouteGuards.tsx      # Protected + admin route wrappers
│   │   ├── Calendar/
│   │   │   └── CalendarView.tsx     # Week/month calendar grid
│   │   ├── Classes/
│   │   │   └── ClassCard.tsx        # Compact class card
│   │   └── Layout/
│   │       ├── Layout.tsx           # Student header, nav, footer
│   │       ├── AdminLayout.tsx      # Admin dark-themed layout
│   │       └── NavBar.tsx           # Shared nav bar
│   ├── contexts/
│   │   └── AuthContext.tsx          # Auth state: user, isAdmin, login/signup/logout
│   ├── lib/
│   │   └── firebase.ts              # Firebase config (auth, db, functions)
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── ClassScheduler.tsx   # Week-based class planner
│   │   │   ├── AdminReservations.tsx# Reservation viewer + stats
│   │   │   └── CreditManagement.tsx # Manual credit pool assignment
│   │   ├── auth/
│   │   │   └── Login.tsx            # Login / signup page
│   │   ├── booking/
│   │   │   └── BookingResult.tsx    # Success/cancelled feedback
│   │   ├── classes/
│   │   │   ├── ClassList.tsx        # Calendar + day class list
│   │   │   └── ClassDetail.tsx      # Class info + credit booking
│   │   ├── packages/
│   │   │   └── Packages.tsx         # Credit packages (display only)
│   │   └── reservations/
│   │       └── MyReservations.tsx   # Student reservation list
│   ├── services/
│   │   ├── schedule.service.ts      # ScheduledClass CRUD (Firestore)
│   │   ├── class-definition.service.ts # ClassDefinition reads
│   │   ├── user.service.ts          # User reads/writes, instructors, students
│   │   ├── credit.service.ts        # Credit balance and pools
│   │   ├── reservation.service.ts   # Reservations by student + admin view
│   │   ├── package.service.ts       # Package reads
│   │   └── callable.ts              # Firebase callable function wrappers
│   ├── types/
│   │   └── index.ts                 # All TypeScript interfaces
│   ├── App.tsx                      # Routes (student + admin)
│   └── main.tsx                     # Entry point
├── functions/
│   └── src/index.ts                 # Cloud Functions (types aligned, deployment pending)
├── AGENTS.md                        # AI agent specifications
├── CLOUD_MIGRATION.md               # Cloud Functions migration plan
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (or local emulator) with Auth and Firestore enabled

### Installation

```bash
npm install
```

### Environment setup

Create a `.env.local` file in the project root:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_EMAILS=admin@yourdomain.com
```

### Run locally

```bash
npm run dev
```

## Routes

| Path                  | Component           | Description                   |
| --------------------- | ------------------- | ----------------------------- |
| `/classes`            | ClassList           | Calendar + day class list     |
| `/classes/:classId`   | ClassDetail         | Class detail + credit booking |
| `/packages`           | Packages            | Credit packages (display only) |
| `/my-reservations`    | MyReservations      | Student reservation list      |
| `/booking/success`    | BookingResult       | Post-booking success          |
| `/booking/cancelled`  | BookingResult       | Post-booking cancelled        |
| `/admin/schedule`     | ClassScheduler      | Week-based class planner      |
| `/admin/reservations` | AdminReservations   | Reservation viewer            |
| `/admin/credits`      | CreditManagement    | Manual credit assignment      |
| `/admin`              | Redirect → schedule | Admin landing                 |
| `/` or `*`            | Redirect → classes  | Default/fallback              |


## Roadmap

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
- [x] Mock credit booking/cancellation logic

### Phase 1.5: Admin View & Data Model ✅

- [x] ClassDefinition + ScheduledClass data model
- [x] Week-based class scheduler with ClassDefinition picker
- [x] "Duplicate to Next Week" for fast planning
- [x] Cancel/restore individual scheduled classes
- [x] Instructor assignment
- [x] Reservation viewer (week/month filter + search)
- [x] Stats dashboard (total, confirmed, unique students/classes)
- [x] Admin layout with dark theme

### Phase 1.75: Admin Credit Management ✅

- [x] Credit management page UI
- [x] Student selector with search
- [x] Credit pool creation form (credits, start date, expiration)
- [x] Credit pool list view per student
- [x] Validation for date ranges and credit amounts

### Phase 2: Authentication & Firebase ✅

- [x] Firebase Auth integration
- [x] Firestore service layer (replaces mock data)
- [x] AuthContext with login/signup/logout
- [x] Route guards (protected + admin routes)
- [x] Admin credit pool creation via Firestore
- [ ] Firestore security rules deployment
- [ ] User profile page

### Phase 3: Cloud Functions & Security

- [x] Type alignment in `functions/src/index.ts`
- [ ] `bookWithCredits` Cloud Function
- [ ] `cancelReservation` Cloud Function
- [ ] `getStudentCreditBalance` Cloud Function
- [ ] `adminCreateCreditPool` Cloud Function
- [ ] Deploy Firestore security rules
- [ ] Set billing cap with auto-disable
- [ ] Restrict API key to production domain
- [ ] Enable Firebase App Check

### Phase 4: Advanced Features

- [ ] Cancellation with credit restore
- [ ] Expiration handling (scheduled function)
- [ ] Booking history
- [ ] Email notifications

## License

MIT
