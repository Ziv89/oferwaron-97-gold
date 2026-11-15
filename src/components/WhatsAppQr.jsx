// ============================================
// WhatsAppQr.jsx - WhatsApp QR code from Firebase Storage (scancodes/ofernewScancode.jpg)
// Renders nothing until the image is loaded (or if it fails to load)
// Clicking the QR opens it enlarged in a fullscreen overlay so it is easier to scan
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useScancodeImage } from '../services/scancodeImages';
import { LoadingImage } from './LoadingMedia';
import { useIsSmallScreen, useSocialLinks } from '../utils/socialLinks';

const WHATSAPP_ALT = 'Scan to chat with Ofer on WhatsApp';

// ============================================
// Enlarged scan code overlay (WhatsApp, YouTube, ...)
// Rendered into document.body so transformed parents (e.g. hovered cards) don't clip it
// ============================================
// `missing` = the image does not exist in Storage (yet) - shows a placeholder instead of the coin
// `link` / `linkLabel` = optional button under the code that opens the account directly
// (the address itself comes from Firebase and is never shown as text)
export const ScancodeLightbox = ({ src, onClose, alt = WHATSAPP_ALT, caption = '', missing = false, link = '', linkLabel = 'Open link' }) => {
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
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="strategy-btn strategy-btn-primary scancode-lightbox-link"
          >
            {linkLabel} ↗
          </a>
        )}
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

      {/* Enlarged view shows the same caption (none when the page hides it) */}
      {isEnlarged && <ScancodeLightbox src={qrImage} onClose={closeEnlarged} caption={caption} />}
    </div>
  );
};

// ============================================
// WhatsApp button
// Smartphone: opens WhatsApp directly (number from Firebase)
// Larger screens: opens the enlarged QR, with a button to open WhatsApp too
// ============================================
// caption: text under the enlarged code (left out = none)
export const WhatsAppQrButton = ({ className = 'strategy-btn strategy-btn-primary', children = 'WhatsApp Me 💬', caption }) => {
  const qrImage = useScancodeImage(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const closeEnlarged = useCallback(() => setIsEnlarged(false), []);
  const isSmallScreen = useIsSmallScreen();
  const { whatsapp: whatsappLink } = useSocialLinks();

  if (isSmallScreen && whatsappLink) {
    return (
      <a className={className} href={whatsappLink} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  if (!qrImage) return null;

  return (
    <>
      <button type="button" className={className} onClick={() => setIsEnlarged(true)}>
        {children}
      </button>

      {isEnlarged && (
        <ScancodeLightbox
          src={qrImage}
          onClose={closeEnlarged}
          link={whatsappLink}
          linkLabel="Open WhatsApp"
          {...(caption !== undefined && { caption })}
        />
      )}
    </>
  );
};

export default WhatsAppQr;
