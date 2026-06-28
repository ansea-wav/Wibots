// ============================================================
// YAY by netals — Single Master Bot Session Manager
// ============================================================
// Bot mengidentifikasi DIMANA dia berada berdasarkan GroupJID
// yang tersimpan permanen di database (GAS), bukan dari
// resolve invite link setiap saat.
// ============================================================

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, downloadMediaMessage, generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('@whiskeysockets/baileys');
const pino = require('pino');
const crypto = require('crypto');
const fs = require('fs');

const path = require('path');
const datacache = require('./datacache');
const gasbridge = require('./gasbridge');
const yay_engine = require('./yay_engine');
const economymanager = require('./economymanager');
const gamification = require('./gamification');
const wazle_api = require('./wazle_api');
const wazle_api_v2 = require('./wazle_api_v2');
const tebak_games = require('./tebak_games');
const wazleplay = require('./wazleplay');
const { createCanvas } = require('canvas');
const sharp = require('sharp');
const ytdl = require('@distube/ytdl-core');

// ============================================================
// Dictionary Tebak Kata
// ============================================================
const tebakKataDict = require('./tebak_kata_dict.json');
const tebakKataMudah = tebakKataDict.filter(d => d.word.length >= 4 && d.word.length <= 8);
const tebakKataSedang = tebakKataDict.filter(d => d.word.length > 8 && d.word.length <= 14);
const tebakKataSusah = require('./tebak_kata_majemuk.json');
const tebakKataGames = new Map();
const tebakBoomGames = new Map();
const muteTimeouts = new Map();

function scheduleUnmute(socket, remoteJid, targetPhone, delayMs) {
  if (muteTimeouts.has(targetPhone)) {
    clearTimeout(muteTimeouts.get(targetPhone));
  }

  const timeoutId = setTimeout(async () => {
    try {
      console.log(`[Mute] Auto-unmuting user ${targetPhone}`);
      const gasbridge = require('./gasbridge');
      await gasbridge.deleteMute(targetPhone).catch(() => {});
      datacache.removeMuteLocal(targetPhone);
      muteTimeouts.delete(targetPhone);

      const targetJid = targetPhone.includes('@') ? targetPhone : `${targetPhone}@s.whatsapp.net`;
      await socket.sendMessage(remoteJid, {
        text: `🔊 *[Moderasi]* Periode mute untuk @${targetPhone} telah berakhir. Pengguna sekarang dapat mengirim pesan kembali.`,
        mentions: [targetJid]
      });
    } catch (err) {
      console.error(`[Mute] Error in auto-unmute for ${targetPhone}:`, err);
    }
  }, delayMs);

  muteTimeouts.set(targetPhone, timeoutId);
}

function restoreMutes(socket) {
  console.log('[Mute] Restoring muted users schedules...');
  const now = Date.now();
  for (const [phone, mute] of datacache.mutes.entries()) {
    if (!mute.Expiry_Time || mute.Expiry_Time === 'infinity') continue;
    const expiry = new Date(mute.Expiry_Time).getTime();
    if (isNaN(expiry)) continue;

    const delay = expiry - now;
    const targetChat = mute.Chat_Jid || (socket.user.id.split(':')[0] + '@s.whatsapp.net'); // fallback to self/owner

    if (delay <= 0) {
      // Already expired while bot was offline
      console.log(`[Mute] Expired mute found for ${phone}, cleaning up...`);
      const gasbridge = require('./gasbridge');
      gasbridge.deleteMute(phone).catch(() => {});
      datacache.removeMuteLocal(phone);
    } else {
      console.log(`[Mute] Scheduling unmute for ${phone} in ${Math.round(delay/1000)}s`);
      scheduleUnmute(socket, targetChat, phone, delay);
    }
  }
}

// ============================================================
// Helper JID Formatting
// ============================================================
function formatJid(numberStr) {
  const raw = String(numberStr).replace(/[^0-9]/g, '');
  if (raw.length >= 14 && raw.startsWith('2')) {
    return raw + '@lid';
  }
  return raw + '@s.whatsapp.net';
}

// ============================================================

// Dictionary Sambung Kata
// ============================================================
const validIndonesianWords = new Set();
const validIndonesianWordsArray = [];
const sambungKataGames = new Map();
try {
  const wordsFile = fs.readFileSync(path.join(__dirname, 'node_modules', 'generate-passphrase-id', 'dist', 'words.txt'), 'utf8');
  wordsFile.split('\n').forEach(w => {
    const word = w.trim().toLowerCase();
    if (word.length > 1) {
      validIndonesianWords.add(word);
      validIndonesianWordsArray.push(word);
    }
  });
} catch(e) {
  console.log('[WA] Failed to load words.txt:', e.message);
}

// Syllable counting for Indonesian words
function countSyllables(word) {
  const vowels = 'aiueo';
  let count = 0;
  let prevVowel = false;
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i].toLowerCase());
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  return Math.max(count, 1);
}

function getLastSyllable(word) {
  const vowels = 'aiueo';
  const w = word.toLowerCase();
  let syllables = [];
  let current = '';
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel && current.length > 0 && syllables.length > 0) {
      // Check if there's a consonant before this vowel to split
      // Find the last consonant cluster to attach to new syllable
      let splitAt = current.length;
      for (let j = current.length - 1; j >= 0; j--) {
        if (!vowels.includes(current[j])) splitAt = j;
        else break;
      }
      if (splitAt > 0 && splitAt < current.length) {
        syllables.push(current.slice(0, splitAt));
        current = current.slice(splitAt);
      } else if (current.length > 0) {
        syllables.push(current);
        current = '';
      }
    } else if (isVowel && !prevVowel && current.length > 0 && syllables.length === 0) {
      // First syllable, keep going
    }
    current += w[i];
    if (isVowel && !prevVowel) {
      // Mark vowel group start
    }
    prevVowel = isVowel;
  }
  if (current) syllables.push(current);
  return syllables.length > 0 ? syllables[syllables.length - 1] : w;
}

// Simple Indonesian syllable splitter
function splitSyllables(word) {
  const vowels = 'aiueo';
  const w = word.toLowerCase();
  let result = [];
  let current = '';
  for (let i = 0; i < w.length; i++) {
    current += w[i];
    const isVowel = vowels.includes(w[i]);
    if (isVowel) {
      // Look ahead: if next chars are consonant(s) followed by vowel, split before last consonant
      if (i + 1 < w.length) {
        let nextConsonants = 0;
        for (let j = i + 1; j < w.length; j++) {
          if (!vowels.includes(w[j])) nextConsonants++;
          else break;
        }
        if (nextConsonants === 0) {
          // Next char is also vowel (diphthong), continue
        } else if (nextConsonants === 1) {
          // Single consonant goes to next syllable
          result.push(current);
          current = '';
        } else if (nextConsonants >= 2) {
          // First consonant stays, rest go to next syllable
          current += w[i + 1];
          i++;
          result.push(current);
          current = '';
        }
      }
    }
  }
  if (current) result.push(current);
  return result;
}

// Advanced mode rule descriptions
const advancedModeRules = {
  ahli: {
    title: 'Sambung Kata | Mode Ahli',
    rules: `*📜 Aturan Mode Ahli:*\n• Sambung menggunakan *2 huruf terakhir*.\n• Hanya *Kata Dasar* baku KBBI.\n• Imbuhan (me-, ber-, di-, -kan) dilarang.\n• Waktu menjawab: *30 detik*.\n\n_Contoh: Kra-*ter* → *Te*rindah → ..._`,
    example: 'Kra-ter → Indika-tor → Toga'
  },
  pakar: {
    title: 'Sambung Kata | Mode Pakar',
    rules: `*📜 Aturan Mode Pakar:*\n• Sambung menggunakan *suku kata terakhir*.\n• Wajib *Istilah Ilmiah / Kata Serapan Asing* (minimal 4 suku kata).\n• Waktu menjawab: *30 detik*.\n\n_Contoh: Aklimatisa-*si* → *Si*mulasi → ..._`,
    example: 'Aklimatisasi → Simulasi'
  },
  ekstrem: {
    title: 'Sambung Kata | Mode Ekstrem',
    rules: `*📜 Aturan Mode Ekstrem:*\n• *Suku kata terakhir dibalik* strukturnya jadi awal kata baru.\n• Kata *dilarang mengandung huruf A dan E*.\n• Waktu menjawab: *30 detik*.\n\n_Contoh: Kopi-*rok* → "rok" dibalik jadi "kor" → *Kor*pori → ..._`,
    example: 'Kopirok → Korpori'
  },
  mustahil: {
    title: 'Sambung Kata | Mode Mustahil',
    rules: `*📜 Aturan Mode Mustahil:*\n• Sambung menggunakan *huruf paling terakhir*.\n• Huruf vokal (A, I, U, E, O) *dilarang jadi huruf pertama* kata baru.\n• Kata wajib memiliki *tepat 3 suku kata*.\n• Waktu menjawab: *30 detik*.\n\n_Contoh: Sepat → Tabug → Gerutuk → ..._`,
    example: 'Sepat → Tabug → Gerutuk'
  }
};

const ADVANCED_MODES = ['ahli', 'pakar', 'ekstrem', 'mustahil'];
const ALL_SAMBUNG_MODES = ['mudah', 'sedang', 'susah', ...ADVANCED_MODES];

function generateTebakKata(word, difficulty = 'sedang') {
  let arr = word.split('');
  let hideCount;
  if (difficulty === 'mudah') {
    hideCount = Math.floor(arr.length * 0.2); // 80% terlihat
  } else if (difficulty === 'susah') {
    hideCount = Math.floor(arr.length * 0.8); // 20% terlihat
  } else {
    hideCount = Math.floor(arr.length * 0.5); // 50% terlihat
  }
  
  if (hideCount === 0) hideCount = 1;
  if (hideCount >= arr.length) hideCount = arr.length - 1;
  
  let hiddenIndices = new Set();
  while(hiddenIndices.size < hideCount) {
    hiddenIndices.add(Math.floor(Math.random() * arr.length));
  }
  
  for(let i of hiddenIndices) {
    arr[i] = '_';
  }
  return arr.join(' ');
}

async function nextTebakKataRound(socket, remoteJid) {
  if (!tebakKataGames.has(remoteJid)) return;
  const game = tebakKataGames.get(remoteJid);
  
  if (game.currentIndex >= 10) {
    // End of 10 rounds
    let resultText = `━━━━━━━ ⟡ ━━━━━━━\n\nGame selesai (10 kata)!\n\n`;
    let mentions = [];
    const sortedScores = Object.entries(game.scores).sort((a,b) => b[1] - a[1]);
    if (sortedScores.length === 0) {
      resultText += `Tidak ada yang berhasil menebak satu kata pun. 😅\n`;
    } else {
      let rank = 1;
      for (const [user, score] of sortedScores) {
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
        resultText += `${medal} @${user.split('@')[0]} berhasil menebak ${score} kata\n`;
        mentions.push(formatJid(user));
        rank++;
      }
      
      try {
        const winnerJid = sortedScores[0][0];
        const winnerScore = sortedScores[0][1];
        const winnerPhone = winnerJid.split('@')[0];
        const pRes = await gasbridge.getProfile(winnerPhone);
        if (pRes && pRes.status === 'success') {
          if (winnerScore > 0) {
            let rewardWP = 10;
            let rewardWM = 500;
            let bonusText = '';
            
            if (winnerScore > 2) {
              const extra = winnerScore - 2;
              rewardWP += extra * 5;
              rewardWM += extra * 200;
              bonusText = ` (+Bonus Menjawab > 2 berlipat!)`;
            }
            
            await gasbridge.updateProfile(winnerPhone, { wp: pRes.profile.wp + rewardWP, wm: pRes.profile.wm + rewardWM });
            resultText += `\n🎁 @${winnerPhone} mendapat hadiah Juara 1: +${rewardWP} WP & +${rewardWM} WM${bonusText}!`;
          } else {
            resultText += `\n💔 Sayang sekali, Juara 1 (0 kata) tidak mendapatkan hadiah apa-apa!`;
          }
        }
      } catch(e) {
        console.error('[REWARD ERROR]', e);
      }
    }
    await socket.sendMessage(remoteJid, { text: resultText, mentions }, {});
    const ownerId = findGroupOwner(remoteJid);
    if (ownerId) console.log(`[GAME] Permainan berakhir | ${ownerId}`);
    tebakKataGames.delete(remoteJid);
    return;
  }

  // Pick next word
  const randomWord = game.dict[Math.floor(Math.random() * game.dict.length)];
  game.word = randomWord.word;
  const masked = generateTebakKata(randomWord.word, game.difficulty);
  
  game.currentIndex++;
  
  clearTimeout(game.timeoutId);
  game.timeoutId = setTimeout(async () => {
    if (tebakKataGames.has(remoteJid)) {
      await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\nTidak ada yang bisa menjawab.\nJawaban yang benar adalah: *${randomWord.word}*\n\n_Melanjutkan ke kata berikutnya..._` });
      nextTebakKataRound(socket, remoteJid);
    }
  }, game.timeLimit);

  const gameMsg = `━━━━━━━ ⟡ ━━━━━━━\n\n*Soal ${game.currentIndex}/10*\nKata: ${masked}\nClue (KBBI): ${randomWord.definition}\nWaktu: ${game.timeLimit/1000} Detik\n\n_Balas pesan ini untuk menjawab!_\n\n━━━━━━━ ⟡ ━━━━━━━`;
  const sentMsg = await socket.sendMessage(remoteJid, { text: gameMsg }, {});

  if (game.isZeinaJoin) {
    const ownerId = socket.user.id.split(':')[0] + '@s.whatsapp.net';
    setTimeout(async () => {
      try {
        const yay_engine = require('./yay_engine');
        // Because "Tebak Kata" uses word guessing based on a clue
        const { text: zText, isCorrect } = await yay_engine.playTebakUmumZeina(ownerId, remoteJid, "Kata", randomWord.definition, randomWord.word);
        const zMsg = await socket.sendMessage(remoteJid, { text: zText }, { quoted: sentMsg });
        
        await processTebakKataGuess(socket, remoteJid, 'zeina@s.whatsapp.net', 'Zeina (AI)', isCorrect ? randomWord.word : 'Zzzz', zMsg);
      } catch(e) {
        console.log("[Zeina] Error play tebak kata:", e);
      }
    }, Math.floor(Math.random() * 5000) + 5000); // 5-10 seconds thinking delay
  }
}

async function processTebakKataGuess(socket, remoteJid, senderNumber, pushName, text, msg) {
  if (!tebakKataGames.has(remoteJid)) return;
  const game = tebakKataGames.get(remoteJid);
  if (game.status === 'starting') return;
  
  if (game.scores[senderNumber] === undefined) game.scores[senderNumber] = 0;

  if (text.trim().toUpperCase() === game.word) {
    if (!game.playerNames) game.playerNames = {};
    game.playerNames[senderNumber] = pushName || senderNumber;
    game.scores[senderNumber] = (game.scores[senderNumber] || 0) + 1;
    const playerName = pushName || senderNumber.split('@')[0];
    await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\n🎉 *BENAR SEKALI!*\nJawaban: *${game.word}* (oleh ${playerName})\n\n_Memuat soal selanjutnya..._\n\n_Balas pesan berikutnya untuk menjawab!_` }, { quoted: msg });
    clearTimeout(game.timeoutId);
    nextTebakKataRound(socket, remoteJid);
  } else {
    await socket.sendMessage(remoteJid, { text: `❌ Salah! Coba lagi.` }, { quoted: msg });
  }
}

async function startSambungKataTimeout(socket, remoteJid) {
  if (!sambungKataGames.has(remoteJid)) return;
  const game = sambungKataGames.get(remoteJid);
  
  clearTimeout(game.timeoutId);
  game.timeoutId = setTimeout(async () => {
    if (sambungKataGames.has(remoteJid)) {
      await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\nTidak ada yang bisa menjawab huruf *${game.currentLetter.toUpperCase()}*.\n_Mengacak kata awal baru..._` });
      
      const randomWord = validIndonesianWordsArray[Math.floor(Math.random() * validIndonesianWordsArray.length)];
      game.usedWords.add(randomWord);
      game.currentLetter = randomWord.charAt(randomWord.length - 1);
      
      const remMs = game.roundEndTime - Date.now();
      const timeStr = remMs >= 60000 ? Math.floor(remMs/60000) + ' menit' : Math.max(0, Math.floor(remMs/1000)) + ' detik';
      await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\nKata awal baru: *${randomWord.toUpperCase()}*\nSelanjutnya huruf *${game.currentLetter.toUpperCase()}*...\n\n_Sisa waktu ronde: ${timeStr}._\n\n_Balas pesan ini untuk melanjutkan kata (harus ada di KBBI)!_` });
      
      startSambungKataTimeout(socket, remoteJid);
    }
  }, game.timeLimit);
}

async function startTebakBoomTimeout(socket, remoteJid) {
  if (!tebakBoomGames.has(remoteJid)) return;
  const game = tebakBoomGames.get(remoteJid);
  clearTimeout(game.timeoutId);
  game.timeoutId = setTimeout(async () => {
    if (tebakBoomGames.has(remoteJid)) {
      await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\nBoom: *${game.boomNumber}*\nGame dibatalkan karena tidak ada yang menjawab.` });
      tebakBoomGames.delete(remoteJid);
    }
  }, 120000);
}

async function startCountdownLobby(socket, remoteJid, gameName, onFinish) {
  const intervals = [60, 50, 40, 30, 20, 10, 5, 4, 3, 2, 1];
  let msg = null;
  
  let tutorial = '';
  if (gameName === 'Tebak Kata') {
    tutorial = `*📖 Cara Bermain:*\nBot akan memberikan kata yang hurufnya disamarkan (contoh: P*L*U) dan sebuah petunjuk/arti kata. Tugas Anda adalah menebak kata tersebut!\n\n_⚠️ Pastikan Anda me-REPLY (membalas) pesan bot untuk menjawab!_\n\n_🛑 Bot otomatis memblokir semua perintah (command) selama game berlangsung. Nikmati permainannya!_`;
  } else if (gameName === 'Sambung Kata') {
    tutorial = `*📖 Cara Bermain:*\nBot akan memberikan sebuah kata. Anda harus menyambung dengan kata lain yang diawali oleh huruf terakhir dari kata sebelumnya. Kata harus valid di KBBI. Game berlangsung bebas selama 8 menit!\n\n_⚠️ Pastikan Anda me-REPLY (membalas) pesan bot untuk menjawab!_\n\n_🛑 Bot otomatis memblokir semua perintah (command) selama game berlangsung. Nikmati permainannya!_`;
  } else if (gameName === 'Tebak Boom') {
    tutorial = `*📖 Cara Bermain:*\nBot akan memilih satu angka rahasia ("Boom"). Pemain bergantian menebak angka secara bebas.\nJika angka tebakan LEBIH KECIL dari Boom, rentang bawah naik.\nJika LEBIH BESAR, rentang atas turun.\n\n💥 Jika ada yang MENEBAK ANGKA BOOM TEPAT, dia akan terkena ledakan dan kalah!\nPemenangnya adalah yang bisa bertahan paling banyak menebak dengan aman.\n\n_⚠️ Pastikan Anda me-REPLY (membalas) pesan bot untuk menjawab!_\n\n_🛑 Bot otomatis memblokir semua perintah (command) selama game berlangsung. Nikmati permainannya!_`;
  }

  const getText = (time) => `━━━━━━━ ⟡ ━━━━━━━\n\n${tutorial}\n\nGame *${gameName}* akan dimulai dalam *${time}* detik lagi!`;

  try {
    msg = await socket.sendMessage(remoteJid, { text: getText(60) });
  } catch(e) {
    onFinish();
    return;
  }
  
  for (let i = 1; i < intervals.length; i++) {
    const nextTime = intervals[i];
    const waitTime = intervals[i-1] - intervals[i];
    await new Promise(r => setTimeout(r, waitTime * 1000));
    try {
      await socket.sendMessage(remoteJid, { text: getText(nextTime), edit: msg.key });
    } catch(e) {}
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  try {
    await socket.sendMessage(remoteJid, { delete: msg.key });
  } catch(e) {}
  
  let startMsg = null;
  try {
    startMsg = await socket.sendMessage(remoteJid, { text: `🚀 *Memulai Permainan ${gameName}...*` });
  } catch(e) {}
  
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    if (startMsg) await socket.sendMessage(remoteJid, { delete: startMsg.key });
  } catch(e) {}
  
  onFinish();
}

async function startAdvancedCountdownLobby(socket, remoteJid, modeInfo, onFinish) {
  const intervals = [60, 50, 40, 30, 20, 10, 5, 4, 3, 2, 1];
  let msg = null;

  const getText = (time) => `━━━━━━━ ⟡ ━━━━━━━\n\n${modeInfo.rules}\n\nGame akan dimulai dalam *${time}* detik lagi!\n\n_⛔ Tidak ada perintah batal / kembali, nikmati game nya._`;

  try {
    msg = await socket.sendMessage(remoteJid, { text: getText(60) });
  } catch(e) {
    onFinish();
    return;
  }
  
  for (let i = 1; i < intervals.length; i++) {
    const nextTime = intervals[i];
    const waitTime = intervals[i-1] - intervals[i];
    await new Promise(r => setTimeout(r, waitTime * 1000));
    try {
      await socket.sendMessage(remoteJid, { text: getText(nextTime), edit: msg.key });
    } catch(e) {}
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  try {
    await socket.sendMessage(remoteJid, { delete: msg.key });
  } catch(e) {}
  
  let startMsg = null;
  try {
    startMsg = await socket.sendMessage(remoteJid, { text: `🚀 *Memulai ${modeInfo.title}...*` });
  } catch(e) {}
  
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    if (startMsg) await socket.sendMessage(remoteJid, { delete: startMsg.key });
  } catch(e) {}
  
  onFinish();
}

async function startTebakBoomCountdown(socket, remoteJid) {
  const intervals = [60, 50, 40, 30, 20, 10, 5, 4, 3, 2, 1];
  let msg = null;
  const gameName = 'Tebak Boom';
  const game = tebakBoomGames.get(remoteJid);
  if (!game) return;

  const tutorial = `*📖 Cara Bermain:*\nBot akan memilih satu angka rahasia ("Boom"). Pemain bergantian menebak angka secara bergiliran.\nJika angka tebakan BUKAN Boom, rentang akan mengecil.\n\n💥 Jika ada yang MENEBAK ANGKA BOOM TEPAT, atau sisa angka tinggal 1 dan itu giliran dia, dia akan terkena ledakan dan kalah!\nPemenangnya adalah semua orang yang tidak meledak.\n\n_⚠️ Pastikan Anda me-REPLY (membalas) pesan bot untuk menjawab!_\n_🛑 Hanya pemain yang gilirannya yang boleh menjawab!_`;

  const getText = (time) => `━━━━━━━ ⟡ ━━━━━━━\n\n${tutorial}\n\nGame *${gameName}* akan dimulai dalam *${time}* detik lagi!`;

  try {
    msg = await socket.sendMessage(remoteJid, { text: getText(60) });
  } catch(e) {
    return;
  }
  
  for (let i = 1; i < intervals.length; i++) {
    const nextTime = intervals[i];
    const waitTime = intervals[i-1] - intervals[i];
    await new Promise(r => setTimeout(r, waitTime * 1000));
    try {
      await socket.sendMessage(remoteJid, { text: getText(nextTime), edit: msg.key });
      if (nextTime === 20 && game.pinnedMsgKey) {
        const metadata = await socket.groupMetadata(remoteJid);
        const botJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = metadata.participants.find(p => p.id === botJid);
        if (botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin')) {
          await socket.sendMessage(remoteJid, { keepInChat: { keepType: 2, key: game.pinnedMsgKey } }).catch(()=>{});
        }
        game.pinnedMsgKey = null;
      }
    } catch(e) {}
  }
  
  await new Promise(r => setTimeout(r, 1000));
  try { await socket.sendMessage(remoteJid, { delete: msg.key }); } catch(e) {}
  
  let startMsg = null;
  try { startMsg = await socket.sendMessage(remoteJid, { text: `🚀 *Memulai Permainan ${gameName}...*` }); } catch(e) {}
  await new Promise(r => setTimeout(r, 2000));
  try { if (startMsg) await socket.sendMessage(remoteJid, { delete: startMsg.key }); } catch(e) {}
  
  const currentGame = tebakBoomGames.get(remoteJid);
  if (!currentGame || currentGame.status !== 'waiting') return;
  
  const boomNumber = Math.floor(Math.random() * currentGame.max) + 1;
  currentGame.status = 'playing';
  currentGame.boomNumber = boomNumber;
  currentGame.min = 1;
  currentGame.scores = {};
  currentGame.turnIndex = 0;
  
  startTebakBoomTimeout(socket, remoteJid);
  
  const currentPlayer = currentGame.players[0];
  const mText = `━━━━━━━ ⟡ ━━━━━━━\n\nAngka Boom disembunyikan!\n👉 *1* - *${currentGame.max}*\n\nGiliran *${currentPlayer.name}*\n_Balas pesan ini dengan angka!_`;
  
  const sentMsg = await socket.sendMessage(remoteJid, { text: mText, mentions: [formatJid(currentPlayer.id)] });
  
  if (currentPlayer.id === 'zeina@s.whatsapp.net') {
     triggerZeinaTebakBoomTurn(socket, remoteJid, sentMsg);
  }
}

async function triggerZeinaTebakBoomTurn(socket, remoteJid, promptMsg) {
  const game = tebakBoomGames.get(remoteJid);
  if (!game || game.status !== 'playing') return;
  const currentPlayer = game.players[game.turnIndex];
  if (currentPlayer.id !== 'zeina@s.whatsapp.net') return;

  const ownerId = socket.user.id.split(':')[0] + '@s.whatsapp.net'; // fallback owner id
  setTimeout(async () => {
    try {
      const yay_engine = require('./yay_engine');
      const { text: zText, guess: zGuess } = await yay_engine.playTebakBoomZeina(ownerId, remoteJid, game.min, game.max);
      const zMsg = await socket.sendMessage(remoteJid, { text: zText }, { quoted: promptMsg });
      await processTebakBoomGuess(socket, remoteJid, 'zeina@s.whatsapp.net', zGuess, zMsg, ownerId);
    } catch(e) {
      console.log("[Zeina] Error turn:", e);
    }
  }, 3000);
}

async function processTebakBoomGuess(socket, remoteJid, senderNumber, guess, msg, ownerId) {
  const game = tebakBoomGames.get(remoteJid);
  if (!game || game.status !== 'playing') return;
  
  const currentPlayer = game.players[game.turnIndex];
  if (senderNumber !== currentPlayer.id) return;

  if (guess >= game.min && guess <= game.max) {
    if (guess === game.boomNumber || (game.min === game.max && guess === game.boomNumber)) {
      // BOOM!
      let resultText = `━━━━━━━ ⟡ ━━━━━━━\n\n*${currentPlayer.name}* menebak *${guess}* dan DUARRR!\n\n🏆 *Pemain Selamat:*\n`;
      let mentions = game.players.map(p => formatJid(p.id));
      let survivors = game.players.filter(p => p.id !== senderNumber);
      if (survivors.length > 0) {
        resultText += `🎉 Pemain yang selamat:\n`;
        survivors.forEach(p => {
          resultText += `- @${p.id.split('@')[0]}\n`;
        });
      } else {
        resultText += `\nSayang sekali, tidak ada yang selamat!`;
      }
      await socket.sendMessage(remoteJid, { text: resultText, mentions }, { quoted: msg });
      clearTimeout(game.timeoutId);
      tebakBoomGames.delete(remoteJid);
    } else {
      if (guess > game.boomNumber) {
        game.max = guess - 1;
      } else {
        game.min = guess + 1;
      }
      game.turnIndex = (game.turnIndex + 1) % game.players.length;
      const nextPlayer = game.players[game.turnIndex];
      
      // Check if only 1 number left
      if (game.min === game.max) {
          let resultText = `━━━━━━━ ⟡ ━━━━━━━\n\nSisa angka *${game.min}*!\n*${nextPlayer.name}* otomatis meledak!\n\n🏆 *Pemain Selamat:*\n`;
          let mentions = game.players.map(p => formatJid(p.id));
          let survivors = game.players.filter(p => p.id !== nextPlayer.id);
          if (survivors.length > 0) {
            survivors.forEach(p => {
              resultText += `- @${p.id.split('@')[0]}\n`;
            });
          } else {
            resultText += `Tidak ada!`;
          }
          await socket.sendMessage(remoteJid, { text: resultText, mentions }, { quoted: msg });
          clearTimeout(game.timeoutId);
          tebakBoomGames.delete(remoteJid);
      } else {
          startTebakBoomTimeout(socket, remoteJid);
          const promptMsg = await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\n👉 *${game.min}* - *${game.max}*\n\nGiliran *${nextPlayer.name}*\n_Balas dengan angka!_`, mentions: [formatJid(nextPlayer.id)] }, { quoted: msg });
          if (nextPlayer.id === 'zeina@s.whatsapp.net') {
            triggerZeinaTebakBoomTurn(socket, remoteJid, promptMsg);
          }
      }
    }
  } else {
    await socket.sendMessage(remoteJid, { text: `⚠️ Angka tebakan harus di antara *${game.min}* sampai *${game.max}*!` }, { quoted: msg });
  }
}


