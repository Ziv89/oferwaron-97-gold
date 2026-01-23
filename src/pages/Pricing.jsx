// ============================================
// Pricing.jsx - Pricing Plans Page
// ============================================
import React, { useState } from 'react';
import { CONFIG } from '../App';

const plans = [
  {
    price: 100,
    period: 'month',
    description: 'Monthly subscription — continue only if it works for you',
    features: [
      'Real-time signals (instant)',
      'WhatsApp alerts',
      'Email notifications',
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

  return (
    <div className="page">
      {/* Hero */}
      {/* <section className="section text-center">
        <h1 className="section-title" style={{ fontSize: '2.5rem' }}>
          Simple, Transparent Pricing
        </h1>
        <p className="section-subtitle">
          One plan with everything you need. Cancel anytime.
        </p>
      </section> */}

      {/* Pricing Cards */}
      <section className="pricing-grid">
        {plans.map((plan, i) => (
          <div key={i} className="pricing-card featured">
            <div className="pricing-tier">{plan.name}</div>
            <div className="pricing-price">
              ${plan.price}
              <span>/month</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {plan.description}
            </p>

            <ul className="pricing-features">
              {plan.features.map((feature, j) => (
                <li key={j}>{feature}</li>
              ))}
              {plan.notIncluded.map((feature, j) => (
                <li key={`not-${j}`} style={{ opacity: 0.5, textDecoration: 'line-through' }}>
                  {feature}
                </li>
              ))}
            </ul>

            <a 
              href={`https://wa.me/${CONFIG.contact.whatsapp.replace('+', '')}?text=I'm interested in the ${plan.name} plan`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </section>

      {/* Trust Badges */}
      {/* <section className="section text-center">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '3rem', 
          flexWrap: 'wrap',
          margin: '2rem 0'
        }}>
          <div>
            <div style={{ fontSize: '2rem' }}>🔒</div>
            <div style={{ color: 'var(--text-secondary)' }}>Secure Payment</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem' }}>🚫</div>
            <div style={{ color: 'var(--text-secondary)' }}>Cancel Anytime</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem' }}>💬</div>
            <div style={{ color: 'var(--text-secondary)' }}>24/7 Support</div>
          </div>
        </div>
      </section> */}

      {/* FAQ */}
      <section className="section">
        <h2 className="section-title text-center"> Frequently Asked Questions❓</h2>
        
        <div style={{ maxWidth: '700px', margin: '2rem auto' }}>
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="card" 
              style={{ marginBottom: '1rem', cursor: 'pointer' }}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <h3 style={{ color: 'var(--gold)', fontSize: '1rem' }}>{faq.q}</h3>
                <span style={{ color: 'var(--gold)' }}>{openFaq === i ? '−' : '+'}</span>
              </div>
              {openFaq === i && (
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section text-center">
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--gold)', marginBottom: '1rem' }}>Still Have Questions?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Chat with us directly on WhatsApp or send us an email. We're here to help!
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href={`https://wa.me/${CONFIG.contact.whatsapp.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              WhatsApp Me 💬 
            </a>
         <a
  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${CONFIG.contact.email}`}
  target="_blank"
  rel="noopener noreferrer"
  className="btn btn-secondary"
>
  Email Me ✉️
</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Pricing;
