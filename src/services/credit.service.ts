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

  private toCreditPool(docData: Record<string, any>, id: string): CreditPool {
    return {
      ...docData,
      id,
      startDate:
        docData['startDate']?.toDate?.() ?? new Date(docData['startDate']),
      expiresAt:
        docData['expiresAt']?.toDate?.() ?? new Date(docData['expiresAt']),
      createdAt:
        docData['createdAt']?.toDate?.() ?? new Date(docData['createdAt']),
    } as CreditPool;
  }

  private isPoolValidNow(pool: CreditPool, now: Date): boolean {
    return (
      pool.isActive === true &&
      pool.remainingCredits > 0 &&
      pool.startDate <= now &&
      pool.expiresAt > now
    );
  }

  private selectCurrentPool(pools: CreditPool[], now: Date): CreditPool | null {
    return (
      pools
        .filter((pool) => this.isPoolValidNow(pool, now))
        .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())[0] ??
      null
    );
  }

  async getCreditBalance(studentId: string): Promise<CreditBalance> {
    const q = query(
      collection(this.db, this.collectionName),
      where('studentId', '==', studentId),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return { remaining: 0, total: 0 };

    const pools = snapshot.docs.map((d) => this.toCreditPool(d.data(), d.id));
    const currentPool = this.selectCurrentPool(pools, new Date());

    if (!currentPool) {
      return { remaining: 0, total: 0 };
    }

    return {
      remaining: currentPool.remainingCredits,
      total: currentPool.totalCredits,
      expirationDate: currentPool.expiresAt,
    };
  }

  async getCurrentPoolByStudent(studentId: string): Promise<CreditPool | null> {
    const pools = await this.getCreditPoolsByStudent(studentId);
    return this.selectCurrentPool(pools, new Date());
  }

  async getCreditPoolsByStudent(studentId: string): Promise<CreditPool[]> {
    const q = query(
      collection(this.db, this.collectionName),
      where('studentId', '==', studentId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.toCreditPool(d.data(), d.id));
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

  async updateCreditPool(
    id: string,
    params: {
      totalCredits: number;
      remainingCredits: number;
      startDate: Date;
      expiresAt: Date;
      notes?: string;
    },
  ): Promise<void> {
    const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore');
    const poolRef = firestoreDoc(this.db, this.collectionName, id);
    await updateDoc(poolRef, {
      totalCredits: params.totalCredits,
      remainingCredits: params.remainingCredits,
      startDate: Timestamp.fromDate(params.startDate),
      expiresAt: Timestamp.fromDate(params.expiresAt),
      notes: params.notes ?? '',
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