const AUTH_DIR = path.join(__dirname, 'sessions');
const MASTER_SESSION_PATH = path.join(AUTH_DIR, 'master-bot');

let masterSession = {
  socket: null,
  status: 'NO_SESSION',
  qr: null,
  hasConnected: false,
  qrCount: 0
};

// Tracks consecutive Bad MAC / decrypt errors to auto-recover corrupt sessions
let badMacCount = 0;
const BAD_MAC_THRESHOLD = 5;

// Ensure sessions directory exists
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

function extractInviteCode(url) {
  if (!url) return null;
  const match = url.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Cari client yang punya grup ini berdasarkan GroupJID tersimpan di cache.
 * Tidak perlu resolve ulang setiap saat — JID sudah disimpan permanen.
 */
function findGroupOwner(remoteJid) {
  const clients = datacache.getAllClients();
  for (const client of clients) {
    for (let i = 1; i <= 5; i++) {
      if (client[`GroupJID_${i}`] === remoteJid) {
        return client.User_ID;
      }
    }
  }
  return null;
}

/**
 * Resolve invite link → JID, lalu simpan ke GAS & cache.
 * Dipanggil saat user save group link lewat web panel.
 */
async function resolveAndSaveGroupJid(socket, userId, groupIndex, inviteLink) {
  const code = extractInviteCode(inviteLink);
  if (!code) return null;

  try {
    const groupInfo = await socket.groupGetInviteInfo(code);
    const jid = groupInfo.id;

    // Simpan JID ke GAS agar persistent
    const fields = {};
    fields[`GroupJID_${groupIndex}`] = jid;
    await gasbridge.updateClientRegistry(userId, fields);

    // Update cache lokal
    datacache.updateClientField(userId, `GroupJID_${groupIndex}`, jid);

    console.log(`[WA] Grup ${groupIndex} (${userId}) resolved: ${jid}`);
    return jid;
  } catch (e) {
    console.log(`[WA] Gagal resolve grup ${groupIndex} (${userId}):`, e.message);
    return null;
  }
}

/**
 * Sync semua grup yang belum punya JID tersimpan.
 * Hanya dipanggil sekali saat bot connect, bukan setiap pesan.
 */
async function syncMissingGroupJids(socket) {
  const clients = datacache.getAllClients();
  for (const client of clients) {
    if (client.Account_Status !== 'Active') continue;
    for (let i = 1; i <= 5; i++) {
      const link = client[`Group_${i}`];
      const existingJid = client[`GroupJID_${i}`];
      // Hanya resolve kalau ada link tapi belum ada JID tersimpan
      if (link && !existingJid) {
        await resolveAndSaveGroupJid(socket, client.User_ID, i, link);
        // Delay kecil agar tidak spam WhatsApp API
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
}

/**
 * Start the Global WhatsApp session.
 */
// ============================================================
// STICKER GENERATOR
// ============================================================
async function makeTextSticker(inputText) {
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = 40;
    const maxWidth = 512 - (padding * 2);
    const maxHeight = 512 - (padding * 2);

    let fontSize = 200;
    let lines = [];
    let lineHeight = 0;
    let totalHeight = 0;

    // Auto-scale font size to fit constraints
    while (fontSize > 10) {
        ctx.font = `${fontSize}px Arial, sans-serif`;
        lineHeight = fontSize * 1.1;
        
        const words = inputText.split(' ');
        lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        // Check if any single word is wider than maxWidth
        let wordTooLong = false;
        for (let i = 0; i < lines.length; i++) {
            if (ctx.measureText(lines[i]).width > maxWidth) {
                wordTooLong = true;
                break;
            }
        }

        totalHeight = lines.length * lineHeight;

        if (!wordTooLong && totalHeight <= maxHeight) {
            break; // Fits perfectly
        }

        fontSize -= 5;
    }

    // Draw vertically and horizontally centered
    const startY = (512 - totalHeight) / 2 + (lineHeight / 2);
    let currentY = startY;

    lines.forEach(line => {
        ctx.fillText(line, 256, currentY);
        currentY += lineHeight;
    });

    const pngBuffer = canvas.toBuffer('image/png');
    const webpSticker = await sharp(pngBuffer)
        .webp({ quality: 80 })
        .toBuffer();

    return webpSticker;
}

async function startMasterSession(io) {
  if (['CONNECTED', 'CONNECTING', 'SCAN_QR'].includes(masterSession.status)) {
    console.log(`[WA] Master Bot already ${masterSession.status}.`);
    return;
  }

  if (!fs.existsSync(MASTER_SESSION_PATH)) fs.mkdirSync(MASTER_SESSION_PATH, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(MASTER_SESSION_PATH);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop'),
    keepAliveIntervalMs: 20000,
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  const originalSendMessage = socket.sendMessage;
  socket.sendMessage = async (jid, content, options) => {
    // JEDA ACAK 0.2s - 0.5s UNTUK ANTI SPAM
    const delayMs = Math.floor(Math.random() * (500 - 200 + 1)) + 200;
    await new Promise(resolve => setTimeout(resolve, delayMs));

    if (content && typeof content.text === 'string') {
      // Jangan tambahkan footer kalau sudah ada (mencegah double footer)
      if (!content.text.includes('𝐖𝗮𝘇𝗹ꤢ  • Beta Release')) {
        content.text = content.text + '\n\n  𝐖𝗮𝘇𝗹ꤢ  • Beta Release • wazle.my.id';
      }
    }
    return originalSendMessage.apply(socket, [jid, content, options]);
  };

  masterSession.socket = socket;
  masterSession.status = 'CONNECTING';
  masterSession.qr = null;

  socket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      masterSession.qrCount++;
      if (masterSession.qrCount > 5) {
        console.log(`[WA] Max QR retries reached (5). Stopping generation and timing out.`);
        masterSession.status = 'TIMEOUT';
        io.emit('bot_status', { state: 'TIMEOUT' });
        masterSession.socket.ev.removeAllListeners();
        masterSession.socket.end(new Error('Max QR retries reached'));
        if (fs.existsSync(MASTER_SESSION_PATH)) fs.rmSync(MASTER_SESSION_PATH, { recursive: true, force: true });
        return;
      }
      masterSession.qr = qr;
      masterSession.status = 'SCAN_QR';
      io.emit('qr_code', { qr });
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
      console.log(`[WA] Master QR generated (${masterSession.qrCount}/5). Scan: ${qrUrl}`);
    }

    if (connection === 'open') {
      masterSession.status = 'CONNECTED';
      masterSession.qr = null;
      masterSession.qrCount = 0;
      masterSession.hasConnected = true;
      io.emit('bot_status', { state: 'ONLINE' });
      console.log(`[WA] Master Bot connected!`);

      // Set bot as online explicitly
      socket.sendPresenceUpdate('available');

      // Sync grup yang belum punya JID — hanya sekali saat connect
      syncMissingGroupJids(socket).catch(e => console.error('[WA] Sync error:', e));

      // Restore active mutes scheduling
      restoreMutes(socket);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errMsg = lastDisconnect?.error?.message || '';
      const isBadMac = errMsg.includes('Bad MAC') || errMsg.includes('Bad Mac') || errMsg.includes('decrypt');
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      masterSession.status = 'DISCONNECTED';
      if (masterSession.socket) masterSession.socket.ev.removeAllListeners();

      io.emit('bot_status', { state: 'OFFLINE' });
      console.log(`[WA] Master Bot disconnected. Code: ${statusCode}. BadMAC: ${isBadMac}. Reconnect: ${shouldReconnect}`);

      if (isBadMac || badMacCount >= BAD_MAC_THRESHOLD) {
        // Session is cryptographically corrupted — must clear and re-scan QR
        console.warn('[WA] ⚠️  Bad MAC / session corruption detected. Clearing session files and requesting fresh QR scan...');
        badMacCount = 0;
        masterSession.hasConnected = false;
        if (fs.existsSync(MASTER_SESSION_PATH)) {
          fs.rmSync(MASTER_SESSION_PATH, { recursive: true, force: true });
        }
        setTimeout(() => startMasterSession(io), 3000);
        return;
      }

      if (shouldReconnect && masterSession.status !== 'TIMEOUT') {
        if (!masterSession.hasConnected && statusCode === 408) {
          console.log(`[WA] Timeout during QR phase. Clearing session...`);
          if (fs.existsSync(MASTER_SESSION_PATH)) {
            fs.rmSync(MASTER_SESSION_PATH, { recursive: true, force: true });
          }
        }
        setTimeout(() => startMasterSession(io), 5000);
      } else if (statusCode === DisconnectReason.loggedOut) {
        console.log('[WA] Perangkat ter-logout dari WhatsApp (401). Menghapus sesi...');
        masterSession.socket = null;
        masterSession.hasConnected = false;
        if (fs.existsSync(MASTER_SESSION_PATH)) {
          fs.rmSync(MASTER_SESSION_PATH, { recursive: true, force: true });
        }
      } else {
        console.log(`[WA] Disconnected without reconnect intent. Status Code: ${statusCode}`);
        masterSession.socket = null;
        masterSession.hasConnected = false;
      }
    }
  });

  // ============================================================
  // Bad MAC / Decrypt failure handler
  // Catches libsignal errors that don't trigger connection.update
  // ============================================================
  socket.ev.on('CB:decrypt', (node) => {
    if (node && node.attrs && node.attrs.type === 'pkmsg') {
      badMacCount++;
      console.warn(`[WA] Decrypt failure #${badMacCount}/${BAD_MAC_THRESHOLD}. Node:`, node.attrs?.from);
      if (badMacCount >= BAD_MAC_THRESHOLD) {
        console.warn('[WA] ⚠️  Too many decrypt errors. Triggering session reset...');
        if (masterSession.socket) {
          try { masterSession.socket.end(new Error('Bad MAC threshold reached')); } catch(_) {}
        }
      }
    }
  });

  socket.ev.on('creds.update', saveCreds);

  // ============================================================
  // AFK Tracker Map & Chat Counter Buffer
  // ============================================================
  const afkMap = new Map();
  const chatCountBuffer = new Map();

  // ============================================================
  // Message Handler — Bot identifikasi dari GroupJID di database
  // ============================================================
  socket.ev.on('messages.upsert', async (m) => {
    try {
      if (!m.messages || m.messages.length === 0) return;
    const msg = m.messages[0];
    
    // Abaikan pesan jika dikirim oleh script Baileys ini sendiri (biasanya ID berawalan BAE5 atau 3EB0)
    // agar tidak terjadi infinite loop. Tapi izinkan jika diketik manual via WA Web/HP (fromMe).
    if (msg.key.fromMe && (msg.key.id?.startsWith('BAE5') || msg.key.id?.startsWith('3EB0'))) return;

    const remoteJid = msg.key.remoteJid;
    let senderJid = msg.key.participant;
    let cleanSenderJid = '';
    
    if (msg.key.fromMe) {
      // Jika pesan dikirim oleh bot/owner sendiri, gunakan nomor owner secara langsung 
      // untuk menghindari bug WhatsApp Web yang kadang mengembalikan ID @lid aneh (seperti 231...)
      senderJid = '62882008677172@s.whatsapp.net';
      senderNumber = '62882008677172';
      cleanSenderJid = senderJid;
    } else {
      if (!senderJid) senderJid = remoteJid;
      const [idPart, domainPart] = senderJid.split('@');
      senderNumber = idPart.split(':')[0];
      cleanSenderJid = `${senderNumber}@${domainPart || 's.whatsapp.net'}`;
    }

    const isGroup = remoteJid.endsWith('@g.us');
    if (!isGroup) {
      if (!msg.key.fromMe && senderNumber !== '62882008677172') {
        // Jangan kirim pesan ke pelaku agar tidak memancing blokir dari WA. Langsung block saja.
        try {
          await socket.updateBlockStatus(remoteJid, 'block');
        } catch(e) {}
        
        // Gunakan mention (@nomor) agar bisa di-klik di WA, bahkan untuk LID sekalipun
        const reportText = `🚨 *LAPORAN BLACKLIST RC* 🚨\nTanggal: ${new Date().toLocaleString('id-ID')}\nPelanggar: @${senderNumber}\n\n*Aksi:* Telah diblokir otomatis oleh bot.\n\nSalin teks di bawah ini untuk dikirim ke nomor pelanggar:\n\n"Halo semut, kamu baru saja ngechat RC bot YAY. Hal tersebut sangat merugikan karena bot bisa diblokir oleh pihak WhatsApp. Sesuai aturan, kamu dikenakan sanksi denda Rp 5.000. Harap segera bayar atau nomor kamu akan diblacklist permanen dari seluruh ekosistem YAY!"`;
        
        await socket.sendMessage('62882008677172@s.whatsapp.net', { 
          text: reportText,
          mentions: [senderJid] 
        });

        // Buat vCard (Kontak WA) agar owner bisa langsung 'Message' / simpan nomor
        const vcard = 'BEGIN:VCARD\n'
            + 'VERSION:3.0\n'
            + 'FN:Pelanggar RC\n'
            + `TEL;type=CELL;type=VOICE;waid=${senderNumber}:+${senderNumber}\n`
            + 'END:VCARD';

        await socket.sendMessage('62882008677172@s.whatsapp.net', {
            contacts: {
                displayName: 'Pelanggar RC',
                contacts: [{ vcard }]
            }
        });

        datacache.addBlacklistedLocal(senderNumber);
        gasbridge.addToBlacklist(senderNumber, 'RC Spam').catch(e => console.error('[Blacklist] Error:', e));
      }
      return;
    }

    // Cari owner berdasarkan JID yang sudah tersimpan di database
    const ownerId = findGroupOwner(remoteJid);

    // Kalau tidak ketemu, berarti pesan ini datang dari grup yang tidak terdaftar di sistem.
    if (!ownerId) {
      return; 
    }

    // Tandai pesan sudah dibaca (Centang 2 biru) agar user tahu bot menerima pesan
    // HAPUS AWAIT: Jangan ditunggu karena bisa memakan waktu 5-7 detik jika koneksi WhatsApp lambat
    // ANTI-SPAM WA: Hanya tandai read jika pesan berasal dari Grup (bukan PM)
    if (isGroup) {
      try {
        socket.readMessages([msg.key]).catch(()=>{});
      } catch(e) {}
    }

    const client = datacache.getClient(ownerId);
    if (!client || client.Account_Status !== 'Active') {
      console.log(`[WA] Client ${ownerId} is not Active or not found.`);
      return;
    }

    let config = datacache.getConfig(ownerId);
    if (!config) {
      console.log(`[WA] Config for ${ownerId} not found, using default config.`);
      config = {
        Allow_Group_Response: true,
        Allow_Private_Response: true,
        Anti_Link_Group: false,
        Welcome_Message_Status: true,
        Custom_Welcome_Text: "Selamat datang {member} di {group}! 🎉",
        Cmd_Hidetag_Status: true,
        Cmd_SetDel_Status: true,
        Cmd_Stiker_Status: true
      };
    }
    const text = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || 
                 msg.message?.imageMessage?.caption || 
                 msg.message?.videoMessage?.caption || 
                 '';

    // --- AFK LOGIC ---
    if (!msg.key.fromMe) {
      // Jika yang mengirim pesan sedang AFK, copot status AFK-nya
      if (afkMap.has(senderNumber)) {
        const afkData = afkMap.get(senderNumber);
        const duration = Math.round((Date.now() - afkData.time) / 60000); // menit
        afkMap.delete(senderNumber);
        await socket.sendMessage(remoteJid, { text: `Berhenti AFK setelah ${duration} menit.` }, { quoted: msg });
      }

      // Cek apakah pesan ini me-mention atau me-reply orang yang sedang AFK
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
      let afkTargets = [];
      for (let m of mentions) afkTargets.push(m.split('@')[0]);
      if (quotedParticipant) afkTargets.push(quotedParticipant.split('@')[0]);
      
      for (let target of afkTargets) {
        if (afkMap.has(target)) {
          const afkData = afkMap.get(target);
          await socket.sendMessage(remoteJid, { text: `Peringatan! Orang yang kamu tag sedang AFK.\n\n*Alasan:* ${afkData.reason}` }, { quoted: msg });
        }
      }
    }
    // -----------------

    // --- TOTALCHAT BATCHING ---
    if (!msg.key.fromMe) {
      const currentCount = (chatCountBuffer.get(senderNumber) || 0) + 1;
      chatCountBuffer.set(senderNumber, currentCount);
      if (currentCount >= 5) {
         chatCountBuffer.set(senderNumber, 0);
         gasbridge.getProfile(senderNumber).then(profRes => {
           if (profRes && profRes.profile) {
             let newTotal = (profRes.profile.totalchat || 0) + 5;
             let updates = { totalchat: newTotal };
             
             // Auto-generate julukan jika masih default dan totalchat >= 5
             if (newTotal >= 5 && (!profRes.profile.julukan || profRes.profile.julukan.includes('Lebih Aktif lagi'))) {
               try {

                 const julukans = JSON.parse(fs.readFileSync('./julukans.json', 'utf8'));
                 const randomJulukan = julukans[Math.floor(Math.random() * julukans.length)];
                 updates.julukan = randomJulukan;
                 
                 // Send notification and auto-delete after 5s
                 socket.sendMessage(remoteJid, { text: `🎉 Kamu mendapatkan julukan *${randomJulukan}*!\nCek di *!profile*` }).then(sentMsg => {
                   setTimeout(() => {
                     socket.sendMessage(remoteJid, { delete: sentMsg.key }).catch(()=>{});
                   }, 5000);
                 }).catch(()=>{});
                 
               } catch (e) {
                 console.error('Failed to auto-generate julukan:', e);
               }
             }
             
             gasbridge.updateProfile(senderNumber, updates).catch(()=>{});
           }
         }).catch(()=>{});
      }
    }
    // -------------------------

    // --- WEREMAFIA INTERCEPTOR ---
    // (WM support removed)
    // -----------------------------

    // Mute Interceptor
    if (datacache.isMuted(senderNumber) && !msg.key.fromMe) {
      try {
        console.log(`[WA] Deleting message from muted user ${senderNumber}`);
        await socket.sendMessage(remoteJid, { delete: msg.key });
      } catch (err) {
        console.error('[WA] Gagal menghapus pesan user termute:', err.message);
      }
      return;
    }

    // --- Group Toxic & Custom Keyword Moderation Filter ---
    if (isGroup && !msg.key.fromMe) {
      const groupSettings = datacache.getGroupSettings(remoteJid);
      if (groupSettings) {
        const enableDefault = groupSettings.Enable_Default_Filter === true || groupSettings.Enable_Default_Filter === 'TRUE' || groupSettings.Enable_Default_Filter === 'true';
        const customKeywordsStr = groupSettings.Custom_Keywords || '';
        const matchingMode = groupSettings.Matching_Mode || 'fuzzy';
        const maxWarn = parseInt(groupSettings.Max_Warn) || 3;
        const punishment = groupSettings.Punishment_Action || 'kick';
        const warnDecayHours = parseInt(groupSettings.Warn_Decay_Hours) || 24;

        // Clean incoming text
        let cleanText = text.toLowerCase();
        
        // Define default toxic list
        const defaultToxicList = ['anjing', 'babi', 'bangsat', 'kontol', 'memek', 'jembut', 'goblok', 'tolol', 'pantek', 'asu', 'bajingan', 'perek', 'lonte', 'ngentot'];

        let isMatch = false;
        let matchedWord = '';

        if (matchingMode === 'fuzzy') {
          const cleanFuzzy = (str) => {
            return str.toLowerCase()
              .replace(/[^a-z0-9]/gi, '') // remove symbols/spaces/punctuation
              .replace(/4/g, 'a')
              .replace(/1/g, 'i')
              .replace(/3/g, 'e')
              .replace(/0/g, 'o')
              .replace(/9/g, 'g')
              .replace(/5/g, 's');
          };
          const fuzzyText = cleanFuzzy(text);

          // Check default filter
          if (enableDefault) {
            for (const word of defaultToxicList) {
              if (fuzzyText.includes(word)) {
                isMatch = true;
                matchedWord = word;
                break;
              }
            }
          }

          // Check custom keywords
          if (!isMatch && customKeywordsStr) {
            const keywords = customKeywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
            for (const kw of keywords) {
              const cleanedKw = cleanFuzzy(kw);
              if (fuzzyText.includes(cleanedKw)) {
                isMatch = true;
                matchedWord = kw;
                break;
              }
            }
          }
        } else {
          // Exact matching
          if (enableDefault) {
            for (const word of defaultToxicList) {
              const regex = new RegExp(`\\b${word}\\b`, 'i');
              if (regex.test(text)) {
                isMatch = true;
                matchedWord = word;
                break;
              }
            }
          }

          if (!isMatch && customKeywordsStr) {
            const keywords = customKeywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
            for (const kw of keywords) {
              if (/[^a-z0-9]/i.test(kw)) {
                if (text.toLowerCase().includes(kw)) {
                  isMatch = true;
                  matchedWord = kw;
                  break;
                }
              } else {
                const regex = new RegExp(`\\b${kw}\\b`, 'i');
                if (regex.test(text)) {
                  isMatch = true;
                  matchedWord = kw;
                  break;
                }
              }
            }
          }
        }

        if (isMatch) {
          try {
            await socket.sendMessage(remoteJid, { delete: msg.key }).catch(() => {});

            const warnRecord = datacache.getGroupWarningLocal(remoteJid, senderNumber) || {
              Group_ID: remoteJid,
              Phone_Number: senderNumber,
              Warn_Count: 0,
              Last_Toxic_Time: new Date(0).toISOString()
            };

            let currentCount = parseInt(warnRecord.Warn_Count) || 0;
            const lastTime = new Date(warnRecord.Last_Toxic_Time).getTime();

            // Decay logic
            if (currentCount > 0 && lastTime > 0) {
              const hoursPassed = (Date.now() - lastTime) / (60 * 60 * 1000);
              const decayAmount = Math.floor(hoursPassed / warnDecayHours);
              if (decayAmount > 0) {
                currentCount = Math.max(0, currentCount - decayAmount);
              }
            }

            const newCount = currentCount + 1;
            const updatedTime = new Date().toISOString();

            await gasbridge.updateGroupWarnings(remoteJid, senderNumber, newCount, updatedTime);
            datacache.updateGroupWarningLocal(remoteJid, senderNumber, newCount, updatedTime);

            const targetJid = `${senderNumber}@s.whatsapp.net`;

            if (newCount >= maxWarn) {
              await gasbridge.updateGroupWarnings(remoteJid, senderNumber, 0, updatedTime);
              datacache.updateGroupWarningLocal(remoteJid, senderNumber, 0, updatedTime);

              if (punishment === 'kick') {
                await socket.groupParticipantsUpdate(remoteJid, [senderJid], "remove");
                await socket.sendMessage(remoteJid, {
                  text: `🚨 *[PENINDAKAN SISTEM]*\n@${senderNumber} telah didepak karena melanggar batas filter kata kasar (${maxWarn}/${maxWarn} Warn).`,
                  mentions: [targetJid]
                });
              } else if (punishment === 'ban') {
                await socket.groupParticipantsUpdate(remoteJid, [senderJid], "remove");
                await gasbridge.addToBlacklist(senderNumber, `Melanggar batas warn filter kata di grup: ${remoteJid}`);
                datacache.addBlacklistedLocal(senderNumber);
                await socket.sendMessage(remoteJid, {
                  text: `🚨 *[PENINDAKAN SISTEM]*\n@${senderNumber} telah didepak dan diblacklist permanen karena melanggar batas filter kata kasar (${maxWarn}/${maxWarn} Warn).`,
                  mentions: [targetJid]
                });
              } else if (punishment === 'mute') {
                const muteExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                await gasbridge.addMute(senderNumber, muteExpiry, `Melanggar batas warn filter kata di grup: ${remoteJid}`, 'System', remoteJid);
                datacache.addMuteLocal(senderNumber, muteExpiry, `Melanggar batas warn filter kata di grup: ${remoteJid}`, 'System', remoteJid);
                scheduleUnmute(socket, remoteJid, senderNumber, 24 * 60 * 60 * 1000);
                
                await socket.sendMessage(remoteJid, {
                  text: `🤐 *[PENINDAKAN SISTEM]*\n@${senderNumber} telah di-mute selama 24 jam karena melanggar batas filter kata kasar (${maxWarn}/${maxWarn} Warn).`,
                  mentions: [targetJid]
                });
              }
            } else {
              let blocks = '';
              for (let i = 0; i < maxWarn; i++) {
                blocks += (i < newCount) ? '🟥' : '⬜';
              }
              await socket.sendMessage(remoteJid, {
                text: `⚠️ *[PERINGATAN SISTEM]*\n@${senderNumber}, kata-kata/pesan Anda terdeteksi melanggar aturan filter kata.\n\n*Status Pelanggaran:* ${blocks} (${newCount}/${maxWarn} Warn)\n*Pesan:* Terdeteksi mengandung kata dilarang [${matchedWord}].\n_Satu kali lagi melanggar, Anda akan dikenakan tindakan: ${punishment.toUpperCase()}_`,
                mentions: [targetJid]
              });
            }
            return;
          } catch (err) {
            console.error('[Moderator Filter] Error:', err);
          }
        }
      }
    }

    // Anti-link
    if (config.Anti_Link_Group === true || config.Anti_Link_Group === 'TRUE') {
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
      if (urlRegex.test(text) && !msg.key.fromMe) {
        try {
          // Harus jadi admin grup untuk menghapus pesan orang lain
          await socket.sendMessage(remoteJid, { delete: msg.key });
          await socket.sendMessage(remoteJid, { text: 'Link Terdeteksi' });
        } catch (err) {
          console.error('[WA] Gagal menghapus pesan (mungkin bot bukan admin?):', err.message);
          await socket.sendMessage(remoteJid, { text: 'Link Terdeteksi (Gagal menghapus pesan, pastikan bot adalah Admin grup)' });
        }
        return;
      }
    }

    if (!text) {
      console.log(`[WA] No text in message. Ignoring.`);
      return;
    }

    let botJid = '';
    let botLid = '';
    const myId = socket.user?.id || socket.authState?.creds?.me?.id;
    const myLid = socket.user?.lid || socket.authState?.creds?.me?.lid;
    if (myId) {
      botJid = myId.split(':')[0] + '@s.whatsapp.net';
    }
    if (myLid) {
      botLid = myLid.split(':')[0] + '@lid';
    }
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant || '';
    const stanzaId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId || '';
    const isReply = Boolean(stanzaId);
    
    const cleanQuoted = quotedParticipant ? quotedParticipant.split(':')[0].split('@')[0] : '';
    const cleanBot = botJid.split('@')[0];
    const cleanBotLid = botLid.split('@')[0];
    
    // DEBUGGING
    console.log(`[DEBUG GAME] cleanQuoted: "${cleanQuoted}", cleanBot: "${cleanBot}", cleanBotLid: "${cleanBotLid}", quotedParticipant: "${quotedParticipant}", isReply: ${isReply}`);
    
    let isQuotedBot = false;
    if (isReply) {
      if (cleanQuoted === cleanBot || (cleanBotLid && cleanQuoted === cleanBotLid)) {
        isQuotedBot = true;
      }
    }

    if (tebakKataGames.has(remoteJid) && isQuotedBot) {
      await processTebakKataGuess(socket, remoteJid, senderNumber, msg.pushName || senderNumber, text, msg);
      return;
    }

    // Cek Jawaban Game Sambung Kata
    if (sambungKataGames.has(remoteJid) && isQuotedBot) {
      const game = sambungKataGames.get(remoteJid);
      
      // Handle advanced mode confirmation reply
      if (game.status === 'pending_confirmation') {
        // handled below in command section
      } else if (game.status !== 'starting') {
        if (game.scores[senderNumber] === undefined) game.scores[senderNumber] = 0;

        const w = text.trim().toLowerCase();
        const diff = game.difficulty;
        
        // Determine what the word must start with based on mode
        let mustStartWith = game.currentLetter; // default: 1 huruf terakhir
        let startCheckLabel = `huruf *${game.currentLetter.toUpperCase()}*`;
        
        if (diff === 'ahli') {
          mustStartWith = game.currentChain; // 2 huruf terakhir
          startCheckLabel = `huruf *${game.currentChain.toUpperCase()}*`;
        } else if (diff === 'pakar') {
          mustStartWith = game.currentChain; // suku kata terakhir
          startCheckLabel = `suku kata *${game.currentChain.toUpperCase()}*`;
        } else if (diff === 'ekstrem') {
          mustStartWith = game.currentChain; // suku kata terakhir dibalik
          startCheckLabel = `awalan *${game.currentChain.toUpperCase()}*`;
        } else if (diff === 'mustahil') {
          mustStartWith = game.currentLetter; // huruf terakhir
          startCheckLabel = `huruf *${game.currentLetter.toUpperCase()}*`;
        }
        
        // Basic: word must start with the chain
        if (!w.includes(' ') && w.startsWith(mustStartWith)) {
          // Additional validations per mode
          if (diff === 'mustahil') {
            const vowels = 'aiueo';
            if (vowels.includes(w[0])) {
              await socket.sendMessage(remoteJid, { text: `❌ Huruf pertama kata tidak boleh VOKAL (A, I, U, E, O) di Mode Mustahil!` }, { quoted: msg });
              return;
            }
            const sylCount = countSyllables(w);
            if (sylCount !== 3) {
              await socket.sendMessage(remoteJid, { text: `❌ Kata harus memiliki tepat *3 suku kata*! Kata "${w.toUpperCase()}" memiliki ${sylCount} suku kata.` }, { quoted: msg });
              return;
            }
          }
          if (diff === 'ekstrem') {
            if (w.includes('a') || w.includes('e')) {
              await socket.sendMessage(remoteJid, { text: `❌ Kata tidak boleh mengandung huruf *A* atau *E* di Mode Ekstrem!` }, { quoted: msg });
              return;
            }
          }
          if (diff === 'pakar') {
            const sylCount = countSyllables(w);
            if (sylCount < 4) {
              await socket.sendMessage(remoteJid, { text: `❌ Kata harus memiliki *minimal 4 suku kata* di Mode Pakar! Kata "${w.toUpperCase()}" memiliki ${sylCount} suku kata.` }, { quoted: msg });
              return;
            }
          }
          
          if (game.usedWords.has(w)) {
            await socket.sendMessage(remoteJid, { text: `⚠️ Kata *${w.toUpperCase()}* telah digunakan, cari yang lain!` }, { quoted: msg });
            return;
          } else if (validIndonesianWords.has(w)) {
            game.usedWords.add(w);
            
            // Determine next chain based on mode
            let nextChain = '';
            let nextLabel = '';
            if (diff === 'ahli') {
              nextChain = w.slice(-2);
              game.currentChain = nextChain;
              game.currentLetter = nextChain;
              nextLabel = `Selanjutnya awalan *${nextChain.toUpperCase()}*...`;
            } else if (diff === 'pakar') {
              const syls = splitSyllables(w);
              nextChain = syls[syls.length - 1];
              game.currentChain = nextChain;
              game.currentLetter = nextChain;
              nextLabel = `Selanjutnya suku kata *${nextChain.toUpperCase()}*...`;
            } else if (diff === 'ekstrem') {
              const syls = splitSyllables(w);
              const lastSyl = syls[syls.length - 1];
              nextChain = lastSyl.split('').reverse().join('');
              game.currentChain = nextChain;
              game.currentLetter = nextChain;
              nextLabel = `Suku kata terakhir *${lastSyl.toUpperCase()}* dibalik jadi *${nextChain.toUpperCase()}*...`;
            } else if (diff === 'mustahil') {
              nextChain = w.charAt(w.length - 1);
              game.currentLetter = nextChain;
              nextLabel = `Selanjutnya huruf *${nextChain.toUpperCase()}* (vokal dilarang jadi huruf pertama)...`;
            } else {
              // mudah/sedang/susah
              const nextLetter = w.charAt(w.length - 1);
              game.currentLetter = nextLetter;
              nextLabel = `Selanjutnya huruf *${nextLetter.toUpperCase()}*...`;
            }
            
            if (!game.playerNames) game.playerNames = {};
            game.playerNames[senderNumber] = msg.pushName || senderNumber;
            game.scores[senderNumber] = (game.scores[senderNumber] || 0) + 1;
            
            startSambungKataTimeout(socket, remoteJid);
            
            const playerName = msg.pushName || senderNumber.split('@')[0];
            const remMs = game.roundEndTime - Date.now();
            const timeStr = remMs >= 60000 ? Math.floor(remMs/60000) + ' menit' : Math.max(0, Math.floor(remMs/1000)) + ' detik';
            const modeLabel = ADVANCED_MODES.includes(diff) ? ` | Mode ${diff.charAt(0).toUpperCase() + diff.slice(1)}` : '';
            const replyMsg = `━━━━━━━ ⟡ ━━━━━━━\n\nJawaban Benar: *${w.toUpperCase()}* (oleh ${playerName})\n${nextLabel}\n\n_Sisa waktu ronde: ${timeStr}._\n\n_Balas pesan ini untuk melanjutkan kata (harus ada di KBBI)!_`;
            await socket.sendMessage(remoteJid, { text: replyMsg }, { quoted: msg });
            return;
          } else {
            await socket.sendMessage(remoteJid, { text: `❌ Kata *${w.toUpperCase()}* tidak ditemukan di KBBI!` }, { quoted: msg });
            return;
          }
        } else {
          await socket.sendMessage(remoteJid, { text: `❌ Salah! Kata harus berawalan ${startCheckLabel}!` }, { quoted: msg });
          return;
        }
      }
    }

    // Cek Jawaban Game Tebak Boom
    if (tebakBoomGames.has(remoteJid) && isQuotedBot) {
      const game = tebakBoomGames.get(remoteJid);
      if (game.status === 'playing') {
        const currentPlayer = game.players[game.turnIndex];
        if (senderNumber !== currentPlayer.id) {
          await socket.sendMessage(remoteJid, { text: `❌ Bukan giliran mu!` }, { quoted: msg });
          return;
        }

        const guess = parseInt(text.trim());
        if (!isNaN(guess)) {
          await processTebakBoomGuess(socket, remoteJid, senderNumber, guess, msg, ownerId);
        } else {
          await socket.sendMessage(remoteJid, { text: `⚠️ Angka tebakan tidak valid!` }, { quoted: msg });
        }
        return;
      }
    }

    if (tebak_games.tebakGames.has(remoteJid)) {
      const handled = await tebak_games.handleTebakReply(socket, remoteJid, senderNumber, msg.pushName || senderNumber.split('@')[0], text, msg, economymanager);
      if (handled) return;
    }

    // YAY.app Command Engine & AI Interceptor
    if (text.startsWith('!') || text.startsWith('.')) {
      if (datacache.isBlacklisted(senderNumber)) {
        await socket.sendMessage(remoteJid, { text: "🐜 *[YAY Security]* Kamu termasuk ke daftar hitam! Fitur ini tidak bisa digunakan untuk semut pengganggu sepertimu." }, { quoted: msg });
        return;
      }

      if (tebakKataGames.has(remoteJid) || sambungKataGames.has(remoteJid) || tebakBoomGames.has(remoteJid) || tebak_games.tebakGames.has(remoteJid)) {
        const cmdCheck = text.toLowerCase();
        if (!cmdCheck.startsWith('!sambung') && !cmdCheck.startsWith('!tebak') && !cmdCheck.startsWith('.sambung') && !cmdCheck.startsWith('.tebak')) {
          await socket.sendMessage(remoteJid, { text: `Bot akan otomatis memblokir semua perintah saat game berlangsung. Selesaikan atau batalkan gamenya dulu!` }, { quoted: msg });
          return;
        }
      }
      
      const args = text.slice(1).trim().split(/ +/);
      let command = args.shift().toLowerCase();
      
      if (msg.pushName) {
        try {
          const economymanager = require('./economymanager');
          const prof = economymanager.getUserData(senderNumber);
          if (prof.name !== msg.pushName) {
            economymanager.updateUserData(senderNumber, { name: msg.pushName });
          }
        } catch (e) {}
      }
      
      // Auto-koreksi typo spasi (misal: !set cmd, !del cmd, !hide tag)
      if (args.length > 0) {
        const nextArg = args[0].toLowerCase();
        if (command === 'all' && nextArg === 'menu') {
          command = 'allmenu';
          args.shift();
        } else if (command === 'set' && nextArg === 'cmd') {
          command = 'setcmd';
          args.shift();
        } else if (command === 'del' && nextArg === 'cmd') {
          command = 'delcmd';
          args.shift();
        } else if (command === 'hide' && nextArg === 'tag') {
          command = 'hidetag';
          args.shift();
        } else if (command === 'yt' && nextArg === 'dl') {
          command = 'yt_dl';
          args.shift();
        } else if (command === 'tiktok' && nextArg === 'dl') {
          command = 'tiktok_dl';
          args.shift();
        } else if (command === 'insta' && nextArg === 'dl') {
          command = 'insta_dl';
          args.shift();
        } else if (command === 'gc' && nextArg === 'close') {
          command = 'gcclose';
          args.shift();
        } else if (command === 'gc' && nextArg === 'open') {
          command = 'gcopen';
          args.shift();
        } else if (command === 'x' && nextArg === 'dl') {
          command = 'x_dl';
          args.shift();
        }
      }
      
      // Wazle Play RPG System
      if (command === 'wazle' || command === 'event') {
        const prof = economymanager.getUserData(senderNumber);
        await wazleplay.handleWazleCommand(socket, msg, args, senderNumber, prof, economymanager);
        return;
      }
      
      // Moderation, Utility, & Yay Engine Commands
      const yayEngineCommands = ['say', 'vn', 'tagall', 'play', 'gacha', 'menfess', 'imagine', 'roast', 'ingatkan', 'duel', 'gempa', 'jadwalsholat', 'anime', 'pin', 'pinterest', 'meme', 'github', 'ssweb', 'ss', 'epicgames', 'epic', 'valorant', 'valo', 'addrespon', 'ticket', 'setbio', 'cloud'];
      if (yayEngineCommands.includes(command)) {
        const handled = await yay_engine.handleCommand(socket, remoteJid, msg, ownerId, command, args, isGroup);
        if (handled) return; // Stop processing auto-responder if handled by engine
      }
      
      // Catch typo !ai/!ask literally
      if (command.includes('ai/!ask') || command.includes('ai/ask') || command.includes('ask/!ai') || command.includes('ask/ai')) {
        await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nSepertinya Anda salah ketik. Silakan pilih salah satu saja, ketik *!ai* atau *!ask*. Jangan digabung.' }, { quoted: msg });
        return;
      }

      // AI command
      if (['ai', 'ask'].includes(command) || command.startsWith('ai,') || command.startsWith('ask,')) {
        // Bersihkan koma jika user ketik "!ai,"
        const cleanCommand = command.replace(',', '');
        const query = args.join(' ');
        if (query && ['ai', 'ask'].includes(cleanCommand)) {
          await yay_engine.handleAiQuery(socket, remoteJid, msg, ownerId, query, senderNumber, msg.pushName, false);
          return;
        }
      }

      // Profile Command
      if (['profile', 'profil', 'profiil', 'profiles'].includes(command)) {
        try {
          const loadMsg = await socket.sendMessage(remoteJid, { text: '⏳ _Mengambil data profil..._' }, { quoted: msg });
          
          const profRes = await gasbridge.getProfile(senderNumber);
          const gasProf = (profRes && profRes.status === 'success' && profRes.profile) ? profRes.profile : { wm: 0, wp: 0, permata: 0 };
          
          // Ensure they are numbers to prevent NaN
          gasProf.wm = Number(gasProf.wm || 0);
          gasProf.wp = Number(gasProf.wp || 0);
          gasProf.permata = Number(gasProf.permata || 0);
          
          const prof = economymanager.getUserData(senderNumber);
          
          // Sinkronisasi Data Lokal <-> Cloud
          let needsUpdate = false;
          
          // 1. Sync WM/WP/Permata (Local -> Cloud)
          if (prof.wm || prof.wp || prof.permata) {
            gasProf.wm += Number(prof.wm || 0);
            gasProf.wp += Number(prof.wp || 0);
            gasProf.permata += Number(prof.permata || 0);
            needsUpdate = true;
          }
          
          // 2. Restore Title & Badge dari Cloud ke Local (Jika server habis restart dan lokal kosong)
          if (!prof.active_title && gasProf.title) {
             prof.active_title = gasProf.title;
             economymanager.updateUserData(senderNumber, { active_title: gasProf.title });
          }
          if ((!prof.badges || prof.badges.length === 0) && gasProf.badge) {
             prof.badges = gasProf.badge.split(',').filter(b => b.trim() !== '');
             economymanager.updateUserData(senderNumber, { badges: prof.badges });
          }
          
          // 3. Backup Title & Badge dari Local ke Cloud (jika lokal ada, paksa timpa cloud biar up-to-date)
          let currentBadgesStr = prof.badges ? prof.badges.join(',') : "";
          let currentAchStr = prof.achievements ? prof.achievements.join(',') : "";
          if (prof.active_title !== gasProf.title || currentBadgesStr !== gasProf.badge || currentAchStr !== gasProf.achievement) {
             gasProf.title = prof.active_title || "";
             gasProf.badge = currentBadgesStr;
             gasProf.achievement = currentAchStr;
             needsUpdate = true;
          }
          
          if (needsUpdate) {
            const updateRes = await gasbridge.updateProfile(senderNumber, { 
                wm: gasProf.wm, 
                wp: gasProf.wp, 
                permata: gasProf.permata,
                title: gasProf.title,
                badge: gasProf.badge,
                achievement: gasProf.achievement
            });
            
            // Clear local pending economy rewards ONLY if sync successful
            if (updateRes && updateRes.status === 'success') {
              const currentProf = economymanager.getUserData(senderNumber);
              economymanager.updateUserData(senderNumber, {
                wm: Math.max(0, (currentProf.wm || 0) - Number(prof.wm || 0)),
                wp: Math.max(0, (currentProf.wp || 0) - Number(prof.wp || 0)),
                permata: Math.max(0, (currentProf.permata || 0) - Number(prof.permata || 0))
              });
            }
          }

          let titleDisplay = prof.active_title ? `『 ${prof.active_title} 』` : `-`;
          let badgeDisplay = prof.badges && prof.badges.length > 0 ? prof.badges.join('') : `-`;
          let petDisplay = prof.pet_type ? `${economymanager.PET_DB?.[prof.pet_type]?.emoji || '🐾'} ${prof.pet_type}` : `-`;
          
          // Count quests
          let qTotal = 3;
          let qDone = Object.values(prof.quests?.list || {}).filter(q => q.completed).length;

          let profileText = `══〔 👤 PROFILE 〕══\n\n`;
          const currentPushName = msg.pushName || senderNumber.split('@')[0];
          profileText += `Nama    : ${currentPushName}\n`;
          profileText += `WM      : ${gasProf.wm.toLocaleString('id-ID')}\n`;
          profileText += `WP      : ${gasProf.wp.toLocaleString('id-ID')}\n`;
          profileText += `Permata : ${gasProf.permata.toLocaleString('id-ID')}\n\n`;
          
          profileText += `Gelar   : ${titleDisplay}\n`;
          profileText += `Badge   : ${badgeDisplay}\n\n`;
          
          profileText += `Pet     : ${petDisplay}\n`;
          profileText += `Reputasi: ⭐ ${prof.reputation}\n`;
          profileText += `Level   : ${economymanager.getGroupData(remoteJid)?.mining_level || 1}\n\n`;
          
          profileText += `Quest   : ${qDone}/${qTotal}\n\n`;
          profileText += `🩸 WAZLE ECOSYSTEM`;

          if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
          await socket.sendMessage(remoteJid, { text: profileText }, { quoted: msg });
        } catch(e) {
          console.error('[PROFILE ERROR]', e);
          await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat memproses profil.' }, { quoted: msg });
        }
        return;
      }

      // Leaderboard Command
      if (['leaderboard', 'lb'].includes(command)) {
        try {
          const category = args.length > 0 ? args[0].toLowerCase() : 'hof';
          
          const rawEcoData = require('fs').readFileSync(require('path').join(__dirname, 'economy_data.json'), 'utf8');
          const allData = JSON.parse(rawEcoData);
          
          // Exclude groups from leaderboard
          const users = Object.keys(allData).filter(k => !k.endsWith('@g.us')).map(k => ({ phone: k, ...allData[k] }));

          let lbText = "";
          const medals = ['🥇', '🥈', '🥉', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];
          
          if (category === 'hof' || category === 'global') {
            lbText = `══〔 👑 HALL OF FAME 〕══\n\n`;
            users.sort((a, b) => (b.wazle_score || 0) - (a.wazle_score || 0));
            const top = users.slice(0, 10);
            for (let i = 0; i < top.length; i++) {
              lbText += `${medals[i]} *${top[i].name || top[i].phone.split('@')[0]}* — Score: ${top[i].wazle_score || 0}\n`;
            }
            lbText += `\n══════════════════\nPeringkat berdasarkan Wazle Score`;
          } else if (category === 'economy' || category === 'wm' || category === 'money') {
            lbText = `══〔 💰 ECONOMY (WM) 〕══\n\n`;
            users.sort((a, b) => (b.wm || 0) - (a.wm || 0));
            const top = users.slice(0, 10);
            for (let i = 0; i < top.length; i++) {
              lbText += `${medals[i]} *${top[i].name || top[i].phone.split('@')[0]}* — ${Number(top[i].wm || 0).toLocaleString('id-ID')} WM\n`;
            }
            lbText += `\n══════════════════`;
          } else if (category === 'mining') {
            lbText = `══〔 ⛏️ MINING 〕══\n\n`;
            // Sorting based on pickaxe tier/durability since user levels don't exist yet, wait we can use tracking
            users.sort((a, b) => ((b.tracking && b.tracking.tambang_played) || 0) - ((a.tracking && a.tracking.tambang_played) || 0));
            const top = users.slice(0, 10);
            for (let i = 0; i < top.length; i++) {
              const played = (top[i].tracking && top[i].tracking.tambang_played) || 0;
              lbText += `${medals[i]} *${top[i].name || top[i].phone.split('@')[0]}* — ${played} kali menambang\n`;
            }
            lbText += `\n══════════════════`;
          } else if (category === 'fishing') {
            lbText = `══〔 🎣 FISHING 〕══\n\n`;
            users.sort((a, b) => ((b.tracking && b.tracking.mancing_played) || 0) - ((a.tracking && a.tracking.mancing_played) || 0));
            const top = users.slice(0, 10);
            for (let i = 0; i < top.length; i++) {
              const played = (top[i].tracking && top[i].tracking.mancing_played) || 0;
              lbText += `${medals[i]} *${top[i].name || top[i].phone.split('@')[0]}* — ${played} tangkapan\n`;
            }
            lbText += `\n══════════════════`;
          } else if (category === 'knowledge') {
            lbText = `══〔 🧠 KNOWLEDGE 〕══\n\n`;
            users.sort((a, b) => ((b.tracking && b.tracking.knowledge_correct) || 0) - ((a.tracking && a.tracking.knowledge_correct) || 0));
            const top = users.slice(0, 10);
            for (let i = 0; i < top.length; i++) {
              const score = (top[i].tracking && top[i].tracking.knowledge_correct) || 0;
              lbText += `${medals[i]} *${top[i].name || top[i].phone.split('@')[0]}* — ${score} Jawaban\n`;
            }
          } else if (category === 'achievement' || category === 'achievements') {
            lbText = `══〔 🎖️ ACHIEVEMENTS 〕══\n\n`;
            users.sort((a, b) => ((b.achievements && b.achievements.length) || 0) - ((a.achievements && a.achievements.length) || 0));
            const top = users.slice(0, 10);
            for (let i = 0; i < top.length; i++) {
              const count = (top[i].achievements && top[i].achievements.length) || 0;
              lbText += `${medals[i]} *${top[i].name || top[i].phone.split('@')[0]}* — ${count}/120\n`;
            }
          } else {
            lbText = `══〔 🏆 WAZLE RANKINGS 〕══\n\n👑 Hall of Fame\n💰 Economy\n⛏️ Mining\n🎣 Fishing\n🧠 Knowledge\n🎖️ Achievement\n\n══════════════════\n\n⌕ !lb <kategori>\nContoh:\n!lb economy\n!lb mining\n\n🩸 WAZLE ECOSYSTEM • Explore • Learn • Play`;
          }
          
          const lbMentions = users.slice(0,10).map(u => u.phone);
          await socket.sendMessage(remoteJid, { text: lbText, mentions: lbMentions }, { quoted: msg });
        } catch (e) {
          console.error('[LEADERBOARD ERROR]', e);
          await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat memproses leaderboard.' }, { quoted: msg });
        }
        return;
      }

      // Quest Command
      if (['quest', 'quests', 'misi', 'daily', 'daliy'].includes(command)) {
        try {
          const questText = gamification.getDailyQuestsDisplay(senderNumber);
          await socket.sendMessage(remoteJid, { text: questText }, { quoted: msg });
        } catch (e) {
          console.error('[QUEST ERROR]', e);
          await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat memproses quest.' }, { quoted: msg });
        }
        return;
      }

      // Economy Commands Phase 1 & 2 & 3
      if (['mancing', 'slot', 'tambang', 'coinflip', 'beli', 'toko', 'rampok', 'bank', 'sabungayam', 'tas', 'inventory', 'sell', 'jual', 'pet', 'feed', 'kasihmakan', 'pake', 'pakai', 'equip', 'level', 'levelgrup', 'lvlgrup', 'levelgroup'].includes(command)) {
        const loadMsg = await socket.sendMessage(remoteJid, { text: '⏳ _Memproses transaksi..._' }, { quoted: msg });
        try {
          const userEco = economymanager.getUserData(senderNumber);
          if (userEco.jail_until > Date.now()) {
            const sisaMenit = Math.ceil((userEco.jail_until - Date.now()) / 60000);
            if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
            await socket.sendMessage(remoteJid, { text: `🚨 *KAMU SEDANG DI PENJARA!*\n\nKamu tidak bisa menggunakan fitur ekonomi/RPG selama *${sisaMenit} menit* lagi karena tertangkap polisi.` }, { quoted: msg });
            return;
          }

          const profileRes = await gasbridge.getProfile(senderNumber);
          if (!profileRes || profileRes.status !== 'success') {
            if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
            await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil profil untuk transaksi. Pastikan terdaftar.' }, { quoted: msg });
            return;
          }

          let prof = profileRes.profile;
          let result;

          if (command === 'mancing') {
            result = economymanager.playMancing(senderNumber, prof.wp, prof.wm, prof.permata, prof.tas);
          } else if ((command === 'level' && ['grup', 'group'].includes(args[0]?.toLowerCase())) || ['levelgrup', 'lvlgrup', 'levelgroup'].includes(command)) {
            if (!remoteJid.endsWith('@g.us')) {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nPerintah ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
              return;
            }
            const groupInfo = economymanager.getGroupMiningInfo(remoteJid);
            if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
            
            // Format Progress Bar
            const percent = Number((groupInfo.currentXp * 100n) / groupInfo.requiredXp);
            const filled = Math.round(percent / 10);
            const empty = 10 - filled;
            const bar = '█'.repeat(filled) + '░'.repeat(empty);

            let lvlText = `━━━━━━━『 🌋 LEVEL GRUP 🌋 』━━━━━━━\n\n`;
            lvlText += `🌍 *Area Tambang Saat Ini:*\n`;
            lvlText += `   └ [Level ${groupInfo.level}] ${groupInfo.name}\n\n`;
            lvlText += `⛏️ Level ${groupInfo.level}/120\n\n`;
            lvlText += `${bar} ${percent}%\n`;
            lvlText += `${groupInfo.currentXp.toString()} / ${groupInfo.requiredXp.toString()} XP\n\n`;
            lvlText += `⛏️ *Kapasitas Maks Tambang:* ${groupInfo.capacity} ayunan\n\n`;
            lvlText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 _Seluruh aktivitas menambang dari anggota grup akan menambah XP grup ini!_`;
            
            await socket.sendMessage(remoteJid, { text: lvlText }, { quoted: msg });
            return;
          } else if (command === 'tambang') {
            const isAuto = args[0]?.toLowerCase() === 'auto';
            const playerName = msg.pushName || senderNumber.split('@')[0];
            if (isAuto) {
              result = economymanager.playTambangAuto(senderNumber, prof.wp, prof.tas, remoteJid, playerName);
            } else {
              result = economymanager.playTambang(senderNumber, prof.wp, prof.tas, remoteJid, playerName);
            }
          } else if (command === 'slot') {
            const taruhan = parseInt(args[0]);
            if (isNaN(taruhan) || taruhan <= 0) {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nFormat salah! Contoh: !slot 500' }, { quoted: msg });
              return;
            }
            result = economymanager.playSlot(senderNumber, taruhan, prof.wp);
          } else if (command === 'coinflip') {
            const tebakan = args[0]?.toLowerCase();
            const taruhan = parseInt(args[1]);
            if (!tebakan || isNaN(taruhan) || taruhan <= 0) {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nFormat salah! Contoh: !coinflip head 500' }, { quoted: msg });
              return;
            }
            result = economymanager.playCoinflip(senderNumber, tebakan, taruhan, prof.wp);
          } else if (['beli', 'toko'].includes(command)) {
            const item = args.join(' ').toLowerCase();
            if (!item) {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              const tokoMenuText = `━━━━━━━『 🛒 TOKO UMUM 』━━━━━━━

Silakan pilih kategori toko yang tersedia:

1. ⛏️ *Toko Pickaxe* (Gears)
   └ Ketik: \`!toko pix\`

2. 🐾 *Toko Peliharaan* (Pets)
   └ Ketik: \`!toko pet\`

3. 🥩 *Toko Pakan Peliharaan*
   └ Ketik: \`!toko pakan\`

━━━━━━━━━━━━━━━━━━━━━━━
💡 _Gunakan perintah di atas untuk melihat katalog!_
━━━━━━━━━━━━━━━━━━━━━━━`;
              await socket.sendMessage(remoteJid, { text: tokoMenuText }, { quoted: msg });
              return;
            }
            if (item === 'pix' || item === 'pickaxe') {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              const pixMenuText = `━━━━━━━『 ⛏️ TOKO PICKAXE 』━━━━━━━

Pilih pickaxe yang ingin kamu beli:

1. 🪵 *Pickaxe Kayu*
   └ Harga     : 500 WP
   └ Durability: 10
   └ Luck      : +0%

2. 🪨 *Pickaxe Batu*
   └ Harga     : 1.500 WP
   └ Durability: 25
   └ Luck      : +5%

3. ⚙️ *Pickaxe Besi*
   └ Harga     : 5.000 WP
   └ Durability: 50
   └ Luck      : +10%

4. 👑 *Pickaxe Emas*
   └ Harga     : 15.000 WP
   └ Durability: 100
   └ Luck      : +20%

5. ☄️ *Pickaxe Meteorite*
   └ Harga     : 35.000 WP
   └ Durability: 250
   └ Luck      : +35%

━━━━━━━━━━━━━━━━━━━━━━━
💡 Contoh pembelian:
*!toko pix kayu*
━━━━━━━━━━━━━━━━━━━━━━━`;
              await socket.sendMessage(remoteJid, { text: pixMenuText }, { quoted: msg });
              return;
            }
            if (item === 'pet' || item === 'peliharaan') {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              let petMenu = `━━━━━━━『 🐾 TOKO PELIHARAAN 』━━━━━━━\n\nPeliharaan menambah Luck Mancing & Tambang:\n\n`;
              const pets = Object.entries(economymanager.PET_DB);
              pets.forEach(([name, info], idx) => {
                const formattedPrice = info.priceWM >= 1000000000 ? (info.priceWM/1000000000) + ' Milyar' : (info.priceWM >= 1000000 ? (info.priceWM/1000000) + ' Juta' : info.priceWM.toLocaleString('id-ID'));
                petMenu += `${idx + 1}. ${info.emoji} *${name}*\n`;
                petMenu += `   └ Harga WM  : ${formattedPrice} WM\n`;
                petMenu += `   └ Luck Bonus: +${Math.round(info.luck * 100)}%\n\n`;
              });
              petMenu += `━━━━━━━━━━━━━━━━━━━━━━━\n💡 Contoh pembelian:\n*!toko naga kecil*\n━━━━━━━━━━━━━━━━━━━━━━━`;
              await socket.sendMessage(remoteJid, { text: petMenu }, { quoted: msg });
              return;
            }
            result = economymanager.buyItem(senderNumber, item, prof.wp, prof.wm, prof.tas);
          } else if (command === 'pake' || command === 'pakai' || command === 'equip') {
            const item = args.join(' ').toLowerCase();
            if (item === 'pix' || item === 'pickaxe') {
              const tasObj = economymanager.parseTas(prof.tas);
              const userEco = economymanager.getUserData(senderNumber);
              
              if (userEco.pickaxe > 0) {
                if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
                await socket.sendMessage(remoteJid, { text: `━━━━━━━『 ⛏️ EQUIP PICKAXE 』━━━━━━━\n\nKamu masih memakai *${userEco.pickaxe_type}* (Durability: ${userEco.pickaxe}). Habiskan dulu sebelum memakai yang baru!` }, { quoted: msg });
                return;
              }
              
              // Cari pickaxe di tas
              let foundPix = null;
              for (const key of Object.keys(tasObj)) {
                if (economymanager.PICKAXE_DB[key] && tasObj[key] > 0) {
                  foundPix = key;
                  break;
                }
              }
              
              if (!foundPix) {
                if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
                await socket.sendMessage(remoteJid, { text: `━━━━━━━『 ⛏️ EQUIP PICKAXE 』━━━━━━━\n\nKamu tidak memiliki Pickaxe di dalam Tas! Beli di \`!toko pix\`.` }, { quoted: msg });
                return;
              }
              
              // Pakai Pickaxe
              tasObj[foundPix] -= 1;
              if (tasObj[foundPix] <= 0) delete tasObj[foundPix];
              
              const pixInfo = economymanager.PICKAXE_DB[foundPix];
              economymanager.updateUserData(senderNumber, { pickaxe: pixInfo.durability, pickaxe_type: foundPix });
              
              let newTasArr = [];
              for (const [k, v] of Object.entries(tasObj)) {
                newTasArr.push(`${k}:${v}`);
              }
              
              result = { success: true, newTasStr: newTasArr.join(','), message: `━━━━━━━ ⛏️ ⟡ EQUIP PICKAXE ⟡ ⛏️ ━━━━━━━\n\nBerhasil memakai *${foundPix}* dari Tas!\n   └ Ketahanan: ${pixInfo.durability} ayunan\n\nSekarang kamu siap untuk menambang! (\`!tambang\`)` };
            }
          } else if (command === 'pet') {
            if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
            const userEco = economymanager.getUserData(senderNumber);
            if (!userEco.pet_type) {
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nKamu belum punya peliharaan satupun! 😭\nBeli peliharaanmu pakai WM dengan mengetik: *!beli pet*' }, { quoted: msg });
              return;
            }
            const petInfo = economymanager.PET_DB[userEco.pet_type];
            if (petInfo) {
              const adoptDate = new Date(userEco.pet_adopted_at || Date.now());
              const dateStr = adoptDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
              
              const ageMs = Date.now() - (userEco.pet_adopted_at || Date.now());
              const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
              let ageStr = ageDays > 0 ? `${ageDays} Hari` : "Baru saja diadopsi";
              
              const baseSell = petInfo.priceWM * 0.20;
              const bonusPerKg = petInfo.priceWM * 0.05;
              const extraWeight = Math.max(0, userEco.pet_weight - 3);
              const totalSellValue = Math.floor(baseSell + (extraWeight * bonusPerKg));
              
              let petMsg = `━━━━━━━『 🐾 PET INFO 』━━━━━━━\n\n`;
              petMsg += `👤 *${userEco.pet_type}* ${petInfo.emoji}\n`;
              petMsg += `   └ Tanggal Adopsi: ${dateStr}\n`;
              petMsg += `   └ Umur          : ${ageStr}\n`;
              petMsg += `   └ Berat Badan   : ${userEco.pet_weight} Kg\n`;
              petMsg += `   └ Pakan Dimiliki: ${userEco.pakan_pet} Kantong\n`;
              petMsg += `   └ Luck Bonus    : +${Math.round(petInfo.luck * 100)}% (Mancing & Tambang)\n\n`;
              petMsg += `💰 *Nilai Jual Saat Ini*: ${totalSellValue.toLocaleString('id-ID')} WM\n\n`;
              petMsg += `━━━━━━━━━━━━━━━━━━━━━━━\n💡 _Ketik *!feed* untuk menaikkan berat badannya!\nKetik *!jual pet* jika ingin menjualnya!_\n━━━━━━━━━━━━━━━━━━━━━━━`;

              await socket.sendMessage(remoteJid, { text: petMsg }, { quoted: msg });
            }
            return;
          } else if (command === 'feed' || command === 'kasihmakan') {
            result = economymanager.feedPet(senderNumber);
          } else if (command === 'bank') {
            const action = args[0]?.toLowerCase() || 'cek';
            const amount = parseInt(args[1]);
            result = economymanager.bankAction(senderNumber, action, amount, prof.wp);
          } else if (command === 'rampok') {
            let targetUser = null;
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
              targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            if (!targetUser) {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nFormat salah! Contoh: !rampok @user' }, { quoted: msg });
              return;
            }
            const targetPhone = targetUser.split('@')[0];
            if (targetPhone === senderNumber) {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nKamu tidak bisa merampok dirimu sendiri!' }, { quoted: msg });
              return;
            }
            
            const targetRes = await gasbridge.getProfile(targetPhone);
            if (!targetRes || targetRes.status !== 'success') {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '❌ Target belum terdaftar atau profil tidak ditemukan.' }, { quoted: msg });
              return;
            }
            
            result = economymanager.playRampok(senderNumber, targetPhone, prof.wp, targetRes.profile.wp);
            if (result.wpChangeAttacker !== undefined) result.wpChange = result.wpChangeAttacker;
            if (result.wpChangeTarget !== 0) {
              await gasbridge.updateProfile(targetPhone, { wp: targetRes.profile.wp + result.wpChangeTarget, wm: targetRes.profile.wm, permata: targetRes.profile.permata });
            }
          } else if (command === 'sabungayam') {
            const amountArg = args.find(a => /^\d+$/.test(a));
            const amount = amountArg ? parseInt(amountArg) : NaN;
            let targetUser = null;
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
              targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            if (!targetUser || isNaN(amount) || amount <= 0) {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nFormat salah! Contoh: !sabungayam @user 500\nPastikan tag orangnya dan masukkan jumlah taruhan berupa angka.' }, { quoted: msg });
              return;
            }
            if (amount < 500) {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nMinimal taruhan sabung ayam adalah *500 WP*!' }, { quoted: msg });
              return;
            }
            
            const targetPhone = targetUser.split('@')[0];
            if (targetPhone === senderNumber) {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nKamu tidak bisa sabung ayam dengan dirimu sendiri!' }, { quoted: msg });
              return;
            }
            
            const targetRes = await gasbridge.getProfile(targetPhone);
            if (!targetRes || targetRes.status !== 'success') {
              if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
              await socket.sendMessage(remoteJid, { text: '❌ Target belum terdaftar atau profil tidak ditemukan.' }, { quoted: msg });
              return;
            }
            
            result = economymanager.playDuel(senderNumber, targetPhone, amount, prof.wp, targetRes.profile.wp);
            if (result.wpChangeAttacker !== undefined) result.wpChange = result.wpChangeAttacker;
            if (result.wpChangeTarget !== 0) {
              await gasbridge.updateProfile(targetPhone, { wp: targetRes.profile.wp + result.wpChangeTarget, wm: targetRes.profile.wm, permata: targetRes.profile.permata });
            }
            result.mentions = [formatJid(senderNumber), formatJid(targetPhone)];
          } else if (command === 'tas' || command === 'inventory') {
            const userEco = economymanager.getUserData(senderNumber);
            const items = Object.entries(userEco.inventory || {});
            
            const subCategory = args.length > 0 ? args[0].toLowerCase() : '';
            
            let tasText = "";
            let tambangItems = [];
            let mancingItems = [];
            let totalValue = 0;
            
            items.forEach(([item, qty]) => {
              if (economymanager.PICKAXE_DB[item]) return;
              const info = economymanager.getItemInfo(item);
              const price = info ? info.price : 10;
              const emoji = info ? info.emoji : "📦";
              totalValue += price * qty;
              
              const isTambang = /Batu|Mutiara|Berlian|Ruby|Safir|Zamrud|Obsidian|Tengkorak|Meteorit|Intan|Jantung|Permata|Giok|Tembaga|Timah|Besi|Emas|Perak|Perunggu/i.test(item);
              
              const itemStr = `${emoji} ${item}  ×${qty}\n   └ Harga: ${price * qty} WM`;
              if (isTambang) tambangItems.push(itemStr);
              else mancingItems.push(itemStr);
            });

            if (subCategory === 'mining') {
              tasText = `══〔 ⛏️ MINING LOOT 〕══\n\n`;
              tasText += tambangItems.length > 0 ? tambangItems.join('\n\n') : `_Kosong_`;
              tasText += `\n\n══════════════════\n⌕ .jual <item> <jumlah>`;
            } else if (subCategory === 'fishing') {
              tasText = `══〔 🎣 FISHING LOOT 〕══\n\n`;
              tasText += mancingItems.length > 0 ? mancingItems.join('\n\n') : `_Kosong_`;
              tasText += `\n\n══════════════════\n⌕ .jual <item> <jumlah>`;
            } else if (subCategory === 'tools' || subCategory === 'tool') {
              tasText = `══〔 🛠️ TOOLS 〕══\n\n`;
              let hasTools = false;
              if (userEco.pickaxe_type && userEco.pickaxe > 0) {
                tasText += `⛏️ *${userEco.pickaxe_type}*\n   └ Durability: ${userEco.pickaxe}\n   └ Status: Dipakai\n\n`;
                hasTools = true;
              }
              if (userEco.pet_type) {
                tasText += `🐾 *${userEco.pet_type}*\n   └ Berat: ${userEco.pet_weight}kg\n   └ Status: Dipelihara\n\n`;
                hasTools = true;
              }
              if (!hasTools) tasText += `_Kosong_`;
              tasText += `\n\n══════════════════`;
            } else if (subCategory === 'pakan' || subCategory === 'feed') {
              tasText = `══〔 🍗 PAKAN 〕══\n\n`;
              tasText += `🥩 Pakan Peliharaan ×${userEco.pakan_pet}\n\n══════════════════`;
            } else {
              // Main overview
              const totalMining = tambangItems.length;
              const totalFishing = mancingItems.length;
              let totalTools = 0;
              if (userEco.pickaxe_type && userEco.pickaxe > 0) totalTools++;
              if (userEco.pet_type) totalTools++;
              
              const capacityStr = userEco.tambang_capacity ? `Kapasitas : ${totalMining+totalFishing}/${userEco.tambang_capacity}` : `Kapasitas : ${totalMining+totalFishing}/100`;

              tasText = `══〔 🎒 WAZLE BAG 〕══\n\n`;
              const currentPushName = msg.pushName || senderNumber.split('@')[0];
              tasText += `👤 ${currentPushName}\n🎒 ${capacityStr}\n\n`;
              tasText += `══════════════════\n\n`;
              tasText += `🎣 Fishing Loot (${totalFishing})\n`;
              tasText += `⛏️ Mining Loot  (${totalMining})\n`;
              tasText += `🛠️ Tools        (${totalTools})\n`;
              tasText += `🍖 Feed         (${userEco.pakan_pet})\n\n`;
              tasText += `══════════════════\n\n`;
              tasText += `⌕ .tas fishing\n⌕ .tas mining\n⌕ .tas tools\n⌕ .tas pakan`;
            }
            
            if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
            await socket.sendMessage(remoteJid, { text: tasText }, { quoted: msg });
            return;
          } else if (command === 'sell' || command === 'jual') {
            const item = args.join(' ').toLowerCase();
            if (item === 'pet' || item === 'peliharaan') {
              result = economymanager.sellPet(senderNumber);
            } else {
              const qtyStr = args[1] || '1';
              if (!args[0]) {
                if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
                await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\nFormat salah! Contoh: !sell ikan 2 atau !jual pet` }, { quoted: msg });
                return;
              }
              result = economymanager.sellItem(args[0], qtyStr, prof.tas);
            }
          }

          if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
          
          if (result && result.message) {
            if (command === 'coinflip' && result.success) {
              const waitTime = Math.floor(Math.random() * 4000) + 1000; // 1 to 5 seconds
              const sentMsg = await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\n🪙 Koin sedang dilempar ke udara dan berputar cepat...` }, { quoted: msg });
              await new Promise(resolve => setTimeout(resolve, waitTime));
              await socket.sendMessage(remoteJid, { text: result.message, edit: sentMsg.key });
            } else if (command === 'tambang' && args[0]?.toLowerCase() === 'auto' && result.success) {
              const sentMsg = await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\nBzzzt! Mesin auto-tambang dinyalakan...` }, { quoted: msg });
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              if (result.autoSteps && result.autoSteps.length > 0) {
                let currentText = `━━━━━━━ ⟡ ━━━━━━━\n\nBzzzt! Mesin auto-tambang sedang beroperasi...\n\n*🎁 Sedang Mengumpulkan:*`;
                await socket.sendMessage(remoteJid, { text: currentText, edit: sentMsg.key });
                
                for (const step of result.autoSteps) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  currentText += `\n${step}`;
                  await socket.sendMessage(remoteJid, { text: currentText, edit: sentMsg.key });
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                await socket.sendMessage(remoteJid, { text: result.message, edit: sentMsg.key });
              } else {
                await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n\nBzzzt! Menggali tanah lebih dalam...\n(Mendeteksi banyak material masuk ke tas...) >>`, edit: sentMsg.key });
                await new Promise(resolve => setTimeout(resolve, 2000));
                await socket.sendMessage(remoteJid, { text: result.message, edit: sentMsg.key });
              }
            } else {
              await socket.sendMessage(remoteJid, { text: result.message, mentions: result.mentions || undefined }, { quoted: msg });
            }
          }

          if (result && result.success) {
            const userEcoLocal = economymanager.getUserData(senderNumber);
            
            // Ensure numbers to prevent NaN
            const profWp = Number(prof.wp || 0);
            const profWm = Number(prof.wm || 0);
            const profPermata = Number(prof.permata || 0);
            
            const localWp = Number(userEcoLocal.wp || 0);
            const localWm = Number(userEcoLocal.wm || 0);
            const localPermata = Number(userEcoLocal.permata || 0);
            
            const updates = { 
              wp: profWp + Number(result.wpChange || 0) + localWp, 
              wm: profWm + Number(result.wmChange || 0) + localWm, 
              permata: profPermata + Number(result.permataChange || 0) + localPermata
            };
            if (result.newTasStr !== undefined) {
              updates.tas = result.newTasStr;
            }
            
            const updateRes = await gasbridge.updateProfile(senderNumber, updates);
            
            // Bersihkan local rewards KARENA sudah dipindah ke master DB
            if (updateRes && updateRes.status === 'success' && (localWp || localWm || localPermata)) {
               userEcoLocal.wp = 0;
               userEcoLocal.wm = 0;
               userEcoLocal.permata = 0;
               economymanager.updateUserData(senderNumber, userEcoLocal);
            }

            // Gamification Tracking
            try {
              if (command === 'mancing') {
                gamification.trackActivity(socket, remoteJid, msg, senderNumber, 'mancing_played');
              } else if (command === 'tambang') {
                gamification.trackActivity(socket, remoteJid, msg, senderNumber, 'tambang_played');
              } else if (command === 'slot') {
                gamification.trackActivity(socket, remoteJid, msg, senderNumber, 'total_games_played');
                if (result.wpChange > 0) gamification.trackActivity(socket, remoteJid, msg, senderNumber, 'slot_wins');
              } else if (command === 'coinflip') {
                gamification.trackActivity(socket, remoteJid, msg, senderNumber, 'total_games_played');
                if (result.wpChange > 0) gamification.trackActivity(socket, remoteJid, msg, senderNumber, 'coinflip_wins');
              } else if (command === 'sabungayam') {
                if (result.wpChange > 0) gamification.trackActivity(socket, remoteJid, msg, senderNumber, 'sabungayam_wins');
              } else if (command === 'feed' || command === 'kasihmakan') {
                gamification.trackActivity(socket, remoteJid, msg, senderNumber, 'pet_fed_times');
              }
            } catch(e) {
              console.error('[GAMIFICATION TRACKING ERROR]', e);
            }

            // Level Up logic
            if (result.levelUp) {
              await socket.sendMessage(remoteJid, { text: result.levelUpMessage });
              
              // Bagi-bagi hadiah ke semua anggota grup
              if (result.rewardWp > 0) {
                try {
                  const groupMetadata = await socket.groupMetadata(remoteJid);
                  const members = groupMetadata.participants.map(p => p.id.split('@')[0]);
                  const wpPerPerson = Math.floor(result.rewardWp / members.length) || 1;
                  
                  // Fire and forget update
                  members.forEach(memberPhone => {
                    gasbridge.getProfile(memberPhone).then(res => {
                      if (res && res.status === 'success') {
                        gasbridge.updateProfile(memberPhone, { wp: res.profile.wp + wpPerPerson });
                      }
                    }).catch(() => {});
                  });
                  
                  await socket.sendMessage(remoteJid, { text: `🎉 _(Bonus ${result.rewardWp.toLocaleString('id-ID')} WP telah dibagi rata ke ${members.length} anggota grup! Masing-masing mendapat +${wpPerPerson} WP)_` });
                } catch (err) {
                  console.error('Error distributing level up reward:', err);
                }
              }
            }
          }
        } catch(e) {
          console.error('[ECONOMY ERROR]', e);
          if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
          await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan sistem economy.' }, { quoted: msg });
        }
        return;
      }

      // Menu Command
      if (['bot', 'menu', 'allmenu'].includes(command)) {
        const category = args.join(' ').toLowerCase().trim();

        if (command === 'allmenu') {
            const allMenuText = `══〔 🩸 WAZLE ALL MENU 〕══

🎪 WAZLE
• !wazle
• !wazle profesi
• !wazle petualangan
• !wazle attack boss

🎭 PLAY
• !sabungayam
• !duel @user
• !menfess {no} | {pesan}
• !sambung kata
• !kuis
• !tebak boom {angka}
• !tebak kata {mudah/sedang/susah}
• !tebak bendera
• !tebak negara
• !tebak landmark
• !tebak kucing
• !tebak anjing
• !tebak planet
• !tebak game
• !tebak logo

🌍 EXPEDITION
• !whatanime
• !anime {judul}
• !pin {query}
• !lirik {lagu}
• !meme

🧠 KNOWLEDGE
• !jadwalsholat {kota}
• !quran {surah} [ayat]
• !alkitab {kitab} {pasal} [ayat]
• !ai / !ask
• !wiki {query}
• !randomwiki
• !translate {kode} {teks}
• !news
• !fakta
• !mathfact
• !history
• !myth
• !jadwalbola

🌌 ASTRONOMY
• !iss
• !nasa / !apod
• !asteroid
• !moon

🌤️ WEATHER
• !cuaca {kota}
• !quake / !gempa
• !volcano

💰 FINANCE
• !mancing
• !tambang {auto}
• !level grup
• !tas
• !pake {item}
• !sell {item} {jumlah/all}
• !toko
• !feed
• !slot {jumlah}
• !coinflip {head/tail} {jumlah}
• !rampok @user
• !bank {cek/simpan/tarik} {jumlah}
• !sabungayam @user {jumlah}

🎮 GAMER
• !steam {game}
• !mc {ip}
• !epicgames
• !valorant {name#tag}

🌐 CONNECT
• !domain {url}
• !ip {address}
• !crypto {koin}
• !github {user}
• !ssweb {url}

🛡️ COMMAND
• !add
• !kick @user
• !promote @user
• !demote @user
• !hidetag
• !tagall
• !gacha
• !setname {teks}
• !setdesc {teks}
• !mute / !gcclose
• !unmute / !gcopen
• !link
• !revoke
• !setcmd
• !delcmd
• !addrespon {keyword} | {jawab}
• !cekpengumuman

🧰 UTILITY
• !say {teks} / !vn
• !tts {teks}
• !imagine {prompt}
• !roast @user
• !ingatkan {waktu} {pesan}
• !hd
• !afk {alasan}
• !ultah
• !set ultah
• !totalchat
• !sticker / !s
• !play / !yt dl
• !tiktok dl
• !insta dl
• !x dl
• !jid
• !profile
• !setbio {teks}
• !pet
• !cloud {nama_file}
• !ticket {pesan}
• !blacklist / !unblacklist
• !spammer
• !eval / !exec

🏆 LEADERBOARD
• !lb hof
• !lb economy
• !lb mining
• !lb fishing
• !lb knowledge
• !lb achievement

════════════════
⚡ Beta Release
🌐 dash.wazle.my.id

🎡 The Ultimate Festival & Carnival
> gunakan !wazle untuk masuk ke perayaan`;
            await socket.sendMessage(remoteJid, { text: allMenuText }, { quoted: msg });
            return;
        }

          if (!category) {
            const fallbackText = `✨ 🩸 WAZLE MENU 🩸 ✨
🎪 WAZLE
🎮 PLAY
🌍 EXPEDITION
🧠 KNOWLEDGE
🔭 ASTRONOMY
🌤️ WEATHER
💰 FINANCE
🕹️ GAMER
🌐 CONNECT
🛡️ COMMAND
🧰 UTILITY
🏆 LEADERBOARD

═════════════════
⚡ Beta Release | 🌐 dash.wazle.my.id
Ketik: !menu <kategori> | Contoh: !menu play

🎡 The Ultimate Festival & Carnival
> gunakan !wazle untuk masuk ke perayaan`;
            
            try {
              // Kirim dengan gambar wazle.png
              await socket.sendMessage(remoteJid, { image: fs.readFileSync('./.config/wazle.png'), caption: fallbackText }, { quoted: msg });
            } catch (e) {
              console.error("Gagal mengirim menu image:", e);
              await socket.sendMessage(remoteJid, { text: fallbackText }, { quoted: msg });
            }
            return;
          }

        let categoryText = '';
        switch(category) {
          case 'wazle':
            categoryText = `══〔 🎪 WAZLE FESTIVAL 〕══\n\n• !wazle\n• !wazle profesi\n• !wazle petualangan\n• !wazle attack boss`;
            break;
          case 'play':
            categoryText = `══〔 🎭 WAZLE PLAY 〕══\n\n• !sabungayam\n• !duel @user\n• !menfess {no} | {pesan}\n• !sambung kata\n• !tebak boom {angka}\n• !tebak kata {mudah/sedang/susah}\n• !tebak bendera\n• !tebak negara\n• !tebak landmark\n• !tebak kucing\n• !tebak anjing\n• !tebak planet\n• !tebak game\n• !tebak logo`;
            break;
          case 'expedition':
            categoryText = `══〔 🌍 WAZLE EXPEDITION 〕══\n\n• !anime {judul}\n• !pin {query}\n• !lirik {lagu}\n• !meme`;
            break;
          case 'knowledge':
          case 'intelligence':
            categoryText = `══〔 🧠 WAZLE KNOWLEDGE 〕══\n\n• !jadwalsholat {kota}\n• !quran {surah} [ayat]\n• !alkitab {kitab} {pasal} [ayat]\n• !ai / !ask\n• !wiki {query}\n• !randomwiki\n• !translate {kode} {teks}\n• !news\n• !fakta\n• !mathfact\n• !history\n• !myth\n• !jadwalbola`;
            break;
          case 'astronomy':
            categoryText = `══〔 🌌 WAZLE ASTRONOMY 〕══\n\n• !iss\n• !nasa / !apod\n• !asteroid\n• !moon`;
            break;
          case 'weather':
            categoryText = `══〔 🌤️ WAZLE WEATHER 〕══\n\n• !cuaca {kota}\n• !quake / !gempa\n• !volcano`;
            break;
          case 'finance':
          case 'economy':
          case 'mining':
            categoryText = `══〔 💰 WAZLE FINANCE 〕══\n\n• !mancing\n• !tambang {auto}\n• !level grup\n• !tas\n• !pake {item}\n• !sell {item} {jumlah/all}\n• !toko\n• !feed\n• !slot {jumlah}\n• !coinflip {head/tail} {jumlah}\n• !rampok @user\n• !bank {cek/simpan/tarik} {jumlah}\n• !sabungayam @user {jumlah}`;
            break;
          case 'gamer':
          case 'gaming':
            categoryText = `══〔 🎮 WAZLE GAMER 〕══\n\n• !steam {game}\n• !mc {ip}\n• !epicgames\n• !valorant {name#tag}`;
            break;
          case 'connect':
            categoryText = `══〔 🌐 WAZLE CONNECT 〕══\n\n• !domain {url}\n• !ip {address}\n• !crypto {koin}\n• !github {user}\n• !ssweb {url}`;
            break;
          case 'command':
          case 'moderation':
            categoryText = `══〔 🛡️ WAZLE COMMAND 〕══\n\n• !add\n• !kick @user\n• !promote @user\n• !demote @user\n• !hidetag\n• !tagall\n• !gacha\n• !setname {teks}\n• !setdesc {teks}\n• !mute / !gcclose\n• !unmute / !gcopen\n• !link\n• !revoke\n• !setcmd\n• !delcmd\n• !addrespon {keyword} | {jawab}\n• !cekpengumuman`;
            break;
          case 'utility':
          case 'system':
            categoryText = `══〔 🧰 WAZLE UTILITY 〕══\n\n• !say {teks} / !vn\n• !tts {teks}\n• !imagine {prompt}\n• !roast @user\n• !ingatkan {waktu} {pesan}\n• !hd\n• !afk {alasan}\n• !ultah\n• !set ultah\n• !totalchat\n• !sticker / !s\n• !play / !yt dl\n• !tiktok dl\n• !insta dl\n• !x dl\n• !jid\n• !profile\n• !setbio {teks}\n• !pet\n• !cloud {nama_file}\n• !ticket {pesan}\n• !blacklist / !unblacklist\n• !spammer\n• !eval / !exec`;
            break;
          case 'leaderboard':
          case 'lb':
            categoryText = `══〔 🏆 WAZLE LEADERBOARD 〕══\n\n• !lb hof\n• !lb economy\n• !lb mining\n• !lb fishing\n• !lb knowledge\n• !lb achievement`;
            break;
          default:
            categoryText = `❌ Kategori tidak ditemukan. Ketik *.menu* untuk melihat daftar kategori.`;
        }


        const path = require('path');
        let imagePath = null;
        
        if (category === 'play') {
           const potentialPath = path.join(__dirname, '.config', 'play.png');
           if (fs.existsSync(potentialPath)) {
             imagePath = potentialPath;
           }
        }
        
        if (imagePath) {
          await socket.sendMessage(remoteJid, { image: { url: imagePath }, caption: categoryText }, { quoted: msg });
        } else {
          await socket.sendMessage(remoteJid, { text: categoryText }, { quoted: msg });
        }
        
        return;
      }

      // AFK Command
      if (command === 'afk') {
        const reason = args.join(' ') || 'Tanpa alasan';
        afkMap.set(senderNumber, {
          reason: reason,
          time: Date.now()
        });
        await socket.sendMessage(remoteJid, { text: `💤 *AFK AKTIF*\n\nKamu sekarang AFK dengan alasan: ${reason}` }, { quoted: msg });
        return;
      }

      // Anti View Once
      if (command === 'hd' || command === 'viewonce') {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
          await socket.sendMessage(remoteJid, { text: 'Reply pesan View Once (Sekali Lihat) dengan perintah *!hd*' }, { quoted: msg });
          return;
        }

        let isViewOnce = quotedMsg.viewOnceMessage || quotedMsg.viewOnceMessageV2 || quotedMsg.viewOnceMessageV2Extension;
        
        // Fallback for some clients that send raw imageMessage with viewOnce flag
        if (!isViewOnce && (quotedMsg.imageMessage?.viewOnce || quotedMsg.videoMessage?.viewOnce)) {
            isViewOnce = quotedMsg;
        }

        if (!isViewOnce) {
          await socket.sendMessage(remoteJid, { text: 'Itu bukan pesan View Once! (Atau bot gagal mendeteksi tipe pesannya)' }, { quoted: msg });
          return;
        }

        let viewOnceContent = null;
        if (isViewOnce.message?.imageMessage) viewOnceContent = isViewOnce.message.imageMessage;
        else if (isViewOnce.message?.videoMessage) viewOnceContent = isViewOnce.message.videoMessage;
        else if (isViewOnce.imageMessage) viewOnceContent = isViewOnce.imageMessage;
        else if (isViewOnce.videoMessage) viewOnceContent = isViewOnce.videoMessage;

        if (!viewOnceContent) {
           await socket.sendMessage(remoteJid, { text: `Tipe View Once ini tidak didukung. (Info debug: ${Object.keys(isViewOnce).join(', ')})` }, { quoted: msg });
           return;
        }

        try {
          const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
          const stream = await downloadContentFromMessage(viewOnceContent, viewOnceContent.mimetype.split('/')[0]);
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          if (viewOnceContent.mimetype.startsWith('image/')) {
            await socket.sendMessage(remoteJid, { image: buffer, caption: '✅ Berhasil membuka pesan View Once' }, { quoted: msg });
          } else if (viewOnceContent.mimetype.startsWith('video/')) {
            await socket.sendMessage(remoteJid, { video: buffer, caption: '✅ Berhasil membuka pesan View Once' }, { quoted: msg });
          }
        } catch (e) {
          console.error('[HD ERROR]', e);
          await socket.sendMessage(remoteJid, { text: '❌ Gagal membuka pesan View Once.' }, { quoted: msg });
        }
        return;
      }

      // Total Chat & Leaderboard
      if (command === 'totalchat') {
        const loadMsg = await socket.sendMessage(remoteJid, { text: '⏳ _Menghitung total pesanmu..._' }, { quoted: msg });
        try {
          const lbRes = await gasbridge.getChatLeaderboard();
          if (!lbRes || lbRes.status !== 'success') {
            if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
            await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data chat.' }, { quoted: msg });
            return;
          }

          const lb = lbRes.leaderboard || [];
          let myRank = -1;
          let myTotal = 0;
          let topList = '';
          
          for (let i = 0; i < lb.length; i++) {
            if (lb[i].phone === senderNumber) {
              myRank = i + 1;
              myTotal = lb[i].totalchat;
            }
            if (i < 5) {
              const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
              topList += `${medals[i] || '🎖️'} *${lb[i].julukan}* - ${lb[i].totalchat} pesan\n`;
            }
          }

          let text = `━━━━━━━『 💬 TOTAL CHAT 』━━━━━━━\n\n`;
          text += `Kamu telah mengirimkan total *${myTotal}* pesan.\n`;
          text += `Peringkat Globalmu: *#${myRank > 0 ? myRank : 'Belum terdaftar'}*\n\n`;
          text += `🏆 *TOP 5 CHATTERS:*\n${topList}`;
          
          if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
          await socket.sendMessage(remoteJid, { text: text }, { quoted: msg });
        } catch(e) {
          if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
          await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat memproses data total chat.' }, { quoted: msg });
        }
        return;
      }

      // Ulang Tahun
      if (command === 'set' && args[0]?.toLowerCase() === 'ultah') {
        const tgl = args.slice(1).join(' ');
        if (!tgl) {
          await socket.sendMessage(remoteJid, { text: 'Format salah! Contoh: *!set ultah 17 Agustus*' }, { quoted: msg });
          return;
        }
        const loadMsg = await socket.sendMessage(remoteJid, { text: '⏳ _Menyimpan tanggal ulang tahunmu..._' }, { quoted: msg });
        try {
          await gasbridge.updateProfile(senderNumber, { ultah: tgl });
          if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
          await socket.sendMessage(remoteJid, { text: `✅ Tanggal ulang tahunmu berhasil disimpan: *${tgl}*` }, { quoted: msg });
        } catch(e) {
          if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
          await socket.sendMessage(remoteJid, { text: '❌ Gagal menyimpan ulang tahun.' }, { quoted: msg });
        }
        return;
      }

      if (command === 'ultah') {
        const loadMsg = await socket.sendMessage(remoteJid, { text: '⏳ _Mengecek data ulang tahun..._' }, { quoted: msg });
        try {
          const profRes = await gasbridge.getProfile(senderNumber);
          if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
          if (profRes && profRes.profile && profRes.profile.ultah) {
            await socket.sendMessage(remoteJid, { text: `🎂 Tanggal ulang tahunmu adalah: *${profRes.profile.ultah}*` }, { quoted: msg });
          } else {
            await socket.sendMessage(remoteJid, { text: 'Kamu belum mengatur tanggal ulang tahun!\nKetik: *!set ultah [tanggal]*' }, { quoted: msg });
          }
        } catch(e) {
          if (loadMsg) await socket.sendMessage(remoteJid, { delete: loadMsg.key });
          await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data ulang tahun.' }, { quoted: msg });
        }
        return;
      }

      // 🌍 WAZLE EXPEDITION & API ROUTER
      const apiCommands = ['tebak', 'meme', 'wiki', 'fakta', 'fact', 'mathfact', 'iss', 'nasa', 'apod', 'cuaca', 'weather', 'steam', 'crypto', 'mc', 'ip', 'domain', 'asteroid', 'moon', 'quake', 'volcano', 'mars', 'spacex', 'solar', 'aqi', 'sunrise', 'freegames', 'genshin', 'mcping', 'osu', 'qr', 'shorten', 'repo', 'dog', 'cat', 'kbbi', 'quote', 'joke', 'pokemon', 'translate', 'tts', 'news', 'jadwalbola', 'lirik', 'lyrics', 'alkitab', 'quran', 'alquran'];
      if (apiCommands.includes(command)) {
         let handled = await wazle_api.handleApiCommand(socket, remoteJid, msg, command, args);
         if (!handled) {
            handled = await wazle_api_v2.handleApiCommandV2(socket, remoteJid, msg, command, args);
         }
         if (handled) {
            try {
               let trackerKey = null;
               if (command === 'tebak') trackerKey = 'expedition_played';
               else if (['wiki', 'fakta', 'fact', 'mathfact'].includes(command)) trackerKey = 'knowledge_used';
               else if (command === 'iss') trackerKey = 'iss_checked';
               else if (['nasa', 'apod', 'asteroid', 'moon'].includes(command)) trackerKey = 'astronomy_used';
               else if (['cuaca', 'weather'].includes(command)) trackerKey = 'weather_checked';
               else if (['quake', 'gempa'].includes(command)) trackerKey = 'quake_checked';
               else if (command === 'steam') trackerKey = 'steam_checked';
               else if (command === 'crypto') trackerKey = 'crypto_checked';
               else if (command === 'mc') trackerKey = 'mc_checked';
               else if (command === 'ip') trackerKey = 'ip_checked';
               else if (command === 'domain') trackerKey = 'domain_checked';
               
               if (trackerKey) gamification.trackActivity(socket, remoteJid, msg, senderNumber, trackerKey);
            } catch(e) {}
            return;
         }
      }

      // Tebak Kata & Game Tebak Lainnya
      let parsedTebakCategory = null;
      if (command.startsWith('tebak') && command !== 'tebak') {
        parsedTebakCategory = command.replace('tebak', '').replace('-', '');
        args.unshift(parsedTebakCategory);
        command = 'tebak';
      }
      
      const tebakCommands = ['tebakkata', 'tebak-kata', 'tebak'];
      if (tebakCommands.includes(command)) {
        if (command === 'tebak' && args[0]?.toLowerCase() === 'boom') {
          // Lanjut ke tebak boom handler di bawah
        } else if (command === 'tebak' && args[0]?.toLowerCase() !== 'kata') {
          let isZeinaJoin = false;
          let zeinaIndex = args.findIndex(a => a.toLowerCase() === 'zeina');
          if (zeinaIndex !== -1) {
            isZeinaJoin = true;
            args.splice(zeinaIndex, 1);
          }

          const category = args[0]?.toLowerCase();
          if (category) {
            const configKey = `Game_Tebak_${category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}_Status`;
            if (config[configKey] === false || config[configKey] === 'FALSE') {
              await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n❌ Game Tebak ${category.toUpperCase()} dinonaktifkan oleh owner bot di Pusat Kontrol.` }, { quoted: msg });
              return;
            }
          }

          const subcommand = args[1]?.toLowerCase() || '';
          await tebak_games.handleTebakCommand(socket, remoteJid, senderNumber, msg.pushName || senderNumber, msg, category, subcommand, () => {
             startCountdownLobby(socket, remoteJid, `Tebak ${category.toUpperCase()}`, () => {
                if (!tebak_games.tebakGames.has(remoteJid)) return;
                tebak_games.startTebakGame(socket, remoteJid, msg, isZeinaJoin);
             });
          });
          return;
        } else {
          let isZeinaJoin = false;
          let zeinaIndex = args.findIndex(a => a.toLowerCase() === 'zeina');
          if (zeinaIndex !== -1) {
            isZeinaJoin = true;
            args.splice(zeinaIndex, 1);
          }

          const difficulty = command === 'tebak' ? args[1]?.toLowerCase() : args[0]?.toLowerCase();
          
          if (!['mudah', 'sedang', 'susah'].includes(difficulty)) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nGunakan perintah dengan tingkat kesulitan:\n• *!tebak kata mudah* (4-8 huruf, 60s)\n• *!tebak kata sedang* (8-14 huruf, 30s)\n• *!tebak kata susah* (Kata majemuk, 20s)' }, { quoted: msg });
            return;
          }

          if (config.Game_Tebak_Kata_Status === false || config.Game_Tebak_Kata_Status === 'FALSE') {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n❌ Fitur game Tebak Kata dinonaktifkan oleh owner bot di Pusat Kontrol.' }, { quoted: msg });
            return;
          }

          if (tebakKataGames.has(remoteJid)) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nSelesaikan game yang sedang berjalan terlebih dahulu!' }, { quoted: msg });
            return;
          }

          let dict = tebakKataMudah;
          let timeLimit = 60000;
          
          if (difficulty === 'sedang') {
            dict = tebakKataSedang;
            timeLimit = 30000;
          } else if (difficulty === 'susah') {
            dict = tebakKataSusah;
            timeLimit = 20000;
          }

          tebakKataGames.set(remoteJid, { status: 'starting' });

          startCountdownLobby(socket, remoteJid, 'Tebak Kata', () => {
            if (!tebakKataGames.has(remoteJid)) return;
            console.log(`[GAME] Permainan baru dimulai | ${ownerId}`);
            
            tebakKataGames.set(remoteJid, {
              status: 'playing',
              difficulty,
              dict,
              timeLimit,
              scores: {},
              currentIndex: 0,
              timeoutId: null,
              word: '',
              isZeinaJoin // Save zeina state
            });

            // Mulai ronde pertama
            nextTebakKataRound(socket, remoteJid);
          });
          return;
        }
      }
      
      // Tebak Boom
      const boomCommands = ['tebakboom', 'tebak-boom'];
      if (boomCommands.includes(command) || (command === 'tebak' && args[0]?.toLowerCase() === 'boom')) {
        if (config.Game_Tebak_Boom_Status === false || config.Game_Tebak_Boom_Status === 'FALSE') {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n❌ Fitur game Tebak Boom dinonaktifkan oleh owner bot di Pusat Kontrol.' }, { quoted: msg });
          return;
        }

        let isZeinaJoin = false;
        let zeinaIndex = args.findIndex(a => a.toLowerCase() === 'zeina');
        if (zeinaIndex !== -1) {
          isZeinaJoin = true;
          args.splice(zeinaIndex, 1);
        }

        let subcommand = '';
        if (command === 'tebak') {
          subcommand = args[1] ? args[1].toLowerCase() : '';
        } else {
          subcommand = args[0] ? args[0].toLowerCase() : '';
        }

        // Default rentang 100 jika memanggil zeina tapi tidak ada angka
        if (!subcommand && isZeinaJoin) {
          subcommand = '100';
        }

        if (!subcommand) {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nBuat room: *!tebak boom {angka}* (min. 100)\nGabung: *!tebak boom join*' }, { quoted: msg });
          return;
        }

        if (subcommand === 'join') {
          if (!tebakBoomGames.has(remoteJid)) {
            await socket.sendMessage(remoteJid, { text: '❌ Belum ada room Tebak Boom yang aktif. Ketik !tebak boom {angka} untuk membuat room.' }, { quoted: msg });
            return;
          }
          const game = tebakBoomGames.get(remoteJid);
          if (game.status !== 'waiting') {
            await socket.sendMessage(remoteJid, { text: '❌ Game sudah dimulai, kamu tidak bisa join lagi!' }, { quoted: msg });
            return;
          }
          if (game.players.find(p => p.id === senderNumber)) {
            await socket.sendMessage(remoteJid, { text: '⚠️ Kamu sudah ada di dalam room!' }, { quoted: msg });
            return;
          }
          
          game.players.push({ id: senderNumber, name: msg.pushName || senderNumber });
          let pList = game.players.map((p, i) => `${i+1}. *${p.name}*`).join('\n');
          let mentions = game.players.map(p => formatJid(p.id));
          
          let tText = `━━━━━━━ ⟡ ━━━━━━━\n\n🎯 Target Boom: 1 - *${game.max}*\n\n*Pemain:*\n${pList}\n\n_Ketik *!tebak boom join* untuk ikut!_`;
          const sentMsg = await socket.sendMessage(remoteJid, { text: tText, mentions }, { quoted: msg });
          try {
            const metadata = await socket.groupMetadata(remoteJid);
            const botJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = metadata.participants.find(p => p.id === botJid);
            if (botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin')) {
              if (game.pinnedMsgKey) {
                await socket.sendMessage(remoteJid, { keepInChat: { keepType: 2, key: game.pinnedMsgKey } }).catch(()=>{});
              }
              game.pinnedMsgKey = sentMsg.key;
              await socket.sendMessage(remoteJid, { keepInChat: { keepType: 1, key: sentMsg.key, time: 86400 } }).catch(()=>{});
            }
          } catch(e) {}
          
          if (game.players.length >= 2 && !game.countdownStarted) {
             game.countdownStarted = true;
             startTebakBoomCountdown(socket, remoteJid);
          }
          return;
        }

        if (subcommand === '{angka}') {
          await socket.sendMessage(remoteJid, { text: '😂 Woi, `{angka}` nya diganti pakai angka beneran dong!\nContoh: *!tebak boom 100*' }, { quoted: msg });
          return;
        }

        let maxNum = parseInt(subcommand);
        if (!isNaN(maxNum)) {
          if (maxNum < 100) {
            await socket.sendMessage(remoteJid, { text: '❌ Minimal rentang angka adalah 100!' }, { quoted: msg });
            return;
          }
          if (tebakBoomGames.has(remoteJid) || tebakKataGames.has(remoteJid) || sambungKataGames.has(remoteJid)) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nSelesaikan game yang sedang berjalan terlebih dahulu!' }, { quoted: msg });
            return;
          }

          let initialPlayers = [{ id: senderNumber, name: msg.pushName || senderNumber }];
          if (isZeinaJoin) {
            initialPlayers.push({ id: 'zeina@s.whatsapp.net', name: 'Zeina (AI)' });
          }

          tebakBoomGames.set(remoteJid, {
             status: 'waiting',
             max: maxNum,
             players: initialPlayers,
             countdownStarted: false,
             timeoutId: null,
             pinnedMsgKey: null
          });
          
          let pList = initialPlayers.map((p, i) => `${i+1}. *${p.name}*`).join('\n');
          let tText = `━━━━━━━ ⟡ ━━━━━━━\n\n🎯 Target Boom: 1 - *${maxNum}*\n\n*Pemain:*\n${pList}\n\n_Ketik *!tebak boom join* untuk ikut!_`;
          const sentMsg = await socket.sendMessage(remoteJid, { text: tText, mentions: [formatJid(senderNumber)] });

          // Langsung jalankan countdown jika Zeina ikut (karena player >= 2)
          if (isZeinaJoin) {
            tebakBoomGames.get(remoteJid).countdownStarted = true;
            startTebakBoomCountdown(socket, remoteJid);
          }

          try {
            const metadata = await socket.groupMetadata(remoteJid);
            const botJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = metadata.participants.find(p => p.id === botJid);
            if (botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin')) {
              tebakBoomGames.get(remoteJid).pinnedMsgKey = sentMsg.key;
              await socket.sendMessage(remoteJid, { keepInChat: { keepType: 1, key: sentMsg.key, time: 86400 } }).catch(()=>{});
            }
          } catch(e) {}
          return;
        }
        
        await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nMasukkan angka rentang atau "join"!' }, { quoted: msg });
        return;
      }


      // Sambung Kata
      const sambungCommands = ['sambungkata', 'sambung-kata', 'sambung'];
      if (sambungCommands.includes(command)) {
        if (command === 'sambung' && args[0]?.toLowerCase() !== 'kata') return;

        const difficulty = command === 'sambung' ? args[1]?.toLowerCase() : args[0]?.toLowerCase();
        
        // Handle batal
        if (difficulty === 'batal') {
          if (sambungKataGames.has(remoteJid)) {
            const game = sambungKataGames.get(remoteJid);
            if (game.status === 'pending_confirmation') {
              sambungKataGames.delete(remoteJid);
              await socket.sendMessage(remoteJid, { text: '✅ Room Sambung Kata telah dibatalkan.' }, { quoted: msg });
              return;
            }
          }
          await socket.sendMessage(remoteJid, { text: '❌ Tidak ada room yang menunggu konfirmasi.' }, { quoted: msg });
          return;
        }
        
        if (!ALL_SAMBUNG_MODES.includes(difficulty)) {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n\nGunakan perintah dengan tingkat kesulitan:\n\n• *!sambung kata mudah*\n• *!sambung kata sedang*\n• *!sambung kata susah*\n• *!sambung kata ahli*\n• *!sambung kata pakar*\n• *!sambung kata ekstrem*\n• *!sambung kata mustahil*' }, { quoted: msg });
          return;
        }

        if (sambungKataGames.has(remoteJid)) {
          const existingGame = sambungKataGames.get(remoteJid);
          // Allow confirmation reply for pending games
          if (existingGame.status === 'pending_confirmation' && ADVANCED_MODES.includes(difficulty) && difficulty === existingGame.difficulty) {
            // This is the confirmation! Proceed to countdown
            existingGame.status = 'starting';
            
            const modeInfo = advancedModeRules[difficulty];
            const randomWord = validIndonesianWordsArray[Math.floor(Math.random() * validIndonesianWordsArray.length)];
            const usedWords = new Set();
            usedWords.add(randomWord);
            
            // Start advanced countdown lobby
            await startAdvancedCountdownLobby(socket, remoteJid, modeInfo, () => {
              if (!sambungKataGames.has(remoteJid)) return;
              console.log(`[GAME] Permainan Sambung Kata ${difficulty} dimulai | ${ownerId}`);
              
              const roundDuration = 8 * 60 * 1000;
              const roundEndTime = Date.now() + roundDuration;
              const timeLimit = 30000; // 30 detik untuk semua mode lanjutan
              
              // Determine initial chain based on mode
              let currentChain = '';
              let chainLabel = '';
              if (difficulty === 'ahli') {
                currentChain = randomWord.slice(-2);
                chainLabel = `Selanjutnya awalan *${currentChain.toUpperCase()}*...`;
              } else if (difficulty === 'pakar') {
                const syls = splitSyllables(randomWord);
                currentChain = syls[syls.length - 1];
                chainLabel = `Selanjutnya suku kata *${currentChain.toUpperCase()}*...`;
              } else if (difficulty === 'ekstrem') {
                const syls = splitSyllables(randomWord);
                const lastSyl = syls[syls.length - 1];
                currentChain = lastSyl.split('').reverse().join('');
                chainLabel = `Suku kata terakhir *${lastSyl.toUpperCase()}* dibalik jadi *${currentChain.toUpperCase()}*...`;
              } else if (difficulty === 'mustahil') {
                currentChain = randomWord.charAt(randomWord.length - 1);
                chainLabel = `Selanjutnya huruf *${currentChain.toUpperCase()}* (vokal dilarang jadi huruf pertama)...`;
              }

              const globalTimeoutId = setTimeout(async () => {
                if (sambungKataGames.has(remoteJid)) {
                  const game = sambungKataGames.get(remoteJid);
                  clearTimeout(game.timeoutId);
                  
                  let resultText = `━━━━━━━ ⟡ ━━━━━━━\n\nGame selesai (Waktu Habis)!\n\n`;
                  let mentions = [];
                  const sortedScores = Object.entries(game.scores).sort((a,b) => b[1] - a[1]);
                  if (sortedScores.length === 0) {
                    resultText += `Tidak ada yang berhasil melanjutkan kata satu pun. 😅\n`;
                  } else {
                    let rank = 1;
                    for (const [user, score] of sortedScores) {
                      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
                      resultText += `${medal} @${user.split('@')[0]} berhasil menyambung ${score} kata\n`;
                      mentions.push(formatJid(user));
                      rank++;
                    }
                    try {
                      const winnerJid = sortedScores[0][0];
                      const winnerScore = sortedScores[0][1];
                      const winnerPhone = winnerJid.split('@')[0];
                      const pRes = await gasbridge.getProfile(winnerPhone);
                      if (pRes && pRes.status === 'success') {
                        if (winnerScore > 0) {
                          let rewardWP = 10;
                          let rewardWM = 500;
                          let bonusText = '';
                          if (winnerScore > 2) {
                            const extra = winnerScore - 2;
                            rewardWP += extra * 5;
                            rewardWM += extra * 200;
                            bonusText = ` (+Bonus Menjawab > 2 berlipat!)`;
                          }
                          await gasbridge.updateProfile(winnerPhone, { wp: pRes.profile.wp + rewardWP, wm: pRes.profile.wm + rewardWM });
                          resultText += `\n🎁 @${winnerPhone} mendapat hadiah Juara 1: +${rewardWP} WP & +${rewardWM} WM${bonusText}!`;
                        } else {
                          resultText += `\n💔 Sayang sekali, Juara 1 (0 kata) tidak mendapatkan hadiah apa-apa!`;
                        }
                      }
                    } catch(e) {
                      console.error('[REWARD ERROR]', e);
                    }
                  }
                  await socket.sendMessage(remoteJid, { text: resultText, mentions }, {});
                  sambungKataGames.delete(remoteJid);
                }
              }, roundDuration);
              
              sambungKataGames.set(remoteJid, {
                status: 'playing',
                difficulty,
                currentLetter: currentChain,
                currentChain,
                usedWords,
                scores: {},
                timeLimit,
                timeoutId: null,
                globalTimeoutId,
                roundEndTime
              });
              
              startSambungKataTimeout(socket, remoteJid);
              
              const gameMsg = `━━━━━━━ ⟡ ━━━━━━━\n\nRonde 8 Menit Dimulai!\nKata awal: *${randomWord.toUpperCase()}*\n${chainLabel}\n\n_Balas pesan ini untuk melanjutkan kata (harus ada di KBBI)!_`;
              socket.sendMessage(remoteJid, { text: gameMsg }, { quoted: msg });
            });
            return;
          }
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nSelesaikan game yang sedang berjalan terlebih dahulu!' }, { quoted: msg });
          return;
        }

        // ADVANCED MODES: Confirmation flow
        if (ADVANCED_MODES.includes(difficulty)) {
          const modeInfo = advancedModeRules[difficulty];
          sambungKataGames.set(remoteJid, { status: 'pending_confirmation', difficulty });
          const confirmMsg = `━━━━━━━ ⟡ ━━━━━━━\n\n*${modeInfo.title}*\n\n${modeInfo.rules}\n\n_Ketik *!sambung kata ${difficulty}* dan reply pesan ini untuk konfirmasi._\n_Ketik *!sambung kata batal* untuk menutup permainan ini._`;
          await socket.sendMessage(remoteJid, { text: confirmMsg }, { quoted: msg });
          return;
        }

        // STANDARD MODES: mudah/sedang/susah
        let timeLimit = 60000;
        if (difficulty === 'sedang') timeLimit = 30000;
        else if (difficulty === 'susah') timeLimit = 10000;

        const randomWord = validIndonesianWordsArray[Math.floor(Math.random() * validIndonesianWordsArray.length)];
        const nextLetter = randomWord.charAt(randomWord.length - 1);
        
        const usedWords = new Set();
        usedWords.add(randomWord);

        sambungKataGames.set(remoteJid, { status: 'starting' });

        startCountdownLobby(socket, remoteJid, 'Sambung Kata', () => {
          if (!sambungKataGames.has(remoteJid)) return;
          console.log(`[GAME] Permainan baru dimulai | ${ownerId}`);

          const roundDuration = 8 * 60 * 1000; // 8 minutes
          const roundEndTime = Date.now() + roundDuration;

          const globalTimeoutId = setTimeout(async () => {
            if (sambungKataGames.has(remoteJid)) {
              const game = sambungKataGames.get(remoteJid);
              clearTimeout(game.timeoutId);
              
              let resultText = `━━━━━━━ ⟡ ━━━━━━━\n\nGame selesai (Waktu Habis)!\n\n`;
              let mentions = [];
              const sortedScores = Object.entries(game.scores).sort((a,b) => b[1] - a[1]);
              if (sortedScores.length === 0) {
                resultText += `Tidak ada yang berhasil melanjutkan kata satu pun. 😅\n`;
              } else {
                let rank = 1;
                for (const [user, score] of sortedScores) {
                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
                  resultText += `${medal} @${user.split('@')[0]} berhasil melanjutkan ${score} kata\n`;
                  mentions.push(formatJid(user));
                  rank++;
                }

                try {
                  const winnerJid = sortedScores[0][0];
                  const winnerScore = sortedScores[0][1];
                  const winnerPhone = winnerJid.split('@')[0];
                  const pRes = await gasbridge.getProfile(winnerPhone);
                  if (pRes && pRes.status === 'success') {
                    if (winnerScore > 0) {
                      let rewardWP = 10;
                      let rewardWM = 500;
                      let bonusText = '';
                      
                      if (winnerScore > 2) {
                        const extra = winnerScore - 2;
                        rewardWP += extra * 5;
                        rewardWM += extra * 200;
                        bonusText = ` (+Bonus Menjawab > 2 berlipat!)`;
                      }
                      
                      await gasbridge.updateProfile(winnerPhone, { wp: pRes.profile.wp + rewardWP, wm: pRes.profile.wm + rewardWM });
                      resultText += `\n🎁 @${winnerPhone} mendapat hadiah Juara 1: +${rewardWP} WP & +${rewardWM} WM${bonusText}!`;
                    } else {
                      resultText += `\n💔 Sayang sekali, Juara 1 (0 kata) tidak mendapatkan hadiah apa-apa!`;
                    }
                  }
                } catch(e) {
                  console.error('[REWARD ERROR]', e);
                }
              }
              await socket.sendMessage(remoteJid, { text: resultText, mentions }, {});
              const ownerId = findGroupOwner(remoteJid);
              if (ownerId) console.log(`[GAME] Permainan berakhir | ${ownerId}`);
              sambungKataGames.delete(remoteJid);
            }
          }, roundDuration);

          sambungKataGames.set(remoteJid, { 
            status: 'playing',
            difficulty,
            currentLetter: nextLetter, 
            usedWords, 
            scores: {},
            timeLimit,
            timeoutId: null,
            globalTimeoutId,
            roundEndTime
          });
          
          startSambungKataTimeout(socket, remoteJid);

          const gameMsg = `━━━━━━━ ⟡ ━━━━━━━\n\nRonde 8 Menit Dimulai!\nKata awal: *${randomWord.toUpperCase()}*\nSelanjutnya huruf *${nextLetter.toUpperCase()}*...\n\n_Balas pesan ini untuk melanjutkan kata (harus ada di KBBI)!_`;
          socket.sendMessage(remoteJid, { text: gameMsg }, { quoted: msg });
        });
        
        return;
      }

      // Moderation & Utilities (!hidetag, !setcmd, !delcmd, !stiker, !kick, !gcclose, !gcopen, !s, !yt_dl, !cekpengumuman, !whatanime, !gambar, !jernihkan, !hapusbg, !primbon, !cerpen, !stiker_api, !suara)
      if (['add', 'hidetag', 'setcmd', 'delcmd', 'stiker', 'sticker', 'stikers', 'stickers', 'stickrs', 'kick', 'gcclose', 'gclose', 'gcopen', 's', 'yt_dl', 'tiktok_dl', 'insta_dl', 'x_dl', 'cekpengumuman', 'whatanime', 'gambar', 'jernihkan', 'hapusbg', 'primbon', 'cerpen', 'stiker_api', 'suara', 'mute', 'unmute', 'ban', 'blacklist', 'unblacklist'].includes(command)) {
        let isAdmin = false;
        if (isGroup) {
          try {
            const metadata = await socket.groupMetadata(remoteJid);
            const participant = metadata.participants.find(p => p.id === senderJid);
            if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
              isAdmin = true;
            }
          } catch (e) {
            console.error('Error fetching group metadata', e);
          }
        }
        
        if (!isAdmin && ['setcmd', 'delcmd', 'kick', 'gcclose', 'gclose', 'gcopen', 'mute', 'unmute', 'ban', 'blacklist', 'unblacklist'].includes(command)) {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nPerintah ini hanya dapat digunakan oleh Admin Grup.' }, { quoted: msg });
          return;
        }
        if (command === 'add') {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nFitur *!add* sengaja dinonaktifkan demi keamanan nomor bot dari pemblokiran (Banned) pihak WhatsApp.\n\n💡 *Solusi Aman:*\nSilakan gunakan perintah *!link* untuk mendapatkan tautan undangan grup ini.' }, { quoted: msg });
          return;
        }

        if (command === 'kick') {
          try {
            const metadata = await socket.groupMetadata(remoteJid);
            const botJid = socket.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = metadata.participants.find(p => p.id === botJid);
            if (!botParticipant || (botParticipant.admin !== 'admin' && botParticipant.admin !== 'superadmin')) {
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nBot harus menjadi Admin Grup untuk menggunakan perintah ini.' }, { quoted: msg });
              return;
            }

            let targetUser = null;
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
              targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
              targetUser = msg.message.extendedTextMessage.contextInfo.participant;
            }

            if (!targetUser) {
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nHarap tag (@) orang yang ingin dikick atau balas (reply) pesannya.\nContoh: !kick @user' }, { quoted: msg });
              return;
            }
            
            if (targetUser === botJid) {
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nAku tidak bisa men-kick diriku sendiri!' }, { quoted: msg });
              return;
            }

            await socket.groupParticipantsUpdate(remoteJid, [targetUser], "remove");
            await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nSelamat jalan @${targetUser.split('@')[0]} 👋`, mentions: [targetUser] });
          } catch (e) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nTerjadi kesalahan saat mencoba kick.' }, { quoted: msg });
          }
          return;
        }

        if (command === 'mute') {
          function parseDuration(str) {
            if (!str) return null;
            const match = str.match(/^(\d+)([smhd]?)$/i);
            if (!match) return null;
            const val = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            switch (unit) {
              case 's': return val * 1000;
              case 'h': return val * 60 * 60 * 1000;
              case 'd': return val * 24 * 60 * 60 * 1000;
              case 'm':
              default: return val * 60 * 1000;
            }
          }

          let durationMs = null;
          let rawDuration = '';
          if (args.length > 0) {
            durationMs = parseDuration(args[0]);
            if (durationMs) {
              rawDuration = args[0];
              args.shift();
            }
          }

          let targetNum = '';
          let reason = 'Melanggar aturan';

          const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
          const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

          if (mentionedJid) {
            targetNum = mentionedJid.split('@')[0];
            reason = args.join(' ') || reason;
          } else if (quotedParticipant) {
            targetNum = quotedParticipant.split('@')[0];
            reason = args.join(' ') || reason;
          } else if (args.length > 0) {
            const lastArg = args[args.length - 1].replace(/[^0-9]/g, '');
            if (lastArg.length >= 9) {
              targetNum = lastArg;
              args.pop();
              reason = args.join(' ') || reason;
            }
          }

          if (!targetNum) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nHarap tag (@) orang yang ingin di-mute, balas pesannya, atau tulis nomornya.\nFormat: *!mute {waktu} {alasan} {nomer}*\nContoh: !mute 10m Spamming @user' }, { quoted: msg });
            return;
          }

          const expiryDate = durationMs ? new Date(Date.now() + durationMs).toISOString() : 'infinity';

          try {
            const gasbridge = require('./gasbridge');
            await gasbridge.addMute(targetNum, expiryDate, reason, senderNumber.split('@')[0], remoteJid);
            datacache.addMuteLocal(targetNum, expiryDate, reason, senderNumber.split('@')[0], remoteJid);
            
            if (durationMs) {
              scheduleUnmute(socket, remoteJid, targetNum, durationMs);
            }

            const targetJid = `${targetNum}@s.whatsapp.net`;
            const durationText = durationMs ? rawDuration : 'permanen';
            await socket.sendMessage(remoteJid, {
              text: `🤐 *[Moderasi]* Pengguna @${targetNum} telah di-mute selama *${durationText}*.\n*Alasan:* ${reason}`,
              mentions: [targetJid]
            });
          } catch (e) {
            console.error('Error muting user:', e);
            await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat mencoba mute.' }, { quoted: msg });
          }
          return;
        }

        if (command === 'unmute') {
          let targetNum = '';
          const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
          const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

          if (mentionedJid) {
            targetNum = mentionedJid.split('@')[0];
          } else if (quotedParticipant) {
            targetNum = quotedParticipant.split('@')[0];
          } else if (args.length > 0) {
            targetNum = args[0].replace(/[^0-9]/g, '');
          }

          if (!targetNum) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nHarap tag (@) orang yang ingin di-unmute, balas pesannya, atau tulis nomornya.\nContoh: !unmute @user' }, { quoted: msg });
            return;
          }

          try {
            const gasbridge = require('./gasbridge');
            await gasbridge.deleteMute(targetNum);
            datacache.removeMuteLocal(targetNum);
            if (muteTimeouts.has(targetNum)) {
              clearTimeout(muteTimeouts.get(targetNum));
              muteTimeouts.delete(targetNum);
            }

            const targetJid = `${targetNum}@s.whatsapp.net`;
            await socket.sendMessage(remoteJid, {
              text: `🔊 *[Moderasi]* Pengguna @${targetNum} telah di-unmute. Sekarang dapat mengirim pesan kembali.`,
              mentions: [targetJid]
            });
          } catch (e) {
            console.error('Error unmuting user:', e);
            await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat mencoba unmute.' }, { quoted: msg });
          }
          return;
        }

        if (command === 'ban' || command === 'blacklist') {
          let targetNum = '';
          let reason = 'Melanggar aturan';

          const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
          const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

          if (mentionedJid) {
            targetNum = mentionedJid.split('@')[0];
            reason = args.join(' ') || reason;
          } else if (quotedParticipant) {
            targetNum = quotedParticipant.split('@')[0];
            reason = args.join(' ') || reason;
          } else if (args.length > 0) {
            const lastArg = args[args.length - 1].replace(/[^0-9]/g, '');
            if (lastArg.length >= 9) {
              targetNum = lastArg;
              args.pop();
              reason = args.join(' ') || reason;
            }
          }

          if (!targetNum) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nHarap tag (@) orang yang ingin di-ban, balas pesannya, atau tulis nomornya.\nFormat: *!ban {alasan} {nomer}*\nContoh: !ban Spamming @user' }, { quoted: msg });
            return;
          }

          try {
            const gasbridge = require('./gasbridge');
            await gasbridge.addToBlacklist(targetNum, reason);
            datacache.addBlacklistedLocal(targetNum);

            const targetJid = `${targetNum}@s.whatsapp.net`;
            await socket.sendMessage(remoteJid, {
              text: `🚫 *[Moderasi]* Pengguna @${targetNum} telah diblokir/ban permanen dari seluruh sistem.\n*Alasan:* ${reason}`,
              mentions: [targetJid]
            });
          } catch (e) {
            console.error('Error banning user:', e);
            await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat mencoba ban.' }, { quoted: msg });
          }
          return;
        }

        if (command === 'unban' || command === 'unblacklist') {
          let targetNum = '';
          const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
          const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

          if (mentionedJid) {
            targetNum = mentionedJid.split('@')[0];
          } else if (quotedParticipant) {
            targetNum = quotedParticipant.split('@')[0];
          } else if (args.length > 0) {
            targetNum = args[0].replace(/[^0-9]/g, '');
          }

          if (!targetNum) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nHarap tag (@) orang yang ingin di-unban, balas pesannya, atau tulis nomornya.\nContoh: !unban @user' }, { quoted: msg });
            return;
          }

          try {
            const gasbridge = require('./gasbridge');
            await gasbridge.deleteFromBlacklist(targetNum);
            datacache.removeBlacklistedLocal(targetNum);

            const targetJid = `${targetNum}@s.whatsapp.net`;
            await socket.sendMessage(remoteJid, {
              text: `✅ *[Moderasi]* Pengguna @${targetNum} telah di-unban/unblacklist. Sekarang dapat menggunakan fitur bot kembali.`,
              mentions: [targetJid]
            });
          } catch (e) {
            console.error('Error unbanning user:', e);
            await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat mencoba unban.' }, { quoted: msg });
          }
          return;
        }

        if (command === 'gcclose' || command === 'gclose' || command === 'gcopen') {
          try {
            const metadata = await socket.groupMetadata(remoteJid);
            // Menghapus pengecekan admin bot manual karena Baileys sering nge-cache metadata.
            // Biarkan socket.groupSettingUpdate langsung bekerja, kalau gagal akan masuk ke catch.

            if (command === 'gcclose' || command === 'gclose') {
              if (metadata.announce === true) {
                await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n❌ Grup sudah dalam keadaan tertutup (hanya admin yang dapat mengirim pesan)!' }, { quoted: msg });
                return;
              }
            } else if (command === 'gcopen') {
              if (metadata.announce === false || metadata.announce === undefined) {
                await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n❌ Grup sudah dalam keadaan terbuka (semua peserta dapat mengirim pesan)!' }, { quoted: msg });
                return;
              }
            }

            const setting = (command === 'gcclose' || command === 'gclose') ? 'announcement' : 'not_announcement';
            await socket.groupSettingUpdate(remoteJid, setting);
            
            const stateText = (command === 'gcclose' || command === 'gclose') ? 'ditutup, hanya admin yang dapat mengirim pesan' : 'dibuka, semua peserta dapat mengirim pesan';
            await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nGrup telah ${stateText}.` });
          } catch (e) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n❌ Gagal mengubah pengaturan. Pastikan Bot benar-benar sudah menjadi Admin grup!' }, { quoted: msg });
          }
          return;
        }

        if (command === 'hidetag') {
          if (config.Cmd_Hidetag_Status !== true && config.Cmd_Hidetag_Status !== 'TRUE') {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nAdmin utama bot belum mengaktifkan fitur !hidetag di Pusat Control.' }, { quoted: msg });
            return;
          }
          const messageText = args.join(' ');
          if (!messageText) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nContoh:\n```!hidetag Pengumuman penting!```\n\n(Aku akan mengirim "Pengumuman penting!" dan men-tag seluruh anggota grup)' }, { quoted: msg });
            return;
          }
          try {
            const metadata = await socket.groupMetadata(remoteJid);
            const participantsJid = metadata.participants.map(p => p.id);
            await socket.sendMessage(remoteJid, { text: messageText, mentions: participantsJid });
          } catch (e) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━' }, { quoted: msg });
          }
          return;
        }

        if (command === 'cekpengumuman') {
          try {
            const metadata = await socket.groupMetadata(remoteJid);
            
            // Check if it has a linked parent (announcement group)
            let parentJid = metadata.linkedParent;
            
            // If it doesn't have a linked parent but IS the community group itself:
            if (!parentJid && (metadata.isCommunity || metadata.isCommunityAnnounce)) {
              parentJid = metadata.id;
            }

            if (!parentJid) {
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n❌ *Pesan Error:*\nGrup ini bukan bagian dari Komunitas WhatsApp, sehingga tidak memiliki papan pengumuman komunitas.' }, { quoted: msg });
              return;
            }

            // Fetch parent metadata to get the description (announcement text)
            const parentMetadata = await socket.groupMetadata(parentJid);
            const pengumumanText = parentMetadata.desc || 'Tidak ada teks pengumuman/deskripsi di grup utama komunitas.';

            const replyText = `📢 *PENGUMUMAN KOMUNITAS*\n\n*Komunitas:* ${parentMetadata.subject}\n\n${pengumumanText}`;
            await socket.sendMessage(remoteJid, { text: replyText }, { quoted: msg });

          } catch (e) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n❌ Gagal mengambil data komunitas. Pastikan bot tergabung dalam grup pengumuman komunitas tersebut.' }, { quoted: msg });
          }
          return;
        }

        if (command === 'setcmd') {
          if (config.Cmd_SetDel_Status !== true && config.Cmd_SetDel_Status !== 'TRUE') {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nAdmin utama bot belum mengaktifkan fitur !setcmd di Pusat Control.' }, { quoted: msg });
            return;
          }
          if (args.length < 2) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nContoh:\n```!setcmd ping pong```\n\n(Ketika ada yang ketik ping maka aku akan bales pong)' }, { quoted: msg });
            return;
          }
          const keyword = args[0];
          const responsePayload = args.slice(1).join(' ');
          
          // Cari tau grup ini ada di GroupJID keberapa
          let targetGroupStr = 'All';
          for (let i = 1; i <= 5; i++) {
            if (client[`GroupJID_${i}`] === remoteJid) {
              targetGroupStr = String(i);
              break;
            }
          }
          
          const loadingMsg = await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nKeyword: ${keyword}\nTarget: Group ${targetGroupStr}` }, { quoted: msg });
          try {
            const gasResult = await gasbridge.addAutoResponder(ownerId, keyword, 'Contains', 'Text', responsePayload, targetGroupStr);
            
            // Hapus pesan loading
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key });

            if (gasResult.status === 'success') {
              const newEntry = {
                Response_ID: gasResult.response_id,
                User_ID: ownerId,
                Keyword: keyword,
                Match_Type: 'Contains',
                Response_Type: 'Text',
                Payload_Data: responsePayload,
                Target_Groups: targetGroupStr
              };
              datacache.addResponderEntry(ownerId, newEntry);
              await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nKeyword: ${keyword}\nBalasan: ${responsePayload}\nSekarang aku akan otomatis membalas jika ada kata tersebut.` });
            } else {
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nTerjadi kesalahan di server.' }, { quoted: msg });
            }
          } catch (e) {
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nTerjadi kesalahan koneksi.' }, { quoted: msg });
          }
          return;
        }

        if (command === 'delcmd') {
          if (config.Cmd_SetDel_Status !== true && config.Cmd_SetDel_Status !== 'TRUE') {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nAdmin utama bot belum mengaktifkan fitur !delcmd di Pusat Control.' }, { quoted: msg });
            return;
          }
          if (args.length < 1) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nContoh:\n```!delcmd ping```\n\n(Akan menghapus respon otomatis untuk kata ping)' }, { quoted: msg });
            return;
          }
          const keyword = args[0].toLowerCase();
          const responders = datacache.getResponders(ownerId) || [];
          const found = responders.find(r => r.Keyword.toLowerCase() === keyword);
          if (!found) {
            await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nTidak ada command dengan keyword: ${keyword}` }, { quoted: msg });
            return;
          }
          
          const loadingDel = await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nKeyword: ${keyword}` }, { quoted: msg });
          try {
            const gasResult = await gasbridge.deleteAutoResponder(found.Response_ID);
            
            await socket.sendMessage(remoteJid, { delete: loadingDel.key });
            
            if (gasResult.status === 'success') {
              datacache.removeResponderEntry(ownerId, found.Response_ID);
              await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nKeyword ${keyword} tidak akan lagi dibalas oleh bot.` });
            } else {
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nTerjadi kesalahan di server.' }, { quoted: msg });
            }
          } catch (e) {
            await socket.sendMessage(remoteJid, { delete: loadingDel.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nTerjadi kesalahan koneksi.' }, { quoted: msg });
          }
          return;
        }

        if (['stiker', 'sticker', 'stikers', 'stickers', 'stickrs'].includes(command)) {
          if (config.Cmd_Stiker_Status !== true && config.Cmd_Stiker_Status !== 'TRUE') {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nAdmin utama bot belum mengaktifkan fitur !stiker di Pusat Control.' }, { quoted: msg });
            return;
          }
          const messageText = args.join(' ');
          if (!messageText) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nContoh:\n```!stiker Pagi Semua```\n\n(Akan membuat stiker teks "Pagi Semua")' }, { quoted: msg });
            return;
          }
          
          if (args.length > 10) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nTeks terlalu panjang! Maksimal pembuatan stiker adalah 10 kata.' }, { quoted: msg });
            return;
          }
          
          if (messageText.includes('\n')) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nPembuatan stiker tidak mendukung penggunaan baris baru (Enter). Silakan ketik dalam satu baris lurus saja.' }, { quoted: msg });
            return;
          }

          const loadingSticker = await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nMohon tunggu sebentar...` }, { quoted: msg });
          try {
            const stickerBuffer = await makeTextSticker(messageText);
            await socket.sendMessage(remoteJid, { delete: loadingSticker.key });
            await socket.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: msg });
          } catch (e) {
            console.error('[WA] Gagal membuat stiker:', e);
            await socket.sendMessage(remoteJid, { delete: loadingSticker.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nTerjadi kesalahan.' }, { quoted: msg });
          }
          return;
        }
        
        if (command === 's') {
          const isImage = msg.message?.imageMessage;
          const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
          
          if (!isImage && !isQuotedImage) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nKirim gambar dengan caption `!s` atau reply gambar orang lain dengan `!s`.' }, { quoted: msg });
            return;
          }
          
          const loadingSticker = await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nMemproses gambar...` }, { quoted: msg });
          try {
            const targetMsg = isQuotedImage ? 
              { message: { imageMessage: msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage } } : 
              msg;
              
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', { }, { logger: pino({ level: 'silent' }) });
            
            // Convert to webp using sharp with contain fit and transparent background
            const webpBuffer = await sharp(buffer)
              .resize(512, 512, { 
                fit: 'contain', 
                background: { r: 0, g: 0, b: 0, alpha: 0 } 
              })
              .webp({ quality: 80 })
              .toBuffer();
              
            await socket.sendMessage(remoteJid, { delete: loadingSticker.key });
            await socket.sendMessage(remoteJid, { sticker: webpBuffer }, { quoted: msg });
          } catch (e) {
            console.error('[WA] Gagal membuat stiker gambar:', e);
            await socket.sendMessage(remoteJid, { delete: loadingSticker.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nTerjadi kesalahan saat memproses gambar menjadi stiker.' }, { quoted: msg });
          }
          return;
        }
        
        if (command === 'whatanime') {
          const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
          if (!isImage && !isQuotedImage) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nKirim gambar dengan caption `!whatanime` atau reply gambar.' }, { quoted: msg });
            return;
          }
          
          const loadingMsg = await socket.sendMessage(remoteJid, { text: `⏳ _Mencari anime dari gambar ini..._` }, { quoted: msg });
          try {
            const targetMsg = isQuotedImage ? 
              { message: { imageMessage: msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage } } : 
              msg;
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', { }, { logger: pino({ level: 'silent' }) });
            
            const axios = require('axios');
            const FormData = require('form-data');
            const form = new FormData();
            form.append('image', buffer, 'image.jpg');
            
            const res = await axios.post('https://api.trace.moe/search', form, { headers: form.getHeaders() });
            
            if (res.data && res.data.result && res.data.result.length > 0) {
               const hit = res.data.result[0];
               const similarity = (hit.similarity * 100).toFixed(2);
               let text = `🎬 *WHAT ANIME*\n\n`;
               text += `*Judul:* ${hit.filename}\n`;
               text += `*Episode:* ${hit.episode || '?'}\n`;
               text += `*Kecocokan:* ${similarity}%\n`;
               
               if (hit.video) {
                 await socket.sendMessage(remoteJid, { video: { url: hit.video }, caption: text }, { quoted: msg });
               } else {
                 await socket.sendMessage(remoteJid, { image: { url: hit.image }, caption: text }, { quoted: msg });
               }
            } else {
               await socket.sendMessage(remoteJid, { text: '❌ Anime tidak ditemukan!' }, { quoted: msg });
            }
          } catch (e) {
            console.error('[WA] Trace.moe Error:', e);
            await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat mencari anime.' }, { quoted: msg });
          }
          await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
          return;
        }
        
        if (command === 'yt_dl' || command === 'tiktok_dl' || command === 'insta_dl' || command === 'x_dl') {
          const url = args[0];
          const fileType = args[1] ? args[1].toLowerCase() : 'mp4';

          if (!url || !url.startsWith('http')) {
            await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nHarap masukkan link yang valid.\nContoh: \`!${command.replace('_', ' ')} https://... mp3\`` }, { quoted: msg });
            return;
          }
          
          const msgMencari = await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n🔍 Mencari sumber...' }, { quoted: msg });
          
          try {
            const { fetchBotcahx } = require('./botcahx_api');
            let dlResult = null;
            let finalUrl = null;
            let mimeType = 'video/mp4';
            let fileName = 'video.mp4';
            let isAudio = (fileType === 'mp3');

            if (isAudio) {
              mimeType = 'audio/mpeg';
              fileName = 'audio.mp3';
            }

            // Animasi transisi mencari -> mendownload
            await new Promise(r => setTimeout(r, 1000));
            await socket.sendMessage(remoteJid, { delete: msgMencari.key }).catch(() => {});
            const msgMendownload = await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n📥 Mendownload...' }, { quoted: msg });

            if (command === 'yt_dl') {
              dlResult = await fetchBotcahx('/api/dowloader/yt', { url });
              if (!dlResult || !dlResult.result) throw new Error('Video tidak ditemukan');
              finalUrl = isAudio ? dlResult.result.mp3 : dlResult.result.mp4;
            } else if (command === 'tiktok_dl') {
              dlResult = await fetchBotcahx('/api/dowloader/tiktok', { url });
              if (!dlResult || !dlResult.result) throw new Error('Video tidak ditemukan');
              finalUrl = isAudio ? (dlResult.result.audio[0] || dlResult.result.audio) : (dlResult.result.video[0] || dlResult.result.video);
            } else if (command === 'insta_dl') {
              dlResult = await fetchBotcahx('/api/dowloader/igdowloader', { url });
              if (!dlResult || !dlResult.result || dlResult.result.length === 0) throw new Error('Video/Gambar tidak ditemukan');
              finalUrl = dlResult.result[0].url;
            } else if (command === 'x_dl') {
              dlResult = await fetchBotcahx('/api/dowloader/twitter', { url });
              if (!dlResult || !dlResult.result) throw new Error('Media tidak ditemukan');
              finalUrl = isAudio ? dlResult.result.audio : (dlResult.result.url[0] ? dlResult.result.url[0].hd : dlResult.result.url);
            }

            if (!finalUrl) throw new Error('Gagal mendapatkan link download');

            await socket.sendMessage(remoteJid, { delete: msgMendownload.key }).catch(() => {});
            
            // Download file fisik untuk menghindari blokir stream Baileys/Cloudflare
            const axios = require('axios');

            const path = require('path');
            const tmpFile = path.join(__dirname, `temp_${Date.now()}_${isAudio ? 'audio.mp3' : 'video.mp4'}`);
            
            const response = await axios({
              method: 'GET',
              url: finalUrl,
              responseType: 'stream',
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' }
            });
            
            const writer = fs.createWriteStream(tmpFile);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
              writer.on('finish', resolve);
              writer.on('error', reject);
            });

            if (isAudio) {
              await socket.sendMessage(remoteJid, { 
                document: { url: tmpFile }, 
                mimetype: 'audio/mpeg',
                fileName: fileName
              }, { quoted: msg });
            } else {
              await socket.sendMessage(remoteJid, { 
                document: { url: tmpFile }, 
                mimetype: mimeType, 
                fileName: fileName,
                caption: `━━━━━━━ ⟡ ━━━━━━━\nBerhasil mendownload video!`
              }, { quoted: msg });
            }
            
            // Hapus file sementara setelah terkirim
            if (fs.existsSync(tmpFile)) {
              fs.unlinkSync(tmpFile);
            }

          } catch (e) {
            console.error(`[WA] Gagal download ${command}:`, e);
            await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n❌ Gagal memproses: ${e.message}` }, { quoted: msg });
          }
          return;
        }

        // --- BOTCAHX AI IMAGE ---
        if (['gambar', 'jernihkan', 'hapusbg'].includes(command)) {
          const { fetchBotcahx } = require('./botcahx_api');
          const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
          const isImage = msg.message?.imageMessage;

          if (command === 'gambar') {
            const prompt = args.join(' ');
            if (!prompt) {
              await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nMasukkan deskripsi gambar!\nContoh: `!gambar kucing sedang minum kopi`' }, { quoted: msg });
              return;
            }
            const loadingMsg = await socket.sendMessage(remoteJid, { text: `⏳ _Sedang melukis gambar..._` }, { quoted: msg });
            try {
              // Usually text2image API returns the image buffer directly or a result URL. Botcahx uses /api/maker/text2image
              const res = await fetchBotcahx('/api/maker/text2image', { text: prompt });
              await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
              if (res && res.result) {
                await socket.sendMessage(remoteJid, { image: { url: res.result }, caption: `🎨 *Hasil Gambar:* ${prompt}` }, { quoted: msg });
              } else {
                throw new Error('Gagal memproses gambar');
              }
            } catch (e) {
              console.error('[WA] Gambar error:', e);
              await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
              await socket.sendMessage(remoteJid, { text: `❌ Gagal menghasilkan gambar: ${e.message}` }, { quoted: msg });
            }
            return;
          }

          if (command === 'jernihkan' || command === 'hapusbg') {
            if (!isImage && !isQuotedImage) {
              await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nKirim/reply gambar dengan caption \`!${command}\`` }, { quoted: msg });
              return;
            }
            const loadingMsg = await socket.sendMessage(remoteJid, { text: `⏳ _Sedang memproses gambar..._` }, { quoted: msg });
            try {
              const targetMsg = isQuotedImage ? 
                { message: { imageMessage: msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage } } : msg;
              const buffer = await downloadMediaMessage(targetMsg, 'buffer', { }, { logger: pino({ level: 'silent' }) });
              
              // We need to upload the image first to botcahx or telegra.ph to process it via API
              const { FormData } = require('form-data');
              const axios = require('axios');
              
              // Helper to upload image to tmpfiles.org or similar
              // Because many REST APIs require an image URL. Let's upload to tmpfiles
              const form = new FormData();
              form.append('file', buffer, 'image.jpg');
              const uploadRes = await axios.post('https://tmpfiles.org/api/v1/upload', form, { headers: form.getHeaders() });
              const uploadedUrl = uploadRes.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

              let endpoint = command === 'jernihkan' ? '/api/tools/remini' : '/api/tools/removebg';
              const res = await fetchBotcahx(endpoint, { url: uploadedUrl });
              
              await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
              
              const finalImage = res.result ? res.result : (res.url || res.url_img);
              if (finalImage) {
                await socket.sendMessage(remoteJid, { image: { url: finalImage }, caption: `✨ *Berhasil di${command === 'jernihkan' ? 'jernihkan' : 'hapus background'}!*` }, { quoted: msg });
              } else {
                throw new Error('Hasil tidak ditemukan');
              }
            } catch (e) {
              console.error(`[WA] ${command} error:`, e);
              await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
              await socket.sendMessage(remoteJid, { text: `❌ Gagal memproses gambar: Server sedang sibuk/error.` }, { quoted: msg });
            }
            return;
          }
        }

        // --- BOTCAHX PRIMBON & CERPEN ---
        if (command === 'primbon') {
          const { fetchBotcahx } = require('./botcahx_api');
          const type = args[0] ? args[0].toLowerCase() : '';
          const data = args.slice(1).join(' ');
          
          if (!type || !data) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nFormat: `!primbon <tipe> <data>`\nContoh: `!primbon artinama Satria`\n\nTipe: artinama, artimimpi, nomerhoki, shio' }, { quoted: msg });
            return;
          }
          
          const loadingMsg = await socket.sendMessage(remoteJid, { text: `⏳ _Mencari primbon..._` }, { quoted: msg });
          try {
            // For artinama, artimimpi, nomerhoki params name in Botcahx are usually: nama, mimpi, nomer. For others: data.
            let paramObj = { data };
            if (type === 'artinama') paramObj = { nama: data };
            else if (type === 'artimimpi') paramObj = { mimpi: data };
            else if (type === 'nomerhoki') paramObj = { nomer: data };
            else if (type === 'shio') paramObj = { shio: data };
            
            const res = await fetchBotcahx(`/api/primbon/${type}`, paramObj);
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            
            const resultText = res.result?.message || res.result?.arti || res.result?.deskripsi || JSON.stringify(res.result, null, 2);
            await socket.sendMessage(remoteJid, { text: `🔮 *PRIMBON - ${type.toUpperCase()}*\n\n${resultText}` }, { quoted: msg });
          } catch (e) {
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: `❌ Gagal memuat primbon: ${e.message}` }, { quoted: msg });
          }
          return;
        }

        if (command === 'cerpen') {
          const { fetchBotcahx } = require('./botcahx_api');
          const genre = args[0] ? args[0].toLowerCase() : 'random';
          
          const loadingMsg = await socket.sendMessage(remoteJid, { text: `⏳ _Mencari cerpen..._` }, { quoted: msg });
          try {
            // The API expects 'type' parameter
            let paramObj = genre === 'random' ? {} : { type: genre };
            let endpoint = genre === 'random' ? '/api/cerpen/cerpen' : '/api/cerpen/cerpen'; // We can just pass type param to /api/cerpen
            // Some Botcahx apis use /api/cerpen/{type} or /api/cerpen with ?type=genre
            // Assuming it's ?type=genre based on the docs list
            const res = await fetchBotcahx('/api/cerpen/cerpen', paramObj);
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            
            const title = res.result?.title || res.result?.judul || 'Cerpen';
            const author = res.result?.author || res.result?.pengarang || 'Anonim';
            const story = res.result?.story || res.result?.cerita || 'Cerita tidak ditemukan.';
            
            await socket.sendMessage(remoteJid, { text: `📖 *${title.toUpperCase()}*\n✍️ _Karya: ${author}_\n\n${story}` }, { quoted: msg });
          } catch (e) {
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: `❌ Gagal memuat cerpen: ${e.message}` }, { quoted: msg });
          }
          return;
        }
        // --- BOTCAHX STIKER API ---
        if (command === 'stiker_api') {
          const { fetchBotcahx } = require('./botcahx_api');
          const type = args[0] ? args[0].toLowerCase() : 'random';
          
          const loadingMsg = await socket.sendMessage(remoteJid, { text: `⏳ _Mengambil stiker..._` }, { quoted: msg });
          try {
            const res = await fetchBotcahx(`/api/sticker/${type}`);
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            
            let stikerUrl = res.result || res.url;
            if (stikerUrl) {
              await socket.sendMessage(remoteJid, { sticker: { url: stikerUrl } }, { quoted: msg });
            } else {
              throw new Error('Stiker tidak ditemukan');
            }
          } catch (e) {
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: `❌ Gagal mengambil stiker: ${e.message}` }, { quoted: msg });
          }
          return;
        }

        // --- SUARA (TTS) ---
        if (command === 'suara') {
          const text = args.join(' ');
          if (!text) {
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nKetik teks yang mau dijadikan suara!\nContoh: `!suara halo semua`' }, { quoted: msg });
            return;
          }
          const loadingMsg = await socket.sendMessage(remoteJid, { text: `⏳ _Sedang merekam suara..._` }, { quoted: msg });
          try {
            const googleTTS = require('google-tts-api');
            const url = googleTTS.getAudioUrl(text, { lang: 'id', slow: false, host: 'https://translate.google.com' });
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { audio: { url: url }, mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
          } catch (e) {
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: `❌ Gagal memproses suara: ${e.message}` }, { quoted: msg });
          }
          return;
        }

      }

      // Configuration Commands (!opencontrol & !ccontrol)
      if (command === 'opencontrol') {
        const clientData = datacache.getClient(ownerId);
        const expectedToken = clientData ? String(clientData.License_Key).trim() : ownerId;
        const inputToken = args.join(' ').trim();
        if (!inputToken || inputToken !== expectedToken) {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nToken tidak valid atau tidak diisi.' }, { quoted: msg });
          return;
        }
        
        const cfg = datacache.getConfig(ownerId);
        if (!cfg) {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nKonfigurasi tidak ditemukan.' }, { quoted: msg });
          return;
        }

        let cText = '━━━━━━━ ⟡ ━━━━━━━\n\n';
        cText += `• Allow_Group_Response: ${cfg.Allow_Group_Response}\n`;
        cText += `• Allow_Private_Response: ${cfg.Allow_Private_Response}\n`;
        cText += `• Anti_Link_Group: ${cfg.Anti_Link_Group}\n`;
        cText += `• Welcome_Message_Status: ${cfg.Welcome_Message_Status}\n`;
        cText += `• Custom_Welcome_Text: ${cfg.Custom_Welcome_Text}\n`;
        cText += `• Cmd_SetDel_Status: ${cfg.Cmd_SetDel_Status}\n`;
        cText += `• Cmd_Hidetag_Status: ${cfg.Cmd_Hidetag_Status}\n`;
        cText += `• Cmd_Stiker_Status: ${cfg.Cmd_Stiker_Status}\n\n`;
        cText += `_Gunakan !ccontrol {token} {Key} {Value} untuk mengubah_`;
        
        await socket.sendMessage(remoteJid, { text: cText }, { quoted: msg });
        return;
      }

      if (command === 'ccontrol') {
        const clientData = datacache.getClient(ownerId);
        const expectedToken = clientData ? String(clientData.License_Key).trim() : ownerId;
        const inputToken = args[0] ? args[0].trim() : ''; // For ccontrol it expects multiple arguments, so we take the first as token
        
        if (!inputToken || inputToken !== expectedToken) {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nToken tidak valid atau tidak diisi.' }, { quoted: msg });
          return;
        }
        
        if (args.length < 3) {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nFormat: !ccontrol {token} {Key} {Value}' }, { quoted: msg });
          return;
        }

        const key = args[1];
        const valStr = args[2].toLowerCase();

        if (key === 'Custom_Welcome_Text') {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nCustom_Welcome_Text tidak bisa diubah lewat command ini.' }, { quoted: msg });
          return;
        }

        let val;
        if (valStr === 'true') val = true;
        else if (valStr === 'false') val = false;
        else {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nValue harus True atau False' }, { quoted: msg });
          return;
        }

        const validKeys = [
          'Allow_Group_Response', 'Allow_Private_Response', 'Anti_Link_Group',
          'Welcome_Message_Status', 'Cmd_SetDel_Status', 'Cmd_Hidetag_Status', 'Cmd_Stiker_Status'
        ];

        if (!validKeys.includes(key)) {
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nKey konfigurasi tidak valid.' }, { quoted: msg });
          return;
        }

        const loadingMsg = await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nMenyimpan ${key} = ${val}...` }, { quoted: msg });
        
        try {
          const fields = {};
          fields[key] = val;
          const gasRes = await gasbridge.updateBotConfig(ownerId, fields);
          
          if (gasRes && gasRes.status === 'success') {
            datacache.updateConfig(ownerId, fields);
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\nBerhasil mengubah ${key} menjadi ${val}` }, { quoted: msg });
          } else {
            await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
            await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nGagal update konfigurasi ke server (mungkin format sheet salah).' }, { quoted: msg });
          }
        } catch (e) {
          console.error('[WA] Error update config via command:', e);
          await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(() => {});
          await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nTerjadi kesalahan koneksi server.' }, { quoted: msg });
        }
        return;
      }
    }
    
    // AI Interceptor (Fallback if quoted bot message wasn't handled by commands)
    if (isQuotedBot && botJid) {
      // Jika game sedang aktif, abaikan reply untuk AI agar tidak tabrakan dengan reply game
      if (tebakKataGames.has(remoteJid) || sambungKataGames.has(remoteJid)) {
        return;
      }
      
      if (datacache.isBlacklisted(senderNumber)) {
        await socket.sendMessage(remoteJid, { text: "🐜 *[YAY Security]* Hush sana! Semut daftar hitam sepertimu dilarang ngobrol sama AI." }, { quoted: msg });
        return;
      }
      // Auto reply via AI jika user me-reply (quoted) pesan bot
      await yay_engine.handleAiQuery(socket, remoteJid, msg, ownerId, text, senderNumber, msg.pushName, true);
      return;
    }

    // Macros Builder Evaluation
    const macros = datacache.getMacros(ownerId) || [];
    for (const macro of macros) {
      if (macro.Status !== 'Active') continue;
      
      const trigger = String(macro.Trigger_Syntax || '').trim();
      if (!trigger || text.trim().toLowerCase() !== trigger.toLowerCase()) continue;

      // Check Target Groups
      const targetGroups = macro.Selected_Groups || [];
      if (targetGroups.length > 0) {
        const allowedJids = targetGroups
          .map(g => client[`GroupJID_${g.replace('Group_', '')}`])
          .filter(Boolean);
        if (!allowedJids.includes(remoteJid)) continue;
      }

      console.log(`[WA] Macro Trigger "${trigger}" matched! Executing action: ${macro.Action_Type}`);
      try {
        if (macro.Action_Type === 'Save_To_Cloud') {
          const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
          if (contextInfo && contextInfo.quotedMessage) {
            const quotedMsg = { message: contextInfo.quotedMessage };
            const isMedia = quotedMsg.message.imageMessage || quotedMsg.message.videoMessage || quotedMsg.message.documentMessage;
            
            if (isMedia) {
              await socket.sendMessage(remoteJid, { text: "☁️ *[Macro]* Sedang menyimpan ke Cloud..." }, { quoted: msg });
              try {
                const buffer = await downloadMediaMessage(quotedMsg, 'buffer', { }, { logger: pino({ level: 'silent' }) });
                const base64 = buffer.toString('base64');
                const mimeType = isMedia.mimetype || 'application/octet-stream';
                
                // Get extension from mimeType
                let ext = '';
                if (mimeType.includes('image')) ext = '.jpg';
                else if (mimeType.includes('video')) ext = '.mp4';
                else if (mimeType.includes('pdf')) ext = '.pdf';
                const filename = `MacroUpload_${Date.now()}${ext}`;
                
                const result = await gasbridge.uploadDriveFile(ownerId, filename, mimeType, base64, buffer.length);
                if (result.status === 'success') {
                  await socket.sendMessage(remoteJid, { text: `✅ *[Macro]* File berhasil disimpan ke Cloud!\nNama: ${filename}` }, { quoted: msg });
                } else {
                  await socket.sendMessage(remoteJid, { text: "❌ *[Macro]* Gagal menyimpan ke Cloud: " + result.message }, { quoted: msg });
                }
              } catch (dlErr) {
                console.error(dlErr);
                await socket.sendMessage(remoteJid, { text: "❌ *[Macro]* Gagal mendownload media dari WhatsApp." }, { quoted: msg });
              }
            } else {
              await socket.sendMessage(remoteJid, { text: "⚠️ *[Macro]* Kamu harus me-reply foto/video/dokumen untuk menyimpannya." }, { quoted: msg });
            }
          } else {
            await socket.sendMessage(remoteJid, { text: "⚠️ *[Macro]* Kamu harus me-reply sebuah file/media terlebih dahulu dengan sintak ini." }, { quoted: msg });
          }
        } else if (macro.Action_Type === 'Auto_Forward') {
          await socket.sendMessage(remoteJid, { text: "➡️ *[Macro]* Auto Forward dieksekusi. (Simulasi)" }, { quoted: msg });
        } else if (macro.Action_Type === 'Webhook_Trigger') {
          await socket.sendMessage(remoteJid, { text: "🪝 *[Macro]* Webhook berhasil di-trigger! (Simulasi)" }, { quoted: msg });
        }
      } catch (e) {
        console.error(`[WA] Failed to execute Macro (${ownerId}):`, e.message);
      }
      return; // Stop processing further if macro matched and executed
    }

    // Auto-responder
    const responders = datacache.getResponders(ownerId) || [];
    console.log(`[WA] Message: "${text}" | ${ownerId}`);

    for (const rule of responders) {
      let matched = false;
      const keyword = String(rule.Keyword || '');
      if (rule.Match_Type === 'Exact') {
        matched = text.trim().toLowerCase() === keyword.toLowerCase();
      } else if (rule.Match_Type === 'Contains') {
        // Cuma nilai besar/kecilnya aja dan KATA UTUH. "aku" match "aKu", tapi tidak match "akun".
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
        matched = regex.test(text);
      }

      if (!matched) continue;

      // Filter target grup: "Semua" = semua grup, "1" / "1,2" = grup tertentu
      const targetGroups = String(rule.Target_Groups || 'All').trim();
      if (targetGroups !== 'Semua' && targetGroups !== 'All' && targetGroups !== '') {
        const allowedIndices = targetGroups.split(',').map(s => s.trim());
        const allowedJids = allowedIndices
          .map(idx => client[`GroupJID_${idx}`])
          .filter(Boolean);
        if (!allowedJids.includes(remoteJid)) {
          console.log(`[WA] Keyword "${keyword}" matched, but group is not in target list.`);
          continue;
        }
      }

      console.log(`[WA] Keyword "${keyword}" matched! Sending response to ${remoteJid}...`);
      try {
        if (rule.Response_Type === 'Text') {
          await socket.sendMessage(remoteJid, { text: rule.Payload_Data });
        } else if (rule.Response_Type === 'Image') {
          await socket.sendMessage(remoteJid, {
            image: { url: rule.Payload_Data },
            caption: rule.Payload_Data
          });
        } else if (rule.Response_Type === 'Document') {
          await socket.sendMessage(remoteJid, {
            document: { url: rule.Payload_Data },
            fileName: path.basename(rule.Payload_Data)
          });
        }
        console.log(`[WA] Response sent successfully.`);
      } catch (e) {
        console.error(`[WA] Failed to send response (${ownerId}):`, e.message);
      }
      
      // Hentikan loop agar bot hanya merespon 1 kali per pesan masuk (tidak numpuk)
      break;
    }
    } catch(err) {
      console.error('[WA] Critical Error in messages.upsert:', err);
    }
  });

  // Welcome message
  socket.ev.on('group-participants.update', async (event) => {
    if (event.action !== 'add') return;
    const ownerId = findGroupOwner(event.id);
    if (!ownerId) return;

    const config = datacache.getConfig(ownerId);
    if (!config) return;
    const welcomeOn = config.Welcome_Message_Status === true || config.Welcome_Message_Status === 'TRUE';
    if (!welcomeOn) return;

    const groupMeta = await socket.groupMetadata(event.id).catch(() => null);
    if (!groupMeta) return;
    const groupName = groupMeta.subject;

    for (const participant of event.participants) {
      const memberName = participant.split('@')[0];
      let welcomeText = config.Custom_Welcome_Text || 'Selamat datang {member} di grup {group}! 🎉';
      welcomeText = welcomeText.replace('{member}', `@${memberName}`).replace('{group}', groupName);
      await socket.sendMessage(event.id, { text: welcomeText, mentions: [participant] });
    }
  });
}

