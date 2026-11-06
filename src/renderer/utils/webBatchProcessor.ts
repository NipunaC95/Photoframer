import JSZip from 'jszip';
import {
  SourceImageItem,
  AspectSettings,
  WatermarkSettings,
  ExportSettings,
  BatchProgressPayload,
  ProcessBatchResult,
} from '../types';
import { calculateClientCanvasDimensions, drawCoverImage } from './canvasRenderer';

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from source`));
    img.src = src;
  });
}

export async function processBatchWeb(payload: {
  items: SourceImageItem[];
  aspectSettings: AspectSettings;
  watermarkSettings: WatermarkSettings;
  watermarkImg: HTMLImageElement | null;
  exportSettings: ExportSettings;
  onProgress: (progress: BatchProgressPayload) => void;
  checkCancelled: () => boolean;
}): Promise<ProcessBatchResult> {
  const {
    items,
    aspectSettings,
    watermarkSettings,
    watermarkImg,
    exportSettings,
    onProgress,
    checkCancelled,
  } = payload;

  const total = items.length;
  let successCount = 0;
  const errors: Array<{ fileName: string; error: string }> = [];
  const zip = new JSZip();

  for (let i = 0; i < total; i++) {
    if (checkCancelled()) {
      onProgress({
        currentIndex: i,
        totalImages: total,
        currentFileName: items[i]?.fileName || '',
        progressPercent: Math.round((i / total) * 100),
        status: 'cancelled',
        outputPath: 'Downloads (Cancelled)',
      });
      return {
        totalProcessed: i,
        successCount,
        errorCount: errors.length,
        outputFolder: 'Downloads (Cancelled)',
        errors,
      };
    }

    const item = items[i];

    // Determine target format & extension
    const dotIndex = item.fileName.lastIndexOf('.');
    const origExt = dotIndex !== -1 ? item.fileName.slice(dotIndex).toLowerCase() : '';
    const baseName = dotIndex !== -1 ? item.fileName.slice(0, dotIndex) : item.fileName;

    let targetExt = origExt || '.jpg';
    let mimeType = 'image/jpeg';
    const qualityNum = Math.max(1, Math.min(100, exportSettings.quality || 90));
    let quality = qualityNum / 100;

    const formatSetting = exportSettings.outputFormat;
    if (formatSetting === 'jpeg') {
      targetExt = '.jpg';
      mimeType = 'image/jpeg';
    } else if (formatSetting === 'png') {
      targetExt = '.png';
      mimeType = 'image/png';
      quality = 1.0;
    } else if (formatSetting === 'webp') {
      targetExt = '.webp';
      mimeType = 'image/webp';
    } else {
      // 'original' format
      if (origExt === '.png') {
        targetExt = '.png';
        mimeType = 'image/png';
        quality = 1.0;
      } else if (origExt === '.webp') {
        targetExt = '.webp';
        mimeType = 'image/webp';
      } else {
        targetExt = '.jpg';
        mimeType = 'image/jpeg';
      }
    }

    const prefix = exportSettings.prefix || '';
    const suffix = exportSettings.suffix || '';
    const finalFileName = `${prefix}${baseName}${suffix}${targetExt}`;

    onProgress({
      currentIndex: i + 1,
      totalImages: total,
      currentFileName: item.fileName,
      savingFileName: finalFileName,
      thumbnailUrl: item.thumbnailUrl,
      destinationPath: `ZIP Archive / ${finalFileName}`,
      progressPercent: Math.round((i / total) * 100),
      status: 'processing',
      outputPath: 'Downloads (ZIP Archive)',
    });

    try {
      // 1. Load full resolution image
      const imgSrc = item.rawFile ? URL.createObjectURL(item.rawFile) : item.thumbnailUrl || item.filePath;
      const img = await loadImage(imgSrc);

      // 2. Compute non-destructive dimensions
      const origW = img.naturalWidth;
      const origH = img.naturalHeight;
      const dims = calculateClientCanvasDimensions(origW, origH, aspectSettings);

      // 3. Create full resolution offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = dims.canvasWidth;
      canvas.height = dims.canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not obtain canvas 2D rendering context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 4. Background fill
      if (aspectSettings.backgroundMode === 'blur') {
        ctx.save();
        const blurPx = Math.max(8, aspectSettings.blurSigma || 28);
        ctx.filter = `blur(${blurPx}px)`;
        ctx.translate(dims.canvasWidth / 2, dims.canvasHeight / 2);
        ctx.scale(1.08, 1.08);
        ctx.translate(-dims.canvasWidth / 2, -dims.canvasHeight / 2);
        drawCoverImage(ctx, img, dims.canvasWidth, dims.canvasHeight);
        ctx.restore();
        ctx.filter = 'none';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, dims.canvasWidth, dims.canvasHeight);
      } else {
        ctx.fillStyle = aspectSettings.solidColor || '#000000';
        ctx.fillRect(0, 0, dims.canvasWidth, dims.canvasHeight);
      }

      // 5. Draw centered original image
      ctx.drawImage(img, dims.imageTargetX, dims.imageTargetY, origW, origH);

      // 6. Watermark compositor
      if (
        watermarkSettings.enabled &&
        watermarkImg &&
        watermarkImg.complete &&
        watermarkImg.naturalWidth > 0
      ) {
        const wmOrigW = watermarkImg.naturalWidth;
        const wmOrigH = watermarkImg.naturalHeight;

        const sizePct = Math.max(5, Math.min(50, watermarkSettings.sizePercent || 15));
        const targetWmW = Math.max(16, Math.round(dims.canvasWidth * (sizePct / 100)));
        const targetWmH = Math.max(16, Math.round(targetWmW * (wmOrigH / wmOrigW)));

        const marginPct = Math.max(0, Math.min(20, watermarkSettings.marginPercent ?? 4));
        const marginPx = Math.round(dims.canvasWidth * (marginPct / 100));

        let left = marginPx;
        let top = marginPx;

        switch (watermarkSettings.anchor) {
          case 'top-left':
            left = marginPx;
            top = marginPx;
            break;
          case 'top-center':
            left = Math.round((dims.canvasWidth - targetWmW) / 2);
            top = marginPx;
            break;
          case 'top-right':
            left = dims.canvasWidth - targetWmW - marginPx;
            top = marginPx;
            break;
          case 'middle-left':
            left = marginPx;
            top = Math.round((dims.canvasHeight - targetWmH) / 2);
            break;
          case 'center':
            left = Math.round((dims.canvasWidth - targetWmW) / 2);
            top = Math.round((dims.canvasHeight - targetWmH) / 2);
            break;
          case 'middle-right':
            left = dims.canvasWidth - targetWmW - marginPx;
            top = Math.round((dims.canvasHeight - targetWmH) / 2);
            break;
          case 'bottom-left':
            left = marginPx;
            top = dims.canvasHeight - targetWmH - marginPx;
            break;
          case 'bottom-center':
            left = Math.round((dims.canvasWidth - targetWmW) / 2);
            top = dims.canvasHeight - targetWmH - marginPx;
            break;
          case 'bottom-right':
            left = dims.canvasWidth - targetWmW - marginPx;
            top = dims.canvasHeight - targetWmH - marginPx;
            break;
        }

        left = Math.max(0, Math.min(dims.canvasWidth - targetWmW, left));
        top = Math.max(0, Math.min(dims.canvasHeight - targetWmH, top));

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1.0, watermarkSettings.opacity ?? 0.8));
        ctx.drawImage(watermarkImg, left, top, targetWmW, targetWmH);
        ctx.restore();
      }

      // 7. Export blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas blob export failed'))),
          mimeType,
          quality
        );
      });

      zip.file(finalFileName, blob);
      successCount++;

      // Revoke temporary object URL if created
      if (item.rawFile) {
        URL.revokeObjectURL(imgSrc);
      }
    } catch (err: any) {
      console.error('Error processing item in web mode:', item.fileName, err);
      errors.push({
        fileName: item.fileName,
        error: err.message || 'Processing failed',
      });
    }

    onProgress({
      currentIndex: i + 1,
      totalImages: total,
      currentFileName: item.fileName,
      savingFileName: finalFileName,
      thumbnailUrl: item.thumbnailUrl,
      destinationPath: `ZIP Archive / ${finalFileName}`,
      progressPercent: Math.round(((i + 1) / total) * 100),
      status: i + 1 === total ? 'completed' : 'processing',
      outputPath: 'Downloads (ZIP Archive)',
    });
  }

  // 8. Bundle ZIP archive and trigger browser download
  let zipBlob: Blob | undefined;
  if (successCount > 0) {
    zipBlob = await zip.generateAsync({ type: 'blob' });
    const dateStr = new Date().toISOString().slice(0, 10);
    const zipName = `photoframer-batch-${dateStr}.zip`;
    triggerBlobDownload(zipBlob, zipName);
  }

  return {
    totalProcessed: total,
    successCount,
    errorCount: errors.length,
    outputFolder: 'Downloads (ZIP Archive)',
    errors,
  };
}

