// ============================================================
// YAY by netals — Assistant API Route v3.0
// Multi-Provider Fallback: Gemini → OpenAI → Groq → Local KB
// Browser → /api/assistant → Next.js Server → AI Provider
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// Keys dari environment variable (diset di Vercel dashboard)
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const GROQ_KEY   = process.env.GROQ_API_KEY   || '';

const ASSISTANT_SYSTEM_PROMPT = `Anda adalah "YAY Assistant", asisten virtual pintar dan ramah yang tertanam di Web Panel (NetalsOS V2) untuk aplikasi "YAY by netals".
Tugas Anda adalah membantu pengguna menavigasi, memahami, dan memaksimalkan fitur-fitur YAY.

DNA Anda:
- Sangat ramah, bersahabat, humble, dan penuh hormat (menunjukkan DNA netals/YAY).
- Menggunakan bahasa Indonesia yang luwes, sopan, dan hangat.
- Menjelaskan fitur dengan sabar dan antusias.

Berikut adalah penjelasan fitur dan aplikasi yang ada di YAY:
1. Control Center: Pusat kendali koneksi bot WhatsApp (Scan QR Baileys) dan pengatur Auto-Responder sederhana.
2. YAY (Core Engine): Jantung kendali fitur grup. Aktifkan Group Moderation, Fun & Utility, Gamification.
3. Responder Studio: Tool lanjutan untuk merancang alur Auto-Responder otomatis yang kompleks.
4. File Explorer: Mengelola file yang diunggah ke Google Drive dari panel.
5. Group Manager: Memantau statistik grup WhatsApp, melihat anggota, memperbarui link undangan.
6. Subscription: Memeriksa detail paket lisensi, status akun, dan sisa hari berlangganan.
7. Task Manager: Memantau CPU, RAM, uptime VPS, dan proses yang berjalan secara real-time.
8. Account: Mengatur profil pengguna dan logout dari panel.

Perintah Bot WhatsApp:
- !say [teks]: Bot mengulangi pesan dan menghapus pesan asli.
- !tagall [pesan]: Mention semua anggota grup sekaligus.
- !ai [pertanyaan] atau !ask [pertanyaan]: Bertanya ke AI di dalam grup.
- Auto-Reply AI: Reply pesan bot langsung memicu jawaban AI.
- Auto-Responder: Bot membalas otomatis jika ada pesan yang cocok keyword.

Aturan Penting (CRITICAL):
1. Jika ditanya tentang teknologi atau model AI yang mendasari Anda, jawab: "Itu adalah data rahasia perusahaan netals. Yang pasti saya adalah asisten resmi YAY yang siap membantu Anda!"
2. Jawaban singkat, jelas, ramah. JANGAN gunakan emoji. Gunakan bahasa teks murni yang sopan dan profesional.`;

// ============================================================
// LOCAL KNOWLEDGE BASE FALLBACK
// Responds to common questions without needing any API key
// ============================================================
const LOCAL_KB: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['halo', 'hai', 'hello', 'hi', 'selamat', 'apa kabar', 'permisi'],
    answer: 'Halo! Selamat datang di YAY Panel. Saya YAY Assistant, siap membantu Anda memahami dan menggunakan semua fitur YAY. Ada yang bisa saya bantu?',
  },
  {
    keywords: ['auto responder', 'auto-responder', 'autoresponder', 'keyword', 'kata kunci', 'balas otomatis'],
    answer: 'Auto-Responder adalah fitur bot membalas pesan otomatis saat ada pesan masuk yang cocok dengan kata kunci yang Anda set. Anda bisa mengaturnya di aplikasi Control Center (menu Auto-Responder) atau di Responder Studio untuk alur yang lebih kompleks. Cara tambah: buka Control Center, klik tab Auto-Responder, lalu klik tombol Tambah.',
  },
  {
    keywords: ['responder studio', 'studio', 'alur'],
    answer: 'Responder Studio adalah tool lanjutan untuk merancang alur Auto-Responder yang lebih kompleks, seperti percakapan bercabang (decision tree). Buka dari Start Menu, lalu pilih Responder Studio.',
  },
  {
    keywords: ['control center', 'qr', 'scan', 'sambungkan', 'connect', 'bot status'],
    answer: 'Control Center adalah pusat kendali utama bot WhatsApp Anda. Di sini Anda bisa melihat status koneksi bot, scan QR code untuk menghubungkan WhatsApp, dan mengelola Auto-Responder dasar. Jika bot terputus, buka Control Center dan scan QR baru.',
  },
  {
    keywords: ['file', 'drive', 'upload', 'file explorer', 'berkas'],
    answer: 'File Explorer memungkinkan Anda mengunggah file ke Google Drive dan mendapatkan link unduhan yang bisa digunakan di Auto-Responder (misalnya kirim gambar atau dokumen otomatis). Buka dari Start Menu, lalu pilih File Explorer.',
  },
  {
    keywords: ['group manager', 'grup', 'anggota', 'member', 'link grup', 'invite'],
    answer: 'Group Manager digunakan untuk memantau statistik grup WhatsApp yang terdaftar, melihat daftar anggota, dan memperbarui link undangan grup. Pastikan link grup sudah diisi agar bot bisa bekerja di grup tersebut.',
  },
  {
    keywords: ['subscription', 'langganan', 'paket', 'lisensi', 'premium', 'basic', 'sisa hari', 'expired'],
    answer: 'Di aplikasi Subscription Anda bisa melihat detail paket berlangganan (Basic, Standard, Premium, atau God), status akun, dan sisa hari aktif. Jika akun tidak aktif, bot tidak akan merespons pesan di grup.',
  },
  {
    keywords: ['task manager', 'cpu', 'ram', 'memori', 'uptime', 'server', 'vps'],
    answer: 'Task Manager menampilkan monitoring real-time penggunaan CPU, RAM, dan uptime server VPS Anda. Berguna untuk memantau kesehatan server. Buka dari Start Menu, pilih Task Manager.',
  },
  {
    keywords: ['tagall', 'tag all', 'mention semua', 'tag semua'],
    answer: 'Perintah !tagall digunakan untuk mention/tag semua anggota grup sekaligus. Contoh penggunaan: "!tagall Hei semua, ada pengumuman penting!" - Bot akan mention seluruh anggota grup disertai pesan tersebut.',
  },
  {
    keywords: ['ai', 'ask', 'tanya ai', 'gemini', 'chatgpt', 'kecerdasan buatan'],
    answer: 'Untuk bertanya ke AI di WhatsApp, ketik !ai [pertanyaan] atau !ask [pertanyaan] di dalam grup. Contoh: "!ai apa itu fotosintesis?" Anda juga bisa reply pesan bot secara langsung untuk melanjutkan percakapan dengan AI.',
  },
  {
    keywords: ['say', '!say', 'anonim', 'hapus pesan'],
    answer: 'Perintah !say digunakan untuk mengirim pesan anonim lewat bot. Bot akan mengirimkan teks yang Anda tulis dan menghapus pesan asli Anda. Berguna untuk pengumuman tanpa diketahui siapa pengirimnya.',
  },
  {
    keywords: ['logout', 'keluar', 'account', 'akun', 'profil', 'password'],
    answer: 'Untuk logout, buka aplikasi Account dari Start Menu, lalu klik tombol Logout. Anda juga bisa mengatur profil pengguna di sana. Pastikan simpan credential Anda sebelum logout.',
  },
  {
    keywords: ['cara', 'bagaimana', 'gimana', 'how', 'tutorial', 'panduan', 'mulai', 'mulai dari mana'],
    answer: 'Untuk memulai menggunakan YAY Panel: 1) Buka Control Center dan scan QR untuk menghubungkan WhatsApp. 2) Atur kata kunci Auto-Responder sesuai kebutuhan. 3) Pastikan link grup WhatsApp sudah diisi di Group Manager. 4) Bot siap bekerja di grup Anda! Jika ada pertanyaan spesifik, tanyakan saja ke saya.',
  },
];

