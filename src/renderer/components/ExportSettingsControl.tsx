import React from 'react';
import { FolderOpen, Download, HardDrive } from 'lucide-react';
import { ExportSettings } from '../types';

interface ExportSettingsControlProps {
  settings: ExportSettings;
  onChange: (updated: ExportSettings) => void;
  onSelectFolder: () => void;
}

export const ExportSettingsControl: React.FC<ExportSettingsControlProps> = ({
  settings,
  onChange,
  onSelectFolder,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-xs font-semibold tracking-tight text-[var(--text-primary)]">
        <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        <span>Export & Output Delivery</span>
      </div>

      {/* Destination Folder */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Output Directory</span>
          </span>
          <button
            onClick={onSelectFolder}
            className="flex items-center space-x-1 text-[var(--text-primary)] hover:opacity-80 font-medium transition-opacity text-xs"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Browse</span>
          </button>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-[var(--chip-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] truncate">
          {settings.outputFolder || 'Default: [Source Folder]/Exported'}
        </div>
        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-sans">
          Exports are generated non-destructively; original files remain intact and untouched.
        </p>
      </div>

      {/* Output Format & Quality */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3.5">
        <div>
          <label className="text-[11px] font-medium tracking-tight text-[var(--text-secondary)] block mb-2">
            Target Encoding Format
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['original', 'jpeg', 'png', 'webp'] as const).map((fmt) => {
              const isActive = settings.outputFormat === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => onChange({ ...settings, outputFormat: fmt })}
                  className={`py-1.5 px-1 rounded-lg text-center text-xs font-mono uppercase transition-all border ${
                    isActive
                      ? 'bg-white text-black dark:bg-white dark:text-black font-semibold shadow-patensify-sm border-transparent'
                      : 'bg-[var(--chip-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {fmt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Slider (for JPEG / WebP / PNG) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)]">Encoding Quality</span>
            <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold">
              {settings.quality}%
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="100"
            step="1"
            value={settings.quality}
            onChange={(e) =>
              onChange({ ...settings, quality: parseInt(e.target.value) || 90 })
            }
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
            <span>60% (Compact)</span>
            <span>90% (Recommended)</span>
            <span>100% (Lossless)</span>
          </div>
        </div>

        {/* Filename Prefix & Suffix */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider block mb-1">
              Prefix
            </label>
            <input
              type="text"
              placeholder="e.g. art_"
              value={settings.prefix}
              onChange={(e) => onChange({ ...settings, prefix: e.target.value })}
              className="w-full bg-[var(--chip-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider block mb-1">
              Suffix
            </label>
            <input
              type="text"
              placeholder="e.g. _framed"
              value={settings.suffix}
              onChange={(e) => onChange({ ...settings, suffix: e.target.value })}
              className="w-full bg-[var(--chip-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
