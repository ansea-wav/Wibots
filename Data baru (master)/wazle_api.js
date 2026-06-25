const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ==========================================
// 🌍 WAZLE EXPEDITION (Games / Tebak)
// ==========================================

// Fitur tebak bendera dan kucing dipindah ke tebak_games.js untuk integrasi Room System

async function handleMeme(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://meme-api.com/gimme');
    await socket.sendMessage(remoteJid, { image: { url: res.data.url }, caption: `😂 *MEME RANDOM*\n\nTitle: ${res.data.title}` }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil meme.' }, { quoted: msg });
    return true;
  }
}


// ==========================================
// 🧠 WAZLE KNOWLEDGE
// ==========================================

async function handleWiki(socket, remoteJid, msg, query) {
  if (!query) {
    await socket.sendMessage(remoteJid, { text: 'Masukkan kata kunci! Contoh: *!wiki Black Hole*' }, { quoted: msg });
    return true;
  }
  try {
    const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    let text = `📖 *WIKIPEDIA*\n\n*${res.data.title}*\n${res.data.extract}\n\n_Sumber: ${res.data.content_urls?.desktop?.page || 'Wikipedia'}_`;
    
    if (res.data.thumbnail) {
      await socket.sendMessage(remoteJid, { image: { url: res.data.thumbnail.source }, caption: text }, { quoted: msg });
    } else {
      await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    }
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Halaman Wikipedia tidak ditemukan.' }, { quoted: msg });
    return true;
  }
}

async function handleFakta(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random');
    await socket.sendMessage(remoteJid, { text: `🧠 *FAKTA RANDOM*\n\n${res.data.text}` }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil fakta.' }, { quoted: msg });
    return true;
  }
}

