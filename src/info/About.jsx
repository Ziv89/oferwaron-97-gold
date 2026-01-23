// ============================================
// About.jsx - Combined About Page with Interactive CTA
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import CTA from '../info/CTA';
import DirectCTA from '../info/directCTA';
import goldenCoin from '../images/goldenface.png';
import oferBlack from '../images/`oferBlack.jpg';


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
    { icon: '🎯', title: 'Accuracy First', desc: 'We never sacrifice quality for quantity. Every signal meets strict criteria.' },
    { icon: '🔒', title: 'Transparency', desc: 'All our trades are documented. What you see is what you get.' },
    { icon: '📚', title: 'Education', desc: "We don't just give signals - we teach you why they work." },
    { icon: '🤝', title: 'Community', desc: "Our success is measured by our members' success." }
  ];

  const team = [
    { 
      name: 'Ofer Waron', 
      role: 'Lead Strategist & Founder', 
      bio: '15+ years trading experience. Developer of the 97% Gold strategy.',
      avatar: '👨‍💼'
    },
    { 
      name: 'Luciana Goldman', 
      role: 'Operations & Community', 
      bio: 'Managing member relations and ensuring top-tier support experience.',
      avatar: '👩‍💼'
    }
  ];

  return (
    <div className="page">
      {/* Interactive Hero Section with Gold Coin */}
      <section className="about-container">
        <img
          src={goldenCoin}
          alt="Golden Coin"
          className={`gold-coin-icon ${showDirectCTA ? 'move-left' : ''}`}
          data-tooltip-id="gold-coin-tooltip"
          data-tooltip-content="Press for more details"
          onClick={handleCoinClick}
        />
        <Tooltip id="gold-coin-tooltip" />

        <div className="about-content">
          <h1 className="highlight-title">📊 Ofer Waron 97%Gold</h1>
          <h3 className="highlight-subtitle">
            — A Precision Algorithmic Trading Strategy combining smart exits, high win rate, and no take-profit cap.
            Designed for serious investors seeking smart and transparent trading solutions.
          </h3>

          <div className={`cta-slide-container ${showDirectCTA ? 'slide-left' : ''}`}>
            <CTA />
          </div>
        </div>

        <div className={`direct-cta-panel ${showDirectCTA ? 'show-direct' : ''}`}>
          <DirectCTA />
        </div>
      </section>

      {/* Our Story */}
      <section className="section">
        <div className="card-wide">
          <h2 className="section-title">📖 Our Story</h2>
          <div className="card mt-3">
            <p className="story-text">
              Our journey began in 2010 when Ofer started trading Gold during the financial crisis. 
              Like many traders, he experienced the highs of winning trades and the lows of devastating losses. 
              But unlike most, he refused to accept that trading was just gambling.
            </p>
            <p className="story-text">
              After years of studying technical analysis, testing hundreds of indicators, and 
              analyzing thousands of trades, a pattern emerged. Not a single indicator worked 
              reliably - but a <strong>combination</strong> of 
              indicators, when aligned correctly, showed remarkable consistency.
            </p>
            <p className="story-text">
              This discovery led to the development of our multi-layer confluence strategy. 
              By requiring 5 out of 6 indicators to agree before entering a trade, we dramatically 
              reduced false signals and achieved the 97% win rate that we're known for today.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <h2 className="section-title text-center">📅 Our Journey</h2>
        
        <div className="timeline">
          {timeline.map((item, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-year">{item.year}</div>
              <div className="card timeline-content">
                <p>{item.event}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <h2 className="section-title text-center">💎 Our Values</h2>
        <p className="section-subtitle text-center">What drives everything we do</p>
        
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
        <h2 className="section-title text-center">👥 Meet the Team</h2>
        
        <div className="team-grid">
          {team.map((member, i) => (
            <div key={i} className="card team-card">
              <div className="team-avatar">{member.avatar}</div>
              <h3 className="team-name">{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-bio">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk Disclaimer */}
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
      </section>

      {/* CTA */}
      <section className="section text-center">
        <h2 className="section-title">Ready to Join Us?</h2>
        <p className="section-subtitle">Start your trading journey with a proven strategy</p>
        <div className="btn-group">
          <Link to="/pricing" className="btn btn-primary btn-large">View Pricing →</Link>
          <Link to="/contact" className="btn btn-secondary btn-large">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}

export default About;
