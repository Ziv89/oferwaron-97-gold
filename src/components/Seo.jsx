// ============================================
// Seo.jsx - one place for every page's meta tags
// Adds the og:image + twitter:card that were missing site-wide,
// and keeps canonical URLs correct now that we're on BrowserRouter.
// ============================================
import React from 'react';
import { Helmet } from 'react-helmet-async';

// Change this once if you move to a custom domain (e.g. https://97gold.com)
export const SITE_URL = 'https://www.oferwaron.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/**
 * @param {string} title        full <title>
 * @param {string} description  meta description
 * @param {string} path         route path, e.g. "/pricing" (canonical + og:url)
 * @param {string} [image]      absolute og image url (defaults to /og-image.jpg)
 * @param {string} [ogType]     "website" | "profile" | ...
 * @param {boolean}[noindex]    set true for pages you don't want indexed
 * @param {object} [jsonLd]     optional schema.org object rendered as JSON-LD
 */
export default function Seo({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      {/* Open Graph (WhatsApp, Facebook, LinkedIn, Telegram) */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="97% Gold" />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
