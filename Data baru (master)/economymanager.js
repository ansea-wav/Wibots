const fs = require('fs');
const path = require('path');
const MINING_STAGES = require('./mining_stages.json');

const ECONOMY_FILE = path.join(__dirname, 'economy_data.json');

// Ensure file exists
if (!fs.existsSync(ECONOMY_FILE)) {
  fs.writeFileSync(ECONOMY_FILE, JSON.stringify({}));
}

function loadEconomyData() {
  try {
    const data = fs.readFileSync(ECONOMY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading economy_data.json:', err);
    return {};
  }
}

function saveEconomyData(data) {
  try {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing economy_data.json:', err);
  }
}

function getUserData(phone) {
  const data = loadEconomyData();
  if (!data[phone]) {
    data[phone] = {
      pickaxe: 0, // 0 means no pickaxe, >0 means durability
      pickaxe_type: "", // Name of the pickaxe
      last_mancing: 0,
      last_tambang: 0,
      last_rampok: 0,
      wm: 0,
      bank_wp: 0,
      wp: 0,
      permata: 0,
      jail_until: 0,
      inventory: {}, // Future items
      achievements: [],
      titles: [],
      active_title: "",
      badges: [],
      pets: {},
      artifacts: {},
      reputation: 0,
      quests: {},
      tracking: {},
      wazle_score: 0
    };
  } else {
    // Inject defaults for existing users
    if (data[phone].bank_wp === undefined) data[phone].bank_wp = 0;
    if (data[phone].wm === undefined) data[phone].wm = 0;
    if (data[phone].wp === undefined) data[phone].wp = 0;
    if (data[phone].permata === undefined) data[phone].permata = 0;
    if (data[phone].jail_until === undefined) data[phone].jail_until = 0;
    if (data[phone].last_rampok === undefined) data[phone].last_rampok = 0;
    if (data[phone].pickaxe_type === undefined) data[phone].pickaxe_type = (data[phone].pickaxe > 0 ? "Pix Kayu" : "");
    if (data[phone].tambang_capacity === undefined) data[phone].tambang_capacity = 20;
    if (data[phone].pet_type === undefined) data[phone].pet_type = "";
    if (data[phone].pet_weight === undefined) data[phone].pet_weight = 0;
    if (data[phone].pet_adopted_at === undefined) data[phone].pet_adopted_at = 0;
    if (data[phone].pakan_pet === undefined) data[phone].pakan_pet = 0;
    
    // RPG fields
    if (!data[phone].achievements) data[phone].achievements = [];
    if (!data[phone].titles) data[phone].titles = [];
    if (data[phone].active_title === undefined) data[phone].active_title = "";
    if (!data[phone].badges) data[phone].badges = [];
    if (!data[phone].pets) data[phone].pets = {};
    if (!data[phone].artifacts) data[phone].artifacts = {};
    if (data[phone].reputation === undefined) data[phone].reputation = 0;
    if (!data[phone].quests) data[phone].quests = {};
    if (!data[phone].tracking) data[phone].tracking = {};
    if (data[phone].wazle_score === undefined) data[phone].wazle_score = 0;
  }
  return data[phone];
}

function updateUserData(phone, updates) {
  const data = loadEconomyData();
  if (!data[phone]) {
    data[phone] = { pickaxe: 0, pickaxe_type: "", wm: 0, wp: 0, permata: 0, last_mancing: 0, last_tambang: 0, tambang_capacity: 20, pet_type: "", pet_weight: 0, pet_adopted_at: 0, pakan_pet: 0, last_rampok: 0, bank_wp: 0, jail_until: 0, inventory: {}, achievements: [], titles: [], active_title: "", badges: [], pets: {}, artifacts: {}, reputation: 0, quests: {}, tracking: {}, wazle_score: 0 };
  }
  Object.assign(data[phone], updates);
  saveEconomyData(data);
}

function getGroupData(groupId) {
  if (!groupId.endsWith('@g.us')) return null;
  const data = loadEconomyData();
  if (!data[groupId]) {
    data[groupId] = {
      mining_level: 1,
      mining_xp: "0" // Disimpan sebagai string untuk mendukung BigInt
    };
  }
  // Inject default
  if (data[groupId].mining_level === undefined) data[groupId].mining_level = 1;
  if (data[groupId].mining_xp === undefined) data[groupId].mining_xp = "0";
  return data[groupId];
}

function calculateBuffs(user) {
  let wmBonus = 0;
  let wpBonus = 0;
  let permataChance = 0;
  
  if (user.pets && user.pets.active) {
    const petData = PET_DB[user.pets.active];
    if (petData && petData.luck) wmBonus += petData.luck;
  }
  
  return { wmBonus, wpBonus, permataChance };
}

function addWM(phone, amount, source = "game") {
  const user = getUserData(phone);
  if (amount > 0 && source === "game") {
    const buffs = calculateBuffs(user);
    amount = Math.floor(amount * (1 + buffs.wmBonus));
  }
  user.wm = (user.wm || 0) + amount;
  updateUserData(phone, user);
  return amount; // returns the actual added amount after buffs
}

function addWP(phone, amount) {
  const user = getUserData(phone);
  user.wp = (user.wp || 0) + amount;
  updateUserData(phone, user);
  return amount;
}


function updateGroupData(groupId, updates) {
  if (!groupId.endsWith('@g.us')) return;
  const data = loadEconomyData();
  if (!data[groupId]) {
    data[groupId] = { mining_level: 1, mining_xp: "0" };
  }
  Object.assign(data[groupId], updates);
  saveEconomyData(data);
}

function getGroupMiningInfo(groupId) {
  const group = getGroupData(groupId);
  if (!group) return null;
  
  const level = group.mining_level;
  const stage = MINING_STAGES.find(s => s.level === level) || MINING_STAGES[MINING_STAGES.length - 1];
  
  // BigInt for XP
  const xpStr = group.mining_xp.toString();
  const currentXp = BigInt(xpStr);
  
  // Required XP = 500 * 10^(level-1)
  const reqXp = BigInt(500) * (10n ** BigInt(level - 1));
  
  // Capacity: level 1 = 15, level 2 = 20... -> 10 + (level * 5)
  const capacity = 10 + (level * 5);
  
  return {
    level: level,
    name: stage.name,
    currentXp: currentXp,
    requiredXp: reqXp,
    capacity: capacity
  };
}

// ==========================================
// PICKAXE DATABASE
// ==========================================
const PICKAXE_DB = {
  "Pix Kayu": { price: 500, durability: 10, luck: 0 },
  "Pix Batu": { price: 1500, durability: 25, luck: 0.05 },
  "Pix Besi": { price: 5000, durability: 50, luck: 0.1 },
  "Pix Emas": { price: 15000, durability: 100, luck: 0.2 },
  "Pix Meteorite": { price: 35000, durability: 250, luck: 0.35 },
};

// ==========================================
// PET DATABASE (24 PETS)
// ==========================================
const PET_DB = {
  "Cacing Tanah": { emoji: "🪱", priceWM: 1000, luck: 0.005 },
  "Siput Lemot": { emoji: "🐌", priceWM: 2500, luck: 0.008 },
  "Laba-Laba Sudut": { emoji: "🕷️", priceWM: 5000, luck: 0.01 },
  "Semut Api": { emoji: "🐜", priceWM: 10000, luck: 0.015 },
  "Kucing Liar": { emoji: "🐈", priceWM: 50000, luck: 0.02 },
  "Anjing Kampung": { emoji: "🐕", priceWM: 150000, luck: 0.05 },
  "Bebek Karet": { emoji: "🦆", priceWM: 300000, luck: 0.07 },
  "Kura-Kura Ninja": { emoji: "🐢", priceWM: 500000, luck: 0.10 },
  "Burung Beo Cerewet": { emoji: "🦜", priceWM: 850000, luck: 0.12 },
  "Babi Ngepet": { emoji: "🐖", priceWM: 1200000, luck: 0.15 },
  "Sapi Perah Hoki": { emoji: "🐄", priceWM: 2000000, luck: 0.18 },
  "Lebah Pekerja": { emoji: "🐝", priceWM: 3500000, luck: 0.22 },
  "Monyet Pencopet": { emoji: "🐒", priceWM: 5000000, luck: 0.25 },
  "Gorila Berotot": { emoji: "🦍", priceWM: 8000000, luck: 0.30 },
  "Kungkang Sakti": { emoji: "🦥", priceWM: 12000000, luck: 0.35 },
  "Beruang Madu": { emoji: "🐻", priceWM: 18000000, luck: 0.40 },
  "Kuda Poni Ghaib": { emoji: "🦄", priceWM: 25000000, luck: 0.45 },
  "Naga Kecil": { emoji: "🐉", priceWM: 40000000, luck: 0.50 },
  "Alien Kesasar": { emoji: "👽", priceWM: 65000000, luck: 0.60 },
  "T-Rex Jinak": { emoji: "🦖", priceWM: 100000000, luck: 0.75 },
  "Nyamuk Penghisap Hoki": { emoji: "🦟", priceWM: 150000000, luck: 0.90 },
  "Kecoak Terbang": { emoji: "🪳", priceWM: 250000000, luck: 1.10 },
  "Paus Terbang": { emoji: "🐋", priceWM: 500000000, luck: 1.50 },
  "Kraken Ukuran Pocket": { emoji: "🦑", priceWM: 1000000000, luck: 2.00 }
};

// ==========================================
// ITEM DATABASE (120 ITEMS)
// ==========================================
const ITEM_DB = {
  // --- MINING ITEMS ---
  "Tanah Liat": { emoji: "🟫", rarity: "Junk", weight: 1, price: 1 },
  "Batu Kerikil": { emoji: "🪨", rarity: "Junk", weight: 0.5, price: 2 },
  "Pasir": { emoji: "⏳", rarity: "Junk", weight: 0.5, price: 1 },
  "Debu Tambang": { emoji: "🌫️", rarity: "Junk", weight: 0.1, price: 1 },
  "Batu Bata Pecah": { emoji: "🧱", rarity: "Junk", weight: 1.2, price: 2 },
  "Lumpur": { emoji: "💩", rarity: "Junk", weight: 2, price: 1 },
  "Akar Pohon": { emoji: "🌿", rarity: "Junk", weight: 0.5, price: 2 },
  "Kaca Buram": { emoji: "🪞", rarity: "Junk", weight: 0.3, price: 3 },
  "Batu Kapur": { emoji: "🪨", rarity: "Junk", weight: 1.5, price: 4 },
  "Sisa Arang": { emoji: "⚫", rarity: "Junk", weight: 0.5, price: 2 },
  "Batu Bara": { emoji: "🪨", rarity: "Common", weight: 2, price: 15 },
  "Bijih Tembaga": { emoji: "🟠", rarity: "Common", weight: 1.5, price: 20 },
  "Bijih Timah": { emoji: "🪙", rarity: "Common", weight: 1.5, price: 18 },
  "Batu Obsidian Kecil": { emoji: "⬛", rarity: "Common", weight: 3, price: 25 },
  "Besi Tua": { emoji: "⛓️", rarity: "Common", weight: 2.5, price: 15 },
  "Pecahan Keramik": { emoji: "🏺", rarity: "Common", weight: 0.5, price: 12 },
  "Batu Granit": { emoji: "🪨", rarity: "Common", weight: 5, price: 30 },
  "Belerang": { emoji: "🟡", rarity: "Common", weight: 1, price: 22 },
  "Kristal Garam": { emoji: "🧂", rarity: "Common", weight: 0.5, price: 15 },
  "Batu Marmer": { emoji: "🏛️", rarity: "Common", weight: 4, price: 35 },
  "Bijih Besi": { emoji: "⚙️", rarity: "Uncommon", weight: 2.5, price: 50 },
  "Bijih Perak": { emoji: "🥈", rarity: "Uncommon", weight: 2, price: 80 },
  "Tulang Dinosaurus": { emoji: "🦴", rarity: "Uncommon", weight: 15, price: 100 },
  "Koin Kuno Berkarat": { emoji: "🪙", rarity: "Uncommon", weight: 0.1, price: 60 },
  "Guci Kuno": { emoji: "🏺", rarity: "Uncommon", weight: 3, price: 90 },
  "Batu Apung Gibeon": { emoji: "🪨", rarity: "Uncommon", weight: 1, price: 70 },
  "Gigi Megalodon": { emoji: "🦷", rarity: "Uncommon", weight: 0.5, price: 120 },
  "Bijih Perunggu": { emoji: "🥉", rarity: "Uncommon", weight: 2.2, price: 55 },
  "Batu Pualam": { emoji: "⚪", rarity: "Uncommon", weight: 3.5, price: 75 },
  "Kristal Es Purba": { emoji: "🧊", rarity: "Uncommon", weight: 1, price: 85 },
  "Bijih Emas": { emoji: "🥇", rarity: "Rare", weight: 3, price: 250 },
  "Kristal Kuarsa": { emoji: "🔮", rarity: "Rare", weight: 1.5, price: 200 },
  "Amethyst Kecil": { emoji: "💜", rarity: "Rare", weight: 0.5, price: 300 },
  "Topaz": { emoji: "💛", rarity: "Rare", weight: 0.4, price: 280 },
  "Zamrud Kecil": { emoji: "💚", rarity: "Rare", weight: 0.3, price: 350 },
  "Ruby Retak": { emoji: "❤️", rarity: "Rare", weight: 0.3, price: 320 },
  "Safir Kusam": { emoji: "💙", rarity: "Rare", weight: 0.4, price: 310 },
  "Fosil Trilobite": { emoji: "🪲", rarity: "Rare", weight: 1, price: 400 },
  "Batu Giok": { emoji: "🟢", rarity: "Rare", weight: 2, price: 450 },
  "Mutiara Tanah": { emoji: "⚪", rarity: "Rare", weight: 0.1, price: 500 },
  "Berlian Mentah": { emoji: "💎", rarity: "Epic", weight: 1, price: 1500 },
  "Ruby Merah Delima": { emoji: "♦️", rarity: "Epic", weight: 0.5, price: 2000 },
  "Safir Biru Samudra": { emoji: "🔷", rarity: "Epic", weight: 0.5, price: 2200 },
  "Zamrud Zamrud": { emoji: "🟩", rarity: "Epic", weight: 0.6, price: 2500 },
  "Batu Obsidian Ungu": { emoji: "🟪", rarity: "Epic", weight: 5, price: 1800 },
  "Tengkorak Purba": { emoji: "💀", rarity: "Epic", weight: 8, price: 3000 },
  "Meteorit Hitam": { emoji: "☄️", rarity: "Legendary", weight: 20, price: 10000 },
  "Intan Murni": { emoji: "✨", rarity: "Legendary", weight: 0.5, price: 15000 },
  "Jantung Gunung": { emoji: "🌋", rarity: "Legendary", weight: 50, price: 25000 },
  "Permata Infinity": { emoji: "🌌💎", rarity: "Mythic", weight: 0.1, price: 100000 },
  // --- FISHING ITEMS ---
  "Sampah Plastik": { emoji: "🗑️", rarity: "Junk", weight: 0.1, price: 1 },
  "Kaleng Bekas": { emoji: "🥫", rarity: "Junk", weight: 0.2, price: 2 },
  "Sepatu Kusam": { emoji: "👞", rarity: "Junk", weight: 0.5, price: 3 },
  "Ban Bekas": { emoji: "🛞", rarity: "Junk", weight: 2.5, price: 5 },
  "Botol Kaca": { emoji: "🍾", rarity: "Junk", weight: 0.3, price: 2 },
  "Kertas Lecek": { emoji: "📄", rarity: "Junk", weight: 0.1, price: 1 },
  "Ranting Kayu": { emoji: "🪵", rarity: "Junk", weight: 1, price: 2 },
  "Plastik Kresek": { emoji: "🛍️", rarity: "Junk", weight: 0.1, price: 1 },
  "Gelas Pecah": { emoji: "🥃", rarity: "Junk", weight: 0.2, price: 1 },
  "Baju Sobek": { emoji: "👕", rarity: "Junk", weight: 0.3, price: 2 },
  "Celana Bolong": { emoji: "👖", rarity: "Junk", weight: 0.4, price: 2 },
  "Kaus Kaki Bau": { emoji: "🧦", rarity: "Junk", weight: 0.1, price: 1 },
  "Batu Bata": { emoji: "🧱", rarity: "Junk", weight: 1.5, price: 4 },
  "Tulang Ikan": { emoji: "🦴", rarity: "Junk", weight: 0.1, price: 1 },
  "Kawat Berkarat": { emoji: "🪢", rarity: "Junk", weight: 0.5, price: 3 },
  "Ikan Mujair": { emoji: "🐟", rarity: "Common", weight: 0.5, price: 10 },
  "Ikan Lele": { emoji: "🐡", rarity: "Common", weight: 0.8, price: 12 },
  "Ikan Nila": { emoji: "🐟", rarity: "Common", weight: 0.6, price: 11 },
  "Ikan Sepat": { emoji: "🐠", rarity: "Common", weight: 0.2, price: 8 },
  "Ikan Teri": { emoji: "🐟", rarity: "Common", weight: 0.1, price: 5 },
  "Ikan Mas": { emoji: "🐟", rarity: "Common", weight: 1, price: 15 },
  "Ikan Gabus": { emoji: "🐡", rarity: "Common", weight: 1.2, price: 18 },
  "Ikan Patin": { emoji: "🐟", rarity: "Common", weight: 1.5, price: 20 },
  "Ikan Gurame Kecil": { emoji: "🐟", rarity: "Common", weight: 0.8, price: 14 },
  "Udang Kecil": { emoji: "🦐", rarity: "Common", weight: 0.1, price: 15 },
  "Kepiting Kecil": { emoji: "🦀", rarity: "Common", weight: 0.3, price: 20 },
  "Cumi-Cumi": { emoji: "🦑", rarity: "Common", weight: 0.5, price: 25 },
  "Ikan Bandeng": { emoji: "🐟", rarity: "Common", weight: 0.7, price: 16 },
  "Ikan Belanak": { emoji: "🐟", rarity: "Common", weight: 0.6, price: 12 },
  "Ikan Tongkol Biasa": { emoji: "🐟", rarity: "Common", weight: 1.1, price: 22 },
  "Ikan Bawal": { emoji: "🐠", rarity: "Uncommon", weight: 2.5, price: 50 },
  "Ikan Kerapu": { emoji: "🐡", rarity: "Uncommon", weight: 3, price: 65 },
  "Ikan Kakap Merah": { emoji: "🐟", rarity: "Uncommon", weight: 4, price: 80 },
  "Ikan Tuna Kecil": { emoji: "🐟", rarity: "Uncommon", weight: 5, price: 90 },
  "Ikan Tenggiri": { emoji: "🐟", rarity: "Uncommon", weight: 3.5, price: 70 },
  "Lobster Kecil": { emoji: "🦞", rarity: "Uncommon", weight: 1, price: 95 },
  "Kepiting Bakau": { emoji: "🦀", rarity: "Uncommon", weight: 2, price: 85 },
  "Gurita": { emoji: "🐙", rarity: "Uncommon", weight: 3, price: 75 },
  "Pari Manta Kecil": { emoji: "🪼", rarity: "Uncommon", weight: 4.5, price: 88 },
  "Ikan Salmon": { emoji: "🍣", rarity: "Uncommon", weight: 2.8, price: 90 },
  "Bulu Babi": { emoji: "🦔", rarity: "Uncommon", weight: 0.5, price: 55 },
  "Kerang Hijau": { emoji: "🦪", rarity: "Uncommon", weight: 0.2, price: 40 },
  "Ikan Pari": { emoji: "🪁", rarity: "Uncommon", weight: 3.2, price: 60 },
  "Bintang Laut": { emoji: "⭐", rarity: "Uncommon", weight: 0.3, price: 50 },
  "Kuda Laut": { emoji: "🎠", rarity: "Uncommon", weight: 0.1, price: 100 },
  "Ikan Arwana": { emoji: "🐉", rarity: "Rare", weight: 2, price: 300 },
  "Ikan Koi Super": { emoji: "🎏", rarity: "Rare", weight: 3, price: 250 },
  "Hiu Karang": { emoji: "🦈", rarity: "Rare", weight: 25, price: 400 },
  "Tuna Sirip Biru": { emoji: "🐟", rarity: "Rare", weight: 50, price: 500 },
  "Lobster Raksasa": { emoji: "🦞", rarity: "Rare", weight: 5, price: 450 },
  "Marlin Biru": { emoji: "🐟", rarity: "Rare", weight: 45, price: 480 },
  "Ikan Todak": { emoji: "🗡️", rarity: "Rare", weight: 30, price: 350 },
  "Penyu Laut (Dilepas)": { emoji: "🐢", rarity: "Rare", weight: 40, price: 200 },
  "Ikan Badut Langka": { emoji: "🤡", rarity: "Rare", weight: 0.5, price: 300 },
  "Belut Listrik": { emoji: "⚡", rarity: "Rare", weight: 5, price: 380 },
  "Hiu Putih Raksasa": { emoji: "🦈", rarity: "Epic", weight: 300, price: 2500 },
  "Paus Pembunuh (Orca)": { emoji: "🐋", rarity: "Epic", weight: 500, price: 3000 },
  "Gurita Raksasa Kraken": { emoji: "🦑", rarity: "Epic", weight: 200, price: 2000 },
  "Ikan Raja Laut": { emoji: "👑", rarity: "Epic", weight: 150, price: 1500 },
  "Paus Beluga": { emoji: "🐳", rarity: "Epic", weight: 400, price: 2800 },
  "Manta Ray Raksasa": { emoji: "🛸", rarity: "Epic", weight: 250, price: 1800 },
  "Hiu Martil": { emoji: "🔨", rarity: "Epic", weight: 180, price: 1200 },
  "Ikan Purba Coelacanth": { emoji: "🦖", rarity: "Epic", weight: 80, price: 2200 },
  "Megalodon": { emoji: "🦈✨", rarity: "Legendary", weight: 5000, price: 15000 },
  "Leviathan": { emoji: "🐉🌊", rarity: "Legendary", weight: 9999, price: 25000 },
  "MosaSaurus": { emoji: "🦕", rarity: "Legendary", weight: 8000, price: 20000 },
  "Cumi-Cumi Kosmik": { emoji: "🌌🦑", rarity: "Legendary", weight: 1000, price: 18000 },
  "Peti Karun Emas": { emoji: "🪙", rarity: "Mythic", weight: 10, price: 50000 },
  "Mahkota Poseidon": { emoji: "👑🔱", rarity: "Mythic", weight: 2, price: 100000 },
  "Trident Legendaris": { emoji: "🔱", rarity: "Mythic", weight: 15, price: 150000 }
};

function getItemInfo(itemName) {
  return ITEM_DB[itemName] || null;
}

// ==========================================
// INVENTORY / TAS PARSER
// ==========================================
function parseTas(tasStr) {
  if (!tasStr) return {};
  const tas = {};
  const parts = tasStr.split(',');
  for (const part of parts) {
    if (!part.includes(':')) continue;
    const [item, qty] = part.split(':').map(s => s.trim());
    if (item && qty && !isNaN(parseInt(qty))) {
      tas[item] = parseInt(qty);
    }
  }
  return tas;
}

function stringifyTas(tasObj) {
  const parts = [];
  for (const [item, qty] of Object.entries(tasObj)) {
    if (qty > 0) parts.push(`${item}:${qty}`);
  }
  return parts.join(', ');
}

// ==========================================
// GAME: MANCING
// ==========================================
function playMancing(phone, currentWp, currentWm, currentPermata, currentTasStr) {
  const BIAYA_UMPAN = 50;
  const COOLDOWN_MS = 60 * 1000; // 1 menit

  if (currentWp < BIAYA_UMPAN) {
    return {
      success: false,
      message: `━━━━━━━ ⟡ ━━━━━━━\n\nUang kamu tidak cukup untuk beli umpan!\nButuh: ${BIAYA_UMPAN} WP\nUangmu: ${currentWp} WP`
    };
  }

  const userEco = getUserData(phone);
  const now = Date.now();
  if (now - userEco.last_mancing < COOLDOWN_MS) {
    const sisa = Math.ceil((COOLDOWN_MS - (now - userEco.last_mancing)) / 1000);
    return {
      success: false,
      message: `━━━━━━━ ⟡ ━━━━━━━\n\nIkan sedang bersembunyi. Tunggu *${sisa} detik* lagi untuk memancing!`
    };
  }

  const petInfo = PET_DB[userEco.pet_type];
  const petLuck = petInfo ? petInfo.luck : 0;

  // Update cooldown
  updateUserData(phone, { last_mancing: now });

  // Gacha logic
  const rand = Math.random();
  let selectedRarity = "";
  
  // Adjust probabilities with pet luck
  const mythicChance = 0.002 + (petLuck * 0.005);
  const legendaryChance = 0.008 + (petLuck * 0.015);
  const epicChance = 0.02 + (petLuck * 0.03);
  const rareChance = 0.07 + (petLuck * 0.08);
  const uncommonChance = 0.15 + (petLuck * 0.1);
  const commonChance = 0.50; // common fills the rest
  
  let cMythic = mythicChance;
  let cLeg = cMythic + legendaryChance;
  let cEpic = cLeg + epicChance;
  let cRare = cEpic + rareChance;
  let cUncom = cRare + uncommonChance;
  let cCom = cUncom + commonChance;

  if (rand < cMythic) selectedRarity = "Mythic";
  else if (rand < cLeg) selectedRarity = "Legendary";
  else if (rand < cEpic) selectedRarity = "Epic";
  else if (rand < cRare) selectedRarity = "Rare";
  else if (rand < cUncom) selectedRarity = "Uncommon";
  else if (rand < cCom) selectedRarity = "Common";
  else selectedRarity = "Junk";

  let wpChange = -BIAYA_UMPAN; // Kurangi biaya umpan
  let wmChange = 0;
  let permataChange = 0;
  let resultMsg = "";
  
  const tasObj = parseTas(currentTasStr || "");

  const itemsOfRarity = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].rarity === selectedRarity && !["🟫", "🪨", "⏳", "🌫️", "🧱", "💩", "🌿", "🪞", "⚫", "🟠", "🪙", "⬛", "⛓️", "🏺", "🟡", "🧂", "🏛️", "⚙️", "🥈", "🦴", "🦷", "🥉", "⚪", "🧊", "🥇", "🔮", "💜", "💛", "💚", "❤️", "💙", "🪲", "🟢", "💎", "♦️", "🔷", "🟩", "🟪", "💀", "☄️", "✨", "🌋", "🌌💎"].includes(ITEM_DB[k].emoji));
  const selectedItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
  const itemInfo = ITEM_DB[selectedItem];
  
  tasObj[selectedItem] = (tasObj[selectedItem] || 0) + 1;

  if (selectedRarity === "Junk") {
    resultMsg = `Tarik!! Yahh.. malah nyangkut dapet *${selectedItem}* ${itemInfo.emoji} (${itemInfo.weight}kg)\n1 '${selectedItem}' dimasukkan ke dalam Tas.`;
  } else if (selectedRarity === "Common" || selectedRarity === "Uncommon") {
    resultMsg = `Kamu menarik kailmu dan mendapatkan *1 ekor ${selectedItem}* ${itemInfo.emoji} (${itemInfo.weight}kg)!\nCek tasmu (!tas) dan jual dengan (!sell "${selectedItem}") 💰`;
  } else if (selectedRarity === "Rare") {
    resultMsg = `🎣 *WOAH! TANGKAPAN LANGKA!* 🎣\nKamu menarik *${selectedItem}* ${itemInfo.emoji} (${itemInfo.weight}kg) dari dasar sungai!\n1 '${selectedItem}' dimasukkan ke dalam Tas!`;
  } else if (selectedRarity === "Epic") {
    resultMsg = `🔥 *EPIC CATCH!!* 🔥\nTenaga tarikan luar biasa!! Kamu mendapatkan *${selectedItem}* ${itemInfo.emoji} seberat ${itemInfo.weight}kg!\n1 '${selectedItem}' dimasukkan ke dalam Tas!`;
  } else if (selectedRarity === "Legendary") {
    resultMsg = `✨ *L-L-LEGENDARY CATCH!!* ✨\nSeluruh sungai bergetar hebat! Kamu menangkap monster legendaris *${selectedItem}* ${itemInfo.emoji} seberat ${itemInfo.weight}kg!!`;
  } else if (selectedRarity === "Mythic") {
    resultMsg = `🌌 *MYTHICAL DISCOVERY!!* 🌌\nKamu telah menemukan peninggalan purba: *${selectedItem}* ${itemInfo.emoji} seberat ${itemInfo.weight}kg!! Sungguh di luar nalar!!`;
  }

  // Bonus Chance Permata (5%)
  if (Math.random() < 0.05) {
    permataChange += 1;
    resultMsg += `\n\n💎 *Bonus:* Kamu menemukan *1 Permata* yang berkilau!`;
  }

  let petMsg = petInfo ? `\n\n🐾 _${userEco.pet_type} membantumu mencari spot mancing terbaik (+${Math.round(petLuck * 100)}% Luck)!_` : "";

  return {
    success: true,
    wpChange,
    wmChange,
    permataChange,
    newTasStr: stringifyTas(tasObj),
    message: `━━━━━━━ ⟡ ━━━━━━━\n\n${resultMsg}${petMsg}`
  };
}

