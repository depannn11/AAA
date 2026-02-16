const { createCanvas, loadImage } = require("@napi-rs/canvas");

const IMG_SOURCE = "https://raw.githubusercontent.com/whatsapp-media/whatsapp-media/main/uploads/1770891834482_undefined.jpg";

function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (let w of words) {
        const test = line + w + " ";
        if (ctx.measureText(test).width > maxWidth) {
            lines.push(line.trim());
            line = w + " ";
        } else {
            line = test;
        }
    }
    lines.push(line.trim());
    return lines;
}

function fitText(ctx, text, maxWidth, maxHeight) {
    let fontSize = 55;
    let lines = [];
    while (fontSize > 15) {
        ctx.font = `bold ${fontSize}px Arial`;
        lines = wrapText(ctx, text, maxWidth);
        const height = lines.length * (fontSize * 1.35);
        if (height < maxHeight) break;
        fontSize -= 2;
    }
    return { fontSize, lines };
}

module.exports = function (app) {
    app.get("/tools/bahlil", async (req, res) => {
        const { text } = req.query;
        if (!text) return res.status(400).json({ status: false, error: "Teks meme-nya mana, Bos?" });

        try {
            const img = await loadImage(IMG_SOURCE);
            const canvas = createCanvas(img.width, img.height);
            const ctx = canvas.getContext("2d");

            ctx.drawImage(img, 0, 0);

            const board = { x: 420, y: 415, w: 270, h: 410 };

            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const { fontSize, lines } = fitText(ctx, text, board.w, board.h);
            ctx.font = `bold ${fontSize}px Arial`;

            const lineHeight = fontSize * 1.35;
            const totalHeight = lines.length * lineHeight;
            const centerX = board.x + board.w / 2;
            const centerY = board.y + board.h / 2;

            let startY = centerY - totalHeight / 2 + lineHeight / 2;

            lines.forEach((line, i) => {
                ctx.fillText(line, centerX, startY + i * lineHeight);
            });

            const buffer = canvas.toBuffer("image/png");

            res.set({
                'Content-Type': 'image/png',
                'Content-Length': buffer.length
            });

            return res.send(buffer);
        } catch (err) {
            res.status(500).json({ status: false, error: "Gagal membuat meme: " + err.message });
        }
    });
};
