const sm = require('fs').readFileSync('e:\\Private Project Database NetalsStore\\Bot Wa\\Data baru (master)\\sessionmanager.js', 'utf8');

const regex = /const tebakCommands = \['tebakkata', 'tebak-kata', 'tebak'\];([\s\S]*?)const gameCommands = /;
const match = sm.match(regex);
console.log(match ? "Found block" : "Not found");
if(match) {
  // console.log(match[1].substring(0, 500));
}
