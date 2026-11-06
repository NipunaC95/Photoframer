import React, { useState, useRef } from 'react';
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
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            Landscape
          </span>
        );
      case 'portrait':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
            Portrait
          </span>
        );
      case 'square':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
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
      className={`w-80 h-full border-r border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col relative transition-all duration-150 ${
        isDragOver ? 'ring-2 ring-cyan-500/80 bg-cyan-500/5' : ''
      }`}
    >
      {/* Top Header & Actions */}
      <div className="p-3 border-b border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-primary)]">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span>Source Images</span>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              ({items.length})
            </span>
          </div>

          {items.length > 0 && (
            <button
              onClick={onClearAll}
              title="Clear all source images"
              className="text-[11px] text-[var(--text-muted)] hover:text-red-400 flex items-center space-x-1 transition-colors px-1.5 py-0.5 rounded hover:bg-red-500/10"
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
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-primary)] transition-colors active:scale-[0.98]"
          >
            <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Files</span>
          </button>
          <button
            onClick={onAddFolder}
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-primary)] transition-colors active:scale-[0.98]"
          >
            <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>Add Folder</span>
          </button>
        </div>
      </div>

      {/* Main List Area or Drag Drop Zone */}
      {items.length === 0 ? (
        <div
          onClick={onAddFiles}
          className="flex-1 flex flex-col items-center justify-center p-6 text-center cursor-pointer m-3 rounded-xl border-2 border-dashed border-[var(--border-subtle)] hover:border-cyan-500/50 hover:bg-[var(--bg-card)]/50 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] flex items-center justify-center mb-3 group-hover:scale-110 group-hover:text-cyan-400 transition-all border border-[var(--border-subtle)] shadow-sm">
            <UploadCloud className="w-6 h-6 text-[var(--text-muted)] group-hover:text-cyan-400" />
          </div>
          <p className="text-xs font-medium text-[var(--text-primary)] mb-1">
            Drag & Drop Images Here
          </p>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            or click to browse from device.
            <br />
            Supports JPG, PNG, WebP, AVIF
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {items.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`group relative flex items-center p-2 rounded-lg cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm'
                    : 'bg-[var(--bg-card)]/70 hover:bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded bg-black/40 overflow-hidden shrink-0 flex items-center justify-center border border-white/5 relative">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-black/70 text-gray-300">
                    {item.format}
                  </span>
                </div>

                {/* Details */}
                <div className="ml-2.5 flex-1 min-w-0 pr-6">
                  <p
                    className="text-xs font-medium text-[var(--text-primary)] truncate"
                    title={item.fileName}
                  >
                    {item.fileName}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] text-[var(--text-muted)] font-mono">
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
        <div className="p-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <span>{items.length} items</span>
          <span>{formatBytes(totalBytes)}</span>
        </div>
      )}

      {/* Drag Over Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-cyan-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-none border-2 border-dashed border-cyan-400">
          <UploadCloud className="w-10 h-10 text-cyan-400 animate-bounce mb-2" />
          <p className="text-xs font-semibold text-white">Drop images to import</p>
        </div>
      )}
    </aside>
  );
};
