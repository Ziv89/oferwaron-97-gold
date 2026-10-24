// ============================================
// Contact.jsx - Contact Page (Strategy Style)
// ============================================
import React, { useState, useCallback } from 'react';
import { useOwnerDetails } from '../App';
import Seo from '../components/Seo';
import { SiGmail } from 'react-icons/si';
import { FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { useSelfImage } from '../services/selfImages';
import { useScancodeImage } from '../services/scancodeImages';
import { ScancodeLightbox } from '../components/WhatsAppQr';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get contact data from Firebase
  const { contact, loading } = useOwnerDetails();

  // Hero image from Firebase Storage: selfimages/ofernewSelfimage.jpg
  const heroImageSrc = useSelfImage(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const subject = encodeURIComponent(`[${formData.subject}] Message from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Subject: ${formData.subject}\n\n` +
      `Message:\n${formData.message}`
    );

    // Open email client with pre-filled data
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Scan codes from Firebase Storage: scancodes/ofernewScancode.jpg (WhatsApp), scancodes/ofernewScancode2.jpg (YouTube)
  const whatsappScancode = useScancodeImage(0);
  const youtubeScancode = useScancodeImage(2);
  const [openScancode, setOpenScancode] = useState(null);
  const closeScancode = useCallback(() => setOpenScancode(null), []);

  // Contact methods using Firebase data
  // Cards with a `scancode` open it enlarged instead of linking out
  const contactMethods = [
    {
      icon: <SiGmail style={{ color: '#EA4335' }} />,
      title: 'Email',
      desc: 'Detailed inquiries',
      value: contact.email,
      link: `https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`,
      colorClass: 'email'
    },
    {
      icon: <FaWhatsapp style={{ color: '#25D366' }} />,
      title: 'WhatsApp',
      desc: 'Fastest response',
      value: 'Scan QR code',
      colorClass: 'whatsapp',
      scancode: {
        src: whatsappScancode,
        alt: 'Scan to chat with Ofer on WhatsApp',
        caption: 'Scan with your phone camera to chat on WhatsApp'
      }
    },
    {
      icon: <FaYoutube style={{ color: '#FF0000' }} />,
      title: 'YouTube',
      desc: 'Free education',
      value: 'OferWaron97Gold',
      colorClass: 'youtube',
      scancode: {
        src: youtubeScancode,
        alt: 'Scan to open the OferWaron97Gold YouTube channel',
        caption: 'Scan with your phone camera to open the YouTube channel'
      }
    }
  ];

  if (loading) {
    return (
      <div className="strategy-page">
        <Seo
          title="Contact — 97% Gold"
          description="Get in touch with 97% Gold via WhatsApp or email for questions about XAUUSD trading signals."
          path="/contact"
        />
        <section className="strategy-section text-center">
          <p className="strategy-subtitle">Loading contact information...</p>
        </section>
{/* Contact Form */}
      <section className="strategy-section">
        <div className="strategy-principle-card contact-form-card">
          {submitted ? (
            <div className="text-center">
              <h2 className="strategy-card-title">Message ready ✉️</h2>
              <p className="strategy-principle-text">
                Your email app should have opened with the message. If nothing happened,
                reach me directly on WhatsApp above.
              </p>
            </div>
          ) : (
            <>
              <h2 className="strategy-card-title text-center">Send a Message</h2>

              <div className="contact-form">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="contact-input"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  className="contact-input"
                  required
                />
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="contact-input"
                >
                  <option>General Inquiry</option>
                  <option>Free Trial</option>
                  <option>Subscription</option>
                  <option>Technical Support</option>
                </select>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message"
                  rows={5}
                  className="contact-input"
                  required
                />

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.message}
                  className="strategy-btn strategy-btn-primary"
                >
                  {isSubmitting ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
      </div>
    );
  }

  return (
    <div className="strategy-page">
      <Seo
        title="Contact — 97% Gold"
        description="Get in touch with 97% Gold via WhatsApp or email for questions about XAUUSD trading signals."
        path="/contact"
      />

      {/* Hero with Image */}
      <section className="strategy-section text-center">
        <h1 className="get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
          Get in Touch
            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
          </span>
        </h1>

        {/* Contact Hero Image */}
        <div className="contact-hero-image-wrapper">
          <div className="contact-hero-image-container">
            {heroImageSrc && (
              <img
                src={heroImageSrc}
                alt="Ofer Waron - Ready to help"
                className="contact-hero-image"
              />
            )}
            <div className="contact-hero-image-glow"></div>
          </div>
        </div>

        <p className="strategy-subtitle contact-hero-subtitle">
          Have questions? I'd love to hear from you.<br />
          Send me a message and I'll respond as soon as possible.
        </p>
      </section>

      {/* Contact Methods - Strategy Card Style */}
      <section className="strategy-section">
        <div className="strategy-card-grid">
          {contactMethods.map((method, i) => {
            const cardContent = (
              <>
                <div className="strategy-rule-icon">{method.icon}</div>
                <h3 className="strategy-rule-title">{method.title}</h3>
                <p className="strategy-rule-desc">{method.desc}</p>
                <p className="contact-method-value">{method.value}</p>
              </>
            );
            const className = `strategy-rule-card contact-method-card contact-method-${method.colorClass}`;

            // WhatsApp / YouTube are reachable only by scanning - the card opens the scan code enlarged
            if (method.scancode) {
              const openCard = () => {
                if (method.scancode.src) setOpenScancode(method.scancode);
              };

              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  className={className}
                  style={{ cursor: 'pointer' }}
                  onClick={openCard}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openCard();
                    }
                  }}
                  aria-label={`Show ${method.title} scan code`}
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <a
                key={i}
                href={method.link}
                target={method.link.startsWith('mailto:') ? '_self' : '_blank'}
                rel={method.link.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className={className}
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                {cardContent}
              </a>
            );
          })}
        </div>
      </section>

      {openScancode && (
        <ScancodeLightbox
          src={openScancode.src}
          alt={openScancode.alt}
          caption={openScancode.caption}
          onClose={closeScancode}
        />
      )}
    </div>
  );
}

export default Contact;
