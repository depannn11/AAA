const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Daftarin font manual
// __dirname biasanya ada di /src/api/image, jadi kita perlu keluar 3x untuk ke root
const fontPath = path.join(process.cwd(), 'src', 'ArchivoBlack-Regular.ttf');
registerFont(fontPath, { family: 'CustomFont' });

module.exports = function (app) {
    app.get("/image/testimaker", async (req, res, next) => {
        try {
            const { 
                img1, img2, 
                wa = "+62 88242449961", 
                tele = "@FVUEGO", 
                store = "DEPANN STORE" 
            } = req.query;

            if (!img1 || !img2) return res.json({ status: false, error: "img1 & img2 wajib!" });

            const canvas = createCanvas(400, 550);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 38px CustomFont'; // Pakai family name yang didaftarin
            
            const storeLines = store.toUpperCase().split(' ');
            let currentY = 60;
            storeLines.forEach(line => {
                ctx.fillText(line, 25, currentY);
                currentY += 35;
            });

            ctx.fillRect(25, currentY - 20, 350, 4);

            ctx.font = 'bold 12px CustomFont';
            ctx.fillText("TRANSACTION SUCCESS", 25, currentY);

            const [pic1, pic2] = await Promise.all([
                loadImage(img1),
                loadImage(img2)
            ]);

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeRect(25, currentY + 20, 170, 280);
            ctx.drawImage(pic1, 25, currentY + 20, 170, 280);
            ctx.strokeRect(205, currentY + 20, 170, 280);
            ctx.drawImage(pic2, 205, currentY + 20, 170, 280);

            const footerY = 480;
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 11px CustomFont';
            ctx.fillText(`WA. ${wa}`, 25, footerY + 20);
            ctx.fillText(`TG. ${tele}`, 25, footerY + 35);

            ctx.save();
            ctx.transform(1, 0, -0.2, 1, 0, 0);
            ctx.fillRect(280, footerY + 10, 90, 35);
            ctx.restore();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px CustomFont';
            ctx.fillText("SUCCESS", 295, footerY + 33);

            const buffer = canvas.toBuffer('image/png');
            res.set("Content-Type", "image/png");
            res.send(buffer);

        } catch (error) {
            next(error);
        }
    });
};
