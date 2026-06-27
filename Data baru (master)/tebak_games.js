const tebakData = require('./tebak_data.js');
const { fetchBotcahx } = require('./botcahx_api');
const tebakGames = new Map(); // Store game state by remoteJid

const VALID_LOCAL = ['negara', 'bendera', 'landmark', 'kucing', 'anjing', 'planet', 'game', 'logo'];
const VALID_API = ['meme', 'epep', 'anime', 'math', 'kuismerdeka', 'drakor', 'namatokoh', 'presiden', 'pemainbola', 'wallet', 'kode', 'makanan', 'pokemon', 'gambar', 'jkt48', 'genshin', 'emoji', 'kuisislami', 'fisika', 'singkatan', 'buah', 'clubbola', 'hewan', 'pop', 'heromlbb', 'tempat', 'tebakan', 'chara', 'kabupaten', 'lirik', 'kimia', 'jenaka', 'kata', 'kalimat', 'asahotak', 'siapakahaku', 'susunkata', 'family100', 'lagu', 'tekateki'];
const VALID_TEBAK = [...VALID_LOCAL, ...VALID_API];

async function handleTebakCommand(socket, remoteJid, senderNumber, pushName, msg, category, subcommand, startCountdownLobbyFn) {
  // Fix inverted arguments like "!tebak join epep"
  if (category === 'join' || category === 'start') {
    const temp = category;
    category = subcommand;
    subcommand = temp;
  }

  if (!VALID_TEBAK.includes(category)) {
    if (category) {
      await socket.sendMessage(remoteJid, { text: `❌ Kategori tebak '${category}' tidak ditemukan. Ketik !menu play untuk melihat daftar.` }, { quoted: msg });
    }
    return;
  }

  if (!subcommand) {
    if (tebakGames.has(remoteJid)) {
      await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nSelesaikan tebakan yang sedang berjalan terlebih dahulu!' }, { quoted: msg });
      return;
    }

    let randomItem = null;

    if (VALID_LOCAL.includes(category)) {
      const dataList = tebakData[category];
      if (!dataList || dataList.length === 0) {
        await socket.sendMessage(remoteJid, { text: `⚠️ Data untuk tebak ${category} belum tersedia.` }, { quoted: msg });
        return;
      }
      randomItem = dataList[Math.floor(Math.random() * dataList.length)];
    } else {
      try {
        const fetchMsg = await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\n🔍 Menyiapkan kuis dari server...' }, { quoted: msg });
        
        let endpointCat = category;
        if (category === 'kuismerdeka') endpointCat = 'merdeka';
        else if (category === 'namatokoh') endpointCat = 'tokoh';
        // Botcahx format for endpoints usually: /api/game/tebakmeme or /api/game/meme
        // Most are /api/game/tebak{name}
        const dataApi = await fetchBotcahx(`/api/game/tebak${endpointCat}`);
        
        await socket.sendMessage(remoteJid, { delete: fetchMsg.key }).catch(() => {});
        
        const answerRaw = dataApi.jawaban || dataApi.Jawaban || dataApi.answer || "";
        const imgRaw = dataApi.img || dataApi.Img || dataApi.image || null;
        const hintRaw = dataApi.hint || dataApi.Hint || dataApi.deskripsi || dataApi.Deskripsi || dataApi.pertanyaan || dataApi.soal || "";

        if (!answerRaw) {
          throw new Error('Data game tidak lengkap (jawaban kosong)');
        }

        randomItem = {
          answer: answerRaw.toString(),
          image: imgRaw ? imgRaw.toString() : null,
          hint: hintRaw.toString()
        };
      } catch (err) {
        console.error(`[WA] Gagal fetch API Tebak ${category}:`, err.message);
        await socket.sendMessage(remoteJid, { text: `━━━━━━━ ⟡ ━━━━━━━\n❌ Gagal mengambil data game ${category} dari server.` }, { quoted: msg });
        return;
      }
    }

    const economymanager = require('./economymanager.js');
    let finalName = pushName;
    if (!pushName || !isNaN(pushName)) {
      const userEco = economymanager.getUserData(senderNumber);
      if (userEco && userEco.name && isNaN(userEco.name)) finalName = userEco.name;
      else finalName = socket.user?.name || "Player";
    }

    tebakGames.set(remoteJid, {
      category,
      answer: randomItem.answer.toLowerCase(),
      image: randomItem.image,
      hint: randomItem.hint,
      players: [{ id: senderNumber, name: finalName }],
      status: 'waiting',
      creator: senderNumber,
      timeoutId: null
    });

    let tText = `━━━━━━━ ⟡ ━━━━━━━\n\nRoom *Tebak ${category.toUpperCase()}* dibuat!\n\n*Pemain:*\n1. *${finalName}*\n\n_Ketik *!tebak ${category} join* untuk ikut!_\n_Game otomatis dimulai jika ada 2 pemain atau ketik *!tebak ${category} start*._`;
    await socket.sendMessage(remoteJid, { text: tText }, { quoted: msg });
    return;
  }

  if (subcommand === 'join') {
    const game = tebakGames.get(remoteJid);
    if (!game || game.category !== category) {
      await socket.sendMessage(remoteJid, { text: `❌ Belum ada room Tebak ${category} yang aktif. Ketik !tebak ${category} untuk membuat room.` }, { quoted: msg });
      return;
    }
    if (game.status !== 'waiting') {
      await socket.sendMessage(remoteJid, { text: `❌ Permainan sudah dimulai!` }, { quoted: msg });
      return;
    }
    if (game.players.find(p => p.id === senderNumber)) {
      await socket.sendMessage(remoteJid, { text: `❌ Kamu sudah join di room ini!` }, { quoted: msg });
      return;
    }

    const economymanager = require('./economymanager.js');
    let finalName = pushName;
    if (!pushName || !isNaN(pushName)) {
      const userEco = economymanager.getUserData(senderNumber);
      if (userEco && userEco.name && isNaN(userEco.name)) finalName = userEco.name;
      else finalName = socket.user?.name || "Player";
    }

    game.players.push({ id: senderNumber, name: finalName });
    
    let pList = game.players.map((p, i) => `${i+1}. *${p.name}*`).join('\n');
    let tText = `━━━━━━━ ⟡ ━━━━━━━\n\n*${finalName}* bergabung!\n\n*Pemain:*\n${pList}\n\n_Ketik *!tebak ${category} join* untuk ikut!_\n_Ketik *!tebak ${category} start* untuk memulai._`;
    await socket.sendMessage(remoteJid, { text: tText }, { quoted: msg });

    if (game.players.length >= 2) {
      game.status = 'starting';
      if (startCountdownLobbyFn) startCountdownLobbyFn();
    }
    return;
  }

  if (subcommand === 'start') {
    const game = tebakGames.get(remoteJid);
    if (!game || game.category !== category) {
      await socket.sendMessage(remoteJid, { text: `❌ Belum ada room Tebak ${category} yang aktif.` }, { quoted: msg });
      return;
    }
    if (game.status !== 'waiting') return;
    if (game.creator !== senderNumber) {
      await socket.sendMessage(remoteJid, { text: `❌ Hanya pembuat room yang bisa memulai secara manual!` }, { quoted: msg });
      return;
    }

    game.status = 'starting';
    if (startCountdownLobbyFn) startCountdownLobbyFn();
    return;
  }
}

