// ============================================
// AlertEmoji.jsx - the TradingView alert emojis drawn as icons
//
// Alerts arrive as text with emojis (see the alert system deck):
//   🟨🟨🟨 Long entry   🟪🟪🟪 Short entry   🟧🟧🟧 Orange Alert (target progress)
//   💫🚀💥 Closed in profit   ❌❌❌ Closed to protect from a loss
// Native emoji fonts draw these differently on every phone / PC, so
// renderAlertText() swaps them for these glossy icons - the same look on
// every device. Any other emoji / text is left as it is.
// Flat fills only (no gradient ids), so many copies on one page are safe.
// ============================================
import React from 'react';

// Glossy rounded square: darker base edge, face, top-left shine
const square = (face, edge, shine) => (
  <>
    <rect x="2" y="2.5" width="32" height="32" rx="5.5" fill={edge} />
    <rect x="2" y="1.5" width="32" height="30.5" rx="5.5" fill={face} />
    <rect x="4.5" y="3.5" width="27" height="14" rx="4" fill={shine} opacity="0.25" />
    <path d="M7 14.5c0-4.4 3-7.5 7.5-7.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.75" />
  </>
);

// Star polygon points around (cx, cy)
const starPoints = (cx, cy, outer, inner, spikes, rotate = -90) =>
  Array.from({ length: spikes * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = ((rotate + (i * 180) / spikes) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

const COLLISION_OUTER = starPoints(18, 18, 17, 8.5, 11, -80);
const COLLISION_INNER = starPoints(18, 18, 11, 5.5, 11, -80);
const DIZZY_STAR = starPoints(23, 12.5, 9, 4, 5);

const ICONS = {
  '🟨': square('#ffd21f', '#e09b00', '#fff6b0'),
  '🟪': square('#ad4fc6', '#7b2a93', '#f0c8ff'),
  '🟧': square('#ff9500', '#d46a00', '#ffd9a0'),
  '🟩': square('#43c049', '#25862a', '#c8ffc8'),
  '🟥': square('#ef3b36', '#b51d19', '#ffc4c0'),
  '🟦': square('#2f8ff0', '#1a5fb0', '#c4e2ff'),

  // ❌ - glossy red cross
  '❌': (
    <g transform="rotate(45 18 18)">
      <rect x="14" y="2" width="8" height="32" rx="4" fill="#c4161c" />
      <rect x="2" y="14" width="32" height="8" rx="4" fill="#c4161c" />
      <rect x="14" y="1.5" width="8" height="31" rx="4" fill="#f0412f" />
      <rect x="1.5" y="14" width="31" height="8" rx="4" fill="#f0412f" />
      <path d="M16 5v8.5M5 16h8.5M23 16h7" stroke="#ffb3a8" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),

  // 💥 - orange burst with a yellow core
  '💥': (
    <>
      <polygon points={COLLISION_OUTER} fill="#ff6a00" stroke="#e04400" strokeWidth="0.8" strokeLinejoin="round" />
      <polygon points={COLLISION_INNER} fill="#ffcc1f" />
      <circle cx="18" cy="18" r="3.2" fill="#fff7d1" />
    </>
  ),

  // 🚀 - silver rocket flying up-right, red nose and fins, blue window
  '🚀': (
    <g transform="rotate(45 18 18)">
      <path d="M15.2 27.5Q18 37 20.8 27.5z" fill="#ff8a00" />
      <path d="M16.4 27.5Q18 33 19.6 27.5z" fill="#ffe14d" />
      <path d="M12.6 18.5L7.5 25.5v3.5l5.6-3.6zM23.4 18.5l5.1 7v3.5l-5.6-3.6z" fill="#d7263d" />
      <path d="M18 2.5c6.2 5.2 7.2 13.6 5.4 23.3H12.6C10.8 16.1 11.8 7.7 18 2.5z" fill="#d9dee4" />
      <path d="M18 2.5c6.2 5.2 7.2 13.6 5.4 23.3H19.6c1.2-9.4.6-17.6-1.6-23.3z" fill="#aeb7c2" />
      <path d="M18 2.5c3.1 2.6 4.8 5.6 5.6 8.6H12.4c.8-3 2.5-6 5.6-8.6z" fill="#e8293b" />
      <rect x="13.6" y="25.4" width="8.8" height="2.6" rx="1" fill="#5d6977" />
      <rect x="17" y="24" width="2" height="5" rx="1" fill="#d7263d" />
      <circle cx="18" cy="16.5" r="3.4" fill="#7d8b99" />
      <circle cx="18" cy="16.5" r="2.4" fill="#2f86e0" />
      <circle cx="17.2" cy="15.7" r="0.8" fill="#bfe1ff" />
    </g>
  ),

  // 💫 - yellow star with an orbit swirl
  '💫': (
    <>
      <path d="M28.5 21.5c4 6.5-3.5 12.5-13 11.2C6 31.4 1.8 24.6 6.2 19.4" fill="none" stroke="#f5a300" strokeWidth="3" strokeLinecap="round" />
      <path d="M25.6 23.3c1.6 4-4 7-10.4 6.1C9.7 28.6 7 25.5 8.2 22.6" fill="none" stroke="#ffd84d" strokeWidth="1.6" strokeLinecap="round" />
      <polygon points={DIZZY_STAR} fill="#ffc400" stroke="#e08e00" strokeWidth="1" strokeLinejoin="round" />
      <path d="M20.6 9.6l1.4-2.6" stroke="#fff6c4" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
};

const EMOJI_PATTERN = new RegExp(`(${Object.keys(ICONS).join('|')})️?`, 'u');

export function AlertEmoji({ emoji }) {
  return (
    <svg className="alert-emoji" viewBox="0 0 36 36" role="img" aria-label={emoji}>
      {ICONS[emoji]}
    </svg>
  );
}

// Alert text with the known emojis swapped for icons (split keeps the
// captured emoji at the odd indexes; a trailing variation selector is dropped)
export const renderAlertText = (text = '') =>
  String(text)
    .split(new RegExp(EMOJI_PATTERN.source, 'gu'))
    .map((part, i) => (i % 2 ? <AlertEmoji key={i} emoji={part} /> : part));
