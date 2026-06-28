// ============================================================
// YAY by netals — API Configuration & Types (UTF-8 Fixed)
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbw7cqYO8gCuXH4vFfsRd0-ALXXz2MPzOAmy7oV_4nIznkC0mNToXWuEim-ZzEWVpxoS/exec';
const GAS_TOKEN = 'NETALS_SECURE_SECRET_2026_XYZ';

// Cache URL tunnel di memori browser (tidak perlu fetch ulang tiap request)
let _cachedApiBase: string = process.env.NEXT_PUBLIC_API_URL || '';

// Ambil URL tunnel dari GAS jika env kosong
export async function resolveApiBase(): Promise<string> {
  if (_cachedApiBase) return _cachedApiBase;
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_token: GAS_TOKEN, action: 'get_tunnel_url' }),
      redirect: 'follow'
    });
    const data = await res.json();
    if (data.status === 'success' && data.url) {
      _cachedApiBase = data.url;
      console.log('[API] URL VPS auto-detected dari GAS:', _cachedApiBase);
    }
  } catch (_) {}
  return _cachedApiBase;
}

// Reset cache saat URL berubah (dipanggil dari luar jika perlu)
export function clearApiBaseCache() { _cachedApiBase = ''; }

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ---- Types ----

export interface ClientRegistry {
  User_ID: string;
  WhatsApp_Owner: string;
  License_Key: string;
  Package_Tier: 'Basic' | 'Standard' | 'Standart' | 'Premium' | 'God';
  Registration_Date: string;
  Expiry_Date: string;
  Days_Left: number;
  Account_Status: 'Active' | 'Suspended' | 'Expired';
  Group_1?: string;
  Group_2?: string;
  Group_3?: string;
  Group_4?: string;
  Group_5?: string;
  Aplikasi_terpasang?: string;
  Tutorial?: string;
  Username?: string;
  Password?: string;
}

export interface BotConfig {
  User_ID: string;
  Allow_Group_Response: boolean;
  Allow_Private_Response: boolean;
  Anti_Link_Group: boolean;
  Welcome_Message_Status: boolean;
  Custom_Welcome_Text: string;
  Cmd_SetDel_Status?: boolean;
  Cmd_Hidetag_Status?: boolean;
  Game_Tebak_Kata_Status?: boolean;
  Game_Tebak_Boom_Status?: boolean;
  Game_Tebak_Bendera_Status?: boolean;
  Game_Tebak_Negara_Status?: boolean;
  Game_Tebak_Landmark_Status?: boolean;
  Game_Tebak_Kucing_Status?: boolean;
  Game_Tebak_Anjing_Status?: boolean;
  Game_Tebak_Game_Status?: boolean;
  Game_Tebak_Logo_Status?: boolean;
  Moderation_Status?: boolean;
}

export interface AutoResponder {
  Response_ID: string;
  User_ID: string;
  Keyword: string;
  Match_Type: 'Exact' | 'Contains';
  Response_Type: 'Text' | 'Image' | 'Document';
  Payload_Data: string;
  Target_Groups?: string[] | 'All';
}

export interface MacroRegistry {
  Macro_ID: string;
  User_ID: string;
  Trigger_Syntax: string;
  Action_Type: string;
  Selected_Groups: string[];
  Status: 'Active' | 'Disabled';
}

export interface UserMasterData {
  registry: ClientRegistry;
  config: BotConfig;
  responders: AutoResponder[];
  macros?: MacroRegistry[];
}

export interface FileEntry {
  filename: string;
  size: number;
  modified: string;
  url: string;
  id?: string;
}

export interface SystemStats {
  cpu: { cores: number; model: string; loadAverage: string };
  memory: { total: number; used: number; free: number; percentUsed: string };
  uptime: number;
  platform: string;
  hostname: string;
}

// ---- API Functions ----

async function customFetch(url: string, options: RequestInit = {}) {
  // Ganti /api/... menjadi /api/proxy/... agar lewat sistem anti-blokir Node.js
  let proxyUrl = url;
  // Tangani kasus URL punya base atau origin (misal: http://localhost:3000/api/...)
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith('/api/')) {
      parsed.pathname = parsed.pathname.replace(/^\/api\//, '/api/proxy/');
      proxyUrl = parsed.pathname + parsed.search; // Ambil path-nya saja (relatif)
    }
  } catch (e) {
    if (proxyUrl.startsWith('/api/')) {
      proxyUrl = proxyUrl.replace(/^\/api\//, '/api/proxy/');
    }
  }
  
  const headers = new Headers(options.headers || {});
  headers.set('Bypass-Tunnel-Reminder', 'true');
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(proxyUrl, { ...options, headers });
  
  // Create a wrapper that safely parses json
  const originalJson = response.json.bind(response);
  response.json = async () => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e: any) {
      console.error('[customFetch] Failed to parse JSON. Response text:', text);
      throw new Error(`JSON Parse Error: ${e.message} | Response: ${text.substring(0, 100)}`);
    }
  };
  
  return response;
}


export async function tasteBread(croissant: string, baguette: string) {
  const res = await customFetch(`${API_BASE}/api/auth/tasteBread`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ croissant, baguette }),
  });
  return res.json();
}

export async function apiCheckUsername(username: string) {
  const res = await customFetch(`${API_BASE}/api/auth/checkUsername/${encodeURIComponent(username)}`);
  return res.json();
}

