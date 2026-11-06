import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { BatchProgressPayload, ProcessBatchResult } from '../types';

interface BatchProgressModalProps {
  isOpen: boolean;
  progress: BatchProgressPayload | null;
  result: ProcessBatchResult | null;
  onCancel: () => void;
  onClose: () => void;
  onOpenOutputFolder: (folder: string) => void;
}

export const BatchProgressModal: React.FC<BatchProgressModalProps> = ({
  isOpen,
  progress,
  result,
  onCancel,
  onClose,
  onOpenOutputFolder,
}) => {
  if (!isOpen) return null;

  const isCompleted = progress?.status === 'completed' || !!result;
  const isCancelled = progress?.status === 'cancelled';
  const isError = progress?.status === 'error';
  const percent = progress?.progressPercent ?? 0;

  const currentFolder = result?.outputFolder || progress?.outputPath;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)] shadow-surface-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isCancelled
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isCancelled ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {isCompleted
                  ? 'Batch Export Finished'
                  : isCancelled
                  ? 'Batch Export Cancelled'
                  : 'Processing Images...'}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                {isCompleted
                  ? 'All images have been padded and watermarked successfully.'
                  : `Working on image ${progress?.currentIndex || 0} of ${
                      progress?.totalImages || 0
                    }`}
              </p>
            </div>
          </div>

          {(isCompleted || isCancelled) && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          {/* Active file & percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-mono truncate max-w-xs">
                {progress?.currentFileName || 'Initializing sharp pipeline...'}
              </span>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                {percent}%
              </span>
            </div>

            {/* Glowing progress bar track */}
            <div className="w-full h-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden p-0.5">
              <div
                style={{ width: `${percent}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm'
                    : isCancelled
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-glow-cyan'
                }`}
              />
            </div>
          </div>

          {/* Result statistics summary */}
          {result && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block font-mono">
                  Processed
                </span>
                <span className="text-base font-semibold font-mono text-[var(--text-primary)]">
                  {result.totalProcessed}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] text-emerald-400 uppercase block font-mono">
                  Succeeded
                </span>
                <span className="text-base font-semibold font-mono text-emerald-400">
                  {result.successCount}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
                <span className="text-[10px] text-red-400 uppercase block font-mono">
                  Errors
                </span>
                <span className="text-base font-semibold font-mono text-red-400">
                  {result.errorCount}
                </span>
              </div>
            </div>
          )}

          {/* Errors list if any */}
          {result && result.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs space-y-1.5 max-h-32 overflow-y-auto">
              <div className="flex items-center space-x-1.5 text-red-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>The following files encountered issues:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-red-300/80 font-mono space-y-0.5">
                {result.errors.map((err, i) => (
                  <li key={i}>
                    {err.fileName}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Destination path */}
          {currentFolder && (
            <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono block">
                Destination Directory:
              </span>
              <p className="font-mono text-[var(--text-primary)] text-[11px] truncate" title={currentFolder}>
                {currentFolder}
              </p>
            </div>
          )}
        </div>

        {/* Modal actions */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/50 flex items-center justify-end space-x-2">
          {!isCompleted && !isCancelled && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 border border-[var(--border-subtle)] transition-colors"
            >
              Cancel Process
            </button>
          )}

          {isCompleted && currentFolder && (
            <button
              onClick={() => onOpenOutputFolder(currentFolder)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-[0.98]"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open Output Folder</span>
            </button>
          )}

          {(isCompleted || isCancelled) && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-sm active:scale-[0.98]"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
