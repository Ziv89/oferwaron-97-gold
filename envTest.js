const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log("🟨 Looking for .env at:", path.resolve(__dirname, '.env'));
console.log("✅ Loaded KEY:", process.env.BINANCE_API_KEY);
console.log("✅ Loaded SECRET:", process.env.BINANCE_API_SECRET);

