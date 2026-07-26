import { MotionParams } from '../types';
import { getLoopProgress, sinLoop, cosLoop, hexToRgba } from '../utils/canvasUtils';

export function renderCyberHud(
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
  const minDim = Math.min(width, height);
  const baseRadius = (minDim * 0.35) * params.zoomScale;

  // Background Fill
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = params.blendMode;

  // 1. Grid lines overlay
  ctx.strokeStyle = hexToRgba(params.primaryColor, 0.08);
  ctx.lineWidth = params.lineThickness;
  const gridSize = 50 * params.zoomScale;
  ctx.beginPath();
  for (let x = 0; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 2. Main Outer HUD Ring with Ticks
  const rot1 = progress * Math.PI * 2 * params.rotationSpeed;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot1);

  ctx.shadowColor = params.glowColor;
  ctx.shadowBlur = (params.glowIntensity / 100) * 20;

  ctx.strokeStyle = params.primaryColor;
  ctx.lineWidth = params.lineThickness * 1.5;
  
  // Dashed Circle
  ctx.beginPath();
  ctx.setLineDash([12, 18]);
  ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ticks around outer ring
  const tickCount = 60;
  for (let i = 0; i < tickCount; i++) {
    const angle = (i / tickCount) * Math.PI * 2;
    const isMajor = i % 5 === 0;
    const len = isMajor ? 16 : 8;
    const r1 = baseRadius + 8;
    const r2 = r1 + len;
    
    ctx.strokeStyle = isMajor ? params.accentColor : hexToRgba(params.secondaryColor, 0.6);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
    ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Counter-rotating Secondary Ring
  const rot2 = -progress * Math.PI * 4 * params.rotationSpeed;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot2);

  const innerRadius = baseRadius * 0.75;
  ctx.strokeStyle = params.secondaryColor;
  ctx.lineWidth = params.lineThickness;

  // Arc segments
  for (let a = 0; a < 3; a++) {
    const startA = (a * Math.PI * 2) / 3 + progress * Math.PI;
    const endA = startA + Math.PI / 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, startA, endA);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Central Target Reticle & Pulsing Core
  const pulseScale = 1 + sinLoop(progress, 2) * 0.08;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulseScale, pulseScale);

  // Core glow circle
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.4);
  grad.addColorStop(0, hexToRgba(params.glowColor, 0.6));
  grad.addColorStop(0.5, hexToRgba(params.primaryColor, 0.2));
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Crosshairs
  ctx.strokeStyle = params.accentColor;
  ctx.lineWidth = params.lineThickness * 1.2;
  const chSize = baseRadius * 0.3;
  ctx.beginPath();
  ctx.moveTo(-chSize, 0); ctx.lineTo(-chSize * 0.4, 0);
  ctx.moveTo(chSize * 0.4, 0); ctx.lineTo(chSize, 0);
  ctx.moveTo(0, -chSize); ctx.lineTo(0, -chSize * 0.4);
  ctx.moveTo(0, chSize * 0.4); ctx.lineTo(0, chSize);
  ctx.stroke();

  ctx.restore();

  // 5. Floating Telemetry Particles & Data Nodes
  const pCount = Math.min(params.particleCount, 250);
  ctx.fillStyle = params.accentColor;
  for (let i = 0; i < pCount; i++) {
    const pAngle = (i / pCount) * Math.PI * 2 + progress * Math.PI * 2 * (i % 2 === 0 ? 1 : -1) * 0.5;
    const pDist = baseRadius * (0.2 + (i % 5) * 0.25) + sinLoop(progress + i * 0.1, 1) * 15;
    const px = cx + Math.cos(pAngle) * pDist;
    const py = cy + Math.sin(pAngle) * pDist;

    ctx.fillRect(px, py, 3, 3);

    // Occasional connecting lines
    if (i % 8 === 0) {
      ctx.strokeStyle = hexToRgba(params.primaryColor, 0.25);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
  }

  // 6. Corner HUD Data Overlays (Telemetry aesthetics)
  ctx.font = '12px monospace';
  ctx.fillStyle = hexToRgba(params.primaryColor, 0.8);
  const frameNum = Math.floor(progress * 300);
  const angleDeg = ((progress * 360) % 360).toFixed(1);

  ctx.fillText(`SYSTEM STATUS: ONLINE`, 40, 50);
  ctx.fillText(`TARGET_LOCK: LAT ${(37.7749 + sinLoop(progress) * 0.01).toFixed(4)} N`, 40, 70);
  ctx.fillText(`ANGLE_BEARING: ${angleDeg}°`, 40, 90);
  ctx.fillText(`FRAME: ${frameNum} / 300 [LOOP OK]`, width - 240, 50);
  ctx.fillText(`BUFFER: 4K MICROSTOCK READY`, width - 240, 70);

  ctx.restore();
}
