export {
  cancelReservation,
  createReservation,
  getMyReservations,
  getReservationsByStudent,
} from './reservations';
import { admin } from './firebase';

// Type definitions — aligned with src/types/index.ts

export interface ScheduledClass {
  id: string;
  classId: string; // → classes/{classId}
  instructorId: string;
  date: admin.firestore.Timestamp;
  duration: number; // minutes
  capacity: number;
  status: 'active' | 'cancelled';
  // Denormalized for fast reads
  classTitle: string;
  instructorName: string;
  // Embedded student list
  enrolledCount: number;
  studentIds: string[];
}

export interface Reservation {
  id: string;
  studentId: string;
  scheduledClassId: string; // → scheduledClasses/{id}
  status: 'confirmed' | 'cancelled';
  paymentMode: 'single' | 'credit';
  createdAt: admin.firestore.Timestamp;
  cancelledAt?: admin.firestore.Timestamp;
  creditPoolId?: string;
}

export interface CreditPool {
  id: string;
  studentId: string;
  remainingCredits: number;
  totalCredits: number;
  startDate: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  packageId?: string;
  createdAt: admin.firestore.Timestamp;
  createdBy: string;
  notes?: string;
  paymentMethod: string;
}

// Error codes
export const ERROR_CODES = {
  CLASS_FULL: 'CLASS_FULL',
  ALREADY_BOOKED: 'ALREADY_BOOKED',
  CLASS_NOT_FOUND: 'CLASS_NOT_FOUND',
  CLASS_INACTIVE: 'CLASS_INACTIVE',
  NO_VALID_CREDITS: 'NO_VALID_CREDITS',
  CREDITS_EXPIRED: 'CREDITS_EXPIRED',
  CANCELLATION_WINDOW_EXPIRED: 'CANCELLATION_WINDOW_EXPIRED',
} as const;
