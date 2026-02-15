const axios = require('axios');

class GSMArenaSearch {
  constructor() {
    this.baseURL = 'https://m.gsmarena.com';
    this.searchEndpoint = '/search-json.php3';
  }

  async search(query) {
    const headers = {
      'accept': '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'referer': 'https://m.gsmarena.com/',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
    };

    const params = { sSearch: query };
    const response = await axios.get(`${this.baseURL}${this.searchEndpoint}`, { headers, params });
    return response.data;
  }
}

module.exports = function (app) {
  const gsm = new GSMArenaSearch();

  app.get("/stalk/gsmarena", async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ 
        status: false, 
        error: "Parameter 'q' (query) wajib diisi!" 
      });
    }

    try {
      const result = await gsm.search(q);

      res.status(200).json({
        status: true,
        creator: "D2:业",
        result: result
      });
    } catch (err) {
      res.status(500).json({ 
        status: false, 
        error: err.message || "Gagal mengambil data GSMArena" 
      });
    }
  });
};
