const axios = require('axios');

const SaveWeb = {
    baseURL: 'https://copier.saveweb2zip.com',
    headers: {
        'content-type': 'application/json',
        'origin': 'https://saveweb2zip.com',
        'referer': 'https://saveweb2zip.com/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    },

    async process(targetUrl) {
        try {
            // 1. Start Copying
            const start = await axios.post(`${this.baseURL}/api/copySite`, {
                url: targetUrl,
                renameAssets: false,
                saveStructure: false,
                alternativeAlgorithm: false,
                mobileVersion: false
            }, { headers: this.headers });

            const md5 = start.data.md5;
            if (!md5) throw new Error("Gagal inisialisasi cloning.");

            // 2. Pooling Status (Nunggu selesai)
            let isFinished = false;
            for (let i = 0; i < 30; i++) {
                const check = await axios.get(`${this.baseURL}/api/getStatus/${md5}`, { headers: this.headers });
                if (check.data.isFinished) {
                    isFinished = true;
                    break;
                }
                await new Promise(r => setTimeout(r, 3000));
            }

            if (!isFinished) throw new Error("Proses cloning terlalu lama!");

            // 3. Ambil Biner ZIP
            const download = await axios.get(`${this.baseURL}/api/downloadArchive/${md5}`, {
                responseType: 'arraybuffer',
                headers: { ...this.headers, 'accept': 'application/zip' }
            });

            return {
                buffer: Buffer.from(download.data),
                filename: `cloned_${md5.slice(0, 8)}.zip`
            };
        } catch (err) { throw err; }
    }
};

module.exports = function (app) {
    app.get("/tools/cloneweb", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "URL target mana, Bos?" });

        try {
            const result = await SaveWeb.process(url);

            res.set({
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${result.filename}"`,
                'Content-Length': result.buffer.length
            });

            return res.send(result.buffer);
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
