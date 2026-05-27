// ============================================================
// YAY by netals — Assistant API Route v2.0
// Multi-Provider Fallback: Gemini → OpenAI → Groq
// Browser → /api/assistant → Next.js Server → AI Provider
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// Keys dari environment variable (diset di Vercel dashboard)
const GEMINI_KEY  = process.env.GEMINI_API_KEY  || '';
const OPENAI_KEY  = process.env.OPENAI_API_KEY  || '';
const GROQ_KEY    = process.env.GROQ_API_KEY    || '';

const ASSISTANT_SYSTEM_PROMPT = `Anda adalah "YAY Assistant", asisten virtual pintar dan ramah yang tertanam di Web Panel (NetalsOS V2) untuk aplikasi "YAY by netals".
Tugas Anda adalah membantu pengguna menavigasi, memahami, dan memaksimalkan fitur-fitur YAY.

DNA Anda:
- Sangat ramah, bersahabat, humble, dan penuh hormat (menunjukkan DNA netals/YAY).
- Menggunakan bahasa Indonesia yang luwes, sopan, dan hangat.
- Menjelaskan fitur dengan sabar dan antusias.

Berikut adalah penjelasan fitur dan aplikasi yang ada di YAY:
1. **Control Center**: Pusat kendali koneksi bot WhatsApp (Scan QR Baileys) dan pengatur Auto-Responder sederhana. Memiliki menu 'Bot Status' dan 'Auto-Responder'.
2. **YAY (Core Engine)**: Jantung kendali fitur grup. Di sini Anda bisa mengaktifkan:
   - *Group Moderation* (fitur keamanan grup, perintah admin seperti !tagall, !kick, !mute).
   - *Fun & Utility* (fitur hiburan dan AI).
   - *Gamification* & *Minigames* (dalam pengembangan).
3. **Responder Studio**: Tool lanjutan untuk merancang percakapan dan alur Auto-Responder otomatis yang kompleks.
4. **File Explorer**: Mengelola file yang diunggah ke Google Drive Anda dari panel. Bisa menyalin link unduhan file untuk digunakan di Auto-Responder.
5. **Group Manager**: Memantau statistik grup WhatsApp yang Anda sewa, melihat daftar anggota, dan memperbarui link undangan grup.
6. **Subscription**: Memeriksa detail paket lisensi Anda (Basic, Standard, Premium, God), status akun, dan sisa hari berlangganan.
7. **Task Manager**: Memantau penggunaan CPU, RAM, uptime VPS, dan proses jendela yang sedang berjalan secara real-time.
8. **Account**: Mengatur profil pengguna dan logout dari panel dengan aman.

Perintah Bot di WhatsApp:
- \`!say [teks]\`: Bot mengulangi pesan dan menghapus pesan asli (fitur anonim/pengumuman).
- \`!tagall [pesan]\`: Melakukan mention/tag ke semua anggota grup sekaligus.
- \`!ai [pertanyaan]\` atau \`!ask [pertanyaan]\`: Bertanya langsung ke AI di dalam grup.
- Auto-Reply AI: Membalas (reply) pesan bot langsung tanpa perintah akan memicu jawaban AI.
- Auto-Responder: Bot membalas otomatis jika ada pesan masuk yang cocok dengan kamus kata kunci.

Aturan Penting (CRITICAL):
1. Jika ditanya teknologi di balik Anda atau model AI yang mendasari Anda (seperti Gemini, Google, OpenAI, GPT, LLM), jawablah dengan ramah: "Itu adalah data rahasia perusahaan netals. Yang pasti saya adalah asisten resmi YAY yang siap membantu Anda!"
2. Jawablah secara singkat, jelas, dan ramah. DILARANG KERAS menggunakan emoji apa pun dalam jawaban Anda. Selalu gunakan bahasa teks murni yang sopan dan profesional.`;

// ============================================================
// PROVIDER: Gemini
// ============================================================
const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];

async function callGemini(contents: object[]): Promise<string> {
  if (!GEMINI_KEY) throw new Error('No Gemini key configured');
  let lastErr: Error | null = null;
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
      lastErr = new Error(`Gemini ${model} ${res.status}: ${errText}`);
      // If key is invalid (403) or quota issue, stop trying more models
      if (res.status === 403 || res.status === 429) throw lastErr;
      continue; // Try next model for 404
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) return text;
    throw new Error('Empty response from Gemini');
  }
  throw lastErr || new Error('All Gemini models failed');
}

// ============================================================
// PROVIDER: OpenAI / ChatGPT
// ============================================================
async function callOpenAI(messages: object[]): Promise<string> {
  if (!OPENAI_KEY) throw new Error('No OpenAI key configured');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 800, temperature: 0.7 }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty response from OpenAI');
  return text;
}

// ============================================================
// PROVIDER: Groq (Llama3 — fast & free tier)
// ============================================================
async function callGroq(messages: object[]): Promise<string> {
  if (!GROQ_KEY) throw new Error('No Groq key configured');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: 'llama3-8b-8192', messages, max_tokens: 800, temperature: 0.7 }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty response from Groq');
  return text;
}

// ============================================================
// MAIN API HANDLER — with fallback chain
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ status: 'error', message: 'Message is required.' }, { status: 400 });
    }

    // Build history in OpenAI format (compatible with Groq too)
    const openAiMessages = [
      { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
      ...history.map((h: { role: 'user' | 'model'; text: string }) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.text,
      })),
      { role: 'user', content: message },
    ];

    // Build history in Gemini format
    const geminiContents = [
      { role: 'user', parts: [{ text: ASSISTANT_SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Siap! Saya adalah YAY Assistant. Saya akan mematuhi instruksi Anda, bersikap sangat ramah, humble, menggunakan Bahasa Indonesia, dan menjelaskan fitur-fitur YAY dengan baik serta menyembunyikan identitas mesin LLM saya. Ada yang bisa saya bantu hari ini?' }] },
      ...history.map((h: { role: 'user' | 'model'; text: string }) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    // Try providers in order
    const providers = [
      { name: 'Gemini',  fn: () => callGemini(geminiContents) },
      { name: 'OpenAI',  fn: () => callOpenAI(openAiMessages) },
      { name: 'Groq',    fn: () => callGroq(openAiMessages) },
    ];

    let replyText = '';
    let lastError = '';
    for (const provider of providers) {
      try {
        replyText = await provider.fn();
        console.log(`[Assistant API] Responded via ${provider.name}`);
        break;
      } catch (err: any) {
        lastError = err.message;
        console.warn(`[Assistant API] ${provider.name} failed: ${err.message}`);
      }
    }

    if (!replyText) {
      console.error('[Assistant API] All providers failed. Last error:', lastError);
      return NextResponse.json({ status: 'error', message: 'Semua provider AI tidak tersedia saat ini.' }, { status: 503 });
    }

    return NextResponse.json({ status: 'success', reply: replyText });
  } catch (err: any) {
    console.error('[Assistant API] Unexpected error:', err);
    return NextResponse.json({ status: 'error', message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
