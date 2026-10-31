import { useCallback, useEffect, useRef } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { log } from '../utils/logger';

// soundeffect/{fileName} in Firebase Storage (readable per storage.rules)
const SOUND_FOLDER = 'soundeffect';
export const ALERT_SOUND = 'alertEffect.mp3';

const cachedRequests = {};

// Download URL of a sound effect. Shared across components/visits so each
// file is only looked up once per session; a failed lookup can be retried.
export const fetchSoundEffect = (fileName) => {
  if (!cachedRequests[fileName]) {
    cachedRequests[fileName] = getDownloadURL(ref(storage, `${SOUND_FOLDER}/${fileName}`))
      .then((url) => {
        log('Fetched sound effect:', fileName, url);
        return url;
      })
      .catch((err) => {
        delete cachedRequests[fileName];
        throw err;
      });
  }
  return cachedRequests[fileName];
};

// { play, unlock } for one sound effect, preloaded as soon as the component mounts.
//   play()   - plays from the start; never throws. Resolves to 'played',
//              'not-loaded' (file missing / not readable yet) or 'blocked' (autoplay policy)
//   unlock() - call from a click handler: lets iOS Safari play it later without a tap
export const useSoundEffect = (fileName) => {
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    fetchSoundEffect(fileName)
      .then((url) => {
        if (cancelled) return;
        const audio = new Audio(url);
        audio.preload = 'auto';
        audioRef.current = audio;
      })
      .catch((err) => console.error(`Failed to load ${SOUND_FOLDER}/${fileName}:`, err));

    return () => {
      cancelled = true;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [fileName]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return Promise.resolve('not-loaded');
    audio.currentTime = 0;
    // Autoplay policy: rejected until the user has interacted with the page
    return audio
      .play()
      .then(() => 'played')
      .catch((err) => (err?.name === 'NotAllowedError' ? 'blocked' : 'not-loaded'));
  }, []);

  const unlock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.dataset.unlocked) return;
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.dataset.unlocked = 'true';
      })
      .catch(() => {})
      .finally(() => {
        audio.muted = false;
      });
  }, []);

  return { play, unlock };
};
