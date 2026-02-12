// ============================================
// App.js - 97% Gold Trading Platform
// All data fetched from Firebase siteData collection
// ============================================
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './styles/styles.css';
import './styles/responsive-overrides.css';
import SantaLogo from './assets/images/SantaLogo.jpg';
import { Analytics } from "@vercel/analytics/react";

// Page imports
import Home from './pages/Home';
import Strategy from './pages/Strategy';
import Pricing from './pages/Pricing';
import YouTube from './pages/YouTube';
import Contact from './pages/Contact';
import About from './pages/About';
import TradingDashboard from './pages/TradingDashboard';

// ✅ Firebase
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './services/firebase';

const LOADING_STATS = {
  dd: '...',
  winRate: '...',
  tradingwinRate: '...',
  tradingloseRate: '...',
  totalTrades: '...',
  profitFactor: '...',
  since: '...',
  subscribers: '...',
  targetProfit: '...',
  targetLoses: '...',
  assets: [],
  tagline: '...',
  totalLosestrading: 0,
  totalWiningTrading: 0,
  tradeViewChartImage: '', 
   tradeViewChartImages: [],
};

const LOADING_PERFORMANCE = {
  dd: '...',
  profitFactor: '...',
  tradeSuccessRate: '...',
  maxPointsPerSignal: '...',
  maxLossPoints: '...',
  backtestedSince: '...',
  experienceSince: '...',
  totalTrades: 0,
  totalWins: 0,
  totalLosses: 0,
  winRate: '...',
  lossRate: '...',
  maxConsecutiveWins: 0
};

const LOADING_OWNER = {
  contact: { email: '', whatsapp: '' },
  social: { youtube: '', tradingview: '' },
  youTubeids: []
};

const LOADING_CONFIG = {
  siteName: '97% Gold',
  tagline: 'Professional Gold Trading Strategy'
};

// ============================================
// TRADING STATS CONTEXT
// ============================================
const TradingStatsContext = createContext(null);

export const useTradingStats = () => {
  const context = useContext(TradingStatsContext);
  if (!context) {
    return { stats: LOADING_STATS, loading: true, error: null };
  }
  return context;
};

// ============================================
// PERFORMANCE HISTORY CONTEXT
// ============================================
const PerformanceHistoryContext = createContext(null);

export const usePerformanceHistory = () => {
  const context = useContext(PerformanceHistoryContext);
  if (!context) {
    return { performance: LOADING_PERFORMANCE, loading: true, error: null };
  }
  return context;
};

// ============================================
// OWNER DETAILS CONTEXT
// ============================================
const OwnerDetailsContext = createContext(null);

export const useOwnerDetails = () => {
  const context = useContext(OwnerDetailsContext);
  if (!context) {
    return {
      contact: LOADING_OWNER.contact,
      social: LOADING_OWNER.social,
      youTubeids: LOADING_OWNER.youTubeids,
      loading: true,
      error: null
    };
  }
  return context;
};

// ============================================
// SITE CONFIG CONTEXT
// ============================================
const SiteConfigContext = createContext(null);

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    return { config: LOADING_CONFIG, loading: true, error: null };
  }
  return context;
};