function sellItem(item, qtyToSellStr, currentTasStr) {
  const tasObj = parseTas(currentTasStr || "");
  
  if (item.toLowerCase() === 'all' || item.toLowerCase() === 'semua') {
    let totalWp = 0;
    const soldItems = [];
    for (const [k, v] of Object.entries(tasObj)) {
      if (v > 0) {
        const price = (ITEM_DB[k] ? ITEM_DB[k].price : 10);
        totalWp += price * v;
        soldItems.push(`${v}x ${k}`);
        delete tasObj[k];
      }
    }
    
    if (soldItems.length === 0) {
      return { success: false, wpChange: 0, newTasStr: currentTasStr, message: `━━━━━━━ ⟡ ━━━━━━━\n\nTas kamu kosong! Tidak ada yang bisa dijual.` };
    }
    
    return {
      success: true,
      wpChange: totalWp,
      newTasStr: stringifyTas(tasObj),
      message: `━━━━━━━ ⟡ ━━━━━━━\n\nBerhasil menjual *SEMUA BARANG* di tas:\n${soldItems.join(", ")}\n\nTotal Pendapatan: *${totalWp} WP* 💰!`
    };
  }

  // Selling specific item
  let targetItemKey = Object.keys(tasObj).find(k => k.toLowerCase() === item.toLowerCase());
  if (!targetItemKey) {
    targetItemKey = Object.keys(tasObj).find(k => k.toLowerCase().includes(item.toLowerCase()));
  }
  
  let qtyToSell = parseInt(qtyToSellStr);
  if (qtyToSellStr === 'all' || qtyToSellStr === 'semua') {
    qtyToSell = targetItemKey ? tasObj[targetItemKey] : 0;
  }
  
  if (isNaN(qtyToSell) || qtyToSell <= 0) {
    qtyToSell = 1;
  }
  
  if (!targetItemKey || tasObj[targetItemKey] < qtyToSell) {
     return { success: false, wpChange: 0, newTasStr: currentTasStr, message: `━━━━━━━ ⟡ ━━━━━━━\n\nKamu tidak punya ${qtyToSell} "${item}" di dalam tas!` };
  }
  
  const pricePerItem = (ITEM_DB[targetItemKey] ? ITEM_DB[targetItemKey].price : 10);
  const totalWp = pricePerItem * qtyToSell;
  
  tasObj[targetItemKey] -= qtyToSell;
  if (tasObj[targetItemKey] <= 0) delete tasObj[targetItemKey];
  
  return {
    success: true,
    wpChange: totalWp,
    newTasStr: stringifyTas(tasObj),
    message: `━━━━━━━ ⟡ ━━━━━━━\n\nBerhasil menjual ${qtyToSell} ${targetItemKey} seharga *${totalWp} WP*!`
  };
}

