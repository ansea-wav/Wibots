'use client';
import { useState } from 'react';
import type { AutoResponder, ClientRegistry, FileEntry } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useLanguage } from '@/lib/LanguageContext';

interface ResponderStudioProps {
  client: ClientRegistry;
  responders: AutoResponder[];
  files: FileEntry[];
  apiBase: string;
  onAdd: (data: Partial<AutoResponder>) => void;
  onDelete: (responseId: string) => void;
  onUpdate: (responseId: string, data: Partial<AutoResponder>) => void;
}

const parseTargetGroups = (tg: any): string[] | 'All' => {
  if (!tg || tg === 'All' || tg === 'Semua') return 'All';
  if (Array.isArray(tg)) return tg;
  if (typeof tg === 'string') {
    const parts = (tg || '').split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0 || parts.includes('All') || parts.includes('Semua')) return 'All';
    return parts;
  }
  return 'All';
};

export default function ResponderStudioApp({ client, responders, files, apiBase, onAdd, onDelete, onUpdate }: ResponderStudioProps) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AutoResponder>>({
    Keyword: '',
    Match_Type: 'Exact',
    Response_Type: 'Text',
    Payload_Data: '',
    Target_Groups: 'All',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast, toastElement } = useToast();
  const { t } = useLanguage();

  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  const handlePayloadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm({ ...form, Payload_Data: val });
    
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
    const lastAtPos = (form.Payload_Data || '').lastIndexOf('@');
    if (lastAtPos !== -1) {
      const fullUrl = f.id ? `https://drive.google.com/uc?export=view&id=${f.id}` : f.url.startsWith('http') ? f.url : `${apiBase}${f.url}`;
      const updated = (form.Payload_Data || '').slice(0, lastAtPos) + fullUrl + ' ';
      setForm({ ...form, Payload_Data: updated });
    }
    setShowMentionMenu(false);
  };

  const filteredFiles = files?.filter(f => f.filename?.toLowerCase().includes(mentionQuery) && ['jpg','jpeg','png','gif','webp'].includes(f.filename?.split('.').pop()?.toLowerCase() || '')) || [];

  const resetForm = () => {
    setForm({ Keyword: '', Match_Type: 'Exact', Response_Type: 'Text', Payload_Data: '', Target_Groups: 'All' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.Keyword || !form.Payload_Data) return;
    try {
      if (editId) {
        await onUpdate(editId, form);
        showToast(t('toast_responder_updated'), 'success');
      } else {
        await onAdd(form);
        showToast(t('toast_responder_added'), 'success');
      }
      resetForm();
    } catch (e) {
      showToast(t('toast_responder_failed'), 'error');
    }
  };

  const handleEdit = (r: AutoResponder) => {
    setForm({
      Keyword: r.Keyword,
      Match_Type: r.Match_Type,
      Response_Type: r.Response_Type,
      Payload_Data: r.Payload_Data,
      Target_Groups: parseTargetGroups(r.Target_Groups),
    });
    setEditId(r.Response_ID);
    setShowForm(true);
  };

  const filtered = responders.filter(r =>
    (r.Keyword || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.Payload_Data || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeIcon = (type: string) =>
    type === 'Text' ? '📝' : type === 'Image' ? '🖼️' : '📄';

  const availableGroups = [];
  if (client.Group_1) availableGroups.push('1');
  if (client.Group_2) availableGroups.push('2');
  if (client.Group_3) availableGroups.push('3');
  if (client.Group_4) availableGroups.push('4');
  if (client.Group_5) availableGroups.push('5');

  const tier = client.Package_Tier;
  const showTargetSelection = tier !== 'Basic' && availableGroups.length >= 2;

  const handleTargetToggle = (target: string) => {
    if (target === 'All') {
      setForm({ ...form, Target_Groups: 'All' });
      return;
    }
    
    const normalized = parseTargetGroups(form.Target_Groups);
    let currentTargets = Array.isArray(normalized) ? [...normalized] : [];
    
    if ((tier === 'Standard' || tier === 'Standart')) {
      setForm({ ...form, Target_Groups: [target] });
      return;
    }

    if (currentTargets.includes(target)) {
      currentTargets = currentTargets.filter(t => t !== target);
      if (currentTargets.length === 0) setForm({ ...form, Target_Groups: 'All' });
      else setForm({ ...form, Target_Groups: currentTargets });
    } else {
      currentTargets.push(target);
      setForm({ ...form, Target_Groups: currentTargets });
    }
  };

  const currentFormTargetGroups = parseTargetGroups(form.Target_Groups);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      
      {/* Main Table Card */}
      <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-400 uppercase tracking-widest font-black mb-1">
              Keyword Responders
            </div>
            <p className="text-[11px] text-zinc-500 font-semibold">
              {responders.length} keyword rules configured
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-zinc-50 border border-zinc-300 rounded-full px-4 py-1.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 placeholder:text-zinc-400 transition-all"
            />
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                showForm 
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200' 
                  : 'bg-zinc-950 hover:bg-zinc-900 text-white border-zinc-800'
              }`}
            >
              {showForm ? '✕ Cancel' : '+ Add Rule'}
            </button>
          </div>
        </div>

        {/* Add/Edit Form inside Card */}
        {showForm && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1 ml-1">Keyword</label>
                <input
                  type="text"
                  value={form.Keyword || ''}
                  onChange={e => setForm({ ...form, Keyword: e.target.value })}
                  className="w-full bg-white border border-zinc-300 rounded-2xl px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 transition-all"
                  placeholder="e.g. /pricelist"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1 ml-1">Match Type</label>
                <select
                  value={form.Match_Type || 'Exact'}
                  onChange={e => setForm({ ...form, Match_Type: e.target.value as 'Exact' | 'Contains' })}
                  className="w-full bg-white border border-zinc-300 rounded-2xl px-4 py-2.5 text-xs text-zinc-950 outline-none cursor-pointer"
                >
                  <option value="Exact">Exact Match</option>
                  <option value="Contains">Contains Match</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1.5 ml-1">Response Type</label>
              <div className="flex gap-2">
                {(['Text', 'Image', 'Document'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, Response_Type: type })}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                      form.Response_Type === type 
                        ? 'bg-zinc-950 border-zinc-800 text-white' 
                        : 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    {typeIcon(type)} {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1 ml-1">
                {form.Response_Type === 'Text' ? 'Response Text' : 'File URL / Path'}
              </label>
              <div className="relative">
                <textarea
                  value={form.Payload_Data || ''}
                  onChange={handlePayloadChange}
                  rows={3}
                  className="w-full bg-white border border-zinc-300 rounded-2xl px-4 py-3 text-zinc-950 text-xs outline-none focus:border-zinc-950 transition-all resize-none relative z-10"
                  placeholder={form.Response_Type === 'Text' ? 'Bot response message...' : 'https://example.com/file.jpg'}
                />
                {showMentionMenu && files?.length > 0 && (
                  <div className="absolute left-0 right-0 bottom-[calc(100%+8px)] bg-white rounded-2xl border border-zinc-300 shadow-lg z-50 max-h-40 overflow-y-auto p-2">
                    {filteredFiles.length === 0 ? (
                      <div className="p-2 text-[10px] text-zinc-400 text-center font-bold">No matching images</div>
                    ) : (
                      filteredFiles.map(f => (
                        <div 
                          key={f.filename} 
                          onClick={() => handleSelectImage(f)}
                          className="flex items-center gap-2 p-2.5 border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer"
                        >
                          <span className="text-xs">🖼️</span>
                          <div className="text-[11px] text-zinc-850 font-bold truncate flex-1">{f.filename}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1 ml-1">
                <span className="text-[11px]">ℹ️</span>
                {t('mention_hint') || 'Gunakan @ untuk menyisipkan gambar dari storage'}
              </div>
            </div>

            {showTargetSelection && (
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1.5 ml-1">Target Groups</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleTargetToggle('All')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                      currentFormTargetGroups === 'All' 
                        ? 'bg-zinc-950 border-zinc-800 text-white' 
                        : 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    Semua
                  </button>
                  {availableGroups.map(g => {
                    const isSelected = currentFormTargetGroups !== 'All' && currentFormTargetGroups?.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => handleTargetToggle(g)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-950 border-zinc-800 text-white' 
                            : 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50'
                        }`}
                      >
                        Grup {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full py-2.5 rounded-full text-xs font-bold bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-sm cursor-pointer"
            >
              {editId ? '✓ Update Rule' : '+ Add Rule'}
            </button>
          </div>
        )}

        {/* Table inside Card */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3 opacity-30">📭</div>
              <div className="text-sm font-bold text-zinc-400">No keyword rules found</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Click &quot;+ Add Rule&quot; to create your first auto-responder.</div>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/60 text-[10px] text-zinc-400 uppercase tracking-widest font-black bg-zinc-50/50">
                  <th className="px-4 py-3">Keyword</th>
                  <th className="px-4 py-3">Match</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Response</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.Response_ID} className="border-b border-zinc-200/30 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <code className="bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded text-zinc-900 font-mono text-[11px] font-bold">{r.Keyword}</code>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        r.Match_Type === 'Exact' 
                          ? 'bg-zinc-150 text-zinc-800 border-zinc-250' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {r.Match_Type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-zinc-805">
                      <span>{typeIcon(r.Response_Type)} {r.Response_Type}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[10px] text-zinc-500 font-semibold">
                      {(() => {
                        const tg = parseTargetGroups(r.Target_Groups);
                        return tg === 'All' ? 'Semua' : `Grup ${tg.join(', ')}`;
                      })()}
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="text-zinc-500 truncate select-text">{r.Payload_Data}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleEdit(r)}
                          className="text-[11px] font-bold text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { onDelete(r.Response_ID); showToast(t('toast_responder_deleted'), 'success'); }}
                          className="px-2.5 py-1 rounded-full bg-zinc-105 hover:bg-rose-50 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 text-[10px] text-zinc-500 font-bold transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toastElement}
    </div>
  );
}
