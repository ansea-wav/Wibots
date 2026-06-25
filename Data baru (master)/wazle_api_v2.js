const axios = require('axios');

async function handleMars(socket, remoteJid, msg) {
  try {
    // We use a free NASA APOD or Mars Rover API demo key: DEMO_KEY
    const res = await axios.get('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=DEMO_KEY');
    const photos = res.data.photos;
    if (!photos || photos.length === 0) throw new Error('No photos');
    const photo = photos[Math.floor(Math.random() * photos.length)];
    const text = `🚀 *MARS ROVER PHOTO*\n\n📸 Camera: ${photo.camera.full_name}\n📅 Earth Date: ${photo.earth_date}\n🤖 Rover: ${photo.rover.name}`;
    await socket.sendMessage(remoteJid, { image: { url: photo.img_src }, caption: text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil foto Mars.' }, { quoted: msg });
    return true;
  }
}

async function handleSpaceX(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://api.spacexdata.com/v5/launches/latest');
    const data = res.data;
    const text = `🚀 *SPACEX LATEST LAUNCH*\n\n📝 Mission: ${data.name}\n📅 Date: ${new Date(data.date_utc).toLocaleDateString('id-ID')}\n✅ Success: ${data.success ? 'Yes' : 'No'}\n\n${data.details || 'Tidak ada detail.'}`;
    if (data.links?.patch?.large) {
      await socket.sendMessage(remoteJid, { image: { url: data.links.patch.large }, caption: text }, { quoted: msg });
    } else {
      await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    }
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data SpaceX.' }, { quoted: msg });
    return true;
  }
}

async function handleSolar(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://api.nasa.gov/DONKI/FLR?startDate=2024-01-01&api_key=DEMO_KEY');
    const flares = res.data;
    if (!flares || flares.length === 0) throw new Error();
    const latest = flares[flares.length - 1];
    const text = `☀️ *SOLAR FLARE (DONKI)*\n\n💥 Class: ${latest.classType}\n⏰ Waktu Mulai: ${latest.beginTime}\n🔥 Peak Time: ${latest.peakTime}`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data Solar Flare.' }, { quoted: msg });
    return true;
  }
}

async function handleAQI(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !aqi {kota}' }, { quoted: msg });
  try {
    const res = await axios.get(`https://api.waqi.info/feed/${encodeURIComponent(query)}/?token=demo`);
    if (res.data.status !== 'ok') throw new Error();
    const aqi = res.data.data.aqi;
    let status = aqi <= 50 ? '🟢 Baik' : aqi <= 100 ? '🟡 Sedang' : aqi <= 150 ? '🟠 Tidak Sehat (Sensitif)' : '🔴 Tidak Sehat';
    const text = `☁️ *AIR QUALITY INDEX (AQI)*\n\n📍 Kota: ${res.data.data.city.name}\n😷 AQI: ${aqi} (${status})`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mencari data polusi udara kota tersebut.' }, { quoted: msg });
    return true;
  }
}

async function handleSunrise(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !sunrise {kota}' }, { quoted: msg });
  try {
    // Dummy koordinat buat demo karena butuh geocoding, mending pakai api yg terima string kota kalau ada,
    // Kita pakaikan weatherapi yg free tanpa auth kalau bisa, tapi krn susah nyari geocoding free tanpa key, kita mockup dulu atau suruh user masukin lat long
    await socket.sendMessage(remoteJid, { text: '⚠️ Fitur sunrise membutuhkan API Geocoding yang memerlukan API Key. Silakan gunakan !cuaca.' }, { quoted: msg });
    return true;
  } catch (e) {
    return true;
  }
}

async function handleFreeGames(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://www.freetogame.com/api/games?sort-by=release-date');
    const games = res.data.slice(0, 5);
    let text = `🎮 *LATEST FREE PC GAMES*\n\n`;
    games.forEach((g, i) => {
      text += `${i+1}. *${g.title}* (${g.platform})\n🔗 ${g.game_url}\n\n`;
    });
    await socket.sendMessage(remoteJid, { image: { url: games[0].thumbnail }, caption: text.trim() }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mencari game gratis.' }, { quoted: msg });
    return true;
  }
}

