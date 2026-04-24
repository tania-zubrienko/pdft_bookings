import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Type definitions
interface Class {
  id: string;
  title: string;
  instructorId: string;
  instructorName: string;
  scheduledAt: admin.firestore.Timestamp;
  duration: number;
  capacity: number;
  enrolledCount: number;
  price: number;
  active: boolean;
}

interface Reservation {
  id: string;
  studentId: string;
  classId: string;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMode: 'single' | 'credit';
  createdAt: admin.firestore.Timestamp;
  paidAt?: admin.firestore.Timestamp;
  creditPoolId?: string;
  paymentIntentId?: string;
  stripeSessionId?: string;
}

// Error codes
const ERROR_CODES = {
  CLASS_FULL: 'CLASS_FULL',
  ALREADY_BOOKED: 'ALREADY_BOOKED',
  CLASS_NOT_FOUND: 'CLASS_NOT_FOUND',
  CLASS_INACTIVE: 'CLASS_INACTIVE',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
} as const;

/**
 * Creates a Stripe Checkout session for a single class payment
 *
 * Input: { classId: string }
 * Output: { checkoutUrl: string, reservationId: string }
 */
export const createSingleClassSession = functions.https.onCall(
  async (data, context: functions.https.CallableContext) => {
    // Authentication required
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to book a class',
      );
    }

    const { classId } = data as { classId: string };
    const studentId = context.auth.uid;
    const studentEmail = context.auth.token.email || '';

    if (!classId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Class ID is required',
      );
    }

    try {
      // Run in a transaction to ensure consistency
      const result = await db.runTransaction(async (tx) => {
        // 1. Get class document
        const classRef = db.collection('classes').doc(classId);
        const classDoc = await tx.get(classRef);

        if (!classDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Class not found', {
            code: ERROR_CODES.CLASS_NOT_FOUND,
          });
        }

        const classData = classDoc.data() as Class;

        // 2. Validate class is active
        if (!classData.active) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'This class is no longer available',
            { code: ERROR_CODES.CLASS_INACTIVE },
          );
        }

        // 3. Validate capacity
        if (classData.enrolledCount >= classData.capacity) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'This class is full',
            { code: ERROR_CODES.CLASS_FULL },
          );
        }

        // 4. Check for existing reservation
        const existingReservation = await tx.get(
          db
            .collection('reservations')
            .where('studentId', '==', studentId)
            .where('classId', '==', classId)
            .where('status', 'in', ['pending', 'paid']),
        );

        if (!existingReservation.empty) {
          throw new functions.https.HttpsError(
            'already-exists',
            'You have already booked this class',
            { code: ERROR_CODES.ALREADY_BOOKED },
          );
        }

        // 5. Create pending reservation
        const reservationRef = db.collection('reservations').doc();
        const reservation: Omit<Reservation, 'id'> = {
          studentId,
          classId,
          status: 'pending',
          paymentMode: 'single',
          createdAt: admin.firestore.Timestamp.now(),
        };

        tx.create(reservationRef, reservation);

        return {
          reservationId: reservationRef.id,
          classData,
        };
      });

      // 6. Create Stripe Checkout session (outside transaction)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: studentEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: result.classData.title,
                description: `Dance class with ${result.classData.instructorName}`,
              },
              unit_amount: result.classData.price,
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'single_class',
          reservationId: result.reservationId,
          classId,
          studentId,
        },
        success_url: `${process.env.APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/booking/cancelled`,
      });

      // 7. Update reservation with Stripe session ID
      await db.collection('reservations').doc(result.reservationId).update({
        stripeSessionId: session.id,
      });

      return {
        checkoutUrl: session.id, // Return session ID for Stripe.js
        reservationId: result.reservationId,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to create booking. Please try again.',
      );
    }
  },
);


/**
 * Scheduled function to clean up expired pending reservations
 * Runs every hour
 */
export const cleanupPendingReservations = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    const expirationTime = admin.firestore.Timestamp.fromMillis(
      Date.now() - 30 * 60 * 1000, // 30 minutes ago
    );

    const expiredReservations = await db
      .collection('reservations')
      .where('status', '==', 'pending')
      .where('createdAt', '<', expirationTime)
      .get();

    const batch = db.batch();

    expiredReservations.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'cancelled' });
    });

    await batch.commit();

    console.log(
      `Cleaned up ${expiredReservations.size} expired pending reservations`,
    );
  });

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