function localFallback(message: string): string {
  const lower = message.toLowerCase();
  for (const entry of LOCAL_KB) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return entry.answer;
    }
  }
  return 'Terima kasih sudah bertanya. Saya YAY Assistant, siap membantu seputar fitur YAY Panel dan bot WhatsApp. Bisa Anda ceritakan lebih detail apa yang ingin diketahui atau dibantu?';
}

// ============================================================
// PROVIDER: Gemini
// ============================================================
const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];

async function callGemini(contents: object[]): Promise<string> {
  if (!GEMINI_KEY) throw new Error('No Gemini key');
  let lastErr: Error = new Error('No models tried');
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 800 } }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const errText = await res.text();
      lastErr = new Error(`Gemini ${model} ${res.status}: ${errText.slice(0, 200)}`);
      if (res.status === 403 || res.status === 429) throw lastErr;
      continue;
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) return text;
    throw new Error('Empty Gemini response');
  }
  throw lastErr;
}

// ============================================================
// PROVIDER: OpenAI / ChatGPT
// ============================================================
async function callOpenAI(messages: object[]): Promise<string> {
  if (!OPENAI_KEY) throw new Error('No OpenAI key');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 800, temperature: 0.7 }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty OpenAI response');
  return text;
}

// ============================================================
// PROVIDER: Groq (Llama3 — fast & generous free tier)
// ============================================================
async function callGroq(messages: object[]): Promise<string> {
  if (!GROQ_KEY) throw new Error('No Groq key');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: 'llama3-8b-8192', messages, max_tokens: 800, temperature: 0.7 }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Groq ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty Groq response');
  return text;
}

// ============================================================
// MAIN HANDLER — Fallback chain: Gemini → OpenAI → Groq → Local KB
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();
    if (!message) {
      return NextResponse.json({ status: 'error', message: 'Message is required.' }, { status: 400 });
    }

    // Build Gemini-format history
    const geminiContents = [
      { role: 'user', parts: [{ text: ASSISTANT_SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Siap! Saya YAY Assistant, siap membantu dengan penuh semangat. Ada yang bisa saya bantu?' }] },
      ...history.map((h: { role: 'user' | 'model'; text: string }) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    // Build OpenAI-compatible messages (also used by Groq)
    const openAiMessages = [
      { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
      ...history.map((h: { role: 'user' | 'model'; text: string }) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.text,
      })),
      { role: 'user', content: message },
    ];

    const providers = [
      { name: 'Gemini', fn: () => callGemini(geminiContents) },
      { name: 'OpenAI', fn: () => callOpenAI(openAiMessages) },
      { name: 'Groq',   fn: () => callGroq(openAiMessages) },
    ];

    let replyText = '';
    for (const provider of providers) {
      try {
        replyText = await provider.fn();
        console.log(`[Assistant API] Responded via ${provider.name}`);
        break;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Assistant API] ${provider.name} failed: ${msg}`);
      }
    }

    // If ALL external providers fail → use local knowledge base (never show error to user)
    if (!replyText) {
      replyText = localFallback(message);
      console.log('[Assistant API] Using local KB fallback');
    }

    return NextResponse.json({ status: 'success', reply: replyText });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[Assistant API] Unexpected error:', msg);
    // Even on unexpected crash, return a friendly local response
    return NextResponse.json({ status: 'success', reply: 'Halo! Saya YAY Assistant. Ada yang bisa saya bantu seputar fitur YAY Panel?' });
  }
}
