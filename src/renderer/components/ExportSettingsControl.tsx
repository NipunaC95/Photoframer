import React from 'react';
import { Folder, FolderOpen, Download, HardDrive } from 'lucide-react';
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
      <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-primary)]">
        <Download className="w-4 h-4 text-cyan-400" />
        <span>Export & Output Settings</span>
      </div>

      {/* Destination Folder */}
      <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>Output Directory</span>
          </span>
          <button
            onClick={onSelectFolder}
            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            <FolderOpen className="w-3 h-3" />
            <span>Browse</span>
          </button>
        </div>

        <div className="px-2.5 py-1.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] truncate">
          {settings.outputFolder || 'Default: [Source Folder]/Exported'}
        </div>
        <p className="text-[10px] text-[var(--text-muted)]">
          Processed files are saved cleanly without modifying or overwriting your originals.
        </p>
      </div>

      {/* Output Format & Quality */}
      <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
        <div>
          <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1.5">
            Output File Format
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['original', 'jpeg', 'png', 'webp'] as const).map((fmt) => {
              const isActive = settings.outputFormat === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => onChange({ ...settings, outputFormat: fmt })}
                  className={`py-1.5 px-1 rounded text-center text-xs font-mono uppercase transition-all border ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-semibold shadow-sm'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {fmt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Slider (for JPEG / WebP / PNG) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)]">Compression Quality</span>
            <span className="font-mono text-[var(--text-primary)] font-semibold">
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
        </div>

        {/* Filename Prefix & Suffix */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">
              Prefix
            </label>
            <input
              type="text"
              placeholder="e.g. art_"
              value={settings.prefix}
              onChange={(e) => onChange({ ...settings, prefix: e.target.value })}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">
              Suffix
            </label>
            <input
              type="text"
              placeholder="e.g. _padded"
              value={settings.suffix}
              onChange={(e) => onChange({ ...settings, suffix: e.target.value })}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