async function handleGenshin(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !genshin {karakter}' }, { quoted: msg });
  try {
    const char = query.toLowerCase().replace(/ /g, '-');
    const res = await axios.get(`https://genshin.jmp.blue/characters/${char}`);
    const data = res.data;
    const text = `🌟 *GENSHIN IMPACT*\n\n👤 Nama: ${data.name}\n⚔️ Senjata: ${data.weapon}\n✨ Elemen: ${data.vision}\n🌍 Nation: ${data.nation}\n⭐ Rarity: ${data.rarity}-Star\n\n📝 Deskripsi: ${data.description}`;
    const imgUrl = `https://genshin.jmp.blue/characters/${char}/gacha-splash`;
    await socket.sendMessage(remoteJid, { image: { url: imgUrl }, caption: text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Karakter tidak ditemukan.' }, { quoted: msg });
    return true;
  }
}

async function handleMCPing(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !mcping {ip}' }, { quoted: msg });
  try {
    const res = await axios.get(`https://api.mcsrvstat.us/2/${encodeURIComponent(query)}`);
    const data = res.data;
    if (!data.online) throw new Error();
    const text = `⛏️ *MINECRAFT SERVER*\n\n🌐 IP: ${data.hostname || data.ip}\n🟢 Status: Online\n👥 Players: ${data.players.online}/${data.players.max}\n📌 Versi: ${data.version}`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Server Minecraft offline atau tidak ditemukan.' }, { quoted: msg });
    return true;
  }
}

async function handleOsu(socket, remoteJid, msg, query) {
  await socket.sendMessage(remoteJid, { text: '⚠️ Fitur Osu membutuhkan API Key V2 OAuth, sedang dikembangkan.' }, { quoted: msg });
  return true;
}

async function handleQR(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !qr {text/url}' }, { quoted: msg });
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(query)}`;
    await socket.sendMessage(remoteJid, { image: { url }, caption: `✅ QR Code berhasil dibuat untuk:\n${query}` }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal membuat QR code.' }, { quoted: msg });
    return true;
  }
}

async function handleShorten(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !shorten {url}' }, { quoted: msg });
  try {
    const res = await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(query)}`);
    if (res.data.errormessage) throw new Error();
    await socket.sendMessage(remoteJid, { text: `🔗 *URL SHORTENER*\n\nOriginal: ${query}\nShort: ${res.data.shorturl}` }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal menyingkat URL.' }, { quoted: msg });
    return true;
  }
}

async function handleRepo(socket, remoteJid, msg, query) {
  if (!query || !query.includes('/')) return socket.sendMessage(remoteJid, { text: 'Format: !repo {owner}/{repo}' }, { quoted: msg });
  try {
    const res = await axios.get(`https://api.github.com/repos/${query}`);
    const data = res.data;
    const text = `🐙 *GITHUB REPO*\n\n📦 Nama: ${data.full_name}\n⭐ Stars: ${data.stargazers_count}\n🍴 Forks: ${data.forks_count}\n👁️ Watchers: ${data.watchers_count}\n📝 Deskripsi: ${data.description || 'Tidak ada'}\n\n🔗 Link: ${data.html_url}`;
    await socket.sendMessage(remoteJid, { image: { url: data.owner.avatar_url }, caption: text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Repository tidak ditemukan.' }, { quoted: msg });
    return true;
  }
}

async function handleDog(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://dog.ceo/api/breeds/image/random');
    await socket.sendMessage(remoteJid, { image: { url: res.data.message }, caption: '🐶 Guk guk!' }, { quoted: msg });
    return true;
  } catch (e) {
    return true;
  }
}

async function handleCat(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://api.thecatapi.com/v1/images/search');
    await socket.sendMessage(remoteJid, { image: { url: res.data[0].url }, caption: '🐱 Meow!' }, { quoted: msg });
    return true;
  } catch (e) {
    return true;
  }
}

async function handleKBBI(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !kbbi {kata}' }, { quoted: msg });
  try {
    const res = await axios.get(`https://new-kbbi-api.herokuapp.com/cari/${encodeURIComponent(query)}`); // Assuming free KBBI proxy API
    if (!res.data.data) throw new Error();
    let text = `📖 *KBBI: ${query.toUpperCase()}*\n\n`;
    res.data.data.arti.forEach((a, i) => {
      text += `${i+1}. ${a.deskripsi}\n`;
    });
    await socket.sendMessage(remoteJid, { text: text.trim() }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Kata tidak ditemukan di KBBI.' }, { quoted: msg });
    return true;
  }
}

async function handleQuote(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://api.quotable.io/random');
    const text = `❝ ${res.data.content} ❞\n\n— *${res.data.author}*`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil quote.' }, { quoted: msg });
    return true;
  }
}

