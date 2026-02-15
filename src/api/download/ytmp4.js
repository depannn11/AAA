const axios = require('axios');
const https = require('https');

const SaveNow = {
    _api: 'https://p.savenow.to',
    _key: 'dfcb6d76f2f6a9894gjkege8a4ab232222',
    _agent: new https.Agent({ rejectUnauthorized: false }),

    poll: async (url, limit = 40) => {
        for (let i = 0; i < limit; i++) {
            try {
                const { data } = await axios.get(url, { httpsAgent: SaveNow._agent });
                if (data.success === 1 && data.download_url) return data;
                if (data.success === -1) break;
            } catch (e) {}
            await new Promise(resolve => setTimeout(resolve, 2500));
        }
        return null;
    },

    download: async (url, res = '720') => {
        try {
            if (!url) return { status: false, message: "Link YouTube wajib diisi!" };

            const { data: init } = await axios.get(`${SaveNow._api}/ajax/download.php`, {
                params: { copyright: 0, format: res, url: url, api: SaveNow._key },
                httpsAgent: SaveNow._agent
            });

            if (!init.success) return { status: false, message: "Gagal membuat antrian download." };

            const result = await SaveNow.poll(init.progress_url);
            if (!result) return { status: false, message: "Proses terlalu lama atau server sibuk." };

            return {
                status: true,
                title: init.info?.title || "No Title",
                thumbnail: init.info?.image,
                duration: init.info?.duration,
                quality: res + 'p',
                download_url: result.download_url
            };
        } catch (err) {
            return { status: false, error: err.message };
        }
    }
};

module.exports = function (app) {
    app.get("/download/ytmp4", async (req, res) => {
        const { url, quality } = req.query;
        const res_quality = quality || "720";

        if (!url) return res.status(400).json({ status: false, error: "URL is required" });

        try {
            const result = await SaveNow.download(url, res_quality);
            if (result.status) {
                res.status(200).json({
                    status: true,
                    creator: "D2:业",
                    result: result
                });
            } else {
                res.status(500).json(result);
            }
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
