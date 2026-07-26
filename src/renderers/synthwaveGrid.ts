import { MotionParams } from '../types';
import { getLoopProgress, sinLoop, cosLoop, hexToRgba } from '../utils/canvasUtils';

export function renderSynthwaveGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  duration: number,
  params: MotionParams
) {
  const progress = getLoopProgress(time, duration);
  const cx = width / 2;
  const horizonY = height * 0.55;

  // Sky Gradient (Dark Purple to Deep Crimson)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, params.bgColor);
  skyGrad.addColorStop(1, hexToRgba(params.secondaryColor, 0.4));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, horizonY);

  // Ground Base
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  ctx.save();
  ctx.globalCompositeOperation = params.blendMode;

  // 1. Neon Retro Sun on Horizon
  const sunRadius = Math.min(width, height) * 0.2 * params.zoomScale;
  const sunY = horizonY - sunRadius * 0.2;

  ctx.save();
  ctx.shadowColor = params.primaryColor;
  ctx.shadowBlur = (params.glowIntensity / 100) * 50;

  const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
  sunGrad.addColorStop(0, params.accentColor);
  sunGrad.addColorStop(0.5, params.primaryColor);
  sunGrad.addColorStop(1, params.secondaryColor);

  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(cx, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // Sun Horizontal Blinds Cutouts
  ctx.fillStyle = params.bgColor;
  const blindCount = 8;
  for (let i = 0; i < blindCount; i++) {
    const bY = sunY + (i / blindCount) * sunRadius;
    const bHeight = 2 + i * 1.5;
    ctx.fillRect(cx - sunRadius * 1.2, bY, sunRadius * 2.4, bHeight);
  }
  ctx.restore();

  // 2. 3D Perspective Wireframe Grid
  ctx.shadowColor = params.glowColor;
  ctx.shadowBlur = (params.glowIntensity / 100) * 15;
  ctx.strokeStyle = params.primaryColor;
  ctx.lineWidth = params.lineThickness;

  // Perspective Vertical Lines emanating from vanishing point
  const vLines = 28;
  ctx.beginPath();
  for (let i = -vLines / 2; i <= vLines / 2; i++) {
    const startX = cx + i * (width / vLines) * 3;
    ctx.moveTo(cx, horizonY);
    ctx.lineTo(startX, height);
  }
  ctx.stroke();

  // Moving Horizontal Grid Lines
  const hLineCount = 18;
  const speedCycles = Math.max(1, Math.round(params.speed * 2));
  const speedProgress = (progress * speedCycles) % 1;

  ctx.beginPath();
  for (let i = 0; i < hLineCount; i++) {
    // Exponential perspective spacing formula
    const p = (i + speedProgress) / hLineCount;
    const pExp = Math.pow(p, 2.5);
    const y = horizonY + pExp * (height - horizonY);

    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 3. Horizon Glow Accent Bar
  const hGlow = ctx.createLinearGradient(0, horizonY - 10, 0, horizonY + 10);
  hGlow.addColorStop(0, 'transparent');
  hGlow.addColorStop(0.5, hexToRgba(params.primaryColor, 0.8));
  hGlow.addColorStop(1, 'transparent');

  ctx.fillStyle = hGlow;
  ctx.fillRect(0, horizonY - 10, width, 20);

  // 4. Retro Starfield in Sky
  const starCount = Math.floor(params.particleCount * 0.5);
  ctx.fillStyle = params.accentColor;
  for (let s = 0; s < starCount; s++) {
    const sx = ((s * 137.5) % width);
    const sy = ((s * 93.3) % (horizonY - 20));
    const twinkle = sinLoop(progress * 2 + s, 1) * 0.5 + 0.5;
    ctx.globalAlpha = twinkle * 0.8;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  ctx.restore();
}
