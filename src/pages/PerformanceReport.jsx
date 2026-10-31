// ============================================
// PerformanceReport.jsx - Performance Report image carousel
// Images loaded from Firebase Storage (see services/performanceImages.js)
// One fixed-size stage (every report the same size) that slides between
// reports - arrows, swipe, keyboard, or the thumbnail strip below.
// Clicking the stage opens the report fullscreen with prev/next navigation
// ============================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { Link } from 'react-router-dom'; // re-enable with the EmptyState buttons
import Seo from '../components/Seo';
import CoinLoader from '../components/CoinLoader';
import { LoadingImage } from '../components/LoadingMedia';
import { fetchPerformanceImages } from '../services/performanceImages';

// Horizontal finger travel (px) that counts as a swipe rather than a tap
const SWIPE_THRESHOLD = 40;

// ============================================
// CAROUSEL COMPONENT
// Fixed-aspect stage + thumbnail strip; page height never grows with
// the number of reports
// ============================================
const ReportCarousel = ({ images, index, onChange, onOpen, onError }) => {
  const touchStartX = useRef(null);
  const thumbRefs = useRef([]);
  const stripRef = useRef(null);
  const hasMany = images.length > 1;

  const showPrev = useCallback(
    () => onChange((index - 1 + images.length) % images.length),
    [index, images.length, onChange]
  );
  const showNext = useCallback(
    () => onChange((index + 1) % images.length),
    [index, images.length, onChange]
  );

  // Center the active thumbnail in the strip - scrolls the strip only, never the page
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = thumbRefs.current[index];
    if (!strip || !thumb) return;
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
      behavior: 'smooth',
    });
  }, [index]);

  const handleKeyDown = (e) => {
    if (!hasMany) return;
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (!hasMany || Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx > 0) showPrev();
    else showNext();
  };

  return (
    <div className="report-carousel">
      <div
        className="report-stage"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Performance reports"
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="report-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((src, i) => (
            <div
              key={src}
              className="report-slide"
              onClick={() => onOpen(i)}
              aria-hidden={i !== index}
            >
              <LoadingImage
                src={src}
                alt={`97% Gold performance report ${i + 1}`}
                className="report-slide-image"
                onError={() => onError(src)}
                loading={Math.abs(i - index) <= 1 ? 'eager' : 'lazy'}
                coinSize={110}
              />
            </div>
          ))}
        </div>

        {index === 0 && <span className="featured-badge report-stage-badge">⭐ Latest Report</span>}
        <span className="report-stage-zoom" aria-hidden="true">⤢</span>

        {hasMany && (
          <>
            <button className="report-lightbox-nav report-lightbox-prev" onClick={showPrev} aria-label="Previous report">‹</button>
            <button className="report-lightbox-nav report-lightbox-next" onClick={showNext} aria-label="Next report">›</button>
            <div className="report-stage-counter">{index + 1} / {images.length}</div>
          </>
        )}
      </div>

      {hasMany && (
        <div className="report-thumbs" ref={stripRef}>
          {images.map((src, i) => (
            <button
              key={src}
              ref={(el) => { thumbRefs.current[i] = el; }}
              type="button"
              className={`report-thumb ${i === index ? 'is-active' : ''}`}
              onClick={() => onChange(i)}
              aria-label={`Show report ${i + 1}`}
              aria-current={i === index}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

        <div className="report-lightbox-image-wrapper">
          <LoadingImage
            src={images[index]}
            alt={`97% Gold performance report ${index + 1}`}
            className="report-lightbox-image"
            coinSize={110}
          />
        </div>

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
  const [slideIndex, setSlideIndex] = useState(0);

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

  // A failed image shrinks the list - keep the slide index in range
  useEffect(() => {
    if (slideIndex >= visibleImages.length && visibleImages.length > 0) {
      setSlideIndex(visibleImages.length - 1);
    }
  }, [slideIndex, visibleImages.length]);

  const handleImageError = useCallback((src) => {
    setFailed(prev => (prev.includes(src) ? prev : [...prev, src]));
  }, []);
  // Closing the fullscreen view leaves the carousel on the report last viewed
  const closeLightbox = useCallback(() => {
    if (activeIndex !== null) setSlideIndex(activeIndex);
    setActiveIndex(null);
  }, [activeIndex]);

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
          <p className="strategy-subtitle">Swipe or use the arrows to browse · tap a report to view it full screen</p>
        )}
      </section>

      {loading ? (
        <CoinLoader label="Loading reports…" size={120} />
      ) : visibleImages.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="section">
          <ReportCarousel
            images={visibleImages}
            index={Math.min(slideIndex, visibleImages.length - 1)}
            onChange={setSlideIndex}
            onOpen={setActiveIndex}
            onError={handleImageError}
          />
        </section>
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
