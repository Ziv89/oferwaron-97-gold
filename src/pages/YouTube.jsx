// ============================================
// YouTube.jsx - YouTube Channel Page (No inline styles)
// ============================================
import React, { useState, useEffect } from 'react';
import { useSiteConfig, useOwnerDetails } from '../App';

// Video Card Component
const VideoCard = ({ video, onPlay }) => {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
  const fallbackUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
  const [imgSrc, setImgSrc] = useState(thumbnailUrl);

  return (
    <div className="video-card" onClick={() => onPlay(video.id)}>
      <div className="video-thumbnail">
        <img 
          src={imgSrc} 
          alt={video.title}
          onError={() => setImgSrc(fallbackUrl)}
        />
        <div className="play-overlay">
          <span className="play-icon">▶</span>
        </div>
      </div>
      <div className="video-info">
        <h3>{video.title}</h3>
        <p>{video.desc}</p>
      </div>
    </div>
  );
};

// Video Modal Component
const VideoModal = ({ videoId, onClose }) => {
  if (!videoId) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>✕</button>
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

// Subscribe Button
const SubscribeButton = ({ channelId }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/platform.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  return (
    <div className="subscribe-container">
      <div 
        className="g-ytsubscribe" 
        data-channelid={channelId}
        data-layout="full" 
        data-count="default"
      />
    </div>
  );
};

function YouTube() {
  const [activeVideo, setActiveVideo] = useState(null);
  
  // Get data from Firebase
  const { config, loading: configLoading } = useSiteConfig();
  const { social, loading: ownerLoading } = useOwnerDetails();

  const loading = configLoading || ownerLoading;

  // YouTube channel URL from Firebase
  const YOUTUBE_CHANNEL = social.youtube || 'https://www.youtube.com/@Oferwv';

  const playlists = [
    { icon: '📈', name: 'Trading Tutorials', count: '12 videos' },
    { icon: '📊', name: 'Weekly Analysis', count: '24 videos' },
    { icon: '💰', name: 'Success Stories', count: '8 videos' },
    { icon: '⚙️', name: 'Strategy Deep Dives', count: '15 videos' }
  ];

  const learningTopics = [
    { icon: '📊', title: 'Technical Analysis', desc: 'Master MACD, RSI, Bollinger Bands and our confluence strategy.' },
    { icon: '⚡', title: 'Live Trading', desc: 'Watch real trades with entry, exit, and risk management.' },
    { icon: '🛡️', title: 'Risk Management', desc: 'Learn the 1:1 risk-reward strategy that protects capital.' },
    { icon: '📈', title: 'Market Psychology', desc: 'Understand why gold moves and predict market sentiment.' }
  ];

  // Grid videos (3 specific videos)
  const gridVideos = [
    { id: 'WV2d2CKUl0Y', title: 'Gold Trading Analysis', desc: 'Latest market insights' },
    { id: 'bmE75Jl6fE0', title: 'Trading Strategy', desc: 'Learn proven methods' },
    { id: 'Y5t_FrYu7fo', title: 'Market Update', desc: 'Current gold trends' }
  ];

  if (loading) {
    return (
      <div className="page">
        <section className="section text-center">
          <p>Loading...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Featured Video */}
      <section className="section">
        <div className="featured-video-container">
          <div className="featured-video-wrapper">
            <iframe
              src="https://www.youtube.com/embed/vjMLBfpIuYE?rel=0"
              title="Featured Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Video Grid */}
      <section className="section">
        <div className="video-grid">
          {gridVideos.map((video, i) => (
            <VideoCard 
              key={i}
              video={video}
              onPlay={setActiveVideo}
            />
          ))}
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="section">
        <div className="card subscribe-cta-card">
          <h2 className="subscribe-cta-title">🔔 Never Miss an Update!</h2>
          <p className="subscribe-cta-text">Subscribe and turn on notifications to get:</p>
          <a 
            href={`${YOUTUBE_CHANNEL}?sub_confirmation=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="subscribe-btn"
          >
            ▶ Subscribe Now
          </a>
        </div>
      </section>

      {/* Video Modal */}
      <VideoModal 
        videoId={activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    </div>
  );
}

export default YouTube;
