import { CreditBalance, CreditPool } from '@/types';
import {
  collection,
  getDocs,
  Firestore,
  query,
  where,
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

  async getCreditBalance(studentId: string): Promise<CreditBalance> {
    const now = Timestamp.now();
    const q = query(
      collection(this.db, this.collectionName),
      where('studentId', '==', studentId),
      where('isActive', '==', true),
      where('expiresAt', '>', now),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return { remaining: 0, total: 0 };

    return snapshot.docs.reduce<CreditBalance>(
      (acc, d) => {
        const data = d.data();
        return {
          remaining: acc.remaining + (data['remainingCredits'] ?? 0),
          total: acc.total + (data['totalCredits'] ?? 0),
          expirationDate: data['expiresAt']?.toDate?.() ?? undefined,
        };
      },
      { remaining: 0, total: 0 },
    );
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

  /// Returns one credit to the current credit pool and returns the updated instance of the document
  async returnCredit(studentId: string): Promise<CreditBalance> {
    try {
      const creditPools = await this.getCreditPoolsByStudent(studentId);
      console.log(creditPools);

      const activeCreditPool = creditPools.filter(
        (p) => p.expiresAt > new Date(),
      )[0];

      let creditPoolId;
      if (!!activeCreditPool) {
        creditPoolId = activeCreditPool.id;
      }
      if (!creditPoolId) throw new Error('NO_ACTIVE_CREDITS');

      const poolRef = doc(this.db, this.collectionName, creditPoolId);

      return runTransaction(this.db, async (tx) => {
        const poolDoc = await tx.get(poolRef);

        if (!poolDoc.exists()) {
          throw new Error('CREDIT_POOL_NOT_FOUND');
        }
        const data = poolDoc.data();

        tx.update(poolRef, {
          isActive: true,
          remainingCredits: increment(1),
        });
        const remaining: number = data['remainingCredits'] ?? 0;

        return {
          remaining: remaining + 1,
          total: data['totalCredits'] ?? 0,
        } as CreditBalance;
      });
    } catch (err) {
      console.error(err);
      throw new Error('RETURN_CREDIT_ERROR');
    }
  }
}

if (!db) {
  throw new Error('Firebase is not configured. Check your .env variables.');
}

const creditService = new CreditService(db);
export default creditService;