// ==========================================
// GAME: SLOT
// ==========================================
function playSlot(phone, taruhan, currentWp) {
  if (taruhan < 100) {
    return { success: false, message: "━━━━━━━ ⟡ ━━━━━━━\n\nMinimal taruhan judi slot adalah 100 WP!" };
  }
  if (currentWp < taruhan) {
    return { success: false, message: `━━━━━━━ ⟡ ━━━━━━━\n\nUang kamu tidak cukup!\nTaruhan: ${taruhan} WP\nWP kamu: ${currentWp}` };
  }

  const emotes = ['🍒', '🍋', '💎', '🔔', '7️⃣'];
  const r1 = emotes[Math.floor(Math.random() * emotes.length)];
  const r2 = emotes[Math.floor(Math.random() * emotes.length)];
  const r3 = emotes[Math.floor(Math.random() * emotes.length)];

  let wpChange = -taruhan;
  let resultText = `[ ${r1} | ${r2} | ${r3} ]\n\n`;

  if (r1 === r2 && r2 === r3) {
    // Jackpot
    let multiplier = 5;
    if (r1 === '7️⃣') multiplier = 10;
    if (r1 === '💎') multiplier = 15;
    
    const win = taruhan * multiplier;
    wpChange += win;
    resultText += `🎰 **JACKPOT!!** 🎰\nKamu menang ${multiplier}x lipat!\n*+${win} WP* 💰`;
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    // Minor win (balik modal + dikit)
    const win = Math.floor(taruhan * 1.5);
    wpChange += win;
    resultText += `Lumayan, dua gambar sama!\nKamu memenangkan *+${win} WP* 💰`;
  } else {
    // Lose
    resultText += `Zonk! Coba lagi ya bandar berterima kasih atas sumbangan *-${taruhan} WP* mu 😭`;
  }

  return {
    success: true,
    wpChange,
    wmChange: 0,
    permataChange: 0,
    message: `━━━━━━━ ⟡ ━━━━━━━\n\nTaruhan: ${taruhan} WP\n\n${resultText}`
  };
}

