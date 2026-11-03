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

// localStorage key for the Live Alerts sound on / off toggle - shared by the
// chat on /trading and the sitewide new-alert notifier ('off' = muted)
export const ALERT_SOUND_PREF_KEY = 'liveAlertsSound';

// Sitewide new-alert pop-ups (LiveAlertNotifier) on / off - toggled by the
// bell button next to the mute button in Live Alerts. Off = no pop-ups and no
// pop-up sound on other pages; the chat itself still gets every alert.
const ALERT_POPUPS_PREF_KEY = 'liveAlertsPopups';
const popupListeners = new Set();
// In-memory copy, so the choice also holds where localStorage is blocked
let popupsEnabled = null;

export const areAlertPopupsEnabled = () => {
  if (popupsEnabled !== null) return popupsEnabled;
  try {
    return localStorage.getItem(ALERT_POPUPS_PREF_KEY) !== 'off';
  } catch {
    return true;
  }
};

export const setAlertPopupsEnabled = (enabled) => {
  popupsEnabled = enabled;
  try {
    localStorage.setItem(ALERT_POPUPS_PREF_KEY, enabled ? 'on' : 'off');
  } catch {
    /* private mode - the choice lasts until the page reloads */
  }
  popupListeners.forEach((fn) => fn(enabled));
};

// onChange(enabled) whenever the bell is toggled. Returns the unsubscribe fn.
export const subscribeToAlertPopups = (onChange) => {
  popupListeners.add(onChange);
  return () => popupListeners.delete(onChange);
};

// Whether the member is looking at the Live Alerts chat right now (open on
// /trading, normal or full screen). Set by the chat, read by the sitewide
// notifier: pop-ups only show while the chat is NOT on screen.
let alertChatVisible = false;
const visibilityListeners = new Set();

export const setAlertChatVisible = (visible) => {
  alertChatVisible = visible;
  visibilityListeners.forEach((fn) => fn(visible));
};
export const isAlertChatVisible = () => alertChatVisible;

// onChange(visible) whenever the chat is opened / hidden. Returns the unsubscribe fn.
export const subscribeToAlertChatVisible = (onChange) => {
  visibilityListeners.add(onChange);
  return () => visibilityListeners.delete(onChange);
};

// tradingview/alerts/tvMessages/{id} - TradingView alerts written by the
// tvAlertMessage Cloud Function. Read-gated by Firestore rules to approved members.
const MAX_ALERTS = 50;

// Alerts last until the end of the day they were sent: at 00:00 Israel time
// the deleteDailyAlerts Cloud Function (functions/index.js) removes them all,
// e.g. an alert from 01:00 or 22:00 is gone at the start of the next day.
export const ALERT_TIME_ZONE = 'Asia/Jerusalem';
const israelDay = new Intl.DateTimeFormat('en-CA', { timeZone: ALERT_TIME_ZONE });

// The scheduled delete may take a moment, so callers should hide expired
// ones with this (re-checked as time passes): expired once it is no longer
// the alert's day in Israel, or past its expireAt (older alerts were saved
// with expireAt = +12h).
export const isAlertExpired = (alert, now = Date.now()) =>
  Boolean(
    (alert.expireAt && alert.expireAt.toMillis() <= now) ||
    (alert.date?.toMillis && israelDay.format(alert.date.toMillis()) !== israelDay.format(now))
  );

// An unfilled TradingView placeholder ("{{strategy.order.alert_message}}")
// is not a real alert - the Cloud Function refuses them; hide any left over
const UNFILLED_PLACEHOLDER = /\{\{[^{}]*\}\}/;
export const isProperAlert = (alert) =>
  Boolean(String(alert.messagecontent || '').trim()) && !UNFILLED_PLACEHOLDER.test(alert.messagecontent);

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
      const alerts = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(isProperAlert);
      const changes = { added: [], modified: [], removed: [] };

      if (newestSeen !== null) {
        const oldestKept = alerts.length ? dateOf(alerts[alerts.length - 1]) : 0;
        const listFull = alerts.length >= MAX_ALERTS;

        snap.docChanges().forEach((c) => {
          const alert = { id: c.doc.id, ...c.doc.data() };
          if (!isProperAlert(alert)) return;
          if (c.type === 'added') {
        
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
