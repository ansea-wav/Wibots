const fs = require('fs');
const path = require('path');
const weremafiabot = require('./weremafia_bot');

/**
 * Weremafia Game Engine
 */

const TIME_DISCUSSION = 120000; 
const TIME_NIGHT = 120000;      
const TIME_TRANSITION = 5000;   

class WeremafiaEngine {
  constructor() {
    this.games = {}; 
    weremafiabot.setWeremafiaEngine(this);
    this.masterSendFunc = null; 
    this.masterDeleteFunc = null;
  }

  setMasterSendFunc(func) {
    this.masterSendFunc = func;
  }

  setMasterDeleteFunc(func) {
    this.masterDeleteFunc = func;
  }

  async interceptGroupMessage(groupId, senderId, senderName, text, msg, deductCallback) {
    const game = this.games[groupId];
    if (!game) return false; 

    // Guard: text bisa undefined/null jika pesan berupa media, stiker, reaksi, dll.
    if (typeof text !== 'string') return false;

    const isCommand = text.startsWith('!');


    // 1. Cek Orang Mati
    if (['day', 'night', 'voting', 'starting', 'day_transition', 'night_transition'].includes(game.state)) {
      if (game.players[senderId] && !game.players[senderId].alive) {
        if (this.masterDeleteFunc) await this.masterDeleteFunc(groupId, msg.key);
        await this.sendGroup(groupId, `Orang mati dilarang berbicara | Denda -1000 WM`, { quoted: msg });
        if (deductCallback) await deductCallback(senderId.split('@')[0], 1000);
        return true; 
      }
    }

    // 2. Blokir Command Lain
    if (isCommand && !text.startsWith('!wm') && !text.startsWith('!pilih')) {
      if (this.masterDeleteFunc) await this.masterDeleteFunc(groupId, msg.key);
      if (game.players[senderId]) {
        await this.sendGroup(groupId, `Fokus pada permainan atau ketik !wm out untuk keluar.`, { mentions: [senderId] });
      } else {
        await this.sendGroup(groupId, `Permainan sedang berlangsung. Ketik !wm join untuk bergabung.`, { mentions: [senderId] });
      }
      return true;
    }

    return false;
  }