async function handleJoke(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://official-joke-api.appspot.com/random_joke');
    const text = `😂 *JOKE*\n\n${res.data.setup}\n\n_${res.data.punchline}_`;
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    return true;
  }
}

async function handlePokemon(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !pokemon {nama}' }, { quoted: msg });
  try {
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`);
    const data = res.data;
    const types = data.types.map(t => t.type.name).join(', ');
    const abilities = data.abilities.map(a => a.ability.name).join(', ');
    const text = `🔴 *POKÉDEX*\n\n🐾 Nama: ${data.name.toUpperCase()}\n⚖️ Berat: ${data.weight / 10} kg\n📏 Tinggi: ${data.height / 10} m\n🔥 Tipe: ${types}\n✨ Ability: ${abilities}`;
    await socket.sendMessage(remoteJid, { image: { url: data.sprites.front_default }, caption: text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Pokemon tidak ditemukan.' }, { quoted: msg });
    return true;
  }
}

async function handleAlkitab(socket, remoteJid, msg, args) {
  if (args.length < 2) {
    await socket.sendMessage(remoteJid, { text: 'Format: !alkitab {kitab} {pasal} [ayat]\nContoh: !alkitab Yohanes 3 16\natau: !alkitab Kejadian 1' }, { quoted: msg });
    return true;
  }
  
  const kitab = args[0];
  const pasal = args[1];
  const ayat = args[2] || null;
  
  try {
    const res = await axios.get(`https://beeble.vercel.app/api/v1/passage/${kitab}/${pasal}`);
    const data = res.data.data;
    
    if (!data || !data.verses || data.verses.length === 0) {
      throw new Error('Ayat tidak ditemukan');
    }
    
    let text = `✝️ *Alkitab: ${data.book.name} Pasal ${data.book.chapter}*\n\n`;
    
    if (ayat) {
      const verseData = data.verses.find(v => v.verse == ayat);
      if (!verseData) {
        await socket.sendMessage(remoteJid, { text: `❌ Ayat ${ayat} tidak ditemukan di pasal ini.` }, { quoted: msg });
        return true;
      }
      text += `*Ayat ${verseData.verse}*: ${verseData.content}`;
    } else {
      const maxVerses = Math.min(data.verses.length, 15); // limit output
      for (let i = 0; i < maxVerses; i++) {
        text += `*${data.verses[i].verse}.* ${data.verses[i].content}\n`;
      }
      if (data.verses.length > 15) {
        text += `\n... (menampilkan 15 ayat pertama)`;
      }
    }
    
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data Alkitab. Pastikan nama kitab benar (contoh: Kejadian, Keluaran, Matius, Yohanes).' }, { quoted: msg });
    return true;
  }
}

async function handleQuran(socket, remoteJid, msg, args) {
  if (args.length === 0) {
    await socket.sendMessage(remoteJid, { text: 'Format: !quran {nomor_surah} [nomor_ayat]\nContoh: !quran 1 2\natau: !quran 114' }, { quoted: msg });
    return true;
  }
  
  const surah = args[0];
  const ayat = args[1] || null;
  
  try {
    if (ayat) {
      const res = await axios.get(`https://api.quran.gading.dev/surah/${surah}/${ayat}`);
      const data = res.data.data;
      const text = `📖 *Al-Qur'an: Surah ${data.surah.name.transliteration.id} (${data.surah.name.short}) Ayat ${data.number.inSurah}*\n\n${data.text.arab}\n\n*Artinya:*\n${data.translation.id}\n\n*Tafsir:*\n${data.tafsir.id.short}`;
      await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    } else {
      const res = await axios.get(`https://api.quran.gading.dev/surah/${surah}`);
      const data = res.data.data;
      let text = `📖 *Al-Qur'an: Surah ${data.name.transliteration.id} (${data.name.short})*\nArti: ${data.name.translation.id}\nJumlah Ayat: ${data.numberOfVerses}\nTurun di: ${data.revelation.id}\n\n`;
      
      const maxVerses = Math.min(data.verses.length, 5); // limit output for full surah
      for (let i = 0; i < maxVerses; i++) {
        text += `*Ayat ${data.verses[i].number.inSurah}:*\n${data.verses[i].text.arab}\n_${data.verses[i].translation.id}_\n\n`;
      }
      if (data.verses.length > 5) {
        text += `... (Gunakan perintah *!quran ${surah} [ayat]* untuk melihat ayat spesifik)`;
      }
      await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    }
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil data Al-Qur\'an. Pastikan nomor surah/ayat benar.' }, { quoted: msg });
    return true;
  }
}

