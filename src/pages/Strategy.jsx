// ============================================
// Strategy.jsx - Strategy Explanation Page (No inline styles)
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';

const indicators = [
  { name: 'MACD (15min)', desc: 'Identifies trend direction and momentum on higher timeframe', weight: '20%' },
  { name: 'RSI Momentum', desc: 'Detects overbought/oversold conditions and momentum shifts', weight: '15%' },
  { name: 'Bullish Reversal Candles', desc: 'Pattern recognition for high-probability reversal entries', weight: '15%' },
  { name: 'ATR Flatness', desc: 'Measures volatility conditions for optimal entry timing', weight: '15%' },
  { name: 'Volume Spikes', desc: 'Validates price movements with volume confirmation', weight: '10%' },
  { name: 'VWAP Distance', desc: 'Measures price deviation from volume-weighted average', weight: '10%' },
  { name: 'EMA Trend Support', desc: 'Confirms overall trend direction and dynamic support/resistance', weight: '15%' }
];

const rules = [
  { icon: '🎯', title: 'Entry Precision', desc: 'Multi-layered entry filters ensure only high-probability setups are taken on the 1-minute chart.' },
  { icon: '🛡️', title: 'Risk Control', desc: 'Dynamic SL/TP based on volatility. Maximum drawdown control with <5 point loss per trade.' },
  { icon: '💰', title: 'Profit Targets', desc: 'Target profit up to 200 points per signal with smart profit locks.' },
  { icon: '🤖', title: 'Auto Alerts', desc: 'Precise buy/sell signals delivered in real-time via TradingView alerts.' }
];

const flowSteps = [
  { step: 1, title: 'Data Collection', desc: 'Real-time XAU/USD price data from TradingView (1-min chart)' },
  { step: 2, title: 'Multi-Layer Analysis', desc: 'All 7 indicators are calculated with AI-powered filters' },
  { step: 3, title: 'Entry Validation', desc: 'Strict real-time validation against historical patterns since 2009' },
  { step: 4, title: 'Smart Exit Engine', desc: 'Adaptive trailing exits using ATR with profit locks' },
  { step: 5, title: 'Signal Delivery', desc: 'Alert sent to subscribers instantly via TradingView' }
];

const features = [
  { icon: '📊', title: 'Live Dashboard', desc: 'Real-time ROI stats, win/loss breakdowns, and heatmap by time' },
  { icon: '🤖', title: 'Auto-Bot Ready', desc: 'Supports both automated trading bots and manual execution' },
  { icon: '🔗', title: 'API Integration', desc: 'Cloud-based Auto-Bot with Capital.com support' },
  { icon: '🔒', title: 'Invite-Only', desc: 'Protected TradingView script for approved users only' }
];

function Strategy() {
  return (
    <div className="page">
      {/* Hero */}
      <section className="section text-center">
        <h1 className="section-title section-title-large">
          Ofer Waron  Gold Strategy
        </h1>
        <p className="section-subtitle">
          A proprietary, high-performance trading algorithm designed for short-term 
          gold trading (XAU/USD) on the 1-minute chart. Built with precision, backed 
          by data since 2009, and enhanced with AI-powered filters.
        </p>
      </section>

      {/* Core Principle */}
      <section className="section">
        <div className="card strategy-card">
          <h2 className="text-gold mb-2">💡 Core Principle</h2>
          <p className="strategy-principle">
            My strategy is built on <strong>multi-layered entry filters</strong> and 
            <strong> AI-powered validation</strong>. We combine MACD, bullish reversal candles, 
            RSI momentum, ATR flatness, volume spikes, VWAP distance, and EMA trend support 
            for consistent, high-probability entries.
          </p>
          <div className="strategy-rule-box">
            <strong>Smart Exit Engine:</strong> Adaptive trailing exits using ATR, 
            with profit locks and minimal drawdown strategy.
          </div>
        </div>
      </section>

      {/* Indicators */}
      <section className="section">
        <h2 className="section-title text-center">📊 The 7 Entry Filters</h2>
        <p className="section-subtitle text-center">Multi-layered analysis for high-probability setups</p>
        
        <div className="card-grid">
          {indicators.map((ind, i) => (
            <div key={i} className="card">
              <div className="indicator-header">
                <h3 className="indicator-name">{ind.name}</h3>
                <span className="indicator-weight">{ind.weight}</span>
              </div>
              <p className="indicator-desc">{ind.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Signal Flow */}
      <section className="section">
        <h2 className="section-title text-center">🔄 Signal Generation Flow</h2>
        
        <div className="signal-flow">
          {flowSteps.map((item, i) => (
            <div key={i} className="card signal-flow-item">
              <div className="signal-flow-step">{item.step}</div>
              <div className="signal-flow-content">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trading Rules */}
      <section className="section">
        <h2 className="section-title text-center">📋 Trading Rules</h2>
        <p className="section-subtitle text-center">Discipline is key to consistent profits</p>
        
        <div className="card-grid card-extra-wide">
          {rules.map((rule, i) => (
            <div key={i} className="card">
              <div className="rule-icon">{rule.icon}</div>
              <h3 className="rule-title">{rule.title}</h3>
              <p className="rule-desc">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <h2 className="section-title text-center">📦 Available Features</h2>
        
        <div className="card-grid card-extra-wide">
          {features.map((feature, i) => (
            <div key={i} className="card">
              <div className="rule-icon">{feature.icon}</div>
              <h3 className="rule-title">{feature.title}</h3>
              <p className="rule-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Performance */}
      <section className="section section-centered">
        <h2 className="section-title text-center">📈 Historical Performance</h2>
        <p className="section-subtitle text-center">Tested on thousands of trades since 2009</p>
        
        <div className="stats-grid stats-grid-centered">
          <div className="stat-card">
            <span className="stat-value">91.4%</span>
            <span className="stat-label">Trade Success Rate</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">200</span>
            <span className="stat-label">Max Points/Signal</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">&lt;5</span>
            <span className="stat-label">Max Loss Points</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">2025</span>
            <span className="stat-label">Backtested Since</span>
          </div>
        </div>
        
        {/* <p className="disclaimer text-center">
          ⚠️ Past performance does not guarantee future results. Trading involves risk. 
          This script is protected under intellectual property laws.
        </p> */}
      </section>

      {/* CTA */}
      <section className="section text-center">
        <h2 className="section-title">Ready to Trade with Us?</h2>
        <p className="section-subtitle">Get invite-only access to my signals and start your journey</p>
        <div className="btn-group">
          <Link to="/pricing" className="btn btn-primary btn-large">View Pricing →</Link>
          <Link to="/youtube" className="btn btn-secondary btn-large">Free Demonstrations</Link>
        </div>
      </section>

      {/* Legal */}
      <section className="section text-center">
        <p className="legal-notice">
          © Ofer Waron | All rights reserved.
        </p>
      </section>
    </div>
  );
}

export default Strategy;
