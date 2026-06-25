const axios = require('axios');
const fs = require('fs');

// Fungsi untuk membaca API Key dari .env.txt
function getBotcahxApiKey() {
  if (process.env.BOTCAHX_API_KEY) return process.env.BOTCAHX_API_KEY;
  try {
    let envPath = null;
    if (fs.existsSync('./.env')) envPath = './.env';
    else if (fs.existsSync('./.env.txt')) envPath = './.env.txt';
    
    if (envPath) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('BOTCAHX_API_KEY=')) {
          return line.trim().split('=')[1].trim();
        }
      }
    }
  } catch (err) {
    console.error('[Botcahx] Gagal membaca API Key', err);
  }
  return null;
}

const API_KEY = getBotcahxApiKey();
const BASE_URL = 'https://api.botcahx.eu.org';

if (!API_KEY) {
  console.warn('[Botcahx] WARNING: BOTCAHX_API_KEY tidak ditemukan di .env.txt');
}

/**
 * Helper untuk melakukan GET request ke API Botcahx
 * @param {string} endpoint - Path API (contoh: '/api/dowloader/tiktok')
 * @param {object} params - Parameter tambahan
 * @returns {Promise<any>} Data response dari API
 */
async function fetchBotcahx(endpoint, params = {}) {
  if (!API_KEY) {
    throw new Error('BOTCAHX_API_KEY belum dikonfigurasi.');
  }

  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await axios.get(url, {
      params: {
        ...params,
        apikey: API_KEY
      }
    });

    if (response.data.status === false) {
      throw new Error(response.data.message || 'API mengembalikan status false');
    }

    return response.data;
  } catch (error) {
    console.error(`[Botcahx] API Error pada endpoint ${endpoint}:`, error.message);
    throw error;
  }
}

module.exports = {
  fetchBotcahx,
  API_KEY
};
