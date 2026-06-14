'use client';
import { useState } from 'react';
import type { AutoResponder, ClientRegistry } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface ResponderStudioProps {
  client: ClientRegistry;
  responders: AutoResponder[];
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

export default function ResponderStudioApp({ client, responders, onAdd, onDelete, onUpdate }: ResponderStudioProps) {
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
        showToast('Responder berhasil diupdate!', 'success');
      } else {
        await onAdd(form);
        showToast('Responder berhasil ditambahkan!', 'success');
      }
      resetForm();
    } catch (e) {
      showToast('Gagal menyimpan responder.', 'error');
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

  const matchColor = (type: string) =>
    type === 'Exact' ? 'var(--neon-cyan)' : 'var(--neon-amber)';

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
    
    if (tier === 'Standard') {
      // Standard: Pilih 1 grup spesifik atau Semua
      setForm({ ...form, Target_Groups: [target] });
      return;
    }

    // Premium: Multi-select
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
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-panel)' }}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-white">Responder Studio</h2>
            <p className="text-[11px] text-[var(--text-tertiary)]">{responders.length} keyword rules configured</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: showForm ? 'rgba(255,59,92,0.15)' : 'rgba(57,255,20,0.15)',
              color: showForm ? 'var(--neon-red)' : 'var(--neon-green)',
              border: `1px solid ${showForm ? 'rgba(255,59,92,0.2)' : 'rgba(57,255,20,0.2)'}`,
            }}
          >
            {showForm ? '✕ Cancel' : '+ Add Rule'}
          </button>
        </div>
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search keywords..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--neon-green)] transition-all placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-4 border-b border-[var(--border-subtle)] space-y-3 flex-shrink-0"
          style={{ background: 'rgba(57,255,20,0.02)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Keyword</label>
              <input
                type="text"
                value={form.Keyword || ''}
                onChange={e => setForm({ ...form, Keyword: e.target.value })}
                className="w-full bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--neon-green)] transition-all"
                placeholder="e.g. /pricelist"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Match Type</label>
              <select
                value={form.Match_Type || 'Exact'}
                onChange={e => setForm({ ...form, Match_Type: e.target.value as 'Exact' | 'Contains' })}
                className="w-full bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-white text-xs outline-none cursor-pointer"
              >
                <option value="Exact">Exact Match</option>
                <option value="Contains">Contains</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Response Type</label>
            <div className="flex gap-2">
              {(['Text', 'Image', 'Document'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, Response_Type: type })}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  style={{
                    background: form.Response_Type === type ? 'rgba(57,255,20,0.15)' : 'var(--surface-input)',
                    color: form.Response_Type === type ? 'var(--neon-green)' : 'var(--text-secondary)',
                    border: `1px solid ${form.Response_Type === type ? 'rgba(57,255,20,0.3)' : 'var(--border-medium)'}`,
                  }}
                >
                  {typeIcon(type)} {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">
              {form.Response_Type === 'Text' ? 'Response Text' : 'File URL / Path'}
            </label>
            <textarea
              value={form.Payload_Data || ''}
              onChange={e => setForm({ ...form, Payload_Data: e.target.value })}
              rows={3}
              className="w-full bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--neon-green)] transition-all resize-none"
              placeholder={form.Response_Type === 'Text' ? 'Bot response message...' : 'https://example.com/file.jpg'}
            />
          </div>

          {showTargetSelection && (
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Target Groups</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTargetToggle('All')}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  style={{
                    background: currentFormTargetGroups === 'All' ? 'rgba(57,255,20,0.15)' : 'var(--surface-input)',
                    color: currentFormTargetGroups === 'All' ? 'var(--neon-green)' : 'var(--text-secondary)',
                    border: `1px solid ${currentFormTargetGroups === 'All' ? 'rgba(57,255,20,0.3)' : 'var(--border-medium)'}`,
                  }}
                >
                  Semua
                </button>
                {availableGroups.map(g => {
                  const isSelected = currentFormTargetGroups !== 'All' && currentFormTargetGroups?.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => handleTargetToggle(g)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                      style={{
                        background: isSelected ? 'rgba(57,255,20,0.15)' : 'var(--surface-input)',
                        color: isSelected ? 'var(--neon-green)' : 'var(--text-secondary)',
                        border: `1px solid ${isSelected ? 'rgba(57,255,20,0.3)' : 'var(--border-medium)'}`,
                      }}
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
            className="w-full py-2 rounded-lg text-xs font-semibold bg-[var(--neon-green)] text-black transition-all cursor-pointer hover:brightness-110"
          >
            {editId ? '✓ Update Rule' : '+ Add Rule'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-4xl mb-3 opacity-30">📭</div>
            <div className="text-sm text-[var(--text-tertiary)]">No keyword rules found</div>
            <div className="text-[10px] text-[var(--text-tertiary)] mt-1">Click &quot;+ Add Rule&quot; to create your first auto-responder</div>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                <th className="px-4 py-2.5 sticky top-0" style={{ background: 'var(--surface-panel)' }}>Keyword</th>
                <th className="px-4 py-2.5 sticky top-0" style={{ background: 'var(--surface-panel)' }}>Match</th>
                <th className="px-4 py-2.5 sticky top-0" style={{ background: 'var(--surface-panel)' }}>Type</th>
                <th className="px-4 py-2.5 sticky top-0" style={{ background: 'var(--surface-panel)' }}>Target</th>
                <th className="px-4 py-2.5 sticky top-0" style={{ background: 'var(--surface-panel)' }}>Response</th>
                <th className="px-4 py-2.5 sticky top-0 text-right" style={{ background: 'var(--surface-panel)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.Response_ID} className="border-t border-[var(--border-subtle)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <code className="bg-white/5 px-2 py-0.5 rounded text-[var(--neon-green)] font-mono">{r.Keyword}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${matchColor(r.Match_Type)}15`,
                        color: matchColor(r.Match_Type),
                        border: `1px solid ${matchColor(r.Match_Type)}30`,
                      }}>
                      {r.Match_Type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span>{typeIcon(r.Response_Type)} {r.Response_Type}</span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-[var(--text-secondary)]">
                    {(() => {
                      const tg = parseTargetGroups(r.Target_Groups);
                      return tg === 'All' ? 'Semua' : `Grup ${tg.join(', ')}`;
                    })()}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="text-[var(--text-secondary)] truncate">{r.Payload_Data}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(r)}
                        className="px-2 py-1 rounded text-[10px] text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/10 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(r.Response_ID)}
                        className="px-2 py-1 rounded text-[10px] text-[var(--neon-red)] hover:bg-[var(--neon-red)]/10 transition-colors cursor-pointer"
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
  );
}
