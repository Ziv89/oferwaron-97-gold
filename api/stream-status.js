const { requireSignedInUser, sendError, HttpError } = require('./_lib/auth');
const { getLiveInputOverview } = require('./_lib/cloudflare');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');

  try {
    if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed.');
    const isSignedIn = Boolean(req.headers.authorization);
    if (isSignedIn) await requireSignedInUser(req);

    const { live, ingest, replays } = await getLiveInputOverview();
    return res.status(200).json({ live, ingest, replays: isSignedIn ? replays : [] });
  } catch (error) {
    return sendError(res, error);
  }
};