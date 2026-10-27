import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { log } from '../utils/logger';

// strategyDocuments/<name> - text of documents/<name>.pdf (osn, plus500, ...),
// read by the extractStrategyDocument Cloud Function (OCR) on upload:
//   { name, pages: [{ paragraphs: [{ text, h, top, x }] }] }
// h / top / x are the paragraph's font height, top edge and horizontal centre
// as a fraction (0-1) of the page.

let cachedRequest = null;

// All overviews sorted by file name. Shared across visits so they are only
// fetched once per session
export const fetchStrategyDocuments = () => {
  if (!cachedRequest) {
    cachedRequest = getDocs(collection(db, 'strategyDocuments'))
      .then((snap) => {
        log('Fetched strategy documents:', snap.size);
        return snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          // CV PDFs (cv.pdf, cvgold.pdf) belong to the About page only
          .filter((d) => !/^cv/i.test(d.id))
          .sort((a, b) => a.id.localeCompare(b.id));
      })
      .catch((err) => {
        cachedRequest = null;
        throw err;
      });
  }
  return cachedRequest;
};

// Layout tuning, as fractions of the page
const HEADER_BAND = 0.22; // label + title sit above this on content slides
const SAME_ROW = 0.03; // paragraphs on (about) the same line
const COLUMN_GAP = 0.15; // horizontal gap that starts a new column
const CARD_GAP = 0.06; // vertical gap that starts a new card in a column
const CONTINUATION_GAP = 0.06; // hero text wrapped onto a second line

const isNumber = (text) => /^\d{1,2}$/.test(text);
const hasHebrew = (text) => /[\u0590-\u05FF]/.test(text);

// Bullet / checkmark glyphs at the start of a line (OCR often reads the
// PDF's checkmarks as "<", "|" or "/")
const cleanLine = (text) => text.replace(/^[<>|/\u2713\u2714\u2022-]+\s*/, '');

// OCR noise: icons read as letters ("XXX", "</>", "DI") and the tiny text
// of screenshots inside a slide
const isNoise = (p, titleH) =>
  p.h < titleH * 0.3 || (p.text.length <= 3 && !/\d/.test(p.text));

// Group paragraphs into rows (top to bottom), each row right to left (Hebrew)
const toRows = (paragraphs) => {
  const rows = [];
  [...paragraphs]
    .sort((a, b) => a.top - b.top)
    .forEach((p) => {
      const row = rows.find((r) => Math.abs(r[0].top - p.top) < SAME_ROW);
      if (row) row.push(p);
      else rows.push([p]);
    });
  return rows.map((row) => row.sort((a, b) => b.x - a.x));
};

// Split by horizontal position into columns, right to left
const toColumns = (paragraphs) => {
  const columns = [];
  [...paragraphs]
    .sort((a, b) => b.x - a.x)
    .forEach((p) => {
      const last = columns[columns.length - 1];
      if (last && last[last.length - 1].x - p.x < COLUMN_GAP) last.push(p);
      else columns.push([p]);
    });
  return columns.map((col) => col.sort((a, b) => a.top - b.top));
};

// Split one column into cards wherever there is a vertical gap. The first
// line is the heading - unless it is a small step number, which becomes
// the card's badge
const toCards = (column) => {
  const groups = [];
  column.forEach((p, i) => {
    const prev = column[i - 1];
    if (prev && p.top - (prev.top + prev.h) < CARD_GAP) groups[groups.length - 1].push(p);
    else groups.push([p]);
  });

  return groups.map((group) => {
    const parts = [...group];
    const badge =
      parts.length > 1 && isNumber(parts[0].text) && parts[0].h <= parts[1].h * 1.25
        ? parts.shift().text
        : '';
    // A lone line is plain text, not a heading
    const texts = parts.map((p) => cleanLine(p.text));
    if (texts.length === 1 && !badge) return { badge, heading: '', lines: texts };
    return { badge, heading: texts[0], lines: texts.slice(1) };
  });
};

// Turns one OCR'd page into the parts of a slide, using size and position
// the way the PDFs lay them out:
//   hero     cover / closing slide - title in the middle of the page
//   eyebrow  small label above the title
//   title    the biggest text in the header
//   columns  cards side by side, each column top to bottom
//   rows     hero slides: subtitle, then rows of short points
export const buildSlide = (paragraphs) => {
  const slide = { hero: false, eyebrow: '', title: '', columns: [], rows: [] };
  if (!paragraphs?.length) return slide;

  // Content slides start with a label + title at the top; hero slides don't
  const header = paragraphs.filter((p) => p.top < HEADER_BAND);
  slide.hero = header.length === 0;

  const pool = slide.hero ? paragraphs : header;
  const maxH = Math.max(...pool.map((p) => p.h));
  const titleParts = pool
    .filter((p) => p.h >= maxH * 0.8)
    .sort((a, b) => a.top - b.top || b.x - a.x);
  const titleTop = titleParts[0].top;
  const titleH = titleParts[0].h;

  slide.title = titleParts.map((p) => p.text).join(' ');
  slide.eyebrow = pool
    .filter((p) => !titleParts.includes(p) && p.top < titleTop && !isNoise(p, titleH))
    .map((p) => p.text)
    .join(' ');

  const body = paragraphs.filter(
    (p) => !titleParts.includes(p) && p.top > titleTop && !header.includes(p) && !isNoise(p, titleH)
  );

  if (slide.hero) {
    // A one-line row right under another is the same sentence wrapped
    toRows(body).forEach((row) => {
      const last = slide.rows[slide.rows.length - 1];
      if (last && row.length === 1 && last.items.length === 1
        && row[0].top - last.top < CONTINUATION_GAP) {
        last.items[0] += ` ${row[0].text}`;
      } else {
        slide.rows.push({ top: row[0].top, items: row.map((p) => p.text) });
      }
    });
    slide.rows = slide.rows.map((r) => r.items);
    return slide;
  }

  // On a Hebrew slide, a card with no Hebrew at all is text from a
  // screenshot inside the slide, not content
  const keep = (card) =>
    !hasHebrew(slide.title) || [card.heading, ...card.lines].some(hasHebrew);
  slide.columns = toColumns(body)
    .map((column) => toCards(column).filter(keep))
    .filter((column) => column.length);
  return slide;
};

// The PDFs' trailing "Image Sources" credit page is not content
export const isCreditsSlide = (slide) => /^image sources$/i.test(slide.title.trim());
