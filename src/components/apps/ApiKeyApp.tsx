'use client';
import { useState } from 'react';
import type { ClientRegistry } from '@/lib/api';
import { toast } from '@/components/DynamicIsland';

interface ApiKeyProps {
  client: ClientRegistry;
}

export default function ApiKeyApp({ client }: ApiKeyProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const serverId = `YAY-SRV-${(client.User_ID || 'master').slice(0, 10).toUpperCase()}`;
  const clientId = `YAY-CLI-${client.WhatsApp_Owner || 'user'}`;
  const publicKey = `pub_key_${(client.License_Key || 'NETALS_SECURE_SECRET_2026_XYZ').slice(0, 32)}`;

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    toast(`${field} copied to clipboard!`, 'success');
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const keysList = [
    { label: 'Server ID', value: serverId, desc: 'Identifikasi server node yang didedikasikan untuk bot Anda.' },
    { label: 'Client ID', value: clientId, desc: 'Identifikasi unik akun WhatsApp owner Anda.' },
    { label: 'Public Key', value: publicKey, desc: 'Kunci publik enkripsi aman untuk otentikasi API external.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div className="text-xs text-zinc-400 uppercase tracking-widest font-black mb-3">
        Credentials & Keys
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {keysList.map((key, i) => (
          <div 
            key={i} 
            className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between h-56"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">{key.label}</span>
                <span className="material-symbols-outlined text-zinc-400 text-[18px]">vpn_key</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">{key.desc}</p>
            </div>

            <div className="space-y-3 mt-4">
              <div className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-[11px] text-zinc-950 font-mono truncate select-all">
                {key.value}
              </div>
              
              <button
                onClick={() => handleCopy(key.label, key.value)}
                className="w-full py-2 rounded-full text-xs font-bold bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-sm cursor-pointer"
              >
                {copiedField === key.label ? '✓ Copied' : 'Copy Key'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
