'use client';
import { useState } from 'react';
import type { ClientRegistry } from '@/lib/api';
import { toast } from '@/components/DynamicIsland';

interface AccountingProps {
  client: ClientRegistry;
}

export default function AccountingApp({ client }: AccountingProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast('Semua kolom password wajib diisi!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Konfirmasi password baru tidak cocok!', 'error');
      return;
    }
    toast('Password berhasil diperbarui!', 'success');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) {
      toast('Email baru wajib diisi!', 'error');
      return;
    }
    toast('Email berhasil diperbarui!', 'success');
    setCurrentEmail(newEmail);
    setNewEmail('');
  };

  const inboxMessages = [
    { id: 1, title: 'Server Update Success', body: 'Engine Wibots Anda telah berhasil dimigrasikan ke Premium Node v2.6.', time: '2 hours ago', unread: true },
    { id: 2, title: 'Payment Invoice #0921', body: 'Terima kasih! Pembayaran perpanjangan paket Premium Anda telah diterima dan terverifikasi.', time: '1 day ago', unread: false },
    { id: 3, title: 'Server Maintenance Notice', body: 'Akan dilakukan pemeliharaan server berkala pada tanggal 30 Juni pukul 02:00 WIB (durasi 15 menit).', time: '3 days ago', unread: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      <div className="text-xs text-zinc-400 uppercase tracking-widest font-black mb-3">
        Account & Inbox
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Change Password Card */}
        <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block mb-2">Change Password</span>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mb-4">Ganti kata sandi panel login Anda secara berkala.</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block ml-1 mb-1">Old Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-2 text-xs text-zinc-950 outline-none focus:border-zinc-950 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block ml-1 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-2 text-xs text-zinc-955 outline-none focus:border-zinc-950 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block ml-1 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-2 text-xs text-zinc-955 outline-none focus:border-zinc-950 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-2 rounded-full text-xs font-bold bg-zinc-955 hover:bg-zinc-900 text-white transition-all shadow-sm cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Change Email Card */}
        <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between">
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block mb-2">Change Email</span>
                <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mb-4">Ubah alamat email korespondensi dan pemulihan akun.</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block ml-1 mb-1">Current Email</label>
                  <input
                    type="email"
                    value={currentEmail}
                    onChange={e => setCurrentEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-2.5 text-xs text-zinc-955 outline-none focus:border-zinc-950 transition-all"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block ml-1 mb-1">New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-2.5 text-xs text-zinc-955 outline-none focus:border-zinc-950 transition-all"
                    placeholder="newemail@example.com"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-full text-xs font-bold bg-zinc-955 hover:bg-zinc-900 text-white transition-all shadow-sm cursor-pointer"
            >
              Update Email
            </button>
          </form>
        </div>

        {/* Inbox / Messages Card */}
        <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between">
          <div className="space-y-4 h-full flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black block mb-2">System Inbox</span>
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mb-4">Pesan masuk penting dan log sistem langsung dari server YAY.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[14rem]">
              {inboxMessages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors relative">
                  {msg.unread && (
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-zinc-950"></span>
                  )}
                  <div className="text-[11px] font-black text-zinc-950">{msg.title}</div>
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
