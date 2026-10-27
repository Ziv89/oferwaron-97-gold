/**
 * cvParser.js - reads a CV PDF (documents/cvgold.pdf) into the blocks the
 * About page's coin side panel shows (used by extractCvContent in index.js):
 *   blocks: [{ type: "h1" | "h2" | "p", runs }, { type: "ul", items: [{ runs, sub }] }]
 *   runs:   [{ text, bold, italic }]
 *   footer: "© Ofer Waron | All rights reserved."
 *
 * The CV PDFs have a real text layer, so no OCR is needed - pdf.js gives each
 * piece of text with its size, position and font (bold / italic). Handles
 * both layouts used so far:
 *   - headings in a bigger size, "•" bullet lists (cv.pdf)
 *   - one size throughout, headings as bold lines ("💡 Key Features:"),
 *     paragraphs told apart by the extra space between them (cvgold.pdf)
 */
const BULLET = /^\s*•\s*/;
const HAS_LETTERS = /[A-Za-z֐-׿0-9]/;
// Line spacing (as a multiple of the font size) above which a new
// paragraph starts - wrapped lines sit closer together than that
const PARAGRAPH_GAP = 1.7;

// Adds text to a run list, merging with the previous run of the same style
function addRun(runs, text, bold, italic) {
  // Whitespace and emoji take the style of what follows, so "Bold — text"
  // keeps the space outside the bold part
  const last = runs[runs.length - 1];
  if (last && ((last.bold === bold && last.italic === italic) || !HAS_LETTERS.test(last.text))) {
    last.text += text;
    if (HAS_LETTERS.test(text)) {
      last.bold = bold;
      last.italic = italic;
    }
  } else {
    runs.push({ text, bold, italic });
  }
}

const trimRuns = (runs) => {
  // "Bold " + "— text" -> "Bold" + " — text", as in <strong>Bold</strong> — text
  runs.forEach((run, i) => {
    const next = runs[i + 1];
    const space = run.text.match(/\s+$/);
    if ((run.bold || run.italic) && next && space) {
      run.text = run.text.slice(0, space.index);
      next.text = space[0] + next.text;
    }
  });
  if (runs.length) {
    runs[0].text = runs[0].text.replace(/^\s+/, "");
    runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, "");
  }
  return runs.filter((r) => r.text);
};

const runsOf = (items) => {
  const runs = [];
  items.forEach((it) => addRun(runs, it.text, it.bold, it.italic));
  return runs;
};

// Most common font size = the body text
function bodySizeOf(lines) {
  const counts = {};
  lines.forEach((l) => (counts[l.size] = (counts[l.size] || 0) + 1));
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

async function parseCvPdf(data) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data, verbosity: 0 }).promise;

  // Text lines in reading order: { page, y, size, italic, wrapped, items }
  const lines = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    await page.getOperatorList(); // loads the fonts, for bold / italic
    const font = (name) => page.commonObjs.get(name) || {};

    let current = null;
    for (const item of content.items) {
      if (!item.str) continue; // empty items only mark line breaks
      const y = Math.round(item.transform[5]);
      if (!current || current.y !== y) {
        current = { page: n, y, size: 0, italic: true, wrapped: false, items: [] };
        lines.push(current);
      }
      const f = font(item.fontName);
      const bold = Boolean(f.bold) || /bold|black|heavy/i.test(f.name || "");
      const italic = Boolean(f.italic) || /italic|oblique/i.test(f.name || "");
      current.size = Math.max(current.size, Math.round(Math.abs(item.transform[0]) * 10) / 10);
      if (HAS_LETTERS.test(item.str)) current.italic = current.italic && italic;
      // hasEOL on the last piece = the sentence wraps onto the next line
      current.wrapped = Boolean(item.hasEOL);
      current.items.push({ text: item.str, bold, italic });
    }
  }
  if (!lines.length) return { blocks: [], footer: "" };

  const bodySize = bodySizeOf(lines);
  const sizedHeadings = lines.some((l) => l.size >= bodySize * 1.15);

  const blocks = [];
  let footer = "";
  let target = null; // runs the previous line was written into
  let lastItem = null; // last bullet, for its sub-description line
  let prev = null;

  lines.forEach((line, i) => {
    const text = line.items.map((it) => it.text).join("").trim();
    if (!text) return;

    // Last line "© ..." (or italic) = the footer
    if (i === lines.length - 1 && (/^©/.test(text) || line.italic)) {
      footer = text;
      return;
    }

    const letters = line.items.filter((it) => HAS_LETTERS.test(it.text));
    const allBold = letters.length > 0 && letters.every((it) => it.bold);
    const isTitle = line.size >= bodySize * 1.5;
    const isHeading = sizedHeadings
      ? line.size >= bodySize * 1.15
      : allBold && text.length <= 60; // same-size layout: a bold line
    const isBullet = BULLET.test(text);

    // A wrapped line of the same paragraph / bullet: marked as wrapping, or
    // in a same-size layout, sitting closer than the paragraph spacing
    const close = prev && prev.page === line.page
      && prev.y - line.y < line.size * PARAGRAPH_GAP;
    const continues = target && !isHeading && !isBullet
      && (prev.wrapped || (!sizedHeadings && close && !prev.heading));

    if (continues) {
      addRun(target, " ", false, false);
      line.items.forEach((it) => addRun(target, it.text, it.bold, it.italic));
    } else if (isTitle || isHeading) {
      target = null;
      lastItem = null;
      blocks.push({ type: isTitle ? "h1" : "h2", runs: runsOf(line.items) });
    } else if (isBullet) {
      const items = [...line.items];
      // Drop the bullet glyph (its own piece, or the start of the first one)
      while (items.length && !items[0].text.replace(BULLET, "").trim()) items.shift();
      if (items.length) items[0] = { ...items[0], text: items[0].text.replace(BULLET, "") };

      let list = blocks[blocks.length - 1];
      if (!list || list.type !== "ul") {
        list = { type: "ul", items: [] };
        blocks.push(list);
      }
      target = runsOf(items);
      lastItem = { runs: target, sub: "" };
      list.items.push(lastItem);
    } else if (lastItem && !lastItem.sub) {
      // A plain line under a bullet = its small description
      lastItem.sub = text;
      target = null;
      lastItem = null;
    } else {
      target = runsOf(line.items);
      lastItem = null;
      blocks.push({ type: "p", runs: target });
    }
    prev = { ...line, heading: isTitle || isHeading };
  });

  blocks.forEach((b) => {
    if (b.runs) b.runs = trimRuns(b.runs);
    if (b.items) b.items.forEach((it) => (it.runs = trimRuns(it.runs)));
  });
  return { blocks, footer };
}

module.exports = { parseCvPdf };
