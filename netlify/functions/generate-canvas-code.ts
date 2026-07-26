import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

const systemInstruction = `Anda adalah ahli pengembang animasi HTML5 Canvas 2D profesional. 
Tugas Anda adalah menghasilkan kode JavaScript murni berupa fungsi lengkap dengan signature persis:
function draw(ctx, time, width, height) {
  // kode animasi di sini
}

Aturan Penting:
1. Hasil keluaran HANYA berupa kode JavaScript murni tanpa penjelasan atau kutipan teks pendamping.
2. Gunakan argumen:
   - ctx: CanvasRenderingContext2D
   - time: detik running time (float, misal 0.0s, 1.5s, dll)
   - width: lebar canvas (px)
   - height: tinggi canvas (px)
3. Animasi harus berjalan lancar, dinamis, visual microstock berkualitas tinggi, bersinar/glowing, warna cerah, mempesona, dan looping mulus berdasarkan variabel 'time'.
4. Selalu bersihkan background di awal (ctx.fillRect atau ctx.clearRect) dengan warna gelap bergaya sci-fi / motion graphics.
5. Pastikan semua properti CSS font string (misal: "16px sans-serif") selalu dibungkus kuotasi string lengkap.`;

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

// Counter di module scope: bertahan selama instance function masih "warm",
// jadi tiap request baru mulai dari key berikutnya (round-robin, bukan selalu key pertama).
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
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt || typeof prompt !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Prompt is required" }) };
    }

    const keys = getApiKeys();
    if (keys.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GEMINI_API_KEY / GEMINI_API_KEYS environment variable is not configured." }),
      };
    }

    let lastError: any = null;

    // Coba tiap key secara berurutan mulai dari posisi rotasi saat ini.
    // Kalau satu key kena rate-limit/quota, otomatis lanjut ke key berikutnya.
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const keyIndex = (rotationCursor + attempt) % keys.length;
      const apiKey = keys[keyIndex];

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } },
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: { systemInstruction, temperature: 0.7 },
        });

        let rawText = response.text || "";
        rawText = rawText.replace(/```javascript/gi, "").replace(/```js/gi, "").replace(/```/g, "").trim();

        // Sukses: geser cursor ke key berikutnya buat request selanjutnya (pemerataan beban).
        rotationCursor = (keyIndex + 1) % keys.length;

        return { statusCode: 200, body: JSON.stringify({ code: rawText }) };
      } catch (err: any) {
        lastError = err;
        console.error(`Gemini API error on key #${keyIndex + 1}/${keys.length}:`, err?.message || err);

        // Kalau bukan error kuota/rate-limit, nggak ada gunanya coba key lain — langsung lempar.
        if (!isRateLimitOrQuotaError(err)) {
          break;
        }
        // Kalau kuota/rate-limit: lanjut ke key berikutnya di iterasi selanjutnya.
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: lastError?.message || "Gagal membuat kode canvas dari AI" }),
    };
  } catch (err: any) {
    console.error("Gemini API error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Gagal membuat kode canvas dari AI" }),
    };
  }
};