  async handleGroupCommand(groupId, senderId, senderName, command, args, msg) {
    if (!this.games[groupId]) {
      this.games[groupId] = {
        state: 'idle', 
        players: {}, 
        playerList: [], 
        dayCount: 0,
        hostId: null,
        nightActions: {}, 
        dayVotes: {},
        pinnedMsgKey: null,
        timer: null,
        stats: { deadCount: 0, rightVotes: 0, wrongVotes: 0, mvpPoints: {} }
      };
    }

    const game = this.games[groupId];

    if (command === 'room') {
      if (game.state !== 'idle') return this.sendGroup(groupId, '❌ Sudah ada lobi atau game berjalan di grup ini!');
      game.state = 'lobby';
      game.hostId = senderId;
      game.players[senderId] = { id: senderId, name: senderName, role: null, alive: true };
      game.playerList.push(senderId);
      
      const txt = `══〔 🏛️ LOBI KOTA 〕══\n\nHost    : ${senderName}\nPemain  : ${game.playerList.length}/12\n\n• ${senderName}\n\n════════════════\nKetik !wm join untuk bergabung.\nHost dapat memulai dengan !wm start.\n════════════════`;
      const sentMsg = await this.sendGroup(groupId, txt, { mentions: [senderId] });
      if (sentMsg) {
        game.pinnedMsgKey = sentMsg.key;
        // Note: keepInChat via sendMessage is not supported in this Baileys version, skip silently.
      }
      return;

    }

    if (command === 'join') {
      if (game.state !== 'lobby') return this.sendGroup(groupId, '❌ Lobi Weremafia belum dibuka.');
      if (game.players[senderId]) return this.sendGroup(groupId, '❌ Kamu sudah ada di dalam lobi.', { quoted: msg });
      
      game.players[senderId] = { id: senderId, name: senderName, role: null, alive: true };
      game.playerList.push(senderId);
      
      let pList = '';
      game.playerList.forEach(pid => pList += `• ${game.players[pid].name}\n`);
      const txt = `══〔 🏛️ LOBI KOTA 〕══\n\nHost    : ${game.players[game.hostId].name}\nPemain  : ${game.playerList.length}/12\n\n${pList}\n════════════════\nKetik !wm join untuk bergabung.\nHost dapat memulai dengan !wm start.\n════════════════`;
      return this.sendGroup(groupId, txt, { mentions: game.playerList });
    }

    if (command === 'out') {
      if (game.state !== 'lobby') return this.sendGroup(groupId, '❌ Game sudah dimulai!');
      if (!game.players[senderId]) return this.sendGroup(groupId, '❌ Kamu belum join lobi.');
      
      delete game.players[senderId];
      game.playerList = game.playerList.filter(id => id !== senderId);
      
      if (game.playerList.length === 0) {
        await this.sendGroup(groupId, `Semua pemain keluar. Lobi dibatalkan.`);
        delete this.games[groupId];
        return;
      }

      let pList = '';
      game.playerList.forEach(pid => pList += `• ${game.players[pid].name}\n`);
      const txt = `══〔 🏛️ LOBI KOTA 〕══\n\nHost    : ${game.players[game.hostId].name}\nPemain  : ${game.playerList.length}/12\n\n${pList}\n════════════════\nKetik !wm join untuk bergabung.\nHost dapat memulai dengan !wm start.\n════════════════`;
      return this.sendGroup(groupId, txt, { mentions: game.playerList });
    }

    if (command === 'start') {
      if (game.state !== 'lobby') return this.sendGroup(groupId, '❌ Tidak ada lobi terbuka.');
      if (senderId !== game.hostId) return this.sendGroup(groupId, '❌ Hanya Host yang bisa memulai game!');
      if (game.playerList.length < 3) return this.sendGroup(groupId, `❌ Minimal 3 pemain. (Saat ini: ${game.playerList.length})`);

      await this.startGame(groupId, game);
    }
  }

  async startGame(groupId, game) {
    game.state = 'starting';
    game.pinnedMsgKey = null;

    const txt = `══〔 🩸 WEREMAFIA 〕══\n\nPermainan dimulai.\n\nSilakan cek pesan masuk dari\nBot Weremafia untuk melihat peranmu.\n\n════════════════`;
    await this.sendGroup(groupId, txt);
    
    const roles = this.generateRoles(game.playerList.length);
    for (let i=0; i<game.playerList.length; i++) {
      game.players[game.playerList[i]].role = roles[i];
      game.stats.mvpPoints[game.playerList[i]] = 0;
    }

    for (const pid of game.playerList) {
      const p = game.players[pid];
      const pmMsg = `══〔 🎭 PERAN KAMU 〕══\n\nKamu adalah *${p.role}*!\n\n${this.getRoleDescription(p.role)}\n\n════════════════`;
      await weremafiabot.sendWeremafiaMessage(pid, { text: pmMsg });
    }

    setTimeout(() => {
      this.startNight(groupId, game);
    }, 5000);
  }

