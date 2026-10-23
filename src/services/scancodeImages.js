import { useStorageImage } from './storageImages';

// scancodes/ofernewScancode.jpg (WhatsApp QR), scancodes/ofernewScancode1.jpg (price), ...
export const useScancodeImage = (index) =>
  useStorageImage('scancodes', 'ofernewScancode', index);
