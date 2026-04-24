import { AppUser } from '@/types';
import { collection, getDocs, Firestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

class FbService {

    private db: Firestore;

    constructor(firestore: Firestore) {
        this.db = firestore;
    }

    async getAllUsers() {
        const query = await getDocs(collection(this.db, 'users'));
        query.forEach((user) => console.log(user));
    }

    async createStudent(uid: string, email: string, userName: string) {
        await setDoc(doc(this.db, 'users', uid), {
            email,
            id: uid,
            role: 'student',
            name: userName,
            createdAt: new Date(),
        }, { merge: true });
    }

    async getStudent(uid: string): Promise<AppUser | null> {
        const document = doc(this.db, 'users', uid)
        const userDoc = await getDoc(document);
        if (!userDoc.exists()) return null;
        const userData = userDoc.data();
        return {
            id: userData['uid'],
            name: userData['name'],
            email: userData['email'],
            active: userData['active'] || true,
            avatar: userData['avatar'],
            role: userData['role'] || 'student'
        } as AppUser;

    }
}

if (!db) {
    throw new Error('Firebase is not configured. Check your .env variables.');
}

const fbService = new FbService(db);
export default fbService;