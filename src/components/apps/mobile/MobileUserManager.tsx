'use client';
import { useState, useEffect } from 'react';
import type { ClientRegistry } from '@/lib/api';

interface UserManagerAppProps {
  apiBase: string;
}

export default function MobileUserManager({ apiBase }: UserManagerAppProps) {
  const [clients, setClients] = useState<ClientRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhone, setNewPhone] = useState('');
  const [newTier, setNewTier] = useState('Basic');
  const [newDays, setNewDays] = useState('30');
  const [showAdd, setShowAdd] = useState(false);

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
      setShowAdd(false);
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
    <div className="flex flex-col h-full bg-[#111113]">
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-400">admin_panel_settings</span>
            Users
          </h2>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center"
          >
            <span className="material-symbols-outlined">{showAdd ? 'close' : 'person_add'}</span>
          </button>
        </div>

        {/* Add User Form (Collapsible) */}
        {showAdd && (
          <div className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg mb-6 animate-in slide-in-from-top-4">
            <h3 className="font-bold text-white mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">WhatsApp No.</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">call</span>
                  <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="62812345678" className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Tier</label>
                  <select value={newTier} onChange={e => setNewTier(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-orange-500 appearance-none">
                    <option value="Basic">Basic</option>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Days</label>
                  <input type="number" value={newDays} onChange={e => setNewDays(e.target.value)} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-orange-500" />
                </div>
              </div>
              <button onClick={handleAdd} className="w-full py-4 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center gap-2 mt-2">
                <span className="material-symbols-outlined">person_add</span>
                Create User
              </button>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-white/20">sync</span></div>
          ) : clients.length === 0 ? (
            <div className="text-center p-10 text-white/40">No clients found.</div>
          ) : (
            clients.map(client => (
              <div key={client.User_ID} className="bg-[#1a1a1c] p-4 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">person</span>
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">{client.User_ID}</div>
                      <div className="text-sm text-white/50">+{client.WhatsApp_Owner}</div>
                    </div>
                  </div>
                  {client.Package_Tier !== 'God' && (
                    <button onClick={() => handleDelete(client.User_ID)} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-black/30 rounded-2xl p-3">
                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Tier</div>
                    <div className="font-bold text-white text-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-orange-400">workspace_premium</span>
                      {client.Package_Tier}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-2xl p-3">
                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Status</div>
                    <div className={`font-bold text-sm flex items-center gap-1 ${client.Account_Status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {client.Account_Status === 'Active' ? 'check_circle' : 'error'}
                      </span>
                      {client.Account_Status}
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-black/30 rounded-2xl p-3 flex justify-between items-center">
                  <div className="text-xs text-white/60 font-mono flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">key</span>
                    {client.License_Key}
                  </div>
                  <div className="text-xs font-bold text-white/80 bg-white/10 px-3 py-1 rounded-full">
                    {client.Days_Left} days left
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
