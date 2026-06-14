"use client";

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';

export type ProtocolAppId = 'controlcenter' | 'fileexplorer' | 'taskmanager' | 'groupmanager' | 'user-manager';

interface MobileProtocolsProps {
  onOpenApp: (appId: ProtocolAppId) => void;
}

export default function MobileProtocols({ onOpenApp }: MobileProtocolsProps) {
  const { t } = useLanguage();
  const apps = [
    { id: 'controlcenter', name: t('control_center'), icon: 'settings_applications', color: 'from-blue-500 to-cyan-500', desc: t('desc_control_center') },
    { id: 'fileexplorer', name: t('file_explorer'), icon: 'folder', color: 'from-orange-500 to-yellow-500', desc: t('desc_file_explorer') },
    { id: 'taskmanager', name: t('task_manager'), icon: 'analytics', color: 'from-green-500 to-emerald-500', desc: t('desc_task_manager') },
    { id: 'groupmanager', name: t('group_manager'), icon: 'groups', color: 'from-purple-500 to-pink-500', desc: t('desc_group_manager') },

  ];

  return (
    <div className="flex flex-col h-full bg-[#111113] p-6 pb-24 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl text-blue-400">apps</span>
          {t('protocols')}
        </h2>
        <p className="text-white/40 text-sm mt-1">{t('access_modules')}</p>
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
