// ============================================
// CoinLoader.jsx - spinning gold coin with the logo on both faces
// Used while images are loading (see PerformanceReport.jsx)
// ============================================
import React from 'react';
import SantaLogo from '../assets/images/SantaLogoNew.webp';

// Positions are relative to the coin box; scale is relative to the coin size
const SPARKLES = [
  { x: '-14%', y: '6%',  scale: 0.22, delay: '0s' },
  { x: '96%',  y: '-8%', scale: 0.28, delay: '0.4s' },
  { x: '104%', y: '62%', scale: 0.18, delay: '0.9s' },
  { x: '-6%',  y: '78%', scale: 0.24, delay: '1.3s' },
  { x: '44%',  y: '-22%', scale: 0.16, delay: '0.7s' },
  { x: '52%',  y: '104%', scale: 0.2, delay: '1.6s' },
];

export default function CoinLoader({ label = 'Loading…', size = 96, overlay = false }) {
  return (
    <div
      className={`coin-loader ${overlay ? 'coin-loader--overlay' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="coin-stage" style={{ '--coin-size': `${size}px` }}>
        <div className="coin">
          <div className="coin-face coin-face--front">
            <img src={SantaLogo} alt="" draggable="false" />
            <span className="coin-shine" />
          </div>
          <div className="coin-face coin-face--back">
            <img src={SantaLogo} alt="" draggable="false" />
            <span className="coin-shine" />
          </div>
        </div>

        {/* Sparkles sit outside the coin so they twinkle in place while it flips */}
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="coin-sparkle"
            aria-hidden="true"
            style={{
              left: s.x,
              top: s.y,
              fontSize: `calc(var(--coin-size) * ${s.scale})`,
              animationDelay: s.delay,
            }}
          >
            ✦
          </span>
        ))}
      </div>
      {label && <p className="coin-loader-label">{label}</p>}
    </div>
  );
}