function stopMasterSession() {
  if (masterSession.socket) {
    masterSession.socket.ev.removeAllListeners();
    masterSession.socket.end(undefined);
    masterSession.socket = null;
    console.log(`[WA] Master Bot stopped.`);
  }
}

function getMasterSessionStatus() { return masterSession.status; }
function getMasterQr() { return masterSession.qr; }

async function sendMasterMessage(jid, content) {
  if (!masterSession.socket || masterSession.status !== 'CONNECTED') return false;
  try {
    // Baileys expects an object, normalize primitive strings
    const normalizedContent = typeof content === 'string' ? { text: content } : content;
    await masterSession.socket.sendMessage(jid, normalizedContent);
    return true;
  } catch (e) {
    console.error(`[WA] Failed to send master message to ${jid}:`, e.message);
    return false;
  }
}

async function broadcastMasterMessage(content) {
  if (!masterSession.socket || masterSession.status !== 'CONNECTED') {
    console.log('[WA] Master session not ready for broadcast');
    return false;
  }
  try {
    const groups = await masterSession.socket.groupFetchAllParticipating();
    let count = 0;
    for (const jid in groups) {
      try {
        await masterSession.socket.sendMessage(jid, content);
        console.log(`[BROADCAST] Berhasil dikirim ke grup: ${groups[jid].subject}`);
        count++;
        await new Promise(r => setTimeout(r, 1000)); // anti-spam
      } catch (err) {
        console.log(`[BROADCAST] Gagal dikirim ke grup: ${jid}`, err.message);
      }
    }
    console.log(`[BROADCAST] Selesai. Total terkirim: ${count} grup.`);
    return true;
  } catch (e) {
    console.error('[WA] Failed to fetch groups for broadcast:', e.message);
    return false;
  }
}

