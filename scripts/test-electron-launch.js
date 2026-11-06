const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Electron startup and window initialization...');

const electronBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const cleanEnv = {
  ...process.env,
  TEST_MODE: '1',
};
delete cleanEnv.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBin, ['electron', '.', '--test-mode'], {
  cwd: path.resolve(__dirname, '..'),
  shell: true,
  env: cleanEnv,
  stdio: 'pipe',
});

let output = '';

child.stdout.on('data', (d) => {
  output += d.toString();
  console.log('[Electron stdout]:', d.toString().trim());
});

child.stderr.on('data', (d) => {
  output += d.toString();
  console.error('[Electron stderr]:', d.toString().trim());
});

// Auto-terminate after 6 seconds
setTimeout(() => {
  console.log('Terminating test Electron instance...');
  child.kill();
  process.exit(0);
}, 6000);
