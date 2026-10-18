#!/usr/bin/env node
// One-time Cloudflare Stream setup for the 97% Gold member live page.
// Run from the repository root after setting the account ID and API token.

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN?.trim();
const existingInput = process.env.CLOUDFLARE_LIVE_INPUT_UID?.trim();
const defaultOrigins = 'oferwaron97gold.vercel.app,localhost:3000';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultOrigins)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!accountId || !apiToken) {
  console.error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN first.');
  process.exit(1);
}

const api = async (method, path, body) => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    const message = result.errors?.map((error) => `${error.code}: ${error.message}`).join('; ')
      || response.status;
    throw new Error(`${method} ${path} failed: ${message}`);
  }

  return result.result;
};

const liveInputConfig = {
  meta: { name: '97% Gold - Member Live' },
  preferLowLatency: true,
  recording: {
    mode: 'automatic',
    requireSignedURLs: true,
    allowedOrigins,
  },
};

try {
  const input = existingInput
    ? await api('PUT', `/stream/live_inputs/${existingInput}`, liveInputConfig)
    : await api('POST', '/stream/live_inputs', liveInputConfig);
  const signingKey = process.env.SKIP_SIGNING_KEY
    ? null
    : await api('POST', '/stream/keys');

  console.log('\nCloudflare live input ready.\n');
  console.log('OBS settings (keep the stream key private):');
  console.log(`Server: ${input.rtmps?.url || '(see Cloudflare dashboard)'}`);
  console.log(`Stream key: ${input.rtmps?.streamKey || '(see Cloudflare dashboard)'}`);
  console.log('\nVercel environment variable values:');
  console.log(`CLOUDFLARE_ACCOUNT_ID=${accountId}`);
  console.log('CLOUDFLARE_STREAM_API_TOKEN=<same scoped token>');
  console.log(`CLOUDFLARE_LIVE_INPUT_UID=${input.uid}`);
  console.log('CLOUDFLARE_STREAM_CUSTOMER_CODE=<customer code from Stream player URL>');

  if (signingKey) {
    console.log(`CLOUDFLARE_SIGNING_KEY_ID=${signingKey.id}`);
    console.log(`CLOUDFLARE_SIGNING_KEY_PEM=${signingKey.pem}`);
    console.log('\nSave the signing key securely; Cloudflare only returns it once.');
  }

  console.log(`\nAllowed origins: ${allowedOrigins.join(', ')}\n`);
} catch (error) {
  console.error(`\nCloudflare setup failed: ${error.message}`);
  console.error('Check the account ID and ensure the token has Stream Read and Stream Write.');
  process.exit(1);
}