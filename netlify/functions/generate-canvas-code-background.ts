import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { GoogleGenAI } from "@google/genai";

const systemInstruction = `Anda adalah pengembang animasi HTML5 Canvas 2D profesional kelas dunia spesialis Stock Motion Graphics Seamless Loop.
Tugas Anda adalah membuat kode JavaScript murni dengan signature tepat:
function draw(ctx, time, width, height) {
  // kode di sini
}

ATURAN MULTI-PASS PERFECT SEAMLESS LOOPING (SANGAT WAJIB):
1. DILARANG KERAS menggunakan 'time' mentah secara langsung di dalam trigonometri Math.sin(time), Math.cos(time), atau ctx.rotate(time)!
   Sebab pada saat time berpindah dari 10.0 kembali ke 0.0 akan terjadi JEDA / LOMPATAN VISUAL (JUMP / POP).
2. TATA CARA MATEMATIKA LULUS SEAMLESS LOOP 100% SOFT:
   Gunakan struktur WAJIB ini di awal fungsi:
   const duration = 10;
   const normT = (time % duration) / duration; // Selalu bergerak mulus 0.0 -> 1.0
   const angle = normT * Math.PI * 2;          // Selalu bergerak mulus 0.0 -> 2*Math.PI (6.28318)

3. SEMUA ROTASI & TRIGO:
   - Gunakan Math.sin(angle * n), Math.cos(angle * n), ctx.rotate(angle * n) dengan 'n' HARUS ANGKA BULAT / INTEGER (seperti 1, 2, 3, 4, 5).
   - Karena sin(0*n) = sin(2*PI*n) = 0, posisi pada t=0s dan t=10s DIPASTIKAN PERSIS SAMA SEHINGGA LOOPING 100% SEAMLESS KONTINU TANPA JEDA!

4. PARTIKEL DENGAN PERGERAKAN LINIER (MISAL TERBANG/MENGAPUNG):
   - Jika partikel bergerak sepanjang sumbu X atau Y, gunakan modulo:
     const posX = (baseX + normT * width) % width;
   - ATAU buat alpha/opacity partikel memudar halus di ujung layar:
     const pAlpha = Math.sin(normT * Math.PI); // Fades in dari 0 pada t=0, puncaknya di pertengahan, dan fade out ke 0 pada t=duration!

5. CONTOH KODE MASTER SEAMLESS LOOPING:
function draw(ctx, time, width, height) {
  const duration = 10;
  const normT = (time % duration) / duration;
  const angle = normT * Math.PI * 2;

  // Background Sci-Fi
  ctx.fillStyle = '#0a0d1a';
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  // Outer Ring Rotasi Seamless (1 putaran penuh per 10s)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle * 1);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 20;
  ctx.strokeRect(-120, -120, 240, 240);
  ctx.restore();

  // Core Pulsa Seamless (3 gelombang per 10s)
  const pulse = Math.sin(angle * 3) * 25;
  ctx.fillStyle = '#ff007f';
  ctx.shadowColor = '#ff007f';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(cx, cy, 60 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Partikel Orbit Seamless
  for (let i = 0; i < 24; i++) {
    const pAngle = (i / 24) * Math.PI * 2 + angle * 2;
    const r = 200 + Math.sin(angle * 2 + i) * 20;
    const px = cx + Math.cos(pAngle) * r;
    const py = cy + Math.sin(pAngle) * r;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

6. Hasil keluaran HANYA berupa kode JavaScript murni tanpa penjelasan atau markdown triple backticks.
7. Bersihkan background di awal dengan warna gelap bergaya sci-fi/motion graphics.
8. Pastikan semua string properti CSS font selalu dibungkus kuotasi string lengkap.`;

// Ambil semua key yang tersedia: GEMINI_API_KEYS="key1,key2,key3" (koma, tanpa spasi)
// juga support GEMINI_API_KEY tunggal biar tetap kompatibel dengan setup lama.
function getApiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS;
  if (multi && multi.trim()) {
    return multi.split(",").map((k) => k.trim()).filter(Boolean);
  }
  const single = process.env.GEMINI_API_KEY;
  return single ? [single.trim()] : [];
}

let rotationCursor = 0;

function isRateLimitOrQuotaError(err: any): boolean {
  const status = err?.status || err?.code || err?.response?.status;
  const msg = String(err?.message || "").toLowerCase();
  return (
    status === 429 ||
    status === 403 ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("permission")
  );
}

export const handler: Handler = async (event) => {
  // Background functions return 202 immediately; this keeps running after
  // that response is sent (up to 15 min), avoiding the 10s sync timeout.
  const store = getStore("canvas-jobs");

  let jobId = "";
  try {
    const body = JSON.parse(event.body || "{}");
    jobId = body.jobId;
    const prompt = body.prompt;

    if (!jobId || !prompt) return;

    await store.setJSON(jobId, { status: "pending" });

    const keys = getApiKeys();
    if (keys.length === 0) {
      await store.setJSON(jobId, { status: "error", error: "GEMINI_API_KEY / GEMINI_API_KEYS environment variable is not configured." });
      return;
    }

    let lastError: any = null;
    let code = "";

    for (let attempt = 0; attempt < keys.length; attempt++) {
      const keyIndex = (rotationCursor + attempt) % keys.length;
      const apiKey = keys[keyIndex];

      try {
        const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 4096,
            thinkingConfig: { thinkingLevel: "LOW" },
          },
        });

        let rawText = response.text || "";
        rawText = rawText.replace(/```javascript/gi, "").replace(/```js/gi, "").replace(/```/g, "").trim();

        if (!rawText) throw new Error("Tidak ada respon kode yang dihasilkan AI");

        code = rawText;
        rotationCursor = (keyIndex + 1) % keys.length;
        break;
      } catch (err: any) {
        lastError = err;
        console.error(`Gemini API error on key #${keyIndex + 1}/${keys.length}:`, err?.message || err);
        if (!isRateLimitOrQuotaError(err)) break;
      }
    }

    if (code) {
      await store.setJSON(jobId, { status: "done", code });
    } else {
      await store.setJSON(jobId, { status: "error", error: lastError?.message || "Gagal membuat kode canvas dari AI" });
    }
  } catch (err: any) {
    console.error("Background generate error:", err);
    if (jobId) {
      await store.setJSON(jobId, { status: "error", error: err?.message || "Terjadi kesalahan server" });
    }
  }
};
