// ============================================
// AuthContext.jsx - Firebase Auth + live subscription state
//
// Visitors can self-register. A new users/{uid} document always starts
// with approval: 'pending'; only the site owner can change it to
// 'approved' or 'rejected' (Firestore Console or admin/add-member.js).
// Until approved, the person is signed in but only sees My Account.
//
// Accounts created by the owner in the Firebase Console have no
// users/{uid} document yet. ensureProfile() creates it on the first
// successful sign-in.
//
// Exposes:
//   user            Firebase Auth user object (or null)
//   profile         users/{uid} document
//   subscription    subscriptions/{uid} document
//   isActive        true when the subscription is live
//   approval        'pending' | 'approved' | 'rejected' (null when signed out)
//   isApproved      true when the owner approved this account
//   loading         true until BOTH auth and the subscription resolve
//
// IMPORTANT: isActive is a UI convenience only. The real gate is the
// Firestore security rules - never rely on this flag for anything secret.
// ============================================
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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
      approval: null,
      isApproved: false,
      loading: true,
    };
  }
  return ctx;
};

// Name / date of birth typed into the register form, picked up by ensureProfile
// when the new account's auth state fires (so only one place creates the doc).
let pendingRegistration = null;

// Create users/{uid} the first time an account signs in (or registers).
// Never touches subscriptions/{uid} - clients cannot write entitlements,
// and approval always starts as 'pending' (enforced by the rules).
const ensureProfile = async (fbUser) => {
  try {
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const reg = pendingRegistration || {};
      pendingRegistration = null;
      await setDoc(ref, {
        email: fbUser.email,
        displayName: reg.displayName || fbUser.displayName || '',
        whatsapp: '',
        dateOfBirth: reg.dateOfBirth || '',
        approval: 'pending',
        locale: 'en',
        tvUsername: '',
        tvAccessRequestedAt: null,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, { lastSeenAt: serverTimestamp() });
    }
    return true;
  } catch (err) {
    // Non-fatal: the person stays signed in, but without a profile row
    // they are treated as not approved until this succeeds.
    console.warn('Could not sync profile document');
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [dataResolved, setDataResolved] = useState(false);
  const [profileResolved, setProfileResolved] = useState(false);

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
        setProfileResolved(true);
        return;
      }

      setDataResolved(false);
      setProfileResolved(false);
      // If the doc could not be written, stop waiting for it (the account is
      // then treated as not approved)
      ensureProfile(fbUser).then((ok) => {
        if (!ok) setProfileResolved(true);
      });

      // users/{uid} - stays unresolved until the doc exists (ensureProfile
      // creates it), so approval is never guessed from a missing doc
      unsubProfile = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => {
          setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
          if (snap.exists()) setProfileResolved(true);
        },
        () => {
          setProfile(null);
          setProfileResolved(true);
        }
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

  const register = async ({ name, dateOfBirth, email, password }) => {
    pendingRegistration = { displayName: name.trim(), dateOfBirth };
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      return cred;
    } catch (err) {
      pendingRegistration = null;
      throw err;
    }
  };

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

  // Profiles created before registration existed have no approval field -
  // those were owner-provisioned members, so they count as approved.
  const approval = profile ? profile.approval || 'approved' : null;
  const isApproved = approval === 'approved';

  const value = {
    user,
    profile,
    subscription,
    expiresAt,
    isActive,
    approval,
    isApproved,
    loading: !authResolved || !dataResolved || !profileResolved,
    login,
    register,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
