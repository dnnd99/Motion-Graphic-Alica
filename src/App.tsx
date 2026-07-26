import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TEMPLATES } from './data/templates';
import { COLOR_PALETTES } from './data/palettes';
import { MotionTemplate, MotionParams, AspectRatio, ResolutionOption, TimelineState } from './types';
import { Navbar } from './components/Navbar';
import { ViewportCanvas } from './components/ViewportCanvas';
import { TimelineBar } from './components/TimelineBar';
import { ExportModal } from './components/ExportModal';
import { QuickPasteHubModal } from './components/QuickPasteHubModal';

export default function App() {
  const [activeTemplate, setActiveTemplate] = useState<MotionTemplate>(TEMPLATES[0]);
  const [params, setParams] = useState<MotionParams>({ ...TEMPLATES[0].defaultParams } as MotionParams);
  const [activePaletteId, setActivePaletteId] = useState<string>(COLOR_PALETTES[0].id);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<ResolutionOption>('1080p');

  const [fps, setFps] = useState<number>(60);

  const [timeline, setTimeline] = useState<TimelineState>({
    currentTime: 0,
    totalDuration: TEMPLATES[0].defaultDuration,
    fps: 60,
    isPlaying: true,
    isLooping: true,
    currentFrame: 0,
    totalFrames: TEMPLATES[0].defaultDuration * 60,
    speedMultiplier: 1,
  });

  const [exportModal, setExportModal] = useState<{
    isOpen: boolean;
    tab: 'record' | 'frames' | 'code' | 'metadata';
  }>({
    isOpen: false,
    tab: 'record',
  });

  const [isQuickPasteHubOpen, setIsQuickPasteHubOpen] = useState<boolean>(false);
  const [customUserCode, setCustomUserCode] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Handle Quick Paste Custom Code Render
  const handleRenderCustomCode = (code: string, compiledFn: any) => {
    setCustomUserCode(code);

    const customTemplate: MotionTemplate = {
      id: `custom_paste_${Date.now()}`,
      name: 'Custom Quick Paste Animation',
      category: 'abstract',
      description: 'Custom Canvas draw(ctx, time, width, height) code rendered via Quick Paste Hub.',
      tags: ['custom', 'paste', 'canvas', 'user code', 'script'],
      defaultDuration: 10,
      recommendedFps: 60,
      defaultParams: { ...TEMPLATES[0].defaultParams },
      render: (ctx, width, height, time, duration, p) => {
        if (compiledFn) {
          try {
            compiledFn(ctx, time, width, height, duration, p);
          } catch (err) {
            console.error('Custom code draw execution error:', err);
          }
        }
      },
    };

    setActiveTemplate(customTemplate);
    setTimeline((prev) => ({
      ...prev,
      currentTime: 0,
      currentFrame: 0,
    }));
  };

  // Handle Template Selection
  const handleSelectTemplate = (template: MotionTemplate) => {
    setActiveTemplate(template);
    setParams({ ...template.defaultParams } as MotionParams);
    setTimeline((prev) => ({
      ...prev,
      currentTime: 0,
      totalDuration: template.defaultDuration,
      currentFrame: 0,
      totalFrames: template.defaultDuration * 60,
    }));
  };

  // Handle Palette Selection
  const handleSelectPalette = (paletteId: string) => {
    const palette = COLOR_PALETTES.find((p) => p.id === paletteId);
    if (!palette) return;
    setActivePaletteId(paletteId);
    setParams((prev) => ({
      ...prev,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      accentColor: palette.accent,
      bgColor: palette.bg,
      glowColor: palette.glow,
    }));
  };

  // Handle Param Change
  const handleChangeParam = <K extends keyof MotionParams>(key: K, value: MotionParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Reset Params
  const handleResetParams = () => {
    setParams({ ...activeTemplate.defaultParams } as MotionParams);
  };

  // Timeline Controls
  const handleTogglePlay = () => {
    setTimeline((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(timeline.totalDuration, time));
    setTimeline((prev) => ({
      ...prev,
      currentTime: clamped,
      currentFrame: Math.floor(clamped * 60),
    }));
  };

  const handleStepFrame = (direction: -1 | 1) => {
    const frameTime = 1 / 60;
    const nextTime = timeline.currentTime + direction * frameTime;
    handleSeek(nextTime < 0 ? timeline.totalDuration : nextTime % timeline.totalDuration);
  };

  const handleToggleLoop = () => {
    setTimeline((prev) => ({ ...prev, isLooping: !prev.isLooping }));
  };

  const handleChangeDuration = (dur: number) => {
    setTimeline((prev) => ({
      ...prev,
      totalDuration: dur,
      totalFrames: dur * 60,
      currentTime: Math.min(prev.currentTime, dur),
    }));
  };

  const handleChangeSpeed = (speed: number) => {
    setTimeline((prev) => ({ ...prev, speedMultiplier: speed }));
  };

  // 4K PNG Snapshot Take
  const handleTakeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${activeTemplate.id}_snapshot_4k.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  // Animation Loop Driver
  const updateLoop = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    setTimeline((prev) => {
      if (!prev.isPlaying) return prev;

      let nextTime = prev.currentTime + delta * prev.speedMultiplier;
      if (nextTime >= prev.totalDuration) {
        if (prev.isLooping) {
          nextTime = nextTime % prev.totalDuration;
        } else {
          nextTime = prev.totalDuration;
          return { ...prev, currentTime: nextTime, isPlaying: false, currentFrame: prev.totalFrames };
        }
      }

      return {
        ...prev,
        currentTime: nextTime,
        currentFrame: Math.floor(nextTime * 60),
      };
    });

    animFrameIdRef.current = requestAnimationFrame(updateLoop);
  }, []);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [updateLoop]);

  return (
    <div id="app-root" className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Navbar */}
      <Navbar
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        resolution={resolution}
        setResolution={setResolution}
        activePaletteId={activePaletteId}
        onSelectPalette={handleSelectPalette}
        onOpenExportModal={(tab) => setExportModal({ isOpen: true, tab })}
        onOpenQuickPasteHub={() => setIsQuickPasteHubOpen(true)}
        onTakeSnapshot={handleTakeSnapshot}
        isRecording={false}
        fps={fps}
      />

      {/* Main Studio Workstation Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Stage: Canvas Viewport & Controls */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <ViewportCanvas
            activeTemplate={activeTemplate}
            params={params}
            currentTime={timeline.currentTime}
            duration={timeline.totalDuration}
            aspectRatio={aspectRatio}
            resolution={resolution}
            canvasRef={canvasRef}
            onFpsUpdate={setFps}
          />

          {/* Bottom Timeline Control Bar */}
          <TimelineBar
            timeline={timeline}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onStepFrame={handleStepFrame}
            onToggleLoop={handleToggleLoop}
            onChangeDuration={handleChangeDuration}
            onChangeSpeed={handleChangeSpeed}
            fps={fps}
          />
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModal.isOpen}
        onClose={() => setExportModal({ ...exportModal, isOpen: false })}
        activeTab={exportModal.tab}
        setActiveTab={(tab) => setExportModal({ ...exportModal, tab })}
        activeTemplate={activeTemplate}
        params={params}
        duration={timeline.totalDuration}
        aspectRatio={aspectRatio}
        resolution={resolution}
        canvasRef={canvasRef}
      />

      {/* Quick Paste Hub Modal (Geser & Atur) */}
      <QuickPasteHubModal
        isOpen={isQuickPasteHubOpen}
        onClose={() => setIsQuickPasteHubOpen(false)}
        onRenderCustomCode={handleRenderCustomCode}
        currentCode={customUserCode}
      />
    </div>
  );
}
