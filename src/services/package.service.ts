import { Package } from '@/types';
import { collection, getDocs, Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';

class PackageService {
  private db: Firestore;
  private collectionName = 'packages';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  async getAllPackages(): Promise<Package[]> {
    const snapshot = await getDocs(collection(this.db, this.collectionName));
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Package);
  }
}

if (!db) {
  throw new Error('Firebase is not configured. Check your .env variables.');
}

const packageService = new PackageService(db);
export default packageService;
