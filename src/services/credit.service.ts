import { CreditBalance, CreditPool } from '@/types';
import {
  collection,
  getDocs,
  Firestore,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp,
  doc,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

class CreditService {
  private db: Firestore;
  private collectionName = 'creditPools';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  async getCreditBalance(studentId: string): Promise<CreditPool | null> {
    const q = query(
      collection(this.db, this.collectionName),
      where('studentId', '==', studentId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const d = snapshot.docs[0];
    const data = d.data();
    console.log(data);
    return {
      ...data,
      id: d.id,
      startDate: data['startDate']?.toDate?.() ?? new Date(data['startDate']),
      expiresAt: data['expiresAt']?.toDate?.() ?? new Date(data['expiresAt']),
      createdAt: data['createdAt']?.toDate?.() ?? new Date(data['createdAt']),
    } as CreditPool;
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
      isActive: true,
    });
  }

  /// withdraws one credit of the current credit pool and returns the updated instance of the document
  async withdrawCredit(creditPoolId: string): Promise<CreditBalance> {
    const poolRef = doc(this.db, this.collectionName, creditPoolId);

    return runTransaction(this.db, async (tx) => {
      const poolDoc = await tx.get(poolRef);

      if (!poolDoc.exists()) {
        throw new Error('CREDIT_POOL_NOT_FOUND');
      }

      const data = poolDoc.data();
      const remaining: number = data['remainingCredits'] ?? 0;

      if (remaining < 1) {
        tx.update(poolRef, { isActive: false });
        throw new Error('NO_VALID_CREDITS');
      }
      tx.update(poolRef, {
        isActive: remaining > 1,
        remainingCredits: increment(-1),
      });

      return {
        remaining: remaining - 1,
        total: data['totalCredits'] ?? 0,
      } as CreditBalance;
    });
  }
}

if (!db) {
  throw new Error('Firebase is not configured. Check your .env variables.');
}

const creditService = new CreditService(db);
export default creditService;
