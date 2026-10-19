// ============================================
// App.js - 97% Gold Trading Platform
// All data fetched from Firebase siteData collection
// ============================================
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './styles/styles.css';
import './styles/responsive-overrides.css';
// To revert to the old logo: import SantaLogoNew from './assets/images/SantaLogo.jpg';
import SantaLogoNew from './assets/images/SantaLogoNew.webp';
import { Analytics } from "@vercel/analytics/react";

// Page imports
import Home from './pages/Home';
import Strategy from './pages/Strategy';
import Pricing from './pages/Pricing';
import YouTube from './pages/YouTube';
import Contact from './pages/Contact';
import About from './pages/About';
import TradingDashboard from './pages/TradingDashboard';
import Login from './pages/Login';
import Members from './pages/Members';
import Core from './pages/Core';
import LiveStream from './pages/LiveStream';

// Auth
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// ✅ Firebase
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './services/firebase';
import { log } from './utils/logger';

const SantaLogo = SantaLogoNew; 
const LOADING_STATS = {
  dd: '...',
  tradingwinRate: '...',
  tradingloseRate: '...',
  totalTrades: '...',
  pnl: 0,
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
  maxPointsPerSignal: '...',
  maxLossPoints: '...',
  backtestedSince: '...',
  experienceSince: '...',
  totalTrades: 0,
  totalWins: 0,
  totalLosses: 0,
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
        log('Fetched trading stats (live):', data);
const images = Array.isArray(data.tradeViewChartImages)
  ? data.tradeViewChartImages.filter(Boolean)
  : [];

        // ✅ numeric inputs
        const totalTradesNum = Number(data.totalTrades ?? 0);
        const totalLosestradingNum = Number(data.totalLosestrading ?? 0);

        // ✅ WIN RATE based on trading losses
        const tradingwinRate =
          totalTradesNum > 0
            ? (((totalTradesNum - totalLosestradingNum) / totalTradesNum) * 100).toFixed(2)
            : '0.00';

        const tradingloseRate =
          totalTradesNum > 0
            ? ((1 - (totalTradesNum - totalLosestradingNum) / totalTradesNum) * 100).toFixed(2)
            : '0.00';

      setStats({
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
  pnl: data.pnl != null ? `${Number(data.pnl).toFixed(2)}%` : '0.00',
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
          log('Fetched performance history:', data);

          const totalWins = Number(data.totalWins) || 0;
          const maxConsecutiveWins = Number(data.maxConsecutiveWins) || 0;

          const totalLosses = Number(data.totalLosses) || 0;
          const totalTrades = totalWins + totalLosses;

          // Win rate is not computed here — stats.tradingwinRate (from the
          // tradingStats document) is the single source of truth sitewide,
          // so this document doesn't maintain a second, independent formula
          // that can drift out of sync with it.

          setPerformance({
            maxPointsPerSignal: data.maxProfit?.toString() || '',
            maxLossPoints: data.maxLoss?.toString() || '',
            backtestedSince: data.backtestSince?.toString() || '',
            experienceSince: data.experienceSince?.toString() || '',
            asset: data.asset || '',
            timeframe: data.timeframe || '',
            totalTrades,
            totalWins,
            totalLosses,
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
          log('Fetched owner details:', data);

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
            log('Fetched YouTube IDs:', data.youTubeids);
          } else {
            setYouTubeids([]);
            log('No youTubeids array found in ownerDetails');
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
          log('Fetched site config:', data);

          setConfig({
            siteName: data.siteName || '97% Gold',
            tagline: data.tagline || 'Professional Gold Trading Strategy'
          });
        } else {
          log('No siteConfig document found, using defaults');
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
// HEADER COMPONENT
// ============================================
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✨ Effect #7: Glitter + Shimmer Hybrid
  const [glitters, setGlitters] = useState([]);

  useEffect(() => {
    const COUNT = 28;
    const dots = Array.from({ length: COUNT }, (_, i) => {
      const size = 3 + Math.random() * 3;
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        delay: Math.random() * 3,
        duration: 0.8 + Math.random() * 0.8,
      };
    });
    setGlitters(dots);
  }, []);

  const { user, logout } = useAuth();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/strategy', label: 'Strategy' },
    { to: '/trading', label: 'Live Trading' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/youtube', label: 'YouTube' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    user
      ? { to: '/members', label: 'My Account', member: true }
      : { to: '/login', label: 'Member Login', member: true }
  ];

  return (
    <header className="app-header">
      <NavLink to="/" className="logo-container logo-glitter-field" aria-label="Go to home">
        {/* Layer 1: Shimmer sweep (below logo) */}
        <div className="shimmer-layer" aria-hidden="true">
          <div className="shimmer-sweep" />
        </div>

        {/* Layer 2: Glitter dots (above logo) */}
        <div className="glitter-layer" aria-hidden="true">
          {glitters.map(g => (
            <span
              key={g.id}
              className="glitter"
              style={{
                left: `${g.x}%`,
                top: `${g.y}%`,
                width: `${g.size}px`,
                height: `${g.size}px`,
                animationDelay: `${g.delay}s`,
                animationDuration: `${g.duration}s`,
              }}
            />
          ))}
        </div>

        <img src={SantaLogo} className="app-logo" alt="97% Gold Logo" />
      </NavLink>

      <nav className="app-nav">
        <div className="account-nav-group">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''} ${link.member ? 'nav-member' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}

          {user && (
            <button
              type="button"
              className="nav-signout"
              onClick={logout}
            >
              Sign out
            </button>
          )}
        </div>
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
              className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''} ${link.member ? 'nav-member' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          {user && (
            <button
              type="button"
              className="nav-signout nav-signout-mobile"
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
            >
              Sign out
            </button>
          )}
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
            <img src={SantaLogo} className="footer-logo-image" alt="97% Gold Logo" loading="lazy" />
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
      <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <main className="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/strategy" element={<Strategy />} />
              <Route
                path="/trading"
                element={
                  <ProtectedRoute>
                    <TradingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/youtube" element={<YouTube />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/members"
                element={
                  <ProtectedRoute>
                    <Members />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/core"
                element={
                  <ProtectedRoute requireActive>
                    <Core />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/live"
                element={
                  <ProtectedRoute>
                    <LiveStream />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Analytics />
      </BrowserRouter>
      </AuthProvider>
    </FirebaseDataProvider>
  );
}

export default App;
