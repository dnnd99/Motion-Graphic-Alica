import React, { useRef, useEffect, useState } from 'react';
import { MotionTemplate, MotionParams, AspectRatio, ResolutionOption } from '../types';
import { applyFilmGrain } from '../utils/canvasUtils';
import { Grid, Shield, Maximize2, ZoomIn, ZoomOut, RefreshCw, Eye } from 'lucide-react';

interface ViewportCanvasProps {
  activeTemplate: MotionTemplate;
  params: MotionParams;
  currentTime: number;
  duration: number;
  aspectRatio: AspectRatio;
  resolution: ResolutionOption;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onFpsUpdate: (fps: number) => void;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  activeTemplate,
  params,
  currentTime,
  duration,
  aspectRatio,
  resolution,
  canvasRef,
  onFpsUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSafeMargins, setShowSafeMargins] = useState(false);
  const [showRuleOfThirds, setShowRuleOfThirds] = useState(false);
  const [showSeamChecker, setShowSeamChecker] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = Fit

  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Compute dimensions based on resolution & aspect ratio
  const getCanvasDimensions = () => {
    let width = 1920;
    let height = 1080;

    if (resolution === '4k') {
      width = 3840;
      height = 2160;
    }

    if (aspectRatio === '9:16') {
      const temp = width;
      width = height;
      height = temp;
    } else if (aspectRatio === '1:1') {
      height = width;
    } else if (aspectRatio === '21:9') {
      height = Math.floor(width * (9 / 21));
    }

    return { width, height };
  };

  const { width: targetWidth, height: targetHeight } = getCanvasDimensions();

  // Render Frame Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set buffer size
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    // Measure FPS
    const now = performance.now();
    frameCountRef.current++;
    if (now - lastFrameTimeRef.current >= 1000) {
      onFpsUpdate(Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current)));
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    // Render Template
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    if (showSeamChecker) {
      // Split view: Left side = Start frame (0s), Right side = Current frame
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, targetWidth / 2, targetHeight);
      ctx.clip();
      activeTemplate.render(ctx, targetWidth, targetHeight, 0, duration, params);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(targetWidth / 2, 0, targetWidth / 2, targetHeight);
      ctx.clip();
      activeTemplate.render(ctx, targetWidth, targetHeight, duration - 0.01, duration, params);
      ctx.restore();

      // Divider line
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(targetWidth / 2, 0);
      ctx.lineTo(targetWidth / 2, targetHeight);
      ctx.stroke();
    } else {
      activeTemplate.render(ctx, targetWidth, targetHeight, currentTime, duration, params);
    }

    // Film Grain
    if (params.noiseIntensity > 0) {
      applyFilmGrain(ctx, targetWidth, targetHeight, params.noiseIntensity);
    }

  }, [currentTime, activeTemplate, params, targetWidth, targetHeight, duration, showSeamChecker]);

  return (
    <div className="relative flex-1 bg-slate-950 flex flex-col items-center justify-center overflow-hidden p-4 select-none">
      {/* Top Viewport Toolbar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Active Template Badge */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg shadow-xl">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-200">{activeTemplate.name}</span>
          <span className="text-[10px] text-slate-400 uppercase font-mono">[{targetWidth}x{targetHeight}]</span>
        </div>

        {/* Viewport Guides & Toggles */}
        <div className="pointer-events-auto flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-lg shadow-xl">
          <button
            id="btn-toggle-safe-margins"
            onClick={() => setShowSafeMargins(!showSafeMargins)}
            title="Title Safe Margins (Broadcast standard)"
            className={`p-1.5 rounded-md transition-all ${
              showSafeMargins ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
          </button>

          <button
            id="btn-toggle-thirds"
            onClick={() => setShowRuleOfThirds(!showRuleOfThirds)}
            title="Rule of Thirds Composition Grid"
            className={`p-1.5 rounded-md transition-all ${
              showRuleOfThirds ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            id="btn-toggle-seam-checker"
            onClick={() => setShowSeamChecker(!showSeamChecker)}
            title="Seamless Loop Inspector (Compares Frame 0 vs End)"
            className={`p-1.5 rounded-md transition-all ${
              showSeamChecker ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 my-auto mx-1" />

          {/* Zoom Level */}
          <button
            id="btn-zoom-out"
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            className="p-1.5 text-slate-400 hover:text-slate-200"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-300 w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
            className="p-1.5 text-slate-400 hover:text-slate-200"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Container Stage */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full h-full max-w-full max-h-full overflow-auto"
      >
        <div
          className="relative transition-all duration-200 shadow-2xl shadow-cyan-950/40 rounded-lg overflow-hidden border border-slate-800"
          style={{
            aspectRatio: `${targetWidth} / ${targetHeight}`,
            maxHeight: zoomLevel === 1 ? '75vh' : 'none',
            maxWidth: zoomLevel === 1 ? '85vw' : 'none',
            transform: `scale(${zoomLevel})`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block bg-black"
          />

          {/* Broadcast Title Safe Margins Overlay */}
          {showSafeMargins && (
            <div className="absolute inset-0 pointer-events-none border border-cyan-500/30 m-[5%]">
              <div className="absolute inset-0 border border-dashed border-amber-500/40 m-[5%]" />
              <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400/70">
                ACTION SAFE (90%) / TITLE SAFE (80%)
              </div>
            </div>
          )}

          {/* Rule of Thirds Grid Overlay */}
          {showRuleOfThirds && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-indigo-500/20">
              <div className="border-r border-b border-indigo-500/20" />
              <div className="border-r border-b border-indigo-500/20" />
              <div className="border-b border-indigo-500/20" />
              <div className="border-r border-b border-indigo-500/20" />
              <div className="border-r border-b border-indigo-500/20" />
              <div className="border-b border-indigo-500/20" />
            </div>
          )}

          {/* Seam Checker Labels */}
          {showSeamChecker && (
            <div className="absolute top-3 left-0 right-0 flex justify-between px-6 pointer-events-none text-[11px] font-bold font-mono">
              <span className="bg-cyan-500 text-slate-950 px-2 py-0.5 rounded shadow">START FRAME (0.0s)</span>
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow">END FRAME ({duration}s)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
