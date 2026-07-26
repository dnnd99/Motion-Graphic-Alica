import { MotionParams } from '../types';
import { getLoopProgress, sinLoop, cosLoop, noiseGen, hexToRgba } from '../utils/canvasUtils';

export function renderFluidMesh(
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

  // Background base
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = params.blendMode;

  // Render 4 Organic Morphing Liquid Blobs
  const blobCount = 4;
  const baseRadius = Math.min(width, height) * 0.35 * params.zoomScale;

  const colors = [params.primaryColor, params.secondaryColor, params.accentColor, params.glowColor];

  for (let b = 0; b < blobCount; b++) {
    const angleOffset = (b / blobCount) * Math.PI * 2;
    // Orbit motion seamlessly aligned
    const orbitR = 80 * params.zoomScale;
    const speedMultiplier = Math.max(1, Math.round(params.speed));
    const bx = cx + cosLoop(progress, speedMultiplier, angleOffset) * orbitR;
    const by = cy + sinLoop(progress, speedMultiplier, angleOffset) * orbitR;

    ctx.save();
    ctx.translate(bx, by);

    ctx.shadowColor = colors[b];
    ctx.shadowBlur = (params.glowIntensity / 100) * 40;

    const bGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 1.2);
    bGrad.addColorStop(0, hexToRgba(colors[b], 0.85));
    bGrad.addColorStop(0.5, hexToRgba(colors[(b + 1) % blobCount], 0.4));
    bGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = bGrad;

    // Morphing Organic Vertex Loop
    const points = 36;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const pAngle = (i / points) * Math.PI * 2;
      
      // Seamless noise mapping using sin/cos of loop angle
      const noiseX = Math.cos(pAngle) * 1.5 + cosLoop(progress, 1) * 0.8;
      const noiseY = Math.sin(pAngle) * 1.5 + sinLoop(progress, 1) * 0.8;
      const n = noiseGen.noise2D(noiseX + b * 2, noiseY + b * 2);

      const r = baseRadius * (0.8 + n * 0.35 * (params.waveFrequency || 1));
      const px = Math.cos(pAngle) * r;
      const py = Math.sin(pAngle) * r;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Smooth Overlay Glassmorphism Curve Lines
  ctx.strokeStyle = hexToRgba(params.accentColor, 0.25);
  ctx.lineWidth = params.lineThickness * 1.5;

  const waveLines = 5;
  for (let w = 0; w < waveLines; w++) {
    ctx.beginPath();
    for (let x = 0; x <= width; x += 20) {
      const normX = x / width;
      const yWave = sinLoop(progress + normX * (params.waveFrequency * 2), 1, w * 0.8) * 40 * params.zoomScale;
      const y = height * (0.3 + w * 0.1) + yWave;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}
