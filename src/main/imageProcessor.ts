import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import {
  AspectSettings,
  WatermarkSettings,
  ExportSettings,
  SourceImageItem,
  CanvasDimensions,
  ProcessBatchResult,
  BatchProgressPayload,
} from './types';

// Supported extensions
export const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp', '.avif']);

export function parseHexColor(hex: string): { r: number; g: number; b: number; alpha: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length === 6) {
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      alpha: 1,
    };
  }
  return { r: 255, g: 255, b: 255, alpha: 1 };
}

export function calculateTargetRatio(settings: AspectSettings): number {
  switch (settings.preset) {
    case '1:1':
      return 1.0;
    case '4:5':
      return 4 / 5;
    case '9:16':
      return 9 / 16;
    case '16:9':
      return 16 / 9;
    case 'custom': {
      const w = Math.max(1, settings.customWidth || 1);
      const h = Math.max(1, settings.customHeight || 1);
      return w / h;
    }
    default:
      return 1.0;
  }
}

/**
 * Calculates canvas dimensions ensuring non-destructive letterbox/pillarbox padding.
 * Original image is NEVER cropped or downscaled; canvas expands to match target aspect ratio.
 */
export function calculateCanvasDimensions(
  origWidth: number,
  origHeight: number,
  settings: AspectSettings
): CanvasDimensions {
  const targetRatio = calculateTargetRatio(settings);
  const origRatio = origWidth / origHeight;

  let canvasWidth: number;
  let canvasHeight: number;
  let imageTargetX = 0;
  let imageTargetY = 0;

  // EPSILON tolerance for floating point ratio comparison
  const EPSILON = 0.0001;

  if (Math.abs(origRatio - targetRatio) < EPSILON) {
    canvasWidth = origWidth;
    canvasHeight = origHeight;
    imageTargetX = 0;
    imageTargetY = 0;
  } else if (origRatio > targetRatio) {
    // Image is wider than target ratio -> Add vertical padding (letterbox top & bottom)
    canvasWidth = origWidth;
    canvasHeight = Math.round(canvasWidth / targetRatio);
    imageTargetY = Math.round((canvasHeight - origHeight) / 2);
    imageTargetX = 0;
  } else {
    // Image is taller than target ratio -> Add horizontal padding (pillarbox left & right)
    canvasHeight = origHeight;
    canvasWidth = Math.round(canvasHeight * targetRatio);
    imageTargetX = Math.round((canvasWidth - origWidth) / 2);
    imageTargetY = 0;
  }

  return {
    canvasWidth: Math.max(1, canvasWidth),
    canvasHeight: Math.max(1, canvasHeight),
    imageTargetX,
    imageTargetY,
    imageTargetWidth: origWidth,
    imageTargetHeight: origHeight,
    scale: 1,
  };
}

/**
 * Inspects an image file and extracts metadata
 */
export async function inspectImageFile(filePath: string): Promise<SourceImageItem> {
  const stats = await fs.stat(filePath);
  const metadata = await sharp(filePath).metadata();

  const width = metadata.width || 1000;
  const height = metadata.height || 1000;
  const aspectRatio = width / height;

  let orientation: 'landscape' | 'portrait' | 'square' = 'square';
  if (aspectRatio > 1.05) orientation = 'landscape';
  else if (aspectRatio < 0.95) orientation = 'portrait';

  return {
    id: `${filePath}_${stats.mtimeMs}`,
    filePath,
    fileName: path.basename(filePath),
    fileSize: stats.size,
    width,
    height,
    aspectRatio: Number(aspectRatio.toFixed(3)),
    orientation,
    format: (metadata.format || path.extname(filePath).replace('.', '')).toUpperCase(),
  };
}

/**
 * Generates an ultra-fast, lightweight thumbnail for the UI list
 */
