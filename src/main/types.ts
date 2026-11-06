export type AspectPreset = '1:1' | '4:5' | '9:16' | '16:9' | 'custom';

export type BackgroundMode = 'solid' | 'blur';

export type WatermarkAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface AspectSettings {
  preset: AspectPreset;
  customWidth: number;
  customHeight: number;
  backgroundMode: BackgroundMode;
  solidColor: string; // hex string e.g. '#000000', '#ffffff'
  blurSigma: number;
}

export interface WatermarkSettings {
  enabled: boolean;
  filePath: string | null;
  anchor: WatermarkAnchor;
  sizePercent: number; // percentage of target canvas width (e.g. 5% - 50%)
  opacity: number; // 0.1 to 1.0
  marginPercent: number; // percentage of target canvas (0% - 15%)
}

export interface ExportSettings {
  outputFolder: string | null;
  outputFormat: 'original' | 'jpeg' | 'png' | 'webp';
  quality: number; // 1 - 100
  prefix: string;
  suffix: string;
}

export interface SourceImageItem {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
  format: string;
  thumbnailUrl?: string;
}

export interface BatchProgressPayload {
  currentIndex: number;
  totalImages: number;
  currentFileName: string;
  progressPercent: number;
  status: 'processing' | 'completed' | 'cancelled' | 'error';
  errorMessage?: string;
  outputPath?: string;
}

export interface ProcessBatchResult {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  outputFolder: string;
  errors: Array<{ fileName: string; error: string }>;
}

export interface CanvasDimensions {
  canvasWidth: number;
  canvasHeight: number;
  imageTargetX: number;
  imageTargetY: number;
  imageTargetWidth: number;
  imageTargetHeight: number;
  scale: number;
}
