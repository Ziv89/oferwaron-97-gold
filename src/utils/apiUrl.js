// Builds the URL for a Vercel function in /api.
// Web (Vercel + local dev): REACT_APP_API_BASE_URL is unset, so the call stays
// relative ("/api/...") and hits the same origin.
// Android app (Capacitor): the page is served from https://localhost inside the
// WebView, so scripts/build-android.js sets the base to the live site.
const API_BASE = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');

export const apiUrl = (path) => `${API_BASE}${path}`;

// True when running inside the native Android/iOS shell
export const isNativeApp = () => Boolean(window.Capacitor?.isNativePlatform?.());
