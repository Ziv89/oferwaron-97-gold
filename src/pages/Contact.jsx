// ============================================
// Contact.jsx - Contact Page (FIXED mail links)
// ============================================
import React, { useState } from 'react';
import { CONFIG } from '../App';
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

  // ✅ Target email address
  const TARGET_EMAIL = 'oferwv123@gmail.com';

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
    window.location.href = `mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ FIXED CONTACT METHODS
  const contactMethods = [

    {
      icon: '✉️',
      title: 'Email',
      desc: 'Detailed inquiries',
      value: TARGET_EMAIL,
link: `https://mail.google.com/mail/?view=cm&fs=1&to=${CONFIG.contact.email}`,
      colorClass: 'email'
    },
      {
      icon: '💬',
      title: 'WhatsApp',
      desc: 'Fastest response',
      value: CONFIG.contact.whatsapp,
      link: `https://wa.me/${CONFIG.contact.whatsapp.replace('+', '')}`,
      colorClass: 'whatsapp'
    },
    {
      icon: '📺',
      title: 'YouTube',
      desc: 'Free education',
      value: 'OferWaron97Gold',
      link: CONFIG.social.youtube,
      colorClass: 'youtube'
    }
  ];

  return (
    <div className="page">
      {/* Hero with Image */}
      <section className="section text-center">
        <h1 className="section-title section-title-large">Get in Touch</h1>
        
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
          {/* <div className="contact-hero-badge">
            <span className="contact-hero-badge-icon">📞</span>
            <span className="contact-hero-badge-text">Available Now</span>
          </div> */}
        </div>

        <p className="section-subtitle contact-hero-subtitle">
          Have questions? I'd love to hear from you.<br />
          Send me a message and I'll respond as soon as possible.
        </p>
      </section>

      {/* Contact Methods */}
      <section className="section">
        <div className="contact-methods">
          {contactMethods.map((method, i) => (
            <a
              key={i}
              href={method.link}
              target={method.link.startsWith('mailto:') ? '_self' : '_blank'}
              rel={method.link.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className={`card contact-card contact-card-${method.colorClass}`}
            >
              <div className="contact-card-icon">{method.icon}</div>
              <h3 className={`contact-card-title text-${method.colorClass}`}>
                {method.title}
              </h3>
              <p className="contact-card-desc">{method.desc}</p>
              <p className="contact-card-value">{method.value}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      {/* <section className="section">
        <div className="card card-centered">
          <h2 className="section-title text-center">📝 Send a Message</h2>

          {submitted ? (
            <div className="form-success">
              <div className="form-success-icon">✅</div>
              <h3 className="form-success-title">Message Sent!</h3>
              <p className="form-success-text">
                We'll get back to you within 24 hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: '',
                    email: '',
                    subject: 'General Inquiry',
                    message: ''
                  });
                }}
                className="btn btn-secondary mt-2"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Subscription Question">Subscription Question</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="How can I help you?"
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-full ${isSubmitting ? 'btn-disabled' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section> */}
    </div>
  );
}

export default Contact;
