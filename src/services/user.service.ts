import { AppUser } from '@/types';
import {
  collection,
  getDocs,
  Firestore,
  doc,
  setDoc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

class UserService {
  private db: Firestore;
  private collectionName = 'users';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  async getAllUsers() {
    const q = await getDocs(collection(this.db, this.collectionName));
    q.forEach((user) => console.log(user));
  }

  async createStudent(uid: string, email: string, userName: string) {
    const existingUser = await this.getUserByEmail(email);
    if (!!existingUser) return null;
    await setDoc(
      doc(this.db, this.collectionName, uid),
      {
        email,
        id: uid,
        role: 'student',
        name: userName,
        createdAt: new Date(),
      },
      { merge: true },
    );
  }

  private toAppUser(data: Record<string, any>, id: string): AppUser {
    return {
      ...data,
      id,
      createdAt: data['createdAt']?.toDate?.() ?? undefined,
    } as AppUser;
  }

  async getStudent(uid: string): Promise<AppUser | null> {
    const document = doc(this.db, this.collectionName, uid);
    const userDoc = await getDoc(document);
    if (!userDoc.exists()) return null;
    const userData = userDoc.data();
    return this.toAppUser(
      {
        ...userData,
        active: userData['active'] || true,
        role: userData['role'] || 'student',
      },
      userData['uid'] ?? uid,
    );
  }

  async getInstructors(): Promise<AppUser[]> {
    const q = query(collection(this.db, 'instructors'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.toAppUser(d.data(), d.id));
  }

  async getStudents(): Promise<AppUser[]> {
    const q = query(
      collection(this.db, this.collectionName),
      where('role', '==', 'student'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.toAppUser(d.data(), d.id));
  }

  async getUserByEmail(email: string) {
    const q = query(
      collection(this.db, this.collectionName),
      where('email', '==', email),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as AppUser)[0];
  }

  async updateUserProfile(
    uid: string,
    updates: { name?: string; avatar?: string },
  ): Promise<void> {
    const ref = doc(this.db, this.collectionName, uid);
    await setDoc(ref, updates, { merge: true });
  }
}

if (!db) {
  throw new Error('Firebase is not configured. Check your .env variables.');
}

const userService = new UserService(db);
export default userService;
