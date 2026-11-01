import { useState, useEffect } from 'react';
import { ref, getDownloadURL, getMetadata } from 'firebase/storage';
import { storage } from './firebase';
import { log } from '../utils/logger';

// Every extension is checked - when more than one exists in Storage (e.g. an old
// ofernewScancode2.jpg next to a newer ofernewScancode2.jpeg), the most recently
// uploaded file wins, so replacing an image never needs the old one deleted first
const EXTENSIONS = ['jpg', 'jpeg'];

// {folder}/{baseName}.{ext}, {folder}/{baseName}1.{ext}, {folder}/{baseName}2.{ext} ...
const storageImagePath = (folder, baseName, index, extension) =>
  `${folder}/${baseName}${index === 0 ? '' : index}.${extension}`;

const cachedRequests = {};

// Resolves the newest existing extension; rejects with the last error if none exist
const fetchNewestExisting = async (folder, baseName, index) => {
  const results = await Promise.allSettled(
    EXTENSIONS.map((extension) => getMetadata(ref(storage, storageImagePath(folder, baseName, index, extension))))
  );

  const found = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  if (!found.length) throw results[results.length - 1].reason;

  const newest = found.reduce((a, b) => (Date.parse(b.updated) > Date.parse(a.updated) ? b : a));
  const url = await getDownloadURL(ref(storage, newest.fullPath));
  log('Fetched storage image:', newest.fullPath, url);
  return url;
};

// Shared across components/visits so each image URL is only fetched once per session
export const fetchStorageImage = (folder, baseName, index) => {
  const key = `${folder}/${baseName}${index}`;

  if (!cachedRequests[key]) {
    cachedRequests[key] = fetchNewestExisting(folder, baseName, index).catch((err) => {
      delete cachedRequests[key];
      throw err;
    });
  }
  return cachedRequests[key];
};

// { url, failed } - url is null while loading / on error; failed is true once no extension exists
export const useStorageImageState = (folder, baseName, index) => {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    fetchStorageImage(folder, baseName, index)
      .then((result) => {
        if (!cancelled) setUrl(result);
      })
      .catch((err) => {
        const tried = EXTENSIONS.map((ext) => storageImagePath(folder, baseName, index, ext));
        console.error(`Failed to load ${tried.join(' / ')}:`, err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [folder, baseName, index]);

  return { url, failed };
};

// Returns the download URL for the image, or null while loading / on error
export const useStorageImage = (folder, baseName, index) =>
  useStorageImageState(folder, baseName, index).url;
