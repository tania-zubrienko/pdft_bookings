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
  sendPasswordResetEmail,
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
  isVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
      await sendEmailVerification(credential.user);
      await fbService.createStudent(credential.user.uid, email, userName);
      await signOut(auth); // Sign out until email is verified
    },
    [],
  );

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const resendVerificationEmail = useCallback(
    async (email: string, password: string) => {
      if (!auth) throw new Error('Firebase Auth no está configurado.');
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (credential.user.emailVerified) {
        await signOut(auth);
        throw new Error('EMAIL_ALREADY_VERIFIED');
      }
      await sendEmailVerification(credential.user);
      await signOut(auth);
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) throw new Error('Firebase Auth no está configurado.');
    await sendPasswordResetEmail(auth, email);
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
  const isVerified = useMemo(() => user?.emailVerified ?? false, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      appUser,
      loading,
      isAuthenticated: !!appUser && (user?.emailVerified ?? false),
      isAdmin,
      isVerified,
      login,
      signup,
      logout,
      refreshAppUser,
      resendVerificationEmail,
      resetPassword,
    }),
    [
      user,
      appUser,
      loading,
      isAdmin,
      isVerified,
      login,
      signup,
      logout,
      refreshAppUser,
      resendVerificationEmail,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
