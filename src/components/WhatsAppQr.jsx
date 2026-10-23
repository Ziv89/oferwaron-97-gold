// ============================================
// WhatsAppQr.jsx - WhatsApp QR code from Firebase Storage (scancodes/ofernewScancode.jpg)
// Renders nothing until the image is loaded (or if it fails to load)
// Clicking the QR opens it enlarged in a fullscreen overlay so it is easier to scan
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useScancodeImage } from '../services/scancodeImages';

// ============================================
// Enlarged QR overlay
// Rendered into document.body so transformed parents (e.g. hovered cards) don't clip it
// ============================================
const QrLightbox = ({ src, onClose }) => {
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

        <img
          src={src}
          alt="Scan to chat with Ofer on WhatsApp"
          className="whatsapp-qr-lightbox-image"
        />
        <p className="whatsapp-qr-lightbox-caption">Scan with your phone camera to chat on WhatsApp</p>
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
        <img
          src={qrImage}
          alt="Scan to chat with Ofer on WhatsApp"
          className="whatsapp-qr-image"
          loading="lazy"
        />
      </button>
      {caption && <p className="whatsapp-qr-caption">{caption}</p>}

      {isEnlarged && <QrLightbox src={qrImage} onClose={closeEnlarged} />}
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

      {isEnlarged && <QrLightbox src={qrImage} onClose={closeEnlarged} />}
    </>
  );
};

export default WhatsAppQr;
