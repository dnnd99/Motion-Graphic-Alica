// Canvas Motion Utilities & Seamless Looping Helpers

export function getLoopProgress(time: number, duration: number): number {
  const t = time % duration;
  return t < 0 ? (t + duration) / duration : t / duration;
}

export function sinLoop(progress: number, multiplier = 1, phase = 0): number {
  return Math.sin(progress * Math.PI * 2 * multiplier + phase);
}

export function cosLoop(progress: number, multiplier = 1, phase = 0): number {
  return Math.cos(progress * Math.PI * 2 * multiplier + phase);
}

// Simple fast Simplex-like Perlin noise implementation for 2D/3D procedural generation
class SimplexNoise {
  private p: number[] = new Array(512);

  constructor() {
    const permutation = [
      151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
      8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
      35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
      134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
      55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
      18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
      250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
      189,28,42,223,183,170,213,119,248,152,2,44,145,31,179,228,167,215,221,133,11,
      50,184,185,178,162,112,238,205,12,176,172,121,113,101,31,153,155,39,127,156,
      191,29,138,210,66,181,150,114,141,192,183,43,170,213,119,248,152,2,44,145,31,
      115,108,129,157,34,84,251,97,67,242,239,235,110,22,171,214,163,81,14,24,19,
      106,82,218,249,254,164,241,51,204,128,222,13,195,243,193,236,246,144,224,154,140
    ];
    for (let i = 0; i < 256; i++) {
      this.p[i] = permutation[i];
      this.p[256 + i] = permutation[i];
    }
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = x * x * x * (x * (x * 6 - 15) + 10);
    const v = y * y * y * (y * (y * 6 - 15) + 10);
    const A = this.p[X] + Y;
    const B = this.p[X + 1] + Y;

    return this.lerp(
      v,
      this.lerp(u, this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y)),
      this.lerp(
        u,
        this.grad(this.p[A + 1], x, y - 1),
        this.grad(this.p[B + 1], x - 1, y - 1)
      )
    );
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

export const noiseGen = new SimplexNoise();

// Render cinematic film grain overlay
export function applyFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  if (intensity <= 0) return;
  const grainSize = 2;
  const alpha = (intensity / 100) * 0.12;
  ctx.save();
  ctx.fillStyle = '#ffffff';

  // Generate random static noise points
  const count = Math.floor((width * height) / 300 * (intensity / 50));
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.globalAlpha = Math.random() * alpha;
    ctx.fillRect(x, y, grainSize, grainSize);
  }
  ctx.restore();
}

// Convert hex color to RGBA string
export function hexToRgba(hex: string, alpha = 1): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
