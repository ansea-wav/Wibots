const { fetchBotcahx } = require('./botcahx_api');

async function testGames() {
  try {
    const meme = await fetchBotcahx('/api/game/tebakmeme').catch(e=>e.message);
    console.log("Tebak Meme:", meme);
    
    const anime = await fetchBotcahx('/api/game/tebakanime').catch(e=>e.message);
    console.log("Tebak Anime:", anime);
    
    const drakor = await fetchBotcahx('/api/game/tebakdrakor').catch(e=>e.message);
    console.log("Tebak Drakor:", drakor);
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

testGames();
