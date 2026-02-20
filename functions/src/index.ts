import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

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
  async (data, context) => {
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
 * Stripe webhook handler
 * Processes payment confirmations and updates reservations
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  // 1. Validate webhook signature (MANDATORY)
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  // 2. Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentType = session.metadata?.type;

    console.log(
      'Processing checkout session:',
      session.id,
      'Type:',
      paymentType,
    );

    if (paymentType === 'single_class') {
      const reservationId = session.metadata?.reservationId;
      const classId = session.metadata?.classId;
      const studentId = session.metadata?.studentId;

      if (!reservationId || !classId || !studentId) {
        console.error('Missing metadata in session:', session.id);
        res.status(400).send('Missing metadata');
        return;
      }

      try {
        // Run in transaction for atomicity
        await db.runTransaction(async (tx) => {
          const reservationRef = db
            .collection('reservations')
            .doc(reservationId);
          const classRef = db.collection('classes').doc(classId);

          const [reservationDoc, classDoc] = await Promise.all([
            tx.get(reservationRef),
            tx.get(classRef),
          ]);

          // Idempotency check - already processed
          if (
            reservationDoc.exists &&
            reservationDoc.data()?.status === 'paid'
          ) {
            console.log('Reservation already processed:', reservationId);
            return;
          }

          const classData = classDoc.data() as Class;

          // Final capacity check
          if (classData.enrolledCount >= classData.capacity) {
            console.error('Class full during webhook processing:', classId);
            // TODO: Handle refund scenario
            return;
          }

          // Update reservation to paid
          tx.update(reservationRef, {
            status: 'paid',
            paidAt: admin.firestore.Timestamp.now(),
            paymentIntentId: session.payment_intent as string,
          });

          // Increment enrollment count
          tx.update(classRef, {
            enrolledCount: admin.firestore.FieldValue.increment(1),
          });

          // Create payment record
          const paymentRef = db.collection('payments').doc();
          tx.create(paymentRef, {
            studentId,
            amount: session.amount_total,
            type: 'single_class',
            stripePaymentIntentId: session.payment_intent,
            reservationId,
            createdAt: admin.firestore.Timestamp.now(),
          });
        });

        console.log('Successfully processed reservation:', reservationId);
      } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error processing webhook');
        return;
      }
    }
  }

  res.json({ received: true });
});

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
  async (data, context) => {
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
