import { MotionParams } from '../types';
import { getLoopProgress, sinLoop, cosLoop, hexToRgba } from '../utils/canvasUtils';

export function renderQuantumVortex(
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

  // Cosmic Deep Space Background
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = params.blendMode;

  const maxRadius = Math.max(width, height) * 0.7 * params.zoomScale;
  const pCount = Math.min(params.particleCount * 2, 800);

  // Core Glowing Energy Portal
  ctx.shadowColor = params.glowColor;
  ctx.shadowBlur = (params.glowIntensity / 100) * 40;

  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.3);
  coreGrad.addColorStop(0, hexToRgba(params.accentColor, 0.9));
  coreGrad.addColorStop(0.4, hexToRgba(params.primaryColor, 0.4));
  coreGrad.addColorStop(1, 'transparent');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Spiraling Vortex Particles with Speed Motion Trails
  ctx.lineWidth = params.lineThickness;
  const speedCycles = Math.max(1, Math.round(params.speed));

  for (let i = 0; i < pCount; i++) {
    const seed = i * 1337;
    // Radial spiral inward / outward seamless loop
    const normP = (progress * speedCycles + (seed % 100) / 100) % 1;

    const r = normP * maxRadius;
    const rotSpeedInt = Math.max(1, Math.round(params.rotationSpeed || 1));
    const spiralAngle = normP * Math.PI * 2 * 6 * rotSpeedInt + (seed % 360) * (Math.PI / 180);

    const x = cx + Math.cos(spiralAngle) * r;
    const y = cy + Math.sin(spiralAngle) * r;

    // Previous point for motion trail
    const prevNormP = Math.max(0, normP - 0.02);
    const prevR = prevNormP * maxRadius;
    const prevAngle = prevNormP * Math.PI * 2 * 6 * rotSpeedInt + (seed % 360) * (Math.PI / 180);
    const prevX = cx + Math.cos(prevAngle) * prevR;
    const prevY = cy + Math.sin(prevAngle) * prevR;

    const alpha = Math.sin(normP * Math.PI) * 0.9;
    const isAccent = i % 4 === 0;

    // Draw Motion Trail Line
    ctx.strokeStyle = hexToRgba(isAccent ? params.accentColor : params.primaryColor, alpha);
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Particle Head Point
    ctx.fillStyle = isAccent ? params.accentColor : params.secondaryColor;
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }

  // Speed Burst Energy Rings
  const ringCount = 3;
  for (let r = 0; r < ringCount; r++) {
    const ringProgress = (progress * params.speed + r / ringCount) % 1;
    const ringR = ringProgress * maxRadius * 0.8;
    const ringAlpha = (1 - ringProgress) * 0.5;

    ctx.strokeStyle = hexToRgba(params.primaryColor, ringAlpha);
    ctx.lineWidth = params.lineThickness * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