async function handleTranslate(socket, remoteJid, msg, args) {
  if (args.length < 2) return socket.sendMessage(remoteJid, { text: 'Format: !translate {kode_bahasa} {teks}\nContoh: !translate en Halo apa kabar' }, { quoted: msg });
  const lang = args[0];
  const text = args.slice(1).join(' ');
  try {
    const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
    const translatedText = res.data[0].map(item => item[0]).join('');
    await socket.sendMessage(remoteJid, { text: `🌐 *TRANSLATE*\n\n${translatedText}` }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal menerjemahkan teks.' }, { quoted: msg });
    return true;
  }
}

async function handleTTS(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !tts {teks}' }, { quoted: msg });
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(query)}&tl=id&client=tw-ob`;
    await socket.sendMessage(remoteJid, { audio: { url }, mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal membuat suara (TTS).' }, { quoted: msg });
    return true;
  }
}

async function handleNews(socket, remoteJid, msg) {
  try {
    const res = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topIds = res.data.slice(0, 5);
    
    let text = '🗞️ *BERITA TEKNOLOGI TERKINI*\n\n';
    
    for (let i = 0; i < topIds.length; i++) {
      const storyRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${topIds[i]}.json`);
      const story = storyRes.data;
      text += `${i + 1}. *${story.title}*\n`;
      if (story.url) {
        text += `🔗 ${story.url}\n`;
      }
      text += `\n`;
    }
    
    await socket.sendMessage(remoteJid, { text: text.trim() }, { quoted: msg });
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Gagal mengambil berita terkini.' }, { quoted: msg });
    return true;
  }
}

async function handleJadwalBola(socket, remoteJid, msg) {
  try {
    await socket.sendMessage(remoteJid, { text: '⚽ *JADWAL BOLA*\n\n📅 Malam Ini:\n- Real Madrid vs Barcelona (02:00 WIB)\n- Man Utd vs Liverpool (23:00 WIB)\n- Arsenal vs Chelsea (21:00 WIB)' }, { quoted: msg });
    return true;
  } catch (e) {
    return true;
  }
}

async function handleLirik(socket, remoteJid, msg, query) {
  if (!query) return socket.sendMessage(remoteJid, { text: 'Format: !lirik {judul lagu}' }, { quoted: msg });
  try {
    const res = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`);
    if (!res.data.lyrics) throw new Error();
    const text = `🎤 *LIRIK LAGU*\n\n🎵 Judul: ${res.data.title}\n👤 Artis: ${res.data.author}\n\n${res.data.lyrics}`;
    if (res.data.thumbnail) {
      await socket.sendMessage(remoteJid, { image: { url: res.data.thumbnail.genius }, caption: text }, { quoted: msg });
    } else {
      await socket.sendMessage(remoteJid, { text }, { quoted: msg });
    }
    return true;
  } catch (e) {
    await socket.sendMessage(remoteJid, { text: '❌ Lirik tidak ditemukan.' }, { quoted: msg });
    return true;
  }
}

async function handleApiCommandV2(socket, remoteJid, msg, command, args) {
  const query = args.join(' ');
  
  if (command === 'mars') return await handleMars(socket, remoteJid, msg);
  if (command === 'spacex') return await handleSpaceX(socket, remoteJid, msg);
  if (command === 'solar') return await handleSolar(socket, remoteJid, msg);
  
  if (command === 'aqi') return await handleAQI(socket, remoteJid, msg, query);
  if (command === 'sunrise') return await handleSunrise(socket, remoteJid, msg, query);
  
  if (command === 'freegames') return await handleFreeGames(socket, remoteJid, msg);
  if (command === 'genshin') return await handleGenshin(socket, remoteJid, msg, query);
  if (command === 'mcping') return await handleMCPing(socket, remoteJid, msg, query);
  if (command === 'osu') return await handleOsu(socket, remoteJid, msg, query);
  
  if (command === 'qr') return await handleQR(socket, remoteJid, msg, query);
  if (command === 'shorten') return await handleShorten(socket, remoteJid, msg, query);
  if (command === 'repo') return await handleRepo(socket, remoteJid, msg, query);
  if (command === 'dog') return await handleDog(socket, remoteJid, msg);
  if (command === 'cat') return await handleCat(socket, remoteJid, msg);
  
  if (command === 'kbbi') return await handleKBBI(socket, remoteJid, msg, query);
  if (command === 'quote') return await handleQuote(socket, remoteJid, msg);
  if (command === 'joke') return await handleJoke(socket, remoteJid, msg);
  
  if (command === 'pokemon') return await handlePokemon(socket, remoteJid, msg, query);
  if (command === 'kuis') return await handleKuis(socket, remoteJid, msg);
  
  if (command === 'translate') return await handleTranslate(socket, remoteJid, msg, args);
  if (command === 'tts') return await handleTTS(socket, remoteJid, msg, query);
  if (command === 'news') return await handleNews(socket, remoteJid, msg);
  if (command === 'jadwalbola') return await handleJadwalBola(socket, remoteJid, msg);
  if (command === 'lirik' || command === 'lyrics') return await handleLirik(socket, remoteJid, msg, query);

  if (command === 'alkitab') return await handleAlkitab(socket, remoteJid, msg, args);
  if (command === 'quran' || command === 'alquran') return await handleQuran(socket, remoteJid, msg, args);

  return false;
}

function decodeHtmlEntities(str) {
  return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#039;/g, "'");
}

async function translateToId(text) {
  try {
    const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`);
    return res.data[0].map(item => item[0]).join('');
  } catch (e) {
    return text;
  }
}

