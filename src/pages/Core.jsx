// ============================================
// Core.jsx - members-only chart page
//
// Two live/near-live sources, both gated to active members, neither ever
// exposing Pine Script:
//
// 1. LiveSignalsChart - a chart drawing markers from signals/{id}, which
//    are written only by the tvWebhook Cloud Function when a TradingView
//    alert fires. TradingView never sends the script here, only the plain
//    text you put in the alert's Message box (side/price/symbol).
//
// 2. The proprietary strategy chart - a SCREENSHOT the owner uploads to
//    Firebase Storage, whose URL is published on siteData/tradingStats
//    (tradeViewChartImage / tradeViewChartImages). The visitor's browser
//    only ever receives an image.
//
// For the LIVE, interactive version of the indicator on the member's own
// chart, TradingView's own invite-only script permission is the real gate:
// Members.jsx already collects tvUsername and the owner grants access on
// tradingview.com -> script -> Manage Access. That flow hides the source
// the same way a private GitHub repo hides code - TradingView enforces it
// server-side, so there's no client-side secret to leak here either.
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../contexts/AuthContext';
import { useTradingStats } from '../App';
import LiveSignalsChart from '../components/LiveSignalsChart';
import '../styles/auth.css';

export default function Core() {
  const { profile, logout } = useAuth();
  const { stats, loading } = useTradingStats();

  const strategyImages = (stats?.tradeViewChartImages?.length
    ? stats.tradeViewChartImages
    : [stats?.tradeViewChartImage].filter(Boolean));

  return (
    <div className="strategy-page">
      <Seo
        title="Core Chart — 97% Gold"
        description="Live XAUUSD chart and the latest 97% Gold strategy snapshot for active members."
        path="/core"
        noindex
      />

      <section className="strategy-section text-center">
        <h1 className="get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            Core Chart
            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
          </span>
        </h1>
        <p className="strategy-subtitle">Live signals from TradingView, plus the latest strategy snapshot.</p>
      </section>

      {/* Live signals - from the TradingView webhook, gated by Firestore rules */}
      <section className="strategy-section">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">Live Signals</h2>
          <LiveSignalsChart />
        </div>
      </section>

      {/* Proprietary strategy chart - image only, sourced from Firebase */}
      <section className="strategy-section">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">Latest Strategy Snapshot</h2>
          <p className="strategy-principle-text">
            Updated by the owner. This is a chart image only — the indicator
            logic behind it stays on TradingView and is never shipped to
            this site.
          </p>

          {loading ? (
            <p className="strategy-subtitle">Loading…</p>
          ) : strategyImages.length ? (
            <div className="core-snapshot-grid">
              {strategyImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`97% Gold strategy chart snapshot ${i + 1}`}
                  className="core-snapshot-image"
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <div className="coming-soon-image-placeholder">Coming Soon</div>
          )}
        </div>
      </section>

      <section className="strategy-section text-center">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">Want the Indicator on Your Own Chart?</h2>
          <p className="strategy-principle-text">
            {profile?.tvUsername
              ? <>Access for <strong>{profile.tvUsername}</strong> is requested on TradingView's invite-only list.</>
              : 'Request invite-only access on TradingView to trade with the live indicator yourself.'}
          </p>
          <div className="strategy-btn-group" style={{ marginTop: '1.5rem' }}>
            <Link to="/members" className="strategy-btn strategy-btn-primary">
              Manage TradingView Access
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Sign out ---------- */}
      <section className="strategy-section text-center">
        <button type="button" className="auth-link" onClick={logout}>
          Sign out
        </button>
      </section>
    </div>
  );
}
