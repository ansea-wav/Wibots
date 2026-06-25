const fs = require('fs');

const userRequests = [
  "Owner bot",
  "Si si apa.. ?",
  "Wong Pinter",
  "Spam chat ni anak",
  "ikut main doang",
  "Si Usil",
  "Pemula",
  "Gugu gaga",
  "Pengungsi",
  "cegil"
];

const adjectives = [
  "Si Paling", "Tukang", "Mantan", "Sepuh", "Pemula", "Kang", "Raja", "Suhu", 
  "Master", "Lord", "Bocah", "Anak", "Juragan", "Pecandu", "Bandar", "Agen", 
  "Intel", "Preman", "Kuli", "Buruh", "Ksatria", "Pendekar", "Sultan", "Hamba", 
  "Pemuja", "Pencari", "Penikmat", "Korban", "Alumni", "Sesepuh", "Pakar", "Legenda"
];

const nouns = [
  "Turu", "Gacha", "AFK", "Typo", "Spam", "Galau", "Sambat", "Healing", 
  "Rebahan", "Scroll", "VTuber", "Kopi", "Indomie", "Begadang", "Nugas", 
  "Skripsi", "Gabut", "Nangis", "Overthinking", "Mabar", "Wibu", "Gimmick", 
  "Fomo", "Meme", "Drama", "Ghibah", "Gorengan", "Cuaks", "Sigma", "Rizz", 
  "Skibidi", "Mewing", "Cegil", "Redflag", "Greenflag", "Skena"
];

const generated = new Set(userRequests);

for (const adj of adjectives) {
  for (const noun of nouns) {
    generated.add(`${adj} ${noun}`);
  }
}

// Convert to array and shuffle
const result = Array.from(generated);
for (let i = result.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [result[i], result[j]] = [result[j], result[i]];
}

fs.writeFileSync('julukans.json', JSON.stringify(result, null, 2));
console.log(`Generated ${result.length} unique meme julukans!`);