const WAZLE_TIPS = [
  // 1
  "💡 *WAZLE TIPS* 💡\n\nCoba ketik *!sambung kata* untuk bermain game sambung kata seru bersama anggota grup!",
  "💡 *WAZLE EVENT TIPS* 💡\n\nMasuk ke dunia RPG dengan mengetik *!wazle*! Kamu bisa berpindah lokasi dengan perintah *!wazle jalan <lokasi>*.",
  // 2
  "💡 *WAZLE TIPS* 💡\n\nKamu bisa mendapatkan koin dengan cepat! Ketik *!tambang auto* agar bot menambang otomatis selama beberapa jam ke depan. Jangan lupa *!feed* tambangnya ya!",
  "💡 *WAZLE EVENT TIPS* 💡\n\nSetiap jam, *!wazle pasar* akan merotasi stok barangnya. Sering-sering cek siapa tahu ada item langka yang dijual murah!",
  // 3
  "💡 *WAZLE TIPS* 💡\n\nPunya pertanyaan sulit atau tugas sekolah? Langsung aja tanyakan ke AI canggih kita dengan mengetik *!ask <pertanyaanmu>*.",
  "💡 *WAZLE EVENT TIPS* 💡\n\nAda 12 Tier Kelangkaan item di event Wazle! Tier 1 (Common) sampai Tier 12 (Singular) yang cuma ada SATU di dunia!",
  // 4
  "💡 *WAZLE TIPS* 💡\n\nButuh inspirasi gambar atau wallpaper? Ketik *!pin <kata kunci>* untuk mencari gambar kualitas tinggi langsung dari Pinterest!",
  "💡 *WAZLE EVENT TIPS* 💡\n\nBerani uji nyali? Jalanlah ke Gua Labirin lalu ketik *!wazle kiri* atau *!wazle kanan*. Awas ada jebakan panah beracun!",
  // 5
  "💡 *WAZLE TIPS* 💡\n\nMain *!sabungayam @user <taruhan>* bisa bikin kamu kaya mendadak atau justru miskin dadakan! Berani coba tantang temanmu?",
  "💡 *WAZLE EVENT TIPS* 💡\n\nSaat bepergian (berjalan), ada 40% peluang terkena *Random Encounter*! Bisa nemu harta, bisa juga kena copet!",
  // 6
  "💡 *WAZLE TIPS* 💡\n\nBot ini dilengkapi fitur edukasi! Coba ketik *!fakta* atau *!history* untuk menambah wawasanmu setiap harinya.",
  "💡 *WAZLE EVENT TIPS* 💡\n\nCek seluruh koleksi item dan makananmu dengan mengetik *!wazle tas*.",
  // 7
  "💡 *WAZLE TIPS* 💡\n\nJangan lupa mengecek jadwal sholat di kotamu dengan mengetik *!jadwalsholat <nama kota>*. Pastikan kamu tidak telat ibadah!",
  "💡 *WAZLE EVENT TIPS* 💡\n\nMakanan yang ada di tas bisa langsung memulihkan staminamu! Ketik *!wazle makan <nama_item>*.",
  // 8
  "💡 *WAZLE TIPS* 💡\n\nIngin tahu cuaca hari ini? Ketik *!cuaca <nama kota>* untuk mendapatkan laporan cuaca terkini dengan akurat.",
  "💡 *WAZLE EVENT TIPS* 💡\n\nButuh WP cepat? Jual saja barang langka yang kamu temukan di gua ke pasar dengan perintah *!wazle jual <nama_item>*.",
  // 9
  "💡 *WAZLE TIPS* 💡\n\nAdmin grup bisa menggunakan *!hidetag <pesan>* untuk memberikan pengumuman penting ke seluruh anggota grup tanpa terlihat nyepam tag!",
  "💡 *WAZLE EVENT TIPS* 💡\n\nStamina di event Wazle Play akan pulih perlahan sebesar 1 poin setiap 5 menit. Jangan terlalu diforsir!",
  // 10
  "💡 *WAZLE TIPS* 💡\n\nLagi penat? Coba tebak-tebakan seru! Ketik *!tebak bendera*, *!tebak logo*, atau *!tebak planet* untuk menguji pengetahuanmu.",
  "💡 *WAZLE EVENT TIPS* 💡\n\nKalau kamu luka terkena jebakan, HP bisa pulih perlahan, tapi lebih baik kamu cari makanan penyembuh di Pasar Fluktuatif.",
  // 11
  "💡 *WAZLE TIPS* 💡\n\nPecinta Anime wajib tahu! Kamu bisa mengecek rating dan sinopsis anime favoritmu dengan mengetik *!anime <judul>*.",
  "💡 *WAZLE EVENT TIPS* 💡\n\nSelalu ketik nama item secara lengkap saat transaksi! Contoh: *!wazle beli Roti Tawar Spesial*.",
  // 12
  "💡 *WAZLE TIPS* 💡\n\nKamu bisa mengecek posisi Stasiun Luar Angkasa Internasional (ISS) secara real-time dengan mengetik *!iss*! Keren kan?",
  "💡 *WAZLE EVENT TIPS* 💡\n\nAda item misterius yang tidak pernah dijual di pasar dan hanya bisa ditemukan di dasar Gua Labirin. Beranikah kamu mencarinya?",
  // 13
  "💡 *WAZLE TIPS* 💡\n\nSuka ngoleksi hewan peliharaan? Coba beli pet di *!toko*. Pet bisa menambah keberuntungan (Luck) saat kamu memancing atau menambang loh!",
  "💡 *WAZLE EVENT TIPS* 💡\n\nLebih dari 400 variasi makanan dan item unik tersebar di dunia Wazle. Kumpulkan semuanya di tasmu!",
  // 14
  "💡 *WAZLE TIPS* 💡\n\nKamu bisa mengubah teks menjadi suara (Voice Note) dengan bahasa berbagai negara! Coba ketik *!say id Halo semuanya*.",
  "💡 *WAZLE EVENT TIPS* 💡\n\nJangan bawa WP terlalu banyak saat bepergian! Kalau kamu dicegat begal, kamu bisa kehilangan 20% uangmu!",
  // 15
  "💡 *WAZLE TIPS* 💡\n\nSuka main game PC? Jangan sampai ketinggalan game gratis mingguan dari Epic Games! Ketik *!epicgames* untuk melihat daftarnya.",
  "💡 *WAZLE EVENT TIPS* 💡\n\nPusat kota (Balai Kota) adalah tempat paling aman dari monster dan begal. Istirahatlah di sana jika HP-mu tipis.",
  // 16
  "💡 *WAZLE TIPS* 💡\n\nLupa lirik lagu favoritmu? Langsung aja ketik *!lirik <judul lagu>* dan bot akan mencarikan lirik lengkapnya untukmu!",
  "💡 *WAZLE EVENT TIPS* 💡\n\nItem ber-Tier 'Ancient' ke atas memiliki aura luar biasa. Jangan sembarangan menjualnya, harganya bisa melambung tinggi!",
  // 17
  "💡 *WAZLE TIPS* 💡\n\nMau stalker profil GitHub seseorang tanpa buka browser? Ketik *!github <username>* untuk melihat statistik repositori mereka.",
  "💡 *WAZLE EVENT TIPS* 💡\n\nHati-hati dengan Pengemis Tua di jalan. Dia bisa saja pencopet, atau justru Dewa yang sedang menyamar!",
  // 18
  "💡 *WAZLE TIPS* 💡\n\nPenasaran sama tampilan sebuah website tapi takut kena phising? Ketik *!ssweb <url web>* biar bot yang tolong screenshot-in secara aman!",
  "💡 *WAZLE EVENT TIPS* 💡\n\nPabrik Saham dan Stasiun Ekspedisi sedang dibangun oleh para Arsitek Wazle. Tunggu fitur barunya segera!",
  // 19
  "💡 *WAZLE TIPS* 💡\n\nAnak Valorant wajib tahu! Kamu bisa memamerkan pangkat dan level akunmu dengan mengetik *!valorant <Nama>#<Tag>*.",
  "💡 *WAZLE EVENT TIPS* 💡\n\nBagikan item kepada teman-temanmu... (fitur barter coming soon!). Mainkan *!wazle* setiap hari untuk menguasai dunia!"
];

