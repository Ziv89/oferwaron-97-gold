const { spawn } = require('node:child_process');

const isWindows = process.platform === 'win32';
const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'npx';
const args = isWindows
  ? ['/d', '/s', '/c', 'npx --yes vercel dev --listen 3001']
  : ['--yes', 'vercel', 'dev', '--listen', '3001'];
const child = spawn(command, args, {
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(`Could not start Vercel CLI: ${error.message}`);
  process.exitCode = 1;
});

child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});