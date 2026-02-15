const express = require("express");
const chalk = require("chalk");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const cheerio = require('cheerio');
const fileUpload = require("express-fileupload");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

const TG_BOT_TOKEN = process.env.TG_TOKEN || "8513744057:AAFmmLVaWQJ8G-KkN1bjNaNlz2VtYTaFSxY";
const TG_CHAT_ID = process.env.TG_CHAT_ID || "8412273544";

// Fungsi kirim notif lebih lengkap
async function sendTelegram(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: message,
            parse_mode: "Markdown"
        });
    } catch (err) {
        console.error(chalk.red(`[TelegramError] ${err.message}`));
    }
}

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(fileUpload());
app.set("json spaces", 2);

app.use("/", express.static(path.join(__dirname, "api-page")));
app.use("/src", express.static(path.join(__dirname, "src")));

const openApiPath = path.join(__dirname, "src", "openapi.json");
let openApi = {};
if (fs.existsSync(openApiPath)) {
    openApi = JSON.parse(fs.readFileSync(openApiPath));
}

// Middleware Inject Creator & Status
app.use((req, res, next) => {
    const original = res.json;
    res.json = function (data) {
        if (typeof data === "object") {
            data = {
                status: data.status ?? true,
                creator: "D2:业",
                ...data
            };
        }
        return original.call(this, data);
    };
    next();
});

// ROUTE LOADER DENGAN ERROR CHECKING
const apiFolder = path.join(__dirname, "src", "api");
if (fs.existsSync(apiFolder)) {
    const categories = fs.readdirSync(apiFolder);
    categories.forEach((sub) => {
        const subPath = path.join(apiFolder, sub);
        if (fs.statSync(subPath).isDirectory()) {
            const files = fs.readdirSync(subPath);
            files.forEach((file) => {
                if (file.endsWith(".js")) {
                    try {
                        const route = require(path.join(subPath, file));
                        if (typeof route === "function") {
                            route(app);
                            console.log(chalk.bgGreen.black(` OK `) + ` ${file}`);
                        }
                    } catch (e) {
                        // Kasih tau jika ada file JS API yang error codingannya saat baru dijalankan
                        console.error(chalk.bgRed.white(` ERROR LOADER `) + ` ${file}: ${e.message}`);
                        sendTelegram(`❌ *Gagal Memuat API*\nFile: \`${file}\`\nError: \`${e.message}\``);
                    }
                }
            });
        }
    });
}

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "api-page", "index.html")));
app.get("/docs", (req, res) => res.sendFile(path.join(__dirname, "api-page", "docs.html")));
app.get("/legal", (req, res) => res.sendFile(path.join(__dirname, "api-page", "legal.html")));
app.get("/openapi.json", (req, res) => res.sendFile(openApiPath));

// GLOBAL ERROR HANDLER (Menangkap error saat API diakses user)
app.use((err, req, res, next) => {
    console.error(chalk.red(`[RuntimeError] ${req.url} - ${err.message}`));
    
    // Notif Telegram mendetail
    const errorMsg = `🚨 *Server Error Runtime*\n\n` +
                     `*Path:* \`${req.url}\`\n` +
                     `*Method:* \`${req.method}\`\n` +
                     `*Error:* \`${err.message}\`\n` +
                     `*IP:* \`${req.ip}\``;
    
    sendTelegram(errorMsg);

    // Kirim response error agar tidak gantung
    res.status(500).json({
        status: false,
        error: "Internal Server Error. Notified to Owner."
    });
});

app.listen(PORT, () => {
    console.log(chalk.bgCyan.black(` INFO `) + ` Server running on port ${PORT}`);
    sendTelegram("🟢 *Server Dinzo Apis Started*");
});

module.exports = app;
