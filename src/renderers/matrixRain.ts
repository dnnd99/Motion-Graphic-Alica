import { MotionParams } from '../types';
import { getLoopProgress, hexToRgba } from '../utils/canvasUtils';

const GLYPHS = '0123456789ABCDEF⌘⌥⌬⍟⎍⍛⏣⚡︎⚡︎';

export function renderMatrixRain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  duration: number,
  params: MotionParams
) {
  const progress = getLoopProgress(time, duration);

  // Deep Matrix Dark Background
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = params.blendMode;

  const fontSize = Math.floor(18 * params.zoomScale);
  ctx.font = `700 ${fontSize}px monospace`;

  const columns = Math.floor(width / (fontSize * 1.2));

  ctx.shadowColor = params.glowColor;
  ctx.shadowBlur = (params.glowIntensity / 100) * 15;

  for (let c = 0; c < columns; c++) {
    const columnSeed = c * 713;
    const colSpeed = 1 + (columnSeed % 5) * 0.25;
    const colCycles = Math.max(1, Math.round(colSpeed * params.speed * 2));
    const colProgress = (progress * colCycles + (columnSeed % 100) / 100) % 1;

    const streamLength = 14 + (columnSeed % 10);
    const headY = colProgress * (height + streamLength * fontSize);

    for (let i = 0; i < streamLength; i++) {
      const charY = headY - i * fontSize;
      if (charY < -fontSize || charY > height + fontSize) continue;

      const charX = c * fontSize * 1.2 + 10;
      const charIndex = Math.floor((c * 17 + i * 3 + Math.floor(progress * 100)) % GLYPHS.length);
      const char = GLYPHS[charIndex];

      const isHead = i === 0;
      const tailAlpha = Math.pow(1 - i / streamLength, 1.5);

      if (isHead) {
        ctx.fillStyle = params.accentColor;
      } else {
        ctx.fillStyle = hexToRgba(params.primaryColor, tailAlpha * 0.85);
      }

      ctx.fillText(char, charX, charY);
    }
  }

  ctx.restore();
}
