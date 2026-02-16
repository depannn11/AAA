const axios = require('axios');

const OCR = {
    async process(imageUrl) {
        try {
            // 1. Ambil gambar dari URL dan ubah ke Base64
            const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imgRes.data);
            const mimeType = imageUrl.toLowerCase().includes('png') ? "image/png" : "image/jpeg";
            const imageBase64 = buffer.toString("base64");

            // 2. Tembak ke API Staging AI OCR
            const { data } = await axios.post("https://staging-ai-image-ocr-266i.frontend.encr.app/api/ocr/process", 
                { imageBase64, mimeType },
                { headers: { "content-type": "application/json" } }
            );

            return data.extractedText || "Teks tidak ditemukan.";
        } catch (err) {
            throw new Error("Gagal melakukan OCR: " + err.message);
        }
    }
};

module.exports = function (app) {
    app.get("/tools/ocr", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "URL gambar mana, Bos?" });

        try {
            const text = await OCR.process(url);
            res.json({
                status: true,
                creator: "D2:业",
                result: {
                    text: text
                }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
