import React from 'react';
import { Layers, Play, Sun, Moon, FolderCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  itemCount: number;
  outputFolder: string | null;
  onStartBatch: () => void;
  isProcessing: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  itemCount,
  outputFolder,
  onStartBatch,
  isProcessing,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between px-4 z-20 select-none">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan text-white">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
              Photoframer
            </h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Studio
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] -mt-0.5">
            Non-destructive padding & watermarking engine
          </p>
        </div>
      </div>

      {/* Middle status indicator */}
      <div className="hidden md:flex items-center space-x-4 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Queue:</span>
          <strong className="text-[var(--text-primary)] font-mono">{itemCount}</strong>
          <span>images</span>
        </div>

        {outputFolder && (
          <div
            className="flex items-center space-x-1.5 max-w-xs truncate text-[11px] text-[var(--text-muted)]"
            title={outputFolder}
          >
            <FolderCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{outputFolder}</span>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors border border-transparent hover:border-[var(--border-subtle)]"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onStartBatch}
          disabled={itemCount === 0 || isProcessing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-sm ${
            itemCount > 0 && !isProcessing
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-110 shadow-glow-cyan active:scale-[0.98]'
              : 'bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-subtle)]'
          }`}
        >
          {isProcessing ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Export Batch ({itemCount})</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
