// ============================================
// LiveAlertNotifier.jsx - sitewide "new Live Alert" pop-ups
//
// For signed-in, approved members only. Listens to the same TradingView
// alert feed as the Live Alerts chat on the Live Trading page (/trading), and
// whenever a new alert arrives while the member is NOT looking at the chat -
// on any other page, or on /trading with Live Alerts hidden - it shows a
// WhatsApp-style toast. While the chat is open (normal or full screen) the
// alert just lands in the chat, so no toast.
// Sound (soundeffect/alertEffect.mp3, honouring the chat's mute button) is
// played here on other pages; on /trading the chat itself plays it.
// ============================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBell, FaTimes, FaUsers } from 'react-icons/fa';
import { renderAlertText } from './AlertEmoji';
import { useAuth } from '../contexts/AuthContext';
import { useStorageImage } from '../services/storageImages';
import {
  subscribeToAlerts, isAlertChatVisible, subscribeToAlertChatVisible, ALERT_SOUND_PREF_KEY,
  areAlertPopupsEnabled, subscribeToAlertPopups,
} from '../services/alertMessages';
import { useSoundEffect, ALERT_SOUND } from '../services/soundEffects';

const ALERTS_PATH = '/trading';
// Toasts close by themselves after this long
const TOAST_MS = 12000;
// Older toasts drop off when more arrive at once
const MAX_TOASTS = 3;

const soundEnabled = () => {
  try {
    return localStorage.getItem(ALERT_SOUND_PREF_KEY) !== 'off';
  } catch {
    return true;
  }
};

// Only mounted for approved members, so the Firestore listener (rules:
// approved members only) never runs for visitors
function Notifier() {
  const [toasts, setToasts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { play, unlock } = useSoundEffect(ALERT_SOUND);
  const groupAvatarUrl = useStorageImage('logos', 'SantaLogo', 0);

  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  // Browsers block sound until the visitor interacts - unlock on the first tap / key
  useEffect(() => {
    const handler = () => unlock();
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [unlock]);

  useEffect(
    () =>
      subscribeToAlerts(
        (_list, { added }) => {
          // Bell off in Live Alerts = no pop-ups (and no pop-up sound)
          if (!added.length || isAlertChatVisible() || !areAlertPopupsEnabled()) return;

          if (pathRef.current !== ALERTS_PATH && soundEnabled()) play();
          setToasts((list) => [...list, ...added].slice(-MAX_TOASTS));
          added.forEach((alert) => {
            timers.current[alert.id] = setTimeout(() => dismiss(alert.id), TOAST_MS);
          });
        },
        (err) => console.error('Live alert notifications unavailable:', err)
      ),
    [play, dismiss]
  );

  // Opening the chat shows the alerts there - clear the pop-ups
  useEffect(
    () =>
      subscribeToAlertChatVisible((visible) => {
        if (visible) setToasts([]);
      }),
    []
  );

  // Notifications switched off - clear any pop-ups still on screen
  useEffect(
    () =>
      subscribeToAlertPopups((enabled) => {
        if (!enabled) setToasts([]);
      }),
    []
  );

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  if (!toasts.length) return null;

  return (
    <div className="alert-toast-stack" role="status" aria-live="polite">
      {toasts.map((alert) => (
        <div key={alert.id} className="alert-toast">
          <button
            type="button"
            className="alert-toast-main"
            onClick={() => navigate(ALERTS_PATH, { state: { openAlerts: true } })}
            aria-label="Open Live Alerts"
          >
            {groupAvatarUrl ? (
              <img className="alert-toast-avatar" src={groupAvatarUrl} alt="" />
            ) : (
              <span className="alert-toast-avatar alert-toast-avatar--placeholder" aria-hidden="true">
                <FaUsers />
              </span>
            )}
            <span className="alert-toast-body">
              <span className="alert-toast-title">
                <FaBell aria-hidden="true" /> New Live Alert
                {/* Symbol title hidden - alert.symbol is still saved on every alert */}
                {/* {alert.symbol && <span className="alert-toast-symbol">{alert.symbol}</span>} */}
              </span>
              <span className="alert-toast-text">{renderAlertText(alert.messagecontent)}</span>
              <span className="alert-toast-cta">Tap to open Live Alerts</span>
            </span>
          </button>
          <button
            type="button"
            className="alert-toast-close"
            onClick={() => dismiss(alert.id)}
            aria-label="Dismiss alert"
          >
            <FaTimes />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function LiveAlertNotifier() {
  const { user, isApproved } = useAuth();
  return user && isApproved ? <Notifier key={user.uid} /> : null;
}
