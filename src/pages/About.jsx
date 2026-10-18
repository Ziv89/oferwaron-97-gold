// ============================================
// About.jsx - Single shared container, content crossfades
// Coin stays right side with float animation
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';

import CTA from '../info/CTA';
import DirectCTA from '../info/directCTA';

import goldenCoin from '../assets/images/goldenface.png';

function About() {
  const [showDirectCTA, setShowDirectCTA] = useState(false);

  const handleCoinClick = () => {
    setShowDirectCTA(prev => !prev);
  };

  const values = [
    { icon: '🔒', title: 'Transparency', desc: 'All of my trades are documented. What you see is what you get.' },
    { icon: '📚', title: 'Education', desc: "I don't just give signals - I teach you why they work." },
    { icon: '🤝', title: 'Community', desc: "My success is measured by my members' success." }
  ];

  const coinClass = showDirectCTA
    ? 'gold-coin-icon coin-right coin-active'
    : 'gold-coin-icon coin-right coin-float';

  return (
    <div className="strategy-page">
      <Seo
        title="About — 97% Gold"
        description="Meet Ofer Waron, the trader behind 97% Gold's XAUUSD signals, and the values driving the strategy."
        path="/about"
      />

      <section className="about-hero-container">

        {/* Title — always visible, outside the container */}
        <h1 className="highlight-title get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            About Me &amp; Professional Summary
          </span>
        </h1>

        {/* Panel wrapper — holds the shared container + coin */}
        <div className="about-panels-wrapper">

          <img
            src={goldenCoin}
            alt="Golden Coin"
            className={coinClass}
            onClick={handleCoinClick}
          />

          {/* Single shared container — both faces stacked */}
          <div className="about-panel-container">

            {/* Face 1: CTA */}
            <div className={`about-panel-face face-cta ${showDirectCTA ? 'face-hidden' : 'face-visible'}`}>
              <CTA />
            </div>

            {/* Face 2: DirectCTA */}
            <div className={`about-panel-face face-direct ${showDirectCTA ? 'face-visible' : 'face-hidden'}`}>
              <DirectCTA />
            </div>

          </div>
        </div>
      </section>

      {/* Values */}
      <section className="strategy-section">
        <h2 className="strategy-section-title text-center">What drives everything</h2>
        <div className="strategy-card-grid">
          {values.map((value, i) => (
            <div key={i} className="strategy-rule-card">
              <div className="strategy-rule-icon">{value.icon}</div>
              <h3 className="strategy-rule-title">{value.title}</h3>
              <p className="strategy-rule-desc">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="strategy-section text-center">
        <h2 className="strategy-section-title">Ready to Join?</h2>
        <p className="strategy-subtitle">Start your trading with a proven gold strategy</p>
        <div className="strategy-btn-group">
          <Link to="/pricing" className="strategy-btn strategy-btn-primary">View Pricing</Link>
          <Link to="/contact" className="strategy-btn strategy-btn-primary">Contact Me</Link>
        </div>
      </section>
    </div>
  );
}

export default About;
