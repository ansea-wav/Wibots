const { fetchBotcahx } = require('./botcahx_api');

async function testApi() {
  try {
    const tt = await fetchBotcahx('/api/dowloader/tiktok', { url: 'https://vt.tiktok.com/ZSY2e5B8g/' }).catch(e=>e.message);
    console.log("TT:", tt.result || tt);

    const ig = await fetchBotcahx('/api/dowloader/igdowloader', { url: 'https://www.instagram.com/reel/C7-3b2dM_7t/' }).catch(e=>e.message);
    console.log("IG:", ig.result || ig);

    const tw = await fetchBotcahx('/api/dowloader/twitter', { url: 'https://twitter.com/X/status/1798835017161834925' }).catch(e=>e.message);
    console.log("TW:", tw.result || tw);
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

testApi();
