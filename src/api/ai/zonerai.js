const axios = require("axios");
const https = require("https");
const FormData = require("form-data");

class Zonerai {
    constructor() {
        this.baseUrl = "https://api.zonerai.com";
        this.headers = {
            "Origin": "https://zonerai.com",
            "Referer": "https://zonerai.com/",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
            "X-Client-Platform": "web"
        };
    }

    async text2img(prompt, size) {
        const formData = new FormData();
        formData.append("Prompt", prompt);
        formData.append("Size", size);
        formData.append("Upscale", 0);
        formData.append("Language", "eng_Latn");
        formData.append("Batch_Index", 0);

        const { data } = await axios.post(
            `${this.baseUrl}/zoner-ai/txt2img`,
            formData,
            {
                headers: { ...this.headers, ...formData.getHeaders() },
                responseType: "arraybuffer",
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            }
        );
        return data;
    }
}

module.exports = function (app) {
    app.get("/ai/zonerai", async (req, res) => {
        const { prompt, size } = req.query;
        
        if (!prompt) return res.status(400).json({ status: false, error: "Prompt wajib diisi!" });

        const selectedSize = size || "1024x1024";

        try {
            const zoner = new Zonerai();
            const buffer = await zoner.text2img(prompt, selectedSize);

            // Set Header agar browser/bot mengenali ini sebagai gambar PNG
            res.set({
                'Content-Type': 'image/png',
                'Content-Length': buffer.length,
                'Cache-Control': 'public, max-age=86400' // Cache 1 hari biar hemat bandwidth
            });

            return res.send(buffer);

        } catch (err) {
            console.error("Zonerai Error:", err.message);
            res.status(500).json({ status: false, error: "Gagal generate gambar." });
        }
    });
};
