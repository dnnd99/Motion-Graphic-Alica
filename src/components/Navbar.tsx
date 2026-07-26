import React from 'react';
import { 
  Video, 
  Camera, 
  Sparkles, 
  Monitor, 
  Palette,
  Code2
} from 'lucide-react';
import { AspectRatio, ResolutionOption } from '../types';
import { COLOR_PALETTES } from '../data/palettes';

interface NavbarProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  resolution: ResolutionOption;
  setResolution: (res: ResolutionOption) => void;
  activePaletteId: string;
  onSelectPalette: (paletteId: string) => void;
  onOpenExportModal: () => void;
  onOpenQuickPasteHub: () => void;
  onTakeSnapshot: () => void;
  isRecording: boolean;
  fps: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  activePaletteId,
  onSelectPalette,
  onOpenExportModal,
  onOpenQuickPasteHub,
  onTakeSnapshot,
  isRecording,
  fps
}) => {
  return (
    <header id="app-navbar" className="h-16 bg-slate-900 border-b border-slate-800 text-slate-100 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-slate-100 via-slate-200 to-cyan-300 bg-clip-text text-transparent">
              MICROSTOCK MOTION LAB
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              60FPS CANVAS API
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center space-x-2">
            <span>Canvas 2D Engine</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">{fps} FPS</span>
          </p>
        </div>
      </div>

      {/* Center Controls: Aspect Ratio & Resolution */}
      <div className="hidden md:flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
        <div className="flex items-center space-x-1 px-1">
          <Monitor className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Ratio:</span>
        </div>
        {(['16:9', '9:16', '1:1', '21:9'] as AspectRatio[]).map((ar) => (
          <button
            key={ar}
            id={`btn-aspect-${ar.replace(':', '-')}`}
            onClick={() => setAspectRatio(ar)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              aspectRatio === ar
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {ar}
          </button>
        ))}

        <div className="h-4 w-[1px] bg-slate-800 my-auto mx-1" />

        <div className="flex items-center space-x-1 px-1">
          <span className="text-xs font-medium text-slate-400">Res:</span>
        </div>
        {(['1080p', '4k'] as ResolutionOption[]).map((res) => (
          <button
            key={res}
            id={`btn-res-${res}`}
            onClick={() => setResolution(res)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              resolution === res
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {res.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Color Palette Quick Swatches */}
      <div className="hidden lg:flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
        <Palette className="w-3.5 h-3.5 text-slate-400 ml-1" />
        <div className="flex items-center space-x-1">
          {COLOR_PALETTES.slice(0, 5).map((palette) => (
            <button
              key={palette.id}
              id={`palette-quick-${palette.id}`}
              onClick={() => onSelectPalette(palette.id)}
              title={palette.name}
              className={`w-5 h-5 rounded-full p-0.5 transition-all ${
                activePaletteId === palette.id
                  ? 'ring-2 ring-cyan-400 scale-110'
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
            >
              <div 
                className="w-full h-full rounded-full" 
                style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Export & Quick Paste Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          id="btn-open-quick-paste-hub"
          onClick={onOpenQuickPasteHub}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-500/40 rounded-lg transition-all shadow-md shadow-purple-600/20 animate-pulse hover:animate-none"
        >
          <Code2 className="w-4 h-4 text-cyan-300" />
          <span>QUICK PASTE HUB</span>
        </button>

        <button
          id="btn-quick-snapshot"
          onClick={onTakeSnapshot}
          title="Take 4K PNG Snapshot"
          className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
        >
          <Camera className="w-4 h-4" />
        </button>

        <button
          id="btn-record-video"
          onClick={onOpenExportModal}
          className={`flex items-center space-x-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-lg ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
              : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold shadow-cyan-500/20'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>{isRecording ? 'RECORDING...' : 'EXPORT VIDEO'}</span>
        </button>
      </div>
    </header>
  );
};
