import React, { useState } from 'react'; 
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import './aboutme.css';
import CTA from '../info/CTA';
import DirectCTA from '../info/directCTA';
import goldenCoin from '../images/goldenface.png';

function AboutMe() {
  const [showDirectCTA, setShowDirectCTA] = useState(false);

  const handleCoinClick = () => {
    setShowDirectCTA(prev => !prev);
  };

  return (
    <div className="about-container">
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
        <h1 className="highlight-title">🔷 Ofer Waron 97%Gold</h1>
        <h3 className="highlight-subtitle">
          – A Precision Algorithmic Trading Strategy combining smart exits, high win rate, and no take-profit cap.
          Designed for serious investors seeking smart and transparent trading solutions.
        </h3>

        <div className={`cta-slide-container ${showDirectCTA ? 'slide-left' : ''}`}>
          <CTA />
        </div>
      </div>

      <div className={`direct-cta-panel ${showDirectCTA ? 'show-direct' : ''}`}>
        <DirectCTA />
      </div>
    </div>
  );
}

export default AboutMe;
