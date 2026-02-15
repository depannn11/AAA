const axios = require('axios');

const SCDL = {
    config: {
        baseUrl: "https://sc.snapfirecdn.com",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    },
    download: async (url) => {
        try {
            const { data: info } = await axios.post(`${SCDL.config.baseUrl}/soundcloud`, 
                { target: url, gsc: "x" }, 
                { headers: SCDL.config.headers }
            );

            if (!info.sound || !info.sound.progressive_url) throw new Error("Gagal meunangkeun info lagu.");

            const dlUrl = `${SCDL.config.baseUrl}/soundcloud-get-dl?target=${encodeURIComponent(info.sound.progressive_url)}`;
            const { data: dl } = await axios.get(dlUrl, { headers: SCDL.config.headers });

            return {
                status: true,
                result: {
                    title: info.sound.title,
                    artist: info.metadata.username,
                    thumb: info.metadata.artwork_url,
                    url: dl.url,
                    metadata: {
                        profile: info.metadata.profile_picture_url
                    }
                }
            };
        } catch (err) {
            return { status: false, message: err.message };
        }
    }
};

module.exports = function (app) {
    app.get("/download/soundcloud", async (req, res, next) => {
        try {
            const { url } = req.query;
            if (!url) return res.json({ status: false, message: "Mana link SoundCloud-na mang?" });

            const result = await SCDL.download(url);
            res.json(result);
        } catch (error) {
            next(error);
        }
    });
};
