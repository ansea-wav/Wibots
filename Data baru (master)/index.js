// ============================================================
// YAY by netals — Main Server Entry Point
// ============================================================
// Pterodactyl PM2 Deployment: Express + Socket.IO + Cron + Baileys
// ============================================================

// --- Auto Install Missing Dependencies ---
try {
  require.resolve('@google/generative-ai');
} catch (e) {
  console.log("[Auto-Install] Installing @google/generative-ai...");
  require('child_process').execSync('npm install @google/generative-ai', { stdio: 'inherit' });
}

require('dotenv').config();

const express      = require('express');
const { createServer } = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const cron         = require('node-cron');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const os           = require('os');

const gasbridge      = require('./gasbridge');
const datacache      = require('./datacache');
const sessionmanager = require('./sessionmanager');

// --- Express + HTTP + Socket.IO Setup ---
const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'DELETE'] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- File Upload Setup ---
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_DIR, req.params.userId || 'unknown');
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Serve uploaded files statically
app.use('/files', express.static(UPLOAD_DIR));

// ============================================================
// REST API ENDPOINTS
// ============================================================

// Public tunnel URL (diisi otomatis saat Cloudflare Tunnel terbuka)
let PUBLIC_TUNNEL_URL = null;

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    name: 'YAY by netals',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cacheReady: datacache.ready,
    tunnelUrl: PUBLIC_TUNNEL_URL
  });
});

// --- Tunnel URL (untuk Web Panel auto-detect) ---
app.get('/api/tunnel-url', (req, res) => {
  res.json({ status: 'ok', url: PUBLIC_TUNNEL_URL });
});

// --- System Stats ---
app.get('/api/system-stats', (req, res) => {
  const totalMem  = os.totalmem();
  const freeMem   = os.freemem();
  const usedMem   = totalMem - freeMem;
  const cpus      = os.cpus();
  const loadAvg   = os.loadavg();
  
  res.json({
    cpu: {
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      loadAverage: loadAvg[0]?.toFixed(2) || 0
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percentUsed: ((usedMem / totalMem) * 100).toFixed(1)
    },
    uptime: process.uptime(),
    platform: os.platform(),
    hostname: os.hostname()
  });
});

