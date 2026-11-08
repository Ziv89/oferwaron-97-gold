// ============================================
// DisclaimerSection.jsx - "Disclaimer & Terms of Use" on the Strategy page
//
// Short summary of the terms + View / Download of documents/disclaimer.pdf
// from Firebase Storage (like the CV on the About page). The bundled copy
// is used until / unless the Storage one loads.
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaFileAlt, FaFileDownload } from 'react-icons/fa';
import BundledDisclaimer from '../assets/files/disclaimer.pdf';
import { fetchDocumentUrl, downloadDocument } from '../services/documents';

// Uploaded as documents/disclaimer.pdf (or documents/disclaimer, no extension)
const STORAGE_NAMES = ['disclaimer.pdf', 'disclaimer'];
const SAVE_AS = 'Ofer_Waron_97_Gold_Disclaimer.pdf';

// First name that exists in Storage, or null
const findStorageName = async () => {
  for (const name of STORAGE_NAMES) {
    try {
      await fetchDocumentUrl(name);
      return name;
    } catch {
      /* try the next name */
    }
  }
  return null;
};

export default function DisclaimerSection() {
  const [doc, setDoc] = useState({ name: null, url: null });
  const sectionRef = useRef(null);
  const location = useLocation();

  // Footer "Disclaimer" link (/strategy#disclaimer) - scroll here, also when
  // it is clicked again while already on the Strategy page. Short delay so
  // the stats above have rendered and the position is final.
  useEffect(() => {
    if (location.hash !== '#disclaimer') return undefined;
    const timer = setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(timer);
  }, [location.hash, location.key]);

  useEffect(() => {
    let cancelled = false;
    findStorageName().then(async (name) => {
      if (!name) {
        console.error('Disclaimer not found in Storage (documents/disclaimer.pdf), using bundled copy');
        return;
      }
      const url = await fetchDocumentUrl(name);
      if (!cancelled) setDoc({ name, url });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const openPdf = () => {
    window.open(doc.url || BundledDisclaimer, '_blank', 'noopener,noreferrer');
  };

  const downloadBundled = () => {
    const link = document.createElement('a');
    link.href = BundledDisclaimer;
    link.download = SAVE_AS;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadPdf = () => {
    if (!doc.name) {
      downloadBundled();
      return;
    }
    downloadDocument(doc.name, SAVE_AS).catch((err) => {
      console.error('Firebase disclaimer download failed, using bundled copy:', err);
      downloadBundled();
    });
  };

  return (
    <section className="strategy-section" id="disclaimer" ref={sectionRef}>
      <div className="strategy-principle-card">
        <h2 className="strategy-card-title">⚖️ Disclaimer &amp; Terms of Use</h2>
        <p className="strategy-principle-text">
          All content, signals and analyses in the gold trading group reflect my
          <strong> personal opinion only</strong>, for information, learning and knowledge
          sharing. They are <strong>not investment advice</strong> or a recommendation to
          trade. Every trading decision is the user's sole responsibility - trading involves
          a significant risk of loss, including the loss of all capital.
        </p>
        <div className="strategy-rule-highlight">
          <strong>Joining and using the content</strong> constitutes agreement to these terms.
        </div>
        <div className="strategy-btn-group">
          <button type="button" onClick={openPdf} className="strategy-btn strategy-btn-secondary">
            <FaFileAlt /> View PDF
          </button>
          <button type="button" onClick={downloadPdf} className="strategy-btn strategy-btn-primary">
            <FaFileDownload /> Download PDF
          </button>
        </div>
      </div>
    </section>
  );
}
