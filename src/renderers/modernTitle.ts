import { MotionParams } from '../types';
import { getLoopProgress, sinLoop, hexToRgba } from '../utils/canvasUtils';

export function renderModernTitle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  duration: number,
  params: MotionParams
) {
  const progress = getLoopProgress(time, duration);

  // Background
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = params.blendMode;

  // Position at lower third or centered based on aspect ratio
  const startX = width * 0.12;
  const startY = height * 0.7;

  // Seamless reveal timeline animation curve:
  // 0.0 - 0.2: Wipe In
  // 0.2 - 0.8: Hold & Subtle Float
  // 0.8 - 1.0: Wipe Out
  let revealProgress = 1;
  if (progress < 0.2) {
    revealProgress = Math.pow(progress / 0.2, 2);
  } else if (progress > 0.8) {
    revealProgress = Math.pow((1 - progress) / 0.2, 2);
  }

  const floatY = sinLoop(progress, 1) * 8;
  const currentY = startY + floatY;

  const titleText = (params.customTitle || 'PRO MOTION GRAPHICS').toUpperCase();
  const subText = (params.customSubtitle || 'PREMIUM MICROSTOCK ASSET COLLECTION').toUpperCase();

  // 1. Accent Gradient Vertical Bar
  const barWidth = 8 * params.zoomScale;
  const barHeight = 85 * params.zoomScale * revealProgress;

  ctx.shadowColor = params.glowColor;
  ctx.shadowBlur = (params.glowIntensity / 100) * 20;

  const barGrad = ctx.createLinearGradient(startX, currentY, startX, currentY + barHeight);
  barGrad.addColorStop(0, params.primaryColor);
  barGrad.addColorStop(1, params.accentColor);

  ctx.fillStyle = barGrad;
  ctx.fillRect(startX, currentY, barWidth, barHeight);

  // 2. Text Reveal Clipping Mask
  ctx.save();
  const maskWidth = (width * 0.75) * revealProgress;
  ctx.beginPath();
  ctx.rect(startX + barWidth + 15, currentY - 10, maskWidth, barHeight + 20);
  ctx.clip();

  // Primary Title Typography
  const titleFontSize = Math.floor(36 * params.zoomScale);
  ctx.font = `800 ${titleFontSize}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = params.primaryColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const titleX = startX + barWidth + 20 + (1 - revealProgress) * -100;
  ctx.fillText(titleText, titleX, currentY + 5);

  // Subtitle Typography & Badge
  const subFontSize = Math.floor(16 * params.zoomScale);
  ctx.font = `600 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = hexToRgba(params.secondaryColor, 0.9);

  const subX = startX + barWidth + 20 + (1 - revealProgress) * -120;
  ctx.fillText(subText, subX, currentY + titleFontSize + 15);

  ctx.restore();

  // 3. Floating Accent Particles
  const pCount = Math.min(params.particleCount, 80);
  ctx.fillStyle = params.accentColor;
  for (let i = 0; i < pCount; i++) {
    const pProg = (progress + i / pCount) % 1;
    const px = startX + (pProg * width * 0.6);
    const py = currentY - 20 + sinLoop(pProg * 2 + i, 1) * 30;
    const alpha = Math.sin(pProg * Math.PI) * revealProgress;

    ctx.globalAlpha = alpha;
    ctx.fillRect(px, py, 2.5, 2.5);
  }

  ctx.restore();
}
