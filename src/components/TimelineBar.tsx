import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Clock, 
  Activity,
  Gauge
} from 'lucide-react';
import { TimelineState } from '../types';

interface TimelineBarProps {
  timeline: TimelineState;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onStepFrame: (direction: -1 | 1) => void;
  onToggleLoop: () => void;
  onChangeDuration: (duration: number) => void;
  onChangeSpeed: (speed: number) => void;
  fps: number;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  timeline,
  onTogglePlay,
  onSeek,
  onStepFrame,
  onToggleLoop,
  onChangeDuration,
  onChangeSpeed,
  fps,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timeline.currentTime / timeline.totalDuration) * 100;

  return (
    <div id="timeline-bar" className="h-20 bg-slate-900 border-t border-slate-800 text-slate-200 px-4 flex flex-col justify-center select-none z-20">
      {/* Top Scrubber Track */}
      <div className="relative w-full flex items-center mb-2">
        <input
          id="timeline-scrubber"
          type="range"
          min={0}
          max={timeline.totalDuration}
          step={0.01}
          value={timeline.currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
        />
        {/* Glowing Progress Indicator Overlay */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-l-lg pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Control Actions & Telemetry Bar */}
      <div className="flex items-center justify-between text-xs">
        {/* Playback Transport Buttons */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-step-backward"
            onClick={() => onStepFrame(-1)}
            title="Step 1 Frame Back (1/60s)"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-all"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            id="btn-toggle-play"
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-400/20 transition-all"
          >
            {timeline.isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
          </button>

          <button
            id="btn-step-forward"
            onClick={() => onStepFrame(1)}
            title="Step 1 Frame Forward (1/60s)"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-all"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            id="btn-toggle-loop"
            onClick={onToggleLoop}
            className={`p-1.5 rounded-md transition-all ${
              timeline.isLooping ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Seamless Loop Mode"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Time & Frame Counter */}
          <div className="flex items-center space-x-2 font-mono ml-2 px-2 py-1 bg-slate-950 rounded border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-100 font-semibold">{formatTime(timeline.currentTime)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatTime(timeline.totalDuration)}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-[11px]">FRAME {timeline.currentFrame}/{timeline.totalFrames}</span>
          </div>
        </div>

        {/* Middle Duration Presets */}
        <div className="hidden md:flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium px-2">Duration:</span>
          {[5, 8, 10, 15].map((sec) => (
            <button
              key={sec}
              id={`btn-dur-${sec}s`}
              onClick={() => onChangeDuration(sec)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                timeline.totalDuration === sec
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Right Speed Multiplier & Telemetry */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1" />
            {[0.5, 1, 1.5, 2].map((spd) => (
              <button
                key={spd}
                id={`btn-speed-${spd}x`}
                onClick={() => onChangeSpeed(spd)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-all ${
                  timeline.speedMultiplier === spd
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">{fps} FPS</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{(1000 / Math.max(1, fps)).toFixed(1)}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
