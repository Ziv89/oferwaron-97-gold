import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { log } from '../utils/logger';

// siteData/cvContent - text of documents/cv.pdf, read by the extractCvContent
// Cloud Function whenever cv.pdf is uploaded:
//   blocks: [{ type: 'h1' | 'h2' | 'p', runs }, { type: 'ul', items: [{ runs, sub }] }]
//   runs:   [{ text, bold }]
//   footer: '© Ofer Waron | All rights reserved.'

let cachedRequest = null;

// Shared across visits so the CV text is only fetched once per session
const fetchCvContent = () => {
  if (!cachedRequest) {
    cachedRequest = getDoc(doc(db, 'siteData', 'cvContent'))
      .then((snap) => {
        log('Fetched CV content:', snap.exists());
        return snap.exists() && snap.data().blocks?.length ? snap.data() : null;
      })
      .catch((err) => {
        cachedRequest = null;
        throw err;
      });
  }
  return cachedRequest;
};

// { loading, content } - content is null when it is missing or failed to load
export const useCvContent = () => {
  const [state, setState] = useState({ loading: true, content: null });

  useEffect(() => {
    let cancelled = false;

    fetchCvContent()
      .then((content) => {
        if (!cancelled) setState({ loading: false, content });
      })
      .catch((err) => {
        console.error('Failed to load siteData/cvContent:', err);
        if (!cancelled) setState({ loading: false, content: null });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
