// ============================================
// ImageCarousel.jsx - shared image carousel + fullscreen lightbox
// Used by Performance Report and Home (strategy charts).
// One fixed-size stage that slides between images - arrows, swipe,
// keyboard, or the thumbnail strip below. Clicking the stage opens the
// image fullscreen with prev/next navigation.
// ============================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LoadingImage } from './LoadingMedia';

// Horizontal finger travel (px) that counts as a swipe rather than a tap
const SWIPE_THRESHOLD = 40;

// ============================================
// CAROUSEL
// Fixed-aspect stage + thumbnail strip; page height never grows with
// the number of images
// ============================================
export const Carousel = ({ images, index, onChange, onOpen, onError, label, itemName, badge }) => {
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
        aria-label={label}
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
                alt={`97% Gold ${itemName} ${i + 1}`}
                className="report-slide-image"
                onError={() => onError(src)}
                loading={Math.abs(i - index) <= 1 ? 'eager' : 'lazy'}
                coinSize={110}
              />
            </div>
          ))}
        </div>

        {badge && index === 0 && <span className="featured-badge report-stage-badge">{badge}</span>}
        <span className="report-stage-zoom" aria-hidden="true">⤢</span>

        {hasMany && (
          <>
            <button className="report-lightbox-nav report-lightbox-prev" onClick={showPrev} aria-label={`Previous ${itemName}`}>‹</button>
            <button className="report-lightbox-nav report-lightbox-next" onClick={showNext} aria-label={`Next ${itemName}`}>›</button>
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
              aria-label={`Show ${itemName} ${i + 1}`}
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
// LIGHTBOX
// Fullscreen image viewer - Esc closes, arrow keys navigate
// ============================================
export const Lightbox = ({ images, index, onClose, onChange, itemName }) => {
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
        <button className="close-modal" onClick={onClose} aria-label={`Close ${itemName}`}>✕</button>

        <div className="report-lightbox-image-wrapper">
          <LoadingImage
            src={images[index]}
            alt={`97% Gold ${itemName} ${index + 1}`}
            className="report-lightbox-image"
            coinSize={110}
          />
        </div>

        {hasMany && (
          <>
            <button className="report-lightbox-nav report-lightbox-prev" onClick={showPrev} aria-label={`Previous ${itemName}`}>‹</button>
            <button className="report-lightbox-nav report-lightbox-next" onClick={showNext} aria-label={`Next ${itemName}`}>›</button>
            <div className="report-lightbox-counter">{index + 1} / {images.length}</div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// GALLERY
// Carousel + lightbox wired together. Images that fail to load are dropped.
// renderEmpty() is shown when no image is left.
// ============================================
const ImageCarousel = ({ images, label, itemName = 'image', badge, renderEmpty = () => null }) => {
  const [failed, setFailed] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);

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

  // Closing the fullscreen view leaves the carousel on the image last viewed
  const closeLightbox = useCallback(() => {
    if (activeIndex !== null) setSlideIndex(activeIndex);
    setActiveIndex(null);
  }, [activeIndex]);

  if (visibleImages.length === 0) return renderEmpty();

  return (
    <>
      <Carousel
        images={visibleImages}
        index={Math.min(slideIndex, visibleImages.length - 1)}
        onChange={setSlideIndex}
        onOpen={setActiveIndex}
        onError={handleImageError}
        label={label}
        itemName={itemName}
        badge={badge}
      />
      <Lightbox
        images={visibleImages}
        index={activeIndex}
        onClose={closeLightbox}
        onChange={setActiveIndex}
        itemName={itemName}
      />
    </>
  );
};

export default ImageCarousel;