// ==========================================
// GAME: COINFLIP
// ==========================================
function playCoinflip(phone, tebakan, taruhan, currentWp) {
  if (taruhan < 100) {
    return { success: false, message: "━━━━━━━ ⟡ ━━━━━━━\n\nMinimal taruhan coinflip adalah 100 WP!" };
  }
  if (currentWp < taruhan) {
    return { success: false, message: `━━━━━━━ ⟡ ━━━━━━━\n\nUang kamu tidak cukup!\nTaruhan: ${taruhan} WP\nWP kamu: ${currentWp}` };
  }

  const pilihan = ['head', 'tail'];
  if (!pilihan.includes(tebakan)) {
    return { success: false, message: "━━━━━━━ ⟡ ━━━━━━━\n\nPilih antara 'head' atau 'tail'!\nContoh: !coinflip head 500" };
  }

  const hasilKoin = Math.random() < 0.5 ? 'head' : 'tail';
  let wpChange = 0;
  let resultText = `Koin dilempar... dan hasilnya: *${hasilKoin.toUpperCase()}*!\n\n`;

  if (tebakan === hasilKoin) {
    wpChange = taruhan; // Menang 100% dari taruhan
    resultText += `Tebakanmu benar! Kamu menang *+${taruhan} WP* 💰`;
  } else {
    wpChange = -taruhan; // Kalah taruhan
    resultText += `Tebakanmu salah! Kamu kehilangan *-${taruhan} WP* 😭`;
  }

  return {
    success: true,
    wpChange,
    wmChange: 0,
    permataChange: 0,
    message: `━━━━━━━ ⟡ ━━━━━━━\n\n${resultText}`
  };
}

