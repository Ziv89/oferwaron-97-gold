// Env-gated logging. Keeps dev logs, silences them in the production build.
const isDev = process.env.NODE_ENV !== 'production';

export const log = (...args) => { if (isDev) console.log(...args); };
export const warn = (...args) => { if (isDev) console.warn(...args); };
// errors always surface
export const error = (...args) => console.error(...args);

const logger = { log, warn, error };
export default logger;
