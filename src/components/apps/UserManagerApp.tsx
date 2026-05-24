'use client';
import { useState, useEffect } from 'react';
import type { ClientRegistry } from '@/lib/api';

interface UserManagerAppProps {
  apiBase: string;
}

export default function UserManagerApp({ apiBase }: UserManagerAppProps) {
  const [clients, setClients] = useState<ClientRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhone, setNewPhone] = useState('');
  const [newTier, setNewTier] = useState('Basic');
  const [newDays, setNewDays] = useState('30');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { apiGetClients } = await import('@/lib/api');
      const res = await apiGetClients();
      if (res.status === 'success') {
        setClients(res.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newPhone) return;
    try {
      const { apiAddClient } = await import('@/lib/api');
      await apiAddClient(newPhone, newTier, Number(newDays));
      setNewPhone('');
      fetchClients();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user completely?')) return;
    try {
      const { apiDeleteClient } = await import('@/lib/api');
      await apiDeleteClient(id);
      fetchClients();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col" style={{ background: 'var(--surface-panel)' }}>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">User Management</h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Add, edit, or remove bot clients</p>
      </div>

      {/* Add User Form */}
      <div className="p-4 rounded-xl border border-[var(--border-subtle)] mb-6 flex gap-3 items-end" style={{ background: 'var(--surface-glass)' }}>
        <div className="flex-1">
          <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block mb-1">WhatsApp No.</label>
          <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="62812345678" className="w-full bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--neon-green)]" />
        </div>
        <div className="w-32">
          <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block mb-1">Tier</label>
          <select value={newTier} onChange={e => setNewTier(e.target.value)} className="w-full bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--neon-green)]">
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
        <div className="w-24">
          <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block mb-1">Days</label>
          <input type="number" value={newDays} onChange={e => setNewDays(e.target.value)} className="w-full bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--neon-green)]" />
        </div>
        <button onClick={handleAdd} className="px-4 py-2 bg-[var(--neon-green)]/20 text-[var(--neon-green)] border border-[var(--neon-green)]/30 rounded-lg text-sm font-bold hover:bg-[var(--neon-green)]/30 transition-all">
          + Add User
        </button>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="text-center text-[var(--text-tertiary)] text-sm py-10">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="text-center text-[var(--text-tertiary)] text-sm py-10">No clients found.</div>
        ) : (
          clients.map(client => (
            <div key={client.User_ID} className="p-3 rounded-xl border border-[var(--border-subtle)] flex items-center justify-between" style={{ background: 'var(--surface-glass)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{client.User_ID}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-secondary)]">{client.Package_Tier}</span>
                  {client.Account_Status === 'Active' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--neon-green)]/20 text-[var(--neon-green)]">ACTIVE</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--neon-red)]/20 text-[var(--neon-red)]">{client.Account_Status}</span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                  📞 +{client.WhatsApp_Owner} • 🔑 {client.License_Key} • ⏳ {client.Days_Left} days left
                </div>
              </div>
              {client.Package_Tier !== 'God' && (
                <button onClick={() => handleDelete(client.User_ID)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--neon-red)] bg-[var(--neon-red)]/10 hover:bg-[var(--neon-red)]/20 transition-all">
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
