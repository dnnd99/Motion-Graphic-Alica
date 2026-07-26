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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt || typeof prompt !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Prompt is required" }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured." }),
      };
    }

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

    return { statusCode: 200, body: JSON.stringify({ code: rawText }) };
  } catch (err: any) {
    console.error("Gemini API error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Gagal membuat kode canvas dari AI" }),
    };
  }
};
