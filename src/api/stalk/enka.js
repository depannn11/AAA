const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeEnkaProfile(uid) {
    try {
        const url = `https://enka.network/u/${uid}/`;
        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const $ = cheerio.load(html);
        
        const result = { 
            uid, 
            playerInfo: { nickname: '', level: 0, signature: '', worldLevel: 0, achievements: 0, spiralAbyss: '', theater: '', stygianOnslaught: '', avatar: '' }, 
            characters: [] 
        };

        const nickname = $('h1.svelte-ea8b6b').first().text().trim();
        if (nickname) result.playerInfo.nickname = nickname;

        const arText = $('.ar.svelte-ea8b6b').text().trim();
        const arMatch = arText.match(/AR (\d+)/);
        if (arMatch) result.playerInfo.level = parseInt(arMatch[1]);

        const wlMatch = arText.match(/WL (\d+)/);
        if (wlMatch) result.playerInfo.worldLevel = parseInt(wlMatch[1]);

        const signature = $('.signature.svelte-ea8b6b').text().trim();
        if (signature) result.playerInfo.signature = signature;

        const avatarImg = $('.avatar-icon img').attr('src');
        if (avatarImg) {
            result.playerInfo.avatar = avatarImg.startsWith('http') ? avatarImg : `https://enka.network${avatarImg}`;
        }

        $('.stat.svelte-1dtsens').each((i, el) => {
            const td = $(el).find('td');
            const value = $(td[0]).text().trim();
            const label = $(td[2]).text().trim();
            if (label.includes('Total Achievement')) {
                result.playerInfo.achievements = parseInt(value) || 0;
            } else if (label.includes('Spiral Abyss')) {
                result.playerInfo.spiralAbyss = value;
            } else if (label.includes('Imaginarium Theater')) {
                result.playerInfo.theater = value;
            } else if (label.includes('Stygian Onslaught')) {
                result.playerInfo.stygianOnslaught = value;
            }
        });

        $('.avatar.live').each((i, el) => {
            const imgStyle = $(el).find('.chara').attr('style') || '';
            const bgMatch = imgStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
            const nameMatch = imgStyle.match(/Side[._]([^.]+)/);
            const levelText = $(el).find('.level').text().trim();
            
            const charData = { 
                id: i + 1, 
                name: nameMatch ? nameMatch[1] : '', 
                level: parseInt(levelText) || 0, 
                icon: bgMatch ? `https://enka.network${bgMatch[1]}` : '',
                card: null 
            };
            result.characters.push(charData);
        });

        $('.card-scroll .Card').each((cardIndex, cardEl) => {
            const card = $(cardEl);
            const cardName = card.find('.name').text().trim().replace('▴', '').replace('wibutzy', '').trim();
            const character = result.characters.find(char => 
                cardName.toLowerCase().includes(char.name.toLowerCase()) || 
                char.name.toLowerCase().includes(cardName.toLowerCase())
            );

            if (character) {
                const levelMatch = card.find('.level').text().match(/Lv\. (\d+)\s*\/\s*(\d+)/);
                const friendship = card.find('.fren').text().trim().match(/\d+/)?.[0] || 0;
                character.card = {
                    name: cardName, level: parseInt(levelMatch?.[1]) || 0, maxLevel: parseInt(levelMatch?.[2]) || 0,
                    friendship: parseInt(friendship) || 0, constellation: card.find('.Consts .icon img').length || 0,
                    talents: [], weapon: null, artifacts: [], stats: {}
                };

                card.find('.Talents .icon .level').each((i, el) => {
                    character.card.talents.push({ level: parseInt($(el).text().trim().replace('up', '')) || 0 });
                });

                const weaponName = card.find('.Weapon .title span').text().trim();
                if (weaponName) {
                    character.card.weapon = {
                        name: weaponName,
                        level: parseInt(card.find('.Weapon .level').text().match(/Lv\. (\d+)/)?.[1]) || 0,
                        refinement: parseInt(card.find('.Weapon .refine').text().match(/R(\d+)/)?.[1]) || 1,
                        icon: `https://enka.network${card.find('.Weapon .WeaponIcon').attr('src')}`
                    };
                }

                card.find('.StatsTable .row').each((i, el) => {
                    const label = $(el).find('.mid span:first-child').text().trim();
                    const value = $(el).find('.mid span:last-child').text().trim().replace(',', '');
                    if (label === 'HP') character.card.stats.hp = parseInt(value);
                    if (label === 'ATK') character.card.stats.atk = parseInt(value);
                    if (label === 'DEF') character.card.stats.def = parseInt(value);
                    if (label === 'CRIT Rate') character.card.stats.cr = parseFloat(value);
                    if (label === 'CRIT DMG') character.card.stats.cd = parseFloat(value);
                });
            }
        });

        return { status: true, result };
    } catch (err) {
        return { status: false, message: "Gagal ambil data. Cek UID atau profil di-private." };
    }
}

module.exports = function (app) {
    app.get("/stalk/genshin", async (req, res, next) => {
        try {
            const { uid } = req.query;
            if (!uid) return res.json({ status: false, message: "UID mana wok?" });
            const data = await scrapeEnkaProfile(uid);
            res.json(data);
        } catch (error) { next(error); }
    });

    app.get("/stalk/hsr", async (req, res, next) => {
        try {
            const { uid } = req.query;
            if (!uid) return res.json({ status: false, message: "UID mana wok?" });
            const data = await scrapeEnkaProfile(uid);
            res.json(data);
        } catch (error) { next(error); }
    });

    app.get("/stalk/zzz", async (req, res, next) => {
        try {
            const { uid } = req.query;
            if (!uid) return res.json({ status: false, message: "UID mana wok?" });
            const data = await scrapeEnkaProfile(uid);
            res.json(data);
        } catch (error) { next(error); }
    });
};