// ==========================================
// GAME: TAMBANG
// ==========================================
function performMiningGacha(pickaxeLuck, petLuck, tasObj) {
  const rand = Math.random();
  let selectedRarity = "";
  
  const totalLuck = pickaxeLuck + petLuck;

  // Adjust probabilities based on pickaxe + pet luck
  const mythicChance = 0.002 + (totalLuck * 0.01); 
  const legendaryChance = 0.008 + (totalLuck * 0.02);
  const epicChance = 0.02 + (totalLuck * 0.05);
  const rareChance = 0.07 + (totalLuck * 0.1);
  const uncommonChance = 0.15 + (totalLuck * 0.15);
  const commonChance = 0.50; // common takes the rest or gets slightly reduced
  
  // Create cumulative chances
  let cMythic = mythicChance;
  let cLeg = cMythic + legendaryChance;
  let cEpic = cLeg + epicChance;
  let cRare = cEpic + rareChance;
  let cUncom = cRare + uncommonChance;
  let cCom = cUncom + commonChance;

  if (rand < cMythic) selectedRarity = "Mythic";
  else if (rand < cLeg) selectedRarity = "Legendary";
  else if (rand < cEpic) selectedRarity = "Epic";
  else if (rand < cRare) selectedRarity = "Rare";
  else if (rand < cUncom) selectedRarity = "Uncommon";
  else if (rand < cCom) selectedRarity = "Common";
  else selectedRarity = "Junk";

  const itemsOfRarity = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].rarity === selectedRarity && ["🟫", "🪨", "⏳", "🌫️", "🧱", "💩", "🌿", "🪞", "⚫", "🟠", "🪙", "⬛", "⛓️", "🏺", "🟡", "🧂", "🏛️", "⚙️", "🥈", "🦴", "🦷", "🥉", "⚪", "🧊", "🥇", "🔮", "💜", "💛", "💚", "❤️", "💙", "🪲", "🟢", "💎", "♦️", "🔷", "🟩", "🟪", "💀", "☄️", "✨", "🌋", "🌌💎"].includes(ITEM_DB[k].emoji));
  
  // Fallback to manual mining list if filter fails
  const miningList = itemsOfRarity.length > 0 ? itemsOfRarity : Object.keys(ITEM_DB).filter(k => ITEM_DB[k].rarity === selectedRarity);
  const selectedItem = miningList[Math.floor(Math.random() * miningList.length)];
  
  tasObj[selectedItem] = (tasObj[selectedItem] || 0) + 1;
  
  let gotPermata = false;
  if (Math.random() < (0.02 + pickaxeLuck + petLuck)) { // 2% base + luck chance
    gotPermata = true;
  }
  
  return { selectedItem, gotPermata, rarity: selectedRarity };
}

