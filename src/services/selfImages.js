import { useStorageImage } from './storageImages';

// selfimages/ofernewSelfimage.(jpg|jpeg), selfimages/ofernewSelfimage1.(jpg|jpeg), ...
export const useSelfImage = (index) =>
  useStorageImage('selfimages', 'ofernewSelfimage', index);
