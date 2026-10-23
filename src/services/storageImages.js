import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { log } from '../utils/logger';

const EXTENSION = 'jpg';

// {folder}/{baseName}.jpg, {folder}/{baseName}1.jpg, {folder}/{baseName}2.jpg ...
const storageImagePath = (folder, baseName, index) =>
  `${folder}/${baseName}${index === 0 ? '' : index}.${EXTENSION}`;

const cachedRequests = {};

// Shared across components/visits so each image URL is only fetched once per session
export const fetchStorageImage = (folder, baseName, index) => {
  const path = storageImagePath(folder, baseName, index);

  if (!cachedRequests[path]) {
    cachedRequests[path] = getDownloadURL(ref(storage, path))
      .then((url) => {
        log('Fetched storage image:', path, url);
        return url;
      })
      .catch((err) => {
        delete cachedRequests[path];
        throw err;
      });
  }
  return cachedRequests[path];
};

// Returns the download URL for the image, or null while loading / on error
export const useStorageImage = (folder, baseName, index) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchStorageImage(folder, baseName, index)
      .then((result) => {
        if (!cancelled) setUrl(result);
      })
      .catch((err) => {
        console.error(`Failed to load ${storageImagePath(folder, baseName, index)}:`, err);
      });

    return () => {
      cancelled = true;
    };
  }, [folder, baseName, index]);

  return url;
};
