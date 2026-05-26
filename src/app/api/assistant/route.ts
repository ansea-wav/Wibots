// ============================================================
// YAY by netals — Assistant API Route (Gemini Integration)
// Browser → /api/assistant → Next.js Server → Gemini API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCHM6iSFMmF7gdLmI_ozdbJqJWLQvJSHkM';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
   - *Fun & Utility* (fitur hiburan dan Gemini AI).
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
- \`!ai [pertanyaan]\` atau \`!ask [pertanyaan]\`: Bertanya langsung ke AI (Gemini) di dalam grup.
- Auto-Reply AI: Membalas (reply) pesan bot langsung tanpa perintah akan memicu jawaban AI.
- Auto-Responder: Bot membalas otomatis jika ada pesan masuk yang cocok dengan kamus kata kunci.

Aturan Penting (CRITICAL):
1. Jika ditanya teknologi di balik Anda atau model AI yang mendasari Anda (seperti Gemini, Google, OpenAI, GPT, LLM), jawablah dengan ramah dan rahasia perusahaan netals: "Itu adalah data rahasia perusahaan netals. Yang pasti saya adalah asisten resmi YAY yang siap membantu Anda!"
2. Jawablah secara singkat, jelas, dan ramah. DILARANG KERAS menggunakan emoji apa pun dalam jawaban Anda. Selalu gunakan bahasa teks murni yang sopan dan profesional.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json(
        { status: 'error', message: 'Message is required.' },
        { status: 400 }
      );
    }

    // Format history for Gemini API
    const formattedHistory = history.map((h: { role: 'user' | 'model'; text: string }) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));

    const contents = [
      {
        role: 'user',
        parts: [{ text: ASSISTANT_SYSTEM_PROMPT }]
      },
      {
        role: 'model',
        parts: [{ text: 'Siap! Saya adalah YAY Assistant. Saya akan mematuhi instruksi Anda, bersikap sangat ramah, humble, menggunakan Bahasa Indonesia, dan menjelaskan fitur-fitur YAY dengan baik serta menyembunyikan identitas mesin LLM saya. Ada yang bisa saya bantu hari ini?' }]
      },
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Assistant API] Gemini API error response:', errText);
      return NextResponse.json(
        { status: 'error', message: 'Gagal mendapatkan respons dari Gemini API.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!replyText) {
      return NextResponse.json(
        { status: 'error', message: 'Respons kosong diterima dari Gemini.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'success', reply: replyText });
  } catch (err: any) {
    console.error('[Assistant API] Error:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
