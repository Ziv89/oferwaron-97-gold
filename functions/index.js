/**
 * Firebase Functions (v2) - Storage trigger
 * Keeps Firestore in sync with Storage chart images:
 * siteData/tradingStats.tradeViewChartImages = [ofernewChart, ofernewChart1, ofernewChart2, ...]
 */

const { onObjectFinalized, onObjectDeleted } = require("firebase-functions/v2/storage");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { logger } = require("firebase-functions");
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
 * TradingView alert -> Firestore (+ WhatsApp via Wassenger)
 *
 * One TradingView alert hits this function. It always saves the alert to
 *   tradingview/alerts                     latest alert (date, messagecontent, symbol);
 *                                          other fields, e.g. groupName, are left as they are
 *   tradingview/alerts/tvMessages/{autoId} one doc per alert, expireAt = +12h
 * and, when the payload names a WhatsApp target, also forwards it to
 * Wassenger. Firestore and Wassenger run in parallel - one failing never
 * blocks the other.
 *
 * Accepts both payload styles in the TradingView "Message" box:
 *   1) Firebase JSON:   {"secret":"...","symbol":"{{ticker}}","message":"Gold alert @ {{close}}"}
 *      -> saved to Firestore only (no group/channel = nothing to forward)
 *   2) Wassenger JSON:  {"group":"...@g.us","message":"..."}  (or "channel":"...@newsletter")
 *      -> secret in the webhook URL instead:  ...run.app/?secret=YOUR_SECRET
 *      -> saved to Firestore AND sent to that group / channel
 * A message that isn't JSON at all is saved as plain text (secret must then
 * be in the URL).
 *
 * Secrets (Cloud Secret Manager): TV_WEBHOOK_SECRET (shared with tvWebhook)
 * and WASSENGER_TOKEN. A Firestore TTL policy on tvMessages.expireAt
 * (firestore.indexes.json) deletes each alert automatically, usually within
 * 24h after it expires; the /vip page also hides expired ones.
 */
const WASSENGER_TOKEN = defineSecret("WASSENGER_TOKEN");
const ALERT_TTL_HOURS = 12;
const DEFAULT_ALERT_SYMBOL = "XAUUSD";
const tvAlertsDoc = () => admin.firestore().collection("tradingview").doc("alerts");

