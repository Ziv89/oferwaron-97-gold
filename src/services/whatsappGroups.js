import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// users/{uid}/whatsappGroups/{groupId} - private to the signed-in member
const groupsRef = (uid) => collection(db, 'users', uid, 'whatsappGroups');

// https://chat.whatsapp.com/<code>
export const WHATSAPP_INVITE_PATTERN = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}$/;

export const SCAN_STATUS = {
  pending: 'Not scanned yet',
  scanning: 'Scanning…',
  done: 'Scanned',
  failed: 'Scan failed',
};

// Live list of the member's saved groups, newest first. Returns the unsubscribe fn.
export const subscribeToGroups = (uid, onChange, onError) =>
  onSnapshot(
    query(groupsRef(uid), orderBy('createdAt', 'desc')),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );

export const addGroup = (uid, { name, inviteLink }) =>
  addDoc(groupsRef(uid), {
    name: name.trim(),
    inviteLink: inviteLink.trim(),
    status: 'pending',
    lastScannedAt: null,
    createdAt: serverTimestamp(),
  });

export const removeGroup = (uid, groupId) =>
  deleteDoc(doc(db, 'users', uid, 'whatsappGroups', groupId));

// Placeholder - the real scanner is not built yet
export const scanGroup = async () => {
  throw new Error('Group scanning is coming soon.');
};
