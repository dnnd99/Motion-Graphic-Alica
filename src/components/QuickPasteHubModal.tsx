import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  GripVertical, 
  Clipboard, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Trash2, 
  Code2, 
  Sparkles,
  Info,
  Wand2,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { lintAndCompileCanvasCode, LintResult } from '../utils/codeLinter';

interface QuickPasteHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenderCustomCode: (code: string, compiledFn: any) => void;
  currentCode?: string;
}

export type PanelSize = 'SM' | 'MD' | 'LG' | 'XL';

const PRESET_PROMPTS = [
  'Galaxy Sci-Fi Portal dengan partikel nebula glowing warna neon cyan dan magenta',
  'Matrix Digital Rain berkilau hijau neon dengan simbol bergerak dinamis',
  'Gelombang Fluid Synesthesia audio visualizer warna gradient gold dan electric blue',
  'Vortex Geometri Abstrak 3D berputar cepat dengan efek bayangan glowing blur',
  'Firefly Energy Orbs melayang halus di latar belakang hitam dengan kilatan cahaya',
];

const DEFAULT_DRAW_CODE = `function draw(ctx, time, width, height) {
  const t = time;
  const duration = 5;
  const sceneCount = 1;
  const loopT = t % duration;
  const sceneDuration = duration / sceneCount;
  const currentScene = Math.floor(loopT / sceneDuration);

  // Clear & Background
  ctx.fillStyle = '#0a0d1a';
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.22;

  // Rotating outer ring
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.5);

  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 20;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const r = radius * (1 + 0.15 * Math.sin(t * 2 + i));
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Inner pulsing core
  ctx.rotate(-t * 1.2);
  ctx.strokeStyle = '#8000ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#d000ff';
  ctx.shadowBlur = 25;

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.55 * (1 + 0.1 * Math.sin(t * 4)), 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  // Floating Particles
  ctx.fillStyle = '#00f0ff';
  for (let i = 0; i < 30; i++) {
    const pAngle = (i / 30) * Math.PI * 2 + t * 0.3;
    const pDist = radius * 1.4 + Math.sin(t * 3 + i) * 30;
    const px = cx + Math.cos(pAngle) * pDist;
    const py = cy + Math.sin(pAngle) * pDist;
    const size = 2 + Math.sin(t * 5 + i) * 1.5;

    ctx.beginPath();
    ctx.arc(px, py, Math.max(1, size), 0, Math.PI * 2);
    ctx.fill();
  }
}`;

