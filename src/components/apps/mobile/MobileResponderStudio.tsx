'use client';
import { useState, useRef } from 'react';
import type { AutoResponder, ClientRegistry, FileEntry } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { toast } from '@/components/DynamicIsland';
import { motion, AnimatePresence } from 'framer-motion';

interface ResponderStudioProps {
  client: ClientRegistry;
  responders: AutoResponder[];
  files: FileEntry[];
  apiBase: string;
  onAdd: (data: Partial<AutoResponder>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<AutoResponder>) => void;
}

export default function MobileResponderStudio({ client, responders, files, apiBase, onAdd, onDelete }: ResponderStudioProps) {
  const { t } = useLanguage();
  const [newKeyword, setNewKeyword] = useState('');
  const [newMatchType, setNewMatchType] = useState<'Exact' | 'Contains'>('Exact');
  const [newTargetGroup, setNewTargetGroup] = useState('All');
  const [newResponse, setNewResponse] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewResponse(val);
    
    const lastAtPos = val.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const query = val.slice(lastAtPos + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        setShowMentionMenu(true);
        setMentionQuery(query.toLowerCase());
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const handleSelectImage = (f: FileEntry) => {
    const lastAtPos = newResponse.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const fullUrl = f.id ? `https://drive.google.com/uc?export=view&id=${f.id}` : f.url.startsWith('http') ? f.url : `${apiBase}${f.url}`;
      const updated = newResponse.slice(0, lastAtPos) + fullUrl + ' ';
      setNewResponse(updated);
    }
    setShowMentionMenu(false);
  };
  
  const filteredFiles = files?.filter(f => f.filename?.toLowerCase().includes(mentionQuery) && ['jpg','jpeg','png','gif','webp'].includes(f.filename?.split('.').pop()?.toLowerCase() || '')) || [];

  const tier = client.Package_Tier;
  const maxResponders = (tier === 'God' || tier === 'Premium') ? 100 : (tier === 'Standard' || tier === 'Standart') ? 25 : 5;
  const isFull = responders.length >= maxResponders;
  const maxGroups = (tier === 'Premium' || tier === 'God') ? 5 : (tier === 'Standard' || tier === 'Standart') ? 2 : 1;

  const targetOptions = ['All', ...Array.from({length: maxGroups}, (_, i) => `Group_${i + 1}`)];

  // Dragging States for Match Type
  const [isDraggingMatch, setIsDraggingMatch] = useState(false);
  const dragMatchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDownMatch = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragMatchTimerRef.current = setTimeout(() => {
      setIsDraggingMatch(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }, 250);
  };

  const handlePointerMoveMatch = (e: React.PointerEvent) => {
    if (!isDraggingMatch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const tabWidth = rect.width / 2;
    const index = Math.max(0, Math.min(Math.floor(x / tabWidth), 1));
    const newVal = index === 0 ? 'Exact' : 'Contains';
    if (newMatchType !== newVal) {
      setNewMatchType(newVal);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
    }
  };

  const handlePointerUpMatch = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (dragMatchTimerRef.current) clearTimeout(dragMatchTimerRef.current);
    setIsDraggingMatch(false);
  };

  // Dragging States for Target Group
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const dragTargetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDownTarget = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragTargetTimerRef.current = setTimeout(() => {
      setIsDraggingTarget(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }, 250);
  };

  const handlePointerMoveTarget = (e: React.PointerEvent) => {
    if (!isDraggingTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const tabWidth = rect.width / targetOptions.length;
    const index = Math.max(0, Math.min(Math.floor(x / tabWidth), targetOptions.length - 1));
    const newVal = targetOptions[index];
    if (newTargetGroup !== newVal) {
      setNewTargetGroup(newVal);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
    }
  };

  const handlePointerUpTarget = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (dragTargetTimerRef.current) clearTimeout(dragTargetTimerRef.current);
    setIsDraggingTarget(false);
  };

  const handleAdd = async () => {
    if (!newKeyword || !newResponse) return;
    setSaving(true);
    const form: Partial<AutoResponder> = {
      Keyword: newKeyword,
      Payload_Data: newResponse,
      Match_Type: newMatchType,
      Response_Type: 'Text',
      Target_Groups: newTargetGroup === 'All' ? 'All' : [newTargetGroup]
    };
    try {
      await onAdd(form);
      toast(t('toast_responder_added'), 'success');
      
      setNewKeyword('');
      setNewMatchType('Exact');
      setNewTargetGroup('All');
      setNewResponse('');
      setShowAdd(false);
    } catch (e) {
      toast(t('toast_responder_failed'), 'error');
    }
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast(t('toast_responder_deleted'), 'success');
  };

  return (
    <div className="flex flex-col h-full bg-[#111113]">
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400">forum</span>
              {t('auto_responders')}
            </h2>
            <div className="text-xs text-white/50 mt-1">
              {responders.length} / {maxResponders} {t('used')}
            </div>
          </div>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            disabled={isFull && !showAdd}
            className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:grayscale transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">{showAdd ? 'close' : 'add'}</span>
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg mb-6 animate-in slide-in-from-top-4">
            <h3 className="font-bold text-white mb-4">{t('create_new_response')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">{t('keyword_label')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">key</span>
                  <input 
                    type="text" 
                    value={newKeyword} 
                    onChange={e => setNewKeyword(e.target.value)} 
                    placeholder={t('example_ping')} 
                    className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500 transition-colors" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">{t('match_type_label')}</label>
                <div 
                  className={`relative flex bg-black/40 border border-white/10 p-1 rounded-full w-full select-none ${isDraggingMatch ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{ touchAction: 'none' }}
                  onPointerDown={handlePointerDownMatch}
                  onPointerMove={handlePointerMoveMatch}
                  onPointerUp={handlePointerUpMatch}
                  onPointerCancel={handlePointerUpMatch}
                  onPointerLeave={handlePointerUpMatch}
                >
                  <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${newMatchType === 'Contains' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'}`}
                  ></div>
                  
                  <button
                    type="button"
                    onClick={() => setNewMatchType('Exact')}
                    className={`relative z-10 flex-1 py-3 text-sm font-bold transition-colors duration-300 ${newMatchType === 'Exact' ? 'text-black' : 'text-white/50 hover:text-white'}`}
                  >
                    {t('exact')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMatchType('Contains')}
                    className={`relative z-10 flex-1 py-3 text-sm font-bold transition-colors duration-300 ${newMatchType === 'Contains' ? 'text-black' : 'text-white/50 hover:text-white'}`}
                  >
                    {t('contains')}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Target Group</label>
                <div 
                  className={`relative flex bg-black/40 border border-white/10 p-1 rounded-full w-full select-none ${isDraggingTarget ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{ touchAction: 'none' }}
                  onPointerDown={handlePointerDownTarget}
                  onPointerMove={handlePointerMoveTarget}
                  onPointerUp={handlePointerUpTarget}
                  onPointerCancel={handlePointerUpTarget}
                  onPointerLeave={handlePointerUpTarget}
                >
                  {targetOptions.map(target => (
                    <motion.button
                      key={target}
                      type="button"
                      onClick={() => setNewTargetGroup(target)}
                      whileTap={{
                        scale: [1, 1.1, 0.95, 1.05, 0.98, 1],
                        transition: { duration: 0.4 }
                      }}
                      className={`relative z-10 flex-1 py-3 text-sm font-bold transition-colors duration-300 ${newTargetGroup === target ? 'text-black' : 'text-white/50 hover:text-white'}`}
                    >
                      {newTargetGroup === target && (
                        <motion.div
                          layoutId="targetGroupSliderBg"
                          className="absolute inset-0 bg-white rounded-full shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          style={{ zIndex: -1 }}
                        />
                      )}
                      {target === 'All' ? 'Semua' : target.replace('Group_', '')}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">{t('bot_reply_label')}</label>
                <div className="relative">
                  <textarea 
                    value={newResponse} 
                    onChange={handleResponseChange} 
                    placeholder={t('example_pong')} 
                    className="w-full h-24 p-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-500 transition-colors resize-none relative z-10" 
                  />
                  {showMentionMenu && files?.length > 0 && (
                    <div className="absolute left-0 right-0 bottom-[calc(100%+8px)] bg-[#1a1a1c] rounded-xl border border-purple-500/50 shadow-[0_10px_40px_rgba(168,85,247,0.2)] z-50 max-h-48 overflow-y-auto">
                      {filteredFiles.length === 0 ? (
                        <div className="p-3 text-xs text-white/50 text-center">No matching images</div>
                      ) : (
                        filteredFiles.map(f => (
                          <div 
                            key={f.filename} 
                            onClick={() => handleSelectImage(f)}
                            className="flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/5 active:bg-white/10 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-purple-400 text-xl">image</span>
                            <div className="text-sm text-white truncate flex-1">{f.filename}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-purple-400/70 mt-2 flex items-center gap-1 font-medium bg-purple-500/10 inline-flex px-2 py-1 rounded-md">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  {t('mention_hint') || 'Gunakan @ untuk menggunakan gambar'}
                </div>
              </div>
              <button 
                onClick={handleAdd} 
                disabled={saving || !newKeyword || !newResponse}
                className="w-full py-4 rounded-full bg-purple-500 text-white font-bold text-lg flex items-center justify-center gap-2 mt-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:shadow-none"
              >
                <span className="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
                {saving ? t('saving') : t('save_auto_response')}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-4">
          {responders.length === 0 ? (
            <div className="text-center p-12 text-white/40">
              <span className="material-symbols-outlined text-6xl opacity-50 mb-4 block">speaker_notes_off</span>
              {t('no_auto_responders')}
            </div>
          ) : (
            responders.map(r => (
              <div key={r.Response_ID} className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2 font-mono font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg">
                    <span className="material-symbols-outlined text-base">key</span>
                    {r.Keyword}
                  </div>
                  <div className="bg-white/10 px-2 py-1 rounded text-xs text-white/70 font-bold">
                    {r.Target_Groups === 'All' ? 'Semua' : Array.isArray(r.Target_Groups) ? r.Target_Groups.map(g => g.replace('Group_', '')).join(', ') : 'Semua'}
                  </div>
                </div>
                
                <div className="text-white/80 text-sm whitespace-pre-wrap flex-1 mb-4 select-text">
                  {r.Payload_Data}
                </div>

                <div className="flex justify-between items-center mt-auto pt-2">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">{r.Match_Type} • {r.Response_Type}</span>
                  <button 
                    onClick={() => handleDelete(r.Response_ID)} 
                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold flex items-center gap-2 hover:bg-red-500/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span> {t('delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
