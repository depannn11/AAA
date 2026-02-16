const axios = require('axios');

const TokStalk = {
    config: {
        baseUrl: "https://tokviewer.net/api",
        headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'origin': 'https://tokviewer.net',
            'referer': 'https://tokviewer.net/'
        }
    },

    stalk: async (username) => {
        try {
            if (!username) return { status: false, message: "Username tidak boleh kosong!" };

            const profileRes = await axios.post(`${TokStalk.config.baseUrl}/check-profile`, 
                { username: username }, 
                { headers: TokStalk.config.headers }
            );

            const profile = profileRes.data;
            if (profile.status !== 200 || !profile.data) {
                throw new Error("Profil tidak ditemukan atau server sedang gangguan.");
            }

            const videoRes = await axios.post(`${TokStalk.config.baseUrl}/video`, 
                { username: username, offset: 0, limit: 10 }, 
                { headers: TokStalk.config.headers }
            );

            const videos = videoRes.data;

            return {
                status: true,
                result: {
                    user: {
                        username: username,
                        nickname: profile.data.nickname || username,
                        avatar: profile.data.avatar,
                        followers: profile.data.followers,
                        following: profile.data.following,
                        likes: profile.data.likes,
                        bio: profile.data.signature || ""
                    },
                    videos: (videos.data || []).map(v => ({
                        cover: v.cover,
                        downloadUrl: v.downloadUrl,
                        type: v.downloadUrl.includes('.mp3') ? 'music/photo' : 'video'
                    }))
                }
            };

        } catch (err) {
            throw err;
        }
    }
};

module.exports = function (app) {
    app.get("/stalk/tiktok", async (req, res) => {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ 
                status: false, 
                error: "Parameter 'username' wajib diisi!" 
            });
        }

        try {
            const data = await TokStalk.stalk(username);

            res.status(200).json({
                status: true,
                creator: "D2:业 x Agung",
                result: data.result
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message || "Gagal mengambil data stalk TikTok" 
            });
        }
    });
};
