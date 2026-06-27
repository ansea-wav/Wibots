const ACHIEVEMENTS = [
  { id: 'first_blood', name: '🛡️ First Blood', desc: 'Serang Naga Kegelapan untuk pertama kalinya.', hidden: false },
  { id: 'boss_slayer', name: '⚔️ Naga Hunter', desc: 'Berikan total 10.000 damage ke Naga Kegelapan.', hidden: false },
  { id: 'boss_destroyer', name: '💥 Pemberantas Naga', desc: 'Berikan total 50.000 damage ke Naga Kegelapan.', hidden: false },
  { id: 'boss_legend', name: '🐉 Legenda Naga', desc: 'Berikan total 100.000 damage ke Naga Kegelapan.', hidden: false },
  { id: 'boss_striker_10', name: '🏹 Penyerang Tekun', desc: 'Serang Naga Kegelapan sebanyak 10 kali.', hidden: false },
  { id: 'boss_striker_50', name: '🛡️ Prajurit Naga Terhebat', desc: 'Serang Naga Kegelapan sebanyak 50 kali.', hidden: false },
  { id: 'explorer_city', name: '🏛️ Warga Balai Kota', desc: 'Berkunjung ke Balai Kota.', hidden: false },
  { id: 'explorer_wild', name: '🌲 Penjelajah Rimba', desc: 'Berkunjung ke Hutan Liar.', hidden: false },
  { id: 'explorer_market', name: '🛍️ Pemburu Diskon', desc: 'Berkunjung ke Pasar Fluktuatif.', hidden: false },
  { id: 'explorer_blacksmith', name: '⚒️ Kunjungan Pandai Besi', desc: 'Berkunjung ke Bengkel Pandai Besi.', hidden: false },
  { id: 'explorer_station', name: '🚉 Pengelana Stasiun', desc: 'Berkunjung ke Stasiun Ekspedisi.', hidden: false },
  { id: 'explorer_labyrinth', name: '⛰️ Pencari Labirin', desc: 'Berkunjung ke Gua Labirin.', hidden: false },
  { id: 'explorer_plaza', name: '🎪 Pengunjung Pesta', desc: 'Berkunjung ke Alun-Alun Pesta.', hidden: false },
  { id: 'explorer_factory', name: '🏭 Pencari Saham', desc: 'Berkunjung ke Pabrik Saham.', hidden: false },
  { id: 'explorer', name: '🗺️ Musafir Sejati', desc: 'Berkunjung ke seluruh 8 lokasi di Wazle.', hidden: false },
  { id: 'traveler_10', name: '👣 Pengembara Muda', desc: 'Melakukan perjalanan sebanyak 10 kali.', hidden: false },
  { id: 'traveler_50', name: '👟 Petualang Ulung', desc: 'Melakukan perjalanan sebanyak 50 kali.', hidden: false },
  { id: 'traveler_100', name: '🧭 Pengelana Dunia', desc: 'Melakukan perjalanan sebanyak 100 kali.', hidden: false },
  { id: 'lucky_find', name: '💎 Harta Karun Labirin', desc: 'Mendapatkan item tier 5 atau lebih tinggi dari peti Gua Labirin.', hidden: false },
  { id: 'mythical_find', name: '👑 Penemu Artefak Purba', desc: 'Mendapatkan item tier 8 atau lebih tinggi.', hidden: false },
  { id: 'rich_10k', name: '💰 Mulai Mandiri', desc: 'Mengumpulkan 10.000 WP.', hidden: false },
  { id: 'rich_50k', name: '💵 Warga Makmur', desc: 'Mengumpulkan 50.000 WP.', hidden: false },
  { id: 'rich_100k', name: '💳 Orang Kaya Baru', desc: 'Mengumpulkan 100.000 WP.', hidden: false },
  { id: 'rich', name: '💸 Miliarder Wazle', desc: 'Mengumpulkan 1.000.000 WP.', hidden: false },
  { id: 'capitalist', name: '🔱 Konglomerat', desc: 'Mengumpulkan 5.000.000 WP.', hidden: false },
  { id: 'spend_10k', name: '🛒 Konsumtif', desc: 'Membelanjakan total 10.000 WP di Pasar.', hidden: false },
  { id: 'spend_50k', name: '🏬 Sultan Pasar', desc: 'Membelanjakan total 50.000 WP di Pasar.', hidden: false },
  { id: 'spend_200k', name: '🏦 Penguasa Ekonomi', desc: 'Membelanjakan total 200.000 WP di Pasar.', hidden: false },
  { id: 'labyrinth_survivor', name: '🧗 Penyintas Labirin', desc: 'Selamat dari Gua Labirin tanpa terkena perangkap 5 kali berturut-turut.', hidden: false },
  { id: 'labyrinth_master', name: '🏆 Penakluk Gua', desc: 'Selamat dari Gua Labirin tanpa terkena perangkap 15 kali berturut-turut.', hidden: false },
  { id: 'labyrinth_victim', name: '🕳️ Nasib Sial', desc: 'Terkena perangkap Gua Labirin sebanyak 5 kali.', hidden: false },
  { id: 'labyrinth_walker_10', name: '🗺️ Penjelajah Labirin', desc: 'Masuk ke dalam Gua Labirin sebanyak 10 kali.', hidden: false },
  { id: 'labyrinth_walker_50', name: '🌋 Raja Labirin', desc: 'Masuk ke dalam Gua Labirin sebanyak 50 kali.', hidden: false },
  { id: 'pet_lover', name: '🏕️ Petualang Bersama Pet', desc: 'Kirim Pet ekspedisi 10 kali.', hidden: false },
  { id: 'pet_master', name: '🐾 Pet Trainer Sejati', desc: 'Kirim Pet ekspedisi 50 kali.', hidden: false },
  { id: 'glutton', name: '🥞 Si Rakus', desc: 'Makan makanan sebanyak 10 kali.', hidden: false },
  { id: 'feast_master', name: '🍗 Koki Pencicip', desc: 'Makan makanan sebanyak 50 kali.', hidden: false },
  { id: 'trader', name: '📦 Pedagang Keliling', desc: 'Menjual barang di pasar sebanyak 1 kali.', hidden: false },
  { id: 'merchant_king', name: '👔 Saudagar Besar', desc: 'Menjual barang di pasar sebanyak 30 kali.', hidden: false },
  { id: 'profesi_miner', name: '⛏️ Penambang Emas', desc: 'Mendaftar profesi Penambang.', hidden: false },
  { id: 'profesi_fisher', name: '🎣 Nelayan Handal', desc: 'Mendaftar profesi Nelayan.', hidden: false },
  { id: 'profesi_merchant', name: '💼 Pedagang Sukses', desc: 'Mendaftar profesi Pedagang.', hidden: false },
  { id: 'profesi_adventurer', name: '🏃 Petualang Sejati', desc: 'Mendaftar profesi Petualang.', hidden: false },
  { id: 'career_change', name: '🔄 Kutu Loncat', desc: 'Mengganti profesi sebanyak 5 kali.', hidden: false },
  { id: 'encounter_begal', name: '🚨 Korban Begal', desc: 'Dicegat begal dalam perjalanan.', hidden: false },
  { id: 'encounter_good', name: '😇 Anak Baik', desc: 'Mendapat kejadian baik (koper/kucing) dalam perjalanan.', hidden: false },
  { id: 'encounter_pengemis', name: '🤝 Dermawan', desc: 'Membantu pengemis tua di jalan.', hidden: false },
  { id: 'low_hp', name: '💔 Hampir Mati', desc: 'Memiliki HP 20 atau lebih rendah.', hidden: false },
  { id: 'max_stamina', name: '⚡ Penuh Energi', desc: 'Memiliki Stamina penuh 100.', hidden: false },
  { id: 'wazle_fan', name: '❤️ Wazle Mania', desc: 'Membuka menu utama Wazle sebanyak 50 kali.', hidden: false }
];

