import { Reservation } from '@/types';
import {
  collection,
  getDocs,
  Firestore,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import scheduleService from './schedule.service';
import userService from './user.service';

export interface AdminReservation {
  id: string;
  studentId: string;
  studentName: string;
  scheduledClassId: string;
  classTitle: string;
  classDate: Date;
  status: 'confirmed' | 'cancelled';
  paymentMode: 'single' | 'credit';
  createdAt: Date;
}

class ReservationService {
  private db: Firestore;
  private collectionName = 'reservations';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  async getReservationsByStudent(studentId: string): Promise<Reservation[]> {
    const q = query(
      collection(this.db, this.collectionName),
      where('studentId', '==', studentId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: data['createdAt']?.toDate?.() ?? new Date(data['createdAt']),
        cancelledAt: data['cancelledAt']?.toDate?.() ?? undefined,
      } as Reservation;
    });
  }

  async getAdminReservations(): Promise<AdminReservation[]> {
    const [reservationsSnap, allClasses, allStudents] = await Promise.all([
      getDocs(collection(this.db, this.collectionName)),
      scheduleService.getAllScheduledClasses(),
      userService.getStudents(),
    ]);

    const classMap = new Map(allClasses.map((c) => [c.id, c]));
    const studentMap = new Map(allStudents.map((s) => [s.id, s]));

    return reservationsSnap.docs.map((d) => {
      const data = d.data();
      const sc = classMap.get(data['scheduledClassId']);
      const student = studentMap.get(data['studentId']);
      return {
        id: d.id,
        studentId: data['studentId'],
        studentName: student?.name ?? data['studentId'],
        scheduledClassId: data['scheduledClassId'],
        classTitle: sc?.classTitle ?? 'Desconocida',
        classDate: sc?.date ?? new Date(),
        status: data['status'],
        paymentMode: data['paymentMode'],
        createdAt: data['createdAt']?.toDate?.() ?? new Date(data['createdAt']),
      } as AdminReservation;
    });
  }
}

if (!db) {
  throw new Error('Firebase is not configured. Check your .env variables.');
}

const reservationService = new ReservationService(db);
export default reservationService;
