import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User, UserRole } from '@/types';
import { DEMO_USERS } from '@/data/seed';
import { firebaseConfigured, demoForced } from '@/services/firebase/config';
import { getFirebaseAuth, getFirestoreDb } from '@/services/firebase/client';

const DEMO_SESSION_KEY = 'townsync.session';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  backend: 'demo' | 'firebase';
  signInDemo: (role: UserRole) => Promise<User>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    block?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const useFirebase = firebaseConfigured && !demoForced;

function readDemoSession(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { role: UserRole; userId: string };
    return DEMO_USERS.find((u) => u.id === parsed.userId) ?? null;
  } catch {
    return null;
  }
}

function writeDemoSession(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(
      DEMO_SESSION_KEY,
      JSON.stringify({ role: user.role, userId: user.id }),
    );
  } else {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- Firebase session ---------------- */
  useEffect(() => {
    if (!useFirebase) {
      setUser(readDemoSession());
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const db = getFirestoreDb();
        const ref = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUser({ id: snap.id, ...(snap.data() as Omit<User, 'id'>) });
        } else {
          const profile: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Resident',
            email: firebaseUser.email ?? '',
            role: 'resident',
            points: 0,
            joinedAt: new Date().toISOString(),
          };
          await setDoc(ref, profile);
          setUser(profile);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- Demo sign in ---------------- */
  const signInDemo = useCallback(async (role: UserRole) => {
    const demoUser = DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0];
    const copy: User = { ...demoUser, isDemo: true };
    writeDemoSession(copy);
    setUser(copy);
    return copy;
  }, []);

  const switchDemoRole = useCallback(async (role: UserRole) => {
    const demoUser = DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0];
    const copy: User = { ...demoUser, isDemo: true };
    writeDemoSession(copy);
    setUser(copy);
    return copy;
  }, []);

  /* ---------------- Firebase credentials ---------------- */
  const signIn = useCallback(async (email: string, password: string) => {
    if (!useFirebase) {
      const match = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!match) {
        throw new Error('Demo mode: use one of the seeded demo accounts below.');
      }
      const copy: User = { ...match, isDemo: true };
      writeDemoSession(copy);
      setUser(copy);
      return;
    }
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  }, []);

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      block?: string;
    }) => {
      if (!useFirebase) {
        const newUser: User = {
          id: `u_local_${Date.now().toString(36)}`,
          name: input.name,
          email: input.email.trim(),
          role: 'resident',
          points: 0,
          phone: input.phone,
          block: input.block,
          joinedAt: new Date().toISOString(),
          isDemo: true,
        };
        writeDemoSession(newUser);
        setUser(newUser);
        return;
      }
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        input.email.trim(),
        input.password,
      );
      await fbUpdateProfile(credential.user, { displayName: input.name });
      const profile: User = {
        id: credential.user.uid,
        name: input.name,
        email: input.email.trim(),
        role: 'resident',
        points: 0,
        phone: input.phone,
        block: input.block,
        joinedAt: new Date().toISOString(),
      };
      await setDoc(doc(getFirestoreDb(), 'users', credential.user.uid), profile);
      setUser(profile);
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (useFirebase) {
      await fbSignOut(getFirebaseAuth());
    }
    writeDemoSession(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        if (!useFirebase) writeDemoSession(next);
        return next;
      });
      if (useFirebase && user) {
        await setDoc(doc(getFirestoreDb(), 'users', user.id), patch, { merge: true });
      }
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemo: !useFirebase || Boolean(user?.isDemo),
      backend: useFirebase ? 'firebase' : 'demo',
      signInDemo,
      signIn,
      register,
      signOut,
      updateProfile,
      switchDemoRole,
    }),
    [user, loading, signInDemo, signIn, register, signOut, updateProfile, switchDemoRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