  async startNight(groupId, game) {
    game.state = 'night_transition';
    game.dayCount++;
    game.nightActions = {}; 
    
    const gifs = ['transisi.gif', 'transisi-a.gif', 'transisi-k.gif', 'transisi-s.gif'];
    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
    const nightPath = path.join(process.cwd(), 'assets', 'weremafia', randomGif);
    
    const captionTxt = `══〔 🌙 MALAM KE-${game.dayCount} 〕══\n\nLampu kota mulai padam.\n\nWarga tertidur...\nNamun seseorang masih berkeliaran\ndalam gelap.\n\n════════════════\nPeran malam, silakan cek PM.\n════════════════`;
    
    let transitionMedia = null;
    if (fs.existsSync(nightPath)) {
      transitionMedia = { video: fs.readFileSync(nightPath), gifPlayback: true, caption: captionTxt };
    } else {
      transitionMedia = { text: captionTxt };
    }
    await this.sendGroup(groupId, transitionMedia);

    setTimeout(async () => {
      game.state = 'night';
      const alivePlayers = game.playerList.filter(id => game.players[id].alive);
      let menuStr = `\n\n*Pilih targetmu:*\n`;
      alivePlayers.forEach((pid, index) => {
        menuStr += `${index + 1}. @${game.players[pid].name}\n`;
      });
      menuStr += `\n════════════════\nBalas PM:\n!pilih <nomor>\n════════════════`;

      for (const pid of alivePlayers) {
        const p = game.players[pid];
        let title = '';
        if (['Mafia', 'Don'].includes(p.role)) title = '🔫 AKSI MAFIA';
        else if (['Dokter', 'Bodyguard'].includes(p.role)) title = '💉 AKSI MEDIS';
        else if (p.role === 'Detektif') title = '🕵️ AKSI INVESTIGASI';
        else if (p.role === 'Maniac') title = '🔪 AKSI MANIAC';

        if (title) {
          await weremafiabot.sendWeremafiaMessage(pid, { text: `══〔 ${title} 〕══` + menuStr });
        }
      }

      game.timer = setTimeout(() => {
        this.processNightResults(groupId, game);
      }, TIME_NIGHT);
    }, TIME_TRANSITION);
  }

  checkAllNightActions(groupId, game) {
    const nightRolesCount = game.playerList.filter(id => {
      const r = game.players[id].role;
      return game.players[id].alive && ['Mafia', 'Don', 'Dokter', 'Bodyguard', 'Detektif', 'Maniac'].includes(r);
    }).length;
    
    if (Object.keys(game.nightActions).length >= nightRolesCount) {
      if (game.timer) clearTimeout(game.timer);
      setTimeout(() => {
        this.processNightResults(groupId, game);
      }, 5000);
    }
  }

  async processNightResults(groupId, game) {
    game.state = 'processing';
    let killedByMafia = game.nightActions['Mafia'];
    let killedByManiac = game.nightActions['Maniac'];
    let protectedByDoctor = game.nightActions['Dokter'];
    let investigatedByDetektif = game.nightActions['Detektif'];

    let deathAnnouncements = [];

    if (killedByMafia && killedByMafia !== protectedByDoctor) {
      game.players[killedByMafia].alive = false;
      game.stats.deadCount++;
      deathAnnouncements.push(`💀 @${game.players[killedByMafia].name} ditemukan tak bernyawa.\nPeran : ${game.players[killedByMafia].role}`);
      // Mafia gets MVP point
      for (const pid of game.playerList) if (['Mafia', 'Don'].includes(game.players[pid].role)) game.stats.mvpPoints[pid] += 2;
    }

    if (killedByManiac && killedByManiac !== killedByMafia && killedByManiac !== protectedByDoctor) {
      game.players[killedByManiac].alive = false;
      game.stats.deadCount++;
      deathAnnouncements.push(`💀 @${game.players[killedByManiac].name} menjadi korban pembunuhan berantai.\nPeran : ${game.players[killedByManiac].role}`);
      game.stats.mvpPoints[Object.keys(game.players).find(k => game.players[k].role==='Maniac')] += 3;
    }

    if (protectedByDoctor && (protectedByDoctor === killedByMafia || protectedByDoctor === killedByManiac)) {
      // Doctor gets MVP points
      const doc = Object.keys(game.players).find(k => game.players[k].role==='Dokter');
      if (doc) game.stats.mvpPoints[doc] += 3;
    }

    if (investigatedByDetektif) {
      const targetRole = game.players[investigatedByDetektif].role;
      const isBad = ['Mafia', 'Don', 'Maniac', 'Arsonist'].includes(targetRole) && targetRole !== 'Godfather';
      const detektifId = Object.keys(game.players).find(k => game.players[k].role === 'Detektif' && game.players[k].alive);
      if (detektifId) {
        await weremafiabot.sendWeremafiaMessage(detektifId, { text: `══〔 🕵️ HASIL INVESTIGASI 〕══\n\nTargetmu (@${game.players[investigatedByDetektif].name}) adalah kubu:\n*${isBad ? 'JAHAT' : 'BAIK'}*\n\n════════════════` });
        if (isBad) game.stats.mvpPoints[detektifId] += 2;
      }
    }

    await this.startDay(groupId, game, deathAnnouncements);
  }

