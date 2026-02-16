const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const upload = multer();

const DOMAIN = 'https://api.xte.web.id';

module.exports = function (app) {
    // --- 1. ENDPOINT UPLOAD ---
    app.post("/tools/tourl", upload.single('file'), async (req, res) => {
        if (!req.file) return res.status(400).json({ status: false, error: "Filenya mana?" });

        try {
            const form = new FormData();
            form.append('file', req.file.buffer, { 
                filename: req.file.originalname, 
                contentType: req.file.mimetype 
            });

            const { data } = await axios.post('https://uplider.my.id/upload', form, {
                headers: { ...form.getHeaders(), "user-agent": "Mozilla/5.0" }
            });

            // Ambil ID filenya aja (misal dari /file/abc.jpg jadi abc.jpg)
            const fileId = data.url.split('/').pop();
            
            res.json({
                status: true,
                creator: "D2:业",
                result: {
                    url: `${DOMAIN}/tourl/${fileId}` // Link jadi domain kamu!
                }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

    // --- 2. ENDPOINT VIEW (PROXY) ---
    // Ini yang bikin api.xte.web.id/tourl/namafile.jpg bisa dibuka
    app.get("/tourl/:fileId", async (req, res) => {
        const { fileId } = req.params;
        try {
            const targetUrl = `https://uplider.my.id/file/${fileId}`;
            
            // Tarik data dari sumber asli
            const response = await axios.get(targetUrl, { responseType: 'arraybuffer' });
            
            // Ambil content-type asli (image/png, image/jpeg, dll)
            const contentType = response.headers['content-type'];

            res.set({
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400' // Cache biar server gak kerja keras
            });

            return res.send(Buffer.from(response.data));
        } catch (err) {
            res.status(404).send("File tidak ditemukan atau sudah dihapus.");
        }
    });
};
