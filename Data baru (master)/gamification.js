const economymanager = require('./economymanager');
const fs = require('fs');
const path = require('path');

const ACHIEVEMENTS = {
  // 1-15 Onboarding & Mining
  "First Step": { desc: "Bergabung pertama kali", wm: 500, wp: 10, title: null, badge: "🩸" },
  "Newcomer": { desc: "Login 3 hari", wm: 1000, wp: 20, title: "Newcomer", badge: "🌱" },
  "Backpacker": { desc: "Membuka tas pertama kali", wm: 500, wp: 10, title: null, badge: "🎒" },
  "Rookie Angler": { desc: "Memancing 10 kali", wm: 2000, wp: 25, title: "Rookie Angler", badge: "🎣" },
  "Fish Catcher": { desc: "Menangkap 50 ikan", wm: 5000, wp: 50, title: "Fish Catcher", badge: "🐟" },
  "Shrimp Hunter": { desc: "Menangkap 20 udang", wm: 3000, wp: 30, title: "Shrimp Hunter", badge: "🦐" },
  "Deep Diver": { desc: "Menangkap cumi pertama", wm: 10000, wp: 50, title: "Deep Diver", badge: "🦑" },
  "Sea Legend": { desc: "Menangkap hiu", wm: 50000, wp: 100, permata: 1, title: "Sea Legend", badge: "🦈" },
  "Stone Breaker": { desc: "Mining 20 kali", wm: 2000, wp: 25, title: "Stone Breaker", badge: "⛏️" },
  "Quarry Worker": { desc: "Mengumpulkan 100 batu", wm: 5000, wp: 50, title: "Quarry Worker", badge: "🪨" },
  "Copper Seeker": { desc: "Mendapat tembaga pertama", wm: 2000, wp: 20, title: "Copper Seeker", badge: "🥉" },
  "Iron Prospector": { desc: "Mendapat besi pertama", wm: 3000, wp: 30, title: "Iron Prospector", badge: "⚙️" },
  "Silver Digger": { desc: "Mendapat perak pertama", wm: 5000, wp: 50, title: "Silver Digger", badge: "🥈" },
  "Gold Hunter": { desc: "Mendapat emas pertama", wm: 10000, wp: 100, permata: 1, title: "Gold Hunter", badge: "🥇" },
  "Gem Finder": { desc: "Mendapat permata pertama", wm: 25000, wp: 200, permata: 2, title: "Gem Finder", badge: "💎" },
  
  // 16-33 Economy & Gambling
  "Penny Collector": { desc: "Memiliki 1.000 WM", wm: 500, wp: 10, title: "Penny Collector", badge: "👛" },
  "Money Maker": { desc: "Memiliki 10.000 WM", wm: 5000, wp: 50, title: "Money Maker", badge: "💰" },
  "Wealth Keeper": { desc: "Menyimpan WM di bank", wm: 2000, wp: 20, title: "Wealth Keeper", badge: "🏦" },
  "Big Spender": { desc: "Menghabiskan 50.000 WM", wm: 10000, wp: 100, title: "Big Spender", badge: "💸" },
  "Millionaire": { desc: "Memiliki 1.000.000 WM", wm: 100000, wp: 500, permata: 5, title: "Millionaire", badge: "👑" },
  "Point Earner": { desc: "Memiliki 100 WP", wm: 5000, wp: 50, title: "Point Earner", badge: "⭐" },
  "Prestige One": { desc: "Memiliki 500 WP", wm: 25000, wp: 100, title: "Prestige One", badge: "🌟" },
  "Prestige Master": { desc: "Memiliki 5.000 WP", wm: 100000, wp: 500, permata: 5, title: "Prestige Master", badge: "✨" },
  "Crystal Holder": { desc: "Memiliki 5 permata", wm: 25000, wp: 200, title: "Crystal Holder", badge: "💠" },
  "Jewel Guardian": { desc: "Memiliki 50 permata", wm: 100000, wp: 1000, permata: 10, title: "Jewel Guardian", badge: "🔷" },
  "Gift Giver": { desc: "Memberi hadiah pertama", wm: 1000, wp: 20, title: "Gift Giver", badge: "🎁" },
  "Generous Soul": { desc: "Memberi 50 gift", wm: 25000, wp: 250, permata: 2, title: "Generous Soul", badge: "🎀" },
  "Lucky Spin": { desc: "Menang slot pertama", wm: 2000, wp: 20, title: null, badge: "🎰" },
  "Fortune Child": { desc: "Menang slot 10 kali", wm: 10000, wp: 100, title: "Fortune Child", badge: "🍀" },
  "Coin Tosser": { desc: "Coinflip pertama", wm: 1000, wp: 10, title: null, badge: "🎲" },
  "Gambler": { desc: "Menang coinflip 20 kali", wm: 20000, wp: 200, title: "Gambler", badge: "🃏" },
  "Chicken Lord": { desc: "Menang sabung ayam pertama", wm: 5000, wp: 50, title: "Chicken Lord", badge: "🐔" },
  "Arena Victor": { desc: "Menang 25 duel", wm: 25000, wp: 250, permata: 1, title: "Arena Victor", badge: "🏅" },
  
  // 34-45 Games
  "Casual Gamer": { desc: "Main 20 mini game", wm: 5000, wp: 50, title: "Casual Gamer", badge: "🎮" },
  "Puzzle Solver": { desc: "Menang tebak kata", wm: 1000, wp: 10, title: "Puzzle Solver", badge: "🧩" },
  "Bomb Survivor": { desc: "Menang Tebak Boom", wm: 2000, wp: 20, title: "Bomb Survivor", badge: "💣" },
  "Wordsmith": { desc: "Menang Sambung Kata", wm: 2000, wp: 20, title: "Wordsmith", badge: "🔤" },
  "Accuracy Master": { desc: "Menang 100 mini game", wm: 50000, wp: 500, permata: 2, title: "Accuracy Master", badge: "🏹" },
  
  // 46-67 Expedition, Knowledge & Astronomy
  "Curious Mind": { desc: "Menggunakan fitur Knowledge", wm: 500, wp: 10, title: null, badge: "📚" },
  "Scholar": { desc: "Menjawab 50 soal benar", wm: 10000, wp: 100, title: "Scholar", badge: "🧠" },
  "Sage": { desc: "Menjawab 500 soal benar", wm: 100000, wp: 1000, permata: 5, title: "Sage", badge: "🎓" },
  "Wiki Wanderer": { desc: "Membuka 100 artikel", wm: 20000, wp: 200, title: "Wiki Wanderer", badge: "📖" },
  "Historian": { desc: "Mengakses History 50 kali", wm: 10000, wp: 100, title: "Historian", badge: "🕰️" },
  "Explorer": { desc: "Main Expedition pertama", wm: 1000, wp: 10, title: "Explorer", badge: "🌍" },
  "Flag Rookie": { desc: "Tebak 20 bendera", wm: 5000, wp: 50, title: "Flag Rookie", badge: "🏳️" },
  "Cartographer": { desc: "Tebak 100 negara", wm: 25000, wp: 250, title: "Cartographer", badge: "🗺️" },
  "Landmark Hunter": { desc: "Tebak 50 landmark", wm: 15000, wp: 150, title: "Landmark Hunter", badge: "🏛️" },
  "Cat Whisperer": { desc: "Tebak 25 ras kucing", wm: 10000, wp: 100, title: "Cat Whisperer", badge: "🐱" },
  "Dog Companion": { desc: "Tebak 25 ras anjing", wm: 10000, wp: 100, title: "Dog Companion", badge: "🐶" },
  "Game Expert": { desc: "Tebak 50 game", wm: 15000, wp: 150, title: "Game Expert", badge: "🎮" },
  "Logo Analyst": { desc: "Tebak 50 logo", wm: 15000, wp: 150, title: "Logo Analyst", badge: "🧢" },
  "Stargazer": { desc: "Membuka Astronomy pertama", wm: 2000, wp: 20, title: "Stargazer", badge: "🌌" },
  "Moon Watcher": { desc: "Melihat fase bulan 30 kali", wm: 10000, wp: 100, title: "Moon Watcher", badge: "🌙" },
  "ISS Observer": { desc: "Mengecek ISS 20 kali", wm: 5000, wp: 50, title: "ISS Observer", badge: "🛰️" },
  "Meteor Chaser": { desc: "Mengikuti event astronomi", wm: 15000, wp: 150, permata: 1, title: "Meteor Chaser", badge: "☄️" },
  "Space Enthusiast": { desc: "Membuka NASA APOD 50 kali", wm: 20000, wp: 200, title: "Space Enthusiast", badge: "🚀" },
  "Cosmic Voyager": { desc: "Membuka NASA 200 kali", wm: 100000, wp: 1000, permata: 3, title: "Cosmic Voyager", badge: "👨‍🚀" },
  "Weather Scout": { desc: "Mengecek cuaca pertama", wm: 500, wp: 10, title: null, badge: "🌤️" },
  "Storm Tracker": { desc: "Mengecek cuaca 100 kali", wm: 10000, wp: 100, title: "Storm Tracker", badge: "⛈️" },
  "Sky Reader": { desc: "Mengecek cuaca 365 kali", wm: 50000, wp: 500, permata: 2, title: "Sky Reader", badge: "🌈" },
  
  // 68-86 Utility & API
  "Crypto Curious": { desc: "Cek crypto pertama", wm: 1000, wp: 10, title: "Crypto Curious", badge: "💹" },
  "Market Watcher": { desc: "Cek harga 100 kali", wm: 10000, wp: 100, title: "Market Watcher", badge: "📈" },
  "Coin Oracle": { desc: "Cek harga 500 kali", wm: 50000, wp: 500, permata: 2, title: "Coin Oracle", badge: "🪙" },
  "Steam Visitor": { desc: "Cek Steam pertama", wm: 1000, wp: 10, title: null, badge: "🎮" },
  "Gamer Analyst": { desc: "Cek 100 game Steam", wm: 15000, wp: 150, title: "Gamer Analyst", badge: "🕹️" },
  "Connector": { desc: "Gunakan Wazle Connect", wm: 5000, wp: 50, title: "Connector", badge: "🌐" },
  "Server Inspector": { desc: "Cek Minecraft pertama", wm: 1000, wp: 10, title: null, badge: "🖥️" },
  "Block Sentinel": { desc: "Cek 100 server Minecraft", wm: 15000, wp: 150, title: "Block Sentinel", badge: "🧱" },
  "Network Ranger": { desc: "Cek IP 50 kali", wm: 10000, wp: 100, title: "Network Ranger", badge: "📡" },
  "Domain Sleuth": { desc: "Lookup domain 50 kali", wm: 10000, wp: 100, title: "Domain Sleuth", badge: "🔍" },
  "AI Curious": { desc: "Bertanya ke AI pertama", wm: 1000, wp: 10, title: "AI Curious", badge: "🤖" },
  "Conversationalist": { desc: "Chat AI 100 kali", wm: 10000, wp: 100, title: "Conversationalist", badge: "💬" },
  "Mind Explorer": { desc: "Chat AI 500 kali", wm: 50000, wp: 500, permata: 3, title: "Mind Explorer", badge: "🧬" },
  "Craftsman": { desc: "Menggunakan tools pertama", wm: 1000, wp: 10, title: "Craftsman", badge: "🛠️" },
  "Utility User": { desc: "Menggunakan 100 tools", wm: 15000, wp: 150, title: "Utility User", badge: "✂️" },
  "Automation Adept": { desc: "Menggunakan automation", wm: 10000, wp: 100, title: "Automation Adept", badge: "🧲" },
  "Downloader": { desc: "Download pertama", wm: 1000, wp: 10, title: "Downloader", badge: "📥" },
  "Media Collector": { desc: "Download 100 media", wm: 15000, wp: 150, title: "Media Collector", badge: "🎵" },
  "Archivist": { desc: "Download 500 media", wm: 50000, wp: 500, permata: 2, title: "Archivist", badge: "📦" },
  
  // 87-120 RPG, Reputation, Legacy
  "Pet Owner": { desc: "Memiliki pet pertama", wm: 5000, wp: 50, title: "Pet Owner", badge: "🐾" },
  "Caretaker": { desc: "Memberi makan pet 50 kali", wm: 20000, wp: 200, title: "Caretaker", badge: "🦴" },
  "Beast Tamer": { desc: "Memiliki pet langka", wm: 50000, wp: 500, permata: 3, title: "Beast Tamer", badge: "🐉" },
  "Daily Adventurer": { desc: "Menyelesaikan quest harian", wm: 2000, wp: 20, title: "Daily Adventurer", badge: "🏕️" },
  "Quest Seeker": { desc: "Menyelesaikan 50 quest", wm: 25000, wp: 250, title: "Quest Seeker", badge: "📜" },
  "Pathfinder": { desc: "Menyelesaikan 200 quest", wm: 100000, wp: 1000, permata: 5, title: "Pathfinder", badge: "🧭" },
  "Badge Hunter": { desc: "Memiliki 25 badge", wm: 50000, wp: 500, permata: 2, title: "Badge Hunter", badge: "🎖️" },
  "Achievement Collector": { desc: "Memiliki 50 achievement", wm: 100000, wp: 1000, permata: 5, title: "Achievement Collector", badge: "🏆" },
  "Hall of Fame": { desc: "Memiliki 100 achievement", wm: 500000, wp: 5000, permata: 20, title: "Hall of Fame", badge: "👑" },
  "Beta Pioneer": { desc: "Bergabung saat Beta", wm: 100000, wp: 1000, permata: 10, title: "Beta Pioneer", badge: "🔥" },
  "Founding Blood": { desc: "Pengguna generasi awal", wm: 250000, wp: 2500, permata: 15, title: "Founding Blood", badge: "🩸" },
  "Loyal Soul": { desc: "Login 100 hari", wm: 100000, wp: 1000, permata: 5, title: "Loyal Soul", badge: "🕯️" },
  "Timeless One": { desc: "Login 365 hari", wm: 500000, wp: 5000, permata: 25, title: "Timeless One", badge: "⌛" },
  "Legend of Wazle": { desc: "Level tinggi", wm: 250000, wp: 2500, permata: 10, title: "Legend of Wazle", badge: "🌟" },
  "Dream Chaser": { desc: "Menyelesaikan milestone besar", wm: 100000, wp: 1000, permata: 5, title: "Dream Chaser", badge: "🌠" },
  "Keykeeper": { desc: "Membuka fitur eksklusif", wm: 50000, wp: 500, permata: 3, title: "Keykeeper", badge: "🗝️" },
  "Guardian": { desc: "Membantu pemain lain", wm: 25000, wp: 250, title: "Guardian", badge: "🛡️" },
  "Ally": { desc: "Memberi gift 100 kali", wm: 50000, wp: 500, permata: 3, title: "Ally", badge: "🤝" },
  "Event Survivor": { desc: "Ikut event pertama", wm: 5000, wp: 50, title: "Event Survivor", badge: "🎉" },
  "Festival Hero": { desc: "Menang event musiman", wm: 50000, wp: 500, permata: 5, title: "Festival Hero", badge: "🎊" },
  "Truth Seeker": { desc: "Menang investigasi", wm: 20000, wp: 200, title: "Truth Seeker", badge: "🕵️" },
  "Duelist": { desc: "Menang duel beruntun", wm: 30000, wp: 300, title: "Duelist", badge: "⚔️" },
  "Unbreakable": { desc: "Tidak kalah 20 game", wm: 50000, wp: 500, permata: 3, title: "Unbreakable", badge: "🦾" },
  "Collector": { desc: "Memiliki 100 item unik", wm: 25000, wp: 250, title: "Collector", badge: "🐾" },
  "Hoarder": { desc: "Menyimpan 500 item", wm: 50000, wp: 500, permata: 3, title: "Hoarder", badge: "📦" },
  "Relic Keeper": { desc: "Mendapat relic pertama", wm: 20000, wp: 200, title: "Relic Keeper", badge: "🪄" },
  "Artifact Master": { desc: "Memiliki 20 relic", wm: 100000, wp: 1000, permata: 5, title: "Artifact Master", badge: "🏺" },
  "Earth Watcher": { desc: "Cek gempa 50 kali", wm: 10000, wp: 100, title: "Earth Watcher", badge: "🌋" },
  "Planet Walker": { desc: "Gunakan Expedition 500 kali", wm: 100000, wp: 1000, permata: 5, title: "Planet Walker", badge: "🌍" },
  "Celestial Sage": { desc: "Gunakan Astronomy 500 kali", wm: 100000, wp: 1000, permata: 5, title: "Celestial Sage", badge: "🎇" },
  "Grand Scholar": { desc: "Gunakan Knowledge 500 kali", wm: 100000, wp: 1000, permata: 5, title: "Grand Scholar", badge: "🏛️" },
  "Diamond Legacy": { desc: "Memiliki 100 permata", wm: 250000, wp: 2500, permata: 10, title: "Diamond Legacy", badge: "💠" },
  "Wazle Myth": { desc: "Mencapai seluruh milestone utama", wm: 500000, wp: 5000, permata: 25, title: "Wazle Myth", badge: "🩸" },
  "The Wazle Eternal": { desc: "Membuka hampir semua achievement", wm: 1000000, wp: 10000, permata: 100, title: "The Wazle Eternal", badge: "👑" }
};

