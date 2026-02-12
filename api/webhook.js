

import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

// ============================================
// WhatsApp via CallMeBot (FREE - No API needed!)
// ============================================
async function sendWhatsAppMessage(phone, message) {
  // CallMeBot is a FREE service for WhatsApp notifications
  // Setup: Send "I allow callmebot to send me messages" to +34 644 71 99 22
  const apiKey = process.env.CALLMEBOT_API_KEY;
  
  if (!apiKey || !phone) {
    console.log('WhatsApp not configured, skipping...');
    return null;
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    console.log('WhatsApp sent:', text);
    return { success: true, response: text };
  } catch (error) {
    console.error('WhatsApp error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// WhatsApp Group via WhatsApp Business API (Paid)
// ============================================
async function sendWhatsAppGroupMessage(message) {
  // For WhatsApp Groups, you need WhatsApp Business API
  // Options: Twilio, MessageBird, or official WhatsApp Business API
  
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;
  const twilioTo = process.env.TWILIO_WHATSAPP_TO;
  
  if (!twilioSid || !twilioAuth) {
    console.log('Twilio not configured, skipping group message...');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioFrom,
          To: twilioTo,
          Body: message,
        }),
      }
    );
    
    const data = await response.json();
    console.log('Twilio WhatsApp sent:', data.sid);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('Twilio error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Format Signal Message
// ============================================
function formatSignalMessage(signalData) {
  const emoji = signalData.signal === 'BUY' ? '🟢' : '🔴';
  const arrow = signalData.signal === 'BUY' ? '📈' : '📉';
  
  let message = `
${arrow} *97% GOLD SIGNAL* ${arrow}

${emoji} *${signalData.signal} ${signalData.symbol}*

💰 *Entry:* $${signalData.price.toFixed(2)}`;

  if (signalData.takeProfit) {
    message += `\n🎯 *Take Profit:* $${signalData.takeProfit.toFixed(2)}`;
  }
  
  if (signalData.stopLoss) {
    message += `\n🛡️ *Stop Loss:* $${signalData.stopLoss.toFixed(2)}`;
  }

  message += `
⏰ *Time:* ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })}

━━━━━━━━━━━━━━━
⚠️ Trade at your own risk
🏆 97% Gold Strategy
━━━━━━━━━━━━━━━`;

  return message;
}

// ============================================
// Main Handler
// ============================================
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📥 Webhook received:', JSON.stringify(req.body, null, 2));

  try {
    const { secret, signal, symbol, price, time, takeProfit, stopLoss, message } = req.body;

    // ============================================
    // 1. Validate Secret
    // ============================================
    if (secret !== process.env.TRADINGVIEW_WEBHOOK_SECRET) {
      console.log('❌ Invalid secret');
      return res.status(401).json({ success: false, error: 'Invalid secret' });
    }

    // ============================================
    // 2. Validate Required Fields
    // ============================================
    if (!signal || !symbol || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: signal, symbol, price',
      });
    }

    // ============================================
    // 3. Create Signal Document
    // ============================================
    const signalData = {
      signal: signal.toUpperCase(),
      symbol: symbol,
      price: parseFloat(price),
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      message: message || '',
      source: 'TradingView',
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      tradingViewTime: time || new Date().toISOString(),
      status: 'active',
      result: null,
      closedAt: null,
      profitLoss: null,
    };

    // ============================================
    // 4. Save to Firestore
    // ============================================
    const signalRef = await db.collection('signals').add(signalData);
    console.log(`✅ Signal saved: ${signalRef.id}`);

    // ============================================
    // 5. Add to Active Signals
    // ============================================
    await db.collection('activeSignals').doc(signalRef.id).set({
      ...signalData,
      signalId: signalRef.id,
    });
    console.log('✅ Added to activeSignals');

    // ============================================
    // 6. Update Trading Stats
    // ============================================
    const statsRef = db.collection('siteData').doc('tradingStats');
    await statsRef.update({
      totalTrades: admin.firestore.FieldValue.increment(1),
      lastSignalAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSignal: {
        id: signalRef.id,
        signal: signalData.signal,
        symbol: signalData.symbol,
        price: signalData.price,
      },
    });
    console.log('✅ Stats updated');

    // ============================================
    // 7. Send WhatsApp Notifications (async)
    // ============================================
    const whatsappMessage = formatSignalMessage(signalData);
    
    // Send to owner (CallMeBot - free)
    const ownerPhone = process.env.OWNER_WHATSAPP_PHONE;
    if (ownerPhone) {
      sendWhatsAppMessage(ownerPhone, whatsappMessage).catch(console.error);
    }
    
    // Send to group (Twilio - paid, optional)
    if (process.env.TWILIO_ACCOUNT_SID) {
      sendWhatsAppGroupMessage(whatsappMessage).catch(console.error);
    }

    // ============================================
    // 8. Success Response
    // ============================================
    return res.status(200).json({
      success: true,
      message: 'Signal processed',
      signalId: signalRef.id,
      data: {
        signal: signalData.signal,
        symbol: signalData.symbol,
        price: signalData.price,
      },
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    });
  }
}

// Vercel config
export const config = {
  api: {
    bodyParser: true,
  },
};
