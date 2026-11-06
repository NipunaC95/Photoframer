import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  X,
  Loader2,
  Image as ImageIcon,
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
  const savingFileName = progress?.savingFileName || progress?.currentFileName;
  const sourceFileName = progress?.currentFileName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-lg bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)] shadow-patensify-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isCompleted
                  ? 'bg-white text-black dark:bg-white dark:text-black font-semibold'
                  : isCancelled
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : isError
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-[var(--chip-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              ) : isCancelled ? (
                <AlertTriangle className="w-4 h-4" />
              ) : isError ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--peak)]" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                {isCompleted
                  ? 'Batch Export Finished'
                  : isCancelled
                  ? 'Batch Export Cancelled'
                  : isError
                  ? 'Batch Export Failed'
                  : 'Exporting Photos...'}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-sans">
                {isCompleted
                  ? 'All images have been framed and watermarked successfully.'
                  : isCancelled
                  ? 'The batch export process was stopped by user request.'
                  : isError
                  ? (progress?.errorMessage || 'An error occurred during batch export.')
                  : `Exporting photo ${progress?.currentIndex || 0} of ${
                      progress?.totalImages || 0
                    }`}
              </p>
            </div>
          </div>

          {(isCompleted || isCancelled || isError) && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chip-surface)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4">
          {/* Active currently saving file card (when in progress) */}
          {!isCompleted && !isCancelled && !isError && (
            <div className="p-3.5 rounded-xl bg-[var(--chip-surface)] border border-[var(--border-subtle)] flex items-center space-x-3.5">
              {/* Thumbnail of currently saving file */}
              <div className="w-14 h-14 rounded-lg bg-black/50 border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center relative">
                {progress?.thumbnailUrl ? (
                  <img
                    src={progress.thumbnailUrl}
                    alt={sourceFileName || 'Exporting'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-[var(--text-muted)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* File details & saving status */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Saving</span>
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {progress?.currentIndex || 0} / {progress?.totalImages || 0}
                  </span>
                </div>

                <div
                  className="font-mono text-xs font-semibold text-[var(--text-primary)] truncate"
                  title={savingFileName}
                >
                  {savingFileName || 'Preparing next image...'}
                </div>

                {sourceFileName && sourceFileName !== savingFileName && (
                  <div className="text-[10px] font-mono text-[var(--text-muted)] truncate flex items-center space-x-1">
                    <span>Source:</span>
                    <span className="text-[var(--text-secondary)] truncate" title={sourceFileName}>
                      {sourceFileName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress bar track & percentage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-mono text-[11px]">
                {isCompleted
                  ? 'All tasks completed'
                  : isCancelled
                  ? 'Processing stopped'
                  : isError
                  ? 'Processing failed'
                  : `Exporting photo ${progress?.currentIndex || 0} of ${progress?.totalImages || 0}`}
              </span>
              <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)] text-xs">
                {percent}%
              </span>
            </div>

            {/* Precision progress bar track */}
            <div className="w-full h-2 rounded-full bg-[var(--chip-surface)] border border-[var(--border-subtle)] overflow-hidden p-0.5">
              <div
                style={{ width: `${percent}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-white dark:bg-white shadow-sm'
                    : isCancelled
                    ? 'bg-amber-500'
                    : isError
                    ? 'bg-red-500'
                    : 'bg-[var(--brand-accent)]'
                }`}
              />
            </div>
          </div>

          {/* Error message card */}
          {isError && progress?.errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs space-y-1">
              <span className="text-[9px] text-red-400 uppercase font-mono tracking-wider block">
                Error Details:
              </span>
              <p className="font-mono text-red-300 text-[11px]">
                {progress.errorMessage}
              </p>
            </div>
          )}

          {/* Result statistics summary */}
          {result && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-[var(--chip-surface)] border border-[var(--border-subtle)] text-center">
                <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block font-mono">
                  Total
                </span>
                <span className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)]">
                  {result.totalProcessed}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--chip-surface)] border border-[var(--border-subtle)] text-center">
                <span className="text-[9px] text-emerald-400 uppercase tracking-wider block font-mono">
                  Success
                </span>
                <span className="text-base font-semibold font-mono tabular-nums text-emerald-400">
                  {result.successCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--chip-surface)] border border-[var(--border-subtle)] text-center">
                <span className="text-[9px] text-red-400 uppercase tracking-wider block font-mono">
                  Errors
                </span>
                <span className="text-base font-semibold font-mono tabular-nums text-red-400">
                  {result.errorCount}
                </span>
              </div>
            </div>
          )}

          {/* Errors list if any */}
          {result && result.errors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs space-y-1.5 max-h-32 overflow-y-auto">
              <div className="flex items-center space-x-1.5 text-red-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Issues encountered:</span>
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
            <div className="p-3 rounded-xl bg-[var(--chip-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1">
              <span className="text-[9px] text-[var(--text-muted)] uppercase font-mono tracking-wider block">
                Destination Folder:
              </span>
              <p className="font-mono text-[var(--text-primary)] text-[11px] truncate" title={currentFolder}>
                {currentFolder}
              </p>
            </div>
          )}
        </div>

        {/* Modal actions */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-end space-x-2">
          {!isCompleted && !isCancelled && !isError && (
            <button
              onClick={onCancel}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 border border-[var(--border-subtle)] transition-colors"
            >
              Cancel Process
            </button>
          )}

          {isCompleted && currentFolder && typeof window !== 'undefined' && !!(window as any).electronAPI && (
            <button
              onClick={() => onOpenOutputFolder(currentFolder)}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--chip-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open Output Folder</span>
            </button>
          )}

          {(isCompleted || isCancelled || isError) && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-black dark:bg-white dark:text-black hover:opacity-90 transition-all shadow-sm active:scale-[0.98]"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
