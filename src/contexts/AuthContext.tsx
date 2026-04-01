import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
            setUser(nextUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        if (!auth) throw new Error('Firebase Auth no está configurado.');
        await signInWithEmailAndPassword(auth, email, password);
    }, []);

    const signup = useCallback(async (email: string, password: string) => {
        if (!auth) throw new Error('Firebase Auth no está configurado.');
        await createUserWithEmailAndPassword(auth, email, password);
    }, []);

    const logout = useCallback(async () => {
        if (!auth) return;
        await signOut(auth);
    }, []);

    const isAdmin = useMemo(() => {
        const email = user?.email?.toLowerCase();
        console.log('email', email, 'adminEmails', adminEmails)
        if (!email) return false;

        return adminEmails.includes(email);
    }, [user]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            isAuthenticated: !!user,
            isAdmin,
            login,
            signup,
            logout,
        }),
        [user, loading, isAdmin, login, signup, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return ctx;
}
