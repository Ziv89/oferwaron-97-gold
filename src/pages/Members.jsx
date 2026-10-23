// ============================================
// Members.jsx - the member area
//
// Two states:
//   no active subscription -> show how to subscribe
//   active subscription    -> show status + TradingView access request
//
// NOTE ON TRADINGVIEW INVITE-ONLY:
// There is no invite code or password. Access is granted by adding the
// member's TradingView USERNAME to the script's "Manage Access" list.
// So this page COLLECTS the username - it does not hand out a secret.
// ============================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Seo from '../components/Seo';
import { useAuth } from '../contexts/AuthContext';
import { WhatsAppQrButton } from '../components/WhatsAppQr';
import { db } from '../services/firebase';
import '../styles/auth.css';

export default function Members() {
  const { user, profile, subscription, expiresAt, isActive } = useAuth();

  const [tvUsername, setTvUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.tvUsername) setTvUsername(profile.tvUsername);
  }, [profile?.tvUsername]);

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - new Date()) / 86400000))
    : null;

  const requestAccess = async () => {
    const clean = tvUsername.trim();
    if (!clean) return;

    setSaving(true);
    setError('');

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        tvUsername: clean,
        tvAccessRequestedAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (err) {
      setError('Could not save. Please try again or message us on WhatsApp.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="strategy-page">
      <Seo
        title="Member Area — 97% Gold"
        description="Your 97% Gold membership dashboard."
        path="/members"
        noindex
      />

      <section className="strategy-section text-center">
        <h1 className="get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            Member Area
            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
          </span>
        </h1>
        <p className="strategy-subtitle">
          Signed in as {profile?.displayName || user?.email}
        </p>
      </section>

      {/* ---------- Subscription status ---------- */}
      <section className="strategy-section">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">Membership Status</h2>

          {isActive ? (
            <>
              <div className="member-status member-status-active">
                <span className="member-status-dot" />
                {subscription.status === 'trial' ? 'Free Trial' : 'Active'}
              </div>
              <p className="strategy-principle-text">
                {daysLeft === 0
                  ? 'Your access expires today.'
                  : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} remaining.`}
                {expiresAt && ` Renews or expires on ${expiresAt.toLocaleDateString()}.`}
              </p>
              <div className="strategy-btn-group" style={{ marginTop: '1.5rem' }}>
                <Link to="/core" className="strategy-btn strategy-btn-primary">
                  Open Core Chart →
                </Link>
                <Link to="/live" className="strategy-btn strategy-btn-primary">
                  Live Trading Events →
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="member-status member-status-inactive">
                <span className="member-status-dot" />
                {subscription ? 'Expired' : 'No active subscription'}
              </div>
              <p className="strategy-principle-text">
                Your account is created but there is no active membership on it yet.
                Message us on WhatsApp to start your free 30-day trial and we will
                activate it right away.
              </p>
              <div className="strategy-btn-group" style={{ marginTop: '1.5rem' }}>
                {/* Opens the WhatsApp QR code to scan - no direct link to WhatsApp */}
                <WhatsAppQrButton>Activate on WhatsApp 💬</WhatsAppQrButton>
                <Link to="/pricing" className="strategy-btn strategy-btn-primary">
                  View Plans
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ---------- TradingView access (active members only) ---------- */}
      {isActive && (
        <section className="strategy-section">
          <div className="strategy-principle-card">
            <h2 className="strategy-card-title">Private Indicator Access</h2>

            <p className="strategy-principle-text">
              The 97% Gold indicator is invite-only on TradingView. Enter your
              TradingView username below and we will add you to the access list,
              usually within 24 hours. You will get a notification from TradingView
              when it is ready.
            </p>

            <p className="member-hint">
              Your username is shown at{' '}
              <a
                href="https://www.tradingview.com/u/"
                target="_blank"
                rel="noopener noreferrer"
              >
                tradingview.com/u/
              </a>{' '}
              when signed in — it is the name in the URL, not your email.
            </p>

            <div className="auth-form" style={{ marginTop: '1.25rem' }}>
              <input
                type="text"
                className="contact-input"
                placeholder="Your TradingView username"
                value={tvUsername}
                onChange={(e) => {
                  setTvUsername(e.target.value);
                  setSaved(false);
                }}
                autoCapitalize="none"
                autoCorrect="off"
              />

              {error && <p className="auth-error">{error}</p>}

              {saved ? (
                <p className="auth-notice">
                  Request received. We will add <strong>{tvUsername}</strong> to the
                  script access list shortly.
                </p>
              ) : (
                <button
                  type="button"
                  className="strategy-btn strategy-btn-primary"
                  onClick={requestAccess}
                  disabled={saving || !tvUsername.trim()}
                >
                  {saving ? 'Sending…' : 'Request Access'}
                </button>
              )}
            </div>

            {profile?.tvAccessRequestedAt && !saved && (
              <p className="member-hint" style={{ marginTop: '1rem' }}>
                A request is already on file for <strong>{profile.tvUsername}</strong>.
                Submitting again will update it.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ---------- Sign out ---------- */}

    </div>
  );
}
