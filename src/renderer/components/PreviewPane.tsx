import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { SourceImageItem, AspectSettings, WatermarkSettings, CanvasDimensions } from '../types';
import { renderPreviewToCanvas } from '../utils/canvasRenderer';
import { formatDimensions } from '../utils/formatters';

interface PreviewPaneProps {
  selectedItem: SourceImageItem | null;
  aspectSettings: AspectSettings;
  watermarkSettings: WatermarkSettings;
  watermarkImg: HTMLImageElement | null;
  isLeftCollapsed?: boolean;
  isRightCollapsed?: boolean;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  selectedItem,
  aspectSettings,
  watermarkSettings,
  watermarkImg,
  isLeftCollapsed = false,
  isRightCollapsed = false,
  onToggleLeft,
  onToggleRight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState<CanvasDimensions | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isShowingOriginal, setIsShowingOriginal] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Track preview container dimensions dynamically with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setViewportSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setViewportSize({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Reset zoom to 100% Fit when photo selection changes
  useEffect(() => {
    setZoomLevel(1);
  }, [selectedItem?.id]);

  // Load the active source image into an HTMLImageElement
  useEffect(() => {
    if (!selectedItem) {
      setSourceImg(null);
      setDimensions(null);
      return;
    }

    setIsImageLoading(true);
    const img = new Image();

    // Use app-img://image?path= with encodeURIComponent to safely transport full local paths
    const safeSrc = `app-img://image?path=${encodeURIComponent(selectedItem.filePath)}`;
    img.src = safeSrc;

    img.onload = () => {
      setSourceImg(img);
      setIsImageLoading(false);
    };

    img.onerror = () => {
      // Fallback: If custom protocol fails, try thumbnail
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
      // Render original image on canvas buffer (capped to 2048 for high density 60fps)
      const origW = selectedItem?.width || sourceImg.naturalWidth || 800;
      const origH = selectedItem?.height || sourceImg.naturalHeight || 600;
      const maxDim = 2048;
      const scale = Math.min(1, maxDim / Math.max(origW, origH));

      const canvas = canvasRef.current;
      canvas.width = Math.round(origW * scale);
      canvas.height = Math.round(origH * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (sourceImg.complete && sourceImg.naturalWidth > 0) {
          ctx.drawImage(sourceImg, 0, 0, canvas.width, canvas.height);
        }
      }
      setDimensions({
        canvasWidth: origW,
        canvasHeight: origH,
        imageTargetX: 0,
        imageTargetY: 0,
        imageTargetWidth: origW,
        imageTargetHeight: origH,
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
      watermarkSettings,
      selectedItem ? { width: selectedItem.width, height: selectedItem.height } : undefined
    );

    setDimensions(dims);
  }, [sourceImg, watermarkImg, aspectSettings, watermarkSettings, isShowingOriginal, selectedItem]);

  // Dynamically calculate fitted CSS display dimensions to fill available container
  const fittedDimensions = useMemo(() => {
    if (!dimensions || viewportSize.width <= 0 || viewportSize.height <= 0) {
      return null;
    }

    // Allow generous filling (leave modest 20-28px margins around preview)
    const paddingX = Math.max(16, Math.min(28, Math.round(viewportSize.width * 0.035)));
    const paddingY = Math.max(16, Math.min(28, Math.round(viewportSize.height * 0.035)));
    const maxW = Math.max(120, viewportSize.width - paddingX * 2);
    const maxH = Math.max(120, viewportSize.height - paddingY * 2);

    const aspect = dimensions.canvasWidth / dimensions.canvasHeight;
    let baseW = maxW;
    let baseH = Math.round(baseW / aspect);

    if (baseH > maxH) {
      baseH = maxH;
      baseW = Math.round(baseH * aspect);
    }

    return {
      baseWidth: baseW,
      baseHeight: baseH,
      displayWidth: Math.round(baseW * zoomLevel),
      displayHeight: Math.round(baseH * zoomLevel),
    };
  }, [dimensions, viewportSize, zoomLevel]);

  // Support Ctrl/Cmd + Wheel to zoom smoothly
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoomLevel((z) => Math.min(3, Math.max(0.25, parseFloat((z + delta).toFixed(2)))));
    }
  };

  // Compute padding type & stats
  const getPaddingInfo = () => {
    if (!dimensions || !selectedItem) return null;
    const diffW = dimensions.canvasWidth - selectedItem.width;
    const diffH = dimensions.canvasHeight - selectedItem.height;

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

  // Focus mode toggle (collapses or restores both sidebars together)
  const isBothCollapsed = isLeftCollapsed && isRightCollapsed;
  const handleToggleFocus = () => {
    if (isBothCollapsed) {
      onToggleLeft?.();
      onToggleRight?.();
    } else {
      if (!isLeftCollapsed) onToggleLeft?.();
      if (!isRightCollapsed) onToggleRight?.();
    }
  };

  return (
    <main className="flex-1 h-full bg-[var(--bg-base)] flex flex-col relative overflow-hidden select-none min-w-0 min-h-0">
      {/* Top Preview Status Bar */}
      <div className="h-11 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 sm:px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs min-w-0">
          {/* Toggle Left Sidebar */}
          {onToggleLeft && (
            <button
              onClick={onToggleLeft}
              title={isLeftCollapsed ? 'Show queue sidebar' : 'Hide queue sidebar'}
              className={`p-1.5 rounded-lg border transition-all text-xs flex items-center space-x-1.5 ${
                isLeftCollapsed
                  ? 'bg-[var(--chip-surface)] text-[var(--peak)] border-[var(--peak)]/30 hover:border-[var(--peak)]/60'
                  : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent hover:border-[var(--border-subtle)]'
              }`}
            >
              {isLeftCollapsed ? (
                <PanelLeftOpen className="w-3.5 h-3.5" />
              ) : (
                <PanelLeftClose className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <div className="flex items-center space-x-1.5 text-[var(--text-secondary)] truncate">
            <span className="font-semibold tracking-tight text-[var(--text-primary)] truncate max-w-[160px] sm:max-w-[240px]">
              {selectedItem ? selectedItem.fileName : 'No photo selected'}
            </span>
          </div>

          {dimensions && selectedItem && (
            <>
              <span className="text-[var(--text-muted)] hidden sm:inline">•</span>
              <div className="hidden sm:flex items-center space-x-1.5 text-xs font-mono tabular-nums">
                <span className="text-[var(--text-muted)]">
                  {formatDimensions(selectedItem.width, selectedItem.height)}
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
              className={`hidden md:inline-flex text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border ${paddingInfo.badgeClass}`}
            >
              {paddingInfo.type} ({paddingInfo.amount})
            </span>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {selectedItem && (
            <button
              onMouseDown={() => setIsShowingOriginal(true)}
              onMouseUp={() => setIsShowingOriginal(false)}
              onMouseLeave={() => setIsShowingOriginal(false)}
              title="Hold to preview original unpadded image"
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-all border ${
                isShowingOriginal
                  ? 'bg-white text-black font-semibold border-transparent'
                  : 'bg-[var(--chip-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] border-[var(--border-subtle)]'
              }`}
            >
              {isShowingOriginal ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Original</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="hidden sm:inline">Hold Original</span>
                </>
              )}
            </button>
          )}

          {/* Zoom Group */}
          <div className="flex items-center rounded-lg bg-[var(--chip-surface)] border border-[var(--border-subtle)] p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))))}
              title="Zoom out"
              className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Click to reset fit (100%)"
              className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1 sm:px-1.5 transition-colors"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))))}
              title="Zoom in"
              className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Fit to viewport"
              className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-0.5 border-l border-[var(--border-subtle)] pl-1"
            >
              <Maximize className="w-3 h-3" />
            </button>
          </div>

          {/* Focus Mode (cinema view) */}
          <button
            onClick={handleToggleFocus}
            title={isBothCollapsed ? 'Exit focus mode' : 'Focus preview (collapse sidebars)'}
            className={`p-1.5 rounded-lg border transition-all text-xs flex items-center ${
              isBothCollapsed
                ? 'bg-white text-black font-semibold border-transparent'
                : 'bg-[var(--chip-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] border-[var(--border-subtle)]'
            }`}
          >
            {isBothCollapsed ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Toggle Right Sidebar */}
          {onToggleRight && (
            <button
              onClick={onToggleRight}
              title={isRightCollapsed ? 'Show settings sidebar' : 'Hide settings sidebar'}
              className={`p-1.5 rounded-lg border transition-all text-xs flex items-center space-x-1.5 ${
                isRightCollapsed
                  ? 'bg-[var(--chip-surface)] text-[var(--peak)] border-[var(--peak)]/30 hover:border-[var(--peak)]/60'
                  : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent hover:border-[var(--border-subtle)]'
              }`}
            >
              {isRightCollapsed ? (
                <PanelRightOpen className="w-3.5 h-3.5" />
              ) : (
                <PanelRightClose className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="flex-1 w-full h-full p-3 sm:p-4 flex items-center justify-center overflow-auto checkerboard-pattern relative min-w-0 min-h-0"
      >
        {selectedItem ? (
          <div
            style={{
              width: fittedDimensions ? `${fittedDimensions.displayWidth}px` : 'auto',
              height: fittedDimensions ? `${fittedDimensions.displayHeight}px` : 'auto',
              transition: 'width 0.12s cubic-bezier(0.16, 1, 0.3, 1), height 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="flex items-center justify-center relative shadow-patensify-xl rounded-lg overflow-hidden border border-white/10 dark:border-white/10 shrink-0"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block rounded-lg select-none"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            {isImageLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                <div className="flex items-center space-x-2 text-xs text-white bg-black/80 px-3 py-1.5 rounded-full border border-white/15 shadow-patensify-md">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Loading full resolution...</span>
                </div>
              </div>
            )}
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
        <div className="absolute bottom-4 left-4 bg-[var(--bg-panel)]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[var(--border-subtle)] text-[11px] font-mono tabular-nums flex items-center space-x-2.5 sm:space-x-3 text-[var(--text-secondary)] shadow-patensify-md pointer-events-none max-w-[calc(100%-2rem)] truncate">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--peak)]"></span>
            <span className="text-[var(--text-muted)]">Target:</span>
            <span className="text-[var(--text-primary)] font-semibold">
              {aspectSettings.preset === 'custom'
                ? `${aspectSettings.customWidth}:${aspectSettings.customHeight}`
                : aspectSettings.preset}
            </span>
          </div>
          <span className="text-[var(--border-strong)] shrink-0">•</span>
          <div className="shrink-0">
            <span className="text-[var(--text-muted)]">Fill:</span>{' '}
            <span className="text-[var(--text-primary)] capitalize font-semibold">
              {aspectSettings.backgroundMode === 'blur' ? 'Bokeh' : aspectSettings.solidColor}
            </span>
          </div>
          {watermarkSettings.enabled && (
            <>
              <span className="text-[var(--border-strong)] hidden sm:inline shrink-0">•</span>
              <div className="hidden sm:inline truncate">
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
