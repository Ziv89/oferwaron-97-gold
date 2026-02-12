// ============================================
// Home.jsx - Landing Page (Redesigned for conversion)
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTradingStats, useSiteConfig, usePerformanceHistory } from '../App';

// Intersection observer for scroll reveal
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

// Scroll-reveal wrapper component
const Reveal = ({ children, delay = 0 }) => {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      style={{
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        opacity: inView ? 1 : 0,
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

// Strategy Chart Component
const StrategyChart = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { stats, loading } = useTradingStats();
  const src = stats?.tradeViewChartImage;

  if (loading) {
    return (
      <div className="chart-container chart-wrapper">
        <div className="chart-loading">Loading chart...</div>
      </div>
    );
  }

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
    <div className="chart-container chart-wrapper">
      {!isLoaded && <div className="chart-loading">Loading chart...</div>}
      <div className="strategy-chart-showcase">
        <img
          src={src}
          alt="OferWaron97% Gold Trading Strategy - Live Performance"
          className={`strategy-chart-image ${isLoaded ? 'loaded' : ''}`}
          onLoad={() => setIsLoaded(true)}
        />
        <div className="chart-overlay-info">
          <a
            href="https://www.tradingview.com/u/oferwv/"
            target="_blank"
            rel="noopener noreferrer"
            className="chart-tradingview-link"
          >
            📺 View Live on TradingView
          </a>
        </div>
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

// Trust badge component
const TrustBadge = ({ icon, text }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: 'rgba(212, 168, 67, 0.06)',
    border: '1px solid rgba(212, 168, 67, 0.15)',
    borderRadius: '8px',
    fontSize: 'clamp(0.72rem, 1.6vw, 0.82rem)',
    color: '#9B917D',
  }}>
    <span style={{ fontSize: '14px' }}>{icon}</span>
    {text}
  </span>
);

function Home() {
  const { stats, loading: statsLoading } = useTradingStats();
  const { config, loading: configLoading } = useSiteConfig();
  const { performance, loading: perfLoading } = usePerformanceHistory();

  const loading = statsLoading || configLoading || perfLoading;

  return (
    <div className="strategy-page">
      {/* ===== HERO SECTION ===== */}
      <section className="strategy-section text-center" style={{ paddingTop: 'clamp(24px, 5vw, 48px)' }}>
        {/* Live tracking badge */}


        {/* Main headline */}
        <h1 className="strategy-main-title-main get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            Trade Gold with {stats.tradingwinRate} Accuracy
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="strategy-subtitle" style={{ maxWidth: '600px', margin: '0 auto clamp(20px, 3vw, 32px)' }}>
          Proprietary AI-powered gold trading strategy on XAU/USD 4H chart.
          Real-time signals with clear entry, exit, and stop-loss levels.
        </p>

        {/* CTAs */}
        <div className="strategy-btn-group" style={{ marginBottom: 'clamp(16px, 3vw, 28px)' }}>
          <Link to="/pricing" className="strategy-btn strategy-btn-primary">
            Start Trading Now 
          </Link>
          <Link to="/youtube" className="strategy-btn strategy-btn-secondary">
             Watch Free Content
          </Link>
        </div>

        {/* Trust badges row */}
        <div style={{
          display: 'flex',
          gap: 'clamp(6px, 1.5vw, 12px)',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 'clamp(24px, 4vw, 40px)',
        }}>
          <TrustBadge icon="🔒" text="Cancel anytime" />
          <TrustBadge icon="⚡" text="Instant WhatsApp alerts" />
          <TrustBadge icon="📊" text="Full transparency" />
        </div>

        {/* Stats Grid */}
        <div className="strategy-stats-grid">
          <div className="strategy-stat-card">
            <span className="strategy-stat-value">
              {loading ? '...' : `${stats.tradingwinRate}`}
            </span>
            <span className="strategy-stat-label">Win Rate</span>
          </div>
          <div className="strategy-stat-card">
            <span className="strategy-stat-value">{loading ? '...' : stats.totalTrades}</span>
            <span className="strategy-stat-label">Total Trades</span>
          </div>
          <div className="strategy-stat-card">
            <span className="strategy-stat-value">{loading ? '...' : stats.profitFactor}</span>
            <span className="strategy-stat-label">Profit Factor</span>
          </div>
          <div className="strategy-stat-card">
            <span className="strategy-stat-value">{loading ? '...' : stats.dd}</span>
            <span className="strategy-stat-label">Max Drawdown</span>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF TICKER ===== */}
      <Reveal>
        <div style={{
          borderTop: '1px solid rgba(212, 168, 67, 0.1)',
          borderBottom: '1px solid rgba(212, 168, 67, 0.1)',
          background: 'rgba(212, 168, 67, 0.03)',
          padding: '14px 0',
          margin: '0 calc(-1 * var(--space-md))',
        }}>
          <div style={{
            display: 'flex',
            gap: 'clamp(20px, 4vw, 48px)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: '0 16px',
          }}>
            {[
              `🏆 Trading since ${stats.since || '2019'}`,
              `📈 ${stats.subscribers || '600+'} Subscribers`,
              '🌍 Global Community',
              '🤖 AI-Powered Strategy',
            ].map((t, i) => (
              <span key={i} style={{
                fontSize: 'clamp(0.72rem, 1.6vw, 0.82rem)',
                color: '#9B917D',
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
              }}>{t}</span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ===== LIVE STRATEGY CHART ===== */}
      <Reveal delay={0.1}>
        <section className="strategy-section">
          <StrategyChart />

          {/* Performance Highlights */}
          <div className="strategy-stats-grid strategy-stats-grid-performance">
            <div className="strategy-stat-card stat-card-emphasized stat-card-wins">
              <span className="strategy-performance-value">
                {loading ? '...' : stats.totalWiningTrading}
              </span>
              <span className="strategy-stat-label">
                Wins ({loading ? '...' : `${stats.tradingwinRate}%`})
              </span>
            </div>
            <div className="strategy-stat-card stat-card-emphasized stat-card-losses">
              <span className="strategy-performance-value">
                {loading ? '...' : stats.totalLosestrading}
              </span>
              <span className="strategy-stat-label">
                Losses ({loading ? '...' : `${stats.tradingloseRate}%`})
              </span>
            </div>
            <div className="strategy-stat-card stat-card-emphasized">
              <span className="strategy-stat-value">
                {loading ? '...' : performance.maxConsecutiveWins}
              </span>
              <span className="strategy-stat-label">Max Consecutive Wins</span>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ===== HOW IT WORKS ===== */}
      <Reveal delay={0.15}>
        <section className="strategy-section">
          <h2 className="strategy-section-title text-center">Start Trading in 3 Steps</h2>
          <p className="strategy-subtitle text-center">Simple process to start earning</p>

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
      </Reveal>

      {/* ===== FINAL CTA ===== */}
      <Reveal delay={0.1}>
        <section className="strategy-section text-center">
          <h2 className="strategy-section-title">Ready to Start Trading?</h2>
          <p className="strategy-subtitle">Join {stats.subscribers} successful traders today</p>
          <div className="strategy-btn-group">
            <Link to="/pricing" className="strategy-btn strategy-btn-primary">
              View Pricing Plan →
            </Link>
            <Link to="/contact" className="strategy-btn strategy-btn-secondary">
              💬 Chat on WhatsApp
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

export default Home;
