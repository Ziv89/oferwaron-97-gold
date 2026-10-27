// ============================================
// VipLounge.jsx - signed-in members only
//
// Home for member-only tools. First tool: WhatsApp group scanning.
// Members save the groups they want scanned; the scanner itself is not
// built yet, so "Scan now" is disabled and every group stays "pending".
// ============================================
import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaTrashAlt, FaSearch } from 'react-icons/fa';
import Seo from '../components/Seo';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToGroups,
  addGroup,
  removeGroup,
  WHATSAPP_INVITE_PATTERN,
  SCAN_STATUS,
} from '../services/whatsappGroups';
import '../styles/auth.css';

const COMING_SOON = ['Scan results & insights', 'Scheduled re-scans', 'More member tools'];

export default function VipLounge() {
  const { user, profile } = useAuth();

  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [name, setName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return undefined;

    return subscribeToGroups(
      user.uid,
      (list) => {
        setGroups(list);
        setGroupsLoading(false);
      },
      () => {
        setError('Could not load your groups. Please refresh the page.');
        setGroupsLoading(false);
      }
    );
  }, [user]);

  const linkIsValid = WHATSAPP_INVITE_PATTERN.test(inviteLink.trim());

  const handleAdd = async () => {
    if (!name.trim() || !linkIsValid) return;

    setSaving(true);
    setError('');

    try {
      await addGroup(user.uid, { name, inviteLink });
      setName('');
      setInviteLink('');
    } catch (err) {
      setError('Could not save the group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (groupId) => {
    try {
      await removeGroup(user.uid, groupId);
    } catch (err) {
      setError('Could not remove the group. Please try again.');
    }
  };

  return (
    <div className="strategy-page">
      <Seo
        title="WhatsApp Group — 97% Gold"
        description="Member-only tools for 97% Gold members."
        path="/vip"
        noindex
      />

      <section className="strategy-section text-center">
        <h1 className="get-in-touch-title get-in-touch-title--shimmer">
          <span className="get-in-touch-shimmer">
            WhatsApp Group Scanner  
            <span className="sparkle sparkle-1">✦</span>
            <span className="sparkle sparkle-2">✦</span>
          </span>
        </h1>
        <p className="strategy-subtitle">
          Members-only tools for {profile?.displayName || user?.email}
        </p>
      </section>

      {/* ---------- WhatsApp group scanning ---------- */}
      <section className="strategy-section">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">
            <FaWhatsapp style={{ color: '#25D366', verticalAlign: 'middle' }} /> WhatsApp Group Scanner
          </h2>

          <p className="strategy-principle-text">
            Add the WhatsApp groups you want scanned. Your list is private to your
            account. Scanning is coming soon — groups you add now will be ready
            to scan as soon as it launches.
          </p>

          <div className="auth-form" style={{ marginTop: '1.25rem' }}>
            <input
              type="text"
              className="contact-input"
              placeholder="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
            <input
              type="url"
              className="contact-input"
              placeholder="Invite link (https://chat.whatsapp.com/...)"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />

            {inviteLink.trim() && !linkIsValid && (
              <p className="member-hint">
                Paste the group invite link — it starts with https://chat.whatsapp.com/
              </p>
            )}
            {error && <p className="auth-error">{error}</p>}

            <button
              type="button"
              className="strategy-btn strategy-btn-primary"
              onClick={handleAdd}
              disabled={saving || !name.trim() || !linkIsValid}
            >
              {saving ? 'Saving…' : 'Add Group'}
            </button>
          </div>
        </div>
      </section>

      <section className="strategy-section">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">My Groups</h2>

          {groupsLoading ? (
            <p className="strategy-principle-text">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="strategy-principle-text">No groups yet. Add one above.</p>
          ) : (
            <ul className="vip-group-list">
              {groups.map((group) => (
                <li key={group.id} className="vip-group-item">
                  <div className="vip-group-info">
                    <strong>{group.name}</strong>
                    <span className="member-hint">
                      {SCAN_STATUS[group.status] || SCAN_STATUS.pending}
                    </span>
                  </div>
                  <div className="vip-group-actions">
                    <button
                      type="button"
                      className="strategy-btn"
                      disabled
                      title="Coming soon"
                    >
                      <FaSearch /> Scan now
                    </button>
                    <button
                      type="button"
                      className="strategy-btn"
                      onClick={() => handleRemove(group.id)}
                      aria-label={`Remove ${group.name}`}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ---------- Roadmap ---------- */}
      <section className="strategy-section">
        <div className="strategy-principle-card">
          <h2 className="strategy-card-title">Coming Soon</h2>
          <ul className="strategy-principle-text">
            {COMING_SOON.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