// ============================================
// COMBINED DATA PROVIDER
// ============================================
const FirebaseDataProvider = ({ children }) => {
  // Trading Stats State
  const [stats, setStats] = useState(LOADING_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Performance History State
  const [performance, setPerformance] = useState(LOADING_PERFORMANCE);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState(null);

  // Owner Details State
  const [contact, setContact] = useState(LOADING_OWNER.contact);
  const [social, setSocial] = useState(LOADING_OWNER.social);
  const [youTubeids, setYouTubeids] = useState(LOADING_OWNER.youTubeids);
  const [ownerLoading, setOwnerLoading] = useState(true);
  const [ownerError, setOwnerError] = useState(null);

  // Site Config State
  const [config, setConfig] = useState(LOADING_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    // ✅ LIVE listener: Trading Stats from siteData/tradingStats
    const tradingStatsRef = doc(db, 'siteData', 'tradingStats');

    const unsubTradingStats = onSnapshot(
      tradingStatsRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          console.error('No tradingStats document found in siteData!');
          setStatsError('Document not found');
          setStatsLoading(false);
          return;
        }

        const data = docSnap.data();
        console.log('Fetched trading stats (live):', data);
const images = Array.isArray(data.tradeViewChartImages)
  ? data.tradeViewChartImages.filter(Boolean)
  : [];

        // ✅ numeric inputs
        const totalTradesNum = Number(data.totalTrades ?? 0);
        const totalLosestradingNum = Number(data.totalLosestrading ?? 0);

        // ✅ WIN RATE based on trading losses
        const tradingwinRate =
          totalTradesNum > 0
            ? (((totalTradesNum - totalLosestradingNum) / totalTradesNum) * 100).toFixed(2) + '%'
            : '0.00';

        const tradingloseRate =
          totalTradesNum > 0
            ? ((1 - (totalTradesNum - totalLosestradingNum) / totalTradesNum) * 100).toFixed(2)
            : '0.00';

      setStats({
  winRate: data.winRate ? `${data.winRate}%` : '',
  tradingwinRate,
  tradingloseRate,
  totalTrades: totalTradesNum ? `${totalTradesNum}` : '',
  since: data.since || '',
  totalLosestrading: data.totalLosestrading,
  totalWiningTrading: data.totalWiningTrading,
  subscribers: data.subscribers ? `${data.subscribers}+` : '',
  assets: data.assets || [],
  tagline: data.tagline || '',
  targetProfit: data.targetProfit ? `${data.targetProfit}` : '',
  targetLoses: data.targetLoses ? `${data.targetLoses}` : '',
  dd: data.dd ? `${data.dd}%` : '',
  profitFactor: data.profitFactor ? `${Number(data.profitFactor).toFixed(2)}` : '',
  updatedAt: data.updatedAt || null,

  tradeViewChartImages: images,

  tradeViewChartImage: images[0] || '',
});
        setStatsLoading(false);
      },
      (err) => {
        console.error('Error listening to trading stats:', err);
        setStatsError(err.message);
        setStatsLoading(false);
      }
    );

    // Fetch Performance History from siteData/performanceHistory
    const fetchPerformanceHistory = async () => {
      try {
        const docRef = doc(db, 'siteData', 'performanceHistory');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Fetched performance history:', data);

          const totalWins = Number(data.totalWins) || 0;
          const maxConsecutiveWins = Number(data.maxConsecutiveWins) || 0;

          const totalLosses = Number(data.totalLosses) || 0;
          const totalTrades = totalWins + totalLosses;

          const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(2) : '0.00';
          const lossRate = totalTrades > 0 ? ((totalLosses / totalTrades) * 100).toFixed(2) : '0.00';

          const totalWinsPresnt =
            (data.maxProfit + data.totalLosses) > 0
              ? ((data.maxProfit / (data.maxProfit + data.totalLosses)) * 100).toFixed(2)
              : '0.00';

          setPerformance({
            tradeSuccessRate: winRate ? `${winRate}%` : '',
            maxPointsPerSignal: data.maxProfit?.toString() || '',
            maxLossPoints: data.maxLoss?.toString() || '',
            backtestedSince: data.backtestSince?.toString() || '',
            experienceSince: data.experienceSince?.toString() || '',
            asset: data.asset || '',
            timeframe: data.timeframe || '',
            totalTrades,
            totalWins,
            totalWinsPresnt: totalWinsPresnt ? `${totalWinsPresnt}%` : '',
            totalLosses,
            winRate,
            lossRate,
            maxConsecutiveWins,

            dd: data.dd != null ? `${data.dd}%` : '',
            profitFactor: data.profitFactor != null ? `${Number(data.profitFactor).toFixed(2)}` : '',

            updatedAt: data.lastUpdated || null
          });
        } else {
          console.error('No performanceHistory document found in siteData!');
          setPerformanceError('Document not found');
        }
      } catch (err) {
        console.error('Error fetching performance history:', err);
        setPerformanceError(err.message);
      } finally {
        setPerformanceLoading(false);
      }
    };

    // Fetch Owner Details from siteData/ownerDetails
    const fetchOwnerDetails = async () => {
      try {
        const docRef = doc(db, 'siteData', 'ownerDetails');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Fetched owner details:', data);

          if (data.contact) {
            setContact({
              email: data.contact.email || '',
              whatsapp: data.contact.whatsapp || ''
            });
          } else {
            setContact({
              email: data.email || '',
              whatsapp: data.whatsapp || ''
            });
          }

          if (data.social) {
            setSocial({
              youtube: data.social.youtube || '',
              tradingview: data.social.tradingview || ''
            });
          } else {
            setSocial({
              youtube: data.youtube || '',
              tradingview: data.tradingview || ''
            });
          }

          if (data.youTubeids && Array.isArray(data.youTubeids)) {
            setYouTubeids(data.youTubeids);
            console.log('Fetched YouTube IDs:', data.youTubeids);
          } else {
            setYouTubeids([]);
            console.log('No youTubeids array found in ownerDetails');
          }
        } else {
          console.error('No ownerDetails document found in siteData!');
          setOwnerError('Document not found');
        }
      } catch (err) {
        console.error('Error fetching owner details:', err);
        setOwnerError(err.message);
      } finally {
        setOwnerLoading(false);
      }
    };

    // Fetch Site Config from siteData/siteConfig (optional)
    const fetchSiteConfig = async () => {
      try {
        const docRef = doc(db, 'siteData', 'siteConfig');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Fetched site config:', data);

          setConfig({
            siteName: data.siteName || '97% Gold',
            tagline: data.tagline || 'Professional Gold Trading Strategy'
          });
        } else {
          console.log('No siteConfig document found, using defaults');
          setConfig(LOADING_CONFIG);
        }
      } catch (err) {
        console.error('Error fetching site config:', err);
        setConfigError(err.message);
      } finally {
        setConfigLoading(false);
      }
    };

    fetchPerformanceHistory();
    fetchOwnerDetails();
    fetchSiteConfig();

    // ✅ cleanup listener
    return () => {
      unsubTradingStats();
    };
  }, []);

  return (
    <TradingStatsContext.Provider value={{ stats, loading: statsLoading, error: statsError }}>
      <PerformanceHistoryContext.Provider value={{ performance, loading: performanceLoading, error: performanceError }}>
        <OwnerDetailsContext.Provider value={{ contact, social, youTubeids, loading: ownerLoading, error: ownerError }}>
          <SiteConfigContext.Provider value={{ config, loading: configLoading, error: configError }}>
            {children}
          </SiteConfigContext.Provider>
        </OwnerDetailsContext.Provider>
      </PerformanceHistoryContext.Provider>
    </TradingStatsContext.Provider>
  );
};

