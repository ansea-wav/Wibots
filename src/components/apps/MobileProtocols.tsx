"use client";

import { motion } from 'framer-motion';

export type ProtocolAppId = 'controlcenter' | 'fileexplorer' | 'taskmanager' | 'groupmanager' | 'user-manager';

interface MobileProtocolsProps {
  onOpenApp: (appId: ProtocolAppId) => void;
}

export default function MobileProtocols({ onOpenApp }: MobileProtocolsProps) {
  const apps = [
    { id: 'controlcenter', name: 'Control Center', icon: 'settings_applications', color: 'from-blue-500 to-cyan-500', desc: 'Bot configuration & logic' },
    { id: 'fileexplorer', name: 'File Explorer', icon: 'folder', color: 'from-orange-500 to-yellow-500', desc: 'Manage bot storage' },
    { id: 'taskmanager', name: 'Task Manager', icon: 'analytics', color: 'from-green-500 to-emerald-500', desc: 'Monitor system resources' },
    { id: 'groupmanager', name: 'Group Manager', icon: 'groups', color: 'from-purple-500 to-pink-500', desc: 'Manage connected groups' },
    { id: 'user-manager', name: 'User Manager', icon: 'person', color: 'from-red-500 to-orange-500', desc: 'Manage bot users' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#111113] p-6 pb-24 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl text-blue-400">apps</span>
          Protocols
        </h2>
        <p className="text-white/40 text-sm mt-1">Access all your installed modules</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {apps.map((app, idx) => (
          <motion.button
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onOpenApp(app.id as ProtocolAppId)}
            className="bg-[#1a1a1c] border border-white/5 hover:border-white/20 p-4 rounded-3xl flex flex-col items-start justify-between min-h-[140px] text-left transition-all shadow-lg relative overflow-hidden group"
          >
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${app.color} rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity`}></div>
            
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-lg mb-4`}>
              <span className="material-symbols-outlined text-xl">{app.icon}</span>
            </div>
            
            <div>
              <div className="text-sm font-bold text-white">{app.name}</div>
              <div className="text-[10px] text-white/40 mt-1 line-clamp-2">{app.desc}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
