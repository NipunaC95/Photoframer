import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import os from 'os';

// Ensure writable cache and user data directory on Windows
const customUserData = path.join(os.tmpdir(), 'photoframer-app-data');
try {
  fsSync.mkdirSync(customUserData, { recursive: true });
  app.setPath('userData', customUserData);
} catch (e) {
  console.error('Failed to set custom userData path:', e);
}

app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('no-sandbox');

// Log to file for diagnostics
const logFile = path.resolve(__dirname, '../../electron-debug.log');
function logDebug(msg: string) {
  try {
    fsSync.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {}
}

logDebug('Electron main script loaded');

process.on('uncaughtException', (err) => {
  logDebug(`UNCAUGHT EXCEPTION: ${err?.stack || err}`);
});

process.on('unhandledRejection', (reason: any) => {
  logDebug(`UNHANDLED REJECTION: ${reason?.stack || reason}`);
});
import {
  inspectImageFile,
  generateThumbnail,
  generateLivePreview,
  processBatchImages,
  SUPPORTED_EXTENSIONS,
} from './imageProcessor';
import {
  AspectSettings,
  WatermarkSettings,
  ExportSettings,
  SourceImageItem,
} from './types';

// Register custom protocol for local image access securely
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app-img',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: false,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;
let isProcessingCancelled = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1040,
    minHeight: 700,
    backgroundColor: '#0d0f12',
    show: true, // Show immediately
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
    if (process.env.TEST_MODE === '1' || process.argv.includes('--test-mode')) {
      console.log('[Electron Main] Window ready-to-show verified successfully in test mode!');
      setTimeout(() => {
        app.quit();
      }, 1000);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logDebug('mainWindow did-finish-load successfully');
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logDebug(`mainWindow did-fail-load: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logDebug(`render-process-gone: ${JSON.stringify(details)}`);
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    logDebug(`Renderer console [${level}]: ${message} (${sourceId}:${line})`);
  });

  // Content Security Policy
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    // In dev mode, allow 'unsafe-inline' and 'unsafe-eval' plus connect-src ws: for Vite HMR
    const csp = devServerUrl
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: app-img:; font-src 'self' data:; connect-src 'self' ws: http:;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: app-img:; font-src 'self' data:;";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  // Enable F12 or Cmd/Ctrl+Shift+I for DevTools in development
  if (devServerUrl || process.env.NODE_ENV === 'development') {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (
        input.key === 'F12' ||
        ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i')
      ) {
        mainWindow?.webContents.toggleDevTools();
      }
    });
  }

  // In development, load from Vite dev server; in production, load local dist index.html
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    logDebug('mainWindow closed event fired');
    mainWindow = null;
  });
}

// Set up secure app-img protocol handler
function registerProtocolHandler() {
  protocol.handle('app-img', async (request) => {
    try {
      // Decode URL, stripping scheme
      let urlPath = request.url.replace(/^app-img:\/\/+/, '');
      urlPath = decodeURIComponent(urlPath);

      // On Windows, handle leading slash or drive letter correctly
      if (process.platform === 'win32' && /^[a-zA-Z]:[\\\/]/.test(urlPath)) {
        // e.g. C:/path...
      } else if (process.platform === 'win32' && /^\/[a-zA-Z]:[\\\/]/.test(urlPath)) {
        urlPath = urlPath.slice(1);
      }

      return await net.fetch(`file:///${urlPath.replace(/\\/g, '/')}`);
    } catch (err) {
      console.error('Failed to handle app-img protocol:', err);
      return new Response('Not found', { status: 404 });
    }
  });
}

