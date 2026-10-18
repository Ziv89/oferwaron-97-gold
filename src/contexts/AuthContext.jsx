// ============================================
// AuthContext.jsx - Firebase Auth + live subscription state
//
// NO SELF-REGISTRATION. Accounts are created by the site owner in the
// Firebase Console (Authentication -> Add user). This file only signs
// people in and reads their entitlement.
//
// Because the account is created in the Console, there is no
// users/{uid} document yet. ensureProfile() creates it on the first
// successful sign-in.
//
// Exposes:
//   user            Firebase Auth user object (or null)
//   profile         users/{uid} document
//   subscription    subscriptions/{uid} document
//   isActive        true when the subscription is live
//   loading         true until BOTH auth and the subscription resolve
//
// IMPORTANT: isActive is a UI convenience only. The real gate is the
// Firestore security rules - never rely on this flag for anything secret.
// ============================================
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      profile: null,
      subscription: null,
      isActive: false,
      loading: true,
    };
  }
  return ctx;
};

// Create users/{uid} the first time an owner-provisioned account signs in.
// Never touches subscriptions/{uid} - clients cannot write entitlements.
const ensureProfile = async (fbUser) => {
  try {
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        email: fbUser.email,
        displayName: fbUser.displayName || '',
        whatsapp: '',
        locale: 'en',
        tvUsername: '',
        tvAccessRequestedAt: null,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, { lastSeenAt: serverTimestamp() });
    }
  } catch (err) {
    // Non-fatal: the member can still use the site, they just will not
    // have a profile row until this succeeds.
    console.warn('Could not sync profile document');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [dataResolved, setDataResolved] = useState(false);

  useEffect(() => {
    let unsubProfile = () => {};
    let unsubSub = () => {};

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      unsubProfile();
      unsubSub();

      setUser(fbUser);
      setAuthResolved(true);

      if (!fbUser) {
        setProfile(null);
        setSubscription(null);
        setDataResolved(true);
        return;
      }

      setDataResolved(false);
      ensureProfile(fbUser);

      // users/{uid}
      unsubProfile = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null),
        () => setProfile(null)
      );

      // subscriptions/{uid} - created by the owner, read-only here
      unsubSub = onSnapshot(
        doc(db, 'subscriptions', fbUser.uid),
        (snap) => {
          setSubscription(snap.exists() ? { id: snap.id, ...snap.data() } : null);
          setDataResolved(true);
        },
        () => {
          setSubscription(null);
          setDataResolved(true);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubProfile();
      unsubSub();
    };
  }, []);

  // ---- actions -------------------------------------------------

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email.trim(), password);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

  const logout = () => signOut(auth);

  // ---- derived -------------------------------------------------

  const expiresAt = subscription?.expiresAt?.toDate
    ? subscription.expiresAt.toDate()
    : null;

  const isActive = Boolean(
    expiresAt &&
      expiresAt > new Date() &&
      ['trial', 'active'].includes(subscription?.status)
  );

  const value = {
    user,
    profile,
    subscription,
    expiresAt,
    isActive,
    loading: !authResolved || !dataResolved,
    login,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
