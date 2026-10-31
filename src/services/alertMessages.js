import { collection, doc, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from './firebase';

// siteData/adminData - chat settings set by hand in the Firebase Console
// (groupName = Live Alerts chat title). siteData is public-read, so only
// non-secret display settings belong here. Live, so a rename shows at once.
//   onChange({ groupName, ... }) - {} if the doc doesn't exist
// Returns the unsubscribe fn.
export const subscribeToChatSettings = (onChange, onError) =>
  onSnapshot(
    doc(db, 'siteData', 'adminData'),
    (snap) => onChange(snap.exists() ? snap.data() : {}),
    onError
  );

// tradingview/alerts/tvMessages/{id} - TradingView alerts written by the
// tvAlertMessage Cloud Function. Read-gated by Firestore rules to approved members.
const MAX_ALERTS = 50;

// How long an alert stays in the chat - keep in step with ALERT_TTL_HOURS
// in functions/index.js (which sets expireAt).
export const ALERT_TTL_HOURS = 12;
const ALERT_TTL_MS = ALERT_TTL_HOURS * 60 * 60 * 1000;

// The TTL policy may delete a doc up to ~24h after expireAt, so callers
// should hide expired ones with this (re-checked as time passes). Also
// expired once older than ALERT_TTL_HOURS, so alerts saved with a longer
// expireAt (before the TTL was shortened) disappear on time too.
export const isAlertExpired = (alert, now = Date.now()) =>
  Boolean(
    (alert.expireAt && alert.expireAt.toMillis() <= now) ||
    (alert.date?.toMillis && alert.date.toMillis() + ALERT_TTL_MS <= now)
  );

const dateOf = (a) => (a.date?.toMillis ? a.date.toMillis() : 0);

// Live list of the newest alerts, newest first. Firestore pushes every
// add / edit / delete in tvMessages, so the list mirrors the collection on
// its own - no polling.
//   onChange(alerts, changes) where changes (all empty on the initial load):
//     added    alerts that arrived since the first snapshot (e.g. play a sound)
//     modified alerts whose content changed (e.g. show "Edited")
//     removed  alerts that were deleted (not expired by the TTL, and not
//              just pushed out of the newest MAX_ALERTS by a new one)
// Returns the unsubscribe fn.
export const subscribeToAlerts = (onChange, onError) => {
  let newestSeen = null; // millis of the newest alert so far; null until first snapshot

  return onSnapshot(
    query(
      collection(db, 'tradingview', 'alerts', 'tvMessages'),
      orderBy('date', 'desc'),
      limit(MAX_ALERTS)
    ),
    (snap) => {
      const alerts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const changes = { added: [], modified: [], removed: [] };

      if (newestSeen !== null) {
        const oldestKept = alerts.length ? dateOf(alerts[alerts.length - 1]) : 0;
        const listFull = alerts.length >= MAX_ALERTS;

        snap.docChanges().forEach((c) => {
          const alert = { id: c.doc.id, ...c.doc.data() };
          if (c.type === 'added') {
            // Newer than anything seen before - not an older alert sliding
            // back into the top MAX_ALERTS after one is deleted
            if (dateOf(alert) > newestSeen) changes.added.push(alert);
          } else if (c.type === 'modified') {
            changes.modified.push(alert);
          } else if (!isAlertExpired(alert) && !(listFull && dateOf(alert) <= oldestKept)) {
            changes.removed.push(alert);
          }
        });
      }

      newestSeen = Math.max(newestSeen ?? 0, ...alerts.map(dateOf));
      onChange(alerts, changes);
    },
    onError
  );
};
