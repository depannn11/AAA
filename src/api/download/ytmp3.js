const axios = require("axios");

async function getYouTubeMp3(youtubeUrl) {
  try {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = youtubeUrl.match(regex);
    const videoId = match ? match[1] : null;

    if (!videoId) return { status: false, message: "URL YouTube tidak valid!" };

    const ajaxUrl = 'https://ssyoutube.online/wp-admin/admin-ajax.php';
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
      'Referer': 'https://ssyoutube.online/'
    };

    // Step 1: Ambil opsi download
    const step1 = await axios.post(ajaxUrl, new URLSearchParams({
      action: 'get_mp3_yt_option',
      videoId: videoId
    }), { headers });

    if (!step1.data.success) return { status: false, message: "Gagal ambil info MP3" };

    // Step 2: Ambil Link Final via Proxy
    const step2 = await axios.post(ajaxUrl, new URLSearchParams({
      action: 'mp3_yt_generic_proxy_ajax',
      targetUrl: step1.data.data.link
    }), { headers });

    if (step2.data.success) {
      return {
        status: true,
        title: step1.data.data.title,
        url: step2.data.data.proxiedUrl
      };
    }
    return { status: false, message: "Gagal mendapatkan link download final" };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

module.exports = function (app) {
  app.get("/download/ytmp3", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ 
        status: false, 
        error: "Parameter 'url' wajib diisi!" 
      });
    }

    try {
      const result = await getYouTubeMp3(url);

      if (result.status) {
        res.status(200).json({
          status: true,
          creator: "D2:业",
          result: {
            title: result.title,
            url: result.url
          }
        });
      } else {
        res.status(500).json({ 
          status: false, 
          error: result.message || "Gagal memproses request" 
        });
      }
    } catch (err) {
      res.status(500).json({ 
        status: false, 
        error: err.message 
      });
    }
  });
};