export async function generateThumbnail(filePath: string, maxDimension = 160): Promise<string> {
  const buffer = await sharp(filePath)
    .resize(maxDimension, maxDimension, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

/**
 * Prepares the scaled, opacity-adjusted watermark buffer and coordinates
 */
async function prepareWatermark(
  watermarkSettings: WatermarkSettings,
  canvasWidth: number,
  canvasHeight: number
): Promise<{ buffer: Buffer; left: number; top: number } | null> {
  if (!watermarkSettings.enabled || !watermarkSettings.filePath) {
    return null;
  }

  try {
    const wmMetadata = await sharp(watermarkSettings.filePath).metadata();
    if (!wmMetadata.width || !wmMetadata.height) return null;

    const sizePercent = Math.max(5, Math.min(50, watermarkSettings.sizePercent || 15));
    const targetWmWidth = Math.max(16, Math.round(canvasWidth * (sizePercent / 100)));
    const targetWmHeight = Math.max(
      16,
      Math.round(targetWmWidth * (wmMetadata.height / wmMetadata.width))
    );

    // Apply alpha opacity scaling
    const opacity = Math.max(0.05, Math.min(1.0, watermarkSettings.opacity ?? 0.8));
    const { data, info } = await sharp(watermarkSettings.filePath)
      .resize(targetWmWidth, targetWmHeight, { fit: 'contain' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (opacity < 0.99) {
      for (let i = 3; i < data.length; i += 4) {
        data[i] = Math.round(data[i] * opacity);
      }
    }

    const wmBuffer = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();

    // Calculate margins
    const marginPercent = Math.max(0, Math.min(20, watermarkSettings.marginPercent ?? 4));
    const marginPx = Math.round(canvasWidth * (marginPercent / 100));

    let left = marginPx;
    let top = marginPx;

    switch (watermarkSettings.anchor) {
      case 'top-left':
        left = marginPx;
        top = marginPx;
        break;
      case 'top-center':
        left = Math.round((canvasWidth - targetWmWidth) / 2);
        top = marginPx;
        break;
      case 'top-right':
        left = canvasWidth - targetWmWidth - marginPx;
        top = marginPx;
        break;
      case 'middle-left':
        left = marginPx;
        top = Math.round((canvasHeight - targetWmHeight) / 2);
        break;
      case 'center':
        left = Math.round((canvasWidth - targetWmWidth) / 2);
        top = Math.round((canvasHeight - targetWmHeight) / 2);
        break;
      case 'middle-right':
        left = canvasWidth - targetWmWidth - marginPx;
        top = Math.round((canvasHeight - targetWmHeight) / 2);
        break;
      case 'bottom-left':
        left = marginPx;
        top = canvasHeight - targetWmHeight - marginPx;
        break;
      case 'bottom-center':
        left = Math.round((canvasWidth - targetWmWidth) / 2);
        top = canvasHeight - targetWmHeight - marginPx;
        break;
      case 'bottom-right':
        left = canvasWidth - targetWmWidth - marginPx;
        top = canvasHeight - targetWmHeight - marginPx;
        break;
    }

    // Keep within bounds
    left = Math.max(0, Math.min(canvasWidth - targetWmWidth, left));
    top = Math.max(0, Math.min(canvasHeight - targetWmHeight, top));

    return {
      buffer: wmBuffer,
      left,
      top,
    };
  } catch (err) {
    console.error('Error preparing watermark:', err);
    return null;
  }
}

/**
 * Builds the composite sharp instance for a single image
 */
export async function buildProcessedImage(
  sourceFilePath: string,
  aspectSettings: AspectSettings,
  watermarkSettings: WatermarkSettings
): Promise<{ pipeline: sharp.Sharp; canvasDims: CanvasDimensions; origMetadata: sharp.Metadata }> {
  const origMetadata = await sharp(sourceFilePath).metadata();
  const origWidth = origMetadata.width || 1000;
  const origHeight = origMetadata.height || 1000;

  const canvasDims = calculateCanvasDimensions(origWidth, origHeight, aspectSettings);
  const { canvasWidth, canvasHeight, imageTargetX, imageTargetY } = canvasDims;

  let baseSharp: sharp.Sharp;

  if (aspectSettings.backgroundMode === 'blur') {
    // Generate blurred cover background
    const sigma = Math.max(5, Math.min(60, aspectSettings.blurSigma || 28));
    const blurredBgBuffer = await sharp(sourceFilePath)
      .resize(canvasWidth, canvasHeight, {
        fit: 'cover',
        position: 'center',
      })
      .blur(sigma)
      .toBuffer();

    baseSharp = sharp(blurredBgBuffer);
  } else {
    // Solid color background
    const bg = parseHexColor(aspectSettings.solidColor || '#000000');
    baseSharp = sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: bg,
      },
    });
  }

  // Composite elements
  const composites: sharp.OverlayOptions[] = [];

  // 1. Original image placed at centered coordinates
  const originalBuffer = await sharp(sourceFilePath).toBuffer();
  composites.push({
    input: originalBuffer,
    top: imageTargetY,
    left: imageTargetX,
  });

  // 2. Watermark overlay (if enabled)
  const watermark = await prepareWatermark(watermarkSettings, canvasWidth, canvasHeight);
  if (watermark) {
    composites.push({
      input: watermark.buffer,
      top: watermark.top,
      left: watermark.left,
    });
  }

  return {
    pipeline: baseSharp.composite(composites),
    canvasDims,
    origMetadata,
  };
}

/**
 * Generates a full high-fidelity preview image as a data URL
 */
export async function generateLivePreview(
  sourceFilePath: string,
  aspectSettings: AspectSettings,
  watermarkSettings: WatermarkSettings,
  maxPreviewDimension = 1200
): Promise<{ previewUrl: string; dimensions: CanvasDimensions }> {
  const { pipeline, canvasDims } = await buildProcessedImage(
    sourceFilePath,
    aspectSettings,
    watermarkSettings
  );

  // Resize preview for snappy UI rendering if larger than maxPreviewDimension
  let previewPipeline = pipeline;
  if (canvasDims.canvasWidth > maxPreviewDimension || canvasDims.canvasHeight > maxPreviewDimension) {
    previewPipeline = pipeline.resize(maxPreviewDimension, maxPreviewDimension, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const previewBuffer = await previewPipeline.webp({ quality: 85 }).toBuffer();
  return {
    previewUrl: `data:image/webp;base64,${previewBuffer.toString('base64')}`,
    dimensions: canvasDims,
  };
}

/**
 * Executes batch processing over source items
 */
export async function processBatchImages(
  items: SourceImageItem[],
  aspectSettings: AspectSettings,
  watermarkSettings: WatermarkSettings,
  exportSettings: ExportSettings,
  onProgress: (payload: BatchProgressPayload) => void,
  shouldCancel: () => boolean = () => false
): Promise<ProcessBatchResult> {
  const errors: Array<{ fileName: string; error: string }> = [];
  let successCount = 0;

  // Determine output directory
  let outputDir = exportSettings.outputFolder;
  if (!outputDir) {
    if (items.length > 0) {
      const firstDir = path.dirname(items[0].filePath);
      outputDir = path.join(firstDir, 'Exported');
    } else {
      outputDir = path.join(process.cwd(), 'Exported');
    }
  }

  await fs.mkdir(outputDir, { recursive: true });

  const total = items.length;

  for (let i = 0; i < total; i++) {
    if (shouldCancel()) {
      onProgress({
        currentIndex: i,
        totalImages: total,
        currentFileName: items[i].fileName,
        progressPercent: Math.round((i / total) * 100),
        status: 'cancelled',
        outputPath: outputDir,
      });
      break;
    }

    const item = items[i];

    // Determine output extension and format
    const origExt = path.extname(item.fileName).toLowerCase();
    const baseName = path.basename(item.fileName, origExt);

    let targetExt = origExt;
    const formatSetting = exportSettings.outputFormat;
    const quality = Math.max(1, Math.min(100, exportSettings.quality || 90));

    if (formatSetting === 'jpeg') {
      targetExt = '.jpg';
    } else if (formatSetting === 'png') {
      targetExt = '.png';
    } else if (formatSetting === 'webp') {
      targetExt = '.webp';
    } else {
      // 'original' format
      if (origExt === '.png') {
        targetExt = '.png';
      } else if (origExt === '.webp') {
        targetExt = '.webp';
      } else {
        targetExt = '.jpg';
      }
    }

    const prefix = exportSettings.prefix || '';
    const suffix = exportSettings.suffix || '';
    const finalFileName = `${prefix}${baseName}${suffix}${targetExt}`;
    const destinationPath = path.join(outputDir, finalFileName);

    onProgress({
      currentIndex: i + 1,
      totalImages: total,
      currentFileName: item.fileName,
      savingFileName: finalFileName,
      thumbnailUrl: item.thumbnailUrl,
      destinationPath: destinationPath,
      progressPercent: Math.round(((i) / total) * 100),
      status: 'processing',
      outputPath: outputDir,
    });

    let tmpIccPath: string | null = null;
    try {
      const { pipeline, origMetadata } = await buildProcessedImage(
        item.filePath,
        aspectSettings,
        watermarkSettings
      );

      // Preserve embedded ICC profile and essential color metadata
      try {
        if (Buffer.isBuffer(origMetadata?.icc)) {
          // Sharp expects a filepath or profile name string for icc, so write the raw buffer to a temp profile file
          tmpIccPath = path.join(os.tmpdir(), `photoframer_icc_${Date.now()}_${i}.icc`);
          await fs.writeFile(tmpIccPath, origMetadata.icc);
          pipeline.withMetadata({ icc: tmpIccPath });
        } else if (typeof origMetadata?.icc === 'string') {
          pipeline.withMetadata({ icc: origMetadata.icc });
        } else {
          pipeline.withMetadata();
        }
      } catch (iccErr) {
        console.warn(`Could not attach custom ICC profile for ${item.fileName}, falling back to default sRGB:`, iccErr);
        pipeline.withMetadata();
      }

      if (formatSetting === 'jpeg') {
        pipeline.jpeg({
          quality,
          mozjpeg: true,
          chromaSubsampling: quality >= 90 ? '4:4:4' : '4:2:0',
        });
      } else if (formatSetting === 'png') {
        pipeline.png({ compressionLevel: 9 });
      } else if (formatSetting === 'webp') {
        pipeline.webp({ quality, lossless: quality === 100 });
      } else {
        // 'original' format
        if (origExt === '.png') {
          pipeline.png({ compressionLevel: 9 });
        } else if (origExt === '.webp') {
          pipeline.webp({ quality, lossless: quality === 100 });
        } else {
          pipeline.jpeg({
            quality,
            mozjpeg: true,
            chromaSubsampling: quality >= 90 ? '4:4:4' : '4:2:0',
          });
        }
      }

      await pipeline.toFile(destinationPath);
      successCount++;
    } catch (err: any) {
      console.error(`Error processing file ${item.fileName}:`, err);
      errors.push({
        fileName: item.fileName,
        error: err?.message || 'Processing failed',
      });
    } finally {
      if (tmpIccPath) {
        await fs.unlink(tmpIccPath).catch(() => {});
      }
    }

    onProgress({
      currentIndex: i + 1,
      totalImages: total,
      currentFileName: item.fileName,
      savingFileName: finalFileName,
      thumbnailUrl: item.thumbnailUrl,
      destinationPath: destinationPath,
      progressPercent: Math.round(((i + 1) / total) * 100),
      status: i + 1 === total ? 'completed' : 'processing',
      outputPath: outputDir,
    });
  }

  return {
    totalProcessed: total,
    successCount,
    errorCount: errors.length,
    outputFolder: outputDir,
    errors,
  };
}
