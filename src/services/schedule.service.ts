import { ScheduledClass } from '@/types';
import {
  collection,
  getDocs,
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

class ScheduleService {
  private db: Firestore;
  private collectionName = 'scheduledClasses';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  /// Get all scheduled classes
  async getAllScheduledClasses(): Promise<ScheduledClass[]> {
    const snapshot = await getDocs(collection(this.db, this.collectionName));
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        date: data['date']?.toDate?.() ?? new Date(data['date']),
      } as ScheduledClass;
    });
  }

  /// Get a specific scheduled class by ID
  async getScheduledClassById(id: string): Promise<ScheduledClass | null> {
    const document = doc(this.db, this.collectionName, id);
    const snap = await getDoc(document);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      id: snap.id,
      date: data['date']?.toDate?.() ?? new Date(data['date']),
    } as ScheduledClass;
  }

  /// Set/Update scheduled class by ID
  async setScheduledClass(id: string, scheduledClass: Omit<ScheduledClass, 'id'>): Promise<void> {
    await setDoc(doc(this.db, this.collectionName, id), scheduledClass, { merge: true });
  }

  /// Cancel scheduled class by ID
  async cancelScheduledClass(id: string): Promise<void> {
    await updateDoc(doc(this.db, this.collectionName, id), { status: 'cancelled' });
  }

  /// Set scheduled class to 'active' by ID
  async activateScheduledClass(id: string): Promise<void> {
    await updateDoc(doc(this.db, this.collectionName, id), { status: 'active' });
  }

  /// Batch write new docs with shifted dates to duplicate week schedule
  async duplicateWeek(sourceClasses: ScheduledClass[], offsetWeeks: number): Promise<void> {
    const batch = writeBatch(this.db);
    const offsetMs = offsetWeeks * 7 * 24 * 60 * 60 * 1000;

    for (const sc of sourceClasses) {
      const newRef = doc(collection(this.db, this.collectionName));
      const newDate = new Date(sc.date.getTime() + offsetMs);

      batch.set(newRef, {
        classId: sc.classId,
        instructorId: sc.instructorId,
        date: newDate,
        duration: sc.duration,
        capacity: sc.capacity,
        status: 'active',
        classTitle: sc.classTitle,
        instructorName: sc.instructorName,
        enrolledCount: 0,
        studentIds: [],
      });
    }

    await batch.commit();
  }
}

if (!db) {
  throw new Error('Firebase is not configured. Check your .env variables.');
}

const scheduleService = new ScheduleService(db);
export default scheduleService;
