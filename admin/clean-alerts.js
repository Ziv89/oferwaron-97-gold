#!/usr/bin/env node
/**
 * clean-alerts.js - delete Live Alerts that don't follow the alert format.
 *
 * A valid alert is 3 icons followed by "(text)", e.g. "🟨🟨🟨 (V5-1M)" or
 * "💥🚀💫 (V4-2H)" (same rule as functions/index.js isAlertFormat).
 * Anything else in tradingview/alerts/tvMessages is removed.
 *
 * Run from the REPO ROOT:
 *   node admin/clean-alerts.js          (dry run - only lists what would go)
 *   node admin/clean-alerts.js --delete (actually deletes)
 *
 * Uses admin/serviceAccount.json or GOOGLE_APPLICATION_CREDENTIALS,
 * like add-member.js.
 */
const { initializeApp, cert, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const KEY_PATH = path.join(__dirname, 'serviceAccount.json');
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  initializeApp({ credential: applicationDefault() });
} else if (fs.existsSync(KEY_PATH)) {
  initializeApp({ credential: cert(require(KEY_PATH)) });
} else {
  console.error(`No service account key found at ${KEY_PATH}`);
  process.exit(1);
}

// Keep in sync with functions/index.js and src/services/alertMessages.js
const ICON = String.raw`(?:\p{RI}\p{RI}|[\p{Extended_Pictographic}\p{Emoji_Presentation}][️\p{EMod}]?(?:‍\p{Extended_Pictographic}[️\p{EMod}]?)*)`;
const ALERT_FORMAT = new RegExp(String.raw`^\s*${ICON}\s*${ICON}\s*${ICON}\s*\([^()\n]*[^()\s][^()\n]*\)`, 'u');
const isAlertFormat = (text) => ALERT_FORMAT.test(String(text || ''));

(async () => {
  const doDelete = process.argv.includes('--delete');
  const db = getFirestore();
  const snap = await db.collection('tradingview').doc('alerts').collection('tvMessages').get();

  const bad = snap.docs.filter((d) => !isAlertFormat(d.get('messagecontent')));
  console.log(`${snap.size} alert(s), ${snap.size - bad.length} valid, ${bad.length} not in the format:`);
  bad.forEach((d) => console.log(`  ${d.id}  ${JSON.stringify(String(d.get('messagecontent') || '').slice(0, 80))}`));

  if (!bad.length) return;
  if (!doDelete) {
    console.log('\nDry run - nothing deleted. Run with --delete to remove them.');
    return;
  }
  const writer = db.bulkWriter();
  bad.forEach((d) => writer.delete(d.ref));
  await writer.close();
  console.log(`\nDeleted ${bad.length} alert(s).`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
