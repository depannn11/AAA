const axios = require('axios');
const cheerio = require('cheerio');

class NontonAnimeAPI {
    constructor() {
        this.baseURL = 'https://s9.nontonanimeid.boats';
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    getHeaders(customReferer = '') {
        const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
        return {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'referer': customReferer || 'https://s9.nontonanimeid.boats/',
            'user-agent': userAgent
        };
    }

    generateCookies() {
        const timestamp = Date.now();
        return {
            '_lscache_vary': Math.random().toString(36).substring(2, 34),
            '_ga': `GA1.2.${Math.floor(Math.random() * 999999999)}.${timestamp}`
        };
    }

    async search(query) {
        const cookies = this.generateCookies();
        const cookieString = Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ');
        const response = await axios({
            method: 'GET',
            url: `${this.baseURL}/`,
            headers: { ...this.getHeaders(), 'cookie': cookieString },
            params: { 's': query }
        });
        const $ = cheerio.load(response.data);
        const results = [];
        $('.as-anime-card').each((i, el) => {
            const $el = $(el);
            results.push({
                title: $el.find('.as-anime-title').text().trim(),
                url: $el.attr('href'),
                image: $el.find('img').attr('src'),
                rating: $el.find('.as-rating').text().replace('⭐', '').trim(),
                type: $el.find('.as-type').text().replace('📺', '').trim(),
                season: $el.find('.as-season').text().replace('📅', '').trim()
            });
        });
        return results;
    }

    async getDetail(url) {
        const cookies = this.generateCookies();
        const cookieString = Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ');
        const response = await axios({
            method: 'GET',
            url: url,
            headers: { ...this.getHeaders(), 'cookie': cookieString }
        });
        const $ = cheerio.load(response.data);
        const episodesList = [];
        $('.episode-item').each((i, el) => {
            const $el = $(el);
            episodesList.push({
                title: $el.find('.ep-title').text().trim(),
                url: $el.attr('href'),
                date: $el.find('.ep-date').text().trim()
            });
        });
        return {
            title: $('.entry-title').text().replace('Nonton', '').replace('Sub Indo', '').trim(),
            image: $('.anime-card__sidebar img').attr('src'),
            score: $('.anime-card__score .value').text().trim(),
            status: $('.info-item.status-finish').text().trim().replace('·', '').trim(),
            episodes: $('.info-item:contains("Episodes")').text().trim().replace('·', '').trim(),
            synopsis: $('.synopsis-prose p').text().trim(),
            episodesList
        };
    }
}

const animeAPI = new NontonAnimeAPI();

module.exports = function (app) {
    app.get("/anime/sdetail", async (req, res) => {
        try {
            const query = req.query.q;
            if (!query) return res.status(400).json({ status: false, message: "Query 'q' is required" });
            
            const searchResults = await animeAPI.search(query);
            if (searchResults.length === 0) return res.status(404).json({ status: false, message: "Anime not found" });
            
            const detail = await animeAPI.getDetail(searchResults[0].url);
            res.status(200).json({ 
                status: true, 
                query: query,
                data: detail 
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