  async startDay(groupId, game, deathAnnouncements) {
    game.state = 'day_transition';
    
    const gifs = ['transisi.gif', 'transisi-a.gif', 'transisi-k.gif', 'transisi-s.gif'];
    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
    const dayPath = path.join(process.cwd(), 'assets', 'weremafia', randomGif);
    
    let captionTxt = `══〔 ☀️ PAGI KE-${game.dayCount} 〕══\n\n`;
    if (deathAnnouncements && deathAnnouncements.length > 0) {
      captionTxt += deathAnnouncements.join('\n\n') + `\n\n════════════════\n🗣️ Diskusi dimulai\nWaktu : 2 Menit\n════════════════`;
    } else {
      captionTxt += `🕊️ Malam yang damai.\nTidak ada korban yang jatuh.\n\n════════════════\n🗣️ Diskusi dimulai\nWaktu : 2 Menit\n════════════════`;
    }

    let transitionMedia = null;
    if (fs.existsSync(dayPath)) {
      transitionMedia = { video: fs.readFileSync(dayPath), gifPlayback: true, caption: captionTxt };
    } else {
      transitionMedia = { text: captionTxt };
    }
    
    // Extracted mentions from announcements
    const deadMentions = [];
    if (deathAnnouncements && deathAnnouncements.length > 0) {
      for (const p of game.playerList) {
        if (!game.players[p].alive) deadMentions.push(p);
      }
    }
    await this.sendGroup(groupId, transitionMedia, { mentions: deadMentions });

    setTimeout(async () => {
      game.state = 'day';
      const winner = this.checkWinCondition(game);
      if (winner) return this.endGame(groupId, game, winner);

      game.timer = setTimeout(() => {
        this.startVoting(groupId, game);
      }, TIME_DISCUSSION);
    }, TIME_TRANSITION);
  }

  async startVoting(groupId, game) {
    game.state = 'voting';
    game.dayVotes = {};

    await this.sendGroup(groupId, `══〔 ⚖️ SIDANG KOTA 〕══\n\nDiskusi telah berakhir.\nSilakan cek PM Anda untuk\nmemberikan suara hukuman gantung.\n\n════════════════`);

    const alivePlayers = game.playerList.filter(id => game.players[id].alive);
    let menuStr = `\n\nSiapa yang ingin dihukum?\n\n`;
    alivePlayers.forEach((pid, index) => {
      menuStr += `${index + 1}. @${game.players[pid].name}\n`;
    });
    menuStr += `${alivePlayers.length + 1}. 🕊️ Skip\n\n════════════════\nBalas PM:\n!pilih <nomor>\n════════════════`;

    for (const pid of alivePlayers) {
      await weremafiabot.sendWeremafiaMessage(pid, { text: `══〔 ⚖️ SIDANG KOTA 〕══` + menuStr });
    }

    game.timer = setTimeout(() => {
      this.processVotingResults(groupId, game);
    }, TIME_DISCUSSION); 
  }

  checkAllVoted(groupId, game) {
    const aliveCount = game.playerList.filter(id => game.players[id].alive).length;
    if (Object.keys(game.dayVotes).length >= aliveCount) {
      if (game.timer) clearTimeout(game.timer);
      setTimeout(() => {
        this.processVotingResults(groupId, game);
      }, 5000);
    }
  }

