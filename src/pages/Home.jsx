// ============================================
// Home.jsx - Landing Page (Strategy-style golden design)
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useTradingStats, useSiteConfig, usePerformanceHistory } from '../App';
import { useAuth } from '../contexts/AuthContext';
import CoinLoader from '../components/CoinLoader';
import WhatsAppQr from '../components/WhatsAppQr';

// SantaLogo shimmer sweep only (no glitter dots/stars)
const StatCardShimmer = () => (
  <span className="stat-shimmer-layer" aria-hidden="true">
    <span className="stat-shimmer-sweep" />
  </span>
);

// Strategy Chart Component - Static image showcase
const StrategyChart = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { stats, loading } = useTradingStats();

   const src = stats?.tradeViewChartImage;

  //  const src = ofernewChart;

  // If still loading, show loader
  if (loading) {
    return (
      <div className="chart-container chart-wrapper">
        <div className="chart-loading"><CoinLoader label="Loading chart…" /></div>
      </div>
    );
  }

  // If missing URL in Firebase, show a helpful fallback
  if (!src) {
    return (
      <div className="chart-container chart-wrapper">
        <div className="chart-error">
          <div className="chart-error-content">
            <p>Chart image is not set yet.</p>
            <a
              href="https://www.tradingview.com/u/oferwv/"
              target="_blank"
              rel="noopener noreferrer"
              className="chart-link"
            >
              View Live on TradingView
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Container shrinks to the image once loaded so the chart fills its border edge to edge
    <div className={`chart-container chart-wrapper strategy-chart-container ${isLoaded ? 'loaded' : ''}`}>
      {!isLoaded && <div className="chart-loading"><CoinLoader label="Loading chart…" /></div>}

      <div className="strategy-chart-showcase">
        <img
          src={src}
          alt="OferWaron97% Gold Trading Strategy - Live Performance"
          className={`strategy-chart-image ${isLoaded ? 'loaded' : ''}`}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
};


// How It Works Steps
const steps = [
  { step: 1, title: 'Subscribe', desc: 'Subscribe to a dedicated plan and get instant access to my trading signals.' },
  { step: 2, title: 'Receive Signals', desc: 'Get real-time alerts via WhatsApp.' },
  { step: 3, title: 'Execute & Profit', desc: 'Follow the signals with your broker. Clear entry, exit & stop-loss.' }
];

function Home() {
  const { user } = useAuth();
  // Use hooks to get dynamic data from Firebase
  const { stats, loading: statsLoading } = useTradingStats();
  const { loading: configLoading } = useSiteConfig();
  const { performance, loading: perfLoading } = usePerformanceHistory();

  const loading = statsLoading || configLoading || perfLoading;

  return (
    <div className="strategy-page">
      <Seo
        title="97% Gold — Professional XAUUSD Gold Trading Signals"
        description="Gold (XAUUSD) trading signals with proven live results. Real-time WhatsApp alerts with clear entry, exit and stop-loss levels."
        path="/"
        ogType="website"
      />

      {/* Hero Section */}
      <section className="strategy-section text-center">
        <h1 className="strategy-main-title-main get-in-touch-title get-in-touch-title--shimmer">
  <span className="get-in-touch-shimmer">
    XAUUSD 4H {stats.tradingwinRate}% Profit Factor {stats.profitFactor} & DD {stats.dd}

  </span>
</h1>
        {/* Stats — with shimmer sweep */}
        <div className="strategy-stats-grid">

          <div className="strategy-stat-card">
            <StatCardShimmer />
            <span className="strategy-stat-value">
              {loading ? '...' : `${stats.tradingwinRate}%`}
            </span>
            <span className="strategy-stat-label">Win Rate</span>
          </div>
          <div className="strategy-stat-card">
            <StatCardShimmer />
            <span className="strategy-stat-value">{loading ? '...' : stats.totalTrades}</span>
            <span className="strategy-stat-label">Total Trades</span>
          </div>
          <div className="strategy-stat-card">
            <StatCardShimmer />
            <span className="strategy-stat-value">{loading ? '...' : stats.since}</span>
            <span className="strategy-stat-label">Since</span>
          </div>
          <div className="strategy-stat-card">
            <StatCardShimmer />
            <span className="strategy-stat-value">{loading ? '...' : stats.pnl}</span>
            <span className="strategy-stat-label">Total PnL</span>
          </div>
        </div>

        {/* Defined, sourced, dated performance claim (replaces the bare "97%") */}
        <p className="strategy-subtitle">
          {loading
            ? '...'
            : `${stats.tradingwinRate}% of ${stats.totalTrades} signals closed at target since ${stats.since}.`}
          {' '}
          {user && <Link to="/trading">Full trade log →</Link>}
        </p>
        {/* CTAs */}
        <div className="strategy-btn-group">
          <Link to="/pricing" className="strategy-btn strategy-btn-primary">
            Start Trading Now
          </Link>
          <Link to="/youtube" className="strategy-btn strategy-btn-primary">
            Watch Free Content
          </Link>
        </div>

        {/* Direct line to Ofer - tap to enlarge the scan code */}
        <div className="home-whatsapp-qr">
          <p className="home-whatsapp-qr-title">Questions? Message me on WhatsApp</p>
          <WhatsAppQr caption="" />
        </div>
      </section>

      <section className="strategy-section">
        <StrategyChart />
        
        {/* Performance Highlights — with shimmer sweep */}
        <div className="strategy-stats-grid strategy-stats-grid-performance">
          <div className="strategy-stat-card stat-card-emphasized stat-card-wins">
            <StatCardShimmer />
            <span className="strategy-performance-value">
              {loading ? '...' : stats.totalWiningTrading}
            </span>
            <span className="strategy-stat-label">
              Wins ({loading ? '...' : `${stats.tradingwinRate}%`})
            </span>
          </div>
          <div className="strategy-stat-card stat-card-emphasized stat-card-losses">
            <StatCardShimmer />
            <span className="strategy-performance-value">
              {loading ? '...' : stats.totalLosestrading}
            </span>
            <span className="strategy-stat-label">
              Losses ({loading ? '...' : `${stats.tradingloseRate}%`})
            </span>
          </div>
          <div className="strategy-stat-card stat-card-emphasized">
            <StatCardShimmer />
            <span className="strategy-stat-value">
              {loading ? '...' : performance.maxConsecutiveWins}
            </span>
            <span className="strategy-stat-label">Max Consecutive Wins</span>
          </div>
          {/* <div className="strategy-stat-card stat-card-emphasized stat-card-pf">
            <span className="strategy-stat-value">
              {loading ? '...' : stats.profitFactor}
            </span>
            <span className="strategy-stat-label">PF (Profit Factor)</span>
          </div> */}
          {/* <div className="strategy-stat-card stat-card-emphasized stat-card-dd">
            <span className="strategy-stat-value">
              {loading ? '...' : stats.dd}
            </span>
            <span className="strategy-stat-label">DD (Max Drawdown)</span>
          </div> */}
        </div>
      </section>

      {/* How It Works */}
      <section className="strategy-section">
        {/* <h2 className="strategy-section-title text-center">🚀 How It Works</h2>
        <p className="strategy-subtitle text-center">Simple 3-step process to start earning</p> */}
        
        <div className="strategy-flow">
          {steps.map((item, i) => (
            <div key={i} className="strategy-flow-item">
              <div className="strategy-flow-step">{item.step}</div>
              <div className="strategy-flow-content">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="strategy-section text-center">
        <h2 className="strategy-section-title">Ready to Start Trading?</h2>
        <p className="strategy-subtitle">Join to successful traders today</p>
        <div className="strategy-btn-group">
          <Link to="/pricing" className="strategy-btn strategy-btn-primary">
            View Pricing Plan
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
