import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

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

/**
 * Get user's reservations
 */
export const getMyReservations = functions.https.onCall(
  async (data, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in',
      );
    }

    const studentId = context.auth.uid;

    const reservations = await db
      .collection('reservations')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return reservations.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  },
);
