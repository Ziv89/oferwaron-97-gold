// ============================================
// App.js - 97% Gold Trading Platform
// Combined with App2 visual style
// ============================================
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './styles/styles.css';
import imageLogo from './assets/images/logo.jpg';
import SantaLogo from './assets/images/SantaLogo.jpg';


import Home from './pages/Home';
import Strategy from './pages/Strategy';
import Pricing from './pages/Pricing';
import YouTube from './pages/YouTube';
import Contact from './pages/Contact';
import About from './pages/About';
import TradingDashboard from './pages/TradingDashboard';

export const CONFIG = {
  siteName: '97% Gold',
  tagline: 'Professional Gold Trading Strategy',
  
  // Contact Info
  contact: {
    email: 'oferwv123@gmail.com',
    whatsapp: '+972526625716',
    phone: '+972-52-662-5716'
  },
  
  // Social Links
  social: {
    youtube: 'https://www.youtube.com/@Oferwv',
    tradingview: 'https://www.tradingview.com/u/oferwv/'
  },
  
  // YouTube Configuration
  youtube: {
    channelId: 'UC_REPLACE_WITH_REAL_ID',
    channelName: 'OferWaron97Gold',
    featuredVideos: [
      { id: 'VIDEO_ID_1', title: 'How the Strategy Works', desc: 'Complete breakdown' },
      { id: 'VIDEO_ID_2', title: 'Live Trading Session', desc: 'Watch real trades' },
      { id: 'VIDEO_ID_3', title: 'Weekly Analysis', desc: 'Market overview' },
      { id: 'VIDEO_ID_4', title: 'Risk Management', desc: 'Protect your capital' },
      { id: 'VIDEO_ID_5', title: 'Getting Started', desc: 'Tutorial for beginners' },
      { id: 'VIDEO_ID_6', title: 'Monthly Results', desc: 'Performance review' }
    ]
  },
  
  // Trading Stats
  stats: {
    winRate: '91.4%',
    totalTrades: '120+',
    since: '2025',
    subscribers: '20+'
  },
  
  // Pricing
  pricing: {
    free: { price: 0, signals: 'Limited', features: ['Email signals', 'Weekly analysis'] },
    pro: { price: 97, signals: 'All', features: ['Real-time signals', 'WhatsApp alerts', 'Priority support'] },
    vip: { price: 297, signals: 'All + VIP', features: ['Everything in Pro', '1-on-1 calls', 'Custom strategies'] }
  }
};

// ============================================
// HEADER COMPONENT (App2 Style)
// ============================================
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/strategy', label: 'Strategy' },
    { to: '/trading', label: 'Live Trading' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/youtube', label: 'YouTube' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' }
  ];

  return (
    <header className="app-header">
      {/* Large Centered Logo */}
      <NavLink to="/" className="logo-container">
        <img src={SantaLogo} className="app-logo swing" alt="97% Gold Logo" />
      </NavLink>

      {/* Navigation Below Logo */}
      <nav className="app-nav">
        {navLinks.map(link => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Mobile Toggle */}
      <button 
        className="mobile-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav className="nav-mobile">
          {navLinks.map(link => (
            <NavLink 
              key={link.to}
              to={link.to} 
              className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
};



const Footer = () => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-section">
        <div className="footer-logo">
          <img src={imageLogo} className="footer-logo-image" alt="97% Gold Logo" />
          <h3>{CONFIG.siteName}</h3>
        </div>
        <p>{CONFIG.tagline}</p>
        <p>Trading since {CONFIG.stats.since}</p>
      </div>

      <div className="footer-section">
        <h4>Quick Links</h4>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/strategy">Strategy</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/youtube">YouTube</NavLink>
      </div>

      <div className="footer-section">
        <h4>Connect</h4>
        <a href={CONFIG.social.youtube} target="_blank" rel="noopener noreferrer">📺 YouTube</a>
        <a href={`https://wa.me/${CONFIG.contact.whatsapp.replace('+', '')}`} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
<a href="https://mail.google.com/mail/?view=cm&fs=1&to=oferwv123@gmail.com&su=Contact%20from%20Website" 
   target="_blank">
  ✉️ Email
</a>
      </div>

      <div className="footer-section">
        <h4>Legal</h4>
        <NavLink to="/about">About Me</NavLink>
        {/* <p className="footer-disclaimer">⚠️ Trading involves risk. Past performance doesn't guarantee future results.</p> */}
      </div>
    </div>

    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} Ofer Waron & Luciana Goldman | All Rights Reserved</p>
    </div>
  </footer>
);

// ============================================
// FLOATING BUTTONS
// ============================================
const FloatingButtons = () => (
  <div className="floating-buttons">
    <a 
      href={`https://wa.me/${CONFIG.contact.whatsapp.replace('+', '')}`}
      target="_blank" 
      rel="noopener noreferrer"
      className="floating-btn whatsapp"
      title="Chat on WhatsApp"
    >
      💬
    </a>
    <a 
      href={CONFIG.social.youtube}
      target="_blank" 
      rel="noopener noreferrer"
      className="floating-btn youtube"
      title="YouTube Channel"
    >
      📺
    </a>
  </div>
);

// ============================================
// MAIN APP
// ============================================
function App() {
  return (
    <HashRouter>
      <div className="app">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/strategy" element={<Strategy />} />
            <Route path="/trading" element={<TradingDashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/youtube" element={<YouTube />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        {/* <FloatingButtons /> */}
      </div>
    </HashRouter>
  );
}

export default App;
