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

        {/* Golden panel holding the access price + what the payment unlocks */}
        <div className="bit-access-panel">
        {/* Access price under the Bit button (siteData/ownerDetails.bitPrice) */}
        <p className="strategy-subtitle text-center bit-access-price">
          {contact.bitPrice ? (
            <>
              WhatsApp group and Live trading  access price: <span className="bit-access-price-amount">{formatIls(contact.bitPrice)}</span>
            </>
          ) : (
            <>
              <span className="gold-glow-word">Tap</span> the Bit button to scan and pay for WhatsApp group access
            </>
          )}
        </p>

        {/* What the payment unlocks (siteData/ownerDetails.bitPrice) */}
        <p className="strategy-subtitle text-center bit-access-note">
          {contact.bitPrice ? (
            <>
              Once your Bit payment
              comes through, you'll be added to the WhatsApp group and start receiving live trading signals
            </>
          ) : (
            "Once your Bit payment comes through, you'll be added to the WhatsApp group and start receiving live trading signals"
          )}
        </p>
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
