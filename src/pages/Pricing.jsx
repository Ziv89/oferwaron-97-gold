// ============================================
// Pricing.jsx - Pricing Page (Strategy-style golden design)
// ============================================
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOwnerDetails } from '../App';
import questionMarkCoin from '../assets/images/questionMarkCoin.png';

const plans = [
  {
    name: 'Gold Signals',
    price: 100,
    period: 'month',
    description: 'Monthly subscription — continue only if it works for you',
    features: [
      'Real-time signals (instant)',
      'WhatsApp alerts',
      'Entry, exit & stop-loss levels',
      'Risk management guidance',
      'Monthly performance reports',
      'Access to all analysis'
    ],
    notIncluded: [],
    cta: 'Get Access'
  }
];

const faqs = [
  {
    q: 'How do I receive the signals?',
    a: 'Signals are sent instantly via my WhatsApps Group.'
  },
  {
    q: 'What broker should I use?',
    a: "I don't work with or promote a specific broker. You should use a regulated broker that supports Gold (XAUUSD), tight spreads, and fast execution. Popular choices are brokers regulated in the EU, UK, or Australia. The final choice is yours."
  },
  {
    q: 'How many signals do you send?',
    a: 'Signals are quality-based, not quantity-based. On the 4H timeframe, usually 1–3 signals per week, depending on market conditions. Some weeks have more, some less — no forced trades.'
  },
  {
    q: 'Is there a money-back guarantee?',
    a: 'No, but you can decide not to continue the subscription at the end of each month.'
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes. You can cancel anytime and your subscription will remain active until the end of the billing period.'
  },
  {
    q: 'Do you provide trading education?',
    a: "Yes. I provide practical trading education focused on risk management, market structure, and how to trade signals correctly. Alongside the signals, I explain why the trade was taken, how to manage risk, and how to avoid overtrading. The goal is not blind signals, but understanding how to trade them responsibly."
  }
];

function Pricing() {
  const [openFaq, setOpenFaq] = useState(null);
  
  // Get contact data from Firebase
  const { contact, loading } = useOwnerDetails();

  if (loading) {
    return (
      <div className="strategy-page">
        <section className="strategy-section text-center">
          <p className="strategy-subtitle">Loading...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="strategy-page">
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
                />
              </h2>

              <p className="strategy-subtitle text-center">Everything you need to know</p>
            </div>

            <div className="faq-body">
              <div className="faq-container">
              {faqs.map((faq, i) => (
                <div 
                  key={i} 
                  className={`faq-item ${openFaq === i ? 'faq-open' : ''}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="faq-question">
                    <h3>{faq.q}</h3>
                    <span className="faq-toggle">{openFaq === i ? '−' : '+'}</span>
                  </div>
                  {openFaq === i && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Pricing Card - Right Side */}
          <div className="pricing-card-column">
            {plans.map((plan, i) => (
              <div key={i} className="strategy-pricing-card">
                <div className="pricing-tier-badge">{plan.name}</div>
                <div className="pricing-price-display">
                  <span className="pricing-currency">$</span>
                  <span className="pricing-amount">{plan.price}</span>
                  <span className="pricing-period">/month</span>
                </div>
                <p className="strategy-subtitle" style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>
                  {plan.description}
                </p>

                <ul className="pricing-features-list">
                  {plan.features.map((feature, j) => (
                    <li key={j}>
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a 
                  href={contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace('+', '')}?text=Hi! I'm interested in the ${plan.name} subscription ($${plan.price}/month)` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="strategy-btn strategy-btn-primary"
                  style={{ width: '100%', marginTop: '1.5rem' }}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
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
            {contact.whatsapp && (
              <a 
                href={`https://wa.me/${contact.whatsapp.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="strategy-btn strategy-btn-primary"
              >
                WhatsApp Me 💬
              </a>
            )}
            {contact.email && (
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="strategy-btn strategy-btn-primary"
              >
                Email Me ✉️
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
