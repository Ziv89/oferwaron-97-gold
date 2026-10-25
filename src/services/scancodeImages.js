import { useStorageImage, useStorageImageState } from './storageImages';

// scancodes/ofernewScancode.(jpg|jpeg), ofernewScancode1, ofernewScancode2, ...
export const SCANCODE = {
  whatsapp: 0,
  price: 1,
  tiktok: 2,
  instagram: 3,
  youtube: 4,
};

export const useScancodeImage = (index) =>
  useStorageImage('scancodes', 'ofernewScancode', index);

export const useScancodeImageState = (index) =>
  useStorageImageState('scancodes', 'ofernewScancode', index);
