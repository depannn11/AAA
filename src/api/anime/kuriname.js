const axios = require('axios');
const crypto = require('crypto');
const cheerio = require('cheerio');

class Kuramanime {
    constructor() {
        this.baseURL = 'https://v14.kuramanime.tel';
    }

    // Generator Token & Session biar gak kena blokir
    genToken(len) {
        const iv = crypto.randomBytes(16);
        const value = crypto.randomBytes(len);
        const mac = crypto.createHmac('sha256', 'base64:yYhVjMq5fC0iZJx3wL9sP8tR6gN2bK4d').update(Buffer.concat([iv, value])).digest('base64');
        return Buffer.from(JSON.stringify({ iv: iv.toString('base64'), value: value.toString('base64'), mac })).toString('base64');
    }

    getHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'cookie': `XSRF-TOKEN=${encodeURIComponent(this.genToken(32))}; kuramanime_session=${encodeURIComponent(this.genToken(64))}; sel_timezone_v2=Asia/Jakarta`
        };
    }

    async search(query) {
        const { data } = await axios.get(`${this.baseURL}/anime`, {
            headers: this.getHeaders(),
            params: { search: query, order_by: 'oldest' }
        });
        const $ = cheerio.load(data);
        const results = [];
        $('.filter__gallery').each((i, el) => {
            const a = $(el).find('a');
            if (a.length) {
                results.push({
                    title: a.find('.sidebar-title-h5').text().trim(),
                    id: a.attr('href').match(/\/anime\/(\d+)/)?.[1],
                    slug: a.attr('href').split('/').pop(),
                    image: a.find('.product__sidebar__view__item').data('setbg'),
                    rating: a.find('.actual-anime-3').text().trim() || '0'
                });
            }
        });
        return results;
    }

    async detail(id, slug) {
        const { data } = await axios.get(`${this.baseURL}/anime/${id}/${slug}`, { headers: this.getHeaders() });
        const $ = cheerio.load(data);
        const episodes = [];
        const popover = $('#episodeLists').data('content');
        if (popover) {
            const e$ = cheerio.load(popover);
            e$('a').each((i, el) => {
                episodes.push({
                    eps: e$(el).text().trim(),
                    url: e$(el).attr('href')
                });
            });
        }
        return {
            title: $('.anime__details__title h3').text().trim(),
            synopsis: $('.anime__details__text p').text().trim(),
            episodes: episodes
        };
    }
}

module.exports = function (app) {
    const kurama = new Kuramanime();

    app.get("/anime/kurama-search", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, error: "Cari anime apa, Bos?" });
        try {
            const result = await kurama.search(q);
            res.json({ status: true, creator: "D2:业", result });
        } catch (e) { res.status(500).json({ status: false, error: e.message }); }
    });

    app.get("/anime/kurama-detail", async (req, res) => {
        const { id, slug } = req.query;
        if (!id || !slug) return res.status(400).json({ status: false, error: "ID & Slug wajib ada!" });
        try {
            const result = await kurama.detail(id, slug);
            res.json({ status: true, creator: "D2:业", result });
        } catch (e) { res.status(500).json({ status: false, error: e.message }); }
    });
};
