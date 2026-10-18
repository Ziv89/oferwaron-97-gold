/**
 * Firebase Functions (v2) - Storage trigger
 * Keeps Firestore in sync with Storage chart images:
 * siteData/tradingStats.tradeViewChartImages = [ofernewChart, ofernewChart1, ofernewChart2, ...]
 */

const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

// Region close to Israel
setGlobalOptions({ region: "europe-west1" });

// Set once with:
//   firebase functions:secrets:set TV_WEBHOOK_SECRET
// Never put the actual value in this file or in git.
const TV_WEBHOOK_SECRET = defineSecret("TV_WEBHOOK_SECRET");

// ---- helpers ----
function parseChartIndex(filename) {
  // Accept: ofernewChart.jpg, ofernewChart1.png, ofernewChart12.webp
  // ofernewChart (no number) => index 0
  const m = filename.match(/^ofernewChart(\d+)?\.(jpg|jpeg|png|webp)$/i);
  if (!m) return null;
  return m[1] ? Number(m[1]) : 0;
}

exports.syncTradeViewChartImagesV2 = onObjectFinalized(async (event) => {
  const object = event.data;
  const filePath = object?.name || null;
  const bucketName = object?.bucket || null;

  // ✅ ALWAYS write a debug doc so you can see if trigger fired (no logs needed)
  await admin.firestore().collection("_debug").doc("lastStorageEvent").set(
    {
      at: admin.firestore.FieldValue.serverTimestamp(),
      bucketName,
      filePath,
      contentType: object?.contentType || null,
      size: object?.size || null,
    },
    { merge: true }
  );

  try {
    // Only handle files under charts/
    if (!filePath || !filePath.startsWith("charts/")) {
      await admin.firestore().collection("_debug").doc("lastStorageEvent").set(
        { stage: "SKIP_NOT_CHARTS" },
        { merge: true }
      );
      return;
    }

    const filename = filePath.split("/").pop();
    const idx = parseChartIndex(filename);

    if (idx === null) {
      await admin.firestore().collection("_debug").doc("lastStorageEvent").set(
        { stage: "SKIP_NAME_NOT_MATCHED", filename },
        { merge: true }
      );
      return;
    }

    const bucket = admin.storage().bucket(bucketName);

    const [files] = await bucket.getFiles({ prefix: "charts/ofernewChart" });

    const matching = files
      .map((f) => {
        const base = f.name.split("/").pop();
        const i = parseChartIndex(base);
        return i === null ? null : { file: f, index: i, name: f.name };
      })
      .filter(Boolean)
      .sort((a, b) => a.index - b.index);

    const expires = "2035-01-01";
    const urls = await Promise.all(
      matching.map(async ({ file }) => {
        const [url] = await file.getSignedUrl({ action: "read", expires });
        return url;
      })
    );

    await admin.firestore().collection("siteData").doc("tradingStats").set(
      {
        tradeViewChartImages: urls,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await admin.firestore().collection("_debug").doc("lastStorageEvent").set(
      { stage: "SUCCESS", urlsCount: urls.length },
      { merge: true }
    );
  } catch (err) {
    // ✅ save the real error into Firestore so you don't need logs
    await admin.firestore().collection("_debug").doc("lastStorageEvent").set(
      { stage: "ERROR", error: String(err) },
      { merge: true }
    );
    throw err;
  }
});

/**
 * TradingView alert webhook -> signals/{autoId}
 *
 * TradingView never sends your Pine Script here - only whatever plain-text
 * "Message" you type into the alert box. This endpoint expects that message
 * to be JSON shaped like:
 *   { "secret": "...", "symbol": "XAUUSD", "side": "buy", "price": 2650.5 }
 *
 * The secret is checked against TV_WEBHOOK_SECRET (Cloud Secret Manager) so
 * a stranger who finds this URL can't inject fake signals. TradingView can't
 * set custom headers on webhooks, so the secret has to travel inside the
 * body like this - keep it long and random, and don't reuse it anywhere.
 *
 * Never returns TradingView-identifying detail on failure - just 400/401 -
 * so this endpoint can't be used to probe for the right secret.
 */
const ALLOWED_SIDES = ["buy", "sell", "exit"];

exports.tvWebhook = onRequest(
  { secrets: [TV_WEBHOOK_SECRET], cors: false },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    let payload;
    try {
      payload =
        req.body && Object.keys(req.body).length
          ? req.body
          : JSON.parse(req.rawBody.toString("utf8"));
    } catch {
      res.status(400).send("Invalid payload");
      return;
    }

    if (payload.secret !== TV_WEBHOOK_SECRET.value()) {
      res.status(401).send("Unauthorized");
      return;
    }

    const symbol = String(payload.symbol || "").slice(0, 20);
    const side = String(payload.side || "").toLowerCase();
    const price = Number(payload.price);

    if (!symbol || !ALLOWED_SIDES.includes(side) || !Number.isFinite(price)) {
      res.status(400).send("Missing/invalid symbol, side, or price");
      return;
    }

    // Alert time from TradingView if provided (ISO string or epoch ms/sec),
    // otherwise the time the webhook was received.
    let time = admin.firestore.Timestamp.now();
    if (payload.time) {
      const parsed = new Date(payload.time);
      if (!Number.isNaN(parsed.getTime())) time = admin.firestore.Timestamp.fromDate(parsed);
    }

    await admin.firestore().collection("signals").add({
      symbol,
      side,
      price,
      time,
      note: payload.note ? String(payload.note).slice(0, 200) : "",
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send("ok");
  }
);