async function broadcastTip(tipIndex) {
  if (!masterSession.socket || masterSession.status !== 'CONNECTED') {
    return false;
  }
  try {
    const tipMessage = WAZLE_TIPS[tipIndex % WAZLE_TIPS.length];
    const clients = datacache.getAllClients();
    const targetJids = new Set();
    
    for (const c of clients) {
      // Only send to Active or Warning accounts
      if (c.Account_Status === 'Active' || c.Account_Status === 'Warning') {
        for (let i = 1; i <= 5; i++) {
          const jid = c[`GroupJID_${i}`];
          if (jid && jid.includes('@g.us')) {
            targetJids.add(jid);
          }
        }
      }
    }

    let count = 0;
    for (const jid of targetJids) {
      try {
        await masterSession.socket.sendMessage(jid, { text: tipMessage });
        count++;
        await new Promise(r => setTimeout(r, 1000)); // anti-spam
      } catch (err) {}
    }
    console.log(`[TIPS] Broadcast dikirim ke ${count} grup resmi terdaftar.`);
    return true;
  } catch (e) {
    console.error('[TIPS] Gagal mengirim tips:', e.message);
    return false;
  }
}

/**
 * Dipanggil dari HTTP endpoint saat user save group link baru lewat web panel.
 * Langsung resolve dan simpan JID ke database.
 */
