const axios = require('axios');

async function searchMusic(query) {
    const baseURL = 'https://m.joomods.web.id';
    try {
        const { data } = await axios.get(`${baseURL}/api/music`, {
            params: { alicia: query },
            headers: { 'user-agent': 'Mozilla/5.0' }
        });
const axios = require('axios');

async function searchMusic(query) {
    const baseURL = 'https://m.joomods.web.id';
    try {
        const { data } = await axios.get(`${baseURL}/api/music`, {
            params: { alicia: query },
            headers: { 'user-agent': 'Mozilla/5.0' }
        });

        if (!data.status) return [];

        return data.result.map(item => ({
            title: item.title,
            artist: item.artist || 'Unknown',
            thumb: item.thumb,
            duration: item.duration,
            url: item.url
        }));
    } catch { return []; }
}

module.exports = function (app) {
    app.get("/search/music-v2", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, error: "Cari apa, Bos?" });

        const results = await searchMusic(q);
        res.json({ status: true, creator: "D2:业", result: results });
    });
};

        if (!data.status) return [];

        return data.result.map(item => ({
            title: item.title,
            artist: item.artist || 'Unknown',
            thumb: item.thumb,
            duration: item.duration,
            url: item.url
        }));
    } catch { return []; }
}

module.exports = function (app) {
    app.get("/search/music-v2", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, error: "Cari apa, Bos?" });

        const results = await searchMusic(q);
        res.json({ status: true, creator: "D2:业", result: results });
    });
};
