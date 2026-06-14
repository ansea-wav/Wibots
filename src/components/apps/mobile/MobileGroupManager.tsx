'use client';
import { useState } from 'react';
import type { ClientRegistry } from '@/lib/api';

interface GroupManagerProps {
  client: ClientRegistry;
  onUpdate: (data: Partial<ClientRegistry>) => Promise<void>;
}

export default function MobileGroupManager({ client, onUpdate }: GroupManagerProps) {
  const [groups, setGroups] = useState({
    Group_1: client.Group_1 || '',
    Group_2: client.Group_2 || '',
    Group_3: client.Group_3 || '',
    Group_4: client.Group_4 || '',
    Group_5: client.Group_5 || '',
  });

  const tier = client.Package_Tier;
  const maxGroups = (tier === 'Premium' || tier === 'God') ? 5 : tier === 'Standard' ? 2 : 1;
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

  return (
    <div className="flex flex-col h-full bg-[#111113]">
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-center relative overflow-hidden">
          <span className="material-symbols-outlined text-6xl text-purple-400 mb-2">groups</span>
          <h2 className="text-xl font-bold text-white">Group Links</h2>
          <p className="text-sm text-white/70 mt-2">
            Your tier is <span className="font-bold text-white">{tier}</span>. Max {maxGroups} groups.
          </p>
        </div>

        <div className="space-y-6">
          {[...Array(maxGroups)].map((_, i) => {
            const groupKey = `Group_${i + 1}` as keyof typeof groups;
            const isLocked = i === 0 && isBasicLocked;

            return (
              <div key={groupKey} className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg">
                <label className="flex items-center gap-2 text-sm font-bold text-white mb-3 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-purple-400">forum</span>
                  WhatsApp Group {i + 1}
                </label>
                
                <input
                  type="text"
                  placeholder="https://chat.whatsapp.com/..."
                  value={groups[groupKey]}
                  disabled={isLocked}
                  onChange={(e) => setGroups({ ...groups, [groupKey]: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:bg-white/5 mb-3"
                />
                
                {tier !== 'Basic' && (
                  <button
                    onClick={() => setGroups({ ...groups, [groupKey]: '' })}
                    className="w-full py-3 bg-white/5 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">backspace</span>
                    Clear Link
                  </button>
                )}
                
                {isLocked && (
                  <p className="flex items-center gap-2 text-xs text-orange-400 font-bold mt-2 bg-orange-400/10 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-base">lock</span>
                    Contact Wazle staff to change this link.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button Fixed Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#111113] via-[#111113] to-transparent pt-12 pointer-events-none">
        <button
          onClick={handleSave}
          disabled={isBasicLocked || saving}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-purple-500 text-white font-bold text-lg shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-transform pointer-events-auto disabled:opacity-50 disabled:grayscale"
        >
          <span className="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
          {isBasicLocked ? 'Locked' : saving ? 'Saving...' : 'Save Links'}
        </button>
      </div>
    </div>
  );
}