// Data tracking keys map (to know what to increment when tracker is called)
const TRACKER_KEYS = {
  // Activity
  'CMD_TAS': 'tas_opened',
  'CMD_EXPEDITION': 'expedition_played',
  'CMD_KNOWLEDGE': 'knowledge_used',
  'CMD_ASTRONOMY': 'astronomy_used',
  'CMD_WEATHER': 'weather_checked',
  'CMD_CRYPTO': 'crypto_checked',
  'CMD_STEAM': 'steam_checked',
  'CMD_MC': 'mc_checked',
  'CMD_IP': 'ip_checked',
  'CMD_DOMAIN': 'domain_checked',
  'CMD_AI': 'ai_chat_used',
  'CMD_TOOLS': 'tools_used',
  'CMD_DOWNLOAD': 'media_downloaded',
  'CMD_QUAKE': 'quake_checked',
  'CMD_WIKI': 'wiki_opened',
  'CMD_HISTORY': 'history_opened',
  'CMD_NASA': 'nasa_opened',
  'CMD_MOON': 'moon_checked',
  'CMD_ISS': 'iss_checked',
  
  // Games
  'WIN_TEBAKKATA': 'tebakkata_wins',
  'WIN_TEBAKBOOM': 'tebakboom_wins',
  'WIN_SAMBUNGKATA': 'sambungkata_wins',
  'WIN_GAMES_TOTAL': 'total_game_wins',
  'GAMES_PLAYED': 'total_games_played',
  'VOTE_CAST': 'total_votes_cast',
  
  // WM
  'WM_SPENT': 'wm_spent',
  'GIFT_SENT': 'gifts_sent',
  
  // Gambling
  'WIN_SLOT': 'slot_wins',
  'WIN_COINFLIP': 'coinflip_wins',
  'WIN_SABUNGAYAM': 'sabungayam_wins',
  'WIN_DUEL': 'duel_wins',
  
  // Knowledge
  'CORRECT_KNOWLEDGE': 'knowledge_correct',
  
  // Expeditions
  'TEBAK_BENDERA': 'bendera_correct',
  'TEBAK_NEGARA': 'negara_correct',
  'TEBAK_LANDMARK': 'landmark_correct',
  'TEBAK_KUCING': 'kucing_correct',
  'TEBAK_ANJING': 'anjing_correct',
  'TEBAK_GAME': 'game_correct',
  'TEBAK_LOGO': 'logo_correct',
  
  // Pets
  'FEED_PET': 'pet_fed_times',
  
  // Quests
  'QUEST_COMPLETED': 'quests_completed',
  
};

