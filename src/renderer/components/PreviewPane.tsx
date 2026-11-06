import React, { useRef, useEffect, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { SourceImageItem, AspectSettings, WatermarkSettings, CanvasDimensions } from '../types';
import { renderPreviewToCanvas, calculateClientCanvasDimensions } from '../utils/canvasRenderer';
import { formatDimensions } from '../utils/formatters';

interface PreviewPaneProps {
  selectedItem: SourceImageItem | null;
  aspectSettings: AspectSettings;
  watermarkSettings: WatermarkSettings;
  watermarkImg: HTMLImageElement | null;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  selectedItem,
  aspectSettings,
  watermarkSettings,
  watermarkImg,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState<CanvasDimensions | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isShowingOriginal, setIsShowingOriginal] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);

  // Load the active source image into an HTMLImageElement
  useEffect(() => {
    if (!selectedItem) {
      setSourceImg(null);
      setDimensions(null);
      return;
    }

    setIsImageLoading(true);
    const img = new Image();

    // In Electron, we can load via app-img:// protocol or data URL thumbnail or file://
    // Using app-img:// with normalized windows/posix path:
    const safeSrc = `app-img://${encodeURIComponent(selectedItem.filePath.replace(/\\/g, '/'))}`;
    img.src = safeSrc;

    img.onload = () => {
      setSourceImg(img);
      setIsImageLoading(false);
    };

    img.onerror = () => {
      // Fallback: If custom protocol fails, try thumbnail or direct path
      if (selectedItem.thumbnailUrl) {
        img.src = selectedItem.thumbnailUrl;
      }
      setIsImageLoading(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [selectedItem?.filePath]);

  // Real-time render loop whenever settings, source image, or watermark changes
  useEffect(() => {
    if (!canvasRef.current || !sourceImg) return;

    if (isShowingOriginal) {
      // Just render original image on canvas
      const canvas = canvasRef.current;
      canvas.width = sourceImg.naturalWidth;
      canvas.height = sourceImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sourceImg, 0, 0);
      }
      setDimensions({
        canvasWidth: sourceImg.naturalWidth,
        canvasHeight: sourceImg.naturalHeight,
        imageTargetX: 0,
        imageTargetY: 0,
        imageTargetWidth: sourceImg.naturalWidth,
        imageTargetHeight: sourceImg.naturalHeight,
        scale: 1,
      });
      return;
    }

    // Render non-destructive padded canvas with background and watermark
    const dims = renderPreviewToCanvas(
      canvasRef.current,
      sourceImg,
      watermarkImg,
      aspectSettings,
      watermarkSettings
    );

    setDimensions(dims);
  }, [sourceImg, watermarkImg, aspectSettings, watermarkSettings, isShowingOriginal]);

  // Compute padding type & stats
  const getPaddingInfo = () => {
    if (!dimensions || !sourceImg) return null;
    const diffW = dimensions.canvasWidth - sourceImg.naturalWidth;
    const diffH = dimensions.canvasHeight - sourceImg.naturalHeight;

    if (diffW > 0 && diffH === 0) {
      return {
        type: 'Pillarbox',
        amount: `+${diffW}px width`,
        badgeClass: 'bg-[var(--chip-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
      };
    }
    if (diffH > 0 && diffW === 0) {
      return {
        type: 'Letterbox',
        amount: `+${diffH}px height`,
        badgeClass: 'bg-[var(--chip-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
      };
    }
    return {
      type: '1:1 Match',
      amount: 'No padding',
      badgeClass: 'bg-[var(--peak)]/10 text-[var(--peak)] border-[var(--peak)]/20',
    };
  };

  const paddingInfo = getPaddingInfo();

  return (
    <main className="flex-1 h-full bg-[var(--bg-base)] flex flex-col relative overflow-hidden select-none">
      {/* Top Preview Status Bar */}
      <div className="h-11 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-[var(--text-secondary)]">
            <span className="font-semibold tracking-tight text-[var(--text-primary)]">
              {selectedItem ? selectedItem.fileName : 'No photo selected'}
            </span>
          </div>

          {dimensions && (
            <>
              <span className="text-[var(--text-muted)]">•</span>
              <div className="flex items-center space-x-1.5 text-xs font-mono tabular-nums">
                <span className="text-[var(--text-muted)]">
                  {formatDimensions(selectedItem!.width, selectedItem!.height)}
                </span>
                <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                <span className="text-[var(--text-primary)] font-semibold">
                  {formatDimensions(dimensions.canvasWidth, dimensions.canvasHeight)}
                </span>
              </div>
            </>
          )}

          {paddingInfo && (
            <span
              className={`text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border ${paddingInfo.badgeClass}`}
            >
              {paddingInfo.type} ({paddingInfo.amount})
            </span>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          {selectedItem && (
            <button
              onMouseDown={() => setIsShowingOriginal(true)}
              onMouseUp={() => setIsShowingOriginal(false)}
              onMouseLeave={() => setIsShowingOriginal(false)}
              title="Hold to preview original unpadded image"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                isShowingOriginal
                  ? 'bg-[var(--brand-accent)] text-[var(--bg-base)] border-transparent'
                  : 'bg-[var(--chip-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] border-[var(--border-subtle)]'
              }`}
            >
              {isShowingOriginal ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>Original (Holding)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>Hold for Original</span>
                </>
              )}
            </button>
          )}

          {/* Zoom Group */}
          <div className="flex items-center rounded-lg bg-[var(--chip-surface)] border border-[var(--border-subtle)] p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.25))}
              title="Zoom out"
              className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              title="Zoom in"
              className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Reset fit"
              className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-0.5 border-l border-[var(--border-subtle)] pl-1"
            >
              <Maximize className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full p-8 flex items-center justify-center overflow-auto checkerboard-pattern relative"
      >
        {selectedItem ? (
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="max-w-full max-h-full flex items-center justify-center relative shadow-patensify-lg rounded-lg overflow-hidden ring-1 ring-white/10 dark:ring-white/10"
          >
            <canvas
              ref={canvasRef}
              className="max-w-[70vw] max-h-[70vh] object-contain block rounded-lg"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-[var(--chip-surface)] border border-[var(--border-subtle)] flex items-center justify-center mb-3 text-[var(--text-muted)]">
              <ImageIcon className="w-5 h-5 stroke-[1.8]" />
            </div>
            <p className="text-xs font-semibold tracking-tight text-[var(--text-primary)] mb-1">
              No Photo Selected
            </p>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-sans">
              Choose an image from the queue to inspect real-time aspect framing and watermark adjustments.
            </p>
          </div>
        )}
      </div>

      {/* Floating Canvas Meta Badge */}
      {dimensions && selectedItem && (
        <div className="absolute bottom-4 left-4 bg-[var(--bg-panel)]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[var(--border-subtle)] text-[11px] font-mono tabular-nums flex items-center space-x-3 text-[var(--text-secondary)] shadow-patensify-md pointer-events-none">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--peak)]"></span>
            <span className="text-[var(--text-muted)]">Target:</span>
            <span className="text-[var(--text-primary)] font-semibold">
              {aspectSettings.preset === 'custom'
                ? `${aspectSettings.customWidth}:${aspectSettings.customHeight}`
                : aspectSettings.preset}
            </span>
          </div>
          <span className="text-[var(--border-strong)]">•</span>
          <div>
            <span className="text-[var(--text-muted)]">Fill:</span>{' '}
            <span className="text-[var(--text-primary)] capitalize font-semibold">
              {aspectSettings.backgroundMode === 'blur' ? 'Bokeh' : aspectSettings.solidColor}
            </span>
          </div>
          {watermarkSettings.enabled && (
            <>
              <span className="text-[var(--border-strong)]">•</span>
              <div>
                <span className="text-[var(--text-muted)]">Logo:</span>{' '}
                <span className="text-[var(--text-primary)] capitalize font-semibold">
                  {watermarkSettings.anchor.replace('-', ' ')} ({watermarkSettings.sizePercent}%)
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
};
