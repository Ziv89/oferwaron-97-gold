// ============================================
// VipLounge.jsx - WhatsApp Group page, approved members only
//
// Shows the members-only WhatsApp group scan code. Live Alerts moved to the
// Live Trading page (/trading) - see components/LiveAlertsFeed.jsx.
// ============================================
import React, { useState, useCallback } from 'react';
import {
  FaUsers, FaWhatsapp,
  // re-enable with the Group Scanner section:
  // FaTrashAlt, FaSearch, FaPlus,
} from 'react-icons/fa';
import Seo from '../components/Seo';
import { ScancodeLightbox } from '../components/WhatsAppQr';
import { useStorageImage } from '../services/storageImages';
import { useScancodeImageState, SCANCODE } from '../services/scancodeImages';
import { useAuth } from '../contexts/AuthContext';
import '../styles/auth.css';

// ============================================
// WHATSAPP GROUP QR - scancodes/ofernewScancode4 in Firebase Storage.
// Members-only: storage.rules lets only approved members read it, and it is
// shown on this page only. Click to enlarge for easier scanning.
// ============================================
const GROUP_QR_ALT = 'Scan to join the 97% Gold WhatsApp group';
const GROUP_QR_CAPTION = 'Scan with your phone camera to join the WhatsApp group';

function WhatsAppGroupQr() {
  const { url, failed } = useScancodeImageState(SCANCODE.whatsappGroup);
  const groupAvatarUrl = useStorageImage('logos', 'SantaLogo', 0);
  const [enlarged, setEnlarged] = useState(false);
  const close = useCallback(() => setEnlarged(false), []);

  // Same card as WhatsApp on the Contact page, in glowing WhatsApp green.
  // Only the group logo opens the scan code enlarged (not the card around it);
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
          {groupAvatarUrl ? <img className="vip-group-card-avatar" src={groupAvatarUrl} alt="" /> : <FaUsers />}
          <span className="vip-group-card-badge"><FaWhatsapp /></span>
        </button>
        <h3 className="strategy-rule-title">WhatsApp Group</h3>
        <p className="strategy-rule-desc">Members-only community</p>
        <p className="contact-method-value">Scan QR code</p>
      </div>

      {enlarged && (
        <ScancodeLightbox
          src={url}
          alt={GROUP_QR_ALT}
          caption={GROUP_QR_CAPTION}
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
          Welcome, {profile?.displayName || user?.email} — your members-only benefits are below. 
        </p>
      </section>

      {/* ---------- WhatsApp group scanner: add form + my groups ---------- */}


      {/* ---------- WhatsApp group scan code (members only) ---------- */}
      <WhatsAppGroupQr />


      {/* ---------- Roadmap ---------- */}
      {/* <section className="strategy-section">
        <div className="strategy-principle-card vip-card">
          <h2 className="strategy-card-title vip-card-title">Coming Soon</h2>
          <ul className="vip-chips">
            {COMING_SOON.map((item) => (
              <li key={item} className="vip-chip">{item}</li>
            ))}
          </ul>
        </div>
      </section> */}
            {/* <section className="strategy-section">
        <div className="strategy-principle-card vip-card">
          <h2 className="strategy-card-title vip-card-title">
            <FaWhatsapp style={{ color: '#25D366' }} /> Group Scanner
          </h2>
          <p className="member-hint vip-card-intro">
            Save the groups you want scanned. Your list is private to your account —
            groups you add now will be ready the moment scanning launches.
          </p>

          <form className="auth-form vip-add-form" onSubmit={handleAdd}>
            <div className="vip-add-fields">
              <input
                type="text"
                className="contact-input"
                placeholder="Group name"
                aria-label="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />
              <input
                type="url"
                className="contact-input"
                placeholder="https://chat.whatsapp.com/..."
                aria-label="Group invite link"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            {inviteLink.trim() && !linkIsValid && (
              <p className="member-hint">
                Paste the group invite link — it starts with https://chat.whatsapp.com/
              </p>
            )}
            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="strategy-btn strategy-btn-primary"
              disabled={saving || !name.trim() || !linkIsValid}
            >
              <FaPlus /> {saving ? 'Saving…' : 'Add Group'}
            </button>
          </form>

          <div className="vip-subheading">
            <h3>My Groups</h3>
            {!groupsLoading && <span className="vip-count">{groups.length}</span>}
          </div>

          {groupsLoading ? (
            <p className="member-hint">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="vip-empty">No groups yet — add your first one above.</p>
          ) : (
            <ul className="vip-group-list">
              {groups.map((group) => {
                const status = SCAN_STATUS[group.status] ? group.status : 'pending';
                return (
                  <li key={group.id} className="vip-group-item">
                    <span className="vip-group-avatar" aria-hidden="true"><FaWhatsapp /></span>
                    <div className="vip-group-info">
                      <strong>{group.name}</strong>
                      <span className={`vip-status vip-status--${status}`}>{SCAN_STATUS[status]}</span>
                    </div>
                    <div className="vip-group-actions">
                      <button type="button" className="strategy-btn" disabled title="Coming soon">
                        <FaSearch /> Scan
                      </button>
                      <button
                        type="button"
                        className="strategy-btn vip-remove-btn"
                        onClick={() => handleRemove(group)}
                        aria-label={`Remove ${group.name}`}
                        title="Remove"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section> */}
    </div>
    
  );
}
