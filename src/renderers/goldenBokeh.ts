import { MotionParams } from '../types';
import { getLoopProgress, sinLoop, cosLoop, hexToRgba } from '../utils/canvasUtils';

export function renderGoldenBokeh(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  duration: number,
  params: MotionParams
) {
  const progress = getLoopProgress(time, duration);
  const cx = width / 2;
  const cy = height / 2;

  // Rich Dark Luxury Background
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = params.blendMode;

  // 1. Ambient Volumetric Light Beams / Sunburst Rays
  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const rayAngle = (i / rayCount) * Math.PI * 2 + progress * Math.PI * 0.2 * params.speed;
    const rayWidth = 0.15 + sinLoop(progress + i * 0.2) * 0.05;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.9);
    grad.addColorStop(0, hexToRgba(params.primaryColor, 0.15));
    grad.addColorStop(0.5, hexToRgba(params.secondaryColor, 0.05));
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, Math.max(width, height), rayAngle - rayWidth, rayAngle + rayWidth);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Large Soft Depth-of-Field Bokeh Orbs
  const bokehCount = Math.floor(Math.min(params.particleCount, 200) * 0.3);
  for (let i = 0; i < bokehCount; i++) {
    const pProgress = (progress + i / bokehCount) % 1;
    const y = height * 1.2 - pProgress * height * 1.4;
    const xOffset = sinLoop(pProgress, 2, i * 0.5) * 80 * params.zoomScale;
    const x = ((i * 137.5) % width) + xOffset;

    const size = (20 + (i % 8) * 12) * params.zoomScale;
    const alpha = Math.sin(pProgress * Math.PI) * 0.35;

    const bGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
    bGrad.addColorStop(0, hexToRgba(params.accentColor, alpha));
    bGrad.addColorStop(0.6, hexToRgba(params.primaryColor, alpha * 0.4));
    bGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Crisp Golden Shimmer Particles
  const particleCount = params.particleCount;
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 997;
    const pProgress = (progress * params.speed + (seed % 100) / 100) % 1;

    // Upward floating motion with gentle horizontal oscillation
    const y = height * 1.1 - pProgress * height * 1.2;
    const xBase = (seed * 31) % width;
    const xWave = sinLoop(pProgress, 3 + (i % 2), i) * 30 * params.zoomScale;
    const x = xBase + xWave;

    const pSize = (1.5 + (seed % 4) * 1.2) * params.zoomScale;
    const shimmer = Math.pow(sinLoop(pProgress * 4 + i, 1), 2);
    const pAlpha = Math.sin(pProgress * Math.PI) * (0.3 + shimmer * 0.7);

    ctx.shadowColor = params.glowColor;
    ctx.shadowBlur = (params.glowIntensity / 100) * 15;

    ctx.fillStyle = hexToRgba(i % 3 === 0 ? params.accentColor : params.primaryColor, pAlpha);
    ctx.beginPath();
    ctx.arc(x, y, pSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Subtle Central Golden Vignette Glow
  const vGrad = ctx.createRadialGradient(cx, cy, height * 0.2, cx, cy, height * 0.8);
  vGrad.addColorStop(0, hexToRgba(params.primaryColor, 0.1));
  vGrad.addColorStop(0.7, 'transparent');
  vGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
