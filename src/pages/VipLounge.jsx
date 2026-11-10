// ============================================
// VipLounge.jsx - WhatsApp Group page, approved members only
//
// Shows the members-only WhatsApp group scan code. Live Alerts moved to the
// Live Trading page (/trading) - see components/LiveAlertsFeed.jsx.
// ============================================
import React, { useState, useCallback } from 'react';
import {
  FaWhatsapp,
  // re-enable with the Group Scanner section:
  // FaTrashAlt, FaSearch, FaPlus,
} from 'react-icons/fa';
import Seo from '../components/Seo';
import { ScancodeLightbox } from '../components/WhatsAppQr';
import { useScancodeImageState, SCANCODE } from '../services/scancodeImages';
import { useAuth, getUserName } from '../contexts/AuthContext';
import '../styles/auth.css';

// ============================================
// WHATSAPP GROUP QR - scancodes/ofernewScancode4 in Firebase Storage.
// Members-only: storage.rules lets only approved members read it, and it is
// shown on this page only. Click to enlarge for easier scanning.
// ============================================
const GROUP_QR_ALT = 'Scan to join the 97% Gold WhatsApp group';

function WhatsAppGroupQr() {
  const { url, failed } = useScancodeImageState(SCANCODE.whatsappGroup);
  const [enlarged, setEnlarged] = useState(false);
  const close = useCallback(() => setEnlarged(false), []);

  // Same card as WhatsApp on the Contact page, in glowing WhatsApp green.
  // Only the WhatsApp logo opens the scan code enlarged (not the card around it);
  // "coming soon" window until it is uploaded.
  return (
    <section className="strategy-section">
      <div className="strategy-rule-card contact-method-card vip-group-card">
        <button
          type="button"
          className="vip-group-card-icon"
          onClick={() => setEnlarged(true)}
          aria-label="Show WhatsApp group scan code"
        >
          <FaWhatsapp />
        </button>

      </div>

      {enlarged && (
        <ScancodeLightbox
          src={url}
          alt={GROUP_QR_ALT}
          missing={failed}
          onClose={close}
        />
      )}
    </section>
  );
}

export default function VipLounge() {
  const { user, profile } = useAuth();

  return (
    <div className="strategy-page">
      <Seo
        title="WhatsApp Group — 97% Gold"
        description="Member-only content  for 97% Gold members."
        path="/vip"
        noindex
      />

      <section className="strategy-section text-center">
        <h1 className="get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            WhatsApp Group
            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
          </span>
        </h1>
        <p className="strategy-subtitle">
          Welcome, {getUserName(profile, user)} — your members-only benefits are below. 
        </p>
              <WhatsAppGroupQr />

      </section>

 

    </div>
    
  );
}
