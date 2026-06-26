import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import type { Admin } from '../types';

interface AuthContextType {
  currentUser: User | null;
  adminData: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'admins', user.uid));
          if (snap.exists()) setAdminData(snap.data() as Admin);
          else setAdminData(null);
        } catch { setAdminData(null); }
      } else { setAdminData(null); }
      setLoading(false);
    });
    return unsub;
  }, []);

  const ensureAdminDoc = async (user: User, fullName = '') => {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: fullName || user.displayName || '',
        profilePhoto: user.photoURL || '',
        currentOrgId: null,
        orgs: [],
        createdAt: new Date(),
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureAdminDoc(result.user);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await ensureAdminDoc(result.user, fullName);
  };

  const logout = async () => signOut(auth);
  const resetPassword = async (email: string) => sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider value={{
      currentUser, adminData, loading,
      signIn, signInWithGoogle, signUp, logout, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
