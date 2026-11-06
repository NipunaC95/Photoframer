const { spawn } = require('child_process');
const electronPath = require('electron');
const path = require('path');

console.log('electronPath:', electronPath);

const cleanEnv = { ...process.env };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

const proc = spawn(electronPath, [
  path.resolve(__dirname, '..'),
  '--no-sandbox',
], {
  detached: true,
  stdio: 'ignore',
  env: cleanEnv,
});

proc.unref();

console.log('Electron launched detached with PID:', proc.pid);
process.exit(0);
