import { fetchStorageImageSequence } from './storageImages';

// performances/ofernewPerformance.jpg, ofernewPerformance1.jpg, ofernewPerformance2.jpg ...
// Shared across visits to the page so Storage is only probed once per session
export const fetchPerformanceImages = () =>
  fetchStorageImageSequence('performances', 'ofernewPerformance');