// =====================================
// DAILY QUESTS DEFINITION
// =====================================
const DAILY_QUEST_POOL = [
  { id: 'q1', type: 'mancing_played', target: 3, desc: 'Mancing 3 kali hari ini' },
  { id: 'q2', type: 'tambang_played', target: 3, desc: 'Nambang 3 kali hari ini' },
  { id: 'q3', type: 'ai_chat_used', target: 5, desc: 'Ngobrol sama Zeina 5 kali' },
  { id: 'q4', type: 'slot_wins', target: 1, desc: 'Menang Slot 1 kali' },
  { id: 'q5', type: 'coinflip_wins', target: 2, desc: 'Menang Coinflip 2 kali' },
  { id: 'q6', type: 'weather_checked', target: 1, desc: 'Cek cuaca kota' },
  { id: 'q7', type: 'knowledge_used', target: 2, desc: 'Gunakan fitur Knowledge 2x' },
  { id: 'q9', type: 'sabungayam_wins', target: 1, desc: 'Menang Sabung Ayam 1 kali' },
  { id: 'q10', type: 'pet_fed_times', target: 2, desc: 'Kasih makan Pet 2 kali' }
];

function getTodayString() {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return wib.toISOString().split('T')[0];
}

function initDailyQuests(user) {
  const today = getTodayString();
  if (!user.quests || user.quests.date !== today) {
    // Reroll quests for today
    const shuffled = [...DAILY_QUEST_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    user.quests = {
      date: today,
      claimed: false,
      list: selected.map(q => ({ ...q, progress: 0, completed: false }))
    };
  }
}

// Get Wazle Score calculation
function calculateWazleScore(userData) {
  let score = 0;
  score += (userData.reputation || 0) * 10;
  score += (userData.achievements ? userData.achievements.length : 0) * 50;
  score += (userData.badges ? userData.badges.length : 0) * 20;
  score += (userData.wp || 0) * 2;
  score += (userData.permata || 0) * 100;
  
  const tracking = userData.tracking || {};
  score += (tracking.total_game_wins || 0) * 5;
  score += (tracking.ai_chat_used || 0) * 1;
  score += (tracking.wm_played || 0) * 5;
  
  return score;
}

async function processAchievement(socket, remoteJid, msg, phone, achievementName) {
  const ach = ACHIEVEMENTS[achievementName];
  if (!ach) return;

  const user = economymanager.getUserData(phone);
  if (!user.achievements) user.achievements = [];
  
  if (user.achievements.includes(achievementName)) return; // Already unlocked

  // Unlock it
  user.achievements.push(achievementName);
  
  // Add Rewards
  if (ach.wm) user.wm = (user.wm || 0) + ach.wm;
  if (ach.wp) user.wp = (user.wp || 0) + ach.wp;
  if (ach.permata) user.permata = (user.permata || 0) + ach.permata;
  
  if (ach.title) {
    if (!user.titles) user.titles = [];
    if (!user.titles.includes(ach.title)) user.titles.push(ach.title);
  }
  
  if (ach.badge) {
    if (!user.badges) user.badges = [];
    if (!user.badges.includes(ach.badge)) user.badges.push(ach.badge);
  }
  
  user.reputation = (user.reputation || 0) + 10; // +10 rep per achievement
  user.wazle_score = calculateWazleScore(user);
  
  economymanager.updateUserData(phone, user);

  // Format message
  let rewardText = ``;
  if (ach.wm) rewardText += `+${ach.wm.toLocaleString('id-ID')} WM\n`;
  if (ach.wp) rewardText += `+${ach.wp.toLocaleString('id-ID')} WP\n`;
  if (ach.permata) rewardText += `+${ach.permata} Permata\n`;
  if (ach.title) rewardText += `+ Gelar: 『 ${ach.title} 』\n`;
  if (ach.badge) rewardText += `+ Badge: ${ach.badge}\n`;

  const notif = `🏆 *Achievement Unlocked!*\n\n"${achievementName}"\n_${ach.desc}_\n\n*Reward:*\n${rewardText}`;
  try {
    await socket.sendMessage(remoteJid, { text: notif }, { quoted: msg });
  } catch (e) {}
}

async function checkAchievements(socket, remoteJid, msg, phone) {
  const user = economymanager.getUserData(phone);
  const track = user.tracking || {};
  const hasAch = (name) => user.achievements && user.achievements.includes(name);

  const checkAndGrant = async (name, condition) => {
    if (condition && !hasAch(name)) await processAchievement(socket, remoteJid, msg, phone, name);
  };

  // Group 1 checks (Basic activity)
  await checkAndGrant("First Step", track.wm_played > 0 || track.total_games_played > 0 || track.ai_chat_used > 0);
  await checkAndGrant("Backpacker", track.tas_opened > 0);
  
  // Economy Checks
  const wm = user.wm || 0;
  await checkAndGrant("Penny Collector", wm >= 1000);
  await checkAndGrant("Money Maker", wm >= 10000);
  await checkAndGrant("Millionaire", wm >= 1000000);
  
  const wp = user.wp || 0;
  await checkAndGrant("Point Earner", wp >= 100);
  await checkAndGrant("Prestige One", wp >= 500);
  await checkAndGrant("Prestige Master", wp >= 5000);
  
  const permata = user.permata || 0;
  await checkAndGrant("Crystal Holder", permata >= 5);
  await checkAndGrant("Jewel Guardian", permata >= 50);

  // Gambling
  await checkAndGrant("Lucky Spin", track.slot_wins >= 1);
  await checkAndGrant("Fortune Child", track.slot_wins >= 10);
  await checkAndGrant("Coin Tosser", track.coinflip_wins >= 1);
  await checkAndGrant("Gambler", track.coinflip_wins >= 20);
  await checkAndGrant("Chicken Lord", track.sabungayam_wins >= 1);
  await checkAndGrant("Arena Victor", track.duel_wins >= 25);

  // Games
  await checkAndGrant("Casual Gamer", track.total_games_played >= 20);
  await checkAndGrant("Accuracy Master", track.total_game_wins >= 100);
  await checkAndGrant("Puzzle Solver", track.tebakkata_wins >= 1);
  await checkAndGrant("Bomb Survivor", track.tebakboom_wins >= 1);
  await checkAndGrant("Wordsmith", track.sambungkata_wins >= 1);

  // AI & Knowledge
  await checkAndGrant("Curious Mind", track.knowledge_used >= 1);
  await checkAndGrant("Scholar", track.knowledge_correct >= 50);
  await checkAndGrant("Sage", track.knowledge_correct >= 500);
  
  await checkAndGrant("AI Curious", track.ai_chat_used >= 1);
  await checkAndGrant("Conversationalist", track.ai_chat_used >= 100);
  await checkAndGrant("Mind Explorer", track.ai_chat_used >= 500);

  // Tools & Utils
  await checkAndGrant("Weather Scout", track.weather_checked >= 1);
  await checkAndGrant("Storm Tracker", track.weather_checked >= 100);
  await checkAndGrant("Sky Reader", track.weather_checked >= 365);
  await checkAndGrant("Earth Watcher", track.quake_checked >= 50);
  
  // Media
  await checkAndGrant("Downloader", track.media_downloaded >= 1);
  await checkAndGrant("Media Collector", track.media_downloaded >= 100);
  await checkAndGrant("Archivist", track.media_downloaded >= 500);


  await checkAndGrant("Judge of Fate", track.total_votes_cast >= 100);
  
  // Legacy
  await checkAndGrant("Badge Hunter", (user.badges && user.badges.length >= 25));
  await checkAndGrant("Achievement Collector", (user.achievements && user.achievements.length >= 50));
  await checkAndGrant("Hall of Fame", (user.achievements && user.achievements.length >= 100));
}

// Increment activity trackers
async function trackActivity(socket, remoteJid, msg, phone, actionKey, amount = 1) {
  const user = economymanager.getUserData(phone);
  if (!user.tracking) user.tracking = {};
  
  const key = TRACKER_KEYS[actionKey] || actionKey;
  user.tracking[key] = (user.tracking[key] || 0) + amount;
  
  economymanager.updateUserData(phone, user);

  // Passive achievement check after any tracking
  await checkAchievements(socket, remoteJid, msg, phone);
  
  // Daily Quests Check
  initDailyQuests(user); // Make sure it's initialized for today
  let questUpdated = false;
  let allDone = true;
  
  for (let q of user.quests.list) {
    if (!q.completed && q.type === key) {
      q.progress += amount;
      questUpdated = true;
      if (q.progress >= q.target) {
        q.progress = q.target;
        q.completed = true;
        try {
          await socket.sendMessage(remoteJid, { text: `📜 *QUEST SELESAI!*\n\n"${q.desc}"\nKamu semakin dekat dengan hadiah harian!` }, { quoted: msg });
        } catch(e) {}
      }
    }
    if (!q.completed) allDone = false;
  }
  
  // Check if all 3 quests done
  if (allDone && !user.quests.claimed) {
    user.quests.claimed = true;
    user.permata = (user.permata || 0) + 1;
    user.wm = (user.wm || 0) + 2500;
    questUpdated = true;
    
    // Add to completed quests tracker for achievements
    user.tracking['quests_completed'] = (user.tracking['quests_completed'] || 0) + 1;
    
    try {
      await socket.sendMessage(remoteJid, { text: `🎉 *DAILY QUESTS CLEARED!* 🎉\n\nKamu telah menyelesaikan 3 Quest Harian hari ini!\n\n*Reward:*\n+2.500 WM\n+1 Permata\n\n_Reset besok jam 00:00 WIB_` }, { quoted: msg });
    } catch(e) {}
  }
  
  if (questUpdated) economymanager.updateUserData(phone, user);
}

// Format quests for command
function getDailyQuestsDisplay(phone) {
  const user = economymanager.getUserData(phone);
  initDailyQuests(user);
  economymanager.updateUserData(phone, user);
  
  let text = `══〔 📜 DAILY QUEST 〕══\n\n`;
  for (let q of user.quests.list) {
    const box = q.completed ? '☑️' : '☐';
    text += `${box} ${q.desc} (${q.progress}/${q.target})\n`;
  }
  
  if (user.quests.claimed) {
    text += `\n✨ _Hadiah Harian telah diklaim!_ ✨\n(+2.500 WM, +1 Permata)`;
  } else {
    text += `\n*Reward:* 1 Permata + 2.500 WM`;
  }
  return text;
}

module.exports = {
  ACHIEVEMENTS,
  calculateWazleScore,
  processAchievement,
  checkAchievements,
  trackActivity,
  getDailyQuestsDisplay
};
