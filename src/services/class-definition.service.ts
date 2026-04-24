import { ClassDefinition } from '@/types';
import { collection, getDocs, Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';

class ClassDefinitionService {
  private db: Firestore;
  private collectionName = 'classes';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  async getAllClassDefinitions(): Promise<ClassDefinition[]> {
    const snapshot = await getDocs(collection(this.db, this.collectionName));
    return snapshot.docs.map(
      (d) => ({ ...d.data(), id: d.id }) as ClassDefinition,
    );
  }
}

if (!db) {
  throw new Error('Firebase is not configured. Check your .env variables.');
}

const classDefinitionService = new ClassDefinitionService(db);
export default classDefinitionService;
