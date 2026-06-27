'use client';
import { useState } from 'react';
import type { ClientRegistry } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useLanguage } from '@/lib/LanguageContext';

interface GroupManagerProps {
  client: ClientRegistry;
  onUpdate: (data: Partial<ClientRegistry>) => Promise<void>;
}

export default function GroupManagerApp({ client, onUpdate }: GroupManagerProps) {
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
  const { showToast, toastElement } = useToast();
  const { t } = useLanguage();

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        Group_1: groups.Group_1,
        Group_2: groups.Group_2,
        Group_3: groups.Group_3,
        Group_4: groups.Group_4,
        Group_5: groups.Group_5,
      });
      showToast(t('toast_group_saved'), 'success');
    } catch (e) {
      showToast(t('toast_group_save_failed'), 'error');
    }
    setSaving(false);
  };

  const isBasicLocked = tier === 'Basic' && !!client.Group_1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      
      {/* Main Settings Card */}
      <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] space-y-6">
        <div>
          <div className="text-xs text-zinc-400 uppercase tracking-widest font-black mb-1">
            Group Link Settings
          </div>
          <p className="text-[11px] text-zinc-500 font-semibold">
            Manage your WhatsApp Group Join Links. Your current tier is <span className="font-bold text-zinc-950">{tier}</span> (Max {maxGroups} groups).
          </p>
        </div>

        <div className="space-y-4">
          {[...Array(maxGroups)].map((_, i) => {
            const groupKey = `Group_${i + 1}` as keyof typeof groups;
            const isLocked = i === 0 && isBasicLocked;

            return (
              <div key={groupKey} className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block ml-1">
                  WhatsApp Group {i + 1}
                </label>
                
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="https://chat.whatsapp.com/..."
                    value={groups[groupKey]}
                    disabled={isLocked}
                    onChange={(e) => setGroups({ ...groups, [groupKey]: e.target.value })}
                    className="flex-1 bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-zinc-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  
                  {tier !== 'Basic' && (
                    <button
                      onClick={() => setGroups({ ...groups, [groupKey]: '' })}
                      className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-full text-xs transition-colors border border-zinc-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {isLocked && (
                  <p className="text-[10px] text-amber-600 mt-1 block font-semibold ml-1">
                    🔒 Hubungi YAY staff untuk merubah link grup.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-200/40">
          <button
            onClick={handleSave}
            disabled={isBasicLocked || saving}
            className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold rounded-full text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isBasicLocked ? 'Locked' : saving ? 'Saving...' : 'Save Links'}
          </button>
        </div>
      </div>

      {toastElement}
    </div>
  );
}