// --- Registration ---
app.post('/api/auth/register', async (req, res) => {
  const { whatsapp, token, username } = req.body;
  if (!whatsapp || !token || !username) {
    return res.status(400).json({ status: 'error', message: 'WhatsApp, Token, dan Username wajib diisi.' });
  }

  let formattedPhone = String(whatsapp).replace(/^0/, '62').replace(/\D/g, '');

  try {
    const result = await gasbridge.registerClient(formattedPhone, token, username);
    if (result.status === 'success') {
      // Force refresh datacache since a new user was registered
      await datacache.refreshAll();
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (e) {
    console.error('[AUTH] Registration failed:', e);
    res.status(500).json({ status: 'error', message: 'Gagal melakukan registrasi. Server error.' });
  }
});

const otpCache = new Map();

// --- Authentication ---
app.post('/api/auth/request-otp', async (req, res) => {
  const { whatsapp } = req.body;
  if (!whatsapp) {
    return res.status(400).json({ status: 'error', message: 'Nomor WhatsApp wajib diisi.' });
  }

  let formattedPhone = String(whatsapp).replace(/^0/, '62').replace(/\D/g, '');
  const client = datacache.findClientByPhone(formattedPhone);
  
  if (!client) {
    return res.status(404).json({ status: 'error', message: 'Nomor WhatsApp tidak terdaftar dalam sistem.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache.set(formattedPhone, { otp, expires: Date.now() + 5 * 60 * 1000 });

  const targetJid = `${formattedPhone}@s.whatsapp.net`;
  const message = `━━━━━━━『 🔐 KODE OTP 』━━━━━━━\n\nKode OTP Anda untuk login ke Wazle Dashboard adalah: *${otp}*\n\n_Kode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun!_`;
  
  try {
    await sessionmanager.sendMasterMessage(targetJid, message);
    res.json({ status: 'success', message: 'OTP telah dikirim via WhatsApp.' });
  } catch (error) {
    console.error('[AUTH] Failed to send OTP:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengirim pesan OTP. Pastikan Master Bot sedang aktif.' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { whatsapp, otp } = req.body;
  if (!whatsapp || !otp) {
    return res.status(400).json({ status: 'error', message: 'WhatsApp dan OTP wajib diisi.' });
  }

  let formattedPhone = String(whatsapp).replace(/^0/, '62').replace(/\D/g, '');
  const cached = otpCache.get(formattedPhone);

  if (!cached || Date.now() > cached.expires) {
    otpCache.delete(formattedPhone);
    return res.status(400).json({ status: 'error', message: 'OTP tidak ditemukan atau sudah kedaluwarsa.' });
  }

  if (cached.otp !== String(otp)) {
    return res.status(400).json({ status: 'error', message: 'Kode OTP salah.' });
  }

  otpCache.delete(formattedPhone);
  const client = datacache.findClientByPhone(formattedPhone);
  
  if (!client) {
    return res.status(404).json({ status: 'error', message: 'Data klien tidak valid.' });
  }

  try {
    const master = await gasbridge.fetchUserMaster(client.User_ID);
    if (master.status === 'success') {
      res.json(master);
    } else {
      res.status(500).json(master);
    }
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data dari server.' });
  }
});

// --- Bot Configuration ---
app.get('/api/config/:userId', (req, res) => {
  const config = datacache.getConfig(req.params.userId);
  if (!config) return res.status(404).json({ status: 'error', message: 'Config not found.' });
  res.json({ status: 'success', data: config });
});

app.post('/api/config/:userId', async (req, res) => {
  const { userId } = req.params;
  const fields = req.body.fields;
  
  const gasResult = await gasbridge.updateBotConfig(userId, fields);
  if (gasResult.status !== 'success') {
    return res.status(500).json(gasResult);
  }
  
  datacache.updateConfig(userId, fields);
  io.to(userId).emit('config_updated', { userId, fields });
  
  res.json({ status: 'success', message: 'Config updated in GAS + Cache.' });
});

// --- App Store ---
app.get('/api/appstore', async (req, res) => {
  const result = await gasbridge.getAppStoreList();
  if (result.status === 'success') {
    res.json({ status: 'success', data: result.data });
  } else {
    res.status(500).json(result);
  }
});

app.post('/api/appstore/install', async (req, res) => {
  const { userId, appId } = req.body;
  if (!userId || !appId) return res.status(400).json({ status: 'error', message: 'Missing userId or appId' });
  const result = await gasbridge.installApp(userId, appId);
  
  if (result.status === 'success') {
    // Update local cache
    const client = datacache.getClient(userId);
    if (client) {
      const installed = client.Aplikasi_terpasang ? client.Aplikasi_terpasang.split(',') : [];
      if (!installed.includes(appId)) {
        installed.push(appId);
        client.Aplikasi_terpasang = installed.join(',');
      }
    }
  }
  
  res.json(result);
});

// --- Onboarding ---
app.post('/api/onboarding/group', async (req, res) => {
  const { userId, groupLink } = req.body;
  if (!userId || !groupLink) return res.status(400).json({ status: 'error', message: 'Missing userId or groupLink' });
  
  const jid = await sessionmanager.resolveJidFromLink(groupLink);
  if (!jid) {
    return res.status(400).json({ status: 'error', message: 'Link grup tidak valid atau bot gagal mendeteksi JID grup tersebut.' });
  }

  const result = await gasbridge.updateGroupLink(userId, groupLink);
  if (result.status === 'success') {
    const client = datacache.getClient(userId);
    if (client) client.Group_1 = groupLink;
    
    // Asynchronously update JID cache and join group
    sessionmanager.onGroupLinkUpdated(userId, 1, groupLink).catch(e => console.error('[ONBOARDING] Failed to resolve and save JID:', e));
  }
  res.json(result);
});

// --- Auto Responder ---
app.get('/api/responders/:userId', (req, res) => {
  const list = datacache.getResponders(req.params.userId);
  res.json({ status: 'success', data: list });
});

app.post('/api/responders/:userId', async (req, res) => {
  const { userId } = req.params;
  const { Keyword, Match_Type, Response_Type, Payload_Data } = req.body;
  
  const gasResult = await gasbridge.addAutoResponder(userId, Keyword, Match_Type, Response_Type, Payload_Data);
  if (gasResult.status !== 'success') return res.status(500).json(gasResult);
  
  const newEntry = {
    Response_ID: gasResult.response_id,
    User_ID: userId,
    Keyword: Keyword,
    Match_Type: Match_Type,
    Response_Type: Response_Type,
    Payload_Data: Payload_Data
  };
  datacache.addResponderEntry(userId, newEntry);
  
  res.json({ status: 'success', data: newEntry });
});

app.put('/api/responders/:userId/:responseId', async (req, res) => {
  const { userId, responseId } = req.params;
  const updates = req.body;
  
  const gasResult = await gasbridge.updateAutoResponder(responseId, updates);
  if (gasResult.status !== 'success') return res.status(500).json(gasResult);
  
  const fresh = await gasbridge.getAutoResponder(userId);
  if (fresh.status === 'success') {
    datacache.setResponders(userId, fresh.data);
  }
  
  res.json({ status: 'success', message: 'Responder updated.' });
});

app.delete('/api/responders/:userId/:responseId', async (req, res) => {
  const { userId, responseId } = req.params;
  
  const gasResult = await gasbridge.deleteAutoResponder(responseId);
  if (gasResult.status !== 'success') return res.status(500).json(gasResult);
  
  datacache.removeResponderEntry(userId, responseId);
  
  res.json({ status: 'success', message: 'Responder deleted.' });
});

// --- Macros ---
app.get('/api/macros/:userId', (req, res) => {
  const list = datacache.getMacros(req.params.userId);
  res.json({ status: 'success', data: list });
});

app.post('/api/macros/:userId', async (req, res) => {
  const { userId } = req.params;
  const { Trigger_Syntax, Action_Type, Selected_Groups } = req.body;
  
  const gasResult = await gasbridge.addMacro(userId, Trigger_Syntax, Action_Type, Selected_Groups);
  if (gasResult.status !== 'success') return res.status(500).json(gasResult);
  
  const newEntry = {
    Macro_ID: gasResult.macro_id,
    User_ID: userId,
    Trigger_Syntax: Trigger_Syntax,
    Action_Type: Action_Type,
    Selected_Groups: Selected_Groups,
    Status: 'Active'
  };
  datacache.addMacroEntry(userId, newEntry);
  
  res.json({ status: 'success', data: newEntry });
});

app.put('/api/macros/:userId/:macroId', async (req, res) => {
  const { userId, macroId } = req.params;
  const updates = req.body;
  
  const gasResult = await gasbridge.updateMacro(macroId, updates);
  if (gasResult.status !== 'success') return res.status(500).json(gasResult);
  
  const fresh = await gasbridge.getMacros(userId);
  if (fresh.status === 'success') {
    datacache.setMacros(userId, fresh.data);
  }
  
  res.json({ status: 'success', message: 'Macro updated.' });
});

app.delete('/api/macros/:userId/:macroId', async (req, res) => {
  const { userId, macroId } = req.params;
  
  const gasResult = await gasbridge.deleteMacro(macroId);
  if (gasResult.status !== 'success') return res.status(500).json(gasResult);
  
  datacache.removeMacroEntry(userId, macroId);
  
  res.json({ status: 'success', message: 'Macro deleted.' });
});

// --- Client Account Info ---
app.get('/api/account/:userId', (req, res) => {
  const client = datacache.getClient(req.params.userId);
  if (!client) return res.status(404).json({ status: 'error', message: 'User not found.' });
  res.json({ status: 'success', data: client });
});

app.put('/api/account/:userId', async (req, res) => {
  const { userId } = req.params;
  const fields = req.body.fields;
  
  const gasResult = await gasbridge.updateClientRegistry(userId, fields);
  if (gasResult.status !== 'success') {
    return res.status(500).json(gasResult);
  }
  
  // Update local cache
  for (const [key, value] of Object.entries(fields)) {
    datacache.updateClientField(userId, key, value);
    // Jika update adalah Group Link, trigger resolve ke JID secara background
    if (key.startsWith('Group_')) {
      const idx = key.split('_')[1];
      if (value) {
        sessionmanager.onGroupLinkUpdated(userId, idx, value).catch(e => console.error(e));
      }
    }
  }
  
  res.json({ status: 'success', message: 'Account updated successfully.' });
});

// --- WhatsApp Session Control ---
app.post('/api/session/:userId/start', async (req, res) => {
  const { userId } = req.params;
  const client = datacache.getClient(userId);
  if (!client || client.Package_Tier !== 'God') {
    return res.status(403).json({ status: 'error', message: 'Only Admin can start the Master Bot.' });
  }
  
  await sessionmanager.startMasterSession(io);
  res.json({ status: 'success', message: 'Master Session starting...' });
});

app.post('/api/session/:userId/stop', (req, res) => {
  const client = datacache.getClient(req.params.userId);
  if (!client || client.Package_Tier !== 'God') {
    return res.status(403).json({ status: 'error', message: 'Only Admin can stop the Master Bot.' });
  }
  sessionmanager.stopMasterSession();
  res.json({ status: 'success', message: 'Master Session stopped.' });
});

app.get('/api/session/:userId/status', (req, res) => {
  const status = sessionmanager.getMasterSessionStatus();
  const qr = sessionmanager.getMasterQr();
  res.json({ status: 'success', data: { state: status, qr } });
});

// ============================================================
// ADMIN (God Tier) ENDPOINTS
// ============================================================

// --- DEBUG: Cek status resolved group JIDs ---
app.get('/api/debug/groups', (req, res) => {
  res.json({
    status: 'ok',
    resolvedGroupsMap: sessionmanager.getResolvedGroupsMap(),
    clients: datacache.getAllClients().map(c => ({
      userId: c.User_ID,
      Group_1: c.Group_1, Group_2: c.Group_2, Group_3: c.Group_3
    }))
  });
});

app.get('/api/admin/clients', (req, res) => {
  const clients = datacache.getAllClients();
  res.json({ status: 'success', data: clients });
});

app.post('/api/admin/clients', async (req, res) => {
  const { whatsapp, tier, days } = req.body;
  const gasResult = await gasbridge.addClient(whatsapp, tier, days);
  if (gasResult.status !== 'success') return res.status(500).json(gasResult);
  
  // Refresh cache
  const fresh = await gasbridge.fetchAllMaster();
  if (fresh.status === 'success') datacache.setAllMasterData(fresh.data);

  res.json(gasResult);
});

app.delete('/api/admin/clients/:clientId', async (req, res) => {
  const { clientId } = req.params;
  const gasResult = await gasbridge.deleteClient(clientId);
  if (gasResult.status !== 'success') return res.status(500).json(gasResult);

  // Refresh cache
  const fresh = await gasbridge.fetchAllMaster();
  if (fresh.status === 'success') datacache.setAllMasterData(fresh.data);

  res.json(gasResult);
});

app.post('/api/admin/broadcast', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ status: 'error', message: 'Message cannot be empty.' });

  const clients = datacache.getAllClients();
  let count = 0;
  for (const client of clients) {
    if (client.WhatsApp_Owner && client.Package_Tier !== 'God') {
      const jid = client.WhatsApp_Owner + '@s.whatsapp.net';
      const success = await sessionmanager.sendMasterMessage(jid, { text: message });
      if (success) count++;
    }
  }
  res.json({ status: 'success', message: `Broadcast sent to ${count} clients.` });
});

// --- File Upload & Explorer ---
app.post('/api/files/:userId/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
  
  const userId = req.params.userId;
  const client = datacache.getClient(userId);
  if (!client) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ status: 'error', message: 'User not found.' });
  }

  const tier = client.Package_Tier;
  const maxFileSizeMB = (tier === 'Premium' || tier === 'God') ? 25 : tier === 'Standard' ? 15 : 10;
  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

  if (req.file.size > maxFileSizeBytes) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ status: 'error', message: `Maksimal file berukuran ${maxFileSizeMB}MB. Upgrade Layanan atau kompres file.` });
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64 = fileBuffer.toString('base64');
    
    // Upload via GAS
    const result = await gasbridge.uploadDriveFile(userId, req.file.originalname, req.file.mimetype, base64, req.file.size);
    
    // Hapus file dari local disk Pterodactyl setelah dikirim ke Google Drive
    fs.unlinkSync(req.file.path);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/files/:userId', async (req, res) => {
  const userId = req.params.userId;
  const result = await gasbridge.getDriveFiles(userId);
  if (result.status === 'success') {
    // Map GAS Drive files format to match old format
    const mapped = result.data.map(f => ({
      filename: f.Filename,
      size: Number(f.Size),
      modified: f.Upload_Date,
      url: f.Drive_URL,
      id: f.Drive_File_ID,
    }));
    res.json({ status: 'success', data: mapped, total_size: result.total_size });
  } else {
    res.status(500).json(result);
  }
});

