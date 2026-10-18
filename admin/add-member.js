#!/usr/bin/env node
/**
 * add-member.js — create a 97% Gold member in one command.
 *
 * Run from the REPO ROOT (not from inside admin/):
 *
 *   node admin/add-member.js ziv@example.com 30
 *   node admin/add-member.js ziv@example.com 30 "Ziv Shamir"
 *
 * Creates the Firebase Auth user (if new), generates a password,
 * and writes subscriptions/{uid} with the right expiry.
 * Run again on an existing email to EXTEND their subscription.
 *
 * Other commands:
 *   node admin/add-member.js --list
 *   node admin/add-member.js --pending      (TradingView access requests)
 *   node admin/add-member.js --revoke a@b.com
 *   node admin/add-member.js --reset-password a@b.com
 *
 * SETUP (once):
 *   npm install --save-dev firebase-admin
 *
 *   Firebase Console -> gear -> Project settings -> Service accounts ->
 *     Generate new private key -> save as admin/serviceAccount.json
 *
 *   Or, to keep the key outside a synced folder like OneDrive, put it
 *   anywhere and set:
 *     $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\keys\97gold.json"
 *
 *   That file bypasses every Firestore security rule you wrote.
 *   Never commit it. Never put it in src/.
 */

// Modular entry points. The root `require('firebase-admin')` namespace
// does not resolve consistently on Node 22, which is what causes
// "Cannot read properties of undefined (reading 'cert')".
const { initializeApp, cert, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ---- credentials -------------------------------------------------

const KEY_PATH = path.join(__dirname, 'serviceAccount.json');
const envKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;

let credential;
if (envKey) {
  credential = applicationDefault();
  console.log(`Using key from GOOGLE_APPLICATION_CREDENTIALS`);
} else if (fs.existsSync(KEY_PATH)) {
  credential = cert(require(KEY_PATH));
} else {
  console.error('\nNo service account key found.\n');
  console.error(`Expected: ${KEY_PATH}`);
  console.error('');
  console.error('Firebase Console -> Project settings -> Service accounts');
  console.error('  -> Generate new private key -> save it at that path.');
  console.error('');
  console.error('Add "admin/serviceAccount.json" to .gitignore FIRST.');
  process.exit(1);
}

initializeApp({ credential });

const auth = getAuth();
const db = getFirestore();

// ---- helpers -----------------------------------------------------

const genPassword = () =>
  crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, 'x');

const fmt = (d) => (d ? d.toISOString().slice(0, 10) : '—');

// ---- commands ----------------------------------------------------

async function addMember(email, days, displayName) {
  let user;
  let password = null;

  try {
    user = await auth.getUserByEmail(email);
    console.log(`Existing account found: ${email}`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    password = genPassword();
    user = await auth.createUser({
      email,
      password,
      displayName: displayName || undefined,
      emailVerified: false,
    });
    console.log(`Created account: ${email}`);
  }

  // Extend from the current expiry if still active, otherwise from today.
  const ref = db.collection('subscriptions').doc(user.uid);
  const existing = await ref.get();
  const now = new Date();

  let base = now;
  let isNew = !existing.exists;

  if (existing.exists) {
    const cur = existing.data().expiresAt?.toDate();
    if (cur && cur > now) {
      base = cur;
      console.log(`Extending from existing expiry ${fmt(cur)}`);
    }
  }

  const expiresAt = new Date(base.getTime() + days * 86400000);
  const isTrial = isNew && days <= 30;

  await ref.set(
    {
      status: isTrial ? 'trial' : 'active',
      plan: isTrial ? 'trial30' : 'monthly',
      startedAt: existing.exists
        ? existing.data().startedAt
        : Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
      source: 'manual',
      cancelledAt: null,
      notes: existing.exists ? existing.data().notes || '' : '',
    },
    { merge: true }
  );

  console.log('');
  console.log('  uid       ', user.uid);
  console.log('  email     ', email);
  if (password) console.log('  password  ', password, '  <- send this to them');
  console.log('  status    ', isTrial ? 'trial' : 'active');
  console.log('  expires   ', fmt(expiresAt), `(${days} days)`);
  console.log('');
  if (password) {
    console.log('  Sign in at /login with the above, then use');
    console.log('  "Forgot password?" so only they know the password.');
  }
  console.log('  users/{uid} appears by itself on first sign-in.');
}

async function listMembers() {
  const snap = await db.collection('subscriptions').get();
  if (snap.empty) return console.log('No subscriptions yet.');

  const now = new Date();
  const rows = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    let email = '(auth user deleted)';
    try {
      email = (await auth.getUser(doc.id)).email;
    } catch {}
    const exp = d.expiresAt?.toDate();
    rows.push({
      email,
      status: d.status,
      expires: fmt(exp),
      live: exp && exp > now ? 'yes' : 'NO',
    });
  }

  rows.sort((a, b) => a.expires.localeCompare(b.expires));
  console.table(rows);
  console.log(`${rows.filter((r) => r.live === 'yes').length} active of ${rows.length}`);
}

async function listPending() {
  const snap = await db.collection('users').get();

  const pending = snap.docs
    .map((d) => d.data())
    .filter((d) => d.tvAccessRequestedAt && d.tvUsername);

  if (!pending.length) return console.log('No TradingView access requests.');

  console.log('Add these in TradingView -> your script -> Manage Access:\n');
  pending.forEach((d) => {
    console.log(`  ${String(d.tvUsername).padEnd(24)} ${d.email}`);
  });
}

async function resetPassword(email) {
  const user = await auth.getUserByEmail(email);
  const password = genPassword();
  await auth.updateUser(user.uid, { password });

  console.log('');
  console.log('  email     ', email);
  console.log('  password  ', password, '  <- send this to them');
  console.log('');
}

async function revoke(email) {
  const user = await auth.getUserByEmail(email);
  await db.collection('subscriptions').doc(user.uid).set(
    {
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      expiresAt: Timestamp.now(),
    },
    { merge: true }
  );
  console.log(`Revoked ${email}. Their /members page updates immediately.`);
}

// ---- entry -------------------------------------------------------

(async () => {
  const [a, b, c] = process.argv.slice(2);

  try {
    if (a === '--list') await listMembers();
    else if (a === '--pending') await listPending();
    else if (a === '--revoke') {
      if (!b) throw new Error('Usage: --revoke <email>');
      await revoke(b);
    } else if (a === '--reset-password') {
      if (!b) throw new Error('Usage: --reset-password <email>');
      await resetPassword(b);
    } else if (a && a.includes('@')) {
      const days = parseInt(b, 10) || 30;
      await addMember(a, days, c);
    } else {
      console.log('Usage:');
      console.log('  node admin/add-member.js <email> [days] ["Name"]');
      console.log('  node admin/add-member.js --list');
      console.log('  node admin/add-member.js --pending');
      console.log('  node admin/add-member.js --revoke <email>');
      console.log('  node admin/add-member.js --reset-password <email>');
    }
  } catch (err) {
    console.error('\nError:', err.message);
    if (err.code === 'auth/configuration-not-found') {
      console.error('\nEnable Email/Password: Firebase Console -> Authentication');
      console.error('  -> Sign-in method -> Email/Password -> Enable');
    }
    process.exit(1);
  }
  process.exit(0);
})();
