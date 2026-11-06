import React from 'react';
import {
  Crop,
  Square,
  Smartphone,
  Tv,
  Sliders,
  Palette,
  Sparkles,
  Droplets,
} from 'lucide-react';
import { AspectSettings, AspectPreset, BackgroundMode } from '../types';

interface AspectControlProps {
  settings: AspectSettings;
  onChange: (updated: AspectSettings) => void;
}

export const AspectControl: React.FC<AspectControlProps> = ({ settings, onChange }) => {
  const presets: Array<{
    id: AspectPreset;
    label: string;
    sub: string;
    icon: React.ReactNode;
  }> = [
    {
      id: '1:1',
      label: '1:1',
      sub: 'Square',
      icon: <Square className="w-3.5 h-3.5" />,
    },
    {
      id: '4:5',
      label: '4:5',
      sub: 'Portrait',
      icon: <Smartphone className="w-3.5 h-3.5" />,
    },
    {
      id: '9:16',
      label: '9:16',
      sub: 'Story / Reel',
      icon: <Smartphone className="w-3.5 h-3.5" />,
    },
    {
      id: '16:9',
      label: '16:9',
      sub: 'Landscape',
      icon: <Tv className="w-3.5 h-3.5" />,
    },
    {
      id: 'custom',
      label: 'Custom',
      sub: 'Ratio',
      icon: <Sliders className="w-3.5 h-3.5" />,
    },
  ];

  const colorSwatches = [
    { label: 'Pitch Black', value: '#000000' },
    { label: 'Pure White', value: '#ffffff' },
    { label: 'Studio Dark', value: '#12151b' },
    { label: 'Neutral Gray', value: '#27272a' },
    { label: 'Off White', value: '#f4f4f5' },
    { label: 'Warm Sand', value: '#e7e5e4' },
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center space-x-2 text-xs font-semibold tracking-tight text-[var(--text-primary)]">
        <Crop className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        <span>Canvas Framing & Ratio</span>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((preset) => {
          const isActive = settings.preset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onChange({ ...settings, preset: preset.id })}
              className={`flex items-center space-x-2.5 p-2.5 rounded-xl text-left transition-all border ${
                isActive
                  ? 'bg-white text-black dark:bg-white dark:text-black font-semibold shadow-patensify-sm border-transparent'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive
                    ? 'bg-black/10 text-black'
                    : 'bg-[var(--chip-surface)] text-[var(--text-muted)]'
                }`}
              >
                {preset.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-tight leading-none">{preset.label}</div>
                <div
                  className={`text-[10px] font-mono tracking-wider uppercase mt-1 truncate ${
                    isActive ? 'text-neutral-700' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {preset.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Ratio Inputs */}
      {settings.preset === 'custom' && (
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
          <label className="text-[11px] font-medium tracking-tight text-[var(--text-secondary)]">
            Custom Aspect Ratio (Width : Height)
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block mb-1">
                Width
              </span>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.customWidth}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    customWidth: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-full bg-[var(--chip-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
            <span className="text-[var(--text-muted)] text-sm font-semibold pt-4">:</span>
            <div className="flex-1">
              <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block mb-1">
                Height
              </span>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.customHeight}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    customHeight: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-full bg-[var(--chip-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Background Fill Mode Selection */}
      <div className="space-y-2 pt-1">
        <label className="text-[11px] font-medium tracking-tight text-[var(--text-secondary)] flex items-center justify-between">
          <span>Non-destructive Background Padding</span>
        </label>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--chip-surface)] border border-[var(--border-subtle)]">
          <button
            onClick={() => onChange({ ...settings, backgroundMode: 'solid' })}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              settings.backgroundMode === 'solid'
                ? 'bg-white text-black dark:bg-white dark:text-black font-semibold shadow-patensify-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Solid Color</span>
          </button>
          <button
            onClick={() => onChange({ ...settings, backgroundMode: 'blur' })}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              settings.backgroundMode === 'blur'
                ? 'bg-white text-black dark:bg-white dark:text-black font-semibold shadow-patensify-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Blurred Canvas</span>
          </button>
        </div>

        {/* Solid Color Options */}
        {settings.backgroundMode === 'solid' && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Presets</span>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.solidColor}
                  onChange={(e) => onChange({ ...settings, solidColor: e.target.value })}
                  className="w-5 h-5 rounded-md cursor-pointer border border-[var(--border-subtle)] bg-transparent p-0"
                  title="Pick custom hex color"
                />
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-primary)] uppercase">
                  {settings.solidColor}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {colorSwatches.map((swatch) => (
                <button
                  key={swatch.value}
                  onClick={() => onChange({ ...settings, solidColor: swatch.value })}
                  title={swatch.label}
                  style={{ backgroundColor: swatch.value }}
                  className={`h-6 rounded-lg border transition-transform hover:scale-110 ${
                    settings.solidColor.toLowerCase() === swatch.value.toLowerCase()
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-card)] border-white'
                      : 'border-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Blurred Canvas Options */}
        {settings.backgroundMode === 'blur' && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Droplets className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Blur Sigma</span>
              </span>
              <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold">
                {settings.blurSigma} px
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="50"
              step="2"
              value={settings.blurSigma}
              onChange={(e) =>
                onChange({ ...settings, blurSigma: parseInt(e.target.value) || 28 })
              }
              className="w-full"
            />
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-sans">
              Dynamic bokeh fill computed by sampling, enlarging, and diffusing the photo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
