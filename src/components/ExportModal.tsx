import React, { useState } from 'react';
import { MotionTemplate, MotionParams, AspectRatio, ResolutionOption } from '../types';
import { 
  X, 
  Video, 
  Download, 
  Sparkles, 
  Loader2,
  CheckCircle2,
  Gauge,
  Activity
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTemplate: MotionTemplate;
  params: MotionParams;
  duration: number;
  aspectRatio: AspectRatio;
  resolution: ResolutionOption;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  targetFps?: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeTemplate,
  duration,
  aspectRatio,
  resolution,
  canvasRef,
  targetFps = 60,
}) => {
  const [bitrate, setBitrate] = useState<number>(25000000); // 25 Mbps
  const [exportFormat, setExportFormat] = useState<'mp4' | 'mov' | 'webm'>('mp4');
  const [exportFps, setExportFps] = useState<30 | 60>((targetFps === 30 ? 30 : 60) as 30 | 60);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedUrls, setRecordedUrls] = useState<{ mp4: string | null; mov: string | null; webm: string | null }>({
    mp4: null,
    mov: null,
    webm: null,
  });

  if (!isOpen) return null;

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
    const stream = canvas.captureStream(exportFps);
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

  return (
    <div id="export-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Export Video Studio (MP4 / MOV / WebM)</h2>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Exporter Form */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Microstock Video Renderer
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pilih format output video (MP4, MOV, WebM), Frame Rate (30 FPS / 60 FPS), dan Bitrate untuk hasil rendering microstock kualitas tinggi.
            </p>
            <div className="pt-1 flex items-center space-x-3 text-xs font-mono text-cyan-400">
              <span>RES: {resolution.toUpperCase()} [{aspectRatio}]</span>
              <span>•</span>
              <span>DURASI: {duration} DETIK</span>
            </div>
          </div>

          {/* Target FPS Selector */}
          <div>
            <span className="text-slate-400 text-xs block mb-1.5 font-semibold flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Frame Rate (FPS)</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { fps: 30, label: '30 FPS', desc: 'Standard Broadcast & Microstock Web' },
                { fps: 60, label: '60 FPS', desc: 'Ultra Smooth Motion Graphics' },
              ].map((f) => (
                <button
                  key={f.fps}
                  id={`btn-fps-${f.fps}`}
                  onClick={() => setExportFps(f.fps as 30 | 60)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    exportFps === f.fps
                      ? 'bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="font-extrabold text-xs font-mono">{f.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{f.desc}</div>
                </button>
              ))}
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

          {/* Bitrate Selector */}
          <div>
            <span className="text-slate-400 text-xs block mb-1 font-semibold flex items-center space-x-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Encoding Bitrate</span>
            </span>
            <select
              id="select-bitrate"
              value={bitrate}
              onChange={(e) => setBitrate(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              <option value={15000000}>15 Mbps - Standard Web</option>
              <option value={25000000}>25 Mbps - High Quality Microstock</option>
              <option value={50000000}>50 Mbps - Master Pro Res</option>
              <option value={80000000}>80 Mbps - Ultra 4K Broadcast</option>
            </select>
          </div>

          {/* Recording Progress Bar */}
          {isRecording && (
            <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-cyan-500/30">
              <div className="flex justify-between text-xs font-mono font-bold text-cyan-400">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>RECORDING STREAM ({exportFormat.toUpperCase()} @ {exportFps} FPS)...</span>
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
                <span>Microstock Video Clip Encoded Successfully! ({exportFps} FPS)</span>
              </div>
              <video src={recordedVideoUrl} controls className="w-full rounded-lg max-h-48 bg-black" />

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">PILIH FORMAT DOWNLOAD:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <a
                    id="btn-download-mp4"
                    href={recordedUrls.mp4 || recordedVideoUrl}
                    download={`${activeTemplate.id}_stock_${exportFps}fps.mp4`}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD MP4</span>
                  </a>

                  <a
                    id="btn-download-mov"
                    href={recordedUrls.mov || recordedVideoUrl}
                    download={`${activeTemplate.id}_stock_${exportFps}fps.mov`}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD MOV</span>
                  </a>

                  <a
                    id="btn-download-webm"
                    href={recordedUrls.webm || recordedVideoUrl}
                    download={`${activeTemplate.id}_stock_${exportFps}fps.webm`}
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
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <Video className="w-4 h-4 text-cyan-300" />
              <span>START CANVAS VIDEO RECORDING ({duration}s @ {exportFps} FPS)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