export const QuickPasteHubModal: React.FC<QuickPasteHubModalProps> = ({
  isOpen,
  onClose,
  onRenderCustomCode,
  currentCode,
}) => {
  const [code, setCode] = useState<string>(currentCode || DEFAULT_DRAW_CODE);
  const [panelSize, setPanelSize] = useState<PanelSize>('MD');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [lintResult, setLintResult] = useState<LintResult>({
    issues: [],
    issueCount: 0,
    isValid: true,
    compiledFn: null,
  });

  // Draggable window state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Synchronize initial code
  useEffect(() => {
    if (currentCode) {
      setCode(currentCode);
    }
  }, [currentCode]);

  // Run auto-lint analyzer on code change
  useEffect(() => {
    const res = lintAndCompileCanvasCode(code);
    setLintResult(res);
  }, [code]);

  // Dragging logic for "GESER & ATUR"
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: initialPosRef.current.x + dx,
      y: initialPosRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  // AI Code Generation Handler — starts a background job then polls for the
  // result. Avoids Netlify's 10s synchronous function timeout, since Gemini
  // can take longer than that to write a full animation.
  const handleGenerateAiCode = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    setAiError(null);

    const jobId = (crypto as any).randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const startResponse = await fetch('/api/generate-canvas-code-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, jobId }),
      });

      if (!startResponse.ok && startResponse.status !== 202) {
        throw new Error('Gagal memulai proses generate AI');
      }

      const maxAttempts = 60; // ~90s total (1.5s interval)
      let result: any = null;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 1500));

        const statusResponse = await fetch(`/api/generate-canvas-code-status?jobId=${jobId}`);
        const statusData = await statusResponse.json();

        if (statusData.status === 'done') {
          result = statusData;
          break;
        }
        if (statusData.status === 'error') {
          throw new Error(statusData.error || 'Gagal membuat kode dari AI');
        }
        // status 'pending' -> keep polling
      }

      if (!result) {
        throw new Error('Proses generate AI terlalu lama, coba lagi dengan prompt yang lebih sederhana');
      }

      if (result.code && result.code.trim()) {
        setCode(result.code.trim());
      } else {
        throw new Error('Tidak ada respon kode yang dihasilkan AI');
      }
    } catch (err: any) {
      setAiError(err.message || 'Terjadi kesalahan server saat generate AI');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handle Clipboard Paste
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setCode(text);
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  // Clear Code
  const handleClearCode = () => {
    setCode('');
  };

  // Render Preview
  const handleRenderPreview = () => {
    const res = lintAndCompileCanvasCode(code);
    if (res.isValid && res.compiledFn) {
      onRenderCustomCode(code, res.compiledFn);
      onClose();
    } else {
      // Force compile attempt anyway with safe error handling
      const resFallback = lintAndCompileCanvasCode(code);
      onRenderCustomCode(code, resFallback.compiledFn);
      onClose();
    }
  };

  // Panel size width classes
  const getSizeWidthClass = () => {
    switch (panelSize) {
      case 'SM':
        return 'w-full max-w-[420px]';
      case 'MD':
        return 'w-full max-w-[580px]';
      case 'LG':
        return 'w-full max-w-[750px]';
      case 'XL':
        return 'w-full max-w-[920px]';
      default:
        return 'w-full max-w-[580px]';
    }
  };

  return (
    <div 
      id="quick-paste-hub-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 select-none overflow-auto"
    >
      <div
        ref={panelRef}
        id="quick-paste-hub-panel"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        className={`${getSizeWidthClass()} bg-[#0b0c16] border border-indigo-900/60 rounded-2xl shadow-2xl shadow-indigo-950/80 text-slate-100 flex flex-col overflow-hidden transition-all duration-150`}
      >
        {/* Panel Header (Draggable) */}
        <div 
          onMouseDown={handleMouseDown}
          className="p-3.5 bg-[#0f1020] border-b border-indigo-900/40 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-[#131428] transition-colors"
        >
          <div className="flex items-center space-x-2">
            <GripVertical className="w-4 h-4 text-slate-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 animate-pulse" />
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-200 flex items-center space-x-1.5">
              <span>QUICK PASTE HUB</span>
              <span className="text-[10px] font-bold text-indigo-400/80">(GESER & ATUR)</span>
            </h2>
          </div>

          <button
            id="btn-close-paste-hub"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[84vh] custom-scrollbar">
          {/* AI Canvas Code Generator (Interactive Prompt Editor) */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 via-[#0a0d1d] to-purple-950/30 border border-purple-500/30 rounded-xl space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wand2 className="w-4 h-4 text-purple-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-200 font-mono flex items-center space-x-1">
                  <span>PROMPT PEMBUAT KODE CANVAS AI</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">GEMINI AI</span>
                </h3>
              </div>
            </div>

            {/* Prompt Input Area */}
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  id="textarea-ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ketik deskripsi animasi visual yang Anda inginkan (misal: 'Buatkan efek portal cosmos neon cyan dengan partikel melingkar berputar')..."
                  rows={2}
                  className="w-full p-2.5 bg-[#060712] border border-purple-900/60 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none transition-colors select-text"
                />

                <button
                  id="btn-generate-ai-code"
                  onClick={handleGenerateAiCode}
                  disabled={isGeneratingAi || !aiPrompt.trim()}
                  className="w-full mt-2 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>MEMBUAT KODE CANVAS DENGAN GEMINI AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>GENERATE KODE CANVAS AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preset Prompt Suggestions */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  <span>Rekomendasi Prompt Cepat:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PROMPTS.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setAiPrompt(preset)}
                      className="px-2 py-1 bg-slate-900/80 hover:bg-purple-950/60 border border-purple-900/40 hover:border-purple-500/50 rounded-md text-[10px] text-slate-300 hover:text-purple-200 transition-colors text-left"
                    >
                      {preset.substring(0, 42)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Error Alert */}
              {aiError && (
                <div className="p-2 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs font-mono">
                  ⚠️ {aiError}
                </div>
              )}
            </div>
          </div>

          {/* Label Instruction */}
          <div>
            <label className="text-[11px] font-extrabold tracking-wider text-slate-300 block mb-2 font-mono uppercase">
              KETIK ATAU TEMPEL FUNGSI DRAW(CTX, TIME, W, H) ANDA DI SINI:
            </label>

            {/* Code Textarea Wrapper with Floating Paste Button */}
            <div className="relative rounded-xl border border-indigo-900/60 bg-[#070810] overflow-hidden focus-within:border-cyan-500/70 transition-colors shadow-inner">
              <textarea
                id="textarea-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="function draw(ctx, time, width, height) { ... }"
                rows={panelSize === 'SM' ? 7 : panelSize === 'MD' ? 9 : panelSize === 'LG' ? 12 : 15}
                spellCheck={false}
                className="w-full p-3.5 bg-transparent text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none resize-y leading-relaxed select-text custom-scrollbar"
              />

              {/* Paste Button floating top-right */}
              <button
                id="btn-paste-code"
                onClick={handlePasteFromClipboard}
                className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/50 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Clipboard className="w-3.5 h-3.5 text-cyan-300" />
                <span>PASTE</span>
              </button>
            </div>
          </div>

          {/* AUTO-LINT ANALYZER Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 font-mono">
                  AUTO-LINT ANALYZER
                </h3>
              </div>

              {/* Issue Count Badge */}
              <div
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border font-mono ${
                  lintResult.issueCount > 0
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                }`}
              >
                {lintResult.issueCount > 0 ? `${lintResult.issueCount} ISSUES` : 'NO ISSUES - VALID'}
              </div>
            </div>

            {/* Lint Issues Box */}
            <div className="bg-[#05060d] border border-indigo-900/40 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 font-mono text-xs custom-scrollbar">
              {lintResult.issues.length === 0 ? (
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-sans">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kode fungsi draw() valid dan tidak ada peringatan syntax.</span>
                </div>
              ) : (
                lintResult.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-xs space-y-1 ${
                      issue.type === 'ERROR'
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                        : issue.type === 'WARNING'
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                        : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span className="flex items-center space-x-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                            issue.type === 'ERROR'
                              ? 'bg-rose-500 text-slate-950'
                              : issue.type === 'WARNING'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-indigo-500 text-slate-950'
                          }`}
                        >
                          {issue.type}
                        </span>
                        {issue.line && <span>Line {issue.line}:</span>}
                        <span>{issue.message}</span>
                      </span>
                    </div>

                    {issue.codeSnippet && (
                      <div className="p-1.5 bg-black/40 rounded text-[11px] font-mono text-slate-300 truncate select-text">
                        "{issue.codeSnippet}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* UKURAN PANEL Size Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-indigo-900/30">
            <span className="text-[11px] font-black tracking-wider text-slate-400 font-mono uppercase">
              UKURAN PANEL:
            </span>

            <div className="flex items-center space-x-1 bg-[#060712] p-1 rounded-xl border border-indigo-900/50">
              {(['SM', 'MD', 'LG', 'XL'] as PanelSize[]).map((size) => (
                <button
                  key={size}
                  id={`btn-panel-size-${size}`}
                  onClick={() => setPanelSize(size)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    panelSize === size
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-between pt-2 space-x-3">
            <button
              id="btn-clear-code"
              onClick={handleClearCode}
              className="px-5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR</span>
            </button>

            <button
              id="btn-render-preview"
              onClick={handleRenderPreview}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>RENDER PREVIEW</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

