// ============================================================
// YAY by netals — GAS API Bridge (Database Layer)
// ============================================================
// Handles all communication between VPS ↔ Google Apps Script
// ============================================================

const GAS_URL = process.env.GAS_URL;
const GAS_TOKEN = process.env.GAS_AUTH_TOKEN;

async function gasRequest(action, payload = {}) {
  const body = {
    auth_token: GAS_TOKEN,
    action,
    ...payload
  };

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });
    const data = await res.json();
    if (data.status === 'error') {
      console.error(`[GAS] Action '${action}' returned error:`, data.message);
    }
    return data;
  } catch (err) {
    console.error(`[GAS] Request failed (${action}):`, err.message);
    return { status: 'error', message: err.message };
  }
}

// --- Public API ---

async function authenticateUser(whatsapp, licenseKey) {
  return gasRequest('authenticate_user', { whatsapp, license_key: licenseKey });
}

async function registerClient(whatsapp, licenseKey, username, password) {
  return gasRequest('register_client', { whatsapp, license_key: licenseKey, username, password });
}

async function fetchAllMaster() {
  return gasRequest('fetch_all_master');
}

async function addClient(whatsapp, tier, days) {
  return gasRequest('add_client', { whatsapp, tier, days });
}

async function deleteClient(userId) {
  return gasRequest('delete_client', { user_id: userId });
}

async function fetchUserMaster(userId) {
  return gasRequest('fetch_user_master', { user_id: userId });
}

async function getBotConfig(userId) {
  return gasRequest('get_bot_config', { user_id: userId });
}

async function updateBotConfig(userId, fields) {
  return gasRequest('update_bot_config', { user_id: userId, fields });
}

async function getAutoResponder(userId) {
  return gasRequest('get_auto_responder', { user_id: userId });
}

async function addAutoResponder(userId, keyword, matchType, responseType, payloadData, targetGroups) {
  return gasRequest('add_auto_responder', {
    user_id: userId,
    keyword,
    match_type: matchType,
    response_type: responseType,
    payload_data: payloadData,
    target_groups: targetGroups
  });
}

async function updateAutoResponder(responseId, updates) {
  return gasRequest('update_auto_responder', { response_id: responseId, ...updates });
}

async function deleteAutoResponder(responseId) {
  return gasRequest('delete_auto_responder', { response_id: responseId });
}

// --- Macros ---
async function getMacros(userId) {
  return gasRequest('get_macros', { user_id: userId });
}

async function addMacro(userId, triggerSyntax, actionType, selectedGroups) {
  return gasRequest('add_macro', {
    user_id: userId,
    trigger_syntax: triggerSyntax,
    action_type: actionType,
    selected_groups: selectedGroups
  });
}

async function updateMacro(macroId, updates) {
  return gasRequest('update_macro', { macro_id: macroId, ...updates });
}

async function deleteMacro(macroId) {
  return gasRequest('delete_macro', { macro_id: macroId });
}

// --- Tickets ---
async function createTicket(whatsapp, name, subject, message) {
  return gasRequest('create_ticket', {
    whatsapp,
    name,
    subject,
    message
  });
}

async function runDailyDecrement() {
  return gasRequest('daily_decrement');
}

async function updateClientStatus(userId, newStatus) {
  return gasRequest('update_client_status', { user_id: userId, new_status: newStatus });
}

async function updateClientRegistry(userId, fields) {
  return gasRequest('update_client_registry', { user_id: userId, fields });
}

// Simpan URL tunnel aktif ke GAS agar Web Panel bisa baca
async function saveTunnelUrl(url) {
  return gasRequest('save_tunnel_url', { tunnel_url: url });
}

// Ambil URL tunnel dari GAS
async function getTunnelUrl() {
  return gasRequest('get_tunnel_url');
}

async function getDriveFiles(userId) {
  return gasRequest('get_files', { user_id: userId });
}

async function uploadDriveFile(userId, filename, mimeType, base64, size) {
  return gasRequest('upload_file', { user_id: userId, filename, mimeType, base64, size });
}

