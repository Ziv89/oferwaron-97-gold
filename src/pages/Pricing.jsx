// ============================================
// Pricing.jsx - Pricing Page (Strategy-style golden design)
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useOwnerDetails } from '../App';
import { useScancodeImage } from '../services/scancodeImages';
import { WhatsAppQrButton } from '../components/WhatsAppQr';
import { LoadingImage } from '../components/LoadingMedia';
import { SiGmail } from 'react-icons/si';
import { FaWhatsapp } from 'react-icons/fa';
import questionMarkCoin from '../assets/images/questionMarkCoin.webp';

function Pricing() {
  // Get contact data from Firebase
  const { contact, loading } = useOwnerDetails();

  // Price image from Firebase Storage: scancodes/ofernewScancode1.jpg
  const comingSoonImage = useScancodeImage(1);

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
                  Frequently Asked Questions
                  <span className="sparkle sparkle-1">✦</span>
                  <span className="sparkle sparkle-2">✦</span>
                </span>

                <img
                  src={questionMarkCoin}
                  alt="FAQ"
                  className="faq-coin"
                  loading="lazy"
                />
              </h2>

              <p className="strategy-subtitle text-center">Everything you need to know</p>
            </div>
          </div>

          {/* Pricing Cards - Right Side */}
          <div className="pricing-card-column">
          </div>
        </div>
      </section>

      {/* Trading Dashboard - Coming Soon */}
      <section className="strategy-section text-center">
        <div className="trading-dashboard trading-dashboard-coming-soon">
          <div className="coming-soon-image-section">
            <div className="coming-soon-image-wrapper">
              {comingSoonImage ? (
                <LoadingImage
                  src={comingSoonImage}
                  alt="97% Gold Pricing"
                  className="coming-soon-hero-image"
                  loading="lazy"
                  coinSize={110}
                />
              ) : (
                <div className="coming-soon-image-placeholder">
                  Coming Soon
                </div>
              )}

              <div className="coming-soon-image-overlay">
                <div className="overlay-content">
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="strategy-section text-center">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">Still Have Questions?</h2>
          <p className="strategy-principle-text">
            Chat with me directly on WhatsApp or send me an email. I'm here to help!
          </p>
          <div className="strategy-btn-group" style={{ marginTop: '1.5rem' }}>
            {/* Opens the WhatsApp QR code to scan - no direct link to WhatsApp */}
            <WhatsAppQrButton className="strategy-btn strategy-btn-primary strategy-btn-with-icon">
              WhatsApp Me <FaWhatsapp style={{ color: '#25D366' }} />
            </WhatsAppQrButton>
            {contact.email && (
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="strategy-btn strategy-btn-primary strategy-btn-with-icon"
              >
                Email Me <SiGmail style={{ color: '#EA4335' }} />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="strategy-section text-center">
        <h2 className="strategy-section-title">Ready to Start Trading?</h2>
        <p className="strategy-subtitle">Join successful traders with proven signals</p>
        <div className="strategy-btn-group">
          <Link to="/strategy" className="strategy-btn strategy-btn-primary">
            Learn About Strategy
          </Link>
          <Link to="/youtube" className="strategy-btn strategy-btn-primary">
            Watch Free Content
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Pricing;
