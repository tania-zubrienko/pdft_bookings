import {
  Reservation,
  ReservationStatus,
  ReservationWithClass,
  ScheduledClass,
} from '@/types';
import {
  collection,
  getDocs,
  Firestore,
  query,
  where,
  doc,
  runTransaction,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import scheduleService from './schedule.service';
import userService from './user.service';
import { User } from 'firebase/auth';
import creditService from './credit.service';

export interface AdminReservation {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  scheduledClassId: string;
  classTitle: string;
  classDate: Date;
  status: ReservationStatus;
  paymentMode: 'single' | 'credit';
  createdAt: Date;
}

class ReservationService {
  private db: Firestore;
  private collectionName = 'reservations';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  /** Returns all reservations for a given student, ordered as Firestore returns them.
   * Converts Firestore Timestamps to JS Date objects.
   * Returns an empty array if the student has no reservations or a fetch error occurs. */
  async getReservationsByStudent(studentId: string): Promise<Reservation[]> {
    try {
      const q = query(
        collection(this.db, this.collectionName),
        where('studentId', '==', studentId),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];
      const results: Reservation[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        if (
          !data['studentId'] ||
          !data['scheduledClassId'] ||
          !data['status'] ||
          !data['paymentMode'] ||
          !data['createdAt']
        ) {
          console.warn(`Skipping malformed reservation doc: ${d.id}`);
          continue;
        }
        results.push({
          ...data,
          id: d.id,
          createdAt:
            data['createdAt']?.toDate?.() ?? new Date(data['createdAt']),
          cancelledAt: data['cancelledAt']?.toDate?.() ?? undefined,
        } as Reservation);
      }
      return results;
    } catch (error) {
      console.error(
        `Failed to fetch reservations for student ${studentId}:`,
        error,
      );
      return [];
    }
  }

  /** Returns all reservations enriched with class and student data for the admin view.
   * Fetches reservations, scheduled classes, and students in parallel, then joins them
   * in memory. Falls back to raw IDs/defaults if a related document is missing.
   * Returns an empty array if there are no reservations or a fetch error occurs. */
  async getAdminReservations(): Promise<AdminReservation[]> {
    try {
      const [reservationsSnap, allClasses, allStudents] = await Promise.all([
        getDocs(collection(this.db, this.collectionName)),
        scheduleService.getAllScheduledClasses(),
        userService.getStudents(),
      ]);

      if (reservationsSnap.empty) return [];

      const classMap = new Map(allClasses.map((c) => [c.id, c]));
      const studentMap = new Map(allStudents.map((s) => [s.id, s]));

      const results: AdminReservation[] = [];
      for (const d of reservationsSnap.docs) {
        const data = d.data();
        if (
          !data['studentId'] ||
          !data['scheduledClassId'] ||
          !data['status'] ||
          !data['paymentMode'] ||
          !data['createdAt']
        ) {
          console.warn(`Skipping malformed reservation doc: ${d.id}`);
          continue;
        }
        const sc = classMap.get(data['scheduledClassId']);
        const student = studentMap.get(data['studentId']);
        results.push({
          id: d.id,
          studentId: data['studentId'],
          studentName: student?.name ?? data['studentId'],
          studentAvatar: student?.avatar,
          scheduledClassId: data['scheduledClassId'],
          classTitle: sc?.classTitle ?? 'Desconocida',
          classDate: sc?.date ?? new Date(),
          status: data['status'],
          paymentMode: data['paymentMode'],
          createdAt:
            data['createdAt']?.toDate?.() ?? new Date(data['createdAt']),
        } as AdminReservation);
      }
      return results;
    } catch (error) {
      console.error('Failed to fetch admin reservations:', error);
      return [];
    }
  }

  async createReservationForStudent(
    classData: ScheduledClass,
    user: User | null,
    creditPoolId: string | null,
    paymentType: 'single' | 'credit',
  ): Promise<boolean> {
    if (user == null || user.email == null)
      throw new Error('USER_NOT_AUTHENTICATED');

    const studentData = await userService.getUserByEmail(user.email);
    if (studentData == null) throw new Error('USER_NOT_FOUND');

    const id = `${classData.id}-${studentData.id}`;
    const reservationRef = doc(this.db, this.collectionName, id);
    const classRef = doc(this.db, 'scheduledClasses', classData.id);

    await runTransaction(this.db, async (tx) => {
      const classDoc = await tx.get(classRef);
      if (!classDoc.exists()) throw new Error('CLASS_NOT_FOUND');

      const classSnapshot = classDoc.data();
      if (classSnapshot['enrolledCount'] >= classSnapshot['capacity']) {
        throw new Error('CLASS_FULL');
      }

      const existingRes = await tx.get(reservationRef);
      if (
        existingRes.exists() &&
        existingRes.data()['status'] === ReservationStatus.Confirmed
      )
        throw new Error('ALREADY_BOOKED');

      if (paymentType === 'credit' && creditPoolId) {
        const poolRef = doc(this.db, 'creditPools', creditPoolId);
        const poolDoc = await tx.get(poolRef);
        if (!poolDoc.exists()) throw new Error('CREDIT_POOL_NOT_FOUND');
        const remaining: number = poolDoc.data()['remainingCredits'] ?? 0;
        if (remaining < 1) throw new Error('NO_VALID_CREDITS');
        tx.update(poolRef, {
          isActive: remaining > 1,
          remainingCredits: increment(-1),
        });
      }

      tx.set(reservationRef, {
        id,
        studentId: studentData.id,
        studentName: studentData.name,
        scheduledClassId: classData.id,
        classTitle: classData.classTitle,
        classDate: classData.date,
        status: ReservationStatus.Confirmed,
        paymentMode: paymentType,
        creditPoolId: creditPoolId ?? null,
        createdAt: new Date(),
      });

      tx.update(classRef, {
        enrolledCount: increment(1),
        studentIds: arrayUnion(studentData.id),
      });
    });

    return true;
  }

  async cancelReservationForStudent(
    reservation: ReservationWithClass,
  ): Promise<boolean> {
    const studentId = reservation.studentId;
    console.log(
      'student',
      studentId,
      'reservation',
      reservation.id,
      'schClass',
      reservation.scheduledClassId,
    );
    try {
      const reservationRef = doc(this.db, this.collectionName, reservation.id);
      const classRef = doc(
        this.db,
        'scheduledClasses',
        reservation.scheduledClassId,
      );

      await runTransaction(this.db, async (tx) => {
        const classDoc = await tx.get(classRef);
        if (!classDoc.exists()) throw new Error('CLASS_NOT_FOUND');

        const classSnapshot = classDoc.data();
        const enrolledStudents = classSnapshot['studentIds'] as string[];
        if (!enrolledStudents?.includes(studentId)) {
          throw new Error('NOT_ENROLLED');
        }

        const reservationDoc = await tx.get(reservationRef);
        if (!reservationDoc.exists()) throw new Error('Reservation_NOT_FOUND');

        // Delete student id from class
        tx.update(classRef, {
          studentIds: [...enrolledStudents.filter((s) => s != studentId)],
          enrolledCount: enrolledStudents.length - 1,
        });
        // Cancel reservation
        tx.update(reservationRef, { status: ReservationStatus.Cancelled });
        // Return Credit to student (if valid)
        creditService.returnCredit(studentId);
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
  /** Cancels a reservation from the admin view.
   * Marks the reservation as cancelled, decrements enrolledCount,
   * removes student from studentIds, and returns 1 credit if paymentMode is 'credit'. */
  async adminCancelReservation(
    reservationId: string,
    studentId: string,
    scheduledClassId: string,
    paymentMode: 'single' | 'credit',
  ): Promise<void> {
    const reservationRef = doc(this.db, this.collectionName, reservationId);
    const classRef = doc(this.db, 'scheduledClasses', scheduledClassId);

    await runTransaction(this.db, async (tx) => {
      const [reservationDoc, classDoc] = await Promise.all([
        tx.get(reservationRef),
        tx.get(classRef),
      ]);

      if (!reservationDoc.exists()) throw new Error('RESERVATION_NOT_FOUND');
      if (reservationDoc.data()['status'] !== ReservationStatus.Confirmed)
        throw new Error('RESERVATION_NOT_ACTIVE');
      if (!classDoc.exists()) throw new Error('CLASS_NOT_FOUND');

      tx.update(reservationRef, {
        status: ReservationStatus.Cancelled,
        cancelledAt: new Date(),
      });

      tx.update(classRef, {
        enrolledCount: increment(-1),
        studentIds: arrayRemove(studentId),
      });
    });

    // Return credit outside the transaction (follows same pattern as existing cancelReservationForStudent)
    if (paymentMode === 'credit') {
      await creditService.returnCredit(studentId);
    }
  }
}

if (!db) {
  throw new Error('Firebase is not configured. Check your .env variables.');
}

const reservationService = new ReservationService(db);
export default reservationService;
