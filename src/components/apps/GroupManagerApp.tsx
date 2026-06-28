'use client';
import { useState, useEffect, useRef } from 'react';
import { apiGetGroupSettings, apiUpdateGroupSettings, type ClientRegistry, type GroupSettings } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useLanguage } from '@/lib/LanguageContext';
import { toast } from '@/components/DynamicIsland';

interface GroupManagerProps {
  client: ClientRegistry;
  onUpdate: (data: Partial<ClientRegistry>) => Promise<void>;
}

interface SelectOption {
  value: string | number;
  label: string;
}

function CustomSelect({
  value,
  options,
  onChange
}: {
  value: string | number;
  options: SelectOption[];
  onChange: (val: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#fdfcf7] border-2 border-zinc-950 rounded-2xl px-4 py-2.5 text-xs font-bold text-zinc-950 flex justify-between items-center transition-all shadow-sm outline-none cursor-pointer"
      >
        <span>{selectedOption?.label}</span>
        <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 bg-[#fdfcf7] border-2 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_#000000] overflow-hidden py-1 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors block cursor-pointer ${
                opt.value === value
                  ? 'bg-zinc-950 text-white font-black'
                  : 'text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://chat.whatsapp.com/..."
                    value={groups[groupKey]}
                    disabled={isLocked}
                    onChange={(e) => setGroups({ ...groups, [groupKey]: e.target.value })}
                    className="flex-1 bg-[#fdfcf7] border-2 border-zinc-950 rounded-2xl px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-zinc-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                  />
                  
                  {tier !== 'Basic' && (
                    <button
                      onClick={() => setGroups({ ...groups, [groupKey]: '' })}
                      className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-2xl text-xs transition-colors border-2 border-zinc-950 shrink-0 cursor-pointer"
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
                const groupJid = g.jid;
                if (!groupJid) {
                  return (
                    <div key={g.index} className="bg-[#fdfcf7] border-2 border-dashed border-zinc-400 rounded-3xl p-5 text-center text-zinc-400 text-xs font-semibold">
                      ⚙️ Group {g.index} belum disinkronisasikan. Bot harus membaca chat grup terlebih dahulu agar JID terdeteksi.
                    </div>
                  );
                }

                // Retrieve JID settings or prepare defaults
                const currentSettings = modSettings.find(item => item.Group_JID === groupJid) || {
                  Group_JID: groupJid,
                  User_ID: client.User_ID,
                  Enable_Default_Filter: false,
                  Custom_Keywords: '',
                  Matching_Mode: 'fuzzy',
                  Max_Warn: 3,
                  Punishment_Action: 'kick',
                  Warn_Decay_Hours: 24
                } as GroupSettings;

                const isSavingThis = savingModId === groupJid;

                return (
                  <div key={groupJid} className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#000000] space-y-6">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
                      <div>
                        <div className="text-sm font-black text-zinc-950">Group {g.index} Moderation</div>
                        <div className="text-[9px] text-zinc-400 font-mono mt-0.5">{groupJid}</div>
                      </div>
                      <span className="bg-zinc-100 border-2 border-zinc-950 text-zinc-950 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    </div>

                    {/* Filter Option 1: Default Filter Toggle */}
                    <div className="flex items-center justify-between bg-zinc-50 border-2 border-zinc-950 rounded-2xl p-4">
                      <div className="space-y-0.5 pr-2">
                        <div className="text-xs font-black text-zinc-950">Default Toxic Filter</div>
                        <div className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                          Deteksi kata kasar bahasa Indonesia/Inggris standar secara otomatis.
                        </div>
                      </div>
                      
                      <div
                        className={`custom-toggle-track ${currentSettings.Enable_Default_Filter ? 'active' : ''} shrink-0`}
                        onClick={() => {
                          const val = !currentSettings.Enable_Default_Filter;
                          handleSaveModSettings(groupJid, { Enable_Default_Filter: val });
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
                          setModSettings(prev => prev.map(item => item.Group_JID === groupJid ? { ...item, Custom_Keywords: val } : item));
                        }}
                        className="w-full bg-[#fdfcf7] border-2 border-zinc-950 rounded-2xl px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-zinc-950 transition-all placeholder:text-zinc-400"
                      />
                      <p className="text-[9px] text-zinc-400 font-semibold ml-1 leading-relaxed">
                        Ketik kata yang dilarang dipisahkan dengan tanda koma (`,`).
                      </p>
                    </div>

                    {/* Settings List Section */}
                    <div className="space-y-4 pt-2">
                      
                      {/* Row 1: Matching Mode */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-50/50 border-2 border-zinc-950 rounded-2xl">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-zinc-950">Matching Mode</div>
                          <div className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                            Fuzzy mencegah bypass kata kotor (misal: 4nj1ng). Exact mencocokkan kata mentah.
                          </div>
                        </div>
                        <div className="w-full sm:w-56 shrink-0">
                          <CustomSelect
                            value={currentSettings.Matching_Mode}
                            options={[
                              { value: 'fuzzy', label: 'Fuzzy (Anti-Bypass)' },
                              { value: 'exact', label: 'Exact (Sama Persis)' }
                            ]}
                            onChange={(val) => handleSaveModSettings(groupJid, { Matching_Mode: val })}
                          />
                        </div>
                      </div>

                      {/* Row 2: Max Warnings */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-50/50 border-2 border-zinc-950 rounded-2xl">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-zinc-950">Max Warnings</div>
                          <div className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                            Batas akumulasi peringatan pelanggaran sebelum hukuman dieksekusi.
                          </div>
                        </div>
                        <div className="w-full sm:w-56 shrink-0">
                          <CustomSelect
                            value={currentSettings.Max_Warn}
                            options={[
                              { value: 1, label: '1 Warn' },
                              { value: 2, label: '2 Warns' },
                              { value: 3, label: '3 Warns' },
                              { value: 5, label: '5 Warns' },
                              { value: 10, label: '10 Warns' }
                            ]}
                            onChange={(val) => handleSaveModSettings(groupJid, { Max_Warn: val })}
                          />
                        </div>
                      </div>

                      {/* Row 3: Punishment */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-50/50 border-2 border-zinc-950 rounded-2xl">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-zinc-950">Punishment Action</div>
                          <div className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                            Tindakan otomatis yang diambil setelah melewati batas peringatan.
                          </div>
                        </div>
                        <div className="w-full sm:w-56 shrink-0">
                          <CustomSelect
                            value={currentSettings.Punishment_Action}
                            options={[
                              { value: 'kick', label: 'Kick from Group' },
                              { value: 'ban', label: 'Ban & Blacklist' },
                              { value: 'mute', label: 'Mute (24 Hours)' }
                            ]}
                            onChange={(val) => handleSaveModSettings(groupJid, { Punishment_Action: val })}
                          />
                        </div>
                      </div>

                      {/* Row 4: Decay Hours */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-50/50 border-2 border-zinc-950 rounded-2xl">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-zinc-950">Warn Decay Time</div>
                          <div className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                            Waktu tobat kedaluwarsa. Jumlah warn berkurang 1 jika tidak melanggar lagi.
                          </div>
                        </div>
                        <div className="w-full sm:w-56 shrink-0">
                          <CustomSelect
                            value={currentSettings.Warn_Decay_Hours}
                            options={[
                              { value: 12, label: '12 Hours' },
                              { value: 24, label: '24 Hours' },
                              { value: 48, label: '48 Hours' },
                              { value: 72, label: '72 Hours (3 Days)' }
                            ]}
                            onChange={(val) => handleSaveModSettings(groupJid, { Warn_Decay_Hours: val })}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Manual Custom Keyword Save Trigger */}
                    <div className="flex justify-end pt-3 border-t border-zinc-200/40">
                      <button
                        onClick={() => handleSaveModSettings(groupJid, { Custom_Keywords: currentSettings.Custom_Keywords })}
                        disabled={isSavingThis}
                        className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold rounded-full text-xs shadow-sm transition-all cursor-pointer border-2 border-zinc-950"
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
          border: 2px solid #09090b;
        }
        .custom-toggle-track.active {
          background-color: #09090b;
        }
        .custom-toggle-thumb {
          width: 14px;
          height: 14px;
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
