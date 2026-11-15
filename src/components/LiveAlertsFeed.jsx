// ============================================
// LiveAlertsFeed.jsx - Live Alerts on the Live Trading page (/trading)
//
// The live TradingView alert feed (tradingview/alerts/tvMessages, kept
// until midnight Israel time) as a WhatsApp-style group chat with light / dark mode; new
// alerts appear live and play soundeffect/alertEffect.mp3.
// Approved members only - /trading is behind ProtectedRoute requireApproved.
// ============================================
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  FaVolumeUp, FaVolumeMute, FaBell, FaBellSlash, FaSun, FaMoon, FaExpand, FaCompress, FaClock, FaChevronDown, FaBan, FaUsers,
} from 'react-icons/fa';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useStorageImage } from '../services/storageImages';
import {
  subscribeToAlerts, subscribeToChatSettings, isAlertExpired, isNoMarketDay, msUntilIsraelMidnight, israelTime,
  ALERT_SOUND_PREF_KEY,
  setAlertChatVisible, areAlertPopupsEnabled, setAlertPopupsEnabled,
} from '../services/alertMessages';
import { useSoundEffect, ALERT_SOUND } from '../services/soundEffects';
import { renderAlertText } from './AlertEmoji';
import '../styles/auth.css';

// "14:05"
const formatAlertTime = (date) =>
  date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

// "Today" / "Yesterday" / "28 October 2026" - WhatsApp-style date separators
const formatAlertDay = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

// ============================================
// GOLD BELL - Live Alerts title icon. Sways gently now and then; when
// `ringKey` changes (a new alert arrived) it rings: big swings, the clapper
// knocks side to side and sound waves ripple out.
// ============================================
const BELL_RING_MS = 2700;

function GoldBell({ ringKey }) {
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (!ringKey) return undefined;
    setRinging(true);
    const timer = setTimeout(() => setRinging(false), BELL_RING_MS);
    return () => clearTimeout(timer);
  }, [ringKey]);

  return (
    // key restarts the animation when another alert lands mid-ring
    <span key={ringKey} className={`gold-bell${ringing ? ' gold-bell--ringing' : ''}`} aria-hidden="true">
      <span className="gold-bell-wave" />
      <span className="gold-bell-wave gold-bell-wave--late" />
      <svg className="gold-bell-svg" viewBox="0 0 64 64" width="1em" height="1em">
        <defs>
          <linearGradient id="goldBellBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff7cc" />
            <stop offset="30%" stopColor="#ffd84d" />
            <stop offset="65%" stopColor="#e0a915" />
            <stop offset="100%" stopColor="#8a6207" />
          </linearGradient>
          <linearGradient id="goldBellRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe680" />
            <stop offset="100%" stopColor="#a87a0a" />
          </linearGradient>
          <radialGradient id="goldBellClapper" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fffbe6" />
            <stop offset="55%" stopColor="#f2c230" />
            <stop offset="100%" stopColor="#8a6207" />
          </radialGradient>
        </defs>

        <g className="gold-bell-swing">
          {/* Clapper first, so it peeks out under the rim */}
          <g className="gold-bell-clapper">
            <circle cx="32" cy="53.5" r="5" fill="url(#goldBellClapper)" stroke="#7a5605" strokeWidth="0.8" />
          </g>
          {/* Hanger loop */}
          <circle cx="32" cy="8.5" r="3.6" fill="none" stroke="url(#goldBellRim)" strokeWidth="2.4" />
          {/* Body */}
          <path
            d="M32 11.5c-9.6 0-16 7.4-16 17.2v10.8c0 2.4-1.2 4.4-3.4 6.2L11 47h42l-1.6-1.3c-2.2-1.8-3.4-3.8-3.4-6.2V28.7c0-9.8-6.4-17.2-16-17.2z"
            fill="url(#goldBellBody)"
            stroke="#7a5605"
            strokeWidth="0.9"
          />
          {/* Rim */}
          <rect x="8.5" y="45" width="47" height="5" rx="2.5" fill="url(#goldBellRim)" stroke="#7a5605" strokeWidth="0.8" />
          {/* Glossy highlights */}
          <path d="M22.5 20.5c-2.4 3-3.4 6.6-3.4 10.4v7.6" fill="none" stroke="#fffdf0" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <circle cx="25" cy="17.5" r="1.6" fill="#ffffff" opacity="0.9" />
          {/* Diamond glint */}
          <path className="gold-bell-glint" d="M42 21l1.3 3.2 3.2 1.3-3.2 1.3L42 30l-1.3-3.2-3.2-1.3 3.2-1.3z" fill="#ffffff" />
        </g>
      </svg>
    </span>
  );
}