async function deleteDriveFile(userId, filename) {
  return gasRequest('delete_file', { user_id: userId, filename });
}

async function getAppStoreList() {
  return gasRequest('get_app_store_list');
}

async function installApp(userId, appId) {
  return gasRequest('install_app', { user_id: userId, app_id: appId });
}

async function updateGroupLink(userId, groupLink) {
  return gasRequest('update_group_link', { user_id: userId, group_link: groupLink });
}

async function addChatHistory(userId, groupId, role, message) {
  return gasRequest('add_chat_history', { user_id: userId, group_id: groupId, role, message });
}

async function getChatHistory(userId, groupId) {
  return gasRequest('get_chat_history', { user_id: userId, group_id: groupId });
}

async function checkAiLimit(userId, groupId) {
  return gasRequest('check_ai_limit', { user_id: userId, group_id: groupId });
}

async function incrementAiLimit(userId, groupId) {
  return gasRequest('increment_ai_limit', { user_id: userId, group_id: groupId });
}

async function addToBlacklist(phoneNumber, reason) {
  return gasRequest('add_blacklist', { phone_number: phoneNumber, reason });
}

async function getBlacklist() {
  return gasRequest('get_blacklist');
}

async function deleteFromBlacklist(phoneNumber) {
  return gasRequest('delete_blacklist', { phone_number: phoneNumber });
}

async function addMute(phoneNumber, expiryTime, reason, mutedBy, chatJid) {
  return gasRequest('add_mute', { phone_number: phoneNumber, expiry_time: expiryTime, reason, muted_by: mutedBy, chat_id: chatJid, chat_jid: chatJid });
}

async function getMuteList() {
  return gasRequest('get_mute_list');
}

async function deleteMute(phoneNumber) {
  return gasRequest('delete_mute', { phone_number: phoneNumber });
}

async function fetchSpammerTasks() {
  return gasRequest('get_spammer_tasks');
}

// === Economy / Profile ===
async function getProfile(phoneNumber) {
  return gasRequest('get_profile', { phone_number: phoneNumber });
}

async function updateProfile(phoneNumber, fields) {
  return gasRequest('update_profile', { phone_number: phoneNumber, fields });
}

async function getLeaderboard() {
  return gasRequest('get_leaderboard');
}

async function getChatLeaderboard() {
  return gasRequest('get_chat_leaderboard');
}

// === Tips State ===
async function getTipsState() {
  const result = await gasRequest('get_tips_state');
  if (result && result.status === 'success' && result.data) {
    return result.data;
  }
  return { lastSentAt: 0, currentIndex: 0 };
}

async function updateTipsState(state) {
  return gasRequest('update_tips_state', {
    lastSentAt: state.lastSentAt,
    currentIndex: state.currentIndex
  });
}

async function updateWazleData(phoneNumber, wazleData) {
  return gasRequest('kue_cubit', { phone_number: phoneNumber, wazle_data: wazleData });
}

module.exports = {
  gasRequest,
  authenticateUser,
  fetchAllMaster,
  fetchUserMaster,
  getBotConfig,
  updateBotConfig,
  getAutoResponder,
  addAutoResponder,
  updateAutoResponder,
  deleteAutoResponder,
  getMacros,
  addMacro,
  updateMacro,
  deleteMacro,
  runDailyDecrement,
  updateClientStatus,
  updateClientRegistry,
  addClient,
  deleteClient,
  registerClient,
  saveTunnelUrl,
  getTunnelUrl,
  getDriveFiles,
  uploadDriveFile,
  deleteDriveFile,
  getAppStoreList,
  installApp,
  updateGroupLink,
  addChatHistory,
  getChatHistory,
  createTicket,
  checkAiLimit,
  incrementAiLimit,
  addToBlacklist,
  getBlacklist,
  deleteFromBlacklist,
  addMute,
  getMuteList,
  deleteMute,
  fetchSpammerTasks,
  getProfile,
  updateProfile,
  getLeaderboard,
  getChatLeaderboard,
  getTipsState,
  updateTipsState,
  updateWazleData
};
