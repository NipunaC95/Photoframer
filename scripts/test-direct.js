const { spawn } = require('child_process');
const electronPath = require('electron');
const path = require('path');

console.log('Starting Electron in interactive mode...');
console.log('electronPath:', electronPath);

const cleanEnv = {
  ...process.env,
  ELECTRON_ENABLE_LOGGING: '1',
};
delete cleanEnv.ELECTRON_RUN_AS_NODE;

const proc = spawn(electronPath, [
  path.resolve(__dirname, '..'),
  '--no-sandbox',
], {
  stdio: 'inherit',
  env: cleanEnv,
});

proc.on('error', (err) => {
  console.error('Failed to start child process:', err);
});

proc.on('close', (code, signal) => {
  console.log(`Child process closed with code ${code} and signal ${signal}`);
});
