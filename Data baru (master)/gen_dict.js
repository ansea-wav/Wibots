const fs = require('fs');

async function run() {
  const words = [];
  const limit = 550;

  console.log(`Generating ${limit} words from Wikipedia ID...`);
  
  while (words.length < limit) {
    try {
      const res = await fetch(`https://id.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&grnlimit=50&prop=extracts&exintro=1&explaintext=1&format=json`);
      const data = await res.json();
      
      if (data.query && data.query.pages) {
        for (const key in data.query.pages) {
          const page = data.query.pages[key];
          let title = page.title;
          let extract = page.extract;
          
          if (!title || !extract) continue;
          
          // Filter: Only single words without symbols or numbers
          if (title.split(' ').length > 1) continue;
          if (!/^[a-zA-Z]+$/.test(title)) continue;
          if (title.length < 4) continue;
          
          // Clean extract: take first sentence, remove the title itself from the definition
          let firstSentence = extract.split('.')[0].trim();
          if (firstSentence.length < 10) continue;
          
          const titleRegex = new RegExp(title, 'gi');
          firstSentence = firstSentence.replace(titleRegex, '***');
          
          words.push({
            word: title.toUpperCase(),
            definition: firstSentence
          });
          
          if (words.length >= limit) break;
        }
      }
      
      console.log(`Got ${words.length}/${limit} words...`);
      // Sleep slightly to avoid spamming
      await new Promise(r => setTimeout(r, 500));
      
    } catch(e) {
      console.error(e);
    }
  }

  // Deduplicate
  const unique = [];
  const seen = new Set();
  for (const w of words) {
    if (!seen.has(w.word)) {
      seen.add(w.word);
      unique.push(w);
    }
  }

  fs.writeFileSync('tebak_kata_dict.json', JSON.stringify(unique.slice(0, limit), null, 2));
  console.log(`Successfully generated tebak_kata_dict.json with ${unique.slice(0, limit).length} words!`);
}

run();
