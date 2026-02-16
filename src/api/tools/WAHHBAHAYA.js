const axios = require('axios');

async function undressPro(base64Image) {
    try {
        const res = await axios.post('https://alterarchive.vercel.app/api/undress', {
            value: base64Image,
            key: "core"
        }, {
            headers: {
                'accept': '*/*',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
                'origin': 'https://alterarchive.vercel.app',
                'referer': 'https://alterarchive.vercel.app/alterdreams',
                'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
            }
        });

        if (res.data && res.data.success) {
            // Kita kembalikan dalam bentuk Buffer (Biner)
            return Buffer.from(res.data.result, 'base64');
        } else {
            throw new Error("API menolak permintaan, kemungkinan limit tercapai.");
        }
    } catch (err) {
        throw err;
    }
}

module.exports = function (app) {
    app.get("/tools/undress", async (req, res) => {
        const { url, token } = req.query;

        if (token !== "TOBATBRO") {
            return res.status(403).json({ status: false, error: "Token salah!" });
        }

        if (!url) return res.status(400).json({ status: false, error: "URL wajib diisi!" });

        try {
            // 1. Ambil gambar dari URL luar
            const imgRes = await axios.get(url, { responseType: 'arraybuffer' });
            const base64Input = `data:image/png;base64,${Buffer.from(imgRes.data).toString('base64')}`;

            // 2. Proses ke AI
            const imageBuffer = await undressPro(base64Input);

            // 3. KIRIM SEBAGAI BINER (Gambar Langsung)
            res.set({
                'Content-Type': 'image/png',
                'Content-Length': imageBuffer.length
            });

            return res.send(imageBuffer);

        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
