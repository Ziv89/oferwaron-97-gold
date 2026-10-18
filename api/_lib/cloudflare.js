const crypto = require('crypto');
const { HttpError } = require('./auth');

const TOKEN_TTL_SECONDS = 60 * 60;
const STATUS_CACHE_MS = 15 * 1000;

function env(name) {
  const value = process.env[name];
  if (!value) throw new HttpError(500, `Server is missing ${name}.`);
  return value.trim();
}

const base64url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

function signingKeyPem() {
  const value = env('CLOUDFLARE_SIGNING_KEY_PEM').replace(/\\n/g, '\n');
  return value.includes('BEGIN') ? value : Buffer.from(value, 'base64').toString('utf8');
}

function signPlaybackToken(uid) {
  const keyId = env('CLOUDFLARE_SIGNING_KEY_ID');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid: keyId };
  const payload = {
    sub: uid,
    kid: keyId,
    nbf: now - 60,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(signingKeyPem());

  return `${unsigned}.${base64url(signature)}`;
}

function embedUrlFor(uid) {
  const customerCode = env('CLOUDFLARE_STREAM_CUSTOMER_CODE')
    .replace(/^customer-/, '')
    .replace(/\.cloudflarestream\.com$/, '');
  return `https://customer-${customerCode}.cloudflarestream.com/${signPlaybackToken(uid)}/iframe`;
}

let statusCache = { at: 0, value: null };

async function getLiveInputOverview() {
  if (statusCache.value && Date.now() - statusCache.at < STATUS_CACHE_MS) {
    return statusCache.value;
  }

  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  const liveInputUid = env('CLOUDFLARE_LIVE_INPUT_UID');
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${liveInputUid}/videos`,
    { headers: { Authorization: `Bearer ${env('CLOUDFLARE_STREAM_API_TOKEN')}` } }
  );
  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.success) {
    throw new HttpError(502, `Cloudflare API error: ${body.errors?.[0]?.message || response.status}`);
  }

  const videos = Array.isArray(body.result) ? body.result : [];
  const live = videos.some((video) => video.status?.state === 'live-inprogress');
  const replays = videos
    .filter((video) => video.status?.state === 'ready' && video.readyToStream)
    .sort((first, second) => new Date(second.created) - new Date(first.created))
    .slice(0, 30)
    .map((video) => ({
      uid: video.uid,
      title: video.meta?.name || '',
      created: video.created,
      duration: Math.round(video.duration || 0),
    }));

  statusCache = {
    at: Date.now(),
    value: { live, replays, replayIds: new Set(replays.map((replay) => replay.uid)) },
  };
  return statusCache.value;
}

module.exports = { embedUrlFor, getLiveInputOverview, env };