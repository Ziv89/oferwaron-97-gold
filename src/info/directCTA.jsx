import React from "react";
import CoinLoader from "../components/CoinLoader";
import { useCvContent } from "../services/cvContent";

const PANEL_TITLE = "Ofer Waron 97% Gold Trading Algorithm";

// Text with its bold / italic parts, e.g. <strong><em>Ofer Waron97%gold</em></strong> is a...
const Runs = ({ runs }) =>
  runs.map((run, i) => {
    let text = run.text;
    if (run.italic) text = <em>{text}</em>;
    if (run.bold) text = <strong>{text}</strong>;
    return <React.Fragment key={i}>{text}</React.Fragment>;
  });

// documents/cvgold.pdf from Firebase (siteData/cvContent), in the same markup
// as the built-in copy below. The panel keeps its title when the PDF has none
const CvBlocks = ({ blocks }) => (
  <>
    {!blocks.some((b) => b.type === "h1") && <h1>{PANEL_TITLE}</h1>}
    {blocks.map((block, i) => {
      switch (block.type) {
        case "h1":
          return <h1 key={i}><Runs runs={block.runs} /></h1>;
        case "h2":
          return <h2 key={i}><Runs runs={block.runs} /></h2>;
        case "ul":
          return (
            <ul key={i}>
              {block.items.map((item, j) => (
                <li key={j}>
                  <Runs runs={item.runs} />
                  {item.sub && (
                    <>
                      <br />
                      <span className="subdescription">{item.sub}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          );
        default:
          return <p key={i}><Runs runs={block.runs} /></p>;
      }
    })}
  </>
);

// Built-in copy - shown if the Firebase text is missing or fails to load
const BuiltInCv = () => (
  <>
    <h1>{PANEL_TITLE}</h1>
    <p>
      Ofer Waron 97% Gold is a proprietary trading algorithm developed for short-term
      gold trading (XAU/USD), focused on identifying high-probability market setups
      with strict validation and disciplined execution.
    </p>
    <p>
      The system is built entirely on price behavior and internal market dynamics,
      without reliance on news, sentiment, or external data sources. Its design
      prioritizes clarity, timing, and risk control over trade frequency.
    </p>

    <h2>Core Methodology</h2>
    <ul>
      <li><strong>Rule-Based Decision Engine</strong> — all signals are generated from predefined, data-driven conditions</li>
      <li><strong>Multi-Confirmation Logic</strong> — trade entries require several independent technical validations</li>
      <li><strong>Precision Entry Timing</strong> — optimized for moments of decisive market movement</li>
      <li><strong>Built-In Risk Structure</strong> — controlled exposure and predefined exit logic on every trade</li>
    </ul>

    <h2>Performance Philosophy</h2>
    <ul>
      <li>Tested across extended historical periods and varying market environments</li>
      <li>Focused on consistency, drawdown limitation, and capital preservation</li>
      <li>Avoids over-trading by operating only under favorable conditions</li>
    </ul>

    <h2>Access &amp; Availability</h2>
    <p>
      This algorithm is not publicly available and is provided by invitation only.
    </p>
    <p>
      <strong>Available exclusively as:</strong>
    </p>
    <ul>
      <li>
        <strong>Invite-Only TradingView Indicator</strong>
        <br />
        <span className="subdescription">Manual execution based on real-time alerts and on-chart signals</span>
      </li>
    </ul>
  </>
);

const BUILT_IN_FOOTER = "© Ofer Waron | All rights reserved.";

function DirectCTA() {
  const { loading, content } = useCvContent();

  return (
    <div className="directCTA-container">
      {/* Scrollable content area */}
      <div className="about-panel-scroll">
        {loading ? (
          <CoinLoader label="Loading…" />
        ) : content ? (
          <CvBlocks blocks={content.blocks} />
        ) : (
          <BuiltInCv />
        )}
      </div>


      <div className="about-panel-footer">
        <footer className="legal-notice">
          <p>{content?.footer || BUILT_IN_FOOTER}</p>
        </footer>
      </div>
    </div>
  );
}

export default DirectCTA;
