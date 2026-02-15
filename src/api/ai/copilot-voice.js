const WebSocket = require('ws');
const axios = require('axios');
const qs = require('qs');

async function copilotChat(message, model = 'default') {
    const models = {
        default: 'chat',
        'think-deeper': 'reasoning',
        'gpt-5': 'smart'
    };

    if (!models[model]) throw new Error(`Model tersedia: ${Object.keys(models).join(', ')}`);

    const { data } = await axios.post('https://copilot.microsoft.com/c/api/conversations', null, {
        headers: {
            origin: 'https://copilot.microsoft.com',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
        }
    });

    const conversationId = data.id;

    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1`, {
            headers: {
                origin: 'https://copilot.microsoft.com',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });

        let resultText = '';

        ws.on('open', () => {
            ws.send(JSON.stringify({
                event: 'setOptions',
                supportedFeatures: ['partial-generated-images'],
                supportedCards: ['weather', 'local', 'image', 'sports', 'video', 'ads', 'safetyHelpline', 'quiz', 'finance', 'recipe'],
                ads: { supportedTypes: ['text', 'product', 'multimedia', 'tourActivity', 'propertyPromotion'] }
            }));

            ws.send(JSON.stringify({
                event: 'send',
                mode: models[model],
                conversationId,
                content: [{ type: 'text', text: message + ". Jawab maksimal 2 kalimat saja." }],
                context: {}
            }));
        });

        ws.on('message', (chunk) => {
            try {
                const parsed = JSON.parse(chunk.toString());
                if (parsed.event === 'appendText') resultText += parsed.text || '';
                if (parsed.event === 'done') {
                    resolve(resultText);
                    ws.close();
                }
                if (parsed.event === 'error') {
                    reject(new Error(parsed.message));
                    ws.close();
                }
            } catch (error) {
                reject(error);
            }
        });

        ws.on('error', reject);
    });
}

async function getAudioMP3(text) {
    const url = 'https://wavel.ai/wp-json/myplugin/v1/tts';
    const data = qs.stringify({
        lang: 'indonesian',
        text: text,
        voiceId: 'id-ID-ArdiNeural' 
    });

    const response = await axios.post(url, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
    });
    
    let base64 = response.data.base64Audio;
    if (!base64) throw new Error("Gagal konversi ke audio.");
    if (base64.includes(',')) base64 = base64.split(',')[1];
    return Buffer.from(base64, 'base64');
}

module.exports = function (app) {
    app.get("/ai/copilot-voice", async (req, res) => {
        const { text, model } = req.query;

        if (!text) {
            return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi!" });
        }

        try {
            const aiReply = await copilotChat(text, model || 'default');
            const audioBuffer = await getAudioMP3(aiReply);

            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length,
                'X-AI-Reply': encodeURIComponent(aiReply)
            });
            
            return res.send(audioBuffer);

        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
