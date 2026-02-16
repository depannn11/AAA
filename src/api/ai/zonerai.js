const axios = require("axios");
const https = require("https");
const FormData = require("form-data");

class Zonerai {
    constructor() {
        this.baseUrl = "https://api.zonerai.com";
        this.headers = {
            "Origin": "https://zonerai.com",
            "Referer": "https://zonerai.com/",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "X-Client-Platform": "web"
        };
    }

    async text2img(prompt, size = "1024x1024") {
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
        const validSizes = ["1216x832", "1152x896", "1344x768", "1024x1024", "832x1216"];
        
        if (!prompt) return res.status(400).json({ status: false, error: "Promptnya mana, Bos?" });
        
        const selectedSize = validSizes.includes(size) ? size : "1024x1024";

        try {
            const zoner = new Zonerai();
            const buffer = await zoner.text2img(prompt, selectedSize);

            // SET HEADER BIAR JADI GAMBAR
            res.set({
                'Content-Type': 'image/png',
                'Content-Length': buffer.length,
                'Cache-Control': 'public, max-age=3600'
            });

            return res.send(buffer);

        } catch (err) {
            res.status(500).json({ status: false, error: "AI lagi capek: " + err.message });
        }
    });
};