function playTambang(phone, currentWp, currentTasStr, remoteJid = "", senderName = "Pemain") {
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 menit

  const userEco = getUserData(phone);
  
  if (!userEco.pickaxe || userEco.pickaxe <= 0 || !userEco.pickaxe_type) {
    const tasObj = parseTas(currentTasStr || "");
    let hasPixInBag = false;
    for (const key of Object.keys(tasObj)) {
      if (PICKAXE_DB[key] && tasObj[key] > 0) hasPixInBag = true;
    }

    if (hasPixInBag) {
      return {
        success: false,
        message: `━━━━━━━『 ⛏️ TAMBANG 』━━━━━━━\n\nKamu belum memakai Pickaxe!\nPickaxe ada di dalam Tas milikmu. Silakan ketik \`!pake pickaxe\` untuk menggunakannya sebelum menambang.`
      };
    } else {
      return {
        success: false,
        message: `━━━━━━━『 ⛏️ TAMBANG 』━━━━━━━\n\nKamu tidak memiliki Pickaxe (Beliung)!\nGunakan fitur \`!toko\` untuk membelinya.`
      };
    }
  }

  const isGroup = remoteJid && remoteJid.endsWith('@g.us');
  let groupInfo = null;
  let maxCapacity = 20;
  if (isGroup) {
    groupInfo = getGroupMiningInfo(remoteJid);
    if (groupInfo) maxCapacity = groupInfo.capacity;
  }

  const now = Date.now();
  if (now - userEco.last_tambang >= COOLDOWN_MS) {
    userEco.tambang_capacity = maxCapacity; // Restore capacity based on group level
  } else if (userEco.tambang_capacity > maxCapacity) {
    userEco.tambang_capacity = maxCapacity; // Adjust to new max if lowered
  }

  if (userEco.tambang_capacity <= 0) {
    const sisa = Math.ceil((COOLDOWN_MS - (now - userEco.last_tambang)) / 1000 / 60);
    return {
      success: false,
      message: `━━━━━━━ ⟡ ━━━━━━━\n\nBatu tambang belum pulih. Tunggu *${sisa} menit* lagi agar gua tambang terbuka kembali!`
    };
  }

  const pickaxeInfo = PICKAXE_DB[userEco.pickaxe_type];
  const pickaxeLuck = pickaxeInfo ? pickaxeInfo.luck : 0;
  const petInfo = PET_DB[userEco.pet_type];
  const petLuck = petInfo ? petInfo.luck : 0;
  
  const tasObj = parseTas(currentTasStr || "");
  const { selectedItem, gotPermata, rarity } = performMiningGacha(pickaxeLuck, petLuck, tasObj);
  
  const itemInfo = ITEM_DB[selectedItem];
  let permataChange = 0;
  let resultMsg = "";
  
  if (rarity === "Junk") {
    resultMsg = `Kamu memukul batu dengan kencang tapi malah dapat *${selectedItem}* ${itemInfo.emoji} (${itemInfo.weight}kg)\n1 '${selectedItem}' dimasukkan ke dalam Tas.`;
  } else if (rarity === "Common" || rarity === "Uncommon") {
    resultMsg = `Sring!! Kamu menambang dan mendapatkan *1 ${selectedItem}* ${itemInfo.emoji} (${itemInfo.weight}kg)!\nCek tasmu (!tas) dan jual dengan (!sell "${selectedItem}") 💰`;
  } else if (rarity === "Rare") {
    resultMsg = `⛏️ *WOAH! BATU LANGKA!* ⛏️\nKamu menggali dalam dan menemukan *${selectedItem}* ${itemInfo.emoji} (${itemInfo.weight}kg)!\n1 '${selectedItem}' dimasukkan ke dalam Tas!`;
  } else if (rarity === "Epic") {
    resultMsg = `🔥 *EPIC MINE!!* 🔥\nKilauan menyilaukan muncul dari dalam gua! Kamu mendapatkan *${selectedItem}* ${itemInfo.emoji} seberat ${itemInfo.weight}kg!\n1 '${selectedItem}' dimasukkan ke dalam Tas!`;
  } else if (rarity === "Legendary" || rarity === "Mythic") {
    resultMsg = `✨ *L-L-LEGENDARY MINE!!* ✨\nGempa bumi kecil terjadi! Kamu berhasil menggali harta purba *${selectedItem}* ${itemInfo.emoji} seberat ${itemInfo.weight}kg!!`;
  }

  if (gotPermata) {
    permataChange = 1;
    resultMsg += `\n\n💎 *Bonus Hoki:* Kamu menemukan *1 Permata* di sela-sela bebatuan!`;
  }

  // Update cooldown and durability
  const newDurability = userEco.pickaxe - 1;
  const newCapacity = userEco.tambang_capacity - 1;
  let durMsg = `\n\nKetahanan ${userEco.pickaxe_type}: ${newDurability} | Sisa Batuan Gua: ${newCapacity}`;
  
  const updates = { pickaxe: newDurability, tambang_capacity: newCapacity };
  if (userEco.tambang_capacity === maxCapacity) {
    updates.last_tambang = now; // Start cooldown timer on the first hit
  }
  
  if (newDurability <= 0) {
    durMsg += `\n\n💥 *KRAK!* ${userEco.pickaxe_type} milikmu telah hancur karena durabilitas habis! Beli lagi pakai !beli pix`;
    updates.pickaxe_type = "";
    updates.pickaxe = 0;
  }
  
  updateUserData(phone, updates);

  let petMsg = petInfo ? `\n\n🐾 _${userEco.pet_type} membantumu mencari batu (+${Math.round(petLuck * 100)}% Luck)_` : "";

  let resultObj = {
    success: true,
    wpChange: 0,
    wmChange: 0,
    permataChange,
    newTasStr: stringifyTas(tasObj),
    message: `━━━━━━━ ⟡ ━━━━━━━\n\n${resultMsg}${durMsg}${petMsg}\n\n💡 _Tip: Ketik *!tambang auto* untuk menambang secara otomatis!_`
  };

  // Group XP Logic
  if (isGroup && groupInfo) {
    const groupData = getGroupData(remoteJid);
    let newXp = BigInt(groupData.mining_xp) + 1n;
    
    if (newXp >= groupInfo.requiredXp && groupData.mining_level < 120) {
      const nextLevel = groupData.mining_level + 1;
      updateGroupData(remoteJid, { mining_level: nextLevel, mining_xp: newXp.toString() });
      
      const nextStage = MINING_STAGES.find(s => s.level === nextLevel) || MINING_STAGES[MINING_STAGES.length - 1];
      const rewardWp = nextLevel * 250;
      
      resultObj.levelUp = true;
      resultObj.levelUpMessage = `━━━━━━━━━━ ⟡ LEVEL UP ⟡ ━━━━━━━━━━\n\n📈 Mining Level : ${groupData.mining_level} → ${nextLevel}\n🌍 Area Baru    : ${nextStage.name}\n\n💎 Hadiah:\n• +500 XP\n• +${rewardWp.toLocaleString('id-ID')} WP\n• Unlock Area Baru\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Setiap ayunan pickaxe membawa\nkamu lebih dekat ke legenda."\n━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      resultObj.rewardWp = rewardWp;
    } else {
      updateGroupData(remoteJid, { mining_xp: newXp.toString() });
    }
  }

  return resultObj;
}

function playTambangAuto(phone, currentWp, currentTasStr, remoteJid = "", senderName = "Pemain") {
  const userEco = getUserData(phone);
  
  if (!userEco.pickaxe || userEco.pickaxe <= 0 || !userEco.pickaxe_type) {
    return {
      success: false,
      message: `━━━━━━━ ⟡ ━━━━━━━\n\nKamu tidak memiliki Pickaxe (Beliung)!\nGunakan fitur \`!beli pix\` untuk melihat toko pickaxe.`
    };
  }

  const COOLDOWN_MS = 5 * 60 * 1000;
  const isGroup = remoteJid && remoteJid.endsWith('@g.us');
  let groupInfo = null;
  let maxCapacity = 20;
  if (isGroup) {
    groupInfo = getGroupMiningInfo(remoteJid);
    if (groupInfo) maxCapacity = groupInfo.capacity;
  }

  const now = Date.now();
  if (now - userEco.last_tambang >= COOLDOWN_MS) {
    userEco.tambang_capacity = maxCapacity;
  } else if (userEco.tambang_capacity > maxCapacity) {
    userEco.tambang_capacity = maxCapacity;
  }

  if (userEco.tambang_capacity <= 0) {
    const sisa = Math.ceil((COOLDOWN_MS - (now - userEco.last_tambang)) / 1000 / 60);
    return {
      success: false,
      message: `━━━━━━━ ⟡ ━━━━━━━\n\nBatu tambang sudah habis dikeruk. Tunggu *${sisa} menit* lagi sebelum bisa auto tambang!`
    };
  }

  const pickaxeInfo = PICKAXE_DB[userEco.pickaxe_type];
  const pickaxeLuck = pickaxeInfo ? pickaxeInfo.luck : 0;
  const petInfo = PET_DB[userEco.pet_type];
  const petLuck = petInfo ? petInfo.luck : 0;
  
  // You can only auto-mine as many times as your pickaxe durability AND the mine's capacity
  const usesLeft = Math.min(userEco.pickaxe, userEco.tambang_capacity);
  
  const tasObj = parseTas(currentTasStr || "");
  let permataChange = 0;
  const drops = {};

  for (let i = 0; i < usesLeft; i++) {
    const { selectedItem, gotPermata } = performMiningGacha(pickaxeLuck, petLuck, tasObj);
    drops[selectedItem] = (drops[selectedItem] || 0) + 1;
    if (gotPermata) permataChange++;
  }

  // Format the loot summary
  let lootMsg = "";
  const sortedDrops = Object.entries(drops).sort((a, b) => {
    const pA = ITEM_DB[a[0]] ? ITEM_DB[a[0]].price : 0;
    const pB = ITEM_DB[b[0]] ? ITEM_DB[b[0]].price : 0;
    return pA - pB; // Urutkan dari yang termurah (ringan) ke termahal (berat)
  });
  
  for (const [item, qty] of sortedDrops) {
    const emoji = ITEM_DB[item] ? ITEM_DB[item].emoji : "📦";
    lootMsg += `• ${emoji} ${item}: ${qty}x\n`;
  }
  
  if (permataChange > 0) {
    lootMsg += `\n💎 *Permata:* +${permataChange}\n`;
  }

  const newDurability = userEco.pickaxe - usesLeft;
  const newCapacity = userEco.tambang_capacity - usesLeft;
  const updates = { pickaxe: newDurability, tambang_capacity: newCapacity };
  
  if (userEco.tambang_capacity === maxCapacity) {
    updates.last_tambang = now; // Start timer if it was full
  }

  let finalMsg = `\nKamu menghabiskan *${usesLeft}x ayunan* sekaligus!`;
  if (newDurability <= 0) {
    updates.pickaxe = 0;
    updates.pickaxe_type = "";
    finalMsg += `\n💥 *KRAK!* ${userEco.pickaxe_type} milikmu telah hancur!`;
  }
  if (newCapacity <= 0) {
    finalMsg += `\n🪨 Batu tambang gua sudah habis untuk sementara!`;
  }
  finalMsg += `\nKetahanan Pickaxe: ${newDurability} | Sisa Batuan Gua: ${newCapacity}`;

  updateUserData(phone, updates);

  let resultObj = {
    success: true,
    wpChange: 0,
    wmChange: 0,
    permataChange,
    newTasStr: stringifyTas(tasObj),
    autoSteps: [],
    message: `━━━━━━━ ⟡ ━━━━━━━\n\nBzzzt! Mesin auto-tambang selesai!${finalMsg}\n\n*🎁 Hasil Tambang:*\n${lootMsg}`
  };
  
  for (const [item, qty] of sortedDrops) {
    const emoji = ITEM_DB[item] ? ITEM_DB[item].emoji : "📦";
    resultObj.autoSteps.push(`• ${emoji} ${item}: ${qty}x`);
  }
  if (permataChange > 0) {
    resultObj.autoSteps.push(`💎 *Permata:* +${permataChange}`);
  }

  // Group XP Logic
  if (isGroup && groupInfo) {
    const groupData = getGroupData(remoteJid);
    let newXp = BigInt(groupData.mining_xp) + BigInt(usesLeft);
    
    if (newXp >= groupInfo.requiredXp && groupData.mining_level < 120) {
      const nextLevel = groupData.mining_level + 1;
      updateGroupData(remoteJid, { mining_level: nextLevel, mining_xp: newXp.toString() });
      
      const nextStage = MINING_STAGES.find(s => s.level === nextLevel) || MINING_STAGES[MINING_STAGES.length - 1];
      const rewardWp = nextLevel * 250;
      
      resultObj.levelUp = true;
      resultObj.levelUpMessage = `━━━━━━━━━━ ⟡ LEVEL UP ⟡ ━━━━━━━━━━\n\n📈 Mining Level : ${groupData.mining_level} → ${nextLevel}\n🌍 Area Baru    : ${nextStage.name}\n\n💎 Hadiah:\n• +500 XP\n• +${rewardWp.toLocaleString('id-ID')} WP\n• Unlock Area Baru\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Setiap ayunan pickaxe membawa\nkamu lebih dekat ke legenda."\n━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      resultObj.rewardWp = rewardWp;
    } else {
      updateGroupData(remoteJid, { mining_xp: newXp.toString() });
    }
  }

  return resultObj;
}

function buyItem(phone, itemStr, currentWp, currentWm, currentTasStr) {
  const userEco = getUserData(phone);
  
  if (itemStr === 'pakan' || itemStr === 'pakan pet' || itemStr === 'makanan pet') {
    const HARGA_PAKAN = 1000; // 1000 WP
    if (currentWp < HARGA_PAKAN) {
      return { success: false, message: `━━━━━━━『 🛒 TOKO 』━━━━━━━\n\nUang WP tidak cukup untuk membeli *Pakan Pet*!\nHarga: ${HARGA_PAKAN} WP\nUangmu: ${currentWp} WP` };
    }
    updateUserData(phone, { pakan_pet: userEco.pakan_pet + 1 });
    return {
      success: true,
      wpChange: -HARGA_PAKAN,
      wmChange: 0,
      permataChange: 0,
      message: `━━━━━━━『 🛒 TOKO 』━━━━━━━\n\nBerhasil membeli *1x Pakan Pet* seharga ${HARGA_PAKAN} WP!\nGunakan \`!kasihmakan\` untuk memberinya makan dan menaikkan berat badannya!`
    };
  }

  // Normalize "pickaxe" to "pix" for searching since DB keys use "Pix"
  const searchStr = itemStr.replace(/\bpickaxe\b/gi, 'pix');
  
  // Check in PICKAXE_DB
  let targetPix = Object.keys(PICKAXE_DB).find(k => k.toLowerCase() === searchStr.toLowerCase());
  if (!targetPix) targetPix = Object.keys(PICKAXE_DB).find(k => k.toLowerCase().includes(searchStr.toLowerCase()));

  if (targetPix) {
    const pixInfo = PICKAXE_DB[targetPix];
    if (currentWp < pixInfo.price) {
      return { success: false, message: `━━━━━━━『 🛒 TOKO 』━━━━━━━\n\nUang tidak cukup untuk membeli *${targetPix}*!\nHarga: ${pixInfo.price} WP\nUangmu: ${currentWp} WP` };
    }

    const tasObj = parseTas(currentTasStr || "");
    tasObj[targetPix] = (tasObj[targetPix] || 0) + 1;
    let newTasArr = [];
    for (const [k, v] of Object.entries(tasObj)) {
      newTasArr.push(`${k}:${v}`);
    }

    return {
      success: true,
      wpChange: -pixInfo.price,
      wmChange: 0,
      permataChange: 0,
      newTasStr: newTasArr.join(','),
      message: `━━━━━━━『 🛒 TOKO 』━━━━━━━\n\nBerhasil membeli *${targetPix}* seharga ${pixInfo.price} WP!\nBarang telah dimasukkan ke dalam Tas. Silakan gunakan perintah \`!pake pickaxe\` untuk memakainya sebelum menambang!`
    };
  }

  // Check in PET_DB
  let targetPet = Object.keys(PET_DB).find(k => k.toLowerCase() === searchStr.toLowerCase());
  if (!targetPet) targetPet = Object.keys(PET_DB).find(k => k.toLowerCase().includes(searchStr.toLowerCase()));

  if (targetPet) {
    const petInfo = PET_DB[targetPet];
    if (currentWm < petInfo.priceWM) {
      return { success: false, message: `━━━━━━━『 🛒 TOKO UMUM 』━━━━━━━\n\nUang WM (World Money) tidak cukup untuk membeli/mengadopsi *${targetPet}*!\nHarga: ${petInfo.priceWM} WM\nUang WM-mu: ${currentWm} WM` };
    }
    if (userEco.pet_type) {
      return { success: false, message: `━━━━━━━『 🛒 TOKO UMUM 』━━━━━━━\n\nKamu sudah memiliki *${userEco.pet_type}*! Kamu harus menjualnya terlebih dahulu (!jual pet) sebelum bisa mengadopsi peliharaan baru.` };
    }

    updateUserData(phone, { pet_type: targetPet, pet_weight: 3, pet_adopted_at: Date.now() });
    return {
      success: true,
      wpChange: 0,
      wmChange: -petInfo.priceWM,
      permataChange: 0,
      message: `━━━━━━━ ⟡ ━━━━━━━\n\nSelamat! Kamu berhasil mengadopsi *${targetPet}* ${petInfo.emoji} seharga ${petInfo.priceWM} WM!\nBerat awal: 3 Kg. Peliharaan barumu akan menambah keberuntungan gacha Mancing & Tambang sebesar +${Math.round(petInfo.luck * 100)}%!\n\nKetik \`!pet\` untuk melihat peliharaanmu.`
    };
  }

  return { success: false, message: `━━━━━━━『 🛒 TOKO UMUM 』━━━━━━━\n\nBarang '${itemStr}' tidak ditemukan! Ketik \`!beli\` untuk melihat katalog barang.` };
}

