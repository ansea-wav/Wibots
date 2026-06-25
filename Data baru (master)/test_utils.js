const { fetchBotcahx } = require('./botcahx_api');

async function testUtils() {
  try {
    const pin = await fetchBotcahx('/api/search/pinterest', { text: 'kucing' }).catch(e=>e.message);
    console.log("Pinterest:", typeof pin === 'object' ? (pin.result ? pin.result.slice(0,2) : pin) : pin);
    
    // Testing text to speech (tts)
    const tts = await fetchBotcahx('/api/sound/texttospeech', { text: 'halo dunia', lang: 'id' }).catch(e=>e.message);
    console.log("TTS:", typeof tts === 'object' ? tts.result : tts);
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

testUtils();
