export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9';

export type ResolutionOption = '1080p' | '4k' | '720p';

export type BlendMode = 'source-over' | 'screen' | 'lighter' | 'overlay' | 'color-dodge';

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  glow: string;
}

export interface MotionParams {
  speed: number;
  particleCount: number;
  glowIntensity: number;
  noiseIntensity: number;
  lineThickness: number;
  rotationSpeed: number;
  zoomScale: number;
  waveFrequency: number;
  blurDepth: number;
  blendMode: BlendMode;
  customTitle: string;
  customSubtitle: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  glowColor: string;
}

export type TemplateCategory = 'all' | 'backgrounds' | 'hud_vfx' | 'abstract' | 'titles' | 'loops';

export interface MotionTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  tags: string[];
  defaultParams: Partial<MotionParams>;
  defaultDuration: number; // in seconds
  recommendedFps: number;
  render: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number, // in seconds
    duration: number, // total duration in seconds
    params: MotionParams
  ) => void;
}

export interface TimelineState {
  currentTime: number;
  totalDuration: number;
  fps: number;
  isPlaying: boolean;
  isLooping: boolean;
  currentFrame: number;
  totalFrames: number;
  speedMultiplier: number;
}

export interface MicrostockMetadata {
  title: string;
  description: string;
  category: string;
  keywords: string[];
  technicalSpecs: {
    resolution: string;
    fps: number;
    duration: string;
    format: string;
    isSeamlessLoop: boolean;
  };
}
