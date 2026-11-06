import React from 'react';
import { Layers, Play, Sun, Moon, FolderCheck, Loader2 } from 'lucide-react';

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
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between px-5 z-20 select-none backdrop-blur-md">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)] text-[var(--bg-base)] flex items-center justify-center font-bold shadow-sm">
          <Layers className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <h1 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Photoframer
          </h1>
          <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-[var(--chip-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            Studio
          </span>
        </div>
      </div>

      {/* Middle status indicator - Patensify styled chips */}
      <div className="hidden md:flex items-center space-x-3 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[var(--chip-surface)] border border-[var(--border-subtle)] font-mono text-[11px] tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--peak)] animate-pulse"></span>
          <span className="text-[var(--text-muted)]">Queue:</span>
          <span className="text-[var(--text-primary)] font-semibold">{itemCount}</span>
          <span className="text-[var(--text-muted)]">photos</span>
        </div>

        {outputFolder && (
          <div
            className="flex items-center space-x-1.5 max-w-xs truncate text-[11px] font-mono text-[var(--text-muted)] px-3 py-1 rounded-full bg-[var(--chip-surface)] border border-[var(--border-subtle)]"
            title={outputFolder}
          >
            <FolderCheck className="w-3 h-3 text-[var(--peak)] shrink-0" />
            <span className="truncate">{outputFolder}</span>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors border border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Patensify High-Contrast Primary CTA */}
        <button
          onClick={onStartBatch}
          disabled={itemCount === 0 || isProcessing}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
            itemCount > 0 && !isProcessing
              ? 'bg-[var(--brand-accent)] text-[var(--bg-base)] hover:opacity-90 active:scale-[0.98] cursor-pointer font-semibold'
              : 'bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-subtle)]'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Export ({itemCount})</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
