const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function adminApp() {
  if (getApps().length) return getApps()[0];

  const {FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new HttpError(500, 'Server is missing Firebase admin credentials.');
  }

  return initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
async function requireSignedInUser(req) {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) throw new HttpError(401, 'Please sign in to watch.');

  const app = adminApp();
  let decoded;
  try {
    decoded = await getAuth(app).verifyIdToken(match[1]);
  } catch {
    throw new HttpError(401, 'Your session expired. Please sign in again.');
  }

  return decoded;
}

function sendError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error('[stream api]', error);
  return res.status(status).json({
    error: status >= 500 ? 'Streaming is temporarily unavailable.' : error.message,
  });
}

module.exports = { requireSignedInUser, sendError, HttpError };