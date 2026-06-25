const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const gasbridge = require('./gasbridge');

const AUTH_DIR = path.join(__dirname, 'sessions');
const SPAMMER_SESSION_PATH = path.join(AUTH_DIR, 'spammer-bot');

let spammerSession = {
  socket: null,
  status: 'NO_SESSION',
  qr: null,
  hasConnected: false,
  qrCount: 0
};

let badMacCount = 0;
const BAD_MAC_THRESHOLD = 5;

let currentSpammerTasks = [];
// Memory cache for Last_Sent timestamps (Key: Task_ID, Value: timestamp)
const lastSentCache = {};

if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

function extractInviteCode(link) {
  const match = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{15,25})/);
  return match ? match[1] : null;
}

/**
 * Kirim pesan spam dengan gambar.
 * - Untuk link grup WA: ambil PP grup + nama grup langsung dari API WhatsApp
 * - Untuk URL biasa: ambil OG Image dari HTML
 * Kirim sebagai IMAGE + CAPTION agar pasti muncul.
 */
async function sendSpamMessage(socket, jid, text) {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  
  if (!urlMatch) {
    await socket.sendMessage(jid, { text });
    return;
  }

  const url = urlMatch[0];

  // === Cek apakah URL adalah link grup WhatsApp ===
  // WhatsApp otomatis render PP grup + tombol "Lihat Grup" jika dikirim sebagai teks biasa
  const waGroupMatch = url.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{15,25})/);
  if (waGroupMatch) {
    await socket.sendMessage(jid, { text });
    console.log(`[SPAMMER] Link grup WA dikirim sebagai teks biasa ke ${jid}`);
    return;
  }

  // === Untuk URL biasa: ambil OG Image dari HTML ===
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow'
    });
    const html = await res.text();

    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
                 || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const imageUrl = ogImage ? ogImage[1] : null;

    if (imageUrl) {
      const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, url).href;
      console.log(`[SPAMMER] OG Image ditemukan: ${fullImageUrl}`);
      
      const imgRes = await fetch(fullImageUrl, { 
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (imgRes.ok) {
        const arrayBuf = await imgRes.arrayBuffer();
        const imgBuffer = Buffer.from(arrayBuf);
        console.log(`[SPAMMER] OG Image berhasil diunduh (${imgBuffer.length} bytes)`);

        await socket.sendMessage(jid, {
          image: imgBuffer,
          caption: text,
          mimetype: 'image/jpeg'
        });
        console.log(`[SPAMMER] Pesan gambar + caption terkirim ke ${jid}`);
        return;
      }
    }
    
    console.log('[SPAMMER] OG Image tidak ditemukan, kirim teks biasa.');
  } catch (fetchErr) {
    console.log('[SPAMMER] Gagal fetch OG tags:', fetchErr.message);
  }

  // Fallback: kirim teks biasa
  await socket.sendMessage(jid, { text });
}

async function startSpammerSession() {
  if (spammerSession.status === 'CONNECTED' || spammerSession.status === 'CONNECTING') return;
  spammerSession.status = 'CONNECTING';
  spammerSession.qr = null;

  const { state, saveCreds } = await useMultiFileAuthState(SPAMMER_SESSION_PATH);

  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    generateHighQualityLinkPreview: true
  });

  spammerSession.socket = socket;

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      spammerSession.qrCount++;
      if (spammerSession.qrCount > 5) {
        console.log(`[SPAMMER] Max QR retries reached (5). Stopping generation and timing out.`);
        spammerSession.status = 'TIMEOUT';
        spammerSession.socket.ev.removeAllListeners();
        spammerSession.socket.end(new Error('Max QR retries reached'));
        if (fs.existsSync(SPAMMER_SESSION_PATH)) fs.rmSync(SPAMMER_SESSION_PATH, { recursive: true, force: true });
        return;
      }
      spammerSession.qr = qr;
      spammerSession.status = 'AWAITING_SCAN';
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
      console.log(`[SPAMMER] QR generated (${spammerSession.qrCount}/5). Scan link ini di browser: ${qrUrl}`);
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const errMsg = lastDisconnect?.error?.message || '';
      const isBadMac = errMsg.includes('Bad MAC') || errMsg.includes('Bad Mac') || errMsg.includes('decrypt');
      
      console.log(`[SPAMMER] Connection closed. Reason: ${reason}. BadMAC: ${isBadMac}`);
      spammerSession.status = 'DISCONNECTED';
      spammerSession.socket = null;
      
      if (isBadMac || badMacCount >= BAD_MAC_THRESHOLD) {
        console.warn('[SPAMMER] ⚠️ Bad MAC / session corruption detected. Clearing session files and requesting fresh QR scan...');
        badMacCount = 0;
        spammerSession.hasConnected = false;
        if (fs.existsSync(SPAMMER_SESSION_PATH)) {
          fs.rmSync(SPAMMER_SESSION_PATH, { recursive: true, force: true });
        }
        setTimeout(startSpammerSession, 3000);
        return;
      }

      if (reason !== DisconnectReason.loggedOut && spammerSession.status !== 'TIMEOUT') {
        setTimeout(startSpammerSession, 5000);
      } else if (reason === DisconnectReason.loggedOut) {
        console.log('[SPAMMER] Perangkat ter-logout dari WhatsApp (401). Menghapus sesi...');
        if (fs.existsSync(SPAMMER_SESSION_PATH)) {
          fs.rmSync(SPAMMER_SESSION_PATH, { recursive: true, force: true });
        }
      } else {
        console.log(`[SPAMMER] Disconnected without reconnect intent. Status Code: ${reason}`);
      }
    } else if (connection === 'open') {
      console.log('[SPAMMER] Connected successfully!');
      spammerSession.status = 'CONNECTED';
      spammerSession.qr = null;
      spammerSession.qrCount = 0;
      spammerSession.hasConnected = true;
      console.log('[SPAMMER] Bot Spammer berhasil terhubung! Auto-Poster loop dimulai.');
      
      // Fetch data pertama kali saat koneksi terbuka
      syncTasks();
    }
  });

  socket.ev.on('CB:decrypt', (node) => {
    if (node && node.attrs && node.attrs.type === 'pkmsg') {
      badMacCount++;
      console.warn(`[SPAMMER] Decrypt failure #${badMacCount}/${BAD_MAC_THRESHOLD}. Node:`, node.attrs?.from);
      if (badMacCount >= BAD_MAC_THRESHOLD) {
        console.warn('[SPAMMER] ⚠️ Too many decrypt errors. Triggering session reset...');
        if (spammerSession.socket) {
          try { spammerSession.socket.end(new Error('Bad MAC threshold reached')); } catch(_) {}
        }
      }
    }
  });

  // Fetch data pertama kali secara eksplisit jika perlu
  syncTasks();
}

