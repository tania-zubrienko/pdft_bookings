/**
 * Class document
 * Path: classes/{classId}
 */
export interface Class {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  scheduledAt: Date;
  duration: number; // in minutes
  capacity: number;
  enrolledCount: number;
  active: boolean;
  imageUrl?: string;
  location?: string;
}

/**
 * Reservation document
 * Path: reservations/{reservationId}
 */
export interface Reservation {
  id: string;
  studentId: string;
  classId: string;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMode: 'single' | 'credit';
  createdAt: Date;
  paidAt?: Date;
  creditPoolId?: string;
  paymentIntentId?: string;
}

/**
 * User profile
 * Path: users/{userId}
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'instructor' | 'admin';
  createdAt: Date;
  photoURL?: string;
}

/**
 * Payment record
 * Path: payments/{paymentId}
 */
export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  type: 'single_class' | 'package';
  stripePaymentIntentId: string;
  reservationId?: string;
  creditPoolId?: string;
  createdAt: Date;
}

/**
 * Credit pool
 * Path: creditPools/{poolId}
 */
export interface CreditPool {
  id: string;
  studentId: string;
  remainingCredits: number;
  totalCredits: number;
  expiresAt: Date;
  packageId: string;
  createdAt: Date;
}

/**
 * Credit balance summary (aggregated from all active pools)
 */
export interface CreditBalance {
  remaining: number;
  total: number;
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

/**
 * Package (credit bundle for purchase)
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

/**
 * Weekly class template slot — defines a recurring class at a day+time.
 * Used by admin to plan the base weekly schedule that repeats each week.
 */
export interface WeeklySlot {
  id: string;
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday
  startHour: number;
  startMinute: number;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  duration: number; // minutes
  capacity: number;
  location: string;
}

/**
 * Instructor profile
 */
export interface Instructor {
  id: string;
  name: string;
  specialties: string[];
}

/**
 * Mock student profile (for admin reservation view)
 */
export interface Student {
  id: string;
  name: string;
  email: string;
}
