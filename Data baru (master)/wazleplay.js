const path = require('path');
const fs = require('fs');
const { evaluateAchievements } = require('./wazle_achievements');

let _indexModule = null;
function getTunnelUrl() {
  if (!_indexModule) {
    try { _indexModule = require('./index'); } catch(e) { _indexModule = {}; }
  }
  return _indexModule && _indexModule.getPublicTunnelUrl ? _indexModule.getPublicTunnelUrl() : null;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function showLoading(sock, jid, text, delayOrQuoted, maybeQuoted) {
  let delayTime = 2000;
  let quoted = undefined;
  
  if (typeof delayOrQuoted === 'number') {
    delayTime = delayOrQuoted;
    quoted = maybeQuoted;
  } else if (typeof delayOrQuoted === 'object') {
    quoted = delayOrQuoted;
  }

  // Interactive progress animation
  const frames = [
    `⏳ [■□□□□□□□□□] 10% \n_${text}_`,
    `⏳ [■■■■□□□□□□] 40% \n_${text}_`,
    `⏳ [■■■■■■■□□□] 70% \n_${text}_`,
    `⏳ [■■■■■■■■■■] 100% \n_${text}_`
  ];
  
  try {
    const loadingMsg = await sock.sendMessage(jid, { text: frames[0] }, { quoted });
    const stepDelay = Math.floor(delayTime / frames.length);
    
    for (let i = 1; i < frames.length; i++) {
      await delay(stepDelay);
      await sock.sendMessage(jid, { text: frames[i], edit: loadingMsg.key });
    }
    
    await delay(300); // Jeda singkat di 100%
    await sock.sendMessage(jid, { delete: loadingMsg.key });
  } catch (e) {
    console.error("Gagal menampilkan loading interaktif:", e);
  }
}

let ALL_ITEMS = [];
try {
  ALL_ITEMS = JSON.parse(fs.readFileSync(path.join(__dirname, 'wazle_items.json'), 'utf8'));
} catch (e) {
  console.error("Gagal load wazle_items.json", e);
}

let currentShopItems = [];
let lastShopRotation = 0;
const SHOP_ROTATION_INTERVAL = 60 * 60 * 1000; // 1 hour

function rotateShop() {
  const now = Date.now();
  if (now - lastShopRotation > SHOP_ROTATION_INTERVAL || currentShopItems.length === 0) {
    currentShopItems = [];
    const numItems = Math.floor(Math.random() * 3) + 5; // 5 to 7 items
    for (let i = 0; i < numItems; i++) {
      let roll = Math.random();
      let targetTier;
      if (roll < 0.90) targetTier = Math.floor(Math.random() * 3) + 1; // Tier 1-3
      else if (roll < 0.98) targetTier = Math.floor(Math.random() * 2) + 4; // Tier 4-5
      else targetTier = Math.floor(Math.random() * 2) + 6; // Tier 6-7
      
      const availableItems = ALL_ITEMS.filter(item => item.tier === targetTier);
      if (availableItems.length > 0) {
        currentShopItems.push(availableItems[Math.floor(Math.random() * availableItems.length)]);
      }
    }
    lastShopRotation = now;
  }
}

const LOCATIONS = [
  "Balai Kota",
  "Alun-Alun Pesta",
  "Pasar Fluktuatif",
  "Bengkel Pandai Besi",
  "Stasiun Ekspedisi",
  "Gua Labirin",
  "Pabrik Saham",
  "Hutan Liar"
];

const LOCATION_IMAGES = {
  "Balai Kota": "city hall.png",
  "Alun-Alun Pesta": "quiests.png",
  "Pasar Fluktuatif": "food.png",
  "Bengkel Pandai Besi": "crafting.png",
  "Stasiun Ekspedisi": "transport.png",
  "Gua Labirin": "chest.png",
  "Pabrik Saham": "production.png",
  "Hutan Liar": "explore.png"
};

const MAX_STAMINA = 100;
const STAMINA_REGEN_RATE = 5 * 60 * 1000; // 5 minutes per 1 stamina

function regenStamina(phone, userData) {
  const now = Date.now();
  if (!userData.last_stamina_regen) userData.last_stamina_regen = now;
  
  if (userData.stamina < MAX_STAMINA) {
    const timeDiff = now - userData.last_stamina_regen;
    const staminaToRecover = Math.floor(timeDiff / STAMINA_REGEN_RATE);
    
    if (staminaToRecover > 0) {
      userData.stamina = Math.min(MAX_STAMINA, userData.stamina + staminaToRecover);
      userData.last_stamina_regen = now - (timeDiff % STAMINA_REGEN_RATE); // Keep remainder
    }
  } else {
    userData.last_stamina_regen = now;
  }
}

function getRandomEncounter(userData) {
  const rand = Math.random();
  if (rand > 0.4) return null; // 60% chance of nothing happening (Safe trip)
  
  // 40% chance of random encounter
  const events = [
    // --- GOOD EVENTS ---
    {
      type: 'good',
      msg: "💼 Kamu menemukan koper yang tertinggal di jalan! Di dalamnya ada *+500 WP*!",
      effect: (user) => { user.wp += 500; }
    },
    {
      type: 'good',
      msg: "🌊 Kamu menemukan Mata Air Suci. Setelah meminumnya, *Staminamu pulih penuh*!",
      effect: (user) => { user.stamina = MAX_STAMINA; }
    },
    {
      type: 'good',
      msg: "🐱 Kamu menyelamatkan kucing yang tersangkut di pohon. Warga memberikanmu hadiah *+2 Permata*!",
      effect: (user) => { user.permata += 2; }
    },
    {
      type: 'good',
      msg: "🌠 Tiba-tiba ada meteor kecil jatuh di hadapanmu! Kamu mendapatkan serpihan *Batu Bintang* senilai *+1500 WP*!",
      effect: (user) => { user.wp += 1500; }
    },
    {
      type: 'good',
      msg: "🎁 Kamu menemukan kotak bekal misterius yang terjatuh. Setelah dibuka, isinya adalah makanan langka!",
      effect: (user) => { 
        if (!user.inventory) user.inventory = {};
        const dropItems = ALL_ITEMS.filter(i => i.tier >= 3 && i.tier <= 6);
        const item = dropItems[Math.floor(Math.random() * dropItems.length)];
        if (!user.inventory[item.id]) user.inventory[item.id] = 0;
        user.inventory[item.id]++;
        return `Kamu mendapatkan 1x ${item.icon} *${item.name}* (Tier ${item.tier})! Cek dengan \`!wazle tas\``;
      }
    },

    // --- BAD EVENTS ---
    {
      type: 'bad',
      msg: "🥷 Kamu dicegat oleh gerombolan begal jalanan! Mereka memukulmu dan merampas dompetmu. Kamu kehilangan *-20% WP* dan *-10 HP*!",
      effect: (user) => { 
        const loss = Math.floor(user.wp * 0.2);
        user.wp = Math.max(0, user.wp - loss);
        user.hp = Math.max(0, user.hp - 10);
      }
    },
    {
      type: 'bad',
      msg: "🚓 RAZIA POLISI! Kamu tidak membawa surat izin jalan di kota ini. Kamu didenda *-300 WP*!",
      effect: (user) => { user.wp = Math.max(0, user.wp - 300); }
    },
    {
      type: 'bad',
      msg: "🕳️ BRUKK! Kamu terperosok ke dalam lubang got yang terbuka. *Staminamu berkurang 10*!",
      effect: (user) => { user.stamina = Math.max(0, user.stamina - 10); }
    },
    {
      type: 'bad',
      msg: "💸 Di tengah keramaian pasar, pencopet ahli mengambil sebagian WP-mu tanpa kau sadari. *-150 WP*.",
      effect: (user) => { user.wp = Math.max(0, user.wp - 150); }
    },

    // --- NEUTRAL / INTERACTIVE ---
    {
      type: 'neutral',
      msg: "🔮 Kamu menemukan persimpangan misterius bercahaya biru... Kamu salah jalan dan tiba-tiba berada di lokasi yang berbeda!",
      effect: (user) => { 
        const randomLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        user.location = randomLoc;
      }
    },
    {
      type: 'neutral',
      msg: "🧙‍♂️ Kamu bertemu dengan Pengemis Tua. Tanpa sadar, kamu menjatuhkan *10 WP* kepadanya. Dia tersenyum misterius...",
      effect: (user) => { 
        user.wp = Math.max(0, user.wp - 10); 
        // 10% chance he's a god
        if (Math.random() < 0.1) {
          user.wp += 5000;
          return "Tiba-tiba pengemis itu bersinar! Dia adalah Dewa Wazle yang menyamar! Sebagai balasan atas kebaikanmu, dia memberkatimu dengan *+5000 WP*!!";
        }
      }
    }
  ];

  return events[Math.floor(Math.random() * events.length)];
}

async function handleWazleCommand(sock, msg, args, sender, userData, economyManager) {
  const phone = sender;
  const username = msg.pushName || userData.name || "Pemain Misterius";
  regenStamina(phone, userData);
  
  if (!userData.inventory) userData.inventory = {};

  if (args.length === 0) {
    await showLoading(sock, msg.key.remoteJid, "📡 Sedang mencari data Wazle...", msg);
    evaluateAchievements(userData, { type: 'open_map' }, sock, msg);
    
    // Show Map and Status
    const mapText = `🗺️ *WAZLE PLAY: THE LIVING WORLD* 🗺️\n👤 *Pemain*: ${username}\n\n` +
      `📍 *Lokasi Saat Ini*: ${userData.location}\n` +
      `❤️ *HP*: ${userData.hp}/100\n` +
      `⚡ *Stamina*: ${userData.stamina}/${MAX_STAMINA}\n` +
      `💼 *Profesi*: ${userData.profesi || "Pengangguran"}\n\n` +
      `*Pilihan Lokasi*: \n` +
      LOCATIONS.map((loc, i) => `${i+1}. ${loc}`).join('\n') + `\n\n` +
      `*Cara berpindah*: Ketik \`!wazle jalan <nama_lokasi>\` (Butuh 5 Stamina)`;
      
    // Send message (We can attach the map image if needed later)
    try {
      await sock.sendMessage(msg.key.remoteJid, { image: fs.readFileSync('./.config/Map.png'), caption: mapText }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: mapText }, { quoted: msg });
    }
    
    // Send background audio (lobby) as PTT via public URL
    const tunnelBase = getTunnelUrl();
    if (tunnelBase) {
      try {
        await sock.sendMessage(msg.key.remoteJid, {
          audio: { url: `${tunnelBase}/assets/lobby.mp3` },
          mimetype: 'audio/mp4',
          ptt: true
        }, { quoted: msg });
      } catch (e) {
        // Ignore if audio fails
      }
    }
    
    economyManager.updateUserData(phone, userData);
    return;
  }

  const subCmd = args[0].toLowerCase();

  if (subCmd === 'boss' || subCmd === 'attack') {
    // 1000000 base HP, stored globally in a separate JSON or file, but for simplicity, we can load/save it to economy_data.json
    let bossHp = 1000000;
    try {
      const data = JSON.parse(fs.readFileSync('./economy_data.json', 'utf8'));
      if (data.WORLD_BOSS_HP !== undefined) bossHp = data.WORLD_BOSS_HP;
    } catch(e) {}

    if (bossHp <= 0) {
      await sock.sendMessage(msg.key.remoteJid, { text: `🐉 Naga Kegelapan sudah mati! Tunggu dia bangkit kembali.` }, { quoted: msg });
      return;
    }

    if (subCmd === 'boss') {
      const bossText = `⚔️ *WORLD BOSS BATTLE!* ⚔️\n\n🐉 *Naga Kegelapan Kuno*\n❤️ HP: ${bossHp}/1000000\n\nKetik \`!wazle attack boss\` untuk menyerang! (Butuh 20 Stamina)\nJika berpartisipasi, kamu akan dapat bagian dari jarahan saat boss mati!`;
      await sock.sendMessage(msg.key.remoteJid, { text: bossText }, { quoted: msg });
      
      const _tb1 = getTunnelUrl();
      if (_tb1) {
        try {
          await sock.sendMessage(msg.key.remoteJid, { audio: { url: `${_tb1}/assets/penyerangan.mp3` }, mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
        } catch (e) {}
      }
      return;
    }

    if (subCmd === 'attack' && args[1] === 'boss') {
      if (userData.stamina < 20) {
        await sock.sendMessage(msg.key.remoteJid, { text: `Stamina tidak cukup untuk menyerang Boss (Sisa: ${userData.stamina}/Butuh: 20)` }, { quoted: msg });
        return;
      }

      userData.stamina -= 20;
      const damage = Math.floor(Math.random() * 500) + 100; // 100 to 600 damage
      bossHp -= damage;
      userData.wp += damage * 2; // WP reward = damage * 2
      
      // Save Boss HP
      try {
        const econPath = './economy_data.json';
        const econData = JSON.parse(fs.readFileSync(econPath, 'utf8'));
        econData.WORLD_BOSS_HP = bossHp;
        fs.writeFileSync(econPath, JSON.stringify(econData, null, 2));
      } catch(e) {}
      
      evaluateAchievements(userData, { type: 'attack_boss' }, sock, msg);
      economyManager.updateUserData(phone, userData);

      let attackMsg = `💥 BAM! *${username}* menyerang Naga Kegelapan!\n⚔️ Damage: ${damage}\n💰 WP Didapat: +${damage * 2}\n🐉 HP Boss: ${Math.max(0, bossHp)}/1000000`;
      
      if (bossHp <= 0) {
        attackMsg += `\n\n🎉 NAGA KEGELAPAN TELAH DIKALAHKAN OLEH *${username}*! SELAMAT!`;
        // Random mythical drop
        const dropItems = ALL_ITEMS.filter(i => i.tier >= 8);
        if (dropItems.length > 0) {
          const item = dropItems[Math.floor(Math.random() * dropItems.length)];
          if (!userData.inventory[item.id]) userData.inventory[item.id] = 0;
          userData.inventory[item.id]++;
          attackMsg += `\n🎁 Kamu menemukan barang super langka: 1x ${item.icon} *${item.name}* (Tier ${item.tier})!`;
          economyManager.updateUserData(phone, userData);
        }
      }

      await sock.sendMessage(msg.key.remoteJid, { text: attackMsg }, { quoted: msg });
      
      const _tb2 = getTunnelUrl();
      if (_tb2) {
        try {
          await sock.sendMessage(msg.key.remoteJid, { audio: { url: `${_tb2}/assets/penyerangan.mp3` }, mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
        } catch (e) {}
      }
      return;
    }
  }

  if (subCmd === 'jalan' || subCmd === 'pergi') {
    const targetLocName = args.slice(1).join(" ").toLowerCase();
    
    if (!targetLocName) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Tentukan tujuanmu! Contoh: !wazle jalan Balai Kota` }, { quoted: msg });
      return;
    }

    const matchedLoc = LOCATIONS.find(l => l.toLowerCase().includes(targetLocName));
    
    if (!matchedLoc) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Lokasi tidak ditemukan di map Wazle.` }, { quoted: msg });
      return;
    }

    if (userData.location === matchedLoc) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Kamu sudah berada di ${matchedLoc}!` }, { quoted: msg });
      return;
    }

    if (userData.stamina < 5) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Staminamu tidak cukup untuk bepergian (Sisa: ${userData.stamina}). Istirahatlah sejenak atau beli makanan di Pasar!` }, { quoted: msg });
      return;
    }

    // Process Travel
    userData.stamina -= 5;
    userData.location = matchedLoc;
    
    let replyMsg = `🚶‍♂️ *${username}* berjalan menyusuri kota menuju *${matchedLoc}*... (Stamina -5)\n`;
    
    // Trigger RNG
    const encounter = getRandomEncounter(userData);
    if (encounter) {
      const extraMsg = encounter.effect(userData);
      replyMsg += `\n⚠️ *RANDOM ENCOUNTER!*\n${encounter.msg}`;
      if (extraMsg) {
        replyMsg += `\n\n✨ ${extraMsg}`;
      }
      evaluateAchievements(userData, { type: 'encounter', encounterType: encounter.type }, sock, msg);
    } else {
      replyMsg += `\n*${username}* tiba di *${matchedLoc}* dengan selamat.`;
    }

    evaluateAchievements(userData, { type: 'travel', location: matchedLoc }, sock, msg);
    economyManager.updateUserData(phone, userData);
    
    // Attach location image
    const imageFilename = LOCATION_IMAGES[matchedLoc];
    if (imageFilename) {
      try {
        await sock.sendMessage(msg.key.remoteJid, { image: fs.readFileSync(`./.config/${imageFilename}`), caption: replyMsg }, { quoted: msg });
      } catch (e) {
        await sock.sendMessage(msg.key.remoteJid, { text: replyMsg }, { quoted: msg });
      }
    } else {
      await sock.sendMessage(msg.key.remoteJid, { text: replyMsg }, { quoted: msg });
    }
    return;
  }

  // Locational Commands
  if (subCmd === 'balaikota' || subCmd === 'kota') {
    if (userData.location !== "Balai Kota") {
      await sock.sendMessage(msg.key.remoteJid, { text: `Kamu harus berada di Balai Kota untuk melakukan ini!` }, { quoted: msg });
      return;
    }
    await sock.sendMessage(msg.key.remoteJid, { text: `🏛️ *Balai Kota*\nSelamat datang. Kamu dapat mengganti profesi di sini.\nKetik \`!wazle profesi <nama_profesi>\`\nPilihan Profesi: Penambang, Nelayan, Pedagang, Petualang.` }, { quoted: msg });
    return;
  }

  if (subCmd === 'profesi') {
    if (userData.location !== "Balai Kota") {
      await sock.sendMessage(msg.key.remoteJid, { text: `Kamu harus pergi ke *Balai Kota* untuk mendaftar profesi!` }, { quoted: msg });
      return;
    }
    const profs = ["penambang", "nelayan", "pedagang", "petualang"];
    const chosen = args[1] ? args[1].toLowerCase() : "";
    if (!profs.includes(chosen)) {
      await showLoading(sock, msg.key.remoteJid, "Mencari data profesi...", msg);
      await sock.sendMessage(msg.key.remoteJid, { text: `Pilih profesi yang valid:\n1. Penambang (+10% Mining Luck)\n2. Nelayan (+10% Fishing Luck)\n3. Pedagang (+10% Sell Price)\n4. Petualang (-20% Stamina Cost di Gua)\nContoh: \`!wazle profesi nelayan\`` }, { quoted: msg });
      return;
    }
    await showLoading(sock, msg.key.remoteJid, "Memproses pendaftaran profesi...", msg);
    userData.profesi = chosen.charAt(0).toUpperCase() + chosen.slice(1);
    evaluateAchievements(userData, { type: 'change_profession', profesi: userData.profesi }, sock, msg);
    economyManager.updateUserData(phone, userData);
    await sock.sendMessage(msg.key.remoteJid, { text: `🎓 Selamat! Profesi kamu sekarang adalah *${userData.profesi}*.` }, { quoted: msg });
    return;
  }

  if (subCmd === 'petualangan' || subCmd === 'ekspedisi') {
    if (userData.location !== "Stasiun Ekspedisi") {
      await sock.sendMessage(msg.key.remoteJid, { text: `Kamu harus berada di *Stasiun Ekspedisi* untuk mengirim petualangan.` }, { quoted: msg });
      return;
    }
    
    const now = Date.now();
    if (userData.pet_expedition_endTime && userData.pet_expedition_endTime > now) {
      const sisa = Math.ceil((userData.pet_expedition_endTime - now) / 60000);
      await sock.sendMessage(msg.key.remoteJid, { text: `Pet kamu sedang dalam petualangan! Sisa waktu: ${sisa} menit.` }, { quoted: msg });
      return;
    }

    if (userData.pet_expedition_endTime && userData.pet_expedition_endTime <= now) {
      // Claim reward
      userData.pet_expedition_endTime = null;
      const wpReward = Math.floor(Math.random() * 2000) + 500;
      userData.wp += wpReward;
      let claimMsg = `🏕️ Pet kamu pulang membawa oleh-oleh! Kamu mendapat +${wpReward} WP.`;
      evaluateAchievements(userData, { type: 'finish_expedition' }, sock, msg);
      economyManager.updateUserData(phone, userData);
      await sock.sendMessage(msg.key.remoteJid, { text: claimMsg }, { quoted: msg });
      return;
    }

    if (userData.stamina < 30) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Kamu butuh 30 Stamina untuk membekali pet-mu berangkat (Sisa: ${userData.stamina}).` }, { quoted: msg });
      return;
    }

    userData.stamina -= 30;
    userData.pet_expedition_endTime = now + (60 * 60 * 1000); // 1 hour
    economyManager.updateUserData(phone, userData);
    await sock.sendMessage(msg.key.remoteJid, { text: `🏕️ Pet kamu telah berangkat ekspedisi! Pet akan kembali 1 jam lagi. Ketik \`!wazle ekspedisi\` lagi nanti untuk mengambil hasil.` }, { quoted: msg });
    return;
  }

  if (subCmd === 'pasar' || subCmd === 'beli') {
    if (userData.location !== "Pasar Fluktuatif") {
      await sock.sendMessage(msg.key.remoteJid, { text: `Kamu harus berada di Pasar Fluktuatif untuk mengakses ini!` }, { quoted: msg });
      return;
    }
    
    rotateShop(); // Ensure shop is up to date
    
    if (subCmd === 'beli' && args.length > 1) {
      const targetItemName = args.slice(1).join(" ").toLowerCase();
      const itemToBuy = currentShopItems.find(i => i.name.toLowerCase() === targetItemName || i.id === targetItemName);
      
      if (!itemToBuy) {
        await sock.sendMessage(msg.key.remoteJid, { text: `Item tersebut tidak sedang dijual di pasar hari ini.` }, { quoted: msg });
        return;
      }
      
      if (userData.wp >= itemToBuy.price) {
        userData.wp -= itemToBuy.price;
        if (!userData.inventory[itemToBuy.id]) userData.inventory[itemToBuy.id] = 0;
        userData.inventory[itemToBuy.id]++;
        evaluateAchievements(userData, { type: 'buy_item', item: itemToBuy }, sock, msg);
        economyManager.updateUserData(phone, userData);
        await sock.sendMessage(msg.key.remoteJid, { text: `✅ *${username}* berhasil membeli *${itemToBuy.icon} ${itemToBuy.name}* seharga ${itemToBuy.price} WP!` }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ WP kamu tidak cukup untuk membeli *${itemToBuy.name}* (Harga: ${itemToBuy.price} WP).` }, { quoted: msg });
      }
      return;
    }

    let shopMenu = `🎪 *Pasar Fluktuatif*\n\nSelamat datang, *${username}*! Berikut adalah barang yang sedang langka dan dijual saat ini:\n\n`;
    currentShopItems.forEach(item => {
      shopMenu += `${item.icon} *${item.name}* [Tier ${item.tier}: ${item.tierName}]\n  💵 Harga: ${item.price} WP\n  ⚡ Stamina: +${item.stamina}\n\n`;
    });
    shopMenu += `\nCara beli: \`!wazle beli <nama_item>\``;
    
    await sock.sendMessage(msg.key.remoteJid, { text: shopMenu }, { quoted: msg });
    return;
  }

  if (subCmd === 'tas' || subCmd === 'inv' || subCmd === 'inventory') {
    await showLoading(sock, msg.key.remoteJid, "🎒 Membuka tas...", msg);
    let invText = `🎒 *Isi Tas ${username}*\n\n`;
    let hasItems = false;
    for (const [itemId, qty] of Object.entries(userData.inventory)) {
      if (qty > 0) {
        const itemObj = ALL_ITEMS.find(i => i.id === itemId);
        if (itemObj) {
          invText += `${qty}x ${itemObj.icon} *${itemObj.name}* (Tier ${itemObj.tier})\n`;
          hasItems = true;
        }
      }
    }
    if (!hasItems) invText += `Tas kamu kosong melompong.`;
    else invText += `\nKetik \`!wazle makan <nama_item>\` atau \`!wazle jual <nama_item>\``;
    
    await sock.sendMessage(msg.key.remoteJid, { text: invText }, { quoted: msg });
    return;
  }

  if (subCmd === 'makan') {
    const targetItemName = args.slice(1).join(" ").toLowerCase();
    const itemObj = ALL_ITEMS.find(i => i.name.toLowerCase() === targetItemName || i.id === targetItemName);
    
    if (!itemObj || !userData.inventory[itemObj.id] || userData.inventory[itemObj.id] < 1) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Kamu tidak memiliki item tersebut di dalam tas.` }, { quoted: msg });
      return;
    }

    userData.inventory[itemObj.id]--;
    userData.stamina = Math.min(MAX_STAMINA, userData.stamina + itemObj.stamina);
    evaluateAchievements(userData, { type: 'eat_food', item: itemObj }, sock, msg);
    economyManager.updateUserData(phone, userData);
    
    await sock.sendMessage(msg.key.remoteJid, { text: `😋 *${username}* memakan *${itemObj.icon} ${itemObj.name}*!\n⚡ Stamina pulih sebanyak +${itemObj.stamina}. (Stamina saat ini: ${userData.stamina}/${MAX_STAMINA})` }, { quoted: msg });
    return;
  }

  if (subCmd === 'jual') {
    const targetItemName = args.slice(1).join(" ").toLowerCase();
    const itemObj = ALL_ITEMS.find(i => i.name.toLowerCase() === targetItemName || i.id === targetItemName);
    
    if (!itemObj || !userData.inventory[itemObj.id] || userData.inventory[itemObj.id] < 1) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Kamu tidak memiliki item tersebut di dalam tas.` }, { quoted: msg });
      return;
    }

    const sellPrice = Math.floor(itemObj.price * 0.7); // Sell for 70% of base price
    userData.inventory[itemObj.id]--;
    userData.wp += sellPrice;
    evaluateAchievements(userData, { type: 'sell_item', item: itemObj }, sock, msg);
    economyManager.updateUserData(phone, userData);
    
    await sock.sendMessage(msg.key.remoteJid, { text: `💰 *${username}* menjual *${itemObj.icon} ${itemObj.name}* seharga +${sellPrice} WP!` }, { quoted: msg });
    return;
  }

  if (subCmd === 'gua' || subCmd === 'kiri' || subCmd === 'kanan') {
    if (userData.location !== "Gua Labirin") {
      await sock.sendMessage(msg.key.remoteJid, { text: `Mitos mengatakan Gua Labirin hanya bisa dimasuki dari pintu masuk Gua Labirin.` }, { quoted: msg });
      return;
    }
    
    if (subCmd === 'gua') {
      await sock.sendMessage(msg.key.remoteJid, { text: `🗿 *Gua Labirin*\nKamu berdiri di depan lorong gelap. Terdapat persimpangan ke *kiri* dan ke *kanan*. Pilih jalanmu:\nKetik: \`!wazle kiri\` atau \`!wazle kanan\`` }, { quoted: msg });
      return;
    }

    if (subCmd === 'kiri' || subCmd === 'kanan') {
      if (userData.stamina < 10) {
        await sock.sendMessage(msg.key.remoteJid, { text: `Staminamu tidak cukup untuk menyusuri gua (Butuh 10 Stamina).` }, { quoted: msg });
        return;
      }
      userData.stamina -= 10;
      
      const isTrap = Math.random() < 0.5;
      if (isTrap) {
        userData.hp = Math.max(0, userData.hp - 20);
        evaluateAchievements(userData, { type: 'labyrinth_trap' }, sock, msg);
        economyManager.updateUserData(phone, userData);
        await sock.sendMessage(msg.key.remoteJid, { text: `💀 Kamu melangkah ke lorong ${subCmd} dan menginjak perangkap panah! HP -20. (Sisa HP: ${userData.hp})` }, { quoted: msg });
      } else {
        const rewardWP = Math.floor(Math.random() * 500) + 100;
        userData.wp += rewardWP;
        
        let extraMsg = `✨ Keputusan tepat! Di ujung lorong ${subCmd}, kamu menemukan harta karun senilai +${rewardWP} WP!`;
        
        // 30% chance to find an ancient item
        if (Math.random() < 0.3) {
          const dropItems = ALL_ITEMS.filter(i => i.tier >= 5 && i.tier <= 8);
          const item = dropItems[Math.floor(Math.random() * dropItems.length)];
          if (!userData.inventory[item.id]) userData.inventory[item.id] = 0;
          userData.inventory[item.id]++;
          extraMsg += `\n\n🏺 Terdapat sebuah peti kuno berdebu... Kamu mendapatkan 1x ${item.icon} *${item.name}* (Tier ${item.tier})!`;
          evaluateAchievements(userData, { type: 'labyrinth_chest', item: item }, sock, msg);
        }
        
        evaluateAchievements(userData, { type: 'labyrinth_safe' }, sock, msg);
        economyManager.updateUserData(phone, userData);
        await sock.sendMessage(msg.key.remoteJid, { text: extraMsg }, { quoted: msg });
      }
      return;
    }
  }

  if (subCmd === 'achievement' || subCmd === 'achievements') {
    if (!userData.achievements) userData.achievements = [];
    const { ACHIEVEMENTS } = require('./wazle_achievements');
    let unlocked = 0;
    
    // Sort logic to put unlocked first, then visible locked. Hidden locked aren't shown.
    const visibleList = [];
    for (const ach of ACHIEVEMENTS) {
      const isUnlocked = userData.achievements.includes(ach.id);
      if (isUnlocked) {
        unlocked++;
        visibleList.push({ ...ach, isUnlocked: true });
      } else if (!ach.hidden) {
        visibleList.push({ ...ach, isUnlocked: false });
      }
    }
    
    // Page selection
    let page = 1;
    if (args[1] && !isNaN(args[1])) {
      page = parseInt(args[1]);
    }
    
    const limit = 10;
    const totalPages = Math.ceil(visibleList.length / limit);
    page = Math.max(1, Math.min(page, totalPages));
    
    let text = `🏆 *Achievement ${username}*\n`;
    text += `🔓 Terbuka: *${unlocked} / ${ACHIEVEMENTS.length}*\n`;
    text += `📖 Halaman *${page} / ${totalPages}*\n\n`;
    
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, visibleList.length);
    
    const pageItems = visibleList.slice(startIndex, endIndex);
    pageItems.forEach((a, i) => {
      const num = startIndex + i + 1;
      if (a.isUnlocked) {
        text += `${num}. ✅ *${a.name}*\n   _${a.desc}_\n\n`;
      } else {
        text += `${num}. 🔒 *${a.name}*\n   _${a.desc}_\n\n`;
      }
    });
    
    if (totalPages > 1) {
      text += `Untuk melihat halaman lain, ketik:\n\`!wazle achievement <nomor_halaman>\` (Contoh: \`!wazle achievement 2\`)`;
    }
    
    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
    return;
  }

  // Fallback
  await sock.sendMessage(msg.key.remoteJid, { text: `Perintah !wazle tidak dikenali. Ketik !wazle untuk melihat map.` }, { quoted: msg });
}

module.exports = {
  handleWazleCommand
};
