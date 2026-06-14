'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ClientRegistry } from '@/lib/api';

interface MobileSetupScreenProps {
  client: ClientRegistry;
  onUpdate: (data: Partial<ClientRegistry>) => Promise<void>;
  onComplete: () => void;
}

export default function MobileSetupScreen({ client, onUpdate, onComplete }: MobileSetupScreenProps) {
  const [groupLink, setGroupLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!groupLink) return;
    setLoading(true);
    try {
      await onUpdate({ Group_1: groupLink });
      onComplete();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0a0a0f] p-6 justify-center overflow-hidden relative">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-blue-500/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 shadow-2xl mb-6 backdrop-blur-xl">
            <span className="material-symbols-outlined text-4xl text-white">robot_2</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Selamat Datang di YAY</h1>
          <p className="text-white/60 text-sm px-4">Langkah terakhir, masukkan link grup WhatsApp target kamu agar bot dapat beroperasi.</p>
        </div>

        <div className="bg-[#111113]/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
          <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
            <span className="material-symbols-outlined text-base">link</span>
            Tautan Grup WhatsApp
          </label>
          
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="https://chat.whatsapp.com/..."
              value={groupLink}
              onChange={(e) => setGroupLink(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-4 py-4 text-base text-white outline-none focus:border-blue-500 transition-colors shadow-inner"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!groupLink || loading}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-blue-500 text-white font-bold text-lg shadow-[0_10px_20px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined">rocket_launch</span>
            )}
            {loading ? 'Menyimpan...' : 'Mulai Sekarang'}
          </button>
        </div>

        <div className="mt-8 text-center flex flex-col gap-2">
          <span className="text-white/30 text-xs font-medium">Masuk sebagai</span>
          <span className="text-white/70 text-sm font-bold bg-white/5 inline-block px-4 py-2 rounded-full border border-white/5 mx-auto">+{client.WhatsApp_Owner}</span>
        </div>
      </motion.div>
    </div>
  );
}
