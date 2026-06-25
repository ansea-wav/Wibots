const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

let wmSocket = null;
let wmQrCode = null;
let wmSessionStatus = 'disconnected';
let wmQrCount = 0;

// We will inject the engine later so it can handle PM commands
let engine = null;
function setWeremafiaEngine(eng) {
  engine = eng;
}

async function startWeremafiaSession() {
  if (wmSessionStatus === 'connected' || wmSessionStatus === 'connecting') {
    console.log('[WM-BOT] Weremafia Bot is already connecting or connected.');
    return;
  }

  console.log('[WM-BOT] Starting Weremafia Bot Session...');
  wmSessionStatus = 'connecting';
  wmQrCode = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState('sessions/weremafia_session');
    const { version } = await fetchLatestBaileysVersion();
    
    wmSocket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.macOS('Desktop'),
      syncFullHistory: false,
      logger: pino({ level: 'silent' })
    });

    wmSocket.ev.on('creds.update', saveCreds);

    wmSocket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        wmQrCount++;
        if (wmQrCount > 5) {
          console.log(`[WM-BOT] Max QR retries reached (5). Stopping generation and timing out.`);
          wmSessionStatus = 'timeout';
          wmSocket.ev.removeAllListeners();
          wmSocket.end(new Error('Max QR retries reached'));
          if (fs.existsSync('sessions/weremafia_session')) fs.rmSync('sessions/weremafia_session', { recursive: true, force: true });
          return;
        }
        wmQrCode = qr;
        wmSessionStatus = 'qr_ready';
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
        console.log(`[WM-BOT] QR generated (${wmQrCount}/5). Scan link ini di browser: ${qrUrl}`);
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut && wmSessionStatus !== 'timeout';
        console.log('[WM-BOT] Connection closed. Reconnect:', shouldReconnect, lastDisconnect?.error?.message || '');
        if (wmSessionStatus !== 'timeout') wmSessionStatus = 'disconnected';
        if (shouldReconnect) {
          console.log('[WM-BOT] Auto-reconnect dinonaktifkan (Bot WM sedang dimatikan).');
          // setTimeout(startWeremafiaSession, 5000);
        } else {
          console.log('[WM-BOT] Logged out from WhatsApp.');
        }
      } else if (connection === 'open') {
        wmSessionStatus = 'connected';
        wmQrCode = null;
        wmQrCount = 0;
        console.log('[WM-BOT] Connected successfully!');
      }
    });

    // Listen to messages (for PM voting / actions)
    wmSocket.ev.on('messages.upsert', async (m) => {
      try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        // Only accept PMs, not groups
        if (remoteJid.endsWith('@g.us')) return;

        const messageType = Object.keys(msg.message)[0];
        let messageText = '';
        if (messageType === 'conversation') {
          messageText = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
          messageText = msg.message.extendedTextMessage.text;
        }

        if (messageText && engine) {
          const senderNumber = remoteJid.split('@')[0];
          await engine.handlePrivateMessage(senderNumber, messageText.trim(), msg);
        }

      } catch (error) {
        console.error('[WM-BOT] Error handling message:', error);
      }
    });

  } catch (error) {
    console.error('[WM-BOT] Failed to start:', error);
    wmSessionStatus = 'error';
  }
}

function stopWeremafiaSession() {
  if (wmSocket) {
    console.log('[WM-BOT] Stopping Weremafia Bot Session...');
    wmSocket.end(undefined);
    wmSocket = null;
  }
  wmSessionStatus = 'disconnected';
  wmQrCode = null;
}

function getWeremafiaSessionStatus() {
  return wmSessionStatus;
}

function getWeremafiaQr() {
  return wmQrCode;
}

async function sendWeremafiaMessage(jid, content, options = {}) {
  if (wmSessionStatus !== 'connected' || !wmSocket) {
    console.log('[WM-BOT] Cannot send message, bot is not connected. Status:', wmSessionStatus);
    return null;
  }
  try {
    console.log(`[WM-BOT] Mengirim pesan pribadi (PM) ke: ${jid}`);
    const result = await wmSocket.sendMessage(jid, content, options);
    console.log(`[WM-BOT] Pesan berhasil dikirim ke ${jid}`);
    return result;
  } catch (error) {
    console.error('[WM-BOT] Failed to send message to', jid, error);
    return null;
  }
}

module.exports = {
  startWeremafiaSession,
  stopWeremafiaSession,
  getWeremafiaSessionStatus,
  getWeremafiaQr,
  sendWeremafiaMessage,
  setWeremafiaEngine
};