function feedPet(phone) {
  const userEco = getUserData(phone);
  if (!userEco.pet_type) {
    return { success: false, message: `━━━━━━━『 🐾 PET INFO 』━━━━━━━\n\nKamu belum memiliki peliharaan satupun!` };
  }
  if (userEco.pakan_pet <= 0) {
    return { success: false, message: `━━━━━━━『 🐾 PET INFO 』━━━━━━━\n\nKamu tidak punya *Pakan Pet*!\nBeli dulu di toko dengan mengetik: \`!beli pakan\`` };
  }
  
  const newWeight = userEco.pet_weight + 1;
  const newPakan = userEco.pakan_pet - 1;
  updateUserData(phone, { pet_weight: newWeight, pakan_pet: newPakan });
  
  const petInfo = PET_DB[userEco.pet_type];
  return {
    success: true,
    message: `━━━━━━━『 🐾 PET INFO 』━━━━━━━\n\nNyam nyam! 🤤\nKamu memberi makan *${userEco.pet_type}* ${petInfo ? petInfo.emoji : ''}!\n\nBerat badannya bertambah menjadi *${newWeight} Kg*!\nSisa Pakan Pet milikmu: ${newPakan} bungkus.`
  };
}

function sellPet(phone) {
  const userEco = getUserData(phone);
  if (!userEco.pet_type) {
    return { success: false, message: `━━━━━━━ ⟡ ━━━━━━━\n\nKamu tidak punya peliharaan untuk dijual!` };
  }
  
  const petInfo = PET_DB[userEco.pet_type];
  if (!petInfo) {
    // Failsafe
    updateUserData(phone, { pet_type: "", pet_weight: 0, pet_adopted_at: 0 });
    return { success: false, message: `━━━━━━━ ⟡ ━━━━━━━\n\nPeliharaanmu kabur karena datanya korup!` };
  }
  
  const baseSell = petInfo.priceWM * 0.20; // 20%
  const bonusPerKg = petInfo.priceWM * 0.05; // 5% per kg above 3kg
  const extraWeight = Math.max(0, userEco.pet_weight - 3);
  const totalSellValue = Math.floor(baseSell + (extraWeight * bonusPerKg));
  
  const oldPet = userEco.pet_type;
  updateUserData(phone, { pet_type: "", pet_weight: 0, pet_adopted_at: 0 });
  
  return {
    success: true,
    wpChange: 0,
    wmChange: totalSellValue,
    permataChange: 0,
    message: `━━━━━━━ ⟡ ━━━━━━━\n\nSelamat tinggal *${oldPet}* ${petInfo.emoji}... 👋\nKamu telah menjual peliharaanmu yang memiliki berat ${userEco.pet_weight} Kg seharga *${totalSellValue} WM*!\n\nUang World Money-mu telah ditambahkan!`
  };
}

