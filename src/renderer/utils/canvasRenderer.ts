import { AspectSettings, WatermarkSettings, CanvasDimensions } from '../types';

export function calculateClientCanvasDimensions(
  origWidth: number,
  origHeight: number,
  settings: AspectSettings
): CanvasDimensions {
  let targetRatio = 1.0;
  switch (settings.preset) {
    case '1:1':
      targetRatio = 1.0;
      break;
    case '4:5':
      targetRatio = 4 / 5;
      break;
    case '9:16':
      targetRatio = 9 / 16;
      break;
    case '16:9':
      targetRatio = 16 / 9;
      break;
    case 'custom': {
      const w = Math.max(1, settings.customWidth || 1);
      const h = Math.max(1, settings.customHeight || 1);
      targetRatio = w / h;
      break;
    }
  }

  const origRatio = origWidth / origHeight;
  let canvasWidth = origWidth;
  let canvasHeight = origHeight;
  let imageTargetX = 0;
  let imageTargetY = 0;

  const EPSILON = 0.0001;

  if (Math.abs(origRatio - targetRatio) < EPSILON) {
    canvasWidth = origWidth;
    canvasHeight = origHeight;
  } else if (origRatio > targetRatio) {
    // Letterbox (vertical padding)
    canvasWidth = origWidth;
    canvasHeight = Math.round(canvasWidth / targetRatio);
    imageTargetY = Math.round((canvasHeight - origHeight) / 2);
  } else {
    // Pillarbox (horizontal padding)
    canvasHeight = origHeight;
    canvasWidth = Math.round(canvasHeight * targetRatio);
    imageTargetX = Math.round((canvasWidth - origWidth) / 2);
  }

  return {
    canvasWidth,
    canvasHeight,
    imageTargetX,
    imageTargetY,
    imageTargetWidth: origWidth,
    imageTargetHeight: origHeight,
    scale: 1,
  };
}

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = targetWidth / targetHeight;

  let renderWidth = targetWidth;
  let renderHeight = targetHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imgRatio > targetRatio) {
    renderHeight = targetHeight;
    renderWidth = targetHeight * imgRatio;
    offsetX = (targetWidth - renderWidth) / 2;
  } else {
    renderWidth = targetWidth;
    renderHeight = targetWidth / imgRatio;
    offsetY = (targetHeight - renderHeight) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
}

export function renderPreviewToCanvas(
  canvas: HTMLCanvasElement,
  sourceImg: HTMLImageElement,
  watermarkImg: HTMLImageElement | null,
  aspectSettings: AspectSettings,
  watermarkSettings: WatermarkSettings
): CanvasDimensions {
  const origW = sourceImg.naturalWidth || 800;
  const origH = sourceImg.naturalHeight || 600;

  const dims = calculateClientCanvasDimensions(origW, origH, aspectSettings);
  const { canvasWidth, canvasHeight, imageTargetX, imageTargetY } = dims;

  // Set internal resolution of canvas
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return dims;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Background fill
  if (aspectSettings.backgroundMode === 'blur') {
    ctx.save();
    // Use canvas CSS filter for blur
    ctx.filter = 'blur(28px)';
    // Scale slightly by 1.08 to prevent edge-bleeding caused by canvas blur
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(1.08, 1.08);
    ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
    drawCoverImage(ctx, sourceImg, canvasWidth, canvasHeight);
    ctx.restore();
    ctx.filter = 'none';

    // Subtle dark tint over blur for contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
    // Solid color fill
    ctx.fillStyle = aspectSettings.solidColor || '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // 2. Centered original image
  ctx.drawImage(sourceImg, imageTargetX, imageTargetY, origW, origH);

  // 3. Watermark
  if (watermarkSettings.enabled && watermarkImg && watermarkImg.complete && watermarkImg.naturalWidth > 0) {
    const wmOrigW = watermarkImg.naturalWidth;
    const wmOrigH = watermarkImg.naturalHeight;

    const sizePct = Math.max(5, Math.min(50, watermarkSettings.sizePercent || 15));
    const targetWmW = Math.max(16, Math.round(canvasWidth * (sizePct / 100)));
    const targetWmH = Math.max(16, Math.round(targetWmW * (wmOrigH / wmOrigW)));

    const marginPct = Math.max(0, Math.min(20, watermarkSettings.marginPercent ?? 4));
    const marginPx = Math.round(canvasWidth * (marginPct / 100));

    let left = marginPx;
    let top = marginPx;

    switch (watermarkSettings.anchor) {
      case 'top-left':
        left = marginPx;
        top = marginPx;
        break;
      case 'top-center':
        left = Math.round((canvasWidth - targetWmW) / 2);
        top = marginPx;
        break;
      case 'top-right':
        left = canvasWidth - targetWmW - marginPx;
        top = marginPx;
        break;
      case 'middle-left':
        left = marginPx;
        top = Math.round((canvasHeight - targetWmH) / 2);
        break;
      case 'center':
        left = Math.round((canvasWidth - targetWmW) / 2);
        top = Math.round((canvasHeight - targetWmH) / 2);
        break;
      case 'middle-right':
        left = canvasWidth - targetWmW - marginPx;
        top = Math.round((canvasHeight - targetWmH) / 2);
        break;
      case 'bottom-left':
        left = marginPx;
        top = canvasHeight - targetWmH - marginPx;
        break;
      case 'bottom-center':
        left = Math.round((canvasWidth - targetWmW) / 2);
        top = canvasHeight - targetWmH - marginPx;
        break;
      case 'bottom-right':
        left = canvasWidth - targetWmW - marginPx;
        top = canvasHeight - targetWmH - marginPx;
        break;
    }

    left = Math.max(0, Math.min(canvasWidth - targetWmW, left));
    top = Math.max(0, Math.min(canvasHeight - targetWmH, top));

    ctx.save();
    ctx.globalAlpha = Math.max(0.1, Math.min(1.0, watermarkSettings.opacity ?? 0.8));
    ctx.drawImage(watermarkImg, left, top, targetWmW, targetWmH);
    ctx.restore();
  }

  return dims;
}
