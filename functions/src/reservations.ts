import * as functions from 'firebase-functions';
import { admin, checkAuthorized, checkIsAdmin, db } from './firebase';

export const getReservationsByStudent = functions.https.onCall(
  async (data, context) => {
    await checkAuthorized(context.auth);

    const { studentId } = data as { studentId?: string };

    if (!studentId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'studentId is required',
      );
    }
    const isAdmin = checkIsAdmin(context.auth);
    const isSameUser = context.auth!.uid === studentId;
    if (!isAdmin && !isSameUser) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You must have admin role to get this data',
      );
    }
    const snapshot = await db
      .collection('reservations')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  },
);

export const getMyReservations = functions.https.onCall(
  async (_data, context) => {
    await checkAuthorized(context.auth);

    const snapshot = await db
      .collection('reservations')
      .where('studentId', '==', context.auth!.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  },
);
export const createReservation = functions.https.onCall(
  async (data, context) => {
    await checkAuthorized(context.auth);

    const { scheduledClassId, paymentMode, creditPoolId } = data;

    if (!scheduledClassId || !['single', 'credit'].includes(paymentMode)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid booking details',
      );
    }

    const studentId = context.auth!.uid;
    const classRef = db.doc(`scheduledClasses/${scheduledClassId}`);
    const reservationRef = db.doc(
      `reservations/${scheduledClassId}-${studentId}`,
    );

    await db.runTransaction(async (transaction) => {
      const classDoc = await transaction.get(classRef);
      const reservationDoc = await transaction.get(reservationRef);

      if (!classDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Class not found');
      }

      if (
        reservationDoc.exists &&
        reservationDoc.data()?.status === 'confirmed'
      ) {
        throw new functions.https.HttpsError(
          'already-exists',
          'Already booked',
        );
      }

      const classData = classDoc.data()!;
      const studentIds = Array.isArray(classData.studentIds)
        ? classData.studentIds
        : [];

      if (studentIds.includes(studentId)) {
        throw new functions.https.HttpsError(
          'already-exists',
          'Student is already enrolled',
        );
      }

      if (classData.status !== 'active') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Class is not active',
        );
      }

      if (classData.enrolledCount >= classData.capacity) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Class is full',
        );
      }

      if (paymentMode === 'credit') {
        if (!creditPoolId) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'creditPoolId is required',
          );
        }

        const poolRef = db.doc(`creditPools/${creditPoolId}`);
        const poolDoc = await transaction.get(poolRef);
        const pool = poolDoc.data();
        const expiresAt = toDate(pool?.expiresAt);

        if (
          !poolDoc.exists ||
          pool?.studentId !== studentId ||
          pool.remainingCredits < 1 ||
          !expiresAt ||
          expiresAt <= new Date()
        ) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'No valid credits',
          );
        }

        transaction.update(poolRef, {
          remainingCredits: admin.firestore.FieldValue.increment(-1),
          isActive: pool.remainingCredits > 1,
        });
      }

      transaction.set(reservationRef, {
        studentId,
        scheduledClassId,
        status: 'confirmed',
        paymentMode,
        creditPoolId: creditPoolId ?? null,
        createdAt: admin.firestore.Timestamp.now(),
      });

      transaction.update(classRef, {
        enrolledCount: admin.firestore.FieldValue.increment(1),
        studentIds: admin.firestore.FieldValue.arrayUnion(studentId),
      });
    });

    return { reservationId: reservationRef.id };
  },
);

export const cancelReservation = functions.https.onCall(
  async (data, context) => {
    await checkAuthorized(context.auth);

    const { reservationId } = data as { reservationId?: string };

    if (!reservationId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'reservationId is required',
      );
    }

    const studentId = context.auth!.uid;
    const reservationRef = db.doc(`reservations/${reservationId}`);

    await db.runTransaction(async (transaction) => {
      const reservationDoc = await transaction.get(reservationRef);

      if (!reservationDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Reservation not found',
        );
      }

      const reservation = reservationDoc.data()!;

      if (reservation.studentId !== studentId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You cannot cancel this reservation',
        );
      }

      if (reservation.status !== 'confirmed') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Reservation is not active',
        );
      }

      const classRef = db.doc(
        `scheduledClasses/${reservation.scheduledClassId}`,
      );
      const classDoc = await transaction.get(classRef);

      if (!classDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Class not found');
      }

      const classData = classDoc.data()!;
      const classDate = toDate(classData.date);
      const cancellationDeadline = classDate
        ? classDate.getTime() - 12 * 60 * 60 * 1000
        : null;

      if (cancellationDeadline === null || Date.now() >= cancellationDeadline) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Cancellation window has expired',
        );
      }

      const studentIds = Array.isArray(classData.studentIds)
        ? classData.studentIds
        : [];

      if (!studentIds.includes(studentId)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Student is not enrolled in this class',
        );
      }

      let poolRef: FirebaseFirestore.DocumentReference | undefined;
      if (reservation.paymentMode === 'credit') {
        if (!reservation.creditPoolId) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Credit pool is missing from reservation',
          );
        }

        poolRef = db.doc(`creditPools/${reservation.creditPoolId}`);
        const poolDoc = await transaction.get(poolRef);
        if (!poolDoc.exists || poolDoc.data()?.studentId !== studentId) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Credit pool is invalid',
          );
        }
      }

      transaction.update(reservationRef, {
        status: 'cancelled',
        cancelledAt: admin.firestore.Timestamp.now(),
      });
      transaction.update(classRef, {
        studentIds: admin.firestore.FieldValue.arrayRemove(studentId),
        enrolledCount: Math.max(0, studentIds.length - 1),
      });

      if (poolRef) {
        transaction.update(poolRef, {
          remainingCredits: admin.firestore.FieldValue.increment(1),
          isActive: true,
        });
      }
    });

    return { reservationId };
  },
);

function toDate(value: unknown): Date | null {
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
