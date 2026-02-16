const axios = require('axios');

const Heckai = {
    config: {
        baseUrl: 'https://api.heckai.weight-wave.com/api/ha/v1',
        defaultModel: 'x-ai/grok-3-mini-beta',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://api.heckai.weight-wave.com',
            'Referer': 'https://api.heckai.weight-wave.com/'
        }
    },

    async createSession() {
        try {
            const { data } = await axios.post(`${this.config.baseUrl}/session/create`, 
                { title: 'Chat_Session_' + Date.now() }, 
                { headers: this.config.headers }
            );
            return data.id || null;
        } catch (error) {
            return null;
        }
    },

    async chat({ prompt, sessionId = null, model = null }) {
        try {
            if (!prompt) throw new Error("Parameter 'prompt' wajib diisi!");

            const activeSession = sessionId || await this.createSession();
            const activeModel = model || this.config.defaultModel;

            const response = await axios.post(`${this.config.baseUrl}/chat`, {
                model: activeModel,
                question: prompt,
                language: 'Indonesian',
                sessionId: activeSession
            }, {
                headers: this.config.headers,
                responseType: 'text'
            });

            const lines = response.data.split('\n');
            let resultText = '';
            let capture = false;

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const chunk = line.replace('data: ', '').trim();

                if (chunk === '[ANSWER_START]') {
                    capture = true;
                    continue;
                }
                if (chunk === '[ANSWER_DONE]') {
                    capture = false;
                    break;
                }
                if (capture) {
                    resultText += chunk;
                }
            }

            return {
                status: true,
                model: activeModel,
                session: activeSession,
                answer: resultText.replace(/\\n/g, '\n').trim()
            };

        } catch (error) {
            throw error;
        }
    }
};

module.exports = function (app) {
    app.get("/ai/heckai", async (req, res) => {
        const { q, model, sessionId } = req.query;

        if (!q) {
            return res.status(400).json({ 
                status: false, 
                error: "Parameter 'q' (pertanyaan) wajib diisi!" 
            });
        }

        try {
            const data = await Heckai.chat({ 
                prompt: q, 
                model: model, 
                sessionId: sessionId 
            });

            res.status(200).json({
                status: true,
                creator: "D2:业",
                result: data
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
