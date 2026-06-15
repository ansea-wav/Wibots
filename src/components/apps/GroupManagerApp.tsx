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
    <div className="flex flex-col h-full bg-[var(--surface-panel)] text-white overflow-auto p-6">
      <div className="mb-6 border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold mb-1">Group Link Manager</h2>
        <p className="text-xs text-[var(--text-tertiary)]">
          Manage your WhatsApp Group Join Links. Your current tier is <span className="font-bold text-[var(--neon-green)]">{tier}</span> (Max {maxGroups} groups).
        </p>
      </div>

      <div className="space-y-5">
        {[...Array(maxGroups)].map((_, i) => {
          const groupKey = `Group_${i + 1}` as keyof typeof groups;
          const isLocked = i === 0 && isBasicLocked;

          return (
            <div key={groupKey} className="bg-black/20 p-4 rounded-xl border border-white/5">
              <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2 block font-semibold">
                WhatsApp Group {i + 1}
              </label>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="https://chat.whatsapp.com/..."
                  value={groups[groupKey]}
                  disabled={isLocked}
                  onChange={(e) => setGroups({ ...groups, [groupKey]: e.target.value })}
                  className="flex-1 bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-4 py-2 text-sm outline-none focus:border-[var(--neon-green)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                
                {tier !== 'Basic' && (
                  <button
                    onClick={() => setGroups({ ...groups, [groupKey]: '' })}
                    className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {isLocked && (
                <p className="text-[10px] text-amber-500 mt-2 font-medium">
                  🔒 Hubungi YAY staff untuk merubah link grup.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isBasicLocked || saving}
          className="px-6 py-2 bg-[var(--neon-green)] text-black font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBasicLocked ? 'Locked' : saving ? 'Saving...' : 'Save Links'}
        </button>
      </div>

      {toastElement}
    </div>
  );
}
