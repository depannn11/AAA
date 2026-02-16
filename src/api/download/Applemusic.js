const axios = require('axios');
const cheerio = require('cheerio');
const { zencf } = require('zencf'); 

async function appleDownloader(url) {
    try {
        const { token } = await zencf.turnstileMin(
            'https://aplmate.com/', 
            '0x4AAAAAABdqfzl6we62dQyp'
        );
        
        if (!token) throw new Error("Gagal melewati verifikasi keamanan!");

        const base = "https://aplmate.com";
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
            "Origin": base,
            "Referer": base + "/"
        };

        const home = await axios.get(base, { headers });
        const $h = cheerio.load(home.data);
        const csrfInput = $h("input[type='hidden']").filter((i, el) => $h(el).attr("name")?.startsWith("_"));
        const csrfName = csrfInput.attr("name");
        const csrfValue = csrfInput.attr("value");
        const session = home.headers["set-cookie"]?.[0]?.split(';')[0] || "";

        const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
        let formData = `--${boundary}\r\nContent-Disposition: form-data; name="url"\r\n\r\n${url}\r\n`;
        formData += `--${boundary}\r\nContent-Disposition: form-data; name="${csrfName}"\r\n\r\n${csrfValue}\r\n`;
        formData += `--${boundary}\r\nContent-Disposition: form-data; name="cf-turnstile-response"\r\n\r\n${token}\r\n--${boundary}--\r\n`;

        const action = await axios.post(`${base}/action`, formData, {
            headers: { 
                ...headers, 
                "Content-Type": `multipart/form-data; boundary=${boundary}`, 
                "Cookie": session 
            }
        });

        const $res = cheerio.load(action.data.html || action.data);
        const trackData = {
            data: $res("input[name='data']").attr("value"),
            base: $res("input[name='base']").attr("value"),
            token: $res("input[name='token']").attr("value")
        };

        if (!trackData.data) throw new Error("Data lagu tidak ditemukan!");

        const tBoundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
        let tForm = `--${tBoundary}\r\nContent-Disposition: form-data; name="data"\r\n\r\n${trackData.data}\r\n`;
        tForm += `--${tBoundary}\r\nContent-Disposition: form-data; name="base"\r\n\r\n${trackData.base}\r\n`;
        tForm += `--${tBoundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${trackData.token}\r\n--${tBoundary}--\r\n`;

        const final = await axios.post(`${base}/action/track`, tForm, {
            headers: { 
                ...headers, 
                "Content-Type": `multipart/form-data; boundary=${tBoundary}`, 
                "Cookie": session 
            }
        });

        const $f = cheerio.load(final.data.data || final.data);

        return {
            status: true,
            result: {
                title: $res(".aplmate-downloader-middle h3 div").text().trim(),
                artist: $res(".aplmate-downloader-middle p span").text().trim(),
                image: $res(".aplmate-downloader-left img").attr("src"),
                download: {
                    mp3: base + $f("a:contains('Download Mp3')").attr("href"),
                    cover: base + $f("a:contains('Download Cover')").attr("href")
                }
            }
        };

    } catch (err) {
        return { status: false, message: err.message };
    }
}

module.exports = function (app) {
    app.get("/download/applemusic", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ 
                status: false, 
                error: "Parameter 'url' wajib diisi!" 
            });
        }

        try {
            const data = await appleDownloader(url);

            if (data.status) {
                res.status(200).json({
                    status: true,
                    creator: "D2:业",
                    result: data.result
                });
            } else {
                res.status(500).json({ status: false, error: data.message });
            }
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