  async processVotingResults(groupId, game) {
    game.state = 'processing';
    const alivePlayers = game.playerList.filter(id => game.players[id].alive);
    const votes = {};
    alivePlayers.forEach(pid => votes[pid] = 0);
    votes['skip'] = 0;

    for (const voterId in game.dayVotes) {
      const targetId = game.dayVotes[voterId];
      if (votes[targetId] !== undefined) votes[targetId]++;
    }

    let highestVote = 0;
    let candidates = [];
    
    for (const targetId in votes) {
      if (votes[targetId] > highestVote) {
        highestVote = votes[targetId];
        candidates = [targetId];
      } else if (votes[targetId] === highestVote) {
        candidates.push(targetId);
      }
    }

    if (candidates.length === 1 && candidates[0] !== 'skip' && highestVote > 0) {
      const lynchedId = candidates[0];
      game.players[lynchedId].alive = false;
      game.stats.deadCount++;
      const isBad = ['Mafia', 'Don', 'Maniac', 'Arsonist'].includes(game.players[lynchedId].role);
      
      // Update stats based on if town lynched a bad guy
      for (const voterId in game.dayVotes) {
        if (game.dayVotes[voterId] === lynchedId) {
          if (isBad) { game.stats.rightVotes++; game.stats.mvpPoints[voterId] += 2; }
          else { game.stats.wrongVotes++; }
        }
      }

      await this.sendGroup(groupId, `══〔 🪢 HUKUMAN 〕══\n\nDengan ${highestVote} suara,\n@${game.players[lynchedId].name} dinyatakan bersalah.\n\n🎭 Peran : ${game.players[lynchedId].role}\n\n════════════════\n"Kepercayaan yang salah\ndapat membunuh kota."\n════════════════`, { mentions: [lynchedId] });
    } else {
      await this.sendGroup(groupId, `══〔 🪢 HUKUMAN 〕══\n\nKeputusan seri atau batal (Skip).\nTidak ada yang dieksekusi hari ini.\n\n════════════════`);
    }

    const winner = this.checkWinCondition(game);
    if (winner) return this.endGame(groupId, game, winner);

    setTimeout(() => {
      this.startNight(groupId, game);
    }, 5000);
  }

  checkWinCondition(game) {
    const alive = game.playerList.filter(id => game.players[id].alive);
    const mafiaCount = alive.filter(id => ['Mafia', 'Don', 'Consigliere', 'Godfather'].includes(game.players[id].role)).length;
    const maniacCount = alive.filter(id => game.players[id].role === 'Maniac').length;
    const townCount = alive.length - mafiaCount - maniacCount;

    if (maniacCount > 0 && alive.length === 1) return 'Maniac';
    if (mafiaCount === 0 && maniacCount === 0) return 'Townies';
    if (mafiaCount >= townCount + maniacCount) return 'Mafia';
    return null;
  }

  async endGame(groupId, game, winner) {
    let winnerText = winner === 'Townies' ? 'WARGA MENANG' : (winner === 'Mafia' ? 'MAFIA MENANG' : 'MANIAC MENANG');
    
    let mvpId = game.playerList[0];
    let maxPts = -1;
    for (const pid of game.playerList) {
      if (game.stats.mvpPoints[pid] > maxPts) {
        maxPts = game.stats.mvpPoints[pid];
        mvpId = pid;
      }
    }

    let msg = `══〔 🏆 HASIL AKHIR 〕══\n\n✨ ${winnerText} ✨\n\n════════════════\n📊 Statistik\n\nMalam        : ${game.dayCount}\nKorban       : ${game.stats.deadCount}\nVote Benar   : ${game.stats.rightVotes}\nVote Salah   : ${game.stats.wrongVotes}\n\n👑 MVP\n@${game.players[mvpId].name}\n════════════════\nTerima kasih telah bermain.\n════════════════`;
    
    await this.sendGroup(groupId, msg, { mentions: [mvpId] });
    delete this.games[groupId];
  }

