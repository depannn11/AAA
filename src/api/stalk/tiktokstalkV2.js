const axios = require('axios');
const cheerio = require('cheerio');

async function tiktokUserFinder(username) {
    try {
        if (!username) throw new Error('Username wajib diisi!');

        const cleanUsername = username.replace(/^@/, '').trim();
        const url = `https://www.tiktok.com/@${cleanUsername}`;

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html',
                'Referer': 'https://www.tiktok.com/'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const scriptData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
        
        if (!scriptData) throw new Error('Gagal mengambil struktur data TikTok.');

        const parsedData = JSON.parse(scriptData);
        const userDetail = parsedData.__DEFAULT_SCOPE__?.['webapp.user-detail'];
        const userInfo = userDetail?.userInfo;

        if (!userInfo || !userInfo.user) throw new Error('Pengguna tidak ditemukan atau akun bersifat privat!');

        return {
            status: true,
            result: {
                user: {
                    id: userInfo.user.id,
                    username: userInfo.user.uniqueId,
                    nickname: userInfo.user.nickname,
                    avatar: userInfo.user.avatarLarger,
                    bio: userInfo.user.signature,
                    verified: userInfo.user.verified,
                    region: userInfo.user.region
                },
                stats: {
                    followers: userInfo.stats.followerCount,
                    following: userInfo.stats.followingCount,
                    hearts: userInfo.stats.heartCount,
                    video_count: userInfo.stats.videoCount,
                    friend_count: userInfo.stats.friendCount
                },
                meta: {
                    title: userDetail?.shareMeta?.title,
                    description: userDetail?.shareMeta?.desc
                }
            }
        };

    } catch (e) {
        return {
            status: false,
            error: e.message
        };
    }
}

module.exports = function (app) {
    app.get("/stalk/tiktok-v2", async (req, res) => {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ 
                status: false, 
                error: "Parameter 'username' tidak boleh kosong!" 
            });
        }

        try {
            const data = await tiktokUserFinder(username);

            if (data.status) {
                res.status(200).json({
                    status: true,
                    creator: "D2:业 x Agung",
                    result: data.result
                });
            } else {
                res.status(404).json(data);
            }
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
