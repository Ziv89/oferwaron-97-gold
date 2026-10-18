const { requireSignedInUser, sendError, HttpError } = require('./_lib/auth');
const { embedUrlFor, getLiveInputOverview, env } = require('./_lib/cloudflare');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const target = String(body.target || 'live');
    if (target !== 'live' || req.headers.authorization) await requireSignedInUser(req);
    let uid;

    if (target === 'live') {
      uid = env('CLOUDFLARE_LIVE_INPUT_UID');
    } else {
      const { replayIds } = await getLiveInputOverview();
      if (!replayIds.has(target)) throw new HttpError(404, 'That replay is not available.');
      uid = target;
    }

    return res.status(200).json({ embedUrl: embedUrlFor(uid) });
  } catch (error) {
    return sendError(res, error);
  }
};