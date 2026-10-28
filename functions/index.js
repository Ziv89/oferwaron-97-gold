/**
 * Firebase Functions (v2) - Storage trigger
 * Keeps Firestore in sync with Storage chart images:
 * siteData/tradingStats.tradeViewChartImages = [ofernewChart, ofernewChart1, ofernewChart2, ...]
 */

const { onObjectFinalized, onObjectDeleted } = require("firebase-functions/v2/storage");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const vision = require("@google-cloud/vision");
const { parseCvPdf } = require("./cvParser");

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
/**
 * New registration -> WhatsApp message to the owner
 *
 * Fires when users/{uid} is created as approval 'pending' (the site's
 * register form, or the first sign-in of an account made in the Console).
 * Approve or reject in Firestore -> users/{uid} -> approval, or with
 * node admin/add-member.js --approve / --reject <email>.
 *
 * The owner's number and the sending service's key live in
 * adminData/ownerDetails. Unlike siteData that doc is closed to every
 * client by the Firestore rules - only this Admin SDK code reads it.
 *   whatsapp          the number that gets the alert, e.g. "+972..."
 *   wassengerToken    Wassenger API token (used when set), or
 *   callmebotApiKey   CallMeBot key (free, but often full)
 *
 * A failed send is logged and recorded on _debug/lastRegistrationAlert but
 * never retried, so a provider outage can't spam you later.
 */
exports.notifyNewRegistration = onDocumentCreated(
  "users/{uid}",
  async (event) => {
    const user = event.data?.data();
    if (!user || user.approval !== "pending") return;

    const owner = (await admin.firestore()
      .collection("adminData").doc("ownerDetails").get()).data() || {};

    const text = [
      "🔔 New 97% Gold registration - awaiting approval",
      `Name: ${user.displayName || "-"}`,
      `Email: ${user.email || "-"}`,
      `Date of birth: ${user.dateOfBirth || "-"}`,
      "",
      "Approve in Firebase Console -> Firestore -> users -> " +
        `${event.params.uid} -> approval = approved`,
    ].join("\n");

    let stage = "SENT";
    let error = null;
    let provider = null;
    let request = null;
    if (owner.whatsapp && owner.wassengerToken) {
      provider = "wassenger";
      request = fetch("https://api.wassenger.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Token": owner.wassengerToken,
        },
        body: JSON.stringify({phone: owner.whatsapp, message: text}),
      });
    } else if (owner.whatsapp && owner.callmebotApiKey) {
      provider = "callmebot";
      request = fetch(
        "https://api.callmebot.com/whatsapp.php" +
        `?phone=${encodeURIComponent(owner.whatsapp)}` +
        `&text=${encodeURIComponent(text)}` +
        `&apikey=${encodeURIComponent(owner.callmebotApiKey)}`);
    }

    if (!request) {
      stage = "ERROR";
      error = "adminData/ownerDetails needs whatsapp and " +
        "wassengerToken (or callmebotApiKey)";
    } else {
      try {
        const res = await request;
        if (!res.ok) {
          stage = "ERROR";
          error = `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`;
        }
      } catch (err) {
        stage = "ERROR";
        error = String(err);
      }
    }

    if (error) console.error("Registration WhatsApp alert failed", error);

    await admin.firestore().collection("_debug").doc("lastRegistrationAlert").set({
      at: admin.firestore.FieldValue.serverTimestamp(),
      uid: event.params.uid,
      provider,
      stage,
      error,
    });
  }
);

/**
 * documents/<name>.pdf -> strategyDocuments/<name> (Strategy page overview)
 *
 * Every PDF in documents/ except the CVs (osn.pdf, plus500.pdf, ...) becomes
 * one switchable overview on the Strategy page. The PDFs are slides saved
 * as pictures - no text layer - so the text is read with Cloud Vision OCR
 * (Hebrew + English). Upload / replace a PDF and this runs by itself;
 * deleting the PDF removes its overview.
 *
 * Stored per page: paragraphs in reading order with their relative size and
 * position (0-1 of the page), so the site can tell the slide title, the small
 * label above it and each card's heading / text apart:
 *   pages: [{ paragraphs: [{ text, h, top, x }] }]
 *
 * Progress / errors are written to _debug/lastStrategyDocument.
 */
// documents/<name>.pdf, except the CVs (cv.pdf, cvgold.pdf, ...)
const STRATEGY_PDF = /^documents\/(?!cv)([^/]+)\.pdf$/i;
const strategyDocName = (filePath) => filePath?.match(STRATEGY_PDF)?.[1] || null;
const VISION_PAGES_PER_CALL = 5; // Cloud Vision limit for inline PDFs

const round = (n) => Math.round(n * 10000) / 10000;

// Bounding box of normalized vertices (Vision omits coordinates that are 0)
function box(boundingBox) {
  const v = (boundingBox?.normalizedVertices || []).map((p) => ({
    x: p.x || 0,
    y: p.y || 0,
  }));
  const xs = v.map((p) => p.x);
  const ys = v.map((p) => p.y);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  };
}

// Paragraph text with the spaces / line breaks Vision detected
function paragraphText(paragraph) {
  let text = "";
  for (const word of paragraph.words || []) {
    for (const symbol of word.symbols || []) {
      text += symbol.text;
      const br = symbol.property?.detectedBreak?.type;
      if (br === "SPACE" || br === "SURE_SPACE") text += " ";
      else if (br === "EOL_SURE_SPACE" || br === "LINE_BREAK") text += " ";
      else if (br === "HYPHEN") text += "-";
    }
  }
  return text.replace(/\s+/g, " ").trim();
}

function pageParagraphs(page) {
  const out = [];
  for (const block of page.blocks || []) {
    for (const paragraph of block.paragraphs || []) {
      const text = paragraphText(paragraph);
      if (!text) continue;
      // Average word height = font size; the paragraph box would also
      // count extra lines
      const heights = (paragraph.words || []).map((w) => {
        const b = box(w.boundingBox);
        return b.maxY - b.minY;
      });
      const b = box(paragraph.boundingBox);
      out.push({
        text,
        h: round(heights.reduce((a, c) => a + c, 0) / (heights.length || 1)),
        top: round(b.minY),
        x: round((b.minX + b.maxX) / 2),
      });
    }
  }
  return out;
}

exports.extractStrategyDocument = onObjectFinalized(
  { timeoutSeconds: 300, memory: "512MiB" },
  async (event) => {
    const filePath = event.data?.name;
    const name = strategyDocName(filePath);
    if (!name) return;

    const db = admin.firestore();
    const debug = db.collection("_debug").doc("lastStrategyDocument");
    await debug.set({
      at: admin.firestore.FieldValue.serverTimestamp(),
      filePath,
      stage: "STARTED",
      error: null,
    });

    try {
      const [content] = await admin.storage()
        .bucket(event.data.bucket).file(filePath).download();

      const client = new vision.ImageAnnotatorClient();

      // OCR the given page numbers; returns the file's total page count
      const pages = [];
      const ocrPages = async (pageNumbers) => {
        const [result] = await client.batchAnnotateFiles({
          requests: [{
            inputConfig: { content, mimeType: "application/pdf" },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            imageContext: { languageHints: ["he", "en"] },
            pages: pageNumbers,
          }],
        });
        const fileResponse = result.responses[0];
        for (const res of fileResponse.responses || []) {
          if (res.error?.message) throw new Error(res.error.message);
          const page = res.fullTextAnnotation?.pages?.[0];
          pages.push({ paragraphs: page ? pageParagraphs(page) : [] });
        }
        return fileResponse.totalPages || 1;
      };

      // Page 1 first to learn the page count (asking past the last page
      // is an error), then the rest in batches
      const totalPages = await ocrPages([1]);
      for (let first = 2; first <= totalPages; first += VISION_PAGES_PER_CALL) {
        const batch = [];
        for (let p = first; p < first + VISION_PAGES_PER_CALL && p <= totalPages; p++) {
          batch.push(p);
        }
        await ocrPages(batch);
      }

      await db.collection("strategyDocuments").doc(name).set({
        name,
        source: filePath,
        pageCount: pages.length,
        pages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await debug.set({ stage: "SUCCESS", pageCount: pages.length }, { merge: true });
    } catch (err) {
      await debug.set({ stage: "ERROR", error: String(err) }, { merge: true });
      throw err;
    }
  }
);

// PDF deleted from documents/ -> its overview disappears from the site
exports.removeStrategyDocument = onObjectDeleted(async (event) => {
  const name = strategyDocName(event.data?.name);
  if (!name) return;
  await admin.firestore().collection("strategyDocuments").doc(name).delete();
});

/**
 * documents/cvgold.pdf -> siteData/cvContent (About page, coin side panel)
 *
 * The PDF has a real text layer, so no OCR: cvParser.js turns it into the
 * same blocks the About panel shows - paragraphs, section headings and
 * lists, keeping which words are bold / italic. (cv.pdf stays the file
 * behind the About page's View / Download CV buttons.)
 *
 * Progress / errors are written to _debug/lastCvContent.
 */
const CV_PDF = "documents/cvgold.pdf";

exports.extractCvContent = onObjectFinalized(
  { memory: "512MiB" },
  async (event) => {
    const filePath = event.data?.name;
    if (filePath !== CV_PDF) return;

    const db = admin.firestore();
    const debug = db.collection("_debug").doc("lastCvContent");
    await debug.set({
      at: admin.firestore.FieldValue.serverTimestamp(),
      filePath,
      stage: "STARTED",
      error: null,
    });

    try {
      const [buffer] = await admin.storage()
        .bucket(event.data.bucket).file(filePath).download();
      const { blocks, footer } = await parseCvPdf(new Uint8Array(buffer));

      await db.collection("siteData").doc("cvContent").set({
        source: filePath,
        blocks,
        footer,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await debug.set({ stage: "SUCCESS", blockCount: blocks.length }, { merge: true });
    } catch (err) {
      await debug.set({ stage: "ERROR", error: String(err) }, { merge: true });
      throw err;
    }
  }
);
