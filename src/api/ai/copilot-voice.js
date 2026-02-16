const WebSocket = require('ws');
const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function copilotChat(message) {
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
                mode: 'chat',
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
    if (base64.includes(',')) base64 = base64.split(',')[1];
    return Buffer.from(base64, 'base64');
}

module.exports = function (app) {
    app.get("/ai/copilot-voice", async (req, res) => {
        const { text } = req.query;

        if (!text) return res.status(400).json({ status: false, error: "Teks wajib diisi!" });

        try {
            const aiReply = await copilotChat(text);
            const audioBuffer = await getAudioMP3(aiReply);
            
            const base64Audio = audioBuffer.toString('base64');

            res.status(200).json({
                status: true,
                creator: "D2:业",
                result: {
                    text: aiReply,
                    audio_base64: "data:audio/mp3;base64," + base64Audio
                }
            });

        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