function checkAndGrant(userData, achId, sock, msg) {
  if (!userData.achievements) userData.achievements = [];
  if (!userData.achievements.includes(achId)) {
    userData.achievements.push(achId);
    
    // Find ach details
    const achInfo = ACHIEVEMENTS.find(a => a.id === achId);
    if (!achInfo) return false;
    
    // Reward WP
    userData.wp += 5000;
    
    let notifyMsg = `🎉 *ACHIEVEMENT UNLOCKED!* 🎉\n\n🏆 *${achInfo.name}*\n${achInfo.desc}\n\n🎁 Hadiah: +5000 WP!`;
    
    if (sock && msg) {
      sock.sendMessage(msg.key.remoteJid, { text: notifyMsg }, { quoted: msg }).catch(err => {
        console.error("Gagal mengirim notifikasi achievement:", err);
      });
    }
    
    return true; // Granted
  }
  return false;
}

function evaluateAchievements(userData, event, sock, msg) {
  // Initialize stats if they don't exist
  if (!userData.stats) userData.stats = {};
  if (!userData.achievements) userData.achievements = [];
  
  const type = event.type;

  // 1. Attack Boss checks
  if (type === 'attack_boss') {
    checkAndGrant(userData, 'first_blood', sock, msg);
    
    if (event.damage) {
      userData.stats.total_damage = (userData.stats.total_damage || 0) + event.damage;
      if (userData.stats.total_damage >= 10000) checkAndGrant(userData, 'boss_slayer', sock, msg);
      if (userData.stats.total_damage >= 50000) checkAndGrant(userData, 'boss_destroyer', sock, msg);
      if (userData.stats.total_damage >= 100000) checkAndGrant(userData, 'boss_legend', sock, msg);
    }
    
    userData.stats.boss_attacks = (userData.stats.boss_attacks || 0) + 1;
    if (userData.stats.boss_attacks >= 10) checkAndGrant(userData, 'boss_striker_10', sock, msg);
    if (userData.stats.boss_attacks >= 50) checkAndGrant(userData, 'boss_striker_50', sock, msg);

    if (event.item && event.item.tier >= 8) {
      checkAndGrant(userData, 'mythical_find', sock, msg);
    }
  }
  
  // 2. Travel checks
  if (type === 'travel') {
    if (!userData.stats.visitedLocations) userData.stats.visitedLocations = [];
    if (!userData.stats.visitedLocations.includes(event.location)) {
      userData.stats.visitedLocations.push(event.location);
    }
    
    const allLocations = [
      "Balai Kota",
      "Alun-Alun Pesta",
      "Pasar Fluktuatif",
      "Bengkel Pandai Besi",
      "Stasiun Ekspedisi",
      "Gua Labirin",
      "Pabrik Saham",
      "Hutan Liar"
    ];
    
    if (event.location === "Balai Kota") checkAndGrant(userData, 'explorer_city', sock, msg);
    if (event.location === "Hutan Liar") checkAndGrant(userData, 'explorer_wild', sock, msg);
    if (event.location === "Pasar Fluktuatif") checkAndGrant(userData, 'explorer_market', sock, msg);
    if (event.location === "Bengkel Pandai Besi") checkAndGrant(userData, 'explorer_blacksmith', sock, msg);
    if (event.location === "Stasiun Ekspedisi") checkAndGrant(userData, 'explorer_station', sock, msg);
    if (event.location === "Gua Labirin") checkAndGrant(userData, 'explorer_labyrinth', sock, msg);
    if (event.location === "Alun-Alun Pesta") checkAndGrant(userData, 'explorer_plaza', sock, msg);
    if (event.location === "Pabrik Saham") checkAndGrant(userData, 'explorer_factory', sock, msg);

    const visitedAll = allLocations.every(loc => userData.stats.visitedLocations.includes(loc));
    if (visitedAll) {
      checkAndGrant(userData, 'explorer', sock, msg);
    }
    
    userData.stats.travel_count = (userData.stats.travel_count || 0) + 1;
    if (userData.stats.travel_count >= 10) checkAndGrant(userData, 'traveler_10', sock, msg);
    if (userData.stats.travel_count >= 50) checkAndGrant(userData, 'traveler_50', sock, msg);
    if (userData.stats.travel_count >= 100) checkAndGrant(userData, 'traveler_100', sock, msg);
  }
  
  // 3. Buy Item checks
  if (type === 'buy_item' && event.item) {
    checkAndGrant(userData, 'buy_first', sock, msg);
    userData.stats.total_spent = (userData.stats.total_spent || 0) + event.item.price;
    if (userData.stats.total_spent >= 10000) checkAndGrant(userData, 'spend_10k', sock, msg);
    if (userData.stats.total_spent >= 50000) checkAndGrant(userData, 'spend_50k', sock, msg);
    if (userData.stats.total_spent >= 200000) checkAndGrant(userData, 'spend_200k', sock, msg);
  }
  
  // 4. Labyrinth checks
  if (type === 'labyrinth_safe') {
    userData.stats.safeLabyrinth = (userData.stats.safeLabyrinth || 0) + 1;
    if (userData.stats.safeLabyrinth >= 5) checkAndGrant(userData, 'labyrinth_survivor', sock, msg);
    if (userData.stats.safeLabyrinth >= 15) checkAndGrant(userData, 'labyrinth_master', sock, msg);
    
    userData.stats.labyrinth_runs = (userData.stats.labyrinth_runs || 0) + 1;
    if (userData.stats.labyrinth_runs >= 10) checkAndGrant(userData, 'labyrinth_walker_10', sock, msg);
    if (userData.stats.labyrinth_runs >= 50) checkAndGrant(userData, 'labyrinth_walker_50', sock, msg);
  }
  
  if (type === 'labyrinth_trap') {
    userData.stats.safeLabyrinth = 0; // reset consecutive safe runs
    userData.stats.total_traps = (userData.stats.total_traps || 0) + 1;
    if (userData.stats.total_traps >= 5) checkAndGrant(userData, 'labyrinth_victim', sock, msg);
    
    userData.stats.labyrinth_runs = (userData.stats.labyrinth_runs || 0) + 1;
    if (userData.stats.labyrinth_runs >= 10) checkAndGrant(userData, 'labyrinth_walker_10', sock, msg);
    if (userData.stats.labyrinth_runs >= 50) checkAndGrant(userData, 'labyrinth_walker_50', sock, msg);
  }
  
  if (type === 'labyrinth_chest' && event.item && event.item.tier >= 5) {
    checkAndGrant(userData, 'lucky_find', sock, msg);
  }
  
  // 5. Expedition checks
  if (type === 'finish_expedition') {
    userData.stats.expeditions = (userData.stats.expeditions || 0) + 1;
    if (userData.stats.expeditions >= 10) checkAndGrant(userData, 'pet_lover', sock, msg);
    if (userData.stats.expeditions >= 50) checkAndGrant(userData, 'pet_master', sock, msg);
  }
  
  // 6. Food checks
  if (type === 'eat_food') {
    userData.stats.foodEaten = (userData.stats.foodEaten || 0) + 1;
    if (userData.stats.foodEaten >= 10) checkAndGrant(userData, 'glutton', sock, msg);
    if (userData.stats.foodEaten >= 50) checkAndGrant(userData, 'feast_master', sock, msg);
  }
  
  // 7. Sell checks
  if (type === 'sell_item') {
    userData.stats.items_sold = (userData.stats.items_sold || 0) + 1;
    if (userData.stats.items_sold >= 1) checkAndGrant(userData, 'trader', sock, msg);
    if (userData.stats.items_sold >= 30) checkAndGrant(userData, 'merchant_king', sock, msg);
  }
  
  // 8. Profession checks
  if (type === 'change_profession') {
    userData.stats.profession_changes = (userData.stats.profession_changes || 0) + 1;
    if (userData.stats.profession_changes >= 5) checkAndGrant(userData, 'career_change', sock, msg);
    
    if (event.profesi === 'Penambang') checkAndGrant(userData, 'profesi_miner', sock, msg);
    if (event.profesi === 'Nelayan') checkAndGrant(userData, 'profesi_fisher', sock, msg);
    if (event.profesi === 'Pedagang') checkAndGrant(userData, 'profesi_merchant', sock, msg);
    if (event.profesi === 'Petualang') checkAndGrant(userData, 'profesi_adventurer', sock, msg);
  }
  
  // 9. Encounter checks
  if (type === 'encounter') {
    if (event.encounterType === 'bad') checkAndGrant(userData, 'encounter_begal', sock, msg);
    if (event.encounterType === 'good') checkAndGrant(userData, 'encounter_good', sock, msg);
    if (event.encounterType === 'neutral') checkAndGrant(userData, 'encounter_pengemis', sock, msg);
  }
  
  // 10. Open Map / UI checks
  if (type === 'open_map') {
    userData.stats.open_map_count = (userData.stats.open_map_count || 0) + 1;
    if (userData.stats.open_map_count >= 50) checkAndGrant(userData, 'wazle_fan', sock, msg);
  }

  // --- PASSIVE STAT CHECKS ---
  if (userData.wp >= 10000) checkAndGrant(userData, 'rich_10k', sock, msg);
  if (userData.wp >= 50000) checkAndGrant(userData, 'rich_50k', sock, msg);
  if (userData.wp >= 100000) checkAndGrant(userData, 'rich_100k', sock, msg);
  if (userData.wp >= 1000000) checkAndGrant(userData, 'rich', sock, msg);
  if (userData.wp >= 5000000) checkAndGrant(userData, 'capitalist', sock, msg);
  
  if (userData.hp <= 20) checkAndGrant(userData, 'low_hp', sock, msg);
  if (userData.stamina >= 100) checkAndGrant(userData, 'max_stamina', sock, msg);

  // Recalculate Wazle Score
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
  
  userData.wazle_score = score;
}

module.exports = {
  ACHIEVEMENTS,
  evaluateAchievements
};
