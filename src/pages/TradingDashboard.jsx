// ============================================
// TradingDashboard.jsx - Ofer Waron 97% Gold Strategy
// LIVE Trading - Coming Soon
// ============================================

import React from 'react';
import '../styles/styles.css';
import { useTradingStats } from '../App';

// ============================================
// MAIN DASHBOARD - COMING SOON
// ============================================
export default function TradingDashboard() {
  // ✅ Hooks MUST be inside the component
  const { stats, loading } = useTradingStats();

  const comingSoonImage = stats?.tradeViewChartImages?.[1] || '';

  if (loading) {
    return (
      <div className="trading-dashboard trading-dashboard-coming-soon">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="trading-dashboard trading-dashboard-coming-soon">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            🏆 Ofer Waron Gold Strategy
            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
          </span>
        </h1>

        {/* <div className="live-coming-soon-badge">
          <span className="live-dot"></span>
          <span className="live-text">LIVE</span>
          <span className="coming-soon-text-badge">COMING SOON</span>
        </div> */}
      </header>

      {/* Coming Soon Image Section */}
      <div className="coming-soon-image-section">
        <div className="coming-soon-image-wrapper">
          {comingSoonImage ? (
            <img
              src={comingSoonImage}
              alt="97% Gold Strategy - Coming Soon"
              className="coming-soon-hero-image"
            />
          ) : (
            <div className="coming-soon-image-placeholder">
              Coming Soon
            </div>
          )}

          <div className="coming-soon-image-overlay">
            <div className="overlay-content">
              <span className="overlay-icon">🔔</span>
              <span className="overlay-text">Stay Tuned!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
