const gasbridge = require('./gasbridge');

async function test() {
  const data = await gasbridge.fetchAllMaster();
  if (data && data.data && data.data.clients && data.data.clients.length > 0) {
    console.log(data.data.clients[0]);
  } else {
    console.log('No client data found or failed', data);
  }
}
test();
