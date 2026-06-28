'use client';
import { useState, useEffect } from 'react';
import type { ClientRegistry } from '@/lib/api';
import { toast } from '@/components/DynamicIsland';

interface AccountingProps {
  client: ClientRegistry;
}

export default function AccountingApp({ client }: AccountingProps) {
  // Username State
  const [username, setUsername] = useState(client.Username || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Password State
  const [password, setPassword] = useState(client.Password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Email State
  const [emailInput, setEmailInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Debounced check for Username availability during rename
  useEffect(() => {
    if (!username || username === client.Username) {
      setUsernameStatus('idle');
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const { apiCheckUsername } = await import('@/lib/api');
        const res = await apiCheckUsername(username);
        if (res.status === 'taken') {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [username, client.Username]);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast('Username tidak boleh kosong!', 'error');
      return;
    }
    if (usernameStatus === 'taken') {
      toast('Username telah digunakan!', 'error');
      return;
    }
    setIsUpdatingUsername(true);
    try {
      const { apiUpdateAccount } = await import('@/lib/api');
      const res = await apiUpdateAccount(client.User_ID, { Username: username });
      if (res.status === 'success') {
        toast('Username berhasil diperbarui!', 'success');
        client.Username = username; // Update local ref
        setUsernameStatus('idle');
      } else {
        toast(res.message || 'Gagal memperbarui username.', 'error');
      }
    } catch (e) {
      toast('Koneksi API gagal.', 'error');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast('Password tidak boleh kosong!', 'error');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { apiUpdateAccount } = await import('@/lib/api');
      const res = await apiUpdateAccount(client.User_ID, { Password: password });
      if (res.status === 'success') {
        toast('Password berhasil diperbarui!', 'success');
        client.Password = password; // Update local ref
      } else {
        toast(res.message || 'Gagal memperbarui password.', 'error');
      }
    } catch (e) {
      toast('Koneksi API gagal.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      toast('Email tidak boleh kosong!', 'error');
      return;
    }
    setIsUpdatingEmail(true);
    try {
      const { apiUpdateAccount } = await import('@/lib/api');
      const res = await apiUpdateAccount(client.User_ID, { Tutorial: emailInput });
      if (res.status === 'success') {
        toast('Email berhasil diperbarui!', 'success');
        setEmailInput('');
      } else {
        toast(res.message || 'Gagal memperbarui email.', 'error');
      }
    } catch (e) {
      toast('Koneksi API gagal.', 'error');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const inboxMessages = [
    { id: 1, title: 'Server Update Success', body: 'Engine Wibots Anda telah berhasil dimigrasikan ke Premium Node v2.6.', time: '2 hours ago', unread: true },
    { id: 2, title: 'Payment Invoice #0921', body: 'Terima kasih! Pembayaran perpanjangan paket Premium Anda telah diterima dan terverifikasi.', time: '1 day ago', unread: false },
    { id: 3, title: 'Server Maintenance Notice', body: 'Akan dilakukan pemeliharaan server berkala pada tanggal 30 Juni pukul 02:00 WIB (durasi 15 menit).', time: '3 days ago', unread: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      <div className="text-xs text-zinc-400 uppercase tracking-widest font-black mb-3">
        Account Settings
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rename Username Card */}
        <div className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <form onSubmit={handleSaveUsername} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block mb-2">Rename Username</span>
                <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mb-4">Ganti nama pengguna akun panel Anda secara langsung.</p>
              </div>
              
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold flex items-center justify-between ml-1 mb-1">
                  <span>Username</span>
                  {usernameStatus === 'checking' && <span className="text-zinc-500 animate-pulse lowercase font-normal">Checking...</span>}
                  {usernameStatus === 'taken' && <span className="text-red-500 lowercase font-bold">Taken</span>}
                  {usernameStatus === 'available' && <span className="text-green-600 lowercase font-bold">Available</span>}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 transition-all font-semibold"
                  placeholder="Username"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingUsername || usernameStatus === 'taken' || usernameStatus === 'checking' || username === client.Username}
              className="w-full py-2.5 mt-4 rounded-full text-xs font-bold bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-sm cursor-pointer border border-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingUsername ? 'Saving...' : 'Rename Username'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <form onSubmit={handleSavePassword} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block mb-2">Change Password</span>
                <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mb-4">Ganti kata sandi panel login Anda secara instan.</p>
              </div>
              
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block ml-1 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-2.5 text-xs text-zinc-900 outline-none focus:border-zinc-950 transition-all font-semibold"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword || !password || password === client.Password}
              className="w-full py-2.5 mt-4 rounded-full text-xs font-bold bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-sm cursor-pointer border border-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingPassword ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Change Email / System Inbox Card */}
        <div className="bg-[#fdfcf7] border-2 border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div className="space-y-4 h-full flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block mb-2">System Inbox</span>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mb-4">Pesan masuk penting dan log sistem langsung dari server YAY.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[14rem] no-scrollbar">
              {inboxMessages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors relative">
                  {msg.unread && (
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-zinc-950"></span>
                  )}
                  <div className="text-[11px] font-black text-zinc-900">{msg.title}</div>
                  <div className="text-[9px] text-zinc-500 font-semibold mt-0.5 line-clamp-2 leading-relaxed">{msg.body}</div>
                  <div className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mt-2">{msg.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
