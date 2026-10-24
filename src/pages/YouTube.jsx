// ============================================
// YouTube.jsx - YouTube Channel Page (Dynamic Firebase Videos)
// Videos loaded dynamically from Firebase youTubeids array
// First video = featured/main, rest displayed in responsive grid
// ============================================
import React, { useState, useMemo, useCallback } from 'react';
import { useSiteConfig, useOwnerDetails } from '../App';
import Seo from '../components/Seo';
import { ScancodeLightbox } from '../components/WhatsAppQr';
import { useScancodeImage } from '../services/scancodeImages';

// ============================================
// VIDEO CARD COMPONENT
// Individual video thumbnail with play overlay
// ============================================
const VideoCard = ({ videoId, index, onPlay }) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const [imgSrc, setImgSrc] = useState(thumbnailUrl);

  return (
    <div className="video-card" onClick={() => onPlay(videoId)}>
      <div className="video-thumbnail">
        <img 
          src={imgSrc} 
          alt={`Video ${index + 1}`}
          onError={() => setImgSrc(fallbackUrl)}
          loading="lazy"
        />
        <div className="play-overlay">
          <span className="play-icon">▶</span>
        </div>
      </div>
      <div className="video-info">
        <span className="video-number">Video #{index + 1}</span>
      </div>
    </div>
  );
};

// ============================================
// VIDEO MODAL COMPONENT
// Fullscreen video player overlay
// ============================================
const VideoModal = ({ videoId, onClose }) => {
  if (!videoId) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} aria-label="Close video">✕</button>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="YouTube Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

// ============================================
// LOADING SKELETON COMPONENT
// Shows while videos are loading
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
// Shows when no videos are configured
// ============================================
const EmptyState = ({ channelUrl }) => (
  <div className="youtube-empty-state">
    <h2>No Videos Yet</h2>
    <p>Videos will appear here once they're added to Firebase.</p>
    {channelUrl && (
      <a 
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="youtube-channel-link"
      >
        Visit Channel →
      </a>
    )}
  </div>
);


function YouTube() {
  const [activeVideo, setActiveVideo] = useState(null);
  const youtubeScancode = useScancodeImage(2);
  const [showScancode, setShowScancode] = useState(false);
  const closeScancode = useCallback(() => setShowScancode(false), []);
  
  // Get data from Firebase
  const { loading: configLoading } = useSiteConfig();
  const { social, youTubeids, loading: ownerLoading } = useOwnerDetails();

  const loading = configLoading || ownerLoading;

  // YouTube channel URL from Firebase
  const YOUTUBE_CHANNEL = social.youtube || 'https://www.youtube.com/@Oferwv';

  // Memoize video processing to prevent unnecessary recalculations
  const { featuredVideo, gridVideos } = useMemo(() => {
    if (!youTubeids || youTubeids.length === 0) {
      return { featuredVideo: null, gridVideos: [] };
    }
    
    // First video ID is the featured/main video
    const featured = youTubeids[0];
    // Rest of the videos go into the grid
    const grid = youTubeids.slice(1);
    
    return { featuredVideo: featured, gridVideos: grid };
  }, [youTubeids]);

  // Show loading state
  if (loading) {
    return (
      <div className="page youtube-page">
        <Seo
          title="YouTube Videos — 97% Gold"
          description="Watch trading insights, market analysis and tutorials from 97% Gold on YouTube."
          path="/youtube"
        />
        <LoadingSkeleton />
      </div>
    );
  }

  // Show empty state if no videos
  if (!featuredVideo && gridVideos.length === 0) {
    return (
      <div className="page youtube-page">
        <Seo
          title="YouTube Videos — 97% Gold"
          description="Watch trading insights, market analysis and tutorials from 97% Gold on YouTube."
          path="/youtube"
        />
        <EmptyState channelUrl={YOUTUBE_CHANNEL} />
      </div>
    );
  }

  return (
    <div className="page youtube-page">
      <Seo
        title="YouTube Videos — 97% Gold"
        description="Watch trading insights, market analysis and tutorials from 97% Gold on YouTube."
        path="/youtube"
      />

      {/* Page Header */}
      <section className="youtube-header">
      <h1 className="strategy-main-title get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">          <span className="youtube-icon"></span>

          Video Gallery
          </span>
        </h1>
        <p className="strategy-subtitle">Watch trading insights, analysis & tutorials</p>
      </section>

      {/* Featured Video - First video from youTubeids array */}
      {featuredVideo && (
        <section className="section youtube-featured-section">
          <div className="youtube-featured-label">
            <span className="featured-badge">⭐ Featured</span>
          </div>
          <div className="featured-video-container">
            <div className="featured-video-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${featuredVideo}?rel=0`}
                title="Featured Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Video Grid - Remaining videos from youTubeids array */}
      {gridVideos.length > 0 && (
        <section className="section youtube-grid-section">

          <div className="video-grid youtube-dynamic-grid">
            {gridVideos.map((videoId, index) => (
              <VideoCard 
                key={videoId}
                videoId={videoId}
                index={index}
                onPlay={setActiveVideo}
              />
            ))}
          </div>
        </section>
      )}

      {/* Subscribe CTA */}
      <section className="section youtube-cta-section">
        <div className="card subscribe-cta-card">
          <h2 className="subscribe-cta-title">🔔 Never Miss an Update!</h2>
          <p className="subscribe-cta-text">
                    <p className="strategy-subtitle">Watch trading insights, analysis & tutorial

            Subscribe to get the latest trading signals, market analysis, and educational content.
            s</p>
          </p>
          {/* Opens the YouTube scan code - no direct link to YouTube */}
          <button
            type="button"
            className="subscribe-btn"
            onClick={() => youtubeScancode && setShowScancode(true)}
          >
            <span className="subscribe-icon">▶</span>
            Subscribe Now
          </button>
        </div>
      </section>

      {/* Video Modal */}
      <VideoModal 
        videoId={activeVideo}
        onClose={() => setActiveVideo(null)}
      />

      {/* YouTube scan code (scancodes/ofernewScancode2.jpg) */}
      {showScancode && (
        <ScancodeLightbox
          src={youtubeScancode}
          alt="Scan to open the OferWaron97Gold YouTube channel"
          caption="Scan with your phone camera to open the YouTube channel"
          onClose={closeScancode}
        />
      )}
    </div>
  );
}

export default YouTube;
