const fs = require('fs');

const masterPath = 'e:/Private Project Database NetalsStore/Bot Wa/Data baru (master)/index.js';
const serverPath = 'e:/Private Project Database NetalsStore/Bot Wa/Data From Server/index.js';

const masterContent = fs.readFileSync(masterPath, 'utf8');
const serverContent = fs.readFileSync(serverPath, 'utf8');

// The corrupted block in master starts around:
// app.get('/api/config/:userId', (req, res) => {
// app.post('/api/macros/:userId', async (req, res) => {
// Let's find this exact corruption in master:
const badStr = `app.get('/api/config/:userId', (req, res) => {
app.post('/api/macros/:userId', async (req, res) => {`;

// We need to extract the original code from Data From Server
// It starts with: app.get('/api/config/:userId', (req, res) => {
// It ends right before: app.post('/api/macros/:userId', async (req, res) => {
const startMarker = `app.get('/api/config/:userId', (req, res) => {`;
const endMarker = `app.post('/api/macros/:userId', async (req, res) => {`;

const startIdx = serverContent.indexOf(startMarker);
const endIdx = serverContent.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1 && masterContent.includes(badStr)) {
  const goodChunk = serverContent.substring(startIdx, endIdx);
  
  // Now modify goodChunk to include the /api/onboarding/group update we wanted!
  // Wait, the original /api/onboarding/group is in the goodChunk.
  // We'll replace it inside goodChunk.
  let modifiedChunk = goodChunk.replace(
    `app.post('/api/onboarding/group', async (req, res) => {
  const { userId, groupLink } = req.body;
  if (!userId || !groupLink) return res.status(400).json({ status: 'error', message: 'Missing userId or groupLink' });
  
  const result = await gasbridge.updateGroupLink(userId, groupLink);
  if (result.status === 'success') {
    const client = datacache.getClient(userId);
    if (client) client.Group_1 = groupLink;
  }
  res.json(result);
});`,
    `app.post('/api/onboarding/group', async (req, res) => {
  const { userId, groupLink } = req.body;
  if (!userId || !groupLink) return res.status(400).json({ status: 'error', message: 'Missing userId or groupLink' });
  
  const jid = await sessionmanager.resolveJidFromLink(groupLink);
  if (!jid) {
    return res.status(400).json({ status: 'error', message: 'Link grup tidak valid atau bot gagal mendeteksi JID grup tersebut.' });
  }

  const result = await gasbridge.updateGroupLink(userId, groupLink);
  if (result.status === 'success') {
    const client = datacache.getClient(userId);
    if (client) client.Group_1 = groupLink;
    
    // Asynchronously update JID cache and join group
    sessionmanager.onGroupLinkUpdated(userId, 1, groupLink).catch(e => console.error('[ONBOARDING] Failed to resolve and save JID:', e));
  }
  res.json(result);
});`
  );

  const fixedContent = masterContent.replace(badStr, modifiedChunk + endMarker);
  fs.writeFileSync(masterPath, fixedContent, 'utf8');
  console.log("SUCCESS");
} else {
  console.log("FAILED to find strings", {
    hasStartMarker: startIdx !== -1,
    hasEndMarker: endIdx !== -1,
    hasBadStr: masterContent.includes(badStr)
  });
}