  async handlePrivateMessage(senderNumber, text, msg) {
    const jid = `${senderNumber}@s.whatsapp.net`;
    let activeGroupId = null;
    let activeGame = null;

    for (const gId in this.games) {
      if (this.games[gId].players[jid] && this.games[gId].players[jid].alive) {
        activeGroupId = gId;
        activeGame = this.games[gId];
        break;
      }
    }

    if (!activeGame) return;

    if (text.toLowerCase().startsWith('!pilih')) {
      const args = text.split(' ');
      const nomor = parseInt(args[1]);
      if (isNaN(nomor)) return weremafiabot.sendWeremafiaMessage(jid, { text: 'Format salah! Ketik !pilih (spasi) angka. Contoh: !pilih 2' });

      const alivePlayers = activeGame.playerList.filter(id => activeGame.players[id].alive);
      let targetId = null;

      if (activeGame.state === 'voting') {
        if (nomor === alivePlayers.length + 1) targetId = 'skip';
        else if (nomor > 0 && nomor <= alivePlayers.length) targetId = alivePlayers[nomor - 1];
      } else if (activeGame.state === 'night') {
        if (nomor > 0 && nomor <= alivePlayers.length) targetId = alivePlayers[nomor - 1];
      }

      if (!targetId) return weremafiabot.sendWeremafiaMessage(jid, { text: 'Nomor tidak valid.' });

      if (activeGame.state === 'voting') {
        activeGame.dayVotes[jid] = targetId;
        const targetName = targetId === 'skip' ? 'Skip' : activeGame.players[targetId].name;
        await weremafiabot.sendWeremafiaMessage(jid, { text: `✅ Pilihanmu (*${targetName}*) dikunci.` });
        this.checkAllVoted(activeGroupId, activeGame);
        return;
      }

      if (activeGame.state === 'night') {
        const myRole = activeGame.players[jid].role;
        if (['Mafia', 'Don'].includes(myRole)) activeGame.nightActions['Mafia'] = targetId;
        else if (['Dokter', 'Bodyguard'].includes(myRole)) activeGame.nightActions['Dokter'] = targetId;
        else if (['Detektif'].includes(myRole)) activeGame.nightActions['Detektif'] = targetId;
        else if (['Maniac'].includes(myRole)) activeGame.nightActions['Maniac'] = targetId;

        await weremafiabot.sendWeremafiaMessage(jid, { text: `✅ Targetmu dikunci.` });
        this.checkAllNightActions(activeGroupId, activeGame);
        return;
      }
    }
  }

  async sendGroup(groupId, content, options = {}) {
    if (this.masterSendFunc) {
      if (typeof content === 'string') {
        return await this.masterSendFunc(groupId, { text: content, ...options });
      } else {
        return await this.masterSendFunc(groupId, { ...content, ...options });
      }
    }
  }

  generateRoles(playerCount) {
    let roles = [];
    if (playerCount <= 4) roles = ['Mafia', 'Dokter']; 
    else if (playerCount <= 5) roles = ['Mafia', 'Detektif', 'Dokter'];
    else if (playerCount <= 8) roles = ['Mafia', 'Mafia', 'Detektif', 'Dokter', 'Maniac'];
    else roles = ['Don', 'Mafia', 'Detektif', 'Dokter', 'Maniac', 'Sersan'];
    
    while (roles.length < playerCount) roles.push('Townie');
    return roles.sort(() => Math.random() - 0.5);
  }

  getRoleDescription(roleName) {
    if (roleName === 'Mafia' || roleName === 'Don') return "Tugasmu membunuh Warga secara diam-diam.";
    if (roleName === 'Detektif') return "Tugasmu memeriksa 1 orang tiap malam untuk mencari Mafia.";
    if (roleName === 'Dokter') return "Tugasmu menyembuhkan 1 orang tiap malam agar tidak terbunuh.";
    if (roleName === 'Maniac') return "Tugasmu membantai semua orang dan bertahan hingga akhir.";
    return "Tugasmu bertahan hidup dan menemukan siapa Mafia.";
  }
}

module.exports = new WeremafiaEngine();
