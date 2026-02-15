const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

module.exports = function (app) {
  app.get("/ai/skincolor", async (req, res) => {
    try {
      const { url, action } = req.query;

      if (!url) return res.json({ status: false, error: "Parameter 'url' wajib diisi" });
      if (!action || !["hitam", "putih"].includes(action)) {
        return res.json({ status: false, error: "Action harus 'hitam' atau 'putih'" });
      }

      const apiKeys = [
        "AIzaSyDE7R-5gnjgeqYGSMGiZVjA5VkSrQvile8",
        "TOKEN_KEDUA_KAMU_DI_SINI",
        "TOKEN_KETIGA_KAMU_DI_SINI"
      ];

      const randomToken = apiKeys[Math.floor(Math.random() * apiKeys.length)];
      const genAI = new GoogleGenerativeAI(randomToken);

      const imgRes = await axios.get(url, { responseType: "arraybuffer" });
      const base64Image = Buffer.from(imgRes.data, "binary").toString("base64");
      const mimeType = imgRes.headers["content-type"] || "image/jpeg";

      const promptText = action === "hitam" 
        ? "ubah warna kulit karakter menjadi warna hitam/gelap secara natural" 
        : "ubah warna kulit karakter menjadi warna putih/terang secara natural";

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseModalities: ["Text", "Image"]
        },
      });

      const contents = [
        { text: promptText },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        }
      ];

      const result = await model.generateContent(contents);
      const response = await result.response;
      
      let resultImageBuffer;
      if (response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            resultImageBuffer = Buffer.from(part.inlineData.data, "base64");
          }
        }
      }

      if (resultImageBuffer) {
        res.set("Content-Type", "image/png");
        res.send(resultImageBuffer);
      } else {
        res.json({ status: false, error: "AI tidak memberikan respon gambar. Coba lagi nanti." });
      }

    } catch (error) {
      if (error.message.includes("429")) {
        res.status(429).json({ status: false, error: "Semua token sibuk (Limit). Coba lagi dalam 1 menit." });
      } else {
        res.status(500).json({ status: false, error: error.message });
      }
    }
  });
};
