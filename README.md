# Dance Academy Booking System

A reservation and credit-based booking system for a dance academy. Students browse classes via a calendar view and reserve spots using pre-purchased credit packages.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Data Layer:** Mock data (in-memory, simulated async) — Firebase integration planned
- **Authentication:** Not implemented (deferred to future phase)

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

- ✅ Weekly template editor (add/edit/delete recurring class slots)
- ✅ Monthly class generation from weekly template
- ✅ Individual class overrides (add extra, cancel, restore)
- ✅ Instructor assignment via dropdown
- ✅ Reservation viewer (current week/month filter)
- ✅ Search reservations by student or class
- ✅ Stats dashboard (total, confirmed, unique students/classes)
- ✅ Dark-themed admin layout with mobile support

## Project Structure

```
pd_bookings/
├── src/
│   ├── components/
│   │   ├── Calendar/
│   │   │   └── CalendarView.tsx     # Week/month calendar grid
│   │   ├── Classes/
│   │   │   └── ClassCard.tsx        # Compact class card
│   │   └── Layout/
│   │       ├── Layout.tsx           # Student header, nav, footer
│   │       └── AdminLayout.tsx      # Admin dark-themed layout
│   ├── lib/
│   │   ├── firebase.ts             # Firebase config (unused, kept for future)
│   │   └── mockData.ts             # Mock data layer (replaces Firebase)
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── ClassScheduler.tsx   # Template + month class planner
│   │   │   └── AdminReservations.tsx# Reservation viewer
│   │   ├── booking/
│   │   │   └── BookingResult.tsx    # Success/cancelled feedback
│   │   ├── classes/
│   │   │   ├── ClassList.tsx        # Calendar + day class list
│   │   │   └── ClassDetail.tsx      # Class info + credit booking
│   │   ├── packages/
│   │   │   └── Packages.tsx         # Credit packages (4 tiers)
│   │   └── reservations/
│   │       └── MyReservations.tsx   # Student reservation list
│   ├── types/
│   │   └── index.ts                # All TypeScript interfaces
│   ├── App.tsx                     # Routes
│   └── main.tsx                    # Entry point
├── functions/                      # Firebase Cloud Functions (future)
├── AGENTS.md                       # AI agent specifications
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
cd pd_bookings
npm install
```

### Run locally

```bash
npm run dev
```

The app runs entirely on mock data — no Firebase or Stripe setup required for development.

## Routes

| Path                  | Component           | Description                     |
| --------------------- | ------------------- | ------------------------------- |
| `/classes`            | ClassList           | Calendar + day class list       |
| `/classes/:classId`   | ClassDetail         | Class detail + credit booking   |
| `/packages`           | Packages            | Credit packages for purchase    |
| `/my-reservations`    | MyReservations      | Student reservation list        |
| `/booking/success`    | BookingResult       | Post-booking success            |
| `/booking/cancelled`  | BookingResult       | Post-booking cancelled          |
| `/admin/schedule`     | ClassScheduler      | Weekly template + month planner |
| `/admin/reservations` | AdminReservations   | Reservation viewer              |
| `/admin`              | Redirect → schedule | Admin landing                   |
| `/` or `*`            | Redirect → classes  | Default/fallback                |

## Credit System

Classes have no individual prices. All bookings consume 1 credit from a pre-purchased package.

| Package        | Credits | Price   | Per Class | Validity |
| -------------- | ------- | ------- | --------- | -------- |
| Single Class   | 1       | $25.00  | $25.00    | 30 days  |
| Starter Pack   | 4       | $80.00  | $20.00    | 30 days  |
| Regular Pack   | 8       | $144.00 | $18.00    | 60 days  |
| Unlimited Pack | 14      | $224.00 | $16.00    | 90 days  |

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

### Phase 1.5: Admin View ✅

- [x] Weekly template editor (recurring class slots)
- [x] Monthly class generation from template
- [x] Individual class overrides (add/cancel/restore)
- [x] Instructor assignment
- [x] Reservation viewer (week/month filter + search)
- [x] Admin layout with dark theme

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
- [ ] FIFO credit enforcement
- [ ] Expiration validation

### Phase 4: Advanced Features

- [ ] Cancellation with credit restore
- [ ] Expiration handling (scheduled function)
- [ ] Booking history
- [ ] Email notifications

## License

MIT
