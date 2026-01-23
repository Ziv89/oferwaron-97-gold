// ============================================
// Home.jsx - Landing Page (No inline styles)
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONFIG } from '../App';

// TradingView Widget Component - Using iframe for stability
const TradingViewWidget = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const widgetConfig = {
    autosize: true,
    symbol: "OANDA:XAUUSD",
    interval: "60",
    timezone: "Asia/Jerusalem",
    theme: "dark",
    style: "1",
    locale: "en",
    enable_publishing: false,
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    calendar: false,
    allow_symbol_change: true,
    support_host: "https://www.tradingview.com"
  };

  // Build the TradingView embed URL
  const embedUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(widgetConfig.symbol)}&interval=${widgetConfig.interval}&theme=${widgetConfig.theme}&style=${widgetConfig.style}&timezone=${encodeURIComponent(widgetConfig.timezone)}&locale=${widgetConfig.locale}&enable_publishing=0&hide_top_toolbar=0&hide_legend=0&save_image=0&calendar=0&allow_symbol_change=1`;

  if (hasError) {
    return (
      <div className="chart-container chart-error">
        <div className="chart-error-content">
          <p>Chart temporarily unavailable</p>
          <a 
            href="https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD" 
            target="_blank" 
            rel="noopener noreferrer"
            className="chart-link"
          >
            View on TradingView
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container chart-wrapper">
      {!isLoaded && (
        <div className="chart-loading">
          Loading chart...
        </div>
      )}
      <iframe
        title="TradingView Gold Chart"
        src={embedUrl}
        className={`chart-iframe ${isLoaded ? 'loaded' : ''}`}
        allowFullScreen
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

// Testimonial Data
const testimonials = [
  { name: 'David M.', location: 'Tel Aviv', profit: '+₪45,000', text: 'The signals are incredibly accurate. Best investment decision I made.' },
  { name: 'Sarah K.', location: 'New York', profit: '+$12,500', text: 'Finally, a trading service that delivers on its promises.' },
  { name: 'James L.', location: 'London', profit: '+£8,200', text: 'The risk management alone is worth the subscription.' }
];

function Home() {
  return (
    <div className="page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content animate-in">
          <h1 className="hero-title">
            Trade Gold with <span className="highlight">{CONFIG.stats.winRate}</span> Accuracy
          </h1>
          <p className="hero-subtitle">
            Professional algorithmic trading signals for XAUUSD & Natural Gas. 
            Join {CONFIG.stats.subscribers} traders who trust our proven strategy since {CONFIG.stats.since}.
          </p>
          
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{CONFIG.stats.winRate}</span>
              <span className="stat-label">Win Rate</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{CONFIG.stats.totalTrades}</span>
              <span className="stat-label">Total Trades</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{CONFIG.stats.since}</span>
              <span className="stat-label">Since</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{CONFIG.stats.subscribers}</span>
              <span className="stat-label">Subscribers</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="btn-group">
            <Link to="/pricing" className="btn btn-primary btn-large">
              Start Trading Now
            </Link>
            <Link to="/youtube" className="btn btn-secondary btn-large">
              Watch Free Content
            </Link>
          </div>
        </div>
      </section>

      {/* Live Chart Section */}
      <section className="section">
        <h2 className="section-title text-center">Live Gold Chart</h2>
        <p className="section-subtitle text-center">Real-time XAUUSD price from TradingView</p>
        <TradingViewWidget />
      </section>

      {/* How It Works */}
      <section className="section">
        <h2 className="section-title text-center">How It Works</h2>
        <p className="section-subtitle text-center">Simple 3-step process to start earning</p>
        
        <div className="card-grid">
          <div className="card how-it-works-card">
            <div className="how-it-works-number">1</div>
            <h4 className="how-it-works-title">Subscribe</h4>
            <p className="how-it-works-desc">
              Subscribe to a dedicated plan and get instant access to my trading signals.
            </p>
          </div>
          <div className="card how-it-works-card">
            <div className="how-it-works-number">2</div>
            <h4 className="how-it-works-title">Receive Signals</h4>
            <p className="how-it-works-desc">
              Get real-time alerts via WhatsApp.
            </p>
          </div>
          <div className="card how-it-works-card">
            <div className="how-it-works-number">3</div>
            <h4 className="how-it-works-title">Execute & Profit</h4>
            <p className="how-it-works-desc">
              Follow the signals with your broker. Clear entry, exit & stop-loss.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {/* <section className="section">
        <h2 className="section-title text-center">What Traders Say</h2>
        <p className="section-subtitle text-center">Real results from real subscribers</p>
        
        <div className="card-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="card testimonial-card">
              <div className="testimonial-header">
                <div>
                  <span className="testimonial-name">{t.name}</span>
                  <span className="testimonial-location">{t.location}</span>
                </div>
                <span className="testimonial-profit">{t.profit}</span>
              </div>
              <p className="testimonial-text">"{t.text}"</p>
            </div>
          ))}
        </div>
      </section> */}

      {/* Final CTA */}
      <section className="section section-cta text-center">
        <h2 className="section-title">Ready to Start Trading?</h2>
        <p className="section-subtitle">Join {CONFIG.stats.subscribers} successful traders today</p>
        <Link to="/pricing" className="btn btn-primary btn-large">
          View Pricing Plan
        </Link>
      </section>
    </div>
  );
}

export default Home;
