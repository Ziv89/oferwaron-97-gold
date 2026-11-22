// ============================================
// PerformanceReport.jsx - Performance Report image carousel
// Images loaded from Firebase Storage (see services/performanceImages.js)
// One fixed-size stage (every report the same size) that slides between
// reports - arrows, swipe, keyboard, or the thumbnail strip below.
// Clicking the stage opens the report fullscreen with prev/next navigation
// ============================================
import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom'; // re-enable with the EmptyState buttons
import Seo from '../components/Seo';
import CoinLoader from '../components/CoinLoader';
import ImageCarousel from '../components/ImageCarousel';
import { fetchPerformanceImages } from '../services/performanceImages';

// ============================================
// EMPTY STATE COMPONENT
// Shown when no report images exist in Storage (or they failed to load)
// ============================================
const EmptyState = () => (
  <div className="youtube-empty-state report-empty">
    {/* Gold chart that draws itself, ending on a pulsing point */}
    <svg className="report-empty-chart" viewBox="0 0 160 80" aria-hidden="true">
      <defs>
        <linearGradient id="reportEmptyLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b8860b" />
          <stop offset="55%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#fff6c9" />
        </linearGradient>
        <linearGradient id="reportEmptyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="report-empty-grid" d="M8 20H152M8 40H152M8 60H152" />
      <path className="report-empty-area" d="M8 66L34 54L58 60L84 38L108 44L134 22L152 14V72H8Z" fill="url(#reportEmptyFill)" />
      <path className="report-empty-line" d="M8 66L34 54L58 60L84 38L108 44L134 22L152 14" stroke="url(#reportEmptyLine)" />
      <circle className="report-empty-dot" cx="152" cy="14" r="4" />
    </svg>
    <h2 className="report-empty-title">Fresh Reports Coming Soon</h2>
    <span className="report-empty-divider" aria-hidden="true" />

  </div>
);

function PerformanceReport() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchPerformanceImages()
      .then((urls) => {
        if (!cancelled) setImages(urls);
      })
      .catch((err) => {
        console.error('Error fetching performance images:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page youtube-page">
      <Seo
        title="Performance Report — 97% Gold"
        description="Detailed performance reports of the 97% Gold XAUUSD trading strategy."
        path="/performance"
      />

      {/* Page Header */}
      <section className="youtube-header">
        <h1 className="strategy-main-title get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">Performance Report</span>
        </h1>
        {images.length > 0 && (
          <p className="strategy-subtitle">Swipe or use the arrows to browse · tap a report to view it full screen</p>
        )}
      </section>

      {loading ? (
        <CoinLoader label="Loading reports…" size={120} />
      ) : images.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="section">
          <ImageCarousel
            images={images}
            label="Performance reports"
            itemName="performance report"
            badge="⭐ Latest Report"
            renderEmpty={() => <EmptyState />}
          />
        </section>
      )}
    </div>
  );
}

export default PerformanceReport;