let isFetching = false;
async function syncTasks() {
  if (isFetching || spammerSession.status !== 'CONNECTED') return;
  isFetching = true;
  try {
    const res = await gasbridge.fetchSpammerTasks();
    if (res.status === 'success' && res.data) {
      currentSpammerTasks = res.data;
      console.log(`[SPAMMER] Berhasil sinkronisasi data dari GAS: ${currentSpammerTasks.length} tasks.`);
    }
  } catch (e) {
    console.error('[SPAMMER] GAS Fetch error:', e.message);
  }
  isFetching = false;
}

// Sinkronisasi dengan GAS setiap 10 menit
setInterval(syncTasks, 10 * 60 * 1000);

// Loop eksekusi pengiriman setiap 30 detik (agar tepat waktu sesuai cooldown)
let isExecutingSpam = false;
setInterval(async () => {
  if (spammerSession.status !== 'CONNECTED' || !spammerSession.socket || isExecutingSpam) return;
  
  isExecutingSpam = true;
  try {
    if (currentSpammerTasks.length > 0) {
      for (const task of currentSpammerTasks) {
        if (!spammerSession.socket || spammerSession.status !== 'CONNECTED') break;
        if (task.Status !== 'Active') continue;
        
        const lastSent = lastSentCache[task.Task_ID] || 0;
        const now = Date.now();
        const cooldownMs = (task.Cooldown_Minutes || 1) * 60 * 1000;
        
        if (now - lastSent >= cooldownMs) {
          console.log(`[SPAMMER] Memproses Task_ID: ${task.Task_ID} ke grup: ${task.Group_Link}`);
          const code = extractInviteCode(task.Group_Link);
          if (!code) {
            console.log(`[SPAMMER] Gagal memproses Task ${task.Task_ID}: Link invite tidak valid.`);
            continue;
          }
          
          // Fungsi helper untuk mencegah promise menggantung selamanya jika koneksi putus tiba-tiba
          const withTimeout = (promise, ms) => {
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error('Timed Out')), ms);
            });
            return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
          };
          
          try {
            // Get invite info to get JID (max 15 detik)
            const groupInfo = await withTimeout(spammerSession.socket.groupGetInviteInfo(code), 15000);
            if (!spammerSession.socket) break; // Double check if disconnected during await
            
            const jid = groupInfo.id;
            
            // Coba join (max 15 detik)
            await withTimeout(spammerSession.socket.groupAcceptInvite(code), 15000).catch(e => {
              // Ignore join error (mungkin sudah ada di dalam grup)
            });
            
            if (!spammerSession.socket) break;
            // Kirim pesan dengan Link Preview jika ada URL (max 25 detik)
            await withTimeout(sendSpamMessage(spammerSession.socket, jid, task.Message_Text), 25000);
            
            console.log(`[SPAMMER] Pesan berhasil dikirim untuk Task ${task.Task_ID} ke ${groupInfo.subject}`);
            
            // Update last sent
            lastSentCache[task.Task_ID] = Date.now();
            
            // Delay kecil antar pesan agar tidak diban
            await new Promise(r => setTimeout(r, 2000));
          } catch (err) {
            const errMsg = err?.message || '';
            console.log(`[SPAMMER] Gagal mengirim pesan untuk Task ${task.Task_ID}:`, errMsg);
            if (errMsg.includes('Connection Closed') || errMsg.includes('Timed Out') || errMsg.includes('write EPIPE') || errMsg.includes('Cannot read properties of null')) {
              console.log('[SPAMMER] Menghentikan loop karena mendeteksi koneksi mati.');
              break;
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('[SPAMMER] Eksekusi loop error:', e.message);
  } finally {
    isExecutingSpam = false;
  }
}, 30 * 1000);

function stopSpammerSession() {
  if (spammerSession.socket) {
    spammerSession.socket.ev.removeAllListeners();
    spammerSession.socket.end(undefined);
    spammerSession.socket = null;
    spammerSession.status = 'DISCONNECTED';
    console.log(`[SPAMMER] Bot Spammer dihentikan.`);
  }
}

function getSpammerSessionStatus() { return spammerSession.status; }
function getSpammerQr() { return spammerSession.qr; }

module.exports = {
  startSpammerSession,
  stopSpammerSession,
  getSpammerSessionStatus,
  getSpammerQr
};
