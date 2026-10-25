import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { log } from '../utils/logger';

// Tried in order - the first one that exists in Storage wins
const EXTENSIONS = ['jpg', 'jpeg'];

// {folder}/{baseName}.{ext}, {folder}/{baseName}1.{ext}, {folder}/{baseName}2.{ext} ...
const storageImagePath = (folder, baseName, index, extension) =>
  `${folder}/${baseName}${index === 0 ? '' : index}.${extension}`;

const cachedRequests = {};

// Resolves the first extension that exists; rejects with the last error if none do
const fetchFirstExisting = async (folder, baseName, index) => {
  let lastError;
  for (const extension of EXTENSIONS) {
    const path = storageImagePath(folder, baseName, index, extension);
    try {
      const url = await getDownloadURL(ref(storage, path));
      log('Fetched storage image:', path, url);
      return url;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
};

// Shared across components/visits so each image URL is only fetched once per session
export const fetchStorageImage = (folder, baseName, index) => {
  const key = `${folder}/${baseName}${index}`;

  if (!cachedRequests[key]) {
    cachedRequests[key] = fetchFirstExisting(folder, baseName, index).catch((err) => {
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
