
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { log } from '../utils/logger';

const PERFORMANCE_FOLDER = 'performances';
const BASE_NAME = 'ofernewPerformance';
const EXTENSION = 'jpg';
const MAX_IMAGES = 50;

// ofernewPerformance.jpg, ofernewPerformance1.jpg, ofernewPerformance2.jpg ...
const performanceImagePath = (index) =>
  `${PERFORMANCE_FOLDER}/${BASE_NAME}${index === 0 ? '' : index}.${EXTENSION}`;

let cachedRequest = null;

const loadPerformanceImages = async () => {
  const urls = [];

  for (let i = 0; i < MAX_IMAGES; i++) {
    try {
      urls.push(await getDownloadURL(ref(storage, performanceImagePath(i))));
    } catch (err) {
      // object-not-found = end of the sequence; anything else is a real error
      if (err.code !== 'storage/object-not-found') throw err;
      break;
    }
  }

  log('Fetched performance images:', urls);
  return urls;
};

// Shared across visits to the page so Storage is only probed once per session
export const fetchPerformanceImages = () => {
  if (!cachedRequest) {
    cachedRequest = loadPerformanceImages().catch((err) => {
      cachedRequest = null;
      throw err;
    });
  }
  return cachedRequest;
};
