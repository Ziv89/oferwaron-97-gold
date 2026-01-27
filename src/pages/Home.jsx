// ============================================
// Home.jsx - Landing Page (Strategy-style golden design)
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTradingStats, useSiteConfig, usePerformanceHistory } from '../App';

// Import the chart image
import chartImage from '../assets/images/ofernewChart.jpg';

// Strategy Chart Component - Static image showcase
const StrategyChart = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="chart-container chart-wrapper">
      {!isLoaded && (
        <div className="chart-loading">
          Loading chart...
        </div>
      )}
      <div className="strategy-chart-showcase">
        <img 
          src={chartImage}
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

function Home() {
  // Use hooks to get dynamic data from Firebase
  const { stats, loading: statsLoading } = useTradingStats();
  const { config, loading: configLoading } = useSiteConfig();
  const { performance, loading: perfLoading } = usePerformanceHistory();

  const loading = statsLoading || configLoading || perfLoading;

  return (
    <div className="strategy-page">
      {/* Hero Section */}
      <section className="strategy-section text-center">
        <h1 className="strategy-main-title-main get-in-touch-title get-in-touch-title--shimmer">
  <span className="get-in-touch-shimmer">
    Trade Gold with {performance.tradeSuccessRate} Profit Factor {stats.profitFactor} & DD {stats.dd}

  </span>
</h1>
        
        {/* Stats */}
        <div className="strategy-stats-grid">

          
          <div className="strategy-stat-card">
            <span className="strategy-stat-value">{loading ? '...' : performance.tradeSuccessRate}</span>
            <span className="strategy-stat-label">Win Rate</span>
          </div>
          <div className="strategy-stat-card">
            <span className="strategy-stat-value">{loading ? '...' : stats.totalTrades}</span>
            <span className="strategy-stat-label">Total Trades</span>
          </div>
          <div className="strategy-stat-card">
            <span className="strategy-stat-value">{loading ? '...' : stats.since}</span>
            <span className="strategy-stat-label">Since</span>
          </div>
          <div className="strategy-stat-card">
            <span className="strategy-stat-value">{loading ? '...' : stats.subscribers}</span>
            <span className="strategy-stat-label">Subscribers</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="strategy-btn-group">
          <Link to="/pricing" className="strategy-btn strategy-btn-primary">
            Start Trading Now
          </Link>
          <Link to="/youtube" className="strategy-btn strategy-btn-primary">
            Watch Free Content
          </Link>
        </div>
      </section>

      {/* Live Strategy Chart Section */}
      <section className="strategy-section">
        <StrategyChart />
        
        {/* Performance Highlights - Dynamic from Firebase */}
        <div className="strategy-stats-grid strategy-stats-grid-performance">
         <div className="strategy-stat-card stat-card-emphasized stat-card-wins">
  <span className="strategy-performance-value">
    {loading ? '...' : performance.totalWins}
  </span>
  <span className="strategy-stat-label">
    Wins ({loading ? '...' : `${performance.tradeSuccessRate}%`})
  </span>
</div>
     <div className="strategy-stat-card stat-card-emphasized stat-card-losses">
  <span className="strategy-performance-value">
    {loading ? '...' : performance.totalLosses}
  </span>
  <span className="strategy-stat-label">
    Losses ({loading ? '...' : `${performance.lossRate}%`})
  </span>
</div>
      <div className="strategy-stat-card stat-card-emphasized">
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

      {/* Final CTA */}
      <section className="strategy-section text-center">
        <h2 className="strategy-section-title">Ready to Start Trading?</h2>
        <p className="strategy-subtitle">Join {stats.subscribers} successful traders today</p>
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