// ============================================
// MARKET CLOCK - Sunday "No market today" icon. A live gold clock showing the
// current Israel time; 12 is marked (midnight = trading resumes) and a glowing
// arc runs from the hour hand to 12, shrinking as Monday gets closer.
// ============================================
const CLOCK_C = 32;
// Point on the clock face at `deg` (0 = 12 o'clock, clockwise)
const clockPoint = (deg, r) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CLOCK_C + r * Math.cos(rad), CLOCK_C + r * Math.sin(rad)];
};

function MarketClock() {
  const [time, setTime] = useState(israelTime);

  useEffect(() => {
    const timer = setInterval(() => setTime(israelTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { h, m, s } = time;
  const hourDeg = ((h % 12) + m / 60) * 30;
  const minuteDeg = (m + s / 60) * 6;
  const secondDeg = s * 6;

  // Remaining-time arc: hour hand -> 12 (clockwise)
  const ARC_R = 25;
  const [ax, ay] = clockPoint(hourDeg, ARC_R);
  const largeArc = 360 - hourDeg > 180 ? 1 : 0;
  const arc = `M ${ax} ${ay} A ${ARC_R} ${ARC_R} 0 ${largeArc} 1 ${CLOCK_C} ${CLOCK_C - ARC_R}`;

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <svg
      className="market-clock"
      viewBox="0 0 64 64"
      width="1em"
      height="1em"
      role="img"
      aria-label={`Israel time ${pad(h)}:${pad(m)} - trading resumes at 00:00`}
    >
      <defs>
        <radialGradient id="marketClockFace" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="70%" stopColor="#ffe9a0" />
          <stop offset="100%" stopColor="#f2c230" />
        </radialGradient>
        <linearGradient id="marketClockRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1a8" />
          <stop offset="50%" stopColor="#d4a017" />
          <stop offset="100%" stopColor="#7a5605" />
        </linearGradient>
        <radialGradient id="marketClockCoinFace" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="45%" stopColor="#ffd84d" />
          <stop offset="100%" stopColor="#c99a00" />
        </radialGradient>
        <linearGradient id="marketClockCoinRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1a8" />
          <stop offset="50%" stopColor="#e0a915" />
          <stop offset="100%" stopColor="#8a6207" />
        </linearGradient>
        <radialGradient id="marketClockCoinAura">
          <stop offset="40%" stopColor="#ffd700" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="32" cy="32" r="30" fill="url(#marketClockRim)" />
      <circle cx="32" cy="32" r="27" fill="url(#marketClockFace)" />

      {/* Time left until trading resumes */}
      {hourDeg > 0 && <path className="market-clock-arc" d={arc} fill="none" />}

      {/* Hour ticks */}
      {Array.from({ length: 12 }, (_, i) => {
        if (i === 0) return null;
        const [x1, y1] = clockPoint(i * 30, 23);
        const [x2, y2] = clockPoint(i * 30, i % 3 === 0 ? 19 : 21);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6B3F00" strokeWidth={i % 3 === 0 ? 2 : 1.2} strokeLinecap="round" />;
      })}

      {/* 12 = trading resumes: a sparkling gold coin with the site's gold aura */}
      <g className="market-clock-coin">
        <circle className="market-clock-coin-aura" cx="32" cy="9.5" r="7" fill="url(#marketClockCoinAura)" />
        <circle cx="32" cy="9.5" r="4.6" fill="url(#marketClockCoinRim)" stroke="#7a5605" strokeWidth="0.6" />
        <circle cx="32" cy="9.5" r="3.3" fill="url(#marketClockCoinFace)" stroke="#a87a0a" strokeWidth="0.4" />
        <path d="M30.4 8.2a2.2 2.2 0 0 1 2.6-0.9" fill="none" stroke="#fffdf0" strokeWidth="0.8" strokeLinecap="round" opacity="0.9" />
        <path
          className="market-clock-coin-sparkle"
          d="M35.6 5.2l0.55 1.35 1.35 0.55-1.35 0.55-0.55 1.35-0.55-1.35-1.35-0.55 1.35-0.55z"
          fill="#ffffff"
        />
      </g>

      {/* Hands */}
      <line x1="32" y1="32" x2="32" y2="18" stroke="#2B1A00" strokeWidth="3.4" strokeLinecap="round"
        transform={`rotate(${hourDeg} 32 32)`} />
      <line x1="32" y1="32" x2="32" y2="12" stroke="#2B1A00" strokeWidth="2.2" strokeLinecap="round"
        transform={`rotate(${minuteDeg} 32 32)`} />
      <line x1="32" y1="36" x2="32" y2="10" stroke="#c0392b" strokeWidth="1" strokeLinecap="round"
        transform={`rotate(${secondDeg} 32 32)`} />
      <circle cx="32" cy="32" r="2.4" fill="#c0392b" stroke="#2B1A00" strokeWidth="0.8" />
    </svg>
  );
}

// ============================================
// ALERT FEED - live TradingView alerts (approved members only)
// Collapsed behind a button like Strategy Overview; opens as a WhatsApp-style
// group chat (light / dark). Listens to Firestore while the page is open, so
// new alerts arrive by themselves - with a sound (soundeffect/alertEffect.mp3
// in Storage) and a "new" badge when collapsed.
// ============================================
const SOUND_PREF_KEY = ALERT_SOUND_PREF_KEY;
const THEME_PREF_KEY = 'liveAlertsTheme';
// Chat title until / unless siteData/adminData has a groupName
const DEFAULT_GROUP_NAME = 'Live Alerts';
const EXPIRY_RECHECK_MS = 60 * 1000;
const NEW_HIGHLIGHT_MS = 6000;
// Within this many px of the bottom counts as "reading the latest"
const STICK_TO_BOTTOM_PX = 80;

const initialChatTheme = () =>
  localStorage.getItem(THEME_PREF_KEY) ||
  (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export default function LiveAlertsFeed() {
  // Opened from a new-alert pop-up (LiveAlertNotifier) - start with the chat open
  const location = useLocation();
  const [open, setOpen] = useState(() => Boolean(location.state?.openAlerts));
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unseen, setUnseen] = useState(0);
  // Bumped on every new alert - rings the title bell
  const [bellRing, setBellRing] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [highlighted, setHighlighted] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_PREF_KEY) !== 'off');
  const [chatTheme, setChatTheme] = useState(initialChatTheme);
  // Sitewide new-alert pop-ups (LiveAlertNotifier) on / off
  const [popupsOn, setPopupsOn] = useState(areAlertPopupsEnabled);
  const [showJump, setShowJump] = useState(false);
  const [editedIds, setEditedIds] = useState([]);
  const [deletedAlerts, setDeletedAlerts] = useState([]);
  const [groupName, setGroupName] = useState(DEFAULT_GROUP_NAME);
  // const [soundTest, setSoundTest] = useState(null); // 'played' | 'not-loaded' | 'blocked'

  const { play, unlock } = useSoundEffect(ALERT_SOUND);
  // Group picture: logos/SantaLogo.jpeg in Firebase Storage
  const groupAvatarUrl = useStorageImage('logos', 'SantaLogo', 0);
  const openRef = useRef(open);
  const soundOnRef = useRef(soundOn);
  openRef.current = open;
  soundOnRef.current = soundOn;

  const chatRef = useRef(null);
  const atBottomRef = useRef(true);
  const justOpenedRef = useRef(open);

  // Tell the sitewide notifier whether the chat is on screen: while it is open
  // (normal or full screen) alerts show here directly, with no pop-up
  useEffect(() => {
    setAlertChatVisible(open);
    return () => setAlertChatVisible(false);
  }, [open]);

  // A pop-up tapped while already on this page (chat hidden) - open the chat
  useEffect(() => {
    if (!location.state?.openAlerts) return;
    justOpenedRef.current = true;
    atBottomRef.current = true;
    setOpen(true);
    setUnseen(0);
  }, [location.key, location.state]);

  // Briefly glow these bubbles (new or edited)
  const flash = useCallback((ids) => {
    setHighlighted((prev) => [...prev, ...ids]);
    setTimeout(() => setHighlighted((prev) => prev.filter((id) => !ids.includes(id))), NEW_HIGHLIGHT_MS);
  }, []);

  // Live subscription - mirrors tvMessages: every add / edit / delete shows
  // up in the chat as it happens, no polling
  useEffect(
    () =>
      subscribeToAlerts(
        (list, { added, modified, removed }) => {
          setAlerts(list);
          setLoading(false);
          setError('');
          setNow(Date.now());

          if (modified.length) {
            const ids = modified.map((a) => a.id);
            setEditedIds((prev) => [...new Set([...prev, ...ids])]);
            flash(ids);
          }
          if (removed.length) {
            // Keep a "This alert was deleted" placeholder where it was, like WhatsApp
            setDeletedAlerts((prev) => [
              ...prev.filter((d) => !removed.some((r) => r.id === d.id)),
              ...removed,
            ]);
          }
          // A deleted alert that comes back (e.g. restored) is no longer deleted
          setDeletedAlerts((prev) => prev.filter((d) => !list.some((a) => a.id === d.id)));

          if (added.length) {
            setBellRing((n) => n + 1);
            if (soundOnRef.current) play();
            if (!openRef.current) setUnseen((n) => n + added.length);
            flash(added.map((a) => a.id));
          }
        },
        () => {
          setError('Could not load alerts. Please refresh the page.');
          setLoading(false);
        }
      ),
    [play, flash]
  );

  // Group title - groupName on siteData/adminData, live so a rename shows at once
  useEffect(
    () =>
      subscribeToChatSettings(
        (info) => setGroupName(info.groupName || DEFAULT_GROUP_NAME),
        () => setGroupName(DEFAULT_GROUP_NAME)
      ),
    []
  );

  // Yesterday's alerts drop off the chat at midnight on their own while the page stays open
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), EXPIRY_RECHECK_MS);
    return () => clearInterval(timer);
  }, []);

  // Re-render exactly at midnight (Israel), so the Sunday "No market today"
  // notice appears / disappears the moment the day changes. Re-armed each day.
  const [dayTick, setDayTick] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
      setDayTick((n) => n + 1);
    }, msUntilIsraelMidnight());
    return () => clearTimeout(timer);
  }, [dayTick]);

  // Sunday in Israel - no trading, so no alerts
  const noMarket = isNoMarketDay(now);

  // Live alerts + deleted placeholders, oldest first, newest at the bottom - like a chat
  const messages = [...alerts, ...deletedAlerts.map((a) => ({ ...a, deleted: true }))]
    .filter((a) => !isAlertExpired(a, now) && a.date?.toDate)
    .map((a) => ({ ...a, when: a.date.toDate(), edited: !a.deleted && editedIds.includes(a.id) }))
    .sort((a, b) => a.when - b.when);
  const latestId = messages.length ? messages[messages.length - 1].id : null;

  // Follow new messages while the reader is at the bottom; otherwise offer a jump button
  useLayoutEffect(() => {
    const el = chatRef.current;
    if (!open || !el) return;
    if (justOpenedRef.current || atBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: justOpenedRef.current ? 'auto' : 'smooth' });
      justOpenedRef.current = false;
      setShowJump(false);
    } else {
      setShowJump(true);
    }
  }, [open, fullscreen, latestId, loading]);

  const handleChatScroll = () => {
    const el = chatRef.current;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_TO_BOTTOM_PX;
    if (atBottomRef.current) setShowJump(false);
  };

  const jumpToLatest = () => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  };

  const toggleOpen = () => {
    unlock();
    if (!open) {
      justOpenedRef.current = true;
      atBottomRef.current = true;
    }
    setOpen((o) => !o);
    setFullscreen(false);
    setUnseen(0);
  };

  // Full screen: the chat fills the window with bigger text. The panel is
  // re-mounted in a portal, so jump back to the latest alert after switching.
  const toggleFullscreen = useCallback(() => {
    justOpenedRef.current = true;
    atBottomRef.current = true;
    setFullscreen((f) => !f);
  }, []);

  // Esc leaves full screen; the page behind doesn't scroll meanwhile
  useEffect(() => {
    if (!fullscreen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') toggleFullscreen();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [fullscreen, toggleFullscreen]);

  const toggleSound = () => {
    unlock();
    setSoundOn((on) => {
      localStorage.setItem(SOUND_PREF_KEY, on ? 'off' : 'on');
      return !on;
    });
  };

  // // Plays the alert sound on demand (even when muted) and says whether it worked
  // const soundTestTimer = useRef(null);
  // const testSound = async () => {
  //   const result = await play();
  //   setSoundTest(result);
  //   clearTimeout(soundTestTimer.current);
  //   soundTestTimer.current = setTimeout(() => setSoundTest(null), SOUND_TEST_MSG_MS);
  // };
  // useEffect(() => () => clearTimeout(soundTestTimer.current), []);

  const togglePopups = () => {
    setAlertPopupsEnabled(!popupsOn);
    setPopupsOn(!popupsOn);
  };

  const toggleChatTheme = () => {
    setChatTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_PREF_KEY, next);
      return next;
    });
  };

  const chatPanel = (
    <div
      id="vip-alert-panel"
      className={`vip-alert-panel wa-chat wa-chat--${chatTheme}${fullscreen ? ' wa-chat--fullscreen' : ''}`}
      role={fullscreen ? 'dialog' : undefined}
      aria-modal={fullscreen || undefined}
      aria-label={fullscreen ? 'Live Alerts full screen' : undefined}
    >
      {/* Chat header - like a WhatsApp group */}
      <div className="wa-chat-header">
        {groupAvatarUrl ? (
          <img className="wa-chat-avatar" src={groupAvatarUrl} alt="" />
        ) : (
          <span className="wa-chat-avatar wa-chat-avatar--placeholder" aria-hidden="true"><FaUsers /></span>
        )}
        <div className="wa-chat-heading">
          {/* groupName on siteData/adminData in Firestore */}
          <strong>{groupName}</strong>
        </div>
        <button
          type="button"
          className="wa-chat-icon-btn"
          onClick={toggleChatTheme}
          aria-label={chatTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={chatTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {chatTheme === 'dark' ? <FaSun /> : <FaMoon />}
        </button>
        {/* Sound toggle in the chat too - the card's one is hidden behind full screen */}
        {fullscreen && (
          <button
            type="button"
            className="wa-chat-icon-btn"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Mute alert sound' : 'Unmute alert sound'}
            title={soundOn ? 'Sound on' : 'Sound off'}
          >
            {soundOn ? <FaVolumeUp /> : <FaVolumeMute />}
          </button>
        )}
        <button
          type="button"
          className="wa-chat-icon-btn wa-chat-fullscreen-btn"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
          title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
        >
          {fullscreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>

      <div className="wa-chat-body" ref={chatRef} onScroll={handleChatScroll} aria-live="polite">
        <div className="wa-chat-system">
          <FaClock /> Messages disappear at midnight (00:00)
        </div>

        {error ? (
          <div className="wa-chat-system wa-chat-system--error">{error}</div>
        ) : loading ? (
          <div className="wa-chat-system">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="wa-chat-system">
            {noMarket ? 'No market today - trading resumes at 00:00' : 'No alerts today'}
          </div>
        ) : (
          messages.map((msg, i) => {
            const day = formatAlertDay(msg.when);
            const newDay = i === 0 || formatAlertDay(messages[i - 1].when) !== day;
            return (
              <React.Fragment key={msg.id}>
                {newDay && <div className="wa-chat-date">{day}</div>}
                <div
                  className={[
                    'wa-bubble',
                    newDay && 'wa-bubble--tail',
                    msg.deleted && 'wa-bubble--deleted',
                    highlighted.includes(msg.id) && 'is-new',
                  ].filter(Boolean).join(' ')}
                >
                  {/* Symbol title hidden - msg.symbol is still saved on every alert */}
                  {/* <span className="wa-bubble-sender">{msg.symbol || 'TradingView'}</span> */}
                  {msg.deleted ? (
                    <p className="wa-bubble-text">
                      <FaBan aria-hidden="true" /> This alert was deleted
                    </p>
                  ) : (
                    <p className="wa-bubble-text">{renderAlertText(msg.messagecontent)}</p>
                  )}
                  <span className="wa-bubble-meta">
                    {msg.edited && <span className="wa-bubble-edited">Edited</span>}
                    <time dateTime={msg.when.toISOString()}>{formatAlertTime(msg.when)}</time>
                  </span>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {showJump && (
        <button type="button" className="wa-chat-jump" onClick={jumpToLatest} aria-label="Jump to latest alert">
          <FaChevronDown />
        </button>
      )}
    </div>
  );

  return (
    <section className="strategy-section">
      <div className="strategy-principle-card vip-card">
        <div className="vip-card-header">
          <h2 className="strategy-card-title vip-card-title">
            <GoldBell ringKey={bellRing} /> Live Alerts
            <span className="vip-alert-live-dot" aria-hidden="true" />
          </h2>
          <div className="vip-alert-controls">
            <button
              type="button"
              className="strategy-btn vip-sound-btn"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? 'Mute alert sound' : 'Unmute alert sound'}
              title={soundOn ? 'Sound on' : 'Sound off'}
            >
              {soundOn ? <FaVolumeUp /> : <FaVolumeMute />}
            </button>
            {/* Pop-up notifications on other pages - the chat still gets every alert */}
            <button
              type="button"
              className="strategy-btn vip-notify-btn"
              onClick={togglePopups}
              aria-pressed={popupsOn}
              aria-label={popupsOn ? 'Stop alert notifications' : 'Turn on alert notifications'}
              title={popupsOn ? 'Notifications on' : 'Notifications off'}
            >
              {popupsOn ? <FaBell /> : <FaBellSlash />}
            </button>
            {/* <button
              type="button"
              className="strategy-btn vip-sound-btn"
              onClick={testSound}
              aria-label="Test alert sound"
              title="Test sound"
            >
              <FaMusic />
            </button> */}
            <button
              type="button"
              className="strategy-btn strategy-btn-primary"
              onClick={toggleOpen}
              aria-expanded={open}
              aria-controls="vip-alert-panel"
            >
              {open ? 'Hide Live Alerts ▲' : 'Live Alerts ▼'}
              {!open && unseen > 0 && (
                <span className="vip-alert-badge" aria-label={`${unseen} new`}>
                  {unseen} new
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sunday: no market - gone by itself at midnight */}
        {noMarket && (
          <div className="no-market-notice" role="status">
            <MarketClock /> No market today - trading resumes at 00:00
          </div>
        )}

        {open && !fullscreen && chatPanel}
        {open && fullscreen &&
          createPortal(
            // Click on the dimmed area around the chat leaves full screen
            <div className="wa-chat-overlay" onClick={toggleFullscreen}>
              <div className="wa-chat-overlay-inner" onClick={(e) => e.stopPropagation()}>
                {chatPanel}
              </div>
            </div>,
            document.body
          )}
      </div>
    </section>
  );
}
