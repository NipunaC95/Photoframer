import React from 'react';
import {
  Stamp,
  Upload,
  X,
  Grid3X3,
  Percent,
  Move,
  Maximize2,
  Check,
} from 'lucide-react';
import { WatermarkSettings, WatermarkAnchor } from '../types';

interface WatermarkControlProps {
  settings: WatermarkSettings;
  onChange: (updated: WatermarkSettings) => void;
  onSelectWatermark: () => void;
  watermarkThumbnail: string | null;
  watermarkFileName: string | null;
  onClearWatermark: () => void;
}

export const WatermarkControl: React.FC<WatermarkControlProps> = ({
  settings,
  onChange,
  onSelectWatermark,
  watermarkThumbnail,
  watermarkFileName,
  onClearWatermark,
}) => {
  const anchors: Array<{ id: WatermarkAnchor; label: string }> = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'middle-left', label: 'Middle Left' },
    { id: 'center', label: 'Center' },
    { id: 'middle-right', label: 'Middle Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div className="space-y-4">
      {/* Header with Enable/Disable switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-primary)]">
          <Stamp className="w-4 h-4 text-cyan-400" />
          <span>Logo & Watermark</span>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => onChange({ ...settings, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
        </label>
      </div>

      {settings.enabled && (
        <div className="space-y-3.5">
          {/* Logo file upload / preview card */}
          {settings.filePath ? (
            <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-10 h-10 rounded bg-black/40 p-1 checkerboard-pattern flex items-center justify-center border border-white/10 shrink-0">
                  {watermarkThumbnail ? (
                    <img
                      src={watermarkThumbnail}
                      alt="Watermark"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Stamp className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-xs font-medium text-[var(--text-primary)] truncate"
                    title={watermarkFileName || settings.filePath}
                  >
                    {watermarkFileName || 'Watermark.png'}
                  </p>
                  <p className="text-[10px] text-emerald-400 flex items-center space-x-1 mt-0.5">
                    <Check className="w-3 h-3 inline" />
                    <span>Active Transparent PNG</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={onSelectWatermark}
                  title="Change logo"
                  className="text-[11px] px-2 py-1 rounded bg-[var(--bg-elevated)] hover:bg-cyan-500 hover:text-white text-[var(--text-secondary)] transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={onClearWatermark}
                  title="Remove logo"
                  className="p-1 text-[var(--text-muted)] hover:text-red-400 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onSelectWatermark}
              className="w-full py-3 px-3 rounded-lg border-2 border-dashed border-[var(--border-subtle)] hover:border-cyan-500/50 hover:bg-[var(--bg-card)] text-center flex flex-col items-center justify-center group transition-all"
            >
              <Upload className="w-5 h-5 text-[var(--text-muted)] group-hover:text-cyan-400 mb-1 transition-colors" />
              <span className="text-xs font-medium text-[var(--text-primary)]">
                Select PNG Watermark Logo
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Transparent background recommended
              </span>
            </button>
          )}

          {/* 9-Point Anchor Grid */}
          <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Placement Anchor (9-Point Grid)</span>
              </span>
              <span className="font-mono text-[var(--text-primary)] capitalize">
                {settings.anchor.replace('-', ' ')}
              </span>
            </div>

            <div className="w-36 h-36 mx-auto bg-[var(--bg-elevated)] rounded-lg p-2 grid grid-cols-3 gap-1.5 border border-[var(--border-subtle)] shadow-inner">
              {anchors.map((anchor) => {
                const isSelected = settings.anchor === anchor.id;
                return (
                  <button
                    key={anchor.id}
                    onClick={() => onChange({ ...settings, anchor: anchor.id })}
                    title={anchor.label}
                    className={`rounded flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-white shadow-glow-cyan scale-105'
                        : 'bg-[var(--bg-card)] hover:bg-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-gray-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size / Scale Slider */}
          <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Logo Width Relative to Canvas</span>
              </span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">
                {settings.sizePercent}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="1"
              value={settings.sizePercent}
              onChange={(e) =>
                onChange({ ...settings, sizePercent: parseInt(e.target.value) || 15 })
              }
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-mono">
              <span>5% (Subtle)</span>
              <span>25%</span>
              <span>45% (Prominent)</span>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                <span>Watermark Opacity</span>
              </span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">
                {Math.round(settings.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={Math.round(settings.opacity * 100)}
              onChange={(e) =>
                onChange({ ...settings, opacity: (parseInt(e.target.value) || 80) / 100 })
              }
              className="w-full"
            />
          </div>

          {/* Margin Offset Slider */}
          <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Move className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edge Padding Margin</span>
              </span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">
                {settings.marginPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={settings.marginPercent}
              onChange={(e) =>
                onChange({ ...settings, marginPercent: parseInt(e.target.value) || 4 })
              }
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
