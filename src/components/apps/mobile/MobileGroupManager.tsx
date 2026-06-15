'use client';
import { useState } from 'react';
import type { ClientRegistry } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface GroupManagerProps {
  client: ClientRegistry;
  onUpdate: (data: Partial<ClientRegistry>) => Promise<void>;
}

export default function MobileGroupManager({ client, onUpdate }: GroupManagerProps) {
  const { t } = useLanguage();
  const [groups, setGroups] = useState({
    Group_1: client.Group_1 || '',
    Group_2: client.Group_2 || '',
    Group_3: client.Group_3 || '',
    Group_4: client.Group_4 || '',
    Group_5: client.Group_5 || '',
  });

  const tier = client.Package_Tier;
  const maxGroups = (tier === 'Premium' || tier === 'God') ? 5 : (tier === 'Standard' || tier === 'Standart') ? 2 : 1;
  const [saving, setSaving] = useState(false);
  const isBasicLocked = tier === 'Basic' && !!client.Group_1;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(groups);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const hasChanges = Object.keys(groups).some(key => {
    const k = key as keyof typeof groups;
    return groups[k] !== (client[k as keyof ClientRegistry] || '');
  });

  return (
    <div className="flex flex-col h-full bg-[#111113] relative">
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-center relative overflow-hidden">
          <span className="material-symbols-outlined text-6xl text-purple-400 mb-2">groups</span>
          <h2 className="text-xl font-bold text-white">{t('group_links')}</h2>
          <p className="text-sm text-white/70 mt-2">
            {t('your_tier_is')} <span className="font-bold text-white">{t(tier) || tier}</span>. {t('max')} {maxGroups} {t('groups_lowercase')}.
          </p>
        </div>

        <div className="space-y-6">
          {[...Array(maxGroups)].map((_, i) => {
            const groupKey = `Group_${i + 1}` as keyof typeof groups;
            const isLocked = i === 0 && isBasicLocked;

            return (
              <div key={groupKey} className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  {tier !== 'Basic' && groups[groupKey] && (
                    <button
                      onClick={() => setGroups({ ...groups, [groupKey]: '' })}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
                
                <input
                  type="text"
                  placeholder="https://chat.whatsapp.com/..."
                  value={groups[groupKey]}
                  disabled={isLocked}
                  onChange={(e) => setGroups({ ...groups, [groupKey]: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:bg-white/5"
                />
                
                {isLocked && (
                  <p className="flex items-center gap-2 text-xs text-orange-400 font-bold mt-2 bg-orange-400/10 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-base">lock</span>
                    {t('contact_staff_lock')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Save Bar */}
      <AnimatePresence>
        {hasChanges && !isBasicLocked && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute bottom-28 left-4 right-4 bg-[#1a1a1c] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between z-[10000]"
          >
            <span className="text-sm font-bold text-white/80">Hold on, you changed something.</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#22c55e] hover:bg-[#16a34a] text-[#111113] font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 active:scale-95"
            >
              {saving ? t('saving') : t('save_links')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