app.delete('/api/files/:userId/:filename', async (req, res) => {
  const result = await gasbridge.deleteDriveFile(req.params.userId, req.params.filename);
  if (result.status === 'success') {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ============================================================
// SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`[Socket] ${socket.id} joined room: ${userId}`);
    
    const botState = sessionmanager.getMasterSessionStatus();
    socket.emit('bot_status', { state: botState === 'CONNECTED' ? 'ONLINE' : 'OFFLINE' });
    
    // Jika Admin, kirim QR code jika ada
    const client = datacache.getClient(userId);
    if (client && client.Package_Tier === 'God') {
      const qr = sessionmanager.getMasterQr();
      if (qr) socket.emit('qr_code', { qr });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ============================================================
// CRON JOB — Daily Decrement at 00:00 WIB
// ============================================================
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Running daily decrement...');
  const result = await gasbridge.runDailyDecrement();
  
  if (result.status === 'success') {
    for (const userId of (result.expired_users || [])) {
      console.log(`[Cron] User ${userId} expired. (Master Bot ignoring groups)`);
      datacache.updateClientField(userId, 'Account_Status', 'Expired');
      datacache.updateClientField(userId, 'Days_Left', 0);
      io.to(userId).emit('account_expired', { userId });
    }

    for (const userId of (result.warning_users || [])) {
      const client = datacache.getClient(userId);
      if (client) {
        const ownerJid = client.WhatsApp_Owner + '@s.whatsapp.net';
        const warningText = '⚠️ *Notifikasi YAY:* Masa sewa bot Anda tersisa 3 hari lagi. Harap lakukan perpanjangan agar sistem tidak terkunci otomatis.';
        await sessionmanager.sendMasterMessage(ownerJid, { text: warningText });
        datacache.updateClientField(userId, 'Days_Left', 3);
      }
    }
  }

  console.log('[Cron] Daily decrement complete.');
}, { timezone: 'Asia/Jakarta' });

// ============================================================
// SERVER BOOT
// ============================================================
// Pterodactyl passes port via SERVER_PORT or P_SERVER_PORT env
const PORT = process.env.SERVER_PORT || process.env.P_SERVER_PORT || process.env.PORT || 8080;

async function boot() {
  console.log('═══════════════════════════════════════════');
  console.log('  YAY by netals — Bot Engine Starting...');
  console.log('═══════════════════════════════════════════');

  // 1. Initialize cache from GAS
  const cacheOk = await datacache.initialize();
  if (!cacheOk) {
    console.error('[Boot] ⚠ Cache initialization failed. Running without cache.');
  }

  // 2. Auto-start Master Session
  if (datacache.ready) {
    console.log(`[Boot] Starting Master Bot Session...`);
    try {
      await sessionmanager.startMasterSession(io);
    } catch (err) {
      console.error(`[Boot] Failed to start Master Session:`, err.message);
    }
  }

  // 3. Start HTTP server
  httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log('═══════════════════════════════════════════');
    console.log(`  ✓ Engine running on port ${PORT}`);
    console.log(`  ✓ Cache: ${datacache.ready ? 'READY' : 'FAILED'}`);
    console.log(`  ✓ Cron: Daily decrement @ 00:00 WIB`);
    
    // --- CLOUDFLARE TUNNEL MANAGER (STABLE — URL DIPERTAHANKAN) ---
    const { spawn } = require('child_process');
    const CLOUDFLARED_BIN = path.join(__dirname, 'cloudflared');

    async function downloadCloudflaredBinary() {
      return new Promise((resolve, reject) => {
        const https = require('https');
        const dlUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
        console.log('  [CF] Mengunduh binary cloudflared...');
        const file = fs.createWriteStream(CLOUDFLARED_BIN);
        function getUrl(u, depth = 0) {
          if (depth > 10) return reject(new Error('Too many redirects'));
          https.get(u, { headers: { 'User-Agent': 'node' } }, (res) => {
            if ([301,302,307,308].includes(res.statusCode)) return getUrl(res.headers.location, depth+1);
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            res.pipe(file);
            file.on('finish', () => file.close(() => {
              fs.chmodSync(CLOUDFLARED_BIN, '755');
              console.log('  [CF] Binary berhasil diunduh!');
              resolve();
            }));
          }).on('error', (e) => { fs.unlink(CLOUDFLARED_BIN, ()=>{}); reject(e); });
        }
        getUrl(dlUrl);
      });
    }

    async function startCloudflareTunnel() {
      // Pastikan binary ada
      if (!fs.existsSync(CLOUDFLARED_BIN)) {
        try { await downloadCloudflaredBinary(); }
        catch (err) {
          console.error(`  [CF] Gagal download: ${err.message}. Retry 30s...`);
          setTimeout(startCloudflareTunnel, 30000);
          return;
        }
      }

      console.log('  [CF] Membuka tunnel Cloudflare...');
      const cf = spawn(CLOUDFLARED_BIN, [
        'tunnel', '--url', `http://localhost:${PORT}`, '--no-autoupdate'
      ], { stdio: ['ignore', 'pipe', 'pipe'] });

      let urlFound = false;

      function parseLine(line) {
        // Tangkap URL saat pertama kali muncul — tidak akan berubah selama proses hidup
        if (!urlFound) {
          const match = line.match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/);
          if (match) {
            urlFound = true;
            PUBLIC_TUNNEL_URL = match[0];
            console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
            console.log(`  \ud83d\udd17 PUBLIC URL: ${PUBLIC_TUNNEL_URL}`);
            console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
            // Simpan URL ke GAS agar Web Panel bisa auto-detect
            gasbridge.saveTunnelUrl(PUBLIC_TUNNEL_URL)
              .then(() => console.log('  [CF] URL tersimpan ke database.'))
              .catch(() => {}); // Gagal simpan ke GAS tidak masalah, tunnel tetap jalan
          }
        }
        // Cloudflared menangani reconnect sendiri secara internal — URL tidak berubah
      }

      cf.stdout.on('data', (d) => d.toString().split('\n').forEach(parseLine));
      cf.stderr.on('data',  (d) => d.toString().split('\n').forEach(parseLine));

      // Hanya restart jika proses BENAR-BENAR mati (crash), bukan karena timeout koneksi sementara
      cf.on('close', (code) => {
        console.log(`  [CF] Proses tunnel mati (code ${code}). Restart dalam 10s...`);
        PUBLIC_TUNNEL_URL = null;
        setTimeout(startCloudflareTunnel, 10000); // URL baru akan otomatis ter-simpan ke GAS
      });

      cf.on('error', (err) => {
        console.error(`  [CF] Error spawn: ${err.message}. Restart dalam 10s...`);
        PUBLIC_TUNNEL_URL = null;
        setTimeout(startCloudflareTunnel, 10000);
      });
    }
    
    startCloudflareTunnel();
  });
}

boot();
