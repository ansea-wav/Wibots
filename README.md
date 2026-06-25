# 🌌 YAY by Netals (NetalsOS V2 / Wibots) — Premium WhatsApp Bot SaaS Platform

> **YAY** adalah platform SaaS manajemen bot WhatsApp revolusioner berbasis **Virtual Desktop OS (Web OS)**. Proyek ini menghadirkan ekosistem manajemen bot visual super premium, interaktif, dan modern langsung dari browser Anda, diiringi arsitektur tangguh tiga lapis (*Three-Tier Isolated*).

---

## 🏗️ Arsitektur Tiga Lapis Terisolasi (Three-Tier Isolated)

Platform ini memisahkan lapisan presentasi, komputasi, dan penyimpanan secara mutlak demi performa responsif **0ms cache** dan keamanan maksimal:

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Browser OS)                     │
│  NetalsOS Virtual Desktop → Boot → Login → Desktop OS       │
│  Next.js + React + Tailwind v4 + Theme & Language Engine    │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API + Socket.IO (Proxy Tunnel Bypass)
┌───────────────────────┴─────────────────────────────────────┐
│                   BACKEND (VPS Server Engine)               │
│  Express + Multi-Session Baileys + PM2 + Cron Job           │
│  In-Memory Cache → Respons Instan 0ms                       │
└───────────────────────┬─────────────────────────────────────┘
                        │ Secure POST /doPost (Token Authentication)
┌───────────────────────┴─────────────────────────────────────┐
│                   DATABASE (Google Cloud Infrastructure)    │
│  Google Apps Script (GAS) + Google Sheets Database          │
│  Client_Registry | Bot_Core_Config | Auto_Responder         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Direktori & Komponen Utama

```
Bot Wa/
├── .env                          # Environment variables & api keys
├── bot-engine/                   # VPS Backend (Express, Socket.IO, Multi-session Baileys)
│   ├── index.js                  # Entrypoint server backend
│   ├── gasbridge.js              # Jembatan API menuju Google Apps Script
│   ├── datacache.js              # Cache memori respons instan 0ms
│   ├── sessionmanager.js         # Pengelola sesi WhatsApp multi-tenant
│   └── package.json
├── gas-script/                   # Google Apps Script (GAS Database)
│   └── main.gs                   # Logika database & API Google Sheets
├── web-panel/                    # Frontend OS (Next.js + React virtual desktop)
│   ├── src/
│   │   ├── app/                  # Boot, Login, & Global style
│   │   ├── lib/                  # Context, API types & Context Provider
│   │   └── components/           # Virtual desktop UI, Window frames, Dock, & Widgets
│   │       ├── apps/             # Virtual Native Apps (.exe / .app / .sys)
│   │       └── eduverse/         # Modul integrasi edukasi virtual
│   └── README.md                 # Dokumentasi rinci web panel
└── README.md                     # Dokumentasi utama proyek
```

---

## 📱 Aplikasi Native Virtual (Web-Desktop Suite)

Di dalam desktop virtual YAY, pengguna dapat mengoperasikan aplikasi native premium berikut:

| Aplikasi | Nama Berkas | Fungsi & Kegunaan |
|----------|-------------|-------------------|
| 💳 **Account Center** | `Account.exe` | Memantau masa aktif sewa bot dengan donut chart dinamis, detail lisensi, dan limitasi tier. |
| ⚙️ **Control Center** | `ControlCenter.app` | Pengendali bot real-time (Start/Stop engine), QR Code pairing pairing, toggle respon grup/privat, anti-link, & kustom teks sambutan. |
| 🤖 **Responder Studio** | `ResponderStudio.lnk` | Antarmuka CRUD visual lengkap untuk keyword auto-responder (Exact/Contains, Text/Image/Document) serta penargetan grup spesifik. |
| 📁 **File Explorer** | `FileExplorer.sys` | Mengunggah, menjelajahi, dan menyalin tautan (URL) berkas media VPS secara instan untuk kebutuhan balasan bot. |
| 💻 **Task Manager** | `TaskManager.exe` | Memantau beban CPU server, pemakaian memori VPS, uptime server, dan mematikan tugas kernel virtual (`yay-kernel.sys`). |
| 💎 **Subscription Store** | `Subscription.app` | Detail tier lisensi aktif (Basic, Standard, Premium, God) dan integrasi peningkatan layanan. |

---

## ✨ YAY Core Engine (Built-In Bot Modules)

Dengan membuka **YAY.app** di desktop virtual Anda, Anda dapat mengaktifkan modul internal bot WhatsApp yang sangat serbaguna:

1.  **🛡️ Group Moderation Module**: Pengamanan grup WhatsApp komprehensif menggunakan perintah penegak disiplin (`!kick`, `!warn`, `!mute`, dan pengumuman massal `!tagall`).
2.  **🪄 Fun & Utility Module**: Penyedia kebutuhan harian anggota seperti perintah `!say`, `!tts` (Text-to-Speech) suara Google, dan pembuatan stiker instan otomatis via perintah `!sticker`.
3.  **🧠 Gemini AI Terintegrasi (Bawaan!)**: Bot obrolan super cerdas yang ditenagai oleh **Google Gemini AI**. Anggota grup dapat mengajukan pertanyaan ilmiah, meminta saran, atau sekadar berbincang cerdas dengan perintah `!ai [pertanyaan]` atau hanya dengan me-reply pesan dari bot tersebut.
4.  **🎯 Sistem Gamifikasi & Hiburan (Coming Soon)**: Sistem perolehan EXP, Leveling, Daily Rewards, serta modul game petualangan (Werewolf, RPG, Tebak Gambar) di dalam obrolan grup WhatsApp.

---

## 🔒 Lapis Keamanan Tingkat Tinggi

-   **Token-Based API Authorization**: Setiap pertukaran data dari VPS ke Google Apps Script dienkripsi dan diotorisasi menggunakan secure token `auth_token` untuk mencegah pembobolan database pihak ketiga.
-   **Multi-Session Sandboxing**: Menjamin privasi dan keamanan penuh; sesi koneksi WhatsApp tiap pelanggan diisolasi secara penuh dalam container memori VPS yang berbeda.
-   **Blur-Locked Expiry Screen**: Ketika masa aktif lisensi habis, panel virtual akan menampilkan layar penguncian interaktif (*Lock Screen*) yang elegan guna memfasilitasi reaktivasi lisensi baru tanpa merusak data konfigurasi.

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Panel Web (Frontend OS)
```bash
cd web-panel
npm install
npm run dev        # Akses melalui http://localhost:3000
```

### 2. Mesin Utama (Backend Engine VPS)
```bash
cd bot-engine
npm install
node index.js      # Akses melalui http://localhost:3001
# Mode Produksi: pm2 start index.js --name yay-engine
```

### 3. Database Cloud (Google Apps Script)
- Buat Google Sheets dengan 3 tab: `Client_Registry`, `Bot_Core_Configuration`, dan `Auto_Responder_Dictionary`.
- Buka Apps Script, tempel kode dari file `gas-script/main.gs`.
- Terapkan sebagai Aplikasi Web (Deploy as Web App) ke publik ("Anyone"), salin URL webapp tersebut lalu masukkan sebagai variabel lingkungan di VPS Anda.

---

**© 2026 Team Netals & Wibots — Redefining Virtual Desktop OS & WhatsApp Bot Management.**