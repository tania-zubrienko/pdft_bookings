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

- ✅ Week-based class scheduler with ClassDefinition picker
- ✅ "Duplicate to Next Week" for fast schedule planning
- ✅ Cancel/restore individual scheduled classes
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
│   │   │   ├── ClassScheduler.tsx   # Week-based class planner
│   │   │   └── AdminReservations.tsx# Reservation viewer + stats
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
│   ├── App.tsx                     # Routes (student + admin)
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

| Path                  | Component           | Description                   |
| --------------------- | ------------------- | ----------------------------- |
| `/classes`            | ClassList           | Calendar + day class list     |
| `/classes/:classId`   | ClassDetail         | Class detail + credit booking |
| `/packages`           | Packages            | Credit packages for purchase  |
| `/my-reservations`    | MyReservations      | Student reservation list      |
| `/booking/success`    | BookingResult       | Post-booking success          |
| `/booking/cancelled`  | BookingResult       | Post-booking cancelled        |
| `/admin/schedule`     | ClassScheduler      | Week-based class planner      |
| `/admin/reservations` | AdminReservations   | Reservation viewer            |
| `/admin`              | Redirect → schedule | Admin landing                 |
| `/` or `*`            | Redirect → classes  | Default/fallback              |

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

### Phase 1.5: Admin View & Data Model ✅

- [x] ClassDefinition + ScheduledClass data model
- [x] Week-based class scheduler with ClassDefinition picker
- [x] "Duplicate to Next Week" for fast planning
- [x] Cancel/restore individual scheduled classes
- [x] Instructor assignment
- [x] Reservation viewer (week/month filter + search)
- [x] Stats dashboard (total, confirmed, unique students/classes)
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

## Deployment

The project deploys to **Firebase Hosting** (frontend) and **Firebase Functions** (backend) via GitHub Actions.

### How it works

| Trigger | Action |
|---------|--------|
| Push to `main` | Builds the app, deploys Hosting to the **live** channel, deploys Functions |
| Pull request targeting `main` | Builds the app, deploys Hosting to a temporary **preview** channel (URL posted as a PR comment) |

### Required GitHub Secrets

Add these secrets in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | How to obtain |
|--------|---------------|
| `FIREBASE_SERVICE_ACCOUNT` | Run `firebase init hosting:github` in the project root, or go to **Firebase Console → Project Settings → Service accounts → Generate new private key** and paste the full JSON |
| `FIREBASE_TOKEN` | Run `firebase login:ci` locally and copy the printed token (used for Functions deployment) |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps → Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Same as above (also used as the target project for every deploy step) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `VITE_FIREBASE_APP_ID` | Same as above |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Publishable key |

### First-time setup

1. Create a Firebase project at <https://console.firebase.google.com> and note the **Project ID**.
2. Enable **Firebase Hosting** and (optionally) **Cloud Functions** in the console.
3. Copy the values from `.env.example`, fill them in, and add each as a GitHub secret (see table above).
4. Generate a service-account key and save it as the `FIREBASE_SERVICE_ACCOUNT` secret.
5. Run `firebase login:ci` locally and save the token as `FIREBASE_TOKEN`.
6. Push to `main` — the workflow will build and deploy automatically.

> **Tip:** The easiest way to configure the service account is to run  
> `firebase init hosting:github` in the repo root. It will create the  
> workflow file and add the secret to your repository automatically.

## License

MIT
