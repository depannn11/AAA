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
        if (!q) return res.status(400).send("Judulnya mana, Bos?");

        try {
            const audioUrl = await getMp3(q);
            if (!audioUrl) return res.status(404).send("Lagu gak ketemu!");

            const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
            
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': response.data.length,
                'Cache-Control': 'public, max-age=3600'
            });

            return res.send(Buffer.from(response.data));
        } catch (err) {
            res.status(500).send("Error: " + err.message);
        }
    });
};
