const axios = require('axios');
const cheerio = require('cheerio');

const Mediafire = {
    getMimeType(url) {
        if (!url) return 'application/octet-stream';
        const ext = url.split('.').pop().toLowerCase();
        const mimeTypes = {
            '7z': 'application/x-7z-compressed',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            'apk': 'application/vnd.android.package-archive',
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
            'mp3': 'audio/mpeg', 'mp4': 'video/mp4', 'pdf': 'application/pdf'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    },

    async fetch(url) {
        try {
            const { data: html } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const $ = cheerio.load(html);

            const link = $('#downloadButton').attr('href');
            const sizes = $('#downloadButton').text().trim();
            const title = $('meta[property="og:title"]').attr('content');
            const size = sizes.replace('Download (', '').replace(')', '');

            if (!link) throw new Error("Link download tidak ditemukan.");

            return {
                title,
                size,
                mime: this.getMimeType(link),
                link
            };
        } catch (err) { throw err; }
    }
};

module.exports = function (app) {
    // --- OPSI 1: JSON INFO ---
    app.get("/download/mediafire", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "Link Mediafire-nya mana?" });

        try {
            const result = await Mediafire.fetch(url);
            res.json({ status: true, creator: "D2:业", result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

    // --- OPSI 2: DIRECT DOWNLOAD (BINER) ---
    app.get("/download/mediafire-v2", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).send("Link wajib diisi!");

        try {
            const data = await Mediafire.fetch(url);
            const response = await axios.get(data.link, { responseType: 'arraybuffer' });

            res.set({
                'Content-Type': data.mime,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(data.title)}"`
            });

            return res.send(Buffer.from(response.data));
        } catch (err) {
            res.status(500).send("Gagal mengunduh file.");
        }
    });
};
