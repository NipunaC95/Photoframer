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
      <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--text-primary)]">
        <Crop className="w-4 h-4 text-cyan-400" />
        <span>Canvas & Aspect Ratio</span>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((preset) => {
          const isActive = settings.preset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onChange({ ...settings, preset: preset.id })}
              className={`flex items-center space-x-2 p-2 rounded-lg text-left transition-all border ${
                isActive
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-sm'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`p-1 rounded ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-black/20 text-gray-400'
                }`}
              >
                {preset.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold leading-none">{preset.label}</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                  {preset.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Ratio Inputs */}
      {settings.preset === 'custom' && (
        <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
          <label className="text-[11px] font-medium text-[var(--text-secondary)]">
            Custom Aspect Ratio (Width : Height)
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <span className="text-[10px] text-[var(--text-muted)] font-mono block mb-1">
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
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <span className="text-[var(--text-muted)] text-sm font-semibold pt-4">:</span>
            <div className="flex-1">
              <span className="text-[10px] text-[var(--text-muted)] font-mono block mb-1">
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
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Background Fill Mode Selection */}
      <div className="space-y-2">
        <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
          <span>Non-destructive Background Fill</span>
        </label>

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <button
            onClick={() => onChange({ ...settings, backgroundMode: 'solid' })}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              settings.backgroundMode === 'solid'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Solid Color</span>
          </button>
          <button
            onClick={() => onChange({ ...settings, backgroundMode: 'blur' })}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              settings.backgroundMode === 'blur'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Blurred Canvas</span>
          </button>
        </div>

        {/* Solid Color Options */}
        {settings.backgroundMode === 'solid' && (
          <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">Quick Swatches</span>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.solidColor}
                  onChange={(e) => onChange({ ...settings, solidColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-[var(--border-subtle)] bg-transparent p-0"
                  title="Pick custom hex color"
                />
                <span className="text-[11px] font-mono text-[var(--text-primary)] uppercase">
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
                  className={`h-6 rounded border transition-transform hover:scale-110 ${
                    settings.solidColor.toLowerCase() === swatch.value.toLowerCase()
                      ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[var(--bg-card)] border-white'
                      : 'border-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Blurred Canvas Options */}
        {settings.backgroundMode === 'blur' && (
          <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)] flex items-center space-x-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Blur Intensity</span>
              </span>
              <span className="font-mono text-[var(--text-primary)]">
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
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              A smooth bokeh fill created by zooming and softening the original image.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
