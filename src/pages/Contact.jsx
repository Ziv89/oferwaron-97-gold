// ============================================
// Contact.jsx - Contact Page (Strategy Style)
// ============================================
import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOwnerDetails } from '../App';
import Seo from '../components/Seo';
import { SiGmail } from 'react-icons/si';
import { FaWhatsapp, FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa';
import { useSelfImage } from '../services/selfImages';
import { useScancodeImageState, SCANCODE } from '../services/scancodeImages';
import { ScancodeLightbox } from '../components/WhatsAppQr';
import { LoadingImage } from '../components/LoadingMedia';

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

  // Scan codes from Firebase Storage (.jpg or .jpeg):
  // scancodes/ofernewScancode (WhatsApp), ofernewScancode2 (TikTok), ofernewScancode3 (Instagram),
  // ofernewScancode4 (YouTube - the window shows "coming soon" until it is uploaded)
  const whatsappScancode = useScancodeImageState(SCANCODE.whatsapp);
  const youtubeScancode = useScancodeImageState(SCANCODE.youtube);
  const tiktokScancode = useScancodeImageState(SCANCODE.tiktok);
  const instagramScancode = useScancodeImageState(SCANCODE.instagram);
  // Key (colorClass) of the open card - its scan code is read live so the window updates once the image loads
  const [openScancodeKey, setOpenScancodeKey] = useState(null);
  const closeScancode = useCallback(() => setOpenScancodeKey(null), []);

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
        src: whatsappScancode.url,
        missing: whatsappScancode.failed,
        alt: 'Scan to chat with Ofer on WhatsApp',
        caption: 'Scan with your phone camera to chat on WhatsApp'
      }
    },
    {
      icon: <FaYoutube style={{ color: '#FF0000' }} />,
      title: 'YouTube',
      desc: 'Free education',
      value: 'Scan QR code',
      colorClass: 'youtube',
      scancode: {
        src: youtubeScancode.url,
        missing: youtubeScancode.failed,
        alt: 'Scan to open the OferWaron97Gold YouTube channel',
        caption: 'Scan with your phone camera to open the YouTube channel'
      }
    },
    {
      icon: <FaInstagram style={{ color: '#E4405F' }} />,
      title: 'Instagram',
      desc: 'Daily updates',
      value: 'Scan QR code',
      colorClass: 'instagram',
      scancode: {
        src: instagramScancode.url,
        missing: instagramScancode.failed,
        alt: 'Scan to open Ofer on Instagram',
        caption: 'Scan with your phone camera to open Instagram'
      }
    },
    {
      icon: <FaTiktok style={{ color: '#000000' }} />,
      title: 'TikTok',
      desc: 'Short clips',
      value: 'Scan QR code',
      colorClass: 'tiktok',
      scancode: {
        src: tiktokScancode.url,
        missing: tiktokScancode.failed,
        alt: 'Scan to open Ofer on TikTok',
        caption: 'Scan with your phone camera to open TikTok'
      }
    }
  ];

  const openScancode = contactMethods.find((m) => m.colorClass === openScancodeKey)?.scancode;

  // Footer "Connect" links land here as /contact?scan=<whatsapp|youtube|instagram|tiktok>:
  // open that scan code window (the coin shows until the image loads), then drop the param
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedScan = searchParams.get('scan');

  useEffect(() => {
    if (!requestedScan) return;
    if (contactMethods.some((m) => m.colorClass === requestedScan && m.scancode)) {
      setOpenScancodeKey(requestedScan);
    }
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedScan]);

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
            <LoadingImage
              src={heroImageSrc}
              alt="Ofer Waron - Ready to help"
              className="contact-hero-image"
              coinSize={90}
            />
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

            // Cards with a loaded scan code (WhatsApp / YouTube / Instagram / TikTok) open it - the card opens the scan code enlarged
            if (method.scancode) {
              const openCard = () => setOpenScancodeKey(method.colorClass);

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

            if (!method.link) {
              return (
                <div key={i} className={className}>
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
          missing={openScancode.missing}
          onClose={closeScancode}
        />
      )}
    </div>
  );
}

export default Contact;
