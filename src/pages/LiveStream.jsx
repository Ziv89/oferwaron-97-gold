import React, { useCallback, useEffect, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import Seo from '../components/Seo';
import CoinLoader from '../components/CoinLoader';
import { LoadingFrame } from '../components/LoadingMedia';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import '../styles/live-stream.css';

const STATUS_POLL_MS = 20 * 1000;

const eventDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Time to be announced';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export default function LiveStream({ autoSelectLive = false, pagePath = '/live' }) {
  const { user, isActive } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [replays, setReplays] = useState([]);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [selected, setSelected] = useState(autoSelectLive ? 'live' : '');
  const [embedUrl, setEmbedUrl] = useState('');
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userPicked = useRef(false);
  const playerRef = useRef(null);
  const [schedule, setSchedule] = useState([]);

  const streamFetch = useCallback(async (url, options = {}) => {
    const idToken = user ? await user.getIdToken() : null;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
    return result;
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (document.hidden) return;
      try {
        const result = await streamFetch('/api/stream-status');
        if (cancelled) return;
        setIsLive(Boolean(result.live));
        setReplays(result.replays || []);
      } catch {
        if (!cancelled) setIsLive(false);
      } finally {
        if (!cancelled) setStatusLoaded(true);
      }
    };

    poll();
    const timer = window.setInterval(poll, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [streamFetch]);

  useEffect(() => {
    if (isLive && !userPicked.current) setSelected('live');
    if (!isLive && selected === 'live' && !autoSelectLive) setSelected('');
  }, [autoSelectLive, isLive, selected]);

  useEffect(() => {
    if (!selected) {
      setEmbedUrl('');
      setPlayerError('');
      return undefined;
    }

    let cancelled = false;
    let refreshTimer;
    setEmbedUrl('');
    setPlayerError('');
    setPlayerLoading(true);

    const loadPlayer = async () => {
      try {
        const result = await streamFetch('/api/stream-token', {
          method: 'POST',
          body: JSON.stringify({ target: selected }),
        });
        if (!cancelled) {
          setEmbedUrl(result.embedUrl);
          refreshTimer = window.setTimeout(loadPlayer, 50 * 60 * 1000);
        }
      } catch (error) {
        if (!cancelled) {
          setPlayerError(error.message || 'Could not load the stream. Please try again.');
        }
      } finally {
        if (!cancelled) setPlayerLoading(false);
      }
    };

    loadPlayer();
    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
    };
  }, [selected, streamFetch]);

  useEffect(() => {
    let cancelled = false;
    if (!user || !isActive) {
      setSchedule([]);
      return () => {
        cancelled = true;
      };
    }

    getDocs(collection(db, 'streamEvents'))
      .then((snapshot) => {
        if (cancelled) return;
        const now = Date.now() - 2 * 60 * 60 * 1000;
        const rows = snapshot.docs
          .map((eventDoc) => ({ id: eventDoc.id, ...eventDoc.data() }))
          .filter((event) => event.status === 'scheduled')
          .filter((event) => {
            const time = event.startsAt?.toDate?.()?.getTime();
            return !time || time > now;
          })
          .sort((first, second) =>
            (first.startsAt?.toDate?.()?.getTime() || Infinity) -
            (second.startsAt?.toDate?.()?.getTime() || Infinity)
          );
        setSchedule(rows);
      })
      .catch(() => {
        setSchedule([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isActive]);

  const pick = (target) => {
    userPicked.current = target !== 'live';
    setSelected(target);
  };

  const toggleFullscreen = () => {
    const node = playerRef.current;
    if (!node) return;

    if (!document.fullscreenElement) {
      if (node.requestFullscreen) {
        node.requestFullscreen();
      } else if (node.webkitRequestFullscreen) {
        node.webkitRequestFullscreen();
      }
      return;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const selectedReplay = replays.find((replay) => replay.uid === selected);
  const playerTitle = selected === 'live'
    ? 'Live TradingView session'
    : selectedReplay?.title || `Session replay · ${eventDate(selectedReplay?.created)}`;
  const pageTitle = autoSelectLive ? 'Live Trading Events' : 'Live Trading Events';

  return (
    <div className="strategy-page live-page">
      <Seo
        title={`${pageTitle} — 97% Gold`}
        description="Watch live TradingView strategy sessions. Members can sign in to access available session replays."
        path={pagePath}
        noindex
      />

      <header className="live-page-header">
        {autoSelectLive ? (
          <h1 className="dashboard-title get-in-touch-title get-in-touch-title--shimmer live-dashboard-title">
            <span className="get-in-touch-shimmer">
               {pageTitle}
              <span className="sparkle sparkle-1" aria-hidden="true">✦</span>
              <span className="sparkle sparkle-2" aria-hidden="true">✦</span>
            </span>
          </h1>
        ) : (
          <h1 className="strategy-section-title">{pageTitle}</h1>
        )}
        <p className="strategy-subtitle">
          Strategy walkthroughs and market sessions streamed live from TradingView.
        </p>
      </header>

      <section className="live-now-bar" aria-live="polite">
        {!statusLoaded && <p className="live-empty-state">Checking for a live session…</p>}
        {statusLoaded && (
          <>
            <span className={`live-status ${isLive ? 'live-status-live' : 'live-status-offline'}`}>
              <span className="live-dot" aria-hidden="true" />
              {isLive ? 'Live' : 'Offline'}
            </span>
            {isLive && selected !== 'live' && (
              <button className="live-watch-button" type="button" onClick={() => pick('live')}>
                Watch live
              </button>
            )}
          </>
        )}
      </section>

      {selected && (
        <section className="live-player-section" aria-label="Selected stream">
          <div className="live-player-heading">
       
            <div className="live-player-actions">
              <button className="live-fullscreen-button" type="button" onClick={toggleFullscreen}>
                {isFullscreen ? 'Exit full screen' : 'Full screen'}
              </button>
              {!autoSelectLive && (
                <button className="live-close-button" type="button" onClick={() => pick('')}>
                  Close player
                </button>
              )}
            </div>
          </div>
          <div ref={playerRef} className="live-player-frame">
            {playerLoading && <CoinLoader label="Authorizing secure playback…" />}
            {playerError && (
              <div className="live-player-message live-frame-error" role="alert">
                <strong>Secure stream unavailable</strong>
                <span>{playerError}</span>
              </div>
            )}
            {embedUrl && (
              <LoadingFrame
                src={embedUrl}
                title={playerTitle}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            )}
          </div>
        </section>
      )}

      {schedule.length > 0 && (
      <section className="live-events-section" aria-labelledby="live-upcoming-heading">
        <div className="live-events-heading-row">
          <h2 id="live-upcoming-heading">Upcoming sessions</h2>
          <span>{schedule.length}</span>
        </div>
        <div className="live-event-list">
          {schedule.map((event) => (
            <article className="live-event-row" key={event.id}>
              <div className="live-event-date">{eventDate(event.startsAt)}</div>
              <div className="live-event-copy">
                <span className="live-status live-status-scheduled">Scheduled</span>
                <h3>{event.title || 'TradingView strategy session'}</h3>
                {event.description && <p>{event.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
      )}

      <section className="live-events-section" aria-labelledby="live-replays-heading">
      
{/*
        <div className="live-event-list">
          {replays.map((replay) => (
            <article className="live-event-row" key={replay.uid}>
              <div className="live-event-date">{eventDate(replay.created)}</div>
              <div className="live-event-copy">
                <span className="live-status live-status-ended">Replay</span>
                <h3>{replay.title || 'TradingView strategy session'}</h3>
                {replay.duration > 0 && <p>{Math.round(replay.duration / 60)} min</p>}
              </div>
              <button
                className="live-watch-button"
                type="button"
                onClick={() => pick(replay.uid)}
                disabled={selected === replay.uid}
              >
                {selected === replay.uid ? 'Playing' : 'Watch replay'}
              </button>
            </article>
          ))}
        </div> */}
      </section>
    </div>
  );
}