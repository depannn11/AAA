const axios = require('axios');
const FormData = require('form-data');

const AgungDevX = {
    config: {
        base: 'https://text2video.aritek.app',
        cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
        shift: 3,
        ua: 'AgungDevX Coder/1.0.0'
    },

    _decryptToken: () => {
        const input = AgungDevX.config.cipher;
        const shift = AgungDevX.config.shift;
        return [...input].map(c =>
            /[a-z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97) :
            /[A-Z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65) : c
        ).join('');
    },

    text2img: async (prompt) => {
        try {
            const token = AgungDevX._decryptToken();
            const form = new FormData();
            form.append('prompt', prompt);
            form.append('token', token);

            const { data } = await axios.post(`${AgungDevX.config.base}/text2img`, form, {
                headers: {
                    'user-agent': AgungDevX.config.ua,
                    'authorization': token,
                    ...form.getHeaders()
                }
            });

            if (data.code !== 0 || !data.url) throw new Error("Gagal generate gambar.");
            return { status: true, url: data.url.trim() };
        } catch (err) {
            throw err;
        }
    },

    text2video: async (prompt) => {
        try {
            const token = AgungDevX._decryptToken();
            const payload = {
                deviceID: Math.random().toString(16).slice(2, 18),
                isPremium: 1,
                prompt: prompt,
                used: [],
                versionCode: 59
            };

            const resKey = await axios.post(`${AgungDevX.config.base}/txt2videov3`, payload, {
                headers: { 'user-agent': AgungDevX.config.ua, 'authorization': token, 'content-type': 'application/json' }
            });

            if (resKey.data.code !== 0 || !resKey.data.key) throw new Error("Gagal mendapatkan antrian video.");

            const key = resKey.data.key;
            let videoUrl = null;
            let attempts = 0;

            while (!videoUrl && attempts < 30) {
                attempts++;
                const resVideo = await axios.post(`${AgungDevX.config.base}/video`, { keys: [key] }, {
                    headers: { 'user-agent': AgungDevX.config.ua, 'authorization': token }
                });

                const videoData = resVideo.data.datas?.[0];
                if (videoData?.url) {
                    videoUrl = videoData.url.trim();
                } else {
                    await new Promise(resolve => setTimeout(resolve, 4000));
                }
            }

            if (!videoUrl) throw new Error("Proses pembuatan video terlalu lama.");
            return { status: true, url: videoUrl };
        } catch (err) {
            throw err;
        }
    }
};

module.exports = function (app) {
    app.get("/ai/text2img", async (req, res) => {
        const { prompt } = req.query;
        if (!prompt) return res.status(400).json({ status: false, error: "Prompt wajib diisi!" });

        try {
            const result = await AgungDevX.text2img(prompt);
            res.status(200).json({
                status: true,
                creator: "D2:业 x Agung",
                result: { prompt, url: result.url }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

    app.get("/ai/text2video", async (req, res) => {
        const { prompt } = req.query;
        if (!prompt) return res.status(400).json({ status: false, error: "Prompt wajib diisi!" });

        try {
            const result = await AgungDevX.text2video(prompt);
            res.status(200).json({
                status: true,
                creator: "D2:业 x Agung",
                result: { prompt, url: result.url }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
