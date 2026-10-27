// ============================================
// Strategy.jsx - Strategy Explanation Page (Clean Design)
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { usePerformanceHistory, useTradingStats } from '../App';
import StrategyOverview from '../components/StrategyOverview';

// SantaLogo shimmer sweep (no glitter dots)
const StatCardShimmer = () => (
  <span className="stat-shimmer-layer" aria-hidden="true">
    <span className="stat-shimmer-sweep" />
  </span>
);

const features = [
  { icon: '📊', title: 'Live Dashboard', desc: 'Win/loss breakdowns, and heatmap by time' },
  { icon: '🔒', title: 'Invite-Only', desc: 'Support and service are provided through WhatsApp group' }
];

function Strategy() {
  // Use the hook to get dynamic performance data from Firebase
  const { performance, loading: perfLoading } = usePerformanceHistory();
  const { stats, loading: statsLoading } = useTradingStats();

  const loading = perfLoading || statsLoading;

  const flowSteps = [
    { step: 1, title: 'Data Collection', desc: 'Real-time XAU/USD price data from TradingView (4-hour timeframe)' },
    { step: 2, title: 'Multi-Layer Analysis', desc: 'All 14 indicators are calculated with AI-powered filters' },
    {
      step: 3,
      title: 'Entry Validation',
      desc: `Strict real-time validation against historical patterns since ${loading ? '...' : (performance?.experienceSince ?? 'N/A')}`
    },
    { step: 4, title: 'Smart Exit  Engine', desc: 'Profit and loss parameters are fixed and predefined in advance' },
    { step: 5, title: 'Signal Delivery', desc: 'Alert sent to subscribers instantly via WhatsApp' }
  ];

  // Rules array defined inside component to access stats.targetProfit
  const rules = [
    { icon: '🎯', title: 'Entry Precision', desc: 'Only high probability.' },
    {
      icon: '🛡️',
      title: 'Risk Control',
      desc: 'Profit and loss parameters in the system are fixed and predefined in advance.'
    },
    {
      icon: '💰',
      title: 'Profit Targets',
       desc: `Target profit of up to ${loading ? '...' : (stats?.targetProfit ?? 'N/A')} points per signal, or up to ${stats?.targetLoses ?? 'N/A'} points in case of a loss, with smart profit locks.`
    },
    { icon: '🤖', title: 'Auto Alerts', desc: 'Precise buy/sell signals delivered in real-time via WhatsApp.' }
  ];

  return (
    <div className="strategy-page">
      <Seo
        title="Trading Strategy — 97% Gold XAUUSD Signals"
        description="Discover the proprietary 14-indicator, AI-powered strategy behind 97% Gold's XAUUSD signals — entry rules, risk management and historical performance."
        path="/strategy"
      />

      {/* Hero */}
      <section className="strategy-section text-center">
        <h1 className="strategy-main-title get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            Ofer Waron Gold Strategy
            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
          </span>
        </h1>

        <p className="strategy-subtitle">
          A proprietary, high-performance trading algorithm designed for
          gold trading (XAU/USD) on the 4-hour chart. Built with precision, backed
          by data since {loading ? '...' : (performance?.backtestedSince ?? performance?.experienceSince ?? 'N/A')}, and enhanced with AI-powered filters.
        </p>
      </section>

      {/* Strategy Overview - text of documents/osn.pdf, opens on demand */}
      <StrategyOverview />

      {/* Core Principle */}
      <section className="strategy-section">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">💡 Core Principle</h2>
          <p className="strategy-principle-text">
            My strategy is built on <strong>multi-layered entry filters</strong> and
            <strong> AI-powered validation</strong>. The system integrates
            <strong> 14 proprietary indicators</strong> working together in a sophisticated
            combination to identify consistent, high-probability entry points.
          </p>
          <div className="strategy-rule-highlight">
            <strong>Smart Exit Engine:</strong> Predefined profit and loss parameters
            with disciplined exit logic on every trade.
          </div>
        </div>
      </section>

      {/* Signal Flow */}
      <section className="strategy-section">
        <h2 className="strategy-section-title text-center">🔄 Signal Generation Flow</h2>

        <div className="strategy-flow">
          {flowSteps.map((item, i) => (
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

      {/* Trading Rules */}
      <section className="strategy-section">
        <h2 className="strategy-section-title text-center">📋 Trading Rules</h2>
        <p className="strategy-subtitle text-center">Discipline is key to consistent profits</p>

        <div className="strategy-card-grid">
          {rules.map((rule, i) => (
            <div key={i} className="strategy-rule-card">
              <div className="strategy-rule-icon">{rule.icon}</div>
              <h3 className="strategy-rule-title">{rule.title}</h3>
              <p className="strategy-rule-desc">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="strategy-section">
        <h2 className="strategy-section-title text-center">📦 Available Features</h2>

        <div className="strategy-card-grid strategy-card-grid-2col">
          {features.map((feature, i) => (
            <div key={i} className="strategy-rule-card">
              <div className="strategy-rule-icon">{feature.icon}</div>
              <h3 className="strategy-rule-title">{feature.title}</h3>
              <p className="strategy-rule-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="strategy-section">
        <h2 className="strategy-section-title text-center">📈 Historical Performance</h2>

        <div className="strategy-stats-grid">
          <div className="strategy-stat-card">
            <StatCardShimmer />
            <span className="strategy-stat-value">
              {loading ? '...' : `${stats.tradingwinRate}%`}
            </span>
            <span className="strategy-stat-label">Trade Success Rate</span>
          </div>




         <div className="strategy-stat-card stat-card-emphasized-totalWins strategy-performance-value">
  <StatCardShimmer />
  <span className="strategy-performance-value">
    {loading ? '...' : performance.totalWins}
  </span>

              <span className="strategy-stat-label">Wins</span>

</div>

       

          <div className="strategy-stat-card stat-card-emphasized-maxLossPoints strategy-performance-value">
            <StatCardShimmer />
            <span className="strategy-performance-value">
              {loading ? '...' : (performance?.maxLossPoints ?? 'N/A')}
            </span>
            <span className="strategy-stat-label">Losses</span>
          </div>

          <div className="strategy-stat-card">
            <StatCardShimmer />
            <span className="strategy-stat-value">
              {loading ? '...' : (performance?.backtestedSince ?? 'N/A')}
            </span>
            <span className="strategy-stat-label">Backtested Since</span>
          </div>

          <div className="strategy-stat-card">
            <StatCardShimmer />
            <span className="strategy-stat-value">
              {loading ? '...' : (performance?.profitFactor ?? 'N/A')}
            </span>
            <span className="strategy-stat-label">PF (Profit Factor)</span>
          </div>

          <div className="strategy-stat-card ">
            <StatCardShimmer />
            <span className="strategy-stat-value">
              {loading ? '...' : (performance?.dd ?? 'N/A')}
            </span>
            <span className="strategy-stat-label">DD (Max Drawdown)</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="strategy-section text-center">
        <h2 className="strategy-section-title">Ready to Trade with Me?</h2>
        <p className="strategy-subtitle">Get invite-only access to my signals and start your journey</p>
        <div className="strategy-btn-group">
          <Link to="/pricing" className="strategy-btn strategy-btn-primary">View Pricing</Link>
          <Link to="/youtube" className="strategy-btn strategy-btn-primary">Free Demonstrations</Link>
        </div>
      </section>
    </div>
  );
}

export default Strategy;
