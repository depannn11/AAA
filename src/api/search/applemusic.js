const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAppleMusic(query, region = 'id') {
    const url = `https://music.apple.com/${region}/search?term=${encodeURIComponent(query)}`;
    
    try {
        const { data } = await axios.get(url, {
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        $(".top-search-lockup, .shelf-grid__item").each((i, el) => {
            const title = $(el).find(".top-search-lockup__primary__title, .product-lockup__title").text().trim();
            const artist = $(el).find(".top-search-lockup__secondary, .product-lockup__subtitle").text().trim();
            const link = $(el).find("a.click-action, a.product-lockup__link").attr("href");
            const image = $(el).find("picture source").attr("srcset")?.split(" ")[0] 
                          || $(el).find("img").attr("src");

            if (title && artist && link) {
                results.push({
                    title,
                    artist: artist.replace('·', '').trim(),
                    link: link.startsWith("http") ? link : `https://music.apple.com${link}`,
                    image: image || null
                });
            }
        });

        return {
            status: true,
            data: results.slice(0, 10)
        };

    } catch (err) {
        return {
            status: false,
            error: err.message
        };
    }
}

module.exports = function (app) {
    app.get("/search/applemusic", async (req, res) => {
        const { q, region } = req.query;

        if (!q) {
            return res.status(400).json({ 
                status: false, 
                error: "Parameter 'q' wajib diisi!" 
            });
        }

        try {
            const result = await scrapeAppleMusic(q, region || 'id');

            res.status(200).json({
                status: true,
                creator: "D2:业",
                result: result.data
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
