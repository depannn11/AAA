const axios = require('axios');
const cheerio = require('cheerio');

async function fbDown(fbUrl) {
    try {
        const getHome = await axios.get('https://fdown.world/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const cookie = getHome.headers['set-cookie'];

        const { data } = await axios.post('https://fdown.world/result.php', 
            new URLSearchParams({
                'codehap_link': fbUrl,
                'codehap': 'true'
            }), 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Cookie': cookie,
                    'Referer': 'https://fdown.world/'
                }
            }
        );

        const $ = cheerio.load(data);
        const results = [];

        $('.download-btn').each((i, el) => {
            const link = $(el).attr('href');
            let text = $(el).text().trim().replace(/\s+/g, ' ');
            if (link && link !== '#') {
                results.push({
                    quality: text,
                    url: link.startsWith('http') ? link : 'https://fdown.world' + link
                });
            }
        });

        const thumb = $('img').first().attr('src');

        return {
            status: results.length > 0,
            thumbnail: thumb || null,
            links: results
        };
    } catch (err) {
        return { status: false, msg: err.message };
    }
}

module.exports = function (app) {
    app.get("/download/fbdown", async (req, res, next) => {
        try {
            const { url } = req.query;
            if (!url) return res.json({ status: false, msg: "Isi parameter 'url' lur!" });

            const result = await fbDown(url);
            res.json(result);
        } catch (error) {
            next(error);
        }
    });
};
