'use client';
import { useState, useEffect } from 'react';
import { apiGetGroupSettings, apiUpdateGroupSettings, type ClientRegistry, type GroupSettings } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useLanguage } from '@/lib/LanguageContext';
import { toast } from '@/components/DynamicIsland';

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

  // Moderation Settings State
  const [modSettings, setModSettings] = useState<GroupSettings[]>([]);
  const [loadingMod, setLoadingMod] = useState(true);
  const [savingModId, setSavingModId] = useState<string | null>(null);

  useEffect(() => {
    async function loadModSettings() {
      try {
        const res = await apiGetGroupSettings(client.User_ID);
        if (res.status === 'success') {
          setModSettings(res.data || []);
        }
      } catch (e) {
        console.error('Failed to load moderation settings:', e);
      } finally {
        setLoadingMod(false);
      }
    }
    loadModSettings();
  }, [client.User_ID]);

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

  const handleSaveModSettings = async (jid: string, settings: Partial<GroupSettings>) => {
    setSavingModId(jid);
    try {
      const res = await apiUpdateGroupSettings(client.User_ID, jid, settings);
      if (res.status === 'success') {
        toast('Pengaturan moderasi grup disimpan!', 'success');
        // Update local list
        setModSettings(prev => {
          const idx = prev.findIndex(item => item.Group_JID === jid);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...settings };
            return updated;
          } else {
            return [...prev, { Group_JID: jid, User_ID: client.User_ID, ...settings } as GroupSettings];
          }
        });
      } else {
        toast('Gagal menyimpan pengaturan moderasi.', 'error');
      }
    } catch (e) {
      toast('Terjadi kesalahan koneksi server.', 'error');
    } finally {
      setSavingModId(null);
    }
  };

  const isBasicLocked = tier === 'Basic' && !!client.Group_1;

  // Compile list of active JIDs to display moderation cards
  const activeGroups = [];
  for (let i = 1; i <= maxGroups; i++) {
    const link = client[`Group_${i}` as keyof ClientRegistry];
    const jid = client[`GroupJID_${i}` as keyof ClientRegistry];
    if (link) {
      activeGroups.push({
        index: i,
        link: link as string,
        jid: jid as string || null
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      
      {/* Main Link Settings Card */}
      <div className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#000000] space-y-6">
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

      {/* Moderation Settings Panel Section */}
      {activeGroups.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="text-xs text-zinc-400 uppercase tracking-widest font-black">
            Group Moderation Settings
          </div>

          {loadingMod ? (
            <div className="text-xs font-semibold text-zinc-400 py-4">⏳ Loading moderation settings...</div>
          ) : (
            <div className="space-y-6">
              {activeGroups.map((g) => {
                if (!g.jid) {
                  return (
                    <div key={g.index} className="bg-[#fdfcf7] border-2 border-dashed border-zinc-400 rounded-3xl p-5 text-center text-zinc-400 text-xs font-semibold">
                      ⚙️ Group {g.index} belum disinkronisasikan. Bot harus membaca chat grup terlebih dahulu agar JID terdeteksi.
                    </div>
                  );
                }

                // Retrieve JID settings or prepare defaults
                const currentSettings = modSettings.find(item => item.Group_JID === g.jid) || {
                  Group_JID: g.jid,
                  User_ID: client.User_ID,
                  Enable_Default_Filter: false,
                  Custom_Keywords: '',
                  Matching_Mode: 'fuzzy',
                  Max_Warn: 3,
                  Punishment_Action: 'kick',
                  Warn_Decay_Hours: 24
                };

                const isSavingThis = savingModId === g.jid;

                return (
                  <div key={g.jid} className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#000000] space-y-5">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
                      <div>
                        <div className="text-sm font-black text-zinc-950">Group {g.index} Moderation</div>
                        <div className="text-[9px] text-zinc-400 font-mono mt-0.5">{g.jid}</div>
                      </div>
                      <span className="bg-zinc-100 border border-zinc-200 text-zinc-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    </div>

                    {/* Filter Option 1: Default Filter Toggle */}
                    <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-zinc-950">Default Toxic Filter</div>
                        <div className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                          Deteksi kata kasar bahasa Indonesia/Inggris standar secara otomatis.
                        </div>
                      </div>
                      
                      <div
                        className={`custom-toggle-track ${currentSettings.Enable_Default_Filter ? 'active' : ''} shrink-0`}
                        onClick={() => {
                          const val = !currentSettings.Enable_Default_Filter;
                          handleSaveModSettings(g.jid, { Enable_Default_Filter: val });
                        }}
                      >
                        <div className="custom-toggle-thumb" />
                      </div>
                    </div>

                    {/* Filter Option 2: Custom Keywords */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block ml-1">
                        Custom Keywords
                      </label>
                      <input
                        type="text"
                        placeholder="crypto, s.id/, judi, slot, bokep"
                        value={currentSettings.Custom_Keywords}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModSettings(prev => prev.map(item => item.Group_JID === g.jid ? { ...item, Custom_Keywords: val } : item));
                        }}
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-zinc-950 transition-all placeholder:text-zinc-400"
                      />
                      <p className="text-[9px] text-zinc-400 font-semibold ml-1 leading-relaxed">
                        Ketik kata yang dilarang dipisahkan dengan tanda koma (`,`).
                      </p>
                    </div>

                    {/* Settings parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      
                      {/* Matching Mode */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold ml-1">Matching Mode</label>
                        <select
                          value={currentSettings.Matching_Mode}
                          onChange={(e) => {
                            const val = e.target.value as 'fuzzy' | 'exact';
                            handleSaveModSettings(g.jid, { Matching_Mode: val });
                          }}
                          className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950 outline-none focus:border-zinc-950"
                        >
                          <option value="fuzzy">Fuzzy (Anti-Bypass)</option>
                          <option value="exact">Exact (Sama Persis)</option>
                        </select>
                      </div>

                      {/* Max Warning */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold ml-1">Max Warnings</label>
                        <select
                          value={currentSettings.Max_Warn}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleSaveModSettings(g.jid, { Max_Warn: val });
                          }}
                          className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950 outline-none focus:border-zinc-950"
                        >
                          {[1, 2, 3, 5, 10].map(wNum => (
                            <option key={wNum} value={wNum}>{wNum} Warns</option>
                          ))}
                        </select>
                      </div>

                      {/* Punishment */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold ml-1">Punishment</label>
                        <select
                          value={currentSettings.Punishment_Action}
                          onChange={(e) => {
                            const val = e.target.value as 'kick' | 'ban' | 'mute';
                            handleSaveModSettings(g.jid, { Punishment_Action: val });
                          }}
                          className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950 outline-none focus:border-zinc-950"
                        >
                          <option value="kick">Kick from Group</option>
                          <option value="ban">Ban & Blacklist</option>
                          <option value="mute">Mute (24 Hours)</option>
                        </select>
                      </div>

                      {/* Decay Hours */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold ml-1">Warn Decay Time</label>
                        <select
                          value={currentSettings.Warn_Decay_Hours}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleSaveModSettings(g.jid, { Warn_Decay_Hours: val });
                          }}
                          className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-950 outline-none focus:border-zinc-950"
                        >
                          <option value="12">12 Hours</option>
                          <option value="24">24 Hours</option>
                          <option value="48">48 Hours</option>
                          <option value="72">72 Hours (3 Days)</option>
                        </select>
                      </div>

                    </div>

                    {/* Manual Custom Keyword Save Trigger */}
                    <div className="flex justify-end pt-3 border-t border-zinc-200/40">
                      <button
                        onClick={() => handleSaveModSettings(g.jid, { Custom_Keywords: currentSettings.Custom_Keywords })}
                        disabled={isSavingThis}
                        className="px-5 py-2 bg-zinc-950 hover:bg-zinc-900 text-white font-bold rounded-full text-[11px] shadow-sm transition-all cursor-pointer"
                      >
                        {isSavingThis ? 'Saving...' : 'Save Custom Keywords'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Local style overrides for switches */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-toggle-track {
          width: 40px;
          height: 22px;
          background-color: #e4e4e7;
          border-radius: 9999px;
          padding: 2px;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
          border: 1.5px solid #09090b;
        }
        .custom-toggle-track.active {
          background-color: #09090b;
        }
        .custom-toggle-thumb {
          width: 15px;
          height: 15px;
          background-color: #ffffff;
          border-radius: 9999px;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .custom-toggle-track.active .custom-toggle-thumb {
          transform: translateX(18px);
          background-color: #ffffff;
        }
      `}} />

      {toastElement}
    </div>
  );
}
