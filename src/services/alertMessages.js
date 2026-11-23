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

// Weekly market close - siteData/tradingTiming in Firestore:
//   tradingEnd   = market closes (Sunday 00:00 Israel)
//   tradingStart = market opens again (Monday 01:00 Israel)
// The rollTradingTiming Cloud Function moves both a week ahead once the
// market has opened. Live, so a change in the console shows at once.
// onChange gets { end, start } in millis, or null if the doc is missing / incomplete.
export const subscribeToTradingTiming = (onChange, onError) =>
  onSnapshot(
    doc(db, 'siteData', 'tradingTiming'),
    (snap) => {
      const end = snap.get('tradingEnd')?.toMillis?.();
      const start = snap.get('tradingStart')?.toMillis?.();
      onChange(end && start ? { end, start } : null);
    },
    onError
  );

// Market closed right now: tradingEnd <= now < tradingStart
export const isMarketClosed = (timing, now = Date.now()) =>
  Boolean(timing && now >= timing.end && now < timing.start);

// "Monday 01:00" (Israel time)
const israelWeekdayTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: ALERT_TIME_ZONE, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
export const formatMarketOpen = (ms) => israelWeekdayTime.format(ms).replace(',', '').replace(' at ', ' ');

const israelClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: ALERT_TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

// Current time in Israel as { h, m, s } (24-hour)
export const israelTime = (now = Date.now()) => {
  const [h, m, s] = israelClock.format(now).split(':').map(Number);
  return { h, m, s };
};


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

// Alert format: includes 3 icons (any emoji) and "(text)", with any other text
// around them, e.g. "🟨🟨🟨 (V5-1M)" or "LONG 🟨🟨🟨 (V5-1M) | text".
// The Cloud Function doesn't save anything else; hide any left over.
// Keep in sync with functions/index.js and admin/clean-alerts.js.
const ALERT_ICON = String.raw`(?:\p{RI}\p{RI}|[\p{Extended_Pictographic}\p{Emoji_Presentation}][️\p{EMod}]?(?:‍\p{Extended_Pictographic}[️\p{EMod}]?)*)`;
const ALERT_ICONS = new RegExp(ALERT_ICON, 'gu');
const ALERT_PARENS = /\([^()\n]*[^()\s][^()\n]*\)/;
const isAlertFormat = (value) => {
  const text = String(value || '');
  return (text.match(ALERT_ICONS) || []).length >= 3 && ALERT_PARENS.test(text);
};

export const isProperAlert = (alert) =>
  isAlertFormat(alert.messagecontent) && !UNFILLED_PLACEHOLDER.test(alert.messagecontent);

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