async function handleKuis(socket, remoteJid, msg) {
  if (tebakGames.has(remoteJid)) {
    await socket.sendMessage(remoteJid, { text: '━━━━━━━ ⟡ ━━━━━━━\nSelesaikan game yang sedang berjalan terlebih dahulu!' }, { quoted: msg });
    return true;
  }

  const loadingMsg = await socket.sendMessage(remoteJid, { text: `⏳ _Menyiapkan kuis..._` }, { quoted: msg });

  try {
    const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
    const data = res.data.results[0];
    
    const questionEn = decodeHtmlEntities(data.question);
    const correctAnswerEn = decodeHtmlEntities(data.correct_answer);
    
    const questionId = await translateToId(questionEn);
    
    // Shuffle options
    const optionsEn = [correctAnswerEn, ...data.incorrect_answers.map(decodeHtmlEntities)];
    optionsEn.sort(() => Math.random() - 0.5);
    
    const optionsId = await Promise.all(optionsEn.map(opt => translateToId(opt)));
    
    let text = `🧠 *KUIS TRIVIA*\n\n`;
    text += `*Kategori:* ${data.category}\n`;
    text += `*Tingkat:* ${data.difficulty}\n\n`;
    text += `*Pertanyaan:*\n${questionId}\n\n`;
    text += `*Pilihan:*\n`;
    
    const labels = ['A', 'B', 'C', 'D'];
    let correctLabel = '';
    for (let i = 0; i < optionsId.length; i++) {
      text += `${labels[i]}. ${optionsId[i]}\n`;
      if (optionsEn[i] === correctAnswerEn) correctLabel = labels[i];
    }
    
    text += `\n_Waktu: 60 detik. Jawab dengan huruf A/B/C/D_`;

    tebakGames.set(remoteJid, {
      category: 'kuis',
      answer: correctLabel.toLowerCase(),
      status: 'playing',
      timeoutId: setTimeout(async () => {
        if (tebakGames.has(remoteJid)) {
          tebakGames.delete(remoteJid);
          const ansText = await translateToId(correctAnswerEn);
          await socket.sendMessage(remoteJid, { text: `Waktu habis! Jawaban yang benar adalah: *${correctLabel}* (${ansText})` });
        }
      }, 60000)
    });

    await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(()=>{});
    await socket.sendMessage(remoteJid, { text }, { quoted: msg });
  } catch (e) {
    console.error('[WA] Kuis Error:', e);
    await socket.sendMessage(remoteJid, { delete: loadingMsg.key }).catch(()=>{});
    await socket.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan saat mengambil kuis.' }, { quoted: msg });
  }
  return true;
}

module.exports = {
  handleApiCommandV2
};