export async function mixIngredients(brioche: string, sourdough: string, croissant: string, baguette: string) {
  const res = await customFetch(`${API_BASE}/api/auth/mixIngredients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brioche, sourdough, croissant, baguette }),
  });
  return res.json();
}

export async function apiMe(whatsapp: string) {
  const res = await customFetch(`${API_BASE}/api/auth/me`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp }),
  });
  return res.json();
}

export async function apiGetConfig(userId: string) {
  const res = await customFetch(`${API_BASE}/api/config/${userId}`);
  return res.json();
}

export async function apiUpdateConfig(userId: string, fields: Partial<BotConfig>) {
  const res = await customFetch(`${API_BASE}/api/config/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  return res.json();
}

export async function apiGetResponders(userId: string) {
  const res = await customFetch(`${API_BASE}/api/responders/${userId}`);
  return res.json();
}

export async function apiAddResponder(userId: string, data: Partial<AutoResponder>) {
  const res = await customFetch(`${API_BASE}/api/responders/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiUpdateResponder(userId: string, responseId: string, data: Partial<AutoResponder>) {
  const res = await customFetch(`${API_BASE}/api/responders/${userId}/${responseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiDeleteResponder(userId: string, responseId: string) {
  const res = await customFetch(`${API_BASE}/api/responders/${userId}/${responseId}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function apiGetAccount(userId: string) {
  const res = await customFetch(`${API_BASE}/api/account/${userId}`);
  return res.json();
}

export async function apiUpdateAccount(userId: string, fields: Partial<ClientRegistry>) {
  const res = await customFetch(`${API_BASE}/api/account/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  return res.json();
}

export async function apiStartSession(userId: string) {
  const res = await customFetch(`${API_BASE}/api/session/${userId}/start`, { method: 'POST' });
  return res.json();
}

export async function apiStopSession(userId: string) {
  const res = await customFetch(`${API_BASE}/api/session/${userId}/stop`, { method: 'POST' });
  return res.json();
}

export async function apiGetSessionStatus(userId: string) {
  const res = await customFetch(`${API_BASE}/api/session/${userId}/status`);
  return res.json();
}

export async function apiGetSystemStats(): Promise<SystemStats> {
  const res = await customFetch(`${API_BASE}/api/system-stats`);
  const data = await res.json();
  return data;
}

export async function apiGetFiles(userId: string) {
  const res = await customFetch(`${API_BASE}/api/files/${userId}`);
  return res.json();
}

export async function apiUploadFile(userId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await customFetch(`${API_BASE}/api/files/${userId}/upload`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

export async function apiDeleteFile(userId: string, filename: string) {
  const res = await customFetch(`${API_BASE}/api/files/${userId}/${filename}`, {
    method: 'DELETE',
  });
  return res.json();
}

// --- Macros APIs ---

export async function apiGetMacros(userId: string) {
  const res = await customFetch(`${API_BASE}/api/macros/${userId}`);
  return res.json();
}

export async function apiAddMacro(userId: string, data: Partial<MacroRegistry>) {
  const res = await customFetch(`${API_BASE}/api/macros/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiUpdateMacro(userId: string, macroId: string, data: Partial<MacroRegistry>) {
  const res = await customFetch(`${API_BASE}/api/macros/${userId}/${macroId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiDeleteMacro(userId: string, macroId: string) {
  const res = await customFetch(`${API_BASE}/api/macros/${userId}/${macroId}`, {
    method: 'DELETE',
  });
  return res.json();
}

// --- Admin (God Tier) APIs ---

export async function apiGetClients() {
  const res = await customFetch(`${API_BASE}/api/admin/clients`);
  return res.json();
}

export async function apiAddClient(whatsapp: string, tier: string, days: number) {
  const res = await customFetch(`${API_BASE}/api/admin/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp, tier, days }),
  });
  return res.json();
}

export async function apiDeleteClient(clientId: string) {
  const res = await customFetch(`${API_BASE}/api/admin/clients/${clientId}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function apiBroadcast(message: string) {
  const res = await customFetch(`${API_BASE}/api/admin/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function apiGetAppStore() {
  const res = await customFetch(`${API_BASE}/api/appstore`);
  return res.json();
}

export async function apiInstallApp(userId: string, appId: string) {
  const res = await customFetch(`${API_BASE}/api/appstore/install`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, appId }),
  });
  return res.json();
}

export async function apiUpdateGroupLink(userId: string, groupLink: string) {
  const res = await customFetch(`${API_BASE}/api/onboarding/group`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, groupLink }),
  });
  return res.json();
}

export interface GroupSettings {
  Group_JID: string;
  User_ID: string;
  Enable_Default_Filter: boolean;
  Custom_Keywords: string;
  Matching_Mode: 'fuzzy' | 'exact';
  Max_Warn: number;
  Punishment_Action: 'kick' | 'ban' | 'mute';
  Warn_Decay_Hours: number;
}

export async function apiGetGroupSettings(userId: string) {
  const res = await customFetch(`${API_BASE}/api/group-settings/${userId}`);
  return res.json();
}

export async function apiUpdateGroupSettings(userId: string, groupJid: string, fields: Partial<GroupSettings>) {
  const res = await customFetch(`${API_BASE}/api/group-settings/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group_jid: groupJid, fields }),
  });
  return res.json();
}
