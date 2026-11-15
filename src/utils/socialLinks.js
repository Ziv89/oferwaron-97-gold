// ============================================
// socialLinks.js - turns the owner's contact values from Firebase
// (siteData/ownerDetails) into links. The values are only used as link
// targets and never printed on the page.
// ============================================
import { useEffect, useState } from 'react';
import { useOwnerDetails } from '../App';

// Phones (portrait, and landscape where the height is small)
const SMALL_SCREEN_QUERY = '(max-width: 768px), (pointer: coarse) and (max-height: 500px)';

const matchesSmallScreen = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.(SMALL_SCREEN_QUERY).matches;

// True on smartphone-size screens - updates when the screen is resized / rotated
export const useIsSmallScreen = () => {
  const [isSmall, setIsSmall] = useState(matchesSmallScreen);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia(SMALL_SCREEN_QUERY);
    const update = () => setIsSmall(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  return isSmall;
};

const isUrl = (value) => /^https?:\/\//i.test(value);

// "+972 52-662-5716" -> https://wa.me/972526625716 (a full URL is kept as is)
export const whatsappHref = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (isUrl(raw)) return raw;
  const digits = raw.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
};

// Profile URL as is, or a bare handle ("oferwaron" / "@oferwaron") turned into one
const PROFILE_BASE = {
  youtube: (h) => `https://www.youtube.com/@${h}`,
  instagram: (h) => `https://www.instagram.com/${h}/`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
};

export const socialHref = (platform, value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (isUrl(raw)) return raw;
  const handle = raw.replace(/^@/, '');
  return PROFILE_BASE[platform] ? PROFILE_BASE[platform](handle) : '';
};

// { whatsapp, youtube, instagram, tiktok } -> link targets ('' when not set in Firebase)
export const useSocialLinks = () => {
  const { contact, social } = useOwnerDetails();
  return {
    whatsapp: whatsappHref(contact?.whatsapp),
    youtube: socialHref('youtube', social?.youtube),
    instagram: socialHref('instagram', social?.instagram),
    tiktok: socialHref('tiktok', social?.tiktok),
  };
};
