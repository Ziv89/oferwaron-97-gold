// ============================================
// StrategyOverview.jsx - "Strategy Overview" on the Strategy page
//
// Collapsed behind a button. When opened, loads the text of every
// documents/<name>.pdf (strategyDocuments/<name>, filled by the
// extractStrategyDocument Cloud Function) and lays each PDF page out as a
// slide in the About-style scrolling panel, styled like the PDF.
// One PDF is shown at a time; the switcher slides between them.
// ============================================
import React, { useRef, useState } from 'react';
import CoinLoader from './CoinLoader';
import { fetchStrategyDocuments, buildSlide, isCreditsSlide } from '../services/strategyDocument';

// Card colours / icons from the PDF, picked by the card heading
const CARD_ACCENTS = [
  { match: /LONG/i, accent: 'gold', icon: '🟨🟨🟨' },
  { match: /SHORT/i, accent: 'purple', icon: '🟪🟪🟪' },
  { match: /orange/i, accent: 'orange', icon: '🟧🟧🟧' },
  { match: /הפסד/, accent: 'red', icon: '❌❌❌' },
  { match: /רווח/, accent: 'green', icon: '💥🚀💫' },
];

const accentFor = (heading) => CARD_ACCENTS.find((a) => a.match.test(heading)) || {};

const Card = ({ card }) => {
  const { accent, icon } = accentFor(card.heading);
  return (
    <div className={`osn-card ${accent ? `osn-card--${accent}` : ''} ${card.heading ? '' : 'osn-card--note'}`}>
      {card.badge && <div className="osn-card-badge">{card.badge}</div>}
      {icon && <div className="osn-card-icon" aria-hidden="true">{icon}</div>}
      {card.heading && <h4 className="osn-card-title">{card.heading}</h4>}
      {card.lines.map((line, i) => (
        <p key={i} className="osn-card-text">{line}</p>
      ))}
    </div>
  );
};

const Slide = ({ slide, hero }) => (
  <section className={`osn-slide ${hero ? 'osn-slide--hero' : ''}`}>
    {slide.eyebrow && <p className="osn-eyebrow">{slide.eyebrow}</p>}
    {slide.title && <h3 className="osn-title">{slide.title}</h3>}

    {hero ? (
      slide.rows.map((row, i) =>
        i === 0 ? (
          <p key={i} className="osn-subtitle">{row.join(' ')}</p>
        ) : (
          <ul key={i} className="osn-points">
            {row.map((text, j) => <li key={j}>{text}</li>)}
          </ul>
        )
      )
    ) : (
      // Columns side by side as in the PDF, each column's cards stacked
      <div className="osn-columns">
        {slide.columns.map((column, i) => (
          <div key={i} className="osn-column">
            {column.map((card, j) => <Card key={j} card={card} />)}
          </div>
        ))}
      </div>
    )}
  </section>
);

// One PDF's pages as slides (cover / closing slides are marked hero)
const toSlides = (pages = []) =>
  pages.map((page) => buildSlide(page.paragraphs)).filter((slide) => !isCreditsSlide(slide));

export default function StrategyOverview() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ loading: false, docs: null, failed: false });
  const [current, setCurrent] = useState(0);
  // 'next' / 'prev' - which side the new PDF slides in from
  const [direction, setDirection] = useState('next');
  const scrollRef = useRef(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!next || state.docs || state.loading) return;

    setState({ loading: true, docs: null, failed: false });
    fetchStrategyDocuments()
      .then((list) => {
        const docs = list.map((d) => {
          const slides = toSlides(d.pages);
          // Switcher label: the cover slide's title, else the file name
          return { id: d.id, label: slides[0]?.title || d.name || d.id, slides };
        });
        setState({ loading: false, docs, failed: false });
      })
      .catch((err) => {
        console.error('Failed to load strategyDocuments:', err);
        setState({ loading: false, docs: null, failed: true });
      });
  };

  const docs = state.docs || [];
  const doc = docs[current];

  const goTo = (index) => {
    const target = (index + docs.length) % docs.length;
    if (!docs.length || target === current) return;
    setDirection(index > current ? 'next' : 'prev');
    setCurrent(target);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  return (
    <section className="strategy-section text-center">
      <button
        type="button"
        className="strategy-btn strategy-btn-primary"
        onClick={toggle}
        aria-expanded={open}
      >
        {open ? 'Hide Strategy Overview ▲' : 'Strategy Overview ▼'}
      </button>

      {open && (
        <div className="osn-panel">
          {docs.length > 1 && (
            <div className="osn-switcher">
              <button
                type="button"
                className="osn-switch-arrow"
                onClick={() => goTo(current - 1)}
                aria-label="Previous document"
              >
                &#8249;
              </button>
              <div className="osn-switch-center">
                <span className="osn-switch-label" dir="auto">{doc.label}</span>
                <div className="osn-switch-dots">
                  {docs.map((d, i) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`osn-switch-dot ${i === current ? 'active' : ''}`}
                      onClick={() => goTo(i)}
                      aria-label={d.label}
                      aria-current={i === current}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="osn-switch-arrow"
                onClick={() => goTo(current + 1)}
                aria-label="Next document"
              >
                &#8250;
              </button>
            </div>
          )}

          <div className="about-panel-scroll osn-scroll" dir="rtl" ref={scrollRef}>
            {state.loading && <CoinLoader label="Loading overview…" />}

            {state.failed && (
              <p className="osn-message" dir="ltr">Could not load the overview. Please try again later.</p>
            )}

            {state.docs && !docs.length && (
              <p className="osn-message" dir="ltr">The overview is coming soon.</p>
            )}

            {/* Keyed by document so each switch replays the swap animation */}
            {doc && (
              <div key={doc.id} className={`osn-doc osn-doc--${direction}`}>
                {doc.slides.map((slide, i) => (
                  <Slide key={i} slide={slide} hero={slide.hero} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