async function handleMathFact(socket, remoteJid, msg) {
  try {
    const res = await axios.get('http://numbersapi.com/random/math');
    await socket.sendMessage(remoteJid, { text: `🔢 *FAKTA MATEMATIKA*\n\n${res.data}` }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil fakta matematika.' }, { quoted: msg });
    return true;
  }
}

async function handleHistory(socket, remoteJid, msg) {
  try {
    const date = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const res = await axios.get(`http://numbersapi.com/${month}/${day}/date`);
    await socket.sendMessage(remoteJid, { text: `📜 *HARI INI DALAM SEJARAH*\n\n${res.data}` }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data sejarah.' }, { quoted: msg });
    return true;
  }
}

// ==========================================
// 🌌 WAZLE ASTRONOMY
// ==========================================

async function handleISS(socket, remoteJid, msg) {
  try {
    const res = await axios.get('http://api.open-notify.org/iss-now.json');
    const pos = res.data.iss_position;
    await socket.sendMessage(remoteJid, { text: `🛰️ *ISS TRACKER*\n\nLatitude: ${pos.latitude}\nLongitude: ${pos.longitude}\n\n_Stasiun Luar Angkasa Internasional saat ini berada di koordinat di atas._` }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal melacak ISS.' }, { quoted: msg });
    return true;
  }
}

async function handleNasa(socket, remoteJid, msg) {
  try {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const res = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
    let text = `🌌 *NASA APOD (Astronomy Picture of the Day)*\n\n*${res.data.title}*\n\n${res.data.explanation}`;
    
    if (res.data.media_type === 'image') {
      await socket.sendMessage(remoteJid, { image: { url: res.data.url }, caption: text }, { quoted: msg });
    } else {
      await socket.sendMessage(remoteJid, { text: text + `\n\nLink: ${res.data.url}` }, { quoted: msg });
    }
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data dari NASA. Mungkin limit API harian tercapai.' }, { quoted: msg });
    return true;
  }
}

async function handleAsteroid(socket, remoteJid, msg) {
  try {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const date = new Date().toISOString().split('T')[0];
    const res = await axios.get(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${date}&end_date=${date}&api_key=${apiKey}`);
    const neos = res.data.near_earth_objects[date];
    if (!neos || neos.length === 0) {
      await socket.sendMessage(remoteJid, { text: '☄️ Tidak ada asteroid mendekat yang tercatat hari ini.' }, { quoted: msg });
      return true;
    }
    const target = neos[0];
    let text = `☄️ *ASTEROID TRACKER*\n\nNama: ${target.name}\nPotensi Berbahaya: ${target.is_potentially_hazardous_asteroid ? '⚠️ YA' : '❌ TIDAK'}\nKecepatan: ${parseFloat(target.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(2)} km/h\nJarak: ${parseFloat(target.close_approach_data[0].miss_distance.kilometers).toLocaleString('id-ID')} km`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data asteroid.' }, { quoted: msg });
    return true;
  }
}

// ==========================================
// 🌤️ WAZLE WEATHER
// ==========================================
async function handleCuaca(socket, remoteJid, msg, kota) {
  if (!kota) {
    await socket.sendMessage(remoteJid, { text: 'Masukkan nama kota! Contoh: *!cuaca Bandung*' }, { quoted: msg });
    return true;
  }
  try {
    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kota)}&count=1&language=id&format=json`);
    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      await socket.sendMessage(remoteJid, { text: `❌ Kota ${kota} tidak ditemukan.` }, { quoted: msg });
      return true;
    }
    const location = geoRes.data.results[0];
    const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true`);
    const cw = weatherRes.data.current_weather;
    
    await socket.sendMessage(remoteJid, { text: `🌤️ *CUACA HARI INI*\n\n📍 Lokasi: ${location.name}, ${location.country}\n🌡️ Suhu: ${cw.temperature}°C\n💨 Angin: ${cw.windspeed} km/h` }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data cuaca.' }, { quoted: msg });
    return true;
  }
}

async function handleQuake(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson');
    if (!res.data.features || res.data.features.length === 0) {
      await socket.sendMessage(remoteJid, { text: 'Belum ada gempa signifikan bulan ini (USGS).' }, { quoted: msg });
      return true;
    }
    const q = res.data.features[0].properties;
    let text = `🌋 *INFO GEMPA TERKINI*\n\nLokasi: ${q.place}\nMagnitude: ${q.mag} SR\nWaktu: ${new Date(q.time).toLocaleString('id-ID')}\nPotensi Tsunami: ${q.tsunami ? '⚠️ YA' : '❌ TIDAK'}\n\n_Sumber: USGS_`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch(e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil info gempa.' }, { quoted: msg });
    return true;
  }
}

// ==========================================
// 🎮 WAZLE GAMER & CONNECT
// ==========================================
async function handleMC(socket, remoteJid, msg, ip) {
  if (!ip) {
    await socket.sendMessage(remoteJid, { text: 'Masukkan IP server! Contoh: *!mc mc.hypixel.net*' }, { quoted: msg });
    return true;
  }
  try {
    const res = await axios.get(`https://api.mcsrvstat.us/2/${encodeURIComponent(ip)}`);
    const data = res.data;
    if (!data.online) {
      await socket.sendMessage(remoteJid, { text: `❌ Server ${ip} sedang offline atau tidak ditemukan.` }, { quoted: msg });
      return true;
    }
    let text = `🎮 *MINECRAFT SERVER*\n\nIP: ${data.ip}\nPort: ${data.port}\nStatus: ONLINE ✅\nPlayers: ${data.players.online} / ${data.players.max}\nVersi: ${data.version}`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengecek server Minecraft.' }, { quoted: msg });
    return true;
  }
}

async function handleIP(socket, remoteJid, msg, ip) {
  if (!ip) {
    await socket.sendMessage(remoteJid, { text: 'Masukkan IP address! Contoh: *!ip 8.8.8.8*' }, { quoted: msg });
    return true;
  }
  try {
    const res = await axios.get(`http://ipwho.is/${encodeURIComponent(ip)}`);
    const data = res.data;
    if (!data.success) {
      await socket.sendMessage(remoteJid, { text: `❌ IP ${ip} tidak valid.` }, { quoted: msg });
      return true;
    }
    let text = `🌐 *IP GEOLOCATION*\n\nIP: ${data.ip}\nTipe: ${data.type}\nNegara: ${data.country} ${data.flag.emoji}\nKota: ${data.city}\nISP: ${data.connection.isp}`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengecek IP.' }, { quoted: msg });
    return true;
  }
}

async function handleDomain(socket, remoteJid, msg, domain) {
  if (!domain) {
    await socket.sendMessage(remoteJid, { text: 'Masukkan nama domain! Contoh: *!domain google.com*' }, { quoted: msg });
    return true;
  }
  try {
    const res = await axios.get(`https://networkcalc.com/api/dns/lookup/${encodeURIComponent(domain)}`);
    const data = res.data;
    if (data.status !== 'OK' || !data.records || !data.records.A) {
      await socket.sendMessage(remoteJid, { text: `❌ Domain ${domain} tidak valid atau tidak memiliki record A.` }, { quoted: msg });
      return true;
    }
    const aRecords = data.records.A.map(r => r.address).join(', ');
    let text = `🌐 *DOMAIN INFO*\n\nDomain: ${data.hostname}\nA Records: ${aRecords}`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengecek domain.' }, { quoted: msg });
    return true;
  }
}

async function handleSteam(socket, remoteJid, msg, game) {
  if (!game) {
    await socket.sendMessage(remoteJid, { text: 'Masukkan judul game! Contoh: *!steam gta v*' }, { quoted: msg });
    return true;
  }
  try {
    const searchRes = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(game)}&l=indonesian&cc=id`);
    if (!searchRes.data.items || searchRes.data.items.length === 0) {
      await socket.sendMessage(remoteJid, { text: `❌ Game ${game} tidak ditemukan di Steam.` }, { quoted: msg });
      return true;
    }
    const item = searchRes.data.items[0];
    const harga = item.price ? `Rp ${item.price.final / 100}` : 'Gratis / Tidak dijual';
    
    let text = `🎮 *STEAM STORE*\n\n*${item.name}*\nHarga: ${harga}\n`;
    if (item.price && item.price.discount_percent > 0) {
      text += `Diskon: ${item.price.discount_percent}%\n`;
    }
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data dari Steam.' }, { quoted: msg });
    return true;
  }
}

async function handleCrypto(socket, remoteJid, msg, koin) {
  if (!koin) {
    await socket.sendMessage(remoteJid, { text: 'Masukkan kode koin! Contoh: *!crypto bitcoin*' }, { quoted: msg });
    return true;
  }
  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(koin)}&vs_currencies=idr&include_24hr_change=true`);
    const data = res.data[koin.toLowerCase()];
    if (!data) {
      await socket.sendMessage(remoteJid, { text: `❌ Koin ${koin} tidak ditemukan.` }, { quoted: msg });
      return true;
    }
    
    let text = `💰 *CRYPTO INFO*\n\nKoin: ${koin.toUpperCase()}\nHarga: Rp ${data.idr.toLocaleString('id-ID')}\nPerubahan 24j: ${data.idr_24h_change.toFixed(2)}%`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data crypto.' }, { quoted: msg });
    return true;
  }
}


// ==========================================
// ROUTER MAIN
// ==========================================
async function handleApiCommand(socket, remoteJid, msg, command, args) {
  const query = args.join(' ');
  
  if (command === 'meme') return await handleMeme(socket, remoteJid, msg);
  
  if (command === 'wiki') return await handleWiki(socket, remoteJid, msg, query);
  if (command === 'fakta' || command === 'fact') return await handleFakta(socket, remoteJid, msg);
  if (command === 'mathfact') return await handleMathFact(socket, remoteJid, msg);
  if (command === 'history') return await handleHistory(socket, remoteJid, msg);
  
  if (command === 'iss') return await handleISS(socket, remoteJid, msg);
  if (command === 'nasa' || command === 'apod') return await handleNasa(socket, remoteJid, msg);
  if (command === 'asteroid') return await handleAsteroid(socket, remoteJid, msg);
  
  if (command === 'cuaca' || command === 'weather') return await handleCuaca(socket, remoteJid, msg, query);
  if (command === 'quake' || command === 'gempa') return await handleQuake(socket, remoteJid, msg);
  
  if (command === 'steam') return await handleSteam(socket, remoteJid, msg, query);
  if (command === 'crypto') return await handleCrypto(socket, remoteJid, msg, query);
  if (command === 'mc') return await handleMC(socket, remoteJid, msg, query);
  if (command === 'ip') return await handleIP(socket, remoteJid, msg, query);
  if (command === 'domain') return await handleDomain(socket, remoteJid, msg, query);

  // Jika tebak lain, fallback
  // Fitur tebak sudah dihandle di sessionmanager.js dan tebak_games.js

  return false;
}

module.exports = {
  handleApiCommand
};
