import {
  AspectSettings,
  WatermarkSettings,
  ExportSettings,
  SourceImageItem,
  ProcessBatchResult,
  BatchProgressPayload,
  CanvasDimensions,
  AspectPreset,
  BackgroundMode,
  WatermarkAnchor,
} from '../main/types';

export * from '../main/types';

export interface IElectronAPI {
  openFiles: () => Promise<SourceImageItem[]>;
  openFolder: () => Promise<SourceImageItem[]>;
  inspectPaths: (paths: string[]) => Promise<SourceImageItem[]>;
  selectOutputFolder: () => Promise<string | null>;
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
