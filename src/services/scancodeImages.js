import { useStorageImage, useStorageImageState } from './storageImages';

// scancodes/ofernewScancode.(jpg|jpeg), ofernewScancode1, ofernewScancode2, ...
//   whatsappGroup (ofernewScancode4) is readable by approved members only
//   (storage.rules) and is shown only on the WhatsApp Group page (/vip)
export const SCANCODE = {
  whatsapp: 0,
  price: 1,
  tiktok: 2,
  instagram: 3,
  whatsappGroup: 4,
  youtube: 5,
};

export const useScancodeImage = (index) =>
  useStorageImage('scancodes', 'ofernewScancode', index);

export const useScancodeImageState = (index) =>
  useStorageImageState('scancodes', 'ofernewScancode', index);
