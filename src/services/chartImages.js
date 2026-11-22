import { useStorageImageSequence } from './storageImages';

// Home strategy charts: charts/ofernewChart.jpg, charts/ofernewChart1.jpg,
// charts/ofernewChart2.jpg ... (.jpg or .jpeg). Add a chart by uploading the
// next number to Firebase Storage - no code change needed.
export const useChartImages = () => useStorageImageSequence('charts', 'ofernewChart');
