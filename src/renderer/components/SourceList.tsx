import React, { useState, useRef, useEffect } from 'react';
import {
  FolderPlus,
  FilePlus,
  Trash2,
  Image as ImageIcon,
  Compass,
  CheckCircle2,
  X,
  UploadCloud,
} from 'lucide-react';
import { SourceImageItem } from '../types';
import { formatBytes, formatDimensions } from '../utils/formatters';

interface SourceListProps {
  items: SourceImageItem[];
  selectedItem: SourceImageItem | null;
  onSelectItem: (item: SourceImageItem) => void;
  onAddFiles: () => void;
  onAddFolder: () => void;
  onDropFiles: (paths: string[]) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export const SourceList: React.FC<SourceListProps> = ({
  items,
  selectedItem,
  onSelectItem,
  onAddFiles,
  onAddFolder,
  onDropFiles,
  onRemoveItem,
  onClearAll,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active queue item into view when selected via keyboard (Up/Down) or click
  useEffect(() => {
    if (selectedItem?.id) {
      const el = document.getElementById(`source-item-${selectedItem.id}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedItem?.id]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        // Electron webUtils or path property
        const filePath = (file as any).path || (window as any).electronAPI?.webUtils?.getPathForFile?.(file);
        if (filePath) {
          paths.push(filePath);
        }
      }
      if (paths.length > 0) {
        onDropFiles(paths);
      }
    }
  };

  const getOrientationBadge = (item: SourceImageItem) => {
    switch (item.orientation) {
      case 'landscape':
        return (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--chip-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-mono tracking-wider uppercase">
            Landscape
          </span>
        );
      case 'portrait':
        return (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--peak)]/10 text-[var(--peak)] border border-[var(--peak)]/20 font-mono tracking-wider uppercase">
            Portrait
          </span>
        );
      case 'square':
        return (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--chip-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-mono tracking-wider uppercase">
            Square
          </span>
        );
    }
  };

  const totalBytes = items.reduce((acc, curr) => acc + curr.fileSize, 0);

  return (
    <aside
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-72 shrink-0 h-full border-r border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col relative transition-all duration-150 ${
        isDragOver ? 'ring-1 ring-white/40 bg-neutral-900/60' : ''
      }`}
    >
      {/* Top Header & Actions */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold tracking-tight text-[var(--text-primary)]">
            <ImageIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Source Images</span>
            <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
              ({items.length})
            </span>
            {items.length > 1 && (
              <span
                className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--chip-surface)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded tracking-tighter"
                title="Use Up / Down arrow keys to cycle photos"
              >
                ↑↓
              </span>
            )}
          </div>

          {items.length > 0 && (
            <button
              onClick={onClearAll}
              title="Clear all source images"
              className="text-[11px] text-[var(--text-muted)] hover:text-red-400 flex items-center space-x-1 transition-colors px-2 py-0.5 rounded-full hover:bg-red-500/10 font-mono"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Action Button Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAddFiles}
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-[var(--chip-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-primary)] transition-all active:scale-[0.98] font-medium"
          >
            <FilePlus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Add Files</span>
          </button>
          <button
            onClick={onAddFolder}
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-[var(--chip-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-primary)] transition-all active:scale-[0.98] font-medium"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Add Folder</span>
          </button>
        </div>
      </div>

      {/* Main List Area or Drag Drop Zone */}
      {items.length === 0 ? (
        <div
          onClick={onAddFiles}
          className="flex-1 flex flex-col items-center justify-center p-6 text-center cursor-pointer m-3 rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-white/30 hover:bg-[var(--bg-card)]/50 transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-[var(--bg-card)] flex items-center justify-center mb-3 group-hover:scale-105 transition-all border border-[var(--border-subtle)] shadow-sm">
            <UploadCloud className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
          </div>
          <p className="text-xs font-semibold tracking-tight text-[var(--text-primary)] mb-1">
            Drop images to load
          </p>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-sans">
            or click to select from disk.
            <br />
            <span className="font-mono text-[10px] tracking-wider uppercase text-[var(--text-secondary)]">JPG • PNG • WebP • AVIF</span>
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {items.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <div
                key={item.id}
                id={`source-item-${item.id}`}
                onClick={() => onSelectItem(item)}
                className={`group relative flex items-center p-2 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-white/[0.08] dark:bg-white/[0.08] border-white/20 shadow-sm ring-1 ring-white/10'
                    : 'bg-[var(--bg-card)]/60 hover:bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-lg bg-black/40 overflow-hidden shrink-0 flex items-center justify-center border border-white/5 relative">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-neutral-500" />
                  )}
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-black/80 text-neutral-300">
                    {item.format}
                  </span>
                </div>

                {/* Details */}
                <div className="ml-2.5 flex-1 min-w-0 pr-6">
                  <p
                    className="text-xs font-medium tracking-tight text-[var(--text-primary)] truncate"
                    title={item.fileName}
                  >
                    {item.fileName}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] text-[var(--text-muted)] font-mono tabular-nums">
                    <span>{formatDimensions(item.width, item.height)}</span>
                    <span>•</span>
                    <span>{formatBytes(item.fileSize)}</span>
                  </div>
                  <div className="mt-1 flex items-center space-x-1">
                    {getOrientationBadge(item)}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  title="Remove image from queue"
                  className="absolute right-2 top-2 p-1 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      {items.length > 0 && (
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
          <span>{items.length} photos</span>
          <span>{formatBytes(totalBytes)}</span>
        </div>
      )}

      {/* Drag Over Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center z-30 pointer-events-none border-2 border-dashed border-white/40">
          <UploadCloud className="w-9 h-9 text-white animate-bounce mb-2" />
          <p className="text-xs font-semibold text-white tracking-tight">Drop photos to import</p>
        </div>
      )}
    </aside>
  );
};
