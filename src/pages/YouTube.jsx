// ============================================
// YouTube.jsx - YouTube Channel Page (No inline styles)
// ============================================
import React, { useState, useEffect } from 'react';
import { CONFIG } from '../App';

// YouTube Channel URL
const YOUTUBE_CHANNEL = 'https://www.youtube.com/@Oferwv';

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
const SubscribeButton = () => {
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
        data-channelid={CONFIG.youtube.channelId}
        data-layout="full" 
        data-count="default"
      />
      {/* <a 
        href={`${YOUTUBE_CHANNEL}?sub_confirmation=1`}
        target="_blank"
        rel="noopener noreferrer"
        className="subscribe-btn"
      >
        ▶ Subscribe to {CONFIG.youtube.channelName}
      </a> */}
    </div>
  );
};

function YouTube() {
  const [activeVideo, setActiveVideo] = useState(null);

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
    { id: 'bmE75Jl6fE0', title: 'Trading Strategy', desc: 'Learn our proven methods' },
    { id: 'Y5t_FrYu7fo', title: 'Market Update', desc: 'Current gold trends' }
  ];

  return (
    <div className="page">
      {/* Hero Section */}
      {/* <section className="youtube-hero"> */}
        {/* <h1 className="youtube-hero-title">📺 OferWaron97%Gold</h1> */}
        {/* <p className="youtube-hero-subtitle">Free Gold Trading Education & Live Analysis</p> */}

        {/* Stats */}
        {/* <div className="youtube-stats">
          <div className="youtube-stat">
            <div className="youtube-stat-value">1,000+</div>
            <div className="youtube-stat-label">Subscribers</div>
          </div>
          <div className="youtube-stat">
            <div className="youtube-stat-value">50+</div>
            <div className="youtube-stat-label">Videos</div>
          </div>
          <div className="youtube-stat">
            <div className="youtube-stat-value">100K+</div>
            <div className="youtube-stat-label">Views</div>
          </div>
        </div> */}

        {/* <SubscribeButton /> */}
      {/* </section> */}

      {/* Featured Video */}
      <section className="section">
        {/* <h2 className="section-title text-center">🌟 Featured Video</h2> */}
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
        {/* <h2 className="section-title text-center">📹 Latest Videos</h2> */}
        {/* <p className="section-subtitle text-center">Click to watch</p> */}
        
        <div className="video-grid">
          {gridVideos.map((video, i) => (
            <VideoCard 
              key={i}
              video={video}
              onPlay={setActiveVideo}
            />
          ))}
        </div>

        {/* <div className="text-center mt-4">
          <a 
            href={`${YOUTUBE_CHANNEL}/videos`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            View All Videos →
          </a>
        </div> */}
      </section>

      {/* Playlists */}
      {/* <section className="section">
        <h2 className="section-title text-center">📚 Playlists</h2>
        
        <div className="card-grid card-wide">
          {playlists.map((playlist, i) => (
            <a 
              key={i}
              href={`${YOUTUBE_CHANNEL}/playlists`}
              target="_blank"
              rel="noopener noreferrer"
              className="card playlist-card"
            >
              <span className="playlist-icon">{playlist.icon}</span>
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                <span>{playlist.count}</span>
              </div>
            </a>
          ))}
        </div>
      </section> */}

      {/* What You'll Learn */}
      {/* <section className="section">
        <h2 className="section-title text-center">🎓 What You'll Learn</h2>
        
        <div className="card-grid">
          {learningTopics.map((topic, i) => (
            <div key={i} className="card">
              <div className="value-icon">{topic.icon}</div>
              <h3 className="value-title">{topic.title}</h3>
              <p className="value-desc">{topic.desc}</p>
            </div>
          ))}
        </div>
      </section> */}

      {/* Subscribe CTA */}
      <section className="section">
        <div className="card subscribe-cta-card">
          <h2 className="subscribe-cta-title">🔔 Never Miss an Update!</h2>
          <p className="subscribe-cta-text">Subscribe and turn on notifications to get:</p>
          {/* <ul className="subscribe-benefits">
            <li>✅ Weekly market analysis</li>
            <li>✅ Live trading sessions</li>
            <li>✅ Strategy explanations</li>
            <li>✅ Exclusive tips & tricks</li>
          </ul> */}
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
