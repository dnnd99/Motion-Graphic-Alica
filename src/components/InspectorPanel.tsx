import React from 'react';
import { MotionParams, BlendMode } from '../types';
import { COLOR_PALETTES } from '../data/palettes';
import { 
  Sliders, 
  Palette, 
  Type, 
  Sparkles, 
  RotateCcw, 
  Zap, 
  Layers,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

interface InspectorPanelProps {
  params: MotionParams;
  onChangeParam: <K extends keyof MotionParams>(key: K, value: MotionParams[K]) => void;
  onResetParams: () => void;
  onSelectPalette: (paletteId: string) => void;
  activePaletteId: string;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  params,
  onChangeParam,
  onResetParams,
  onSelectPalette,
  activePaletteId,
}) => {
  return (
    <div id="inspector-panel" className="w-80 bg-slate-900/90 border-l border-slate-800 flex flex-col h-full select-none overflow-y-auto custom-scrollbar">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Motion Controls
          </h2>
        </div>
        <button
          id="btn-reset-params"
          onClick={onResetParams}
          title="Reset parameters to template defaults"
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-all flex items-center space-x-1 text-[11px]"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Color Palette Swatches */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Color Preset</span>
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_PALETTES.map((pal) => (
              <button
                key={pal.id}
                id={`pal-btn-${pal.id}`}
                onClick={() => onSelectPalette(pal.id)}
                className={`p-1.5 rounded-lg border transition-all text-left ${
                  activePaletteId === pal.id
                    ? 'bg-slate-800 border-cyan-400 ring-1 ring-cyan-400/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="h-4 rounded mb-1 flex overflow-hidden">
                  <div className="w-1/3 h-full" style={{ backgroundColor: pal.primary }} />
                  <div className="w-1/3 h-full" style={{ backgroundColor: pal.secondary }} />
                  <div className="w-1/3 h-full" style={{ backgroundColor: pal.accent }} />
                </div>
                <div className="text-[9px] font-semibold text-slate-300 truncate">{pal.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Individual Color Hex Pickers */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">Custom Swatches</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={params.primaryColor}
                onChange={(e) => onChangeParam('primaryColor', e.target.value)}
                className="w-6 h-6 rounded bg-transparent cursor-pointer border-0"
              />
              <span className="text-slate-300 font-mono text-[10px]">Primary</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={params.secondaryColor}
                onChange={(e) => onChangeParam('secondaryColor', e.target.value)}
                className="w-6 h-6 rounded bg-transparent cursor-pointer border-0"
              />
              <span className="text-slate-300 font-mono text-[10px]">Secondary</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={params.accentColor}
                onChange={(e) => onChangeParam('accentColor', e.target.value)}
                className="w-6 h-6 rounded bg-transparent cursor-pointer border-0"
              />
              <span className="text-slate-300 font-mono text-[10px]">Accent</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={params.bgColor}
                onChange={(e) => onChangeParam('bgColor', e.target.value)}
                className="w-6 h-6 rounded bg-transparent cursor-pointer border-0"
              />
              <span className="text-slate-300 font-mono text-[10px]">Canvas BG</span>
            </div>
          </div>
        </div>

        {/* Text Customization (Title templates) */}
        {params.customTitle !== undefined && (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>Typography Text</span>
            </label>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Primary Title</span>
              <input
                id="input-custom-title"
                type="text"
                value={params.customTitle}
                onChange={(e) => onChangeParam('customTitle', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Subtitle / Badge</span>
              <input
                id="input-custom-subtitle"
                type="text"
                value={params.customSubtitle || ''}
                onChange={(e) => onChangeParam('customSubtitle', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* Motion Dynamics Sliders */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 border-b border-slate-800/60 pb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Dynamics & Simulation</span>
          </label>

          {/* Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Animation Speed</span>
              <span className="font-mono text-cyan-400 font-bold">{params.speed.toFixed(1)}x</span>
            </div>
            <input
              id="slider-speed"
              type="range"
              min={0.1}
              max={3.0}
              step={0.1}
              value={params.speed}
              onChange={(e) => onChangeParam('speed', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Particle Count / Complexity */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Particle Density</span>
              <span className="font-mono text-indigo-400 font-bold">{params.particleCount}</span>
            </div>
            <input
              id="slider-particles"
              type="range"
              min={20}
              max={500}
              step={10}
              value={params.particleCount}
              onChange={(e) => onChangeParam('particleCount', parseInt(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
          </div>

          {/* Glow Intensity */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Bloom / Glow Intensity</span>
              <span className="font-mono text-amber-400 font-bold">{params.glowIntensity}%</span>
            </div>
            <input
              id="slider-glow"
              type="range"
              min={0}
              max={100}
              step={5}
              value={params.glowIntensity}
              onChange={(e) => onChangeParam('glowIntensity', parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Film Grain / Noise */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Film Grain Noise</span>
              <span className="font-mono text-emerald-400 font-bold">{params.noiseIntensity}%</span>
            </div>
            <input
              id="slider-noise"
              type="range"
              min={0}
              max={50}
              step={2}
              value={params.noiseIntensity}
              onChange={(e) => onChangeParam('noiseIntensity', parseInt(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Rotation Speed */}
          {params.rotationSpeed !== undefined && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Rotation Velocity</span>
                <span className="font-mono text-fuchsia-400 font-bold">{params.rotationSpeed.toFixed(1)}x</span>
              </div>
              <input
                id="slider-rotation"
                type="range"
                min={0}
                max={3.0}
                step={0.1}
                value={params.rotationSpeed}
                onChange={(e) => onChangeParam('rotationSpeed', parseFloat(e.target.value))}
                className="w-full accent-fuchsia-400 cursor-pointer"
              />
            </div>
          )}

          {/* Zoom / Distance Scale */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Camera Distance Scale</span>
              <span className="font-mono text-sky-400 font-bold">{params.zoomScale.toFixed(2)}x</span>
            </div>
            <input
              id="slider-zoom"
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={params.zoomScale}
              onChange={(e) => onChangeParam('zoomScale', parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Line Thickness */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Stroke / Line Width</span>
              <span className="font-mono text-teal-400 font-bold">{params.lineThickness.toFixed(1)}px</span>
            </div>
            <input
              id="slider-linewidth"
              type="range"
              min={0.5}
              max={5.0}
              step={0.1}
              value={params.lineThickness}
              onChange={(e) => onChangeParam('lineThickness', parseFloat(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          {/* Blend Mode */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium flex items-center space-x-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Composite Blend Mode</span>
              </span>
            </div>
            <select
              id="select-blend-mode"
              value={params.blendMode}
              onChange={(e) => onChangeParam('blendMode', e.target.value as BlendMode)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="source-over">source-over (Normal)</option>
              <option value="screen">screen (Neon Light)</option>
              <option value="lighter">lighter (Additive Glow)</option>
              <option value="overlay">overlay (High Contrast)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