function playRampok(attackerPhone, targetPhone, attackerWp, targetWp) {
  const userEco = getUserData(attackerPhone);
  const now = Date.now();
  const cooldownMs = 60 * 60 * 1000; // 1 jam cooldown
  
  if (now - userEco.last_rampok < cooldownMs) {
    const sisaMenit = Math.ceil((cooldownMs - (now - userEco.last_rampok)) / 60000);
    return { success: false, wpChangeAttacker: 0, wpChangeTarget: 0, message: `━━━━━━━ ⟡ ━━━━━━━\n\nPolisi masih berpatroli! Sembunyi dulu selama *${sisaMenit} menit* sebelum merampok lagi.` };
  }

  if (targetWp < 500) {
    return { success: false, wpChangeAttacker: 0, wpChangeTarget: 0, message: `━━━━━━━ ⟡ ━━━━━━━\n\nTarget terlalu miskin! Cari mangsa lain yang punya minimal 500 WP.` };
  }
  if (attackerWp < 1000) {
    return { success: false, wpChangeAttacker: 0, wpChangeTarget: 0, message: `━━━━━━━ ⟡ ━━━━━━━\n\nKamu butuh minimal 1000 WP (sebagai modal kabur/denda) untuk mulai merampok.` };
  }

  updateUserData(attackerPhone, { last_rampok: now });

  const isSuccess = Math.random() < 0.40; // 40% chance success
  
  if (isSuccess) {
    const percentStolen = Math.floor(Math.random() * 21) + 10; // 10% - 30%
    const stolenAmount = Math.floor((percentStolen / 100) * targetWp);
    return {
      success: true,
      wpChangeAttacker: stolenAmount,
      wpChangeTarget: -stolenAmount,
      message: `━━━━━━━ ⟡ ━━━━━━━\n\n✅ *BERHASIL MENCURI!*\nKamu menyusup dan berhasil mencuri *${stolenAmount} WP* dari target!\n\nDompetmu: ${attackerWp + stolenAmount} WP\nSisa Uang Target: ${targetWp - stolenAmount} WP`
    };
  } else {
    const fineAmount = Math.floor(0.10 * attackerWp); // 10% denda
    const jailTime = now + (10 * 60 * 1000); // 10 menit penjara
    updateUserData(attackerPhone, { jail_until: jailTime });
    return {
      success: true,
      wpChangeAttacker: -fineAmount,
      wpChangeTarget: 0,
      message: `━━━━━━━ ⟡ ━━━━━━━\n\n🚨 *TERTANGKAP POLISI!*\nAksi perampokanmu ketahuan! Kamu didenda *${fineAmount} WP* dan dimasukkan ke **PENJARA** selama 10 menit.\n(Selama di penjara, kamu tidak bisa bermain!)`
    };
  }
}

function bankAction(phone, action, amount, currentWp) {
  const userEco = getUserData(phone);
  let currentBank = userEco.bank_wp || 0;
  
  if (action === 'cek') {
    return { success: true, wpChange: 0, message: `━━━━━━━ ⟡ ━━━━━━━\n\n💰 Saldo Dompet: ${currentWp} WP\n💳 Saldo Bank: ${currentBank} WP\n\n_Gunakan !bank simpan [jumlah] / !bank tarik [jumlah]_` };
  }
  
  if (action === 'simpan') {
    if (isNaN(amount) || amount <= 0) return { success: false, wpChange: 0, message: `━━━━━━━ ⟡ ━━━━━━━\n\nJumlah yang dimasukkan tidak valid.` };
    if (currentWp < amount) return { success: false, wpChange: 0, message: `━━━━━━━ ⟡ ━━━━━━━\n\nUang di dompet tidak cukup! Uangmu: ${currentWp} WP` };
    
    updateUserData(phone, { bank_wp: currentBank + amount });
    return { success: true, wpChange: -amount, message: `━━━━━━━ ⟡ ━━━━━━━\n\n📥 *BERHASIL MENABUNG*\nBerhasil menyimpan *${amount} WP* ke Bank.\nSaldo Bank sekarang: ${currentBank + amount} WP` };
  }
  
  if (action === 'tarik') {
    if (isNaN(amount) || amount <= 0) return { success: false, wpChange: 0, message: `━━━━━━━ ⟡ ━━━━━━━\n\nJumlah yang dimasukkan tidak valid.` };
    if (currentBank < amount) return { success: false, wpChange: 0, message: `━━━━━━━ ⟡ ━━━━━━━\n\nSaldo Bank tidak cukup! Saldo Bank: ${currentBank} WP` };
    
    updateUserData(phone, { bank_wp: currentBank - amount });
    return { success: true, wpChange: amount, message: `━━━━━━━ ⟡ ━━━━━━━\n\n📤 *BERHASIL MENARIK*\nBerhasil menarik *${amount} WP* dari Bank.\nSaldo Bank sekarang: ${currentBank - amount} WP` };
  }
  
  return { success: false, wpChange: 0, message: `━━━━━━━ ⟡ ━━━━━━━\n\nAksi tidak dikenali. Gunakan cek / simpan / tarik.` };
}

function playDuel(attackerPhone, targetPhone, amount, attackerWp, targetWp) {
  if (isNaN(amount) || amount <= 0) return { success: false, wpChangeAttacker: 0, wpChangeTarget: 0, message: `━━━━━━━ ⟡ ━━━━━━━\nJumlah taruhan tidak valid.` };
  if (attackerWp < amount) return { success: false, wpChangeAttacker: 0, wpChangeTarget: 0, message: `━━━━━━━ ⟡ ━━━━━━━\nUangmu tidak cukup untuk taruhan ini! Uangmu: ${attackerWp} WP` };
  if (targetWp < amount) return { success: false, wpChangeAttacker: 0, wpChangeTarget: 0, message: `━━━━━━━ ⟡ ━━━━━━━\nTarget tidak memiliki cukup uang untuk menerima taruhan ini! Target hanya punya: ${targetWp} WP` };
  
  const isAttackerWin = Math.random() < 0.50; // 50/50 chance

  if (isAttackerWin) {
    return {
      success: true,
      wpChangeAttacker: amount,
      wpChangeTarget: -amount,
      message: `━━━━━━━ ⟡ ━━━━━━━\n🏆 *@${attackerPhone}* MENANG | +${amount} WP\n💀 *@${targetPhone}* KALAH | -${amount} WP`
    };
  } else {
    return {
      success: true,
      wpChangeAttacker: -amount,
      wpChangeTarget: amount,
      message: `━━━━━━━ ⟡ ━━━━━━━\n🏆 *@${targetPhone}* MENANG | +${amount} WP\n💀 *@${attackerPhone}* KALAH | -${amount} WP`
    };
  }
}

module.exports = {
  PICKAXE_DB,
  PET_DB,
  getGroupData,
  updateGroupData,
  getGroupMiningInfo,
  getUserData,
  updateUserData,
  addWM,
  addWP,
  getItemInfo,
  parseTas,
  stringifyTas,
  playMancing,
  playTambang,
  playTambangAuto,
  playSlot,
  playCoinflip,
  buyItem,
  feedPet,
  sellPet,
  playRampok,
  bankAction,
  sellItem,
  playDuel
};
