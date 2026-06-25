const axios = require('axios');
const cheerio = require('cheerio');

async function dl(url) {
  try {
    const res = await axios.get('https://twitsave.com/info?url=' + encodeURIComponent(url));
    const $ = cheerio.load(res.data);
    const link = $('a[href^="https://twitsave.com/download?file="]').first().attr('href');
    console.log('Link:', link);
  } catch (e) {
    console.error(e.message);
  }
}

dl('https://x.com/Suhail/status/1782200843285741695');
