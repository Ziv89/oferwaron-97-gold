// Builds the web app for the Android (Capacitor) shell and syncs it into /android.
// Does not touch the Vercel build: it only sets env vars for this one build.
//   npm run build:android                 -> API calls go to https://www.oferwaron.com
//   API_BASE_URL=https://x.vercel.app npm run build:android   -> custom backend
const { execSync } = require('child_process');

const env = {
  ...process.env,
  REACT_APP_API_BASE_URL: process.env.API_BASE_URL || 'https://www.oferwaron.com',
  GENERATE_SOURCEMAP: 'false',
};

const run = (cmd) => execSync(cmd, { stdio: 'inherit', env });

console.log(`[android] API base: ${env.REACT_APP_API_BASE_URL}`);
run('npm run build');
run('npx cap sync android');
