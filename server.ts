import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API endpoint for Canvas AI Code Generator
  app.post("/api/generate-canvas-code", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is not configured.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

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

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      let rawText = response.text || "";

      // Clean up markdown block formatting if present
      rawText = rawText.replace(/```javascript/gi, "").replace(/```js/gi, "").replace(/```/g, "").trim();

      return res.json({ code: rawText });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      return res.status(500).json({
        error: err.message || "Gagal membuat kode canvas dari AI",
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for dev mode vs production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
