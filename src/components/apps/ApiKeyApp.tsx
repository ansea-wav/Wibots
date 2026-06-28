'use client';
import { useState } from 'react';
import type { ClientRegistry } from '@/lib/api';
import { toast } from '@/components/DynamicIsland';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiKeyProps {
  client: ClientRegistry;
}

type ModelType = 'Zeina X' | 'Zeina Pro' | 'Zeina Max';

export default function ApiKeyApp({ client }: ApiKeyProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>('Zeina X');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('jwt_token_01jhk9a2b8e39f40a1b2c3d4e5f6');

  const serverId = `YAY-SRV-${(client.User_ID || 'master').slice(0, 10).toUpperCase()}`;
  const clientId = `YAY-CLI-${client.WhatsApp_Owner || 'user'}`;
  const publicKey = `pub_key_${(client.License_Key || 'NETALS_SECURE_SECRET_2026_XYZ').slice(0, 32)}`;
  const zidToken = `zid_tok_${(client.User_ID || '012345').slice(-6)}${client.WhatsApp_Owner || '999'}`;

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    toast(`${field} copied to clipboard!`, 'success');
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateToken = () => {
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setGeneratedToken(`jwt_token_${randomHex}`);
    toast('New API Token generated successfully!', 'success');
  };

  const keysList = [
    { label: 'Server ID', value: serverId, desc: 'Identifikasi server node yang didedikasikan untuk bot Anda.' },
    { label: 'Client ID', value: clientId, desc: 'Identifikasi unik akun WhatsApp owner Anda.' },
    { label: 'Public Key', value: publicKey, desc: 'Kunci publik enkripsi aman untuk otentikasi API external.' },
  ];

  const modelSpecs = {
    'Zeina X': {
      desc: 'High-speed, optimized model for instant automated auto-responses.',
      context: '32k tokens',
      latency: '~120ms',
      mode: 'Text Chat Only',
      features: ['Real-time responses', 'Low system overhead', 'Keyword optimization']
    },
    'Zeina Pro': {
      desc: 'Advanced reasoning model with high semantic comprehension and precision.',
      context: '128k tokens',
      latency: '~350ms',
      mode: 'Text & Multimodal',
      features: ['Contextual understanding', 'Media analysis support', 'Intent detection']
    },
    'Zeina Max': {
      desc: 'Ultra-capable model designed for complex logic, multi-turn reasoning and agentic tasks.',
      context: '1M tokens',
      latency: '~680ms',
      mode: 'Text, Image & Audio',
      features: ['Deep chain-of-thought', 'Full audio & image inputs', 'Advanced routing']
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left">
      
      {/* Section 1: Credentials & Keys */}
      <div>
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-4">
          Credentials & Keys
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {keysList.map((key, i) => (
            <div 
              key={i} 
              className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between h-56"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">{key.label}</span>
                  <span className="material-symbols-outlined text-zinc-800 text-[18px]">vpn_key</span>
                </div>
                <p className="text-[10px] text-zinc-505 font-semibold leading-relaxed">{key.desc}</p>
              </div>

              <div className="space-y-3 mt-4">
                <div className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-[11px] text-zinc-950 font-mono truncate select-all">
                  {key.value}
                </div>
                
                <button
                  onClick={() => handleCopy(key.label, key.value)}
                  className="w-full py-2 rounded-full text-xs font-black bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-[2px_2px_0px_#000000] border border-zinc-950 cursor-pointer"
                >
                  {copiedField === key.label ? '✓ Copied' : 'Copy Key'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: AI Models */}
      <div>
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-4">
          AI Models
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Dropdown Select Model Card */}
          <div className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between h-64 relative z-40">
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block">Select Active Model</span>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                Pilih model kecerdasan buatan utama untuk memproses input auto-responder dan interaksi chat.
              </p>
            </div>

            {/* Custom Neo-brutalist Dropdown Selector */}
            <div className="relative mt-2">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-white border-2 border-zinc-950 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-black text-zinc-950 shadow-[2px_2px_0px_#09090b] cursor-pointer hover:bg-zinc-50 transition-colors"
              >
                <span>{selectedModel}</span>
                <motion.span 
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  className="material-symbols-outlined text-[18px] text-zinc-950 font-bold"
                >
                  expand_more
                </motion.span>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 right-0 top-full bg-[#fdfcf7] border-2 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_#09090b] overflow-hidden z-50 p-1 space-y-0.5"
                  >
                    {(['Zeina X', 'Zeina Pro', 'Zeina Max'] as ModelType[]).map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          setSelectedModel(model);
                          setIsDropdownOpen(false);
                          toast(`Active AI Model changed to ${model}!`, 'success');
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                          selectedModel === model 
                            ? 'bg-zinc-950 text-white' 
                            : 'text-zinc-800 hover:bg-zinc-100'
                        }`}
                      >
                        <span>{model}</span>
                        {selectedModel === model && (
                          <span className="material-symbols-outlined text-[14px] text-white">check</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Model Specification Details Card */}
          <div className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between h-64">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">APIs Model Spec</span>
                <span className="text-[9px] font-black text-white bg-zinc-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-zinc-500">
                <div>
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-black">Model Name</div>
                  <div className="text-zinc-950 font-black text-xs mt-0.5">{selectedModel}</div>
                </div>
                <div>
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-black">Context Window</div>
                  <div className="text-zinc-950 font-black text-xs mt-0.5">{modelSpecs[selectedModel].context}</div>
                </div>
                <div>
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-black">Response Latency</div>
                  <div className="text-zinc-950 font-black text-xs mt-0.5">{modelSpecs[selectedModel].latency}</div>
                </div>
                <div>
                  <div className="text-[8px] text-zinc-400 uppercase tracking-widest font-black">Modal Type</div>
                  <div className="text-zinc-950 font-black text-xs mt-0.5">{modelSpecs[selectedModel].mode}</div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-600 leading-relaxed font-semibold">
                {modelSpecs[selectedModel].desc}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Section 3: APIs Config */}
      <div>
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-4">
          APIs Config
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Generate Token Card */}
          <div className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between h-56">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block">Generate Token</span>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                Buat token otorisasi API baru untuk mengamankan komunikasi eksternal Anda.
              </p>
            </div>

            <div className="space-y-3 mt-2">
              <div className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-[11px] text-zinc-950 font-mono truncate select-all">
                {generatedToken}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateToken}
                  className="flex-1 py-2.5 rounded-full text-xs font-black bg-white border-2 border-zinc-950 text-zinc-950 hover:bg-zinc-50 transition-colors shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  Generate New
                </button>
                <button
                  onClick={() => handleCopy('API Token', generatedToken)}
                  className="px-5 py-2.5 rounded-full text-xs font-black bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-[2px_2px_0px_#000000] border border-zinc-950 cursor-pointer"
                >
                  Copy Token
                </button>
              </div>
            </div>
          </div>

          {/* ZID Token Card */}
          <div className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between h-56">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block">ZID Token</span>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                Token identifikasi Wibots unik yang digunakan untuk mengidentifikasi bot Anda dalam jaringan.
              </p>
            </div>

            <div className="space-y-3 mt-2">
              <div className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-[11px] text-zinc-950 font-mono truncate select-all">
                {zidToken}
              </div>
              <button
                onClick={() => handleCopy('ZID Token', zidToken)}
                className="w-full py-2.5 rounded-full text-xs font-black bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-[3px_3px_0px_#000000] border border-zinc-950 cursor-pointer"
              >
                Copy ZID Token
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
