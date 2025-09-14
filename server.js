const path = require('path');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let customChartData = null;

function getServerTime() {
  return new Promise((resolve, reject) => {
    https.get('https://api.binance.com/api/v3/time', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.serverTime);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

app.get('/api/balances', async (req, res) => {
  console.log('🔍 /api/balances requested');
  try {
    const timestamp = await getServerTime();
    const query = querystring.stringify({ timestamp });
    const signature = crypto
      .createHmac('sha256', process.env.BINANCE_API_SECRET)
      .update(query)
      .digest('hex');

    const options = {
      hostname: 'api.binance.com',
      path: `/api/v3/account?${query}&signature=${signature}`,
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
      },
    };

    const request = https.request(options, response => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body);
 
          if (parsed.balances.length === 0) {
            
            parsed.balances = [
              { asset: 'BTC', free: '0.01234567', locked: '0.00000000' },
              { asset: 'USDT', free: '25.00', locked: '0.00000000' },
            ];
          }
          console.log('🪵 Raw Binance balances:', parsed.balances);
          res.json(parsed.balances);
        } catch (err) {
          console.error('❌ Parsing Binance response failed:', err);
          res.status(500).json({ error: 'Failed to parse Binance response' });
        }
      });
    });

    request.on('error', err => {
      console.error('❌ Binance HTTPS error:', err.message);
      res.status(500).json({ error: 'Request to Binance failed' });
    });

    request.end();
  } catch (err) {
    console.error('❌ Error getting balances:', err);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

app.get('/api/prices', (req, res) => {
  https.get('https://api.binance.com/api/v3/ticker/price', (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch (err) {
        console.error('❌ Failed to parse price data:', err);
        res.status(500).json({ error: 'Failed to parse price data' });
      }
    });
  }).on('error', err => {
    console.error('❌ Binance price fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch prices' });
  });
});

// ✅ Serve pushed chart data only — no defaults
app.get('/api/chart-data/:asset', (req, res) => {
  if (!customChartData) {
    console.warn(`⚠️ No chart data found for ${req.params.asset}`);
    return res.status(404).json({ error: 'No chart data available' });
  }

  console.log(`📡 Returning pushed chart data for ${req.params.asset}`);
  res.json(customChartData);
});

app.post('/api/chart-data', (req, res) => {
  const data = req.body;

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'chartData must be an array' });
  }

  customChartData = data;
  console.log('✅ Custom chart data received and stored');
  res.json({ success: true });
});

// Serve React app
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`✅ Fullstack app running at http://localhost:${port}`);
});
