import { useStorageImage } from './storageImages';

// selfimages/ofernewSelfimage.jpg, selfimages/ofernewSelfimage1.jpg, ...
export const useSelfImage = (index) =>
  useStorageImage('selfimages', 'ofernewSelfimage', index);
