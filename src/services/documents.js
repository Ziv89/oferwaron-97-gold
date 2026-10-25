import { useState, useEffect } from 'react';
import { ref, getDownloadURL, getBlob } from 'firebase/storage';
import { storage } from './firebase';
import { log } from '../utils/logger';

// documents/cv.pdf, documents/cv.docx
const documentPath = (fileName) => `documents/${fileName}`;

const cachedRequests = {};

// Shared across components/visits so each document URL is only fetched once per session
export const fetchDocumentUrl = (fileName) => {
  const path = documentPath(fileName);

  if (!cachedRequests[path]) {
    cachedRequests[path] = getDownloadURL(ref(storage, path))
      .then((url) => {
        log('Fetched storage document:', path, url);
        return url;
      })
      .catch((err) => {
        delete cachedRequests[path];
        throw err;
      });
  }
  return cachedRequests[path];
};

// Returns the download URL for the document, or null while loading / on error
export const useDocumentUrl = (fileName) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchDocumentUrl(fileName)
      .then((result) => {
        if (!cancelled) setUrl(result);
      })
      .catch((err) => {
        console.error(`Failed to load ${documentPath(fileName)}:`, err);
      });

    return () => {
      cancelled = true;
    };
  }, [fileName]);

  return url;
};

// Saves the document under `saveAs`. Cross-origin URLs ignore the <a download> attribute,
// so the file is fetched as a blob first (needs CORS set on the bucket).
// Rejects on failure so callers can fall back to the bundled copy.
export const downloadDocument = async (fileName, saveAs) => {
  const blob = await getBlob(ref(storage, documentPath(fileName)));
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = saveAs;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};
