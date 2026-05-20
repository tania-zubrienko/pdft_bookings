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
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import fbService from '@/services/user.service';
import { AppUser } from '@/types';

interface AuthContextValue {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const userData = await fbService.getStudent(nextUser.uid);
          setAppUser(userData || null);
        } catch (error) {
          console.error('Failed to fetch AppUser:', error);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth no está configurado.');
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, userName: string) => {
      if (!auth) throw new Error('Firebase Auth no está configurado.');
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await fbService.createStudent(credential.user.uid, email, userName);
    },
    [],
  );

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const refreshAppUser = useCallback(async () => {
    if (!user) return;
    try {
      const userData = await fbService.getStudent(user.uid);
      setAppUser(userData || null);
    } catch (error) {
      console.error('Failed to refresh AppUser:', error);
    }
  }, [user]);

  const isAdmin = useMemo(() => appUser?.role === 'admin', [appUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      appUser,
      loading,
      isAuthenticated: !!appUser,
      isAdmin,
      login,
      signup,
      logout,
      refreshAppUser,
    }),
    [user, appUser, loading, isAdmin, login, signup, logout, refreshAppUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
