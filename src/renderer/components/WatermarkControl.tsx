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
        <div className="flex items-center space-x-2 text-xs font-semibold tracking-tight text-[var(--text-primary)]">
          <Stamp className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span>Brand Watermark & Logo</span>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => onChange({ ...settings, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-neutral-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-white"></div>
        </label>
      </div>

      {settings.enabled && (
        <div className="space-y-3">
          {/* Logo file upload / preview card */}
          {settings.filePath ? (
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-black/40 p-1 checkerboard-pattern flex items-center justify-center border border-white/10 shrink-0">
                  {watermarkThumbnail ? (
                    <img
                      src={watermarkThumbnail}
                      alt="Watermark"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Stamp className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-xs font-medium tracking-tight text-[var(--text-primary)] truncate"
                    title={watermarkFileName || settings.filePath}
                  >
                    {watermarkFileName || 'Logo.png'}
                  </p>
                  <p className="text-[10px] font-mono tracking-wider uppercase text-[var(--peak)] flex items-center space-x-1 mt-0.5">
                    <Check className="w-3 h-3 inline stroke-[2.5]" />
                    <span>Transparent PNG</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={onSelectWatermark}
                  title="Change logo"
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[var(--chip-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all"
                >
                  Change
                </button>
                <button
                  onClick={onClearWatermark}
                  title="Remove logo"
                  className="p-1 text-[var(--text-muted)] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onSelectWatermark}
              className="w-full py-4 px-3 rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-white/30 hover:bg-[var(--chip-surface)] text-center flex flex-col items-center justify-center group transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] mb-1.5 transition-colors" />
              <span className="text-xs font-semibold tracking-tight text-[var(--text-primary)]">
                Select PNG Watermark Logo
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--text-muted)] mt-0.5">
                Transparent PNG recommended
              </span>
            </button>
          )}

          {/* 9-Point Anchor Grid */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Grid3X3 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Placement Anchor (9-Point Grid)</span>
              </span>
              <span className="font-mono uppercase tracking-wider text-[10px] text-[var(--text-primary)]">
                {settings.anchor.replace('-', ' ')}
              </span>
            </div>

            <div className="w-36 h-36 mx-auto bg-[var(--chip-surface)] rounded-xl p-2 grid grid-cols-3 gap-1.5 border border-[var(--border-subtle)] shadow-inner">
              {anchors.map((anchor) => {
                const isSelected = settings.anchor === anchor.id;
                return (
                  <button
                    key={anchor.id}
                    onClick={() => onChange({ ...settings, anchor: anchor.id })}
                    title={anchor.label}
                    className={`rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-white text-black shadow-patensify-sm scale-105'
                        : 'bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-neutral-400'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-black' : 'bg-neutral-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size / Scale Slider */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Scale Relative to Canvas</span>
              </span>
              <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold">
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
            <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
              <span>5% (Subtle)</span>
              <span>25%</span>
              <span>45% (Prominent)</span>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Percent className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Watermark Opacity</span>
              </span>
              <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold">
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
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Move className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Edge Inset Margin</span>
              </span>
              <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold">
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
