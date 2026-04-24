/**
 * Generic class definition — a reusable "class type" (e.g. "Salsa Basics").
 * Path: classes/{classId}
 */
export interface ClassDefinition {
  id: string;
  title: string;
  defaultDuration: number; // minutes
  defaultCapacity: number;
  active: boolean;
}

/**
 * Scheduled class — a concrete instance planned for a specific date/time.
 * Path: scheduledClasses/{scheduledId}
 */
export interface ScheduledClass {
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

/**
 * Reservation — audit trail for bookings (separate from embedded studentIds).
 * Path: reservations/{reservationId}
 */
export interface Reservation {
  id: string;
  studentId: string;
  scheduledClassId: string; // → scheduledClasses/{id}
  status: 'confirmed' | 'cancelled';
  paymentMode: 'single' | 'credit';
  createdAt: Date;
  cancelledAt?: Date;
  creditPoolId?: string;
}

/**
 * User profile.
 * Path: users/{userId}
 */
export interface AppUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  avatar: string;
  role: 'student' | 'instructor' | 'admin'
}


/**
 * Credit pool — a bundle of credits from a package purchase.
 * Path: creditPools/{poolId}
 */
export interface CreditPool {
  id: string;
  studentId: string;
  remainingCredits: number;
  totalCredits: number;
  startDate: Date;
  expiresAt: Date;
  packageId?: string;
  createdAt: Date;
  createdBy: string;
  notes?: string;
}

/**
 * Credit balance summary (aggregated from all active pools).
 */
export interface CreditBalance {
  remaining: number;
  total: number;
}

/**
 * Package — a purchasable credit bundle.
 * Path: packages/{packageId}
 */
export interface Package {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  validityDays: number;
  active: boolean;
  description?: string;
  highlight?: boolean; // featured/recommended
}

// API Response types
export interface CreateCheckoutSessionResponse {
  checkoutUrl: string;
  reservationId: string;
}

export interface BookingError {
  code:
  | 'CLASS_FULL'
  | 'ALREADY_BOOKED'
  | 'NO_VALID_CREDITS'
  | 'PAYMENT_REQUIRED'
  | 'INVALID_PAYMENT_MODE';
  message: string;
}
