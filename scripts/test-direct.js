const { spawn } = require('child_process');
const electronPath = require('electron');
const path = require('path');

console.log('Starting Electron in interactive mode...');
console.log('electronPath:', electronPath);

const proc = spawn(electronPath, [
  path.resolve(__dirname, '..'),
  '--no-sandbox',
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_ENABLE_LOGGING: '1',
  }
});

proc.on('error', (err) => {
  console.error('Failed to start child process:', err);
});

proc.on('close', (code, signal) => {
  console.log(`Child process closed with code ${code} and signal ${signal}`);
});
