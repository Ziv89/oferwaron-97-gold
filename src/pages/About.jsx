// ============================================
// About.jsx - Combined About Page with Interactive CTA
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

import CTA from '../info/CTA';
import DirectCTA from '../info/directCTA';

import goldenCoin from '../assets/images/goldenface.png';
import oferBlack from '../assets/images/oferBlack.jpg';

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



  return (
    <div className="strategy-page">
      <section className="about-hero-container">
        
        {/* Gold Coin */}
<img
  src={goldenCoin}
  alt="Golden Coin"
  className={`gold-coin-icon ${showDirectCTA ? 'coin-active' : ''}`}
  data-tooltip-id="gold-coin-tooltip"
  // data-tooltip-content={showDirectCTA ? 'Click to close' : 'Click to view'}
  // data-tooltip-place={showDirectCTA ? 'right' : 'right'}
  // data-tooltip-offset={-200}
  onClick={handleCoinClick}
/>

        {/* Tooltip */}
        <Tooltip id="gold-coin-tooltip" />

        {/* Main Content Panel */}
        <div className={`about-main-panel ${showDirectCTA ? 'panel-hidden' : ''}`}>
          <div className="about-hero-content">
<h1 className="highlight-title get-in-touch-title get-in-touch-title--shimmer">
  <span className="get-in-touch-shimmer">
    About Me & Professional Summary
  </span>
</h1>
            <CTA />
          </div>
        </div>

        {/* Direct CTA Panel */}
        <div className={`about-detail-panel ${showDirectCTA ? 'panel-visible' : ''}`}>
          <div className="about-hero-content">
            {/* <h1 className="highlight-title">About Me & Professional Summary</h1> */}
            <DirectCTA />
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
