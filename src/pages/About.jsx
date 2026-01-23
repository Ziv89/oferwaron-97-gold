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

  const timeline = [
    { year: '2010', event: 'Started trading Gold and commodities' },
    { year: '2015', event: 'Developed the core strategy algorithm' },
    { year: '2018', event: 'Achieved consistent 90%+ win rate' },
    { year: '2020', event: 'Launched signal service for subscribers' },
    { year: '2023', event: 'Refined to 97% accuracy on Gold' },
    { year: '2024', event: 'Expanded to Natural Gas markets' }
  ];

  const values = [
    // { icon: '🎯', title: 'Accuracy First', desc: 'We never sacrifice quality for quantity. Every signal meets strict criteria.' },
    { icon: '🔒', title: 'Transparency', desc: 'All of my trades are documented. What you see is what you get.' },
    { icon: '📚', title: 'Education', desc: "I don't just give signals - we teach you why they work." },
    { icon: '🤝', title: 'Community', desc: "My success is measured by our members' success." }
  ];

  const team = [
    { 
      name: 'Ofer Waron', 
      role: 'Lead Strategist & Founder', 
      bio: '16+ years of trading experience. Strategy architect behind the 91.4% Gold investment strategy',
      avatar: oferBlack
    }
  ];

  return (
    <div className="page">
      {/* Interactive Hero Section with Gold Coin Slide */}
      <section className="about-hero-container">
        {/* Gold Coin - Click to toggle panels */}
        <img
          src={goldenCoin}
          alt="Golden Coin"
          className={`gold-coin-icon ${showDirectCTA ? 'coin-active' : ''}`}
          data-tooltip-id="gold-coin-tooltip"
          data-tooltip-content={showDirectCTA ? "Back to About" : "Press for more details"}
          onClick={handleCoinClick}
        />
        <Tooltip id="gold-coin-tooltip" place="left" />

        {/* Main Content Panel (CTA) - slides out when coin clicked */}
        <div className={`about-main-panel ${showDirectCTA ? 'panel-hidden' : ''}`}>
          <div className="about-hero-content">
            <h1 className="highlight-title">📊 Ofer Waron Gold</h1>
            <p className="highlight-subtitle">
              — A Precision Algorithmic Trading Strategy combining smart exits, high win rate, and no take-profit cap.
              Designed for serious investors seeking smart and transparent trading solutions.
            </p>
            <CTA />
          </div>
        </div>

        {/* Direct CTA Panel - slides in when coin clicked */}
        <div className={`about-detail-panel ${showDirectCTA ? 'panel-visible' : ''}`}>
          <DirectCTA />
        </div>
      </section>



      {/* Values */}
      <section className="section">
        <h2 className="section-title text-center">What drives everything</h2>
        {/* <p className="section-subtitle text-center">What drives everything we do</p> */}
        
        <div className="card-grid card-extra-wide">
          {values.map((value, i) => (
            <div key={i} className="card">
              <div className="value-icon">{value.icon}</div>
              <h3 className="value-title">{value.title}</h3>
              <p className="value-desc">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <h2 className="section-title text-center">Contact Me</h2>
        
        <div className="team-grid">
          {team.map((member, i) => (
            <div key={i} className="card team-card">
              <div className="team-avatar">
                <img src={member.avatar} alt={member.name} className="team-avatar-img" />
              </div>
              <h3 className="team-name">{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-bio">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk Disclaimer
      <section className="section">
        <div className="card card-wide risk-disclaimer">
          <h3 className="risk-disclaimer-title">⚠️ Risk Disclaimer</h3>
          <p className="risk-disclaimer-text">
            Trading foreign exchange, commodities, and other financial instruments carries a high level of risk 
            and may not be suitable for all investors. The high degree of leverage can work against you as 
            well as for you. Before deciding to trade, you should carefully consider your investment objectives, 
            level of experience, and risk appetite. The possibility exists that you could sustain a loss of some 
            or all of your initial investment; therefore, you should not invest money that you cannot afford to lose.
          </p>
          <p className="risk-disclaimer-text">
            Past performance is not indicative of future results. Our 97% win rate is based on historical data 
            and should not be construed as a guarantee of future performance.
          </p>
        </div>
      </section> */}

      {/* CTA */}
      <section className="section text-center">
        <h2 className="section-title">Ready to Join?</h2>
        <p className="section-subtitle">Start your trading with a proven golden strategy</p>
        <div className="btn-group">
          <Link to="/pricing" className="btn btn-primary btn-large">View Pricing </Link>
          <Link to="/contact" className="btn btn-secondary btn-large">Contact Me</Link>
        </div>
      </section>
    </div>
  );
}

export default About;
