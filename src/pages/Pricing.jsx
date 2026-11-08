// ============================================
// Pricing.jsx - Pricing Page (Strategy-style golden design)
// ============================================
import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import { Link } from 'react-router-dom'; // re-enable with the Final CTA section
import Seo from '../components/Seo';
import { useOwnerDetails } from '../App';
import { useScancodeImageState, SCANCODE } from '../services/scancodeImages';
import { WhatsAppQrButton, ScancodeLightbox } from '../components/WhatsAppQr';
import { SiGmail } from 'react-icons/si';
import { FaWhatsapp } from 'react-icons/fa';
import questionMarkCoin from '../assets/images/questionMarkCoin.webp';
import '../styles/auth.css';

const PRICE_QR_ALT = 'Scan to pay with Bit';
// 300 -> "₪300" (siteData/ownerDetails.bitPrice)
const formatIls = (amount) => `₪${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

// Bit wordmark - white "bit" on the teal Bit button
const BitLogo = () => (
  <svg className="bit-logo" viewBox="0 0 64 40" width="1.6em" height="1em" aria-hidden="true">
    <text
      x="32"
      y="31"
      textAnchor="middle"
      fill="currentColor"
      fontFamily="'Arial Rounded MT Bold', 'Nunito', 'Varela Round', Arial, sans-serif"
      fontWeight="800"
      fontSize="34"
      letterSpacing="-1"
    >
      bit
    </text>
  </svg>
);

function Pricing() {
  // Get contact data from Firebase
  const { contact, loading } = useOwnerDetails();

  // Price scan code from Firebase Storage: scancodes/ofernewScancode1.jpg
  const priceScancode = useScancodeImageState(SCANCODE.price);
  // Just registered (Login.jsx) - open the Bit scan code straight away
  const location = useLocation();
  const navigate = useNavigate();
  const [enlarged, setEnlarged] = useState(() => Boolean(location.state?.openBitScancode));
  const close = useCallback(() => setEnlarged(false), []);

  // Forget the flag, so a refresh or coming back later doesn't pop it open again
  useEffect(() => {
    if (location.state?.openBitScancode) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="strategy-page">
        <Seo
          title="Pricing — 97% Gold XAUUSD Signals"
          description="View 97% Gold's subscription plans for real-time XAUUSD trading signals, WhatsApp alerts, and risk management guidance."
          path="/pricing"
        />
        <section className="strategy-section text-center">
          <p className="strategy-subtitle">Loading...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="strategy-page">
      <Seo
        title="Pricing — 97% Gold XAUUSD Signals"
        description="View 97% Gold's subscription plans for real-time XAUUSD trading signals, WhatsApp alerts, and risk management guidance."
        path="/pricing"
      />

      {/* Option 3: Free Trial Banner */}
      <section className="strategy-section">

      </section>

      {/* Pricing Card + FAQ Side by Side */}
      <section className="strategy-section">
        <div className="pricing-faq-layout">
          {/* FAQ Section - Left Side */}
          <div className="pricing-faq-column">
            {/* Header stays on its own row so the pricing card can align with the FAQ list */}
            <div className="faq-header">
              <h2 className="strategy-section-title text-center get-in-touch-title get-in-touch-title--shimmer">
                <span className="get-in-touch-shimmer">
                  Membership Pricing
                  <span className="sparkle sparkle-1">✦</span>
                  <span className="sparkle sparkle-2">✦</span>
                </span>

                <img
                  src={questionMarkCoin}
                  alt=""
                  className="faq-coin"
                  loading="lazy"
                />
              </h2>

              <p className="strategy-subtitle text-center">
                Your plan and price are below — have a question? I'm one message away
              </p>
            </div>
          </div>

          {/* Pricing Cards - Right Side */}
          <div className="pricing-card-column">
          </div>
        </div>
      </section>

      {/* Price scan code - only the Bit logo opens it enlarged (scancodes/ofernewScancode1) */}
      <section className="strategy-section text-center">
        <div className="strategy-rule-card contact-method-card vip-group-card bit-pay-card">
          <button
            type="button"
            className="vip-group-card-icon bit-pay-card-icon"
            onClick={() => setEnlarged(true)}
            aria-label="Show Bit payment scan code"
          >
            <BitLogo />
          </button>
        </div>

        {enlarged && (
          <ScancodeLightbox
            src={priceScancode.url}
            alt={PRICE_QR_ALT}
            caption={contact.bitPrice ? <span className="bit-price">{formatIls(contact.bitPrice)}</span> : ''}
            missing={priceScancode.failed}
            onClose={close}
          />
        )}
      </section>

      <section className="strategy-section text-center">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">Still Have Questions?</h2>
          <p className="strategy-principle-text">
            Chat with me directly on WhatsApp or send me an email. I'm here to help!
          </p>
          <div className="strategy-btn-group" style={{ marginTop: '1.5rem' }}>
            <WhatsAppQrButton className="strategy-btn strategy-btn-primary strategy-btn-with-icon">
              WhatsApp  <FaWhatsapp style={{ color: '#25D366' }} />
            </WhatsAppQrButton>
            {contact.email && (
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="strategy-btn strategy-btn-primary strategy-btn-with-icon"
              >
                Email <SiGmail style={{ color: '#EA4335' }} />
              </a>
            )}
          </div>
        </div>
      </section>


    </div>
  );
}

export default Pricing;
