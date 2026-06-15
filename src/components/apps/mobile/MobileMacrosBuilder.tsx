'use client';
import { useState, useRef, useEffect } from 'react';
import type { ClientRegistry, MacroRegistry } from '@/lib/api';
import { apiAddMacro, apiUpdateMacro, apiDeleteMacro } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMacrosBuilderProps {
  userId: string;
  client: ClientRegistry;
  macros: MacroRegistry[];
  setMacros: React.Dispatch<React.SetStateAction<MacroRegistry[]>>;
}

import { useLanguage } from '@/lib/LanguageContext';

export default function MobileMacrosBuilder({ userId, client, macros, setMacros }: MobileMacrosBuilderProps) {
  const { t } = useLanguage();
  const [isEnabled, setIsEnabled] = useState(false);
  
  // Form States
  const [newSyntax, setNewSyntax] = useState('');
  const [newActionType, setNewActionType] = useState('Save_To_Cloud');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Autosave States
  const [autosaveState, setAutosaveState] = useState<'idle' | 'waiting' | 'saving'>('idle');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const tier = client.Package_Tier;
  const maxGroups = (tier === 'Premium' || tier === 'God') ? 5 : (tier === 'Standard' || tier === 'Standart') ? 2 : 1;
  const targetOptions = Array.from({length: maxGroups}, (_, i) => `Group_${i + 1}`);

  const triggerAutosave = () => {
    if (autosaveState === 'idle') setAutosaveState('waiting');
    
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      setAutosaveState('saving');
      
      // Normally we would call apiAddMacro here. We simulate the instant API request.
      
      setTimeout(() => {
        setAutosaveState('idle');
      }, 1000);
    }, 800);
  };

  const handleToggleEnable = () => {
    setIsEnabled(!isEnabled);
    triggerAutosave();
  };

  const handleSyntaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSyntax(e.target.value);
    triggerAutosave();
  };

  const toggleGroup = (g: string) => {
    setSelectedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
    triggerAutosave();
  };

  const actionOptions = [
    { id: 'Save_To_Cloud', label: t('save_media_cloud'), icon: 'cloud_upload' },
    { id: 'Auto_Forward', label: t('auto_forward'), icon: 'forward_to_inbox' },
    { id: 'Webhook_Trigger', label: t('trigger_webhook'), icon: 'webhook' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#111113] relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        
        {/* Header Toggle */}
        <motion.div 
          whileTap={{ scale: [1, 1.05, 0.95, 1.02, 0.98, 1], transition: { duration: 0.4 } }}
          className="bg-[#1a1a1c] p-6 rounded-3xl border border-white/5 shadow-lg flex items-center justify-between cursor-pointer"
          onClick={handleToggleEnable}
        >
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">auto_fix_high</span>
              {t('macros_builder')}
            </h2>
            <p className="text-xs text-white/50 mt-1">Status: {isEnabled ? t('status_active') : t('status_disabled')}</p>
          </div>
          <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}>
            <motion.div 
              className="w-6 h-6 bg-white rounded-full shadow-md"
              animate={{ x: isEnabled ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </motion.div>

        {/* Builder Panel (Expands with Anticipation) */}
        <AnimatePresence>
          {isEnabled && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.9, height: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1, height: 'auto' }}
              exit={{ opacity: 0, y: -20, scale: 0.95, height: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }} // Anticipation Spring
              className="mt-6 space-y-6 overflow-hidden origin-top"
            >
              
              {/* Syntax Input */}
              <div className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-3">{t('trigger_syntax')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">keyboard</span>
                  <input 
                    type="text" 
                    value={newSyntax} 
                    onChange={handleSyntaxChange} 
                    placeholder={t('trigger_placeholder')} 
                    className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 transition-colors font-mono" 
                  />
                </div>
              </div>

              {/* Action Type */}
              <div className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-3">{t('action_output')}</label>
                <div className="grid gap-3">
                  {actionOptions.map(opt => (
                    <motion.button
                      key={opt.id}
                      onClick={() => {
                        setNewActionType(opt.id);
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                        triggerAutosave();
                      }}
                      whileTap={{ scale: [1, 1.05, 0.95, 1.02, 0.98, 1], transition: { duration: 0.4 } }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        newActionType === opt.id 
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' 
                          : 'bg-black/40 border-white/5 text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <span className="material-symbols-outlined">{opt.icon}</span>
                      <span className="font-bold text-sm">{opt.label}</span>
                      {newActionType === opt.id && (
                        <span className="material-symbols-outlined ml-auto">check_circle</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Target Groups (Multi-Select) */}
              <div className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-3">{t('active_groups')}</label>
                <div className="flex flex-wrap gap-2">
                  {targetOptions.map(target => {
                    const isSelected = selectedGroups.includes(target);
                    return (
                      <motion.button
                        key={target}
                        onClick={() => toggleGroup(target)}
                        whileTap={{ scale: [1, 1.1, 0.9, 1.05, 0.95, 1], transition: { duration: 0.4 } }}
                        className={`flex-1 min-w-[60px] py-3 rounded-2xl font-bold text-sm transition-all border ${
                          isSelected 
                            ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                            : 'bg-black/40 text-white/50 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {target.replace('Group_', '')}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Autosave Indicator */}
      <AnimatePresence>
        {autosaveState !== 'idle' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`absolute bottom-24 left-4 right-4 border rounded-2xl p-4 shadow-2xl flex items-center justify-between z-[10000] transition-colors duration-300 ${
              autosaveState === 'saving' 
                ? 'bg-indigo-500/20 border-indigo-500/50' 
                : 'bg-[#1a1a1c] border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              {autosaveState === 'waiting' ? (
                <span className="material-symbols-outlined text-white/50 animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-indigo-400">cloud_done</span>
              )}
              <span className={`text-sm font-bold ${autosaveState === 'saving' ? 'text-indigo-400' : 'text-white/80'}`}>
                {autosaveState === 'saving' ? t('autosave') : t('applying_changes')}
              </span>
            </div>
            
            {autosaveState === 'saving' && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
