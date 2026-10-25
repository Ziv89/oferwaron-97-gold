// ============================================
// LoadingMedia.jsx - images / iframes that show the spinning coin until loaded
//
// The coin is absolutely positioned over the nearest positioned ancestor,
// so the parent needs `position: relative` and some size while loading.
// A falsy src (e.g. a Firebase Storage URL still being fetched) also shows the coin.
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import CoinLoader from './CoinLoader';

export const LoadingImage = ({ src, alt, className, coinSize = 80, onLoad, onError, ...imgProps }) => {
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reset when the source changes; cached images may already be complete
  useEffect(() => {
    setFailed(false);
    setLoaded(Boolean(imgRef.current?.complete && imgRef.current.naturalWidth));
  }, [src]);

  return (
    <>
      {!loaded && !failed && <CoinLoader overlay size={coinSize} label={null} />}
      {src && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${className || ''} loading-media ${loaded ? 'is-loaded' : ''}`}
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          onError={(e) => {
            setFailed(true);
            onError?.(e);
          }}
          {...imgProps}
        />
      )}
    </>
  );
};

export const LoadingFrame = ({ src, title, className, coinSize = 110, ...iframeProps }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <>
      {!loaded && <CoinLoader overlay size={coinSize} label={null} />}
      <iframe
        src={src}
        title={title}
        className={`${className || ''} loading-media ${loaded ? 'is-loaded' : ''}`}
        onLoad={() => setLoaded(true)}
        {...iframeProps}
      />
    </>
  );
};