// ============================================
// SANTA LOGO WITH GLITTER + SHIMMER EFFECTS
// ============================================
const SantaLogoGlitter = ({ className = '' }) => {
  const glitters = Array.from({ length: 18 }, (_, i) => {
    const size = 2 + Math.random() * 4;
    return {
      key: i,
      style: {
        width: `${size}px`,
        height: `${size}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDuration: `${1.5 + Math.random() * 2}s`,
        animationDelay: `${Math.random() * 3}s`,
      },
    };
  });

  return (
    <span className={`logo-container logo-glitter-field ${className}`}>
      <img src={SantaLogo} className="app-logo" alt="97% Gold Logo" />
      <span className="glitter-layer" aria-hidden="true">
        {glitters.map(g => (
          <span key={g.key} className="glitter" style={g.style} />
        ))}
      </span>
      <span className="shimmer-layer" aria-hidden="true">
        <span className="shimmer-sweep" />
      </span>
    </span>
  );
};

// ============================================
// HEADER COMPONENT
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
      <NavLink to="/" className="header-logo-link" aria-label="Go to home">
        <SantaLogoGlitter className="header-logo-glitter" />
      </NavLink>

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

      <button
        className="mobile-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

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

// ============================================
// FOOTER COMPONENT
// ============================================
const Footer = () => {
  const { stats } = useTradingStats();
  const { performance } = usePerformanceHistory();
  const { contact, social } = useOwnerDetails();
  const { config } = useSiteConfig();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            <span className="logo-container logo-glitter-field footer-logo-glitter">
              <img src={SantaLogo} className="footer-logo-image" alt="97% Gold Logo" />
              <span className="glitter-layer" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => {
                  const size = 1.5 + Math.random() * 2.5;
                  return (
                    <span key={i} className="glitter" style={{
                      width: `${size}px`, height: `${size}px`,
                      top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                      animationDuration: `${1.5 + Math.random() * 2}s`,
                      animationDelay: `${Math.random() * 3}s`,
                    }} />
                  );
                })}
              </span>
              <span className="shimmer-layer" aria-hidden="true">
                <span className="shimmer-sweep" />
              </span>
            </span>
            <h3 className="footer-brand-title">{config.siteName}</h3>
          </div>
          <p className="footer-tagline">{stats.tagline || config.tagline}</p>
          <p className="footer-since">Trading since {performance.experienceSince}</p>
        </div>

        <div className="footer-section">
          <h4 className="footer-section-heading">Quick Links</h4>
          <NavLink to="/" className="footer-link">Home</NavLink>
          <NavLink to="/strategy" className="footer-link">Strategy</NavLink>
          <NavLink to="/pricing" className="footer-link">Pricing</NavLink>
          <NavLink to="/youtube" className="footer-link">YouTube</NavLink>
        </div>

        <div className="footer-section">
          <h4 className="footer-section-heading">Connect</h4>
          {social.youtube && (
            <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="footer-link">
              📺 YouTube
            </a>
          )}
          {contact.whatsapp && (
            <a
              href={`https://wa.me/${contact.whatsapp.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              💬 WhatsApp
            </a>
          )}
          {contact.email && (
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}&su=Contact%20from%20Website`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              ✉️ Email
            </a>
          )}
        </div>

        <div className="footer-section">
          <h4 className="footer-section-heading">Legal</h4>
          <NavLink to="/about" className="footer-link">About Me</NavLink>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Ofer Waron | All Rights Reserved</p>
      </div>
    </footer>
  );
};

// ============================================
// MAIN APP
// ============================================
function App() {
  return (
    <FirebaseDataProvider>
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
        </div>
        <Analytics />
      </HashRouter>
    </FirebaseDataProvider>
  );
}

export default App;