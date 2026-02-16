const axios = require('axios');

const Pikwy = {
    async capture(url) {
        try {
            // 1. Request ke Pikwy untuk dapet URL Gambar
            const { data } = await axios.get('https://api.pikwy.com/', {
                params: {
                    tkn: 125,
                    d: 3000,
                    u: encodeURIComponent(url),
                    fs: 0,
                    w: 1280,
                    h: 1200,
                    s: 100,
                    z: 100,
                    f: 'jpg',
                    rt: 'jweb'
                },
                headers: { 'Accept': '*/*' }
            });

            if (!data.iurl) throw new Error("Gagal mendapatkan link screenshot.");

            // 2. Ambil gambar biner dari iurl yang diberikan
            const imageResponse = await axios.get(data.iurl, { responseType: 'arraybuffer' });
            return Buffer.from(imageResponse.data);
        } catch (err) {
            throw err;
        }
    }
};

module.exports = function (app) {
    app.get("/tools/ssweb", async (req, res) => {
        let { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "URL target mana, Bos?" });

        // Auto-fix URL jika tidak pakai http/https
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        try {
            const buffer = await Pikwy.capture(url);

            res.set({
                'Content-Type': 'image/jpeg',
                'Content-Length': buffer.length,
                'Cache-Control': 'public, max-age=3600' // Cache 1 jam biar hemat request
            });

            return res.send(buffer);
        } catch (err) {
            res.status(500).json({ status: false, error: "SSWEB Error: " + err.message });
        }
    });
};
