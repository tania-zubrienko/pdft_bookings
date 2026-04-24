import { CreditBalance, CreditPool } from '@/types';
import {
  collection,
  getDocs,
  Firestore,
  query,
  where,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

class CreditService {
  private db: Firestore;
  private collectionName = 'creditPools';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  async getCreditBalance(studentId: string): Promise<CreditBalance> {
    const now = new Date();
    const q = query(
      collection(this.db, this.collectionName),
      where('studentId', '==', studentId),
    );
    const snapshot = await getDocs(q);

    let remaining = 0;
    let total = 0;

    snapshot.docs.forEach((d) => {
      const data = d.data();
      const startDate =
        data['startDate']?.toDate?.() ?? new Date(data['startDate']);
      const expiresAt =
        data['expiresAt']?.toDate?.() ?? new Date(data['expiresAt']);

      if (startDate <= now && expiresAt > now) {
        remaining += data['remainingCredits'] ?? 0;
        total += data['totalCredits'] ?? 0;
      }
    });

    return { remaining, total };
  }

  async getCreditPoolsByStudent(studentId: string): Promise<CreditPool[]> {
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
        startDate: data['startDate']?.toDate?.() ?? new Date(data['startDate']),
        expiresAt: data['expiresAt']?.toDate?.() ?? new Date(data['expiresAt']),
        createdAt: data['createdAt']?.toDate?.() ?? new Date(data['createdAt']),
      } as CreditPool;
    });
  }

  async createCreditPool(params: {
    studentId: string;
    credits: number;
    startDate: Date;
    expiresAt: Date;
    packageId?: string;
    notes?: string;
    createdBy: string;
  }): Promise<void> {
    await addDoc(collection(this.db, this.collectionName), {
      studentId: params.studentId,
      totalCredits: params.credits,
      remainingCredits: params.credits,
      startDate: Timestamp.fromDate(params.startDate),
      expiresAt: Timestamp.fromDate(params.expiresAt),
      packageId: params.packageId ?? null,
      notes: params.notes ?? '',
      createdBy: params.createdBy,
      createdAt: Timestamp.now(),
    });
  }
}

if (!db) {
  throw new Error('Firebase is not configured. Check your .env variables.');
}

const creditService = new CreditService(db);
export default creditService;
