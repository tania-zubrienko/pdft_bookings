# Optimization Plan

## Highest-Impact Findings

1. Core booking and credit invariants are still enforced on the client, not on trusted backend transactions.
   - Booking and cancellation logic lives in `src/services/reservation.service.ts:141` and `src/services/reservation.service.ts:207`.
   - Credit mutation logic also lives in client code at `src/services/credit.service.ts:116`.
   - Backend currently exposes only one callable in `functions/src/index.ts:65`.

2. There are consistency bugs and risk points in credit and reservation flow.
   - Credit is returned from inside a reservation transaction without awaiting and outside atomic boundary at `src/services/reservation.service.ts:248`.
   - Return-credit path does not restore original pool and picks first active pool at `src/services/credit.service.ts:139`.
   - Credit-balance query ignores start-date validity at `src/services/credit.service.ts:29`.
   - User ID mapping is likely incorrect in profile fetch at `src/services/user.service.ts:49`.

3. Rules and client models are not fully aligned with current domain.
   - Firestore rules still allow pending reservation creation at `firestore.rules:40` and `firestore.rules:42`, while frontend uses confirmed and cancelled.
   - Callable reservation type still uses pending/paid/cancelled in `src/services/callable.ts:13`.

4. Large page components mix data-fetching, domain logic, and UI.
   - `src/pages/admin/AdminReservations.tsx:1`
   - `src/pages/admin/ClassScheduler.tsx:1`
   - `src/pages/account/Account.tsx:1`
   - `src/pages/classes/ClassDetail.tsx:1`

5. Duplication of date and calendar logic increases drift risk.
   - `src/components/Calendar/CalendarView.tsx:21`
   - `src/pages/admin/ClassScheduler.tsx:15`
   - `src/pages/classes/ClassList.tsx:11`
   - `src/pages/admin/AdminReservations.tsx:34`
   - Existing utility is minimal at `src/utils.ts:1`.

6. Tooling baseline is incomplete for safe refactors.
   - Lint script exists in `package.json`, but there is no ESLint config (lint command fails).
   - No tests found in workspace.
   - Production build passes, but bundle is large (main chunk about 828 kB) and includes a dynamic import warning tied to `src/services/credit.service.ts:100`.

## Optimization and Refactor Plan

### 1) Stabilize Foundations (Week 1)

- Add ESLint config and enforce through CI.
- Add a basic test stack (Vitest + React Testing Library) and start with service-layer and critical flows.
- Remove debug logs and unsafe `any` usage in key paths:
  - `src/pages/account/Account.tsx:75`
  - `src/components/auth/RouteGuards.tsx:32`
  - `src/services/credit.service.ts:145`
  - `src/services/user.service.ts:24`

### 2) Move Domain-Critical Writes to Cloud Functions (Week 1-2)

- Implement `bookWithCredits`, `cancelReservation`, `getStudentCreditBalance`, and `adminCreateCreditPool` in `functions/src/index.ts:1`.
- Replace client write paths in:
  - `src/services/reservation.service.ts:141`
  - `src/services/credit.service.ts:64`
- Update callable contract in `src/services/callable.ts:1` and remove obsolete single-class payment callable.

### 3) Enforce Consistent Schema and Contracts (Week 2)

- Create single source of truth for statuses and payment modes in `src/types/index.ts:1`, then align frontend, callable DTOs, and rules.
- Fix user mapping issue in `src/services/user.service.ts:49`.
- Normalize Timestamp-to-Date conversion with shared mapper helpers used by all services.

### 4) Reorganize Code by Feature Modules (Week 2-3)

- Introduce feature folders:
  - `src/features/auth`
  - `src/features/classes`
  - `src/features/reservations`
  - `src/features/credits`
  - `src/features/admin`
- Split monolithic pages into:
  - Page container (routing + composition)
  - Feature hooks (data + mutations)
  - Presentational components
- First extraction targets:
  - `src/pages/classes/ClassDetail.tsx:1`
  - `src/pages/account/Account.tsx:1`
  - `src/pages/admin/AdminReservations.tsx:1`

### 5) Introduce Shared App Utilities and Query Layer (Week 3)

- Centralize date and locale helpers from duplicated functions into `src/utils/date`.
- Introduce React Query for server-state caching, invalidation, and deduplicated fetches.
- Replace repeated full-collection reads and in-memory joins where possible with constrained queries and paginated admin views.

### 6) Performance and Bundle Optimization (Week 3-4)

- Lazy-load route chunks for heavy pages in `src/App.tsx:28`, especially admin routes.
- Remove Firestore dynamic import pattern at `src/services/credit.service.ts:100`.
- Reassess global style token usage in `src/styles.ts:1` and reduce repeated class strings where practical.

### 7) Security and Deployment Hardening (Week 4)

- Update and deploy rules from `firestore.rules:1` to block client writes on sensitive collections.
- Ensure all sensitive mutations are callable-only.
- Add consistent audit fields for admin actions in credits and cancellation flows.

## Suggested Execution Order

1. Backend write migration and contract alignment.
2. Rules deployment.
3. Test and lint baseline.
4. Feature-folder and hook/component extraction.
5. Query caching and performance tuning.

## Expected Outcomes

- Lower risk of overbooking and credit inconsistencies.
- Faster future changes due to clearer feature boundaries.
- Smaller initial bundle and better perceived performance.
- Safer production posture with server-authoritative booking logic.
