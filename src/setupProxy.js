// Local dev only: CRA loads this into its dev server. It serves the Vercel
// functions in /api so `npm start` behaves like production. CRA has already
// loaded .env / .env.local into process.env, so server credentials are available.
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'api');
const HANDLERS = new Set(['stream-status', 'stream-token']);

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

module.exports = (app) => {
  app.all('/api/:name', async (req, res) => {
    const { name } = req.params;
    if (!HANDLERS.has(name)) return res.status(404).json({ error: 'Not found.' });

    try {
      const raw = await readBody(req);
      const isJson = (req.headers['content-type'] || '').includes('application/json');
      try {
        req.body = raw && isJson ? JSON.parse(raw) : raw;
      } catch {
        req.body = raw;
      }

      const handler = require(path.join(API_DIR, `${name}.js`));
      return await handler(req, res);
    } catch (error) {
      console.error(`[local api] ${name}`, error);
      if (!res.headersSent) res.status(500).json({ error: error.message || 'Local API error.' });
    }
  });
};
