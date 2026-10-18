// ============================================
// Contact.jsx - Contact Page (Strategy Style)
// ============================================
import React, { useState } from 'react';
import { useOwnerDetails } from '../App';
import OferWhite from '../assets/images/oferWhite.jpg';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get contact and social data from Firebase
  const { contact, social, loading } = useOwnerDetails();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Build mailto link with form data
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

  // Contact methods using Firebase data
  const contactMethods = [
    {
      icon: '✉️',
      title: 'Email',
      desc: 'Detailed inquiries',
      value: contact.email,
      link: `https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`,
      colorClass: 'email'
    },
    {
      icon: '💬',
      title: 'WhatsApp',
      desc: 'Fastest response',
      value: contact.whatsapp,
      link: contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace('+', '')}` : '#',
      colorClass: 'whatsapp'
    },
    {
      icon: '📺',
      title: 'YouTube',
      desc: 'Free education',
      value: 'OferWaron97Gold',
      link: social.youtube,
      colorClass: 'youtube'
    }
  ];

  if (loading) {
    return (
      <div className="strategy-page">
        <section className="strategy-section text-center">
          <p className="strategy-subtitle">Loading contact information...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="strategy-page">
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
            <img 
              src={OferWhite} 
              alt="Ofer Waron - Ready to help" 
              className="contact-hero-image"
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
          {contactMethods.map((method, i) => (
            <a
              key={i}
              href={method.link}
              target={method.link.startsWith('mailto:') ? '_self' : '_blank'}
              rel={method.link.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className={`strategy-rule-card contact-method-card contact-method-${method.colorClass}`}
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              <div className="strategy-rule-icon">{method.icon}</div>
              <h3 className="strategy-rule-title">{method.title}</h3>
              <p className="strategy-rule-desc">{method.desc}</p>
              <p className="contact-method-value">{method.value}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Contact;
