import { MotionParams } from '../types';
import { getLoopProgress, sinLoop, cosLoop, hexToRgba } from '../utils/canvasUtils';

export function renderAbstractWave(
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

  // Dark Canvas
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = params.blendMode;

  const ribbonCount = 8;
  const segmentCount = 60;

  ctx.shadowColor = params.glowColor;
  ctx.shadowBlur = (params.glowIntensity / 100) * 20;

  for (let r = 0; r < ribbonCount; r++) {
    const rProgress = (r / ribbonCount);
    const yCenter = height * (0.2 + rProgress * 0.6);

    ctx.lineWidth = params.lineThickness * (1 + (r % 3) * 0.5);

    const rGrad = ctx.createLinearGradient(0, 0, width, 0);
    rGrad.addColorStop(0, hexToRgba(params.primaryColor, 0.8));
    rGrad.addColorStop(0.5, hexToRgba(params.secondaryColor, 0.9));
    rGrad.addColorStop(1, hexToRgba(params.accentColor, 0.7));

    ctx.strokeStyle = rGrad;
    ctx.beginPath();

    for (let i = 0; i <= segmentCount; i++) {
      const normX = i / segmentCount;
      const x = normX * width;

      // 3-tier sine wave equation for undulating ribbon
      const freq = (params.waveFrequency || 1.5) * Math.PI * 2;
      const wave1 = sinLoop(progress * params.speed + normX * freq / Math.PI, 1, r * 0.4) * 50 * params.zoomScale;
      const wave2 = cosLoop(progress * params.speed * 1.5 + normX * freq * 0.5 / Math.PI, 1, r) * 30 * params.zoomScale;

      const y = yCenter + wave1 + wave2;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Floating Geometry Particles along wave paths
  const particleCount = params.particleCount;
  ctx.fillStyle = params.accentColor;
  for (let p = 0; p < particleCount; p++) {
    const seed = p * 42;
    const pProg = (progress * params.speed + (seed % 100) / 100) % 1;
    const px = pProg * width;
    const ribbonIndex = p % ribbonCount;
    const yCenter = height * (0.2 + (ribbonIndex / ribbonCount) * 0.6);

    const freq = (params.waveFrequency || 1.5) * Math.PI * 2;
    const wave1 = sinLoop(progress * params.speed + (pProg) * freq / Math.PI, 1, ribbonIndex * 0.4) * 50 * params.zoomScale;
    const py = yCenter + wave1;

    ctx.fillRect(px, py, 3, 3);
  }

  ctx.restore();
}
