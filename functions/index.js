/**
 * Firebase Functions (v2) - Storage trigger
 * Keeps Firestore in sync with Storage chart images:
 * siteData/tradingStats.tradeViewChartImages = [ofernewChart, ofernewChart1, ofernewChart2, ...]
 */

const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

// Region close to Israel
setGlobalOptions({ region: "europe-west1" });

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