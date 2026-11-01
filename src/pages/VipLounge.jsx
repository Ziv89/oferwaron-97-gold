// ============================================
// VipLounge.jsx - signed-in members only
//
// Home for member-only tools. First tool: WhatsApp group scanning.
// Members save the groups they want scanned; the scanner itself is not
// built yet, so "Scan now" is disabled and every group stays "pending".
// Also shows the live TradingView alert feed (tradingview/alerts/tvMessages,
// kept 12 hours) below the scanner as a WhatsApp-style group chat with
// light / dark mode; new alerts appear live and play soundeffect/alertEffect.mp3.
// ============================================
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  FaVolumeUp, FaVolumeMute, FaSun, FaMoon, FaExpand, FaCompress, FaClock, FaChevronDown, FaBan, FaUsers, FaWhatsapp,
  // re-enable with the Group Scanner section / Test sound button:
  // FaTrashAlt, FaSearch, FaPlus, FaMusic,
} from 'react-icons/fa';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import Seo from '../components/Seo';
import { ScancodeLightbox } from '../components/WhatsAppQr';
import { useStorageImage } from '../services/storageImages';
import { useScancodeImageState, SCANCODE } from '../services/scancodeImages';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToAlerts, subscribeToChatSettings, isAlertExpired, ALERT_TTL_HOURS, ALERT_SOUND_PREF_KEY,
  setAlertChatVisible,
} from '../services/alertMessages';
import { useSoundEffect, ALERT_SOUND } from '../services/soundEffects';
// Group Scanner is hidden for now - re-enable with its section below
// import {
//   subscribeToGroups,
//   addGroup,
//   removeGroup,
//   WHATSAPP_INVITE_PATTERN,
//   SCAN_STATUS,
// } from '../services/whatsappGroups';
import '../styles/auth.css';

// re-enable with the Coming Soon section
// const COMING_SOON = ['Scan results & insights', 'Scheduled re-scans', 'More member tools'];

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
// WHATSAPP GROUP QR - scancodes/ofernewScancode4 in Firebase Storage.
// Members-only: storage.rules lets only approved members read it, and it is
// shown on this page only. Click to enlarge for easier scanning.
// ============================================
const GROUP_QR_ALT = 'Scan to join the 97% Gold WhatsApp group';
const GROUP_QR_CAPTION = 'Scan with your phone camera to join the WhatsApp group';

function WhatsAppGroupQr() {
  const { url, failed } = useScancodeImageState(SCANCODE.whatsappGroup);
  const [enlarged, setEnlarged] = useState(false);
  const close = useCallback(() => setEnlarged(false), []);

  // Same card as WhatsApp on the Contact page, in glowing WhatsApp green.
  // Opens the scan code enlarged; "coming soon" window until it is uploaded.
  return (
    <section className="strategy-section">
      <button
        type="button"
        className="strategy-rule-card contact-method-card vip-group-card"
        onClick={() => setEnlarged(true)}
        aria-label="Show WhatsApp group scan code"
      >
        <span className="vip-group-card-icon" aria-hidden="true">
          <FaUsers />
          <span className="vip-group-card-badge"><FaWhatsapp /></span>
        </span>
        <h3 className="strategy-rule-title">WhatsApp Group</h3>
        <p className="strategy-rule-desc">Members-only community</p>
        <p className="contact-method-value">Scan QR code</p>
      </button>

      {enlarged && (
        <ScancodeLightbox
          src={url}
          alt={GROUP_QR_ALT}
          caption={GROUP_QR_CAPTION}
          missing={failed}
          onClose={close}
        />
      )}
    </section>
  );
}

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
// Test sound button is hidden for now - re-enable these with it
// // How long the "Test sound" result stays on screen
// const SOUND_TEST_MSG_MS = 4000;
// const SOUND_TEST_MESSAGES = {
//   played: 'Sound played - this is what new alerts sound like',
//   'not-loaded': 'Sound file not available - check soundeffect/alertEffect.mp3 in Storage',
//   blocked: 'Your browser blocked the sound - check the tab is not muted',
// };