async function startTebakGame(socket, remoteJid, msg, isZeinaJoin = false) {
  const game = tebakGames.get(remoteJid);
  if (!game) return;

  game.status = 'playing';
  
  game.timeoutId = setTimeout(async () => {
    if (tebakGames.has(remoteJid)) {
      const current = tebakGames.get(remoteJid);
      tebakGames.delete(remoteJid);
      await socket.sendMessage(remoteJid, { text: `⏰ Waktu habis! Jawaban yang benar adalah: *${current.answer.toUpperCase()}*` });
    }
  }, 30000); // 30 seconds

  let caption = `══〔 🎭 TEBAK ${game.category.toUpperCase()} 〕══\n\nSilakan tebak!\n_Waktu: 30 detik_`;
  if (game.hint) {
    caption += `\n\n💡 Petunjuk / Soal: ${game.hint}`;
  }

  let sentMsg;
  if (game.image && game.image.startsWith('http')) {
    sentMsg = await socket.sendMessage(remoteJid, { image: { url: game.image }, caption });
  } else {
    sentMsg = await socket.sendMessage(remoteJid, { text: caption });
  }

  if (isZeinaJoin) {
    const ownerId = socket.user.id.split(':')[0] + '@s.whatsapp.net';
    setTimeout(async () => {
      try {
        const yay_engine = require('./yay_engine');
        const { text: zText, isCorrect } = await yay_engine.playTebakUmumZeina(ownerId, remoteJid, game.category, game.hint, game.answer);
        await socket.sendMessage(remoteJid, { text: zText }, { quoted: sentMsg });
        
        // Simulasikan handleTebakReply
        if (isCorrect) {
           await handleTebakReply(socket, remoteJid, 'zeina@s.whatsapp.net', 'Zeina (AI)', game.answer, sentMsg, null);
        }
      } catch(e) {
        console.log("[Zeina] Error play tebak umum:", e);
      }
    }, Math.floor(Math.random() * 5000) + 5000); // 5-10 detik delay
  }
}

async function handleTebakReply(socket, remoteJid, senderNumber, pushName, text, msg, economy) {
  if (!tebakGames.has(remoteJid)) return false;

  const game = tebakGames.get(remoteJid);
  if (game.status !== 'playing') return false;

  // Hanya pemain yang terdaftar yang bisa menebak
  if (!game.players.find(p => p.id === senderNumber)) {
    return false; // Abaikan chat dari orang yang tidak ikut room
  }

  const userGuess = text.trim().toLowerCase();

  if (userGuess === game.answer) {
    clearTimeout(game.timeoutId);
    tebakGames.delete(remoteJid);

    // Reward
    const rewardWM = 50;
    
    // Attempt to give reward if economy module is passed
    if (economy && economy.addWallet) {
      economy.addWallet(senderNumber, rewardWM);
    }

    await socket.sendMessage(remoteJid, { text: `✅ *BENAR!*\n\nSelamat ${pushName || senderNumber.split('@')[0]}, jawaban kamu benar: *${game.answer.toUpperCase()}*\nKamu mendapatkan hadiah +${rewardWM} WM!` }, { quoted: msg });
    return true; // handled
  }

  return false;
}

module.exports = {
  handleTebakCommand,
  handleTebakReply,
  startTebakGame,
  tebakGames
};
