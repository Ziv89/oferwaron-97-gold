// ============================================
// PerformanceReport.jsx - Performance Report image gallery
// Images loaded from Firebase Storage (see services/performanceImages.js)
// First image = featured, rest displayed in responsive grid (same layout as YouTube page)
// Clicking any image opens it fullscreen with prev/next navigation
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom'; // re-enable with the EmptyState buttons
import Seo from '../components/Seo';
import { fetchPerformanceImages } from '../services/performanceImages';

// ============================================
// REPORT CARD COMPONENT
// Grid thumbnail with zoom overlay
// ============================================
const ReportCard = ({ src, index, onOpen, onError }) => (
  <div className="video-card" onClick={() => onOpen(index)}>
    <div className="video-thumbnail">
      <img
        src={src}
        alt={`97% Gold performance report ${index + 1}`}
        onError={() => onError(src)}
        loading="lazy"
      />
      <div className="play-overlay">
        <span className="play-icon">⤢</span>
      </div>
    </div>
    <div className="video-info">
      <span className="video-number">Report #{index + 1}</span>
    </div>
  </div>
);

// ============================================
// LIGHTBOX COMPONENT
// Fullscreen image viewer - Esc closes, arrow keys navigate
// ============================================
const Lightbox = ({ images, index, onClose, onChange }) => {
  const isOpen = index !== null;
  const hasMany = images.length > 1;

  const showPrev = useCallback(
    () => onChange((index - 1 + images.length) % images.length),
    [index, images.length, onChange]
  );
  const showNext = useCallback(
    () => onChange((index + 1) % images.length),
    [index, images.length, onChange]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (hasMany && e.key === 'ArrowLeft') showPrev();
      if (hasMany && e.key === 'ArrowRight') showNext();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, hasMany, onClose, showPrev, showNext]);

  if (!isOpen) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal report-lightbox" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} aria-label="Close report">✕</button>

        <img
          src={images[index]}
          alt={`97% Gold performance report ${index + 1}`}
          className="report-lightbox-image"
        />

        {hasMany && (
          <>
            <button className="report-lightbox-nav report-lightbox-prev" onClick={showPrev} aria-label="Previous report">‹</button>
            <button className="report-lightbox-nav report-lightbox-next" onClick={showNext} aria-label="Next report">›</button>
            <div className="report-lightbox-counter">{index + 1} / {images.length}</div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// LOADING SKELETON COMPONENT
// ============================================
const LoadingSkeleton = () => (
  <div className="youtube-loading">
    <div className="youtube-loading-featured">
      <div className="skeleton-shimmer" />
    </div>
    <div className="youtube-loading-grid">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-shimmer" />
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// EMPTY STATE COMPONENT
// Shown when no report images exist in Storage (or they failed to load)
// ============================================
const EmptyState = () => (
  <div className="youtube-empty-state">
    <h2>No Reports Published Yet</h2>
    {/* <div className="strategy-btn-group">
      <Link to="/" className="strategy-btn strategy-btn-primary">View Live Stats</Link>
      <Link to="/youtube" className="strategy-btn strategy-btn-primary">Watch on YouTube</Link>
    </div> */}
  </div>
);

function PerformanceReport() {
  const [images, setImages] = useState([]);
  const [failed, setFailed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

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

  // Only images that actually loaded are shown
  const visibleImages = images.filter(src => !failed.includes(src));
  const [featuredImage, ...gridImages] = visibleImages;

  const handleImageError = useCallback((src) => {
    setFailed(prev => (prev.includes(src) ? prev : [...prev, src]));
  }, []);
  const closeLightbox = useCallback(() => setActiveIndex(null), []);

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
        {visibleImages.length > 0 && (
          <p className="strategy-subtitle">Click any report to view it full screen</p>
        )}
      </section>

      {loading ? (
        <LoadingSkeleton />
      ) : !featuredImage ? (
        <EmptyState />
      ) : (
        <>
          {/* Featured Report - first image */}
          <section className="section youtube-featured-section">
            <div className="youtube-featured-label">
              <span className="featured-badge">⭐ Latest Report</span>
            </div>
            <div className="featured-video-container report-featured" onClick={() => setActiveIndex(0)}>
              <img
                src={featuredImage}
                alt="97% Gold latest performance report"
                className="report-featured-image"
                onError={() => handleImageError(featuredImage)}
              />
            </div>
          </section>

          {/* Report Grid - remaining images */}
          {gridImages.length > 0 && (
            <section className="section youtube-grid-section">
              <div className="video-grid youtube-dynamic-grid">
                {gridImages.map((src, i) => (
                  <ReportCard
                    key={src}
                    src={src}
                    index={i + 1}
                    onOpen={setActiveIndex}
                    onError={handleImageError}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Lightbox
        images={visibleImages}
        index={activeIndex}
        onClose={closeLightbox}
        onChange={setActiveIndex}
      />
    </div>
  );
}

export default PerformanceReport;