async function onGroupLinkUpdated(userId, groupIndex, inviteLink) {
  if (!masterSession.socket || masterSession.status !== 'CONNECTED') return null;
  const jid = await resolveAndSaveGroupJid(masterSession.socket, userId, groupIndex, inviteLink);
  
  if (jid) {
    const code = extractInviteCode(inviteLink);
    if (code) {
      try {
        await masterSession.socket.groupAcceptInvite(code);
        console.log(`[WA] Master Bot joined group ${jid} automatically.`);
        
        // Kirim pesan "Pong" / sapaan otomatis setelah berhasil join
        await masterSession.socket.sendMessage(jid, { 
          text: `Pong` 
        });
      } catch (e) {
        console.error(`[WA] Gagal auto-join/send ke grup ${jid}:`, e.message);
      }
    }
  }
  return jid;
}

/**
 * Resolves JID from a given WhatsApp invite link.
 */
async function resolveJidFromLink(inviteLink) {
  if (!masterSession.socket || masterSession.status !== 'CONNECTED') return null;
  const match = inviteLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{15,30})/);
  const code = match ? match[1] : null;
  if (!code) return null;
  try {
    const inviteInfo = await masterSession.socket.groupGetInviteInfo(code);
    return inviteInfo.id;
  } catch (e) {
    return null;
  }
}

module.exports = {
  startMasterSession,
  stopMasterSession,
  getMasterSessionStatus,
  getMasterQr,
  sendMasterMessage,
  broadcastMasterMessage,
  broadcastTip,
  onGroupLinkUpdated,
  resolveJidFromLink,
  getResolvedGroupsMap: () => {
    // Untuk debug: return JIDs dari cache
    const map = {};
    const clients = datacache.getAllClients();
    for (const c of clients) {
      map[c.User_ID] = {};
      for (let i = 1; i <= 5; i++) {
        if (c[`GroupJID_${i}`]) map[c.User_ID][i] = c[`GroupJID_${i}`];
      }
    }
    return map;
  }
};
