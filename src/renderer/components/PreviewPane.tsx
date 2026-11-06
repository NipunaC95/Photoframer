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
        amount: `+${diffW}px width padding`,
        badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      };
    }
    if (diffH > 0 && diffW === 0) {
      return {
        type: 'Letterbox',
        amount: `+${diffH}px height padding`,
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
    }
    return {
      type: 'Exact Ratio',
      amount: 'No padding needed',
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    };
  };

  const paddingInfo = getPaddingInfo();

  return (
    <main className="flex-1 h-full bg-[var(--bg-base)] flex flex-col relative overflow-hidden select-none">
      {/* Top Preview Status Bar */}
      <div className="h-11 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">
              {selectedItem ? selectedItem.fileName : 'No file selected'}
            </span>
          </div>

          {dimensions && (
            <>
              <span className="text-[var(--text-muted)]">•</span>
              <div className="flex items-center space-x-1.5 text-xs font-mono">
                <span className="text-gray-400">
                  {formatDimensions(selectedItem!.width, selectedItem!.height)}
                </span>
                <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                <span className="text-cyan-400 font-semibold">
                  {formatDimensions(dimensions.canvasWidth, dimensions.canvasHeight)}
                </span>
              </div>
            </>
          )}

          {paddingInfo && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${paddingInfo.badgeClass}`}
            >
              {paddingInfo.type} ({paddingInfo.amount})
            </span>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-1.5">
          {selectedItem && (
            <button
              onMouseDown={() => setIsShowingOriginal(true)}
              onMouseUp={() => setIsShowingOriginal(false)}
              onMouseLeave={() => setIsShowingOriginal(false)}
              title="Hold to preview original unpadded image"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors border ${
                isShowingOriginal
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
              }`}
            >
              {isShowingOriginal ? (
                <>
                  <EyeOff className="w-3 h-3 text-amber-400" />
                  <span>Original (Holding)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Hold for Original</span>
                </>
              )}
            </button>
          )}

          <div className="h-4 w-px bg-[var(--border-subtle)] mx-1" />

          <button
            onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.25))}
            title="Zoom out"
            className="p-1.5 rounded hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-[var(--text-muted)] w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
            title="Zoom in"
            className="p-1.5 rounded hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            title="Reset fit"
            className="p-1.5 rounded hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
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
              transition: 'transform 0.15s ease-out',
            }}
            className="max-w-full max-h-full flex items-center justify-center relative shadow-surface-lg rounded-sm overflow-hidden ring-1 ring-white/10"
          >
            <canvas
              ref={canvasRef}
              className="max-w-[70vw] max-h-[70vh] object-contain block"
            />

            {isImageLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 max-w-sm rounded-2xl bg-[var(--bg-panel)]/80 backdrop-blur-sm border border-[var(--border-subtle)] shadow-surface-md">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              No Image Selected
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Add source images to the left sidebar queue and click one to configure real-time aspect padding and watermark overlays.
            </p>
          </div>
        )}
      </div>

      {/* Floating Canvas Meta Badge */}
      {dimensions && (
        <div className="absolute bottom-4 left-4 bg-[var(--bg-panel)]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[11px] font-mono flex items-center space-x-3 text-[var(--text-secondary)] shadow-surface-md pointer-events-none">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Target:</span>
            <strong className="text-[var(--text-primary)]">
              {aspectSettings.preset === 'custom'
                ? `${aspectSettings.customWidth}:${aspectSettings.customHeight}`
                : aspectSettings.preset}
            </strong>
          </div>
          <span>•</span>
          <div>
            Fill:{' '}
            <strong className="text-[var(--text-primary)] capitalize">
              {aspectSettings.backgroundMode === 'blur' ? 'Blurred Bokeh' : aspectSettings.solidColor}
            </strong>
          </div>
          {watermarkSettings.enabled && (
            <>
              <span>•</span>
              <div>
                Watermark:{' '}
                <strong className="text-cyan-400 capitalize">
                  {watermarkSettings.anchor.replace('-', ' ')} ({watermarkSettings.sizePercent}%)
                </strong>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
};
