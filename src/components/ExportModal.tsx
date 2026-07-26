import React, { useState } from 'react';
import { MotionTemplate, MotionParams, AspectRatio, ResolutionOption } from '../types';
import { generateStandaloneJsCode } from '../utils/codeExporter';
import JSZip from 'jszip';
import { 
  X, 
  Video, 
  Download, 
  FileCode, 
  Tag, 
  Check, 
  Copy, 
  Layers, 
  Sparkles, 
  Loader2,
  Film,
  CheckCircle2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'record' | 'frames' | 'code' | 'metadata';
  setActiveTab: (tab: 'record' | 'frames' | 'code' | 'metadata') => void;
  activeTemplate: MotionTemplate;
  params: MotionParams;
  duration: number;
  aspectRatio: AspectRatio;
  resolution: ResolutionOption;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  activeTemplate,
  params,
  duration,
  aspectRatio,
  resolution,
  canvasRef,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [bitrate, setBitrate] = useState<number>(25000000); // 25 Mbps
  const [exportFormat, setExportFormat] = useState<'mp4' | 'mov' | 'webm'>('mp4');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedUrls, setRecordedUrls] = useState<{ mp4: string | null; mov: string | null; webm: string | null }>({
    mp4: null,
    mov: null,
    webm: null,
  });

  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  if (!isOpen) return null;

  // Generate Microstock Metadata
  const generateStockTitle = () => {
    const resLabel = resolution.toUpperCase();
    return `${activeTemplate.name} - ${activeTemplate.description.slice(0, 60)} [${resLabel} ${aspectRatio} Seamless Loop]`;
  };

  const generateKeywordsString = () => {
    return activeTemplate.tags.join(', ');
  };

  // Copy Handlers
  const handleCopyCode = () => {
    const code = generateStandaloneJsCode(activeTemplate, params, duration);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyTags = () => {
    const meta = `TITLE: ${generateStockTitle()}\n\nDESCRIPTION: ${activeTemplate.description}\n\nTAGS/KEYWORDS:\n${generateKeywordsString()}`;
    navigator.clipboard.writeText(meta);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  // Helper to check supported MIME type
  const getSupportedMimeType = (format: 'mp4' | 'mov' | 'webm') => {
    if (typeof MediaRecorder === 'undefined') return 'video/webm';
    if (format === 'mp4') {
      const mp4Types = ['video/mp4;codecs=avc1', 'video/mp4;codecs=h264', 'video/mp4'];
      for (const type of mp4Types) {
        if (MediaRecorder.isTypeSupported(type)) return type;
      }
    }
    if (format === 'mov') {
      const movTypes = ['video/quicktime', 'video/mp4;codecs=avc1', 'video/mp4'];
      for (const type of movTypes) {
        if (MediaRecorder.isTypeSupported(type)) return type;
      }
    }
    const webmTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (const type of webmTypes) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'video/webm';
  };

  // Record Video Function
  const handleStartRecord = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setRecordingProgress(0);
    setRecordedVideoUrl(null);
    setRecordedUrls({ mp4: null, mov: null, webm: null });

    const mimeType = getSupportedMimeType(exportFormat);
    const stream = canvas.captureStream(60);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const primaryBlob = new Blob(chunks, { type: mimeType });
      const primaryUrl = URL.createObjectURL(primaryBlob);
      setRecordedVideoUrl(primaryUrl);

      const mp4Blob = new Blob(chunks, { type: 'video/mp4' });
      const movBlob = new Blob(chunks, { type: 'video/quicktime' });
      const webmBlob = new Blob(chunks, { type: 'video/webm' });

      setRecordedUrls({
        mp4: URL.createObjectURL(mp4Blob),
        mov: URL.createObjectURL(movBlob),
        webm: URL.createObjectURL(webmBlob),
      });

      setIsRecording(false);
    };

    mediaRecorder.start();

    // Progress simulation tied to real seconds
    const interval = 100; // ms
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval / 1000;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setRecordingProgress(progress);

      if (elapsed >= duration) {
        clearInterval(timer);
        mediaRecorder.stop();
      }
    }, interval);
  };

  // Export Zip Frame Sequence
  const handleExportPngZip = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsZipping(true);
    setZipProgress(0);

    const zip = new JSZip();
    const folder = zip.folder(`${activeTemplate.id}_frames`);

    const totalFrames = Math.floor(duration * 30); // 30fps image sequence
    const offCtx = canvas.getContext('2d');
    if (!offCtx) return;

    for (let frame = 0; frame < totalFrames; frame++) {
      const time = (frame / totalFrames) * duration;
      activeTemplate.render(offCtx, canvas.width, canvas.height, time, duration, params);

      // Data URL
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

      const frameNumStr = frame.toString().padStart(4, '0');
      folder?.file(`frame_${frameNumStr}.png`, base64Data, { base64: true });

      setZipProgress(Math.round(((frame + 1) / totalFrames) * 100));
      await new Promise((r) => setTimeout(r, 10)); // keep UI responsive
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${activeTemplate.id}_30fps_sequence.zip`;
    link.click();

    setIsZipping(false);
  };

  return (
    <div id="export-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Microstock Export & Code Studio</h2>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 space-x-2">
          {[
            { id: 'record', label: 'Export Video (MP4 / MOV / WebM)', icon: Video },
            { id: 'frames', label: 'PNG Frame Zip', icon: Layers },
            { id: 'code', label: 'JS Canvas Code', icon: FileCode },
            { id: 'metadata', label: 'Stock Tags & SEO', icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`modal-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200 space-y-4">
          {/* TAB 1: RECORD VIDEO */}
          {activeTab === 'record' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Video Recording Settings
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Target Resolution</span>
                    <span className="font-mono text-cyan-300 font-bold">{resolution.toUpperCase()} ({aspectRatio})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Duration</span>
                    <span className="font-mono text-indigo-300 font-bold">{duration} Seconds (60 FPS)</span>
                  </div>
                </div>

                {/* Target Format Selector */}
                <div>
                  <span className="text-slate-400 text-xs block mb-1.5 font-semibold">Format Output Video</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'mp4', label: 'MP4 (.mp4)', desc: 'Standard H.264 / AVC' },
                      { id: 'mov', label: 'MOV (.mov)', desc: 'Apple QuickTime' },
                      { id: 'webm', label: 'WebM (.webm)', desc: 'Microstock VP9' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        id={`btn-format-${fmt.id}`}
                        onClick={() => setExportFormat(fmt.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          exportFormat === fmt.id
                            ? 'bg-gradient-to-br from-indigo-950 to-purple-950 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="font-bold text-xs font-mono">{fmt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-1">Encoding Bitrate</span>
                  <select
                    id="select-bitrate"
                    value={bitrate}
                    onChange={(e) => setBitrate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value={15000000}>15 Mbps (Standard Web)</option>
                    <option value={25000000}>25 Mbps (Stock FHD 1080p Master)</option>
                    <option value={50000000}>50 Mbps (4K Microstock High Bitrate)</option>
                  </select>
                </div>
              </div>

              {/* Progress Bar */}
              {isRecording && (
                <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-cyan-500/30">
                  <div className="flex justify-between text-xs font-mono font-bold text-cyan-400">
                    <span className="flex items-center space-x-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>RECORDING CANVAS STREAM ({exportFormat.toUpperCase()})...</span>
                    </span>
                    <span>{recordingProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Recorded Video Result Download Options */}
              {recordedVideoUrl && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Microstock Video Clip Encoded Successfully!</span>
                  </div>
                  <video src={recordedVideoUrl} controls className="w-full rounded-lg max-h-48 bg-black" />

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 block">PILIH FORMAT DOWNLOAD:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <a
                        id="btn-download-mp4"
                        href={recordedUrls.mp4 || recordedVideoUrl}
                        download={`${activeTemplate.id}_stock_master.mp4`}
                        className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD MP4</span>
                      </a>

                      <a
                        id="btn-download-mov"
                        href={recordedUrls.mov || recordedVideoUrl}
                        download={`${activeTemplate.id}_stock_master.mov`}
                        className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD MOV</span>
                      </a>

                      <a
                        id="btn-download-webm"
                        href={recordedUrls.webm || recordedVideoUrl}
                        download={`${activeTemplate.id}_stock_master.webm`}
                        className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD WEBM</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {!isRecording && !recordedVideoUrl && (
                <button
                  id="btn-start-record-modal"
                  onClick={handleStartRecord}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Video className="w-4 h-4" />
                  <span>START CANVAS RECORDING ({duration}s)</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: FRAME SEQUENCE ZIP */}
          {activeTab === 'frames' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  PNG Frame Sequence Exporter
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Captures a 30 FPS PNG image sequence packed into a zip archive. Compatible with Adobe After Effects, Premiere Pro, and Cinema4D microstock compositing pipelines.
                </p>
                <div className="font-mono text-xs text-indigo-400 pt-2">
                  Total Frames: {Math.floor(duration * 30)} PNG Images
                </div>
              </div>

              {isZipping && (
                <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-amber-500/30">
                  <div className="flex justify-between text-xs font-mono font-bold text-amber-400">
                    <span className="flex items-center space-x-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>GENERATING PNG FRAME SEQUENCE ZIP...</span>
                    </span>
                    <span>{zipProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all"
                      style={{ width: `${zipProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {!isZipping && (
                <button
                  id="btn-generate-png-zip"
                  onClick={handleExportPngZip}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>EXPORT PNG FRAME ZIP</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: STANDALONE JS CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Executable Pure JavaScript Canvas API Snippet
                </span>
                <button
                  id="btn-copy-code"
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold transition-all"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'COPIED!' : 'COPY CODE'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-80 leading-relaxed custom-scrollbar select-text">
                {generateStandaloneJsCode(activeTemplate, params, duration)}
              </pre>
            </div>
          )}

          {/* TAB 4: STOCK METADATA & TAGS */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Stock Title & Tags (SEO Optimized)
                  </h3>
                  <button
                    id="btn-copy-tags"
                    onClick={handleCopyTags}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition-all"
                  >
                    {copiedTags ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTags ? 'COPIED ALL!' : 'COPY METADATA'}</span>
                  </button>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Recommended Stock Title</span>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200 select-text">
                    {generateStockTitle()}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Description</span>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 leading-relaxed select-text">
                    {activeTemplate.description}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Keywords / Tags (Shutterstock / Adobe Stock / Pond5)</span>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-cyan-400 leading-relaxed select-text">
                    {generateKeywordsString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
