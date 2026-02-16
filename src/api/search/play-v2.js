const axios = require('axios');

async function getMp3(query) {
    const baseURL = 'https://m.joomods.web.id';
    try {
        const search = await axios.get(`${baseURL}/api/music`, { params: { alicia: query } });
        if (!search.data.status || !search.data.result[0]) return null;

        const dl = await axios.get(`${baseURL}/api/music`, { 
            params: { download: search.data.result[0].url } 
        });
        return dl.data.status ? dl.data.result.download_url : null;
    } catch { return null; }
}

module.exports = function (app) {
    app.get("/search/play-v2", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, error: "Judulnya mana?" });

        try {
            const audioUrl = await getMp3(q);
            if (!audioUrl) return res.status(404).json({ status: false, error: "Lagu gak ketemu!" });

            // KIRIM JSON AJA BIAR DASHBOARD GAK ERROR
            res.json({
                status: true,
                creator: "D2:业",
                result: {
                    title: q,
                    download_url: audioUrl // User tinggal klik link ini
                }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