const initialChatTheme = () =>
  localStorage.getItem(THEME_PREF_KEY) ||
  (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

function AlertFeed() {
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

  // Alerts older than ALERT_TTL_HOURS drop off the chat on their own while the page stays open
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), EXPIRY_RECHECK_MS);
    return () => clearInterval(timer);
  }, []);

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
          <FaClock /> Messages disappear after {ALERT_TTL_HOURS} hours
        </div>

        {error ? (
          <div className="wa-chat-system wa-chat-system--error">{error}</div>
        ) : loading ? (
          <div className="wa-chat-system">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="wa-chat-system">No alerts in the last {ALERT_TTL_HOURS} hours</div>
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
                  <span className="wa-bubble-sender">{msg.symbol || 'TradingView'}</span>
                  {msg.deleted ? (
                    <p className="wa-bubble-text">
                      <FaBan aria-hidden="true" /> This alert was deleted
                    </p>
                  ) : (
                    <p className="wa-bubble-text">{msg.messagecontent}</p>
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

        {/* Test sound result - re-enable with the Test sound button
        <p
          className={`vip-sound-test${soundTest && soundTest !== 'played' ? ' vip-sound-test--error' : ''}`}
          role="status"
        >
          {soundTest && SOUND_TEST_MESSAGES[soundTest]}
        </p> */}

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

export default function VipLounge() {
  const { user, profile } = useAuth();

  return (
    <div className="strategy-page">
      <Seo
        title="WhatsApp Group — 97% Gold"
        description="Member-only content  for 97% Gold members."
        path="/vip"
        noindex
      />

      <section className="strategy-section text-center">
        <h1 className="get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            WhatsApp Group
            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
          </span>
        </h1>
        <p className="strategy-subtitle">
          Welcome, {profile?.displayName || user?.email} — your members-only benefits are below. 
        </p>
      </section>

      {/* ---------- WhatsApp group scanner: add form + my groups ---------- */}


      {/* ---------- WhatsApp group scan code (members only) ---------- */}
      <WhatsAppGroupQr />

      {/* ---------- TradingView alerts ---------- */}
      <AlertFeed />

      {/* ---------- Roadmap ---------- */}
      {/* <section className="strategy-section">
        <div className="strategy-principle-card vip-card">
          <h2 className="strategy-card-title vip-card-title">Coming Soon</h2>
          <ul className="vip-chips">
            {COMING_SOON.map((item) => (
              <li key={item} className="vip-chip">{item}</li>
            ))}
          </ul>
        </div>
      </section> */}
            {/* <section className="strategy-section">
        <div className="strategy-principle-card vip-card">
          <h2 className="strategy-card-title vip-card-title">
            <FaWhatsapp style={{ color: '#25D366' }} /> Group Scanner
          </h2>
          <p className="member-hint vip-card-intro">
            Save the groups you want scanned. Your list is private to your account —
            groups you add now will be ready the moment scanning launches.
          </p>

          <form className="auth-form vip-add-form" onSubmit={handleAdd}>
            <div className="vip-add-fields">
              <input
                type="text"
                className="contact-input"
                placeholder="Group name"
                aria-label="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />
              <input
                type="url"
                className="contact-input"
                placeholder="https://chat.whatsapp.com/..."
                aria-label="Group invite link"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            {inviteLink.trim() && !linkIsValid && (
              <p className="member-hint">
                Paste the group invite link — it starts with https://chat.whatsapp.com/
              </p>
            )}
            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="strategy-btn strategy-btn-primary"
              disabled={saving || !name.trim() || !linkIsValid}
            >
              <FaPlus /> {saving ? 'Saving…' : 'Add Group'}
            </button>
          </form>

          <div className="vip-subheading">
            <h3>My Groups</h3>
            {!groupsLoading && <span className="vip-count">{groups.length}</span>}
          </div>

          {groupsLoading ? (
            <p className="member-hint">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="vip-empty">No groups yet — add your first one above.</p>
          ) : (
            <ul className="vip-group-list">
              {groups.map((group) => {
                const status = SCAN_STATUS[group.status] ? group.status : 'pending';
                return (
                  <li key={group.id} className="vip-group-item">
                    <span className="vip-group-avatar" aria-hidden="true"><FaWhatsapp /></span>
                    <div className="vip-group-info">
                      <strong>{group.name}</strong>
                      <span className={`vip-status vip-status--${status}`}>{SCAN_STATUS[status]}</span>
                    </div>
                    <div className="vip-group-actions">
                      <button type="button" className="strategy-btn" disabled title="Coming soon">
                        <FaSearch /> Scan
                      </button>
                      <button
                        type="button"
                        className="strategy-btn vip-remove-btn"
                        onClick={() => handleRemove(group)}
                        aria-label={`Remove ${group.name}`}
                        title="Remove"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section> */}
    </div>
    
  );
}