// Scan directory helper
async function scanDirectoryForImages(dirPath: string): Promise<string[]> {
  const result: string[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          result.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dirPath}:`, err);
  }
  return result;
}

// App lifecycle
app.whenReady().then(() => {
  logDebug('app.whenReady reached');
  registerProtocolHandler();
  createWindow();
  logDebug('createWindow called');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch((err) => {
  logDebug(`app.whenReady error: ${err?.stack || err}`);
});

app.on('window-all-closed', () => {
  logDebug('window-all-closed fired');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// 1. Pick individual image files
ipcMain.handle('dialog:openFiles', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Source Images',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Images',
        extensions: ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'bmp', 'avif'],
      },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  const items: SourceImageItem[] = [];
  for (const filePath of result.filePaths) {
    try {
      const item = await inspectImageFile(filePath);
      item.thumbnailUrl = await generateThumbnail(filePath, 160);
      items.push(item);
    } catch (err) {
      console.error(`Could not inspect image ${filePath}:`, err);
    }
  }

  return items;
});

// 2. Pick an entire source folder
ipcMain.handle('dialog:openFolder', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Image Folder',
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  const folderPath = result.filePaths[0];
  const filePaths = await scanDirectoryForImages(folderPath);

  const items: SourceImageItem[] = [];
  for (const filePath of filePaths) {
    try {
      const item = await inspectImageFile(filePath);
      item.thumbnailUrl = await generateThumbnail(filePath, 160);
      items.push(item);
    } catch (err) {
      console.error(`Could not inspect image ${filePath}:`, err);
    }
  }

  return items;
});

// 3. Inspect dropped file paths
ipcMain.handle('images:inspectPaths', async (_, filePaths: string[]) => {
  const items: SourceImageItem[] = [];
  for (const filePath of filePaths) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        const nestedPaths = await scanDirectoryForImages(filePath);
        for (const nested of nestedPaths) {
          try {
            const item = await inspectImageFile(nested);
            item.thumbnailUrl = await generateThumbnail(nested, 160);
            items.push(item);
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        const ext = path.extname(filePath).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          const item = await inspectImageFile(filePath);
          item.thumbnailUrl = await generateThumbnail(filePath, 160);
          items.push(item);
        }
      }
    } catch (err) {
      console.error(`Error inspecting dropped path ${filePath}:`, err);
    }
  }
  return items;
});

// 4. Select custom output folder
ipcMain.handle('dialog:selectOutputFolder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Export Directory',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// 5. Select transparent PNG watermark file
ipcMain.handle('dialog:selectWatermark', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Watermark Logo (PNG)',
    properties: ['openFile'],
    filters: [{ name: 'PNG Images', extensions: ['png'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const wmPath = result.filePaths[0];
  const thumb = await generateThumbnail(wmPath, 200);
  return {
    filePath: wmPath,
    thumbnailUrl: thumb,
    fileName: path.basename(wmPath),
  };
});

// 6. Generate high-fidelity live preview for active image
ipcMain.handle(
  'image:getLivePreview',
  async (
    _,
    payload: {
      filePath: string;
      aspectSettings: AspectSettings;
      watermarkSettings: WatermarkSettings;
    }
  ) => {
    try {
      return await generateLivePreview(
        payload.filePath,
        payload.aspectSettings,
        payload.watermarkSettings,
        1400
      );
    } catch (err: any) {
      console.error('Failed to generate live preview:', err);
      throw new Error(err.message || 'Preview generation failed');
    }
  }
);

// 7. Start batch processing
ipcMain.handle(
  'batch:start',
  async (
    _,
    payload: {
      items: SourceImageItem[];
      aspectSettings: AspectSettings;
      watermarkSettings: WatermarkSettings;
      exportSettings: ExportSettings;
    }
  ) => {
    isProcessingCancelled = false;

    return await processBatchImages(
      payload.items,
      payload.aspectSettings,
      payload.watermarkSettings,
      payload.exportSettings,
      (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('batch:progress', progress);
        }
      },
      () => isProcessingCancelled
    );
  }
);

// 8. Cancel batch processing
ipcMain.handle('batch:cancel', () => {
  isProcessingCancelled = true;
  return true;
});

// 9. Open output folder in file explorer
ipcMain.handle('shell:openPath', async (_, folderPath: string) => {
  try {
    await shell.openPath(folderPath);
    return true;
  } catch (err) {
    console.error(`Failed to open path ${folderPath}:`, err);
    return false;
  }
});
