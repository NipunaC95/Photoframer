const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const DEV_SERVER_URL = 'http://localhost:5173';

function waitForServer(url, timeoutMs = 30000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Timed out waiting for Vite server at ${url}`));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

async function run() {
  console.log('[dev-runner] Compiling main & preload with Vite...');
  const buildMain = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
    'vite',
    'build',
    '--config',
    'vite.config.main.ts'
  ], {
    stdio: 'inherit',
    shell: true,
    cwd: path.resolve(__dirname, '..')
  });

  await new Promise((resolve, reject) => {
    buildMain.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Main build failed with exit code ${code}`));
    });
  });

  console.log('[dev-runner] Waiting for Vite renderer server at ' + DEV_SERVER_URL + '...');
  await waitForServer(DEV_SERVER_URL);
  console.log('[dev-runner] Vite server is ready! Launching Electron...');

  const electronBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const cleanEnv = {
    ...process.env,
    VITE_DEV_SERVER_URL: DEV_SERVER_URL,
    NODE_ENV: 'development',
  };
  delete cleanEnv.ELECTRON_RUN_AS_NODE;

  const electronProcess = spawn(electronBin, ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: cleanEnv,
    cwd: path.resolve(__dirname, '..')
  });

  electronProcess.on('close', (code) => {
    console.log(`[dev-runner] Electron exited with code ${code}`);
    process.exit(code || 0);
  });
}

run().catch((err) => {
  console.error('[dev-runner] Error:', err);
  process.exit(1);
});