exports.tvAlertMessage = onRequest(
  { secrets: [TV_WEBHOOK_SECRET, WASSENGER_TOKEN], cors: false },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    // TradingView sends application/json only when the message box is valid
    // JSON; otherwise text/plain, which Firebase hands over as a string.
    let body = req.body;
    if (typeof body === "string" || Buffer.isBuffer(body) || !body || !Object.keys(body).length) {
      const raw = (req.rawBody || "").toString("utf8").trim();
      try {
        body = JSON.parse(raw);
      } catch {
        body = { message: raw };
      }
    }
    if (!body || typeof body !== "object") body = {};

    // Secret: JSON body or webhook URL (?secret=...). Copy/paste often adds
    // spaces or a newline around it - ignore them.
    const received = String(body.secret || req.query.secret || "").trim();
    const expected = TV_WEBHOOK_SECRET.value().trim();
    if (!received || received !== expected) {
      // Never log the secret itself - only enough to tell what went wrong.
      logger.warn("tvAlertMessage: secret mismatch", {
        contentType: req.get("content-type") || "",
        fields: Object.keys(body),
        secretIn: body.secret ? "body" : req.query.secret ? "url" : "none",
        receivedLength: received.length,
        expectedLength: expected.length,
        placeholderLeft: /YOUR_SECRET|PASTE/i.test(received),
      });
      res.status(401).send("Unauthorized");
      return;
    }

    const message = String(body.message || "").trim().slice(0, 4000);
    if (!message) {
      res.status(400).send("Missing message");
      return;
    }

    const symbol = String(body.symbol || req.query.symbol || DEFAULT_ALERT_SYMBOL).slice(0, 20);
    const date = admin.firestore.Timestamp.now();

    // Latest + 12h history written together, so they never disagree
    const batch = admin.firestore().batch();
    batch.create(tvAlertsDoc().collection("tvMessages").doc(), {
      messagecontent: message,
      symbol,
      date,
      expireAt: admin.firestore.Timestamp.fromMillis(date.toMillis() + ALERT_TTL_HOURS * 60 * 60 * 1000),
    });
    // merge: keep fields set by hand on this doc (e.g. groupName)
    batch.set(tvAlertsDoc(), { messagecontent: message, symbol, date }, { merge: true });
    const tasks = { firestore: batch.commit() };

    // Forward to Wassenger only when the payload names a WhatsApp target
    const channel = typeof body.channel === "string" && body.channel.endsWith("@newsletter") ? body.channel : "";
    const group = typeof body.group === "string" && body.group.endsWith("@g.us") ? body.group : "";
    const target = channel ? { channel } : group ? { group } : null;
    if (target) {
      tasks.wassenger = fetch("https://api.wassenger.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Token": WASSENGER_TOKEN.value() },
        body: JSON.stringify({ ...target, message }),
      }).then(async (r) => {
        if (!r.ok) throw new Error(`Wassenger HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
      });
    } else if (body.group || body.channel) {
      logger.warn("tvAlertMessage: group/channel ignored - expected ...@g.us or ...@newsletter");
    }

    const names = Object.keys(tasks);
    const results = await Promise.allSettled(Object.values(tasks));
    const report = {};
    results.forEach((r, i) => {
      report[names[i]] = r.status === "fulfilled" ? "ok" : "failed";
      if (r.status === "rejected") logger.error(`tvAlertMessage: ${names[i]} failed`, String(r.reason));
    });

    const allOk = results.every((r) => r.status === "fulfilled");
    res.status(allOk ? 200 : 502).json(report);
  }
);

/**
 * New registration -> WhatsApp message to the owner, with Approve / Reject links
 *
 * Fires when users/{uid} is created as approval 'pending' (the site's
 * register form, or the first sign-in of an account made in the Console).
 * The message carries two signed links to reviewRegistration (below); you
 * can also still approve / reject in Firestore -> users/{uid} -> approval,
 * or with node admin/add-member.js --approve / --reject <email>.
 *
 * The owner's number lives in adminData/ownerDetails.whatsapp (e.g.
 * "+972..."). Unlike siteData that doc is closed to every client by the
 * Firestore rules - only this Admin SDK code reads it. Sent with Wassenger
 * (WASSENGER_TOKEN secret); adminData/ownerDetails.callmebotApiKey is used
 * instead when there's no Wassenger token.
 *
 * A failed send is logged and recorded on _debug/lastRegistrationAlert but
 * never retried, so a provider outage can't spam you later.
 */
const crypto = require("crypto");

const REVIEW_LINK_DAYS = 7;
const REVIEW_ACTIONS = { approve: "approved", reject: "rejected" };

// Review links are signed with a key derived from TV_WEBHOOK_SECRET (a
// separate key per purpose, no extra secret to manage). Changing that secret
// invalidates links already sent.
const reviewSignature = (uid, action, exp) =>
  crypto
    .createHmac("sha256", crypto.createHmac("sha256", TV_WEBHOOK_SECRET.value()).update("registration-review").digest())
    .update(`${uid}:${action}:${exp}`)
    .digest("hex");

const reviewSignatureValid = (uid, action, exp, sig) => {
  const expected = Buffer.from(reviewSignature(uid, action, exp), "hex");
  const given = Buffer.from(String(sig || ""), "hex");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

const reviewLink = (uid, action) => {
  const exp = Date.now() + REVIEW_LINK_DAYS * 24 * 60 * 60 * 1000;
  const project = process.env.GCLOUD_PROJECT || admin.app().options.projectId;
  const qs = new URLSearchParams({ uid, action, exp: String(exp), sig: reviewSignature(uid, action, exp) });
  return `https://europe-west1-${project}.cloudfunctions.net/reviewRegistration?${qs}`;
};

exports.notifyNewRegistration = onDocumentCreated(
  { document: "users/{uid}", secrets: [WASSENGER_TOKEN, TV_WEBHOOK_SECRET] },
  async (event) => {
    const user = event.data?.data();
    if (!user || user.approval !== "pending") return;

    const owner = (await admin.firestore()
      .collection("adminData").doc("ownerDetails").get()).data() || {};
    const uid = event.params.uid;

    const text = [
      "🔔 New 97% Gold registration - awaiting approval",
      `Name: ${user.displayName || "-"}`,
      `Email: ${user.email || "-"}`,
      `WhatsApp: ${user.whatsapp || "-"}`,
      `Date of birth: ${user.dateOfBirth || "-"}`,
      "",
      `✅ Approve: ${reviewLink(uid, "approve")}`,
      "",
      `❌ Reject: ${reviewLink(uid, "reject")}`,
      "",
      `Links expire in ${REVIEW_LINK_DAYS} days.`,
    ].join("\n");

    const wassengerToken = WASSENGER_TOKEN.value() || owner.wassengerToken;
    let stage = "SENT";
    let error = null;
    let provider = null;
    let request = null;
    if (owner.whatsapp && wassengerToken) {
      provider = "wassenger";
      request = fetch("https://api.wassenger.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Token": wassengerToken,
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
      error = "adminData/ownerDetails needs whatsapp (and a WASSENGER_TOKEN " +
        "secret or callmebotApiKey)";
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
      uid,
      provider,
      stage,
      error,
    });
  }
);

/**
 * Approve / Reject link from the registration WhatsApp message
 *
 * GET  shows who it is and a confirm button - nothing changes yet, so
 *      WhatsApp's link preview (which opens links by itself) can't decide.
 * POST (the button) checks the signature + expiry and sets
 *      users/{uid}.approval = approved | rejected, plus approvedAt /
 *      rejectedAt - the same as admin/add-member.js --approve / --reject.
 */
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

const reviewPage = (title, body) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} - 97% Gold</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         font-family: "Segoe UI", Helvetica, Arial, sans-serif; background: #0b141a; color: #e9edef; }
  .card { width: min(92vw, 420px); padding: 28px 24px; border-radius: 16px; background: #202c33;
          border: 1px solid rgba(255, 215, 0, 0.45); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5); text-align: center; }
  h1 { margin: 0 0 16px; font-size: 1.35rem; color: #ffd700; }
  dl { margin: 0 0 20px; text-align: left; display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; }
  dt { color: #8696a0; } dd { margin: 0; overflow-wrap: anywhere; }
  p { color: #8696a0; line-height: 1.5; }
  button { width: 100%; padding: 14px; border: 0; border-radius: 10px; font-size: 1.05rem; font-weight: 700; cursor: pointer; }
  .approve { background: #25d366; color: #0b141a; } .reject { background: #f15c6d; color: #fff; }
</style></head>
<body><main class="card">${body}</main></body></html>`;

exports.reviewRegistration = onRequest(
  { secrets: [TV_WEBHOOK_SECRET], cors: false },
  async (req, res) => {
    const src = req.method === "POST" ? { ...req.query, ...req.body } : req.query;
    const uid = String(src.uid || "");
    const action = String(src.action || "");
    const exp = Number(src.exp);
    const sig = String(src.sig || "");

    res.set("Cache-Control", "no-store");

    if (!uid || !REVIEW_ACTIONS[action] || !Number.isFinite(exp) || !reviewSignatureValid(uid, action, exp, sig)) {
      res.status(403).send(reviewPage("Invalid link", "<h1>Invalid link</h1><p>This link is not valid. Use the link from the WhatsApp message.</p>"));
      return;
    }
    if (Date.now() > exp) {
      res.status(410).send(reviewPage("Link expired", "<h1>Link expired</h1><p>Approve or reject in Firebase Console, or with admin/add-member.js.</p>"));
      return;
    }

    const userRef = admin.firestore().collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      res.status(404).send(reviewPage("Not found", "<h1>Registration not found</h1><p>This account no longer exists.</p>"));
      return;
    }
    const user = snap.data();
    const current = user.approval || "approved";
    const target = REVIEW_ACTIONS[action];
    const details = (status) => `<dl>
      <dt>Name</dt><dd>${escapeHtml(user.displayName || "-")}</dd>
      <dt>Email</dt><dd>${escapeHtml(user.email || "-")}</dd>
      <dt>WhatsApp</dt><dd>${escapeHtml(user.whatsapp || "-")}</dd>
      <dt>Status</dt><dd>${escapeHtml(status)}</dd>
    </dl>`;

    if (req.method === "GET") {
      if (current === target) {
        res.send(reviewPage("Already done", `<h1>Already ${escapeHtml(target)}</h1>${details(current)}`));
        return;
      }
      const hidden = ["uid", "action", "exp", "sig"]
        .map((k) => `<input type="hidden" name="${k}" value="${escapeHtml(src[k])}">`).join("");
      const verb = action === "approve" ? "Approve" : "Reject";
      res.send(reviewPage(`${verb} registration`, `<h1>${verb} this registration?</h1>${details(current)}
        <form method="POST">${hidden}<button class="${action}" type="submit">${action === "approve" ? "✅" : "❌"} ${verb}</button></form>`));
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    await userRef.set(
      { approval: target, [`${target}At`]: admin.firestore.Timestamp.now() },
      { merge: true }
    );
    logger.info(`reviewRegistration: ${uid} ${current} -> ${target}`);
    res.send(reviewPage("Done", `<h1>${target === "approved" ? "✅ Approved" : "❌ Rejected"}</h1>${details(target)}
      <p>${target === "approved" ? "Their member menu updates immediately." : "They will not get member access."}</p>`));
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
