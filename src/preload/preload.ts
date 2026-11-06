import { contextBridge, ipcRenderer } from 'electron';
import {
  SourceImageItem,
  AspectSettings,
  WatermarkSettings,
  ExportSettings,
  ProcessBatchResult,
  BatchProgressPayload,
  CanvasDimensions,
} from '../main/types';

const api = {
  // File dialogs
  openFiles: (): Promise<SourceImageItem[]> => {
    return ipcRenderer.invoke('dialog:openFiles');
  },

  openFolder: (): Promise<SourceImageItem[]> => {
    return ipcRenderer.invoke('dialog:openFolder');
  },

  inspectPaths: (paths: string[]): Promise<SourceImageItem[]> => {
    return ipcRenderer.invoke('images:inspectPaths', paths);
  },

  selectOutputFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke('dialog:selectOutputFolder');
  },

  selectWatermark: (): Promise<{
    filePath: string;
    thumbnailUrl: string;
    fileName: string;
  } | null> => {
    return ipcRenderer.invoke('dialog:selectWatermark');
  },

  // Live preview
  getLivePreview: (payload: {
    filePath: string;
    aspectSettings: AspectSettings;
    watermarkSettings: WatermarkSettings;
  }): Promise<{ previewUrl: string; dimensions: CanvasDimensions }> => {
    return ipcRenderer.invoke('image:getLivePreview', payload);
  },

  // Batch execution
  startBatch: (payload: {
    items: SourceImageItem[];
    aspectSettings: AspectSettings;
    watermarkSettings: WatermarkSettings;
    exportSettings: ExportSettings;
  }): Promise<ProcessBatchResult> => {
    return ipcRenderer.invoke('batch:start', payload);
  },

  cancelBatch: (): Promise<boolean> => {
    return ipcRenderer.invoke('batch:cancel');
  },

  // Shell actions
  openPath: (folderPath: string): Promise<boolean> => {
    return ipcRenderer.invoke('shell:openPath', folderPath);
  },

  // Progress event listener with cleanup unsubscribe function
  onBatchProgress: (callback: (payload: BatchProgressPayload) => void) => {
    const subscription = (_event: any, data: BatchProgressPayload) => callback(data);
    ipcRenderer.on('batch:progress', subscription);
    return () => {
      ipcRenderer.removeListener('batch:progress', subscription);
    };
  },
};

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld('electronAPI', api);
