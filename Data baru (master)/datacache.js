// ============================================================
// YAY by netals — Local Memory Cache (Speed Layer)
// ============================================================
// Pre-fetches all data from GAS at startup and keeps it in RAM.
// WhatsApp message handler reads from here → 0ms delay.
// ============================================================

const gasbridge = require('./gasbridge');

class DataCache {
  constructor() {
    this.clients   = new Map(); // User_ID → client registry row
    this.configs   = new Map(); // User_ID → bot config row
    this.responders = new Map(); // User_ID → [ responder rows ]
    this.macros    = new Map(); // User_ID → [ macro rows ]
    this.blacklist = new Set(); // Phone numbers in blacklist
    this.ready = false;
  }

  async initialize() {
    console.log('[Cache] Initializing — fetching all master data from GAS...');
    const result = await gasbridge.fetchAllMaster();
    if (result.status !== 'success') {
      console.error('[Cache] Failed to initialize:', result.message);
      return false;
    }

    const { clients, configs, responders, macros, blacklist } = result.data;

    // Index clients
    for (const c of clients) {
      this.clients.set(c.User_ID, c);
    }

    // Index configs
    for (const cfg of configs) {
      this.configs.set(cfg.User_ID, cfg);
    }

    // Index responders grouped by User_ID
    for (const r of responders) {
      if (!this.responders.has(r.User_ID)) {
        this.responders.set(r.User_ID, []);
      }
      this.responders.get(r.User_ID).push(r);
    }

    // Index macros grouped by User_ID
    if (macros) {
      for (const m of macros) {
        if (!this.macros.has(m.User_ID)) {
          this.macros.set(m.User_ID, []);
        }
        this.macros.get(m.User_ID).push(m);
      }
    }

    // Index blacklist
    if (blacklist) {
      for (const num of blacklist) {
        this.blacklist.add(num);
      }
    }

    this.ready = true;
    console.log(`[Cache] Loaded: ${this.clients.size} clients, ${this.configs.size} configs, ${responders.length} responders, ${macros ? macros.length : 0} macros`);
    return true;
  }

  setAllMasterData(data) {
    const { clients, configs, responders, macros, blacklist } = data;
    this.clients.clear();
    this.configs.clear();
    this.responders.clear();
    this.macros.clear();
    this.blacklist.clear();

    for (const c of clients) this.clients.set(c.User_ID, c);
    for (const cfg of configs) this.configs.set(cfg.User_ID, cfg);
    for (const r of responders) {
      if (!this.responders.has(r.User_ID)) this.responders.set(r.User_ID, []);
      this.responders.get(r.User_ID).push(r);
    }
    if (macros) {
      for (const m of macros) {
        if (!this.macros.has(m.User_ID)) this.macros.set(m.User_ID, []);
        this.macros.get(m.User_ID).push(m);
      }
    }
    if (blacklist) {
      for (const num of blacklist) this.blacklist.add(num);
    }
  }

  isBlacklisted(phoneNumber) {
    return this.blacklist.has(phoneNumber);
  }

  addBlacklistedLocal(phoneNumber) {
    this.blacklist.add(phoneNumber);
  }

  // --- Read ---
  getClient(userId)    { return this.clients.get(userId) || null; }
  getConfig(userId)    { return this.configs.get(userId) || null; }
  getResponders(userId){ return this.responders.get(userId) || []; }
  getMacros(userId)    { return this.macros.get(userId) || []; }
  getAllClients()       { return Array.from(this.clients.values()); }

  findClientByPhone(phone) {
    for (const c of this.clients.values()) {
      if (String(c.WhatsApp_Owner) === String(phone)) return c;
    }
    return null;
  }

  findClientByUsername(username) {
    for (const c of this.clients.values()) {
      if (String(c.Username || "").toLowerCase() === String(username).toLowerCase()) return c;
    }
    return null;
  }

  // --- Write (update local cache after GAS write succeeds) ---
  updateConfig(userId, fields) {
    const existing = this.configs.get(userId) || {};
    this.configs.set(userId, { ...existing, ...fields });
  }

  setResponders(userId, list) {
    this.responders.set(userId, list);
  }

  addResponderEntry(userId, entry) {
    const list = this.responders.get(userId) || [];
    list.push(entry);
    this.responders.set(userId, list);
  }

  removeResponderEntry(userId, responseId) {
    const list = this.responders.get(userId) || [];
    this.responders.set(userId, list.filter(r => r.Response_ID !== responseId));
  }

  setMacros(userId, list) {
    this.macros.set(userId, list);
  }

  addMacroEntry(userId, entry) {
    const list = this.macros.get(userId) || [];
    list.push(entry);
    this.macros.set(userId, list);
  }

  removeMacroEntry(userId, macroId) {
    const list = this.macros.get(userId) || [];
    this.macros.set(userId, list.filter(m => m.Macro_ID !== macroId));
  }

  updateClientField(userId, field, value) {
    const c = this.clients.get(userId);
    if (c) { c[field] = value; }
  }
}

module.exports = new DataCache();
