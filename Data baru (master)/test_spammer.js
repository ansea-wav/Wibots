require('dotenv').config();
const gasbridge = require('./gasbridge');

async function test() {
  console.log("Fetching spammer tasks...");
  const res = await gasbridge.fetchSpammerTasks();
  console.log("Result:", res);
}

test();
