// ============================================
// WhatsAppQr.jsx - WhatsApp QR code from Firebase Storage (scancodes/ofernewScancode.jpg)
// Renders nothing until the image is loaded (or if it fails to load)
// Clicking the QR opens it enlarged in a fullscreen overlay so it is easier to scan
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useScancodeImage } from '../services/scancodeImages';
import { LoadingImage } from './LoadingMedia';

const WHATSAPP_ALT = 'Scan to chat with Ofer on WhatsApp';
const WHATSAPP_CAPTION = 'Scan with your phone camera to chat on WhatsApp';

// ============================================
// Enlarged scan code overlay (WhatsApp, YouTube, ...)
// Rendered into document.body so transformed parents (e.g. hovered cards) don't clip it
// ============================================
// `missing` = the image does not exist in Storage (yet) - shows a placeholder instead of the coin
export const ScancodeLightbox = ({ src, onClose, alt = WHATSAPP_ALT, caption = WHATSAPP_CAPTION, missing = false }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal whatsapp-qr-lightbox" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} aria-label="Close QR code">✕</button>

        {missing ? (
          <div className="whatsapp-qr-lightbox-missing">Scan code coming soon</div>
        ) : (
          <div className="media-loading-box whatsapp-qr-lightbox-box">
            <LoadingImage
              src={src}
              alt={alt}
              className="whatsapp-qr-lightbox-image"
              coinSize={110}
            />
          </div>
        )}
        {caption && !missing && <p className="whatsapp-qr-lightbox-caption">{caption}</p>}
      </div>
    </div>,
    document.body
  );
};

const WhatsAppQr = ({ caption = 'Scan to chat on WhatsApp', compact = false }) => {
  const qrImage = useScancodeImage(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const closeEnlarged = useCallback(() => setIsEnlarged(false), []);

  if (!qrImage) return null;

  return (
    <div className={`whatsapp-qr${compact ? ' whatsapp-qr--compact' : ''}`}>
      <button
        type="button"
        className="whatsapp-qr-button"
        onClick={() => setIsEnlarged(true)}
        aria-label="Enlarge WhatsApp QR code"
        title="Click to enlarge"
      >
        <span className="media-loading-box">
          <LoadingImage
            src={qrImage}
            alt="Scan to chat with Ofer on WhatsApp"
            className="whatsapp-qr-image"
            loading="lazy"
            coinSize={56}
          />
        </span>
      </button>
      {caption && <p className="whatsapp-qr-caption">{caption}</p>}

      {isEnlarged && <ScancodeLightbox src={qrImage} onClose={closeEnlarged} />}
    </div>
  );
};

// ============================================
// Button that opens the enlarged WhatsApp QR (no direct link to WhatsApp)
// ============================================
export const WhatsAppQrButton = ({ className = 'strategy-btn strategy-btn-primary', children = 'WhatsApp Me 💬' }) => {
  const qrImage = useScancodeImage(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const closeEnlarged = useCallback(() => setIsEnlarged(false), []);

  if (!qrImage) return null;

  return (
    <>
      <button type="button" className={className} onClick={() => setIsEnlarged(true)}>
        {children}
      </button>

      {isEnlarged && <ScancodeLightbox src={qrImage} onClose={closeEnlarged} />}
    </>
  );
};

export default WhatsAppQr;
