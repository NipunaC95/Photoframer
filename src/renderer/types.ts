import {
  AspectSettings,
  WatermarkSettings,
  ExportSettings,
  SourceImageItem,
  ProcessBatchResult,
  BatchProgressPayload,
  CanvasDimensions
} from '../main/types';

export * from '../main/types';

export interface IElectronAPI {
  webUtils?: {
    getPathForFile: (file: File) => string;
  };
  openFiles: () => Promise<SourceImageItem[]>;
  openFolder: () => Promise<SourceImageItem[]>;
  inspectPaths: (paths: string[]) => Promise<SourceImageItem[]>;
  selectOutputFolder: (defaultPath?: string) => Promise<string | null>;
  selectWatermark: () => Promise<{
    filePath: string;
    thumbnailUrl: string;
    fileName: string;
  } | null>;
  getLivePreview: (payload: {
    filePath: string;
    aspectSettings: AspectSettings;
    watermarkSettings: WatermarkSettings;
  }) => Promise<{ previewUrl: string; dimensions: CanvasDimensions }>;
  startBatch: (payload: {
    items: SourceImageItem[];
    aspectSettings: AspectSettings;
    watermarkSettings: WatermarkSettings;
    exportSettings: ExportSettings;
  }) => Promise<ProcessBatchResult>;
  cancelBatch: () => Promise<boolean>;
  openPath: (folderPath: string) => Promise<boolean>;
  onBatchProgress: (callback: (payload: BatchProgressPayload) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
