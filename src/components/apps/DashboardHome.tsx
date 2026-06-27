'use client';
import type { ClientRegistry, BotConfig, AutoResponder } from '@/lib/api';
import { motion } from 'framer-motion';

interface DashboardHomeProps {
  client: ClientRegistry;
  config: BotConfig;
  responders: AutoResponder[];
  botStatus: string;
}

export default function DashboardHome({ client, config, responders, botStatus }: DashboardHomeProps) {
  const stats = [
    { 
      label: 'Auto Responders', 
      value: responders.length, 
      icon: 'robot_2', 
      cardBg: 'bg-[#ebe5f7] border border-[#dcd6ee]/30', 
      iconColor: 'text-[#5e35b1]', 
      textColor: 'text-[#2a1b4e]' 
    },
    { 
      label: 'Linked Groups', 
      value: [client.Group_1, client.Group_2, client.Group_3, client.Group_4, client.Group_5].filter(Boolean).length, 
      icon: 'group', 
      cardBg: 'bg-[#e2f2e7] border border-[#cbe6d4]/30', 
      iconColor: 'text-[#2e7d32]', 
      textColor: 'text-[#1b431c]' 
    },
    { 
      label: 'Subscription Days', 
      value: client.Days_Left || 0, 
      icon: 'calendar_month', 
      cardBg: 'bg-[#f9f4e2] border border-[#eddcb6]/30', 
      iconColor: 'text-[#ef6c00]', 
      textColor: 'text-[#4e2c0e]' 
    },
    { 
      label: 'Status', 
      value: botStatus, 
      icon: botStatus === 'ONLINE' ? 'check_circle' : 'power_settings_new', 
      cardBg: botStatus === 'ONLINE' ? 'bg-[#eefcf3] border border-[#d3f5df]' : 'bg-[#fff5f5] border border-[#fed7d7]', 
      iconColor: botStatus === 'ONLINE' ? 'text-emerald-600' : 'text-rose-600', 
      textColor: botStatus === 'ONLINE' ? 'text-emerald-950' : 'text-rose-950' 
    }
  ];

  return (
    <div className="space-y-6 text-zinc-900">
      
      {/* Welcome Title Banner */}
      <div className="flex flex-col gap-1 text-left">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Welcome back, {client.WhatsApp_Owner || 'User'}</h1>
        <p className="text-xs text-zinc-500 font-medium">Here's what's happening with your bot today.</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className={`rounded-3xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] ${stat.cardBg}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/65 shadow-sm ${stat.iconColor}`}>
              <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
            </div>
            <div className="text-left">
              <div className={`text-2xl font-black ${stat.textColor}`}>{stat.value}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] text-left">
          <h2 className="text-base font-black text-zinc-950 flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-zinc-900">info</span>
            System Information
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <span className="text-zinc-500 text-xs font-semibold">Package Tier</span>
              <span className="text-zinc-800 font-bold bg-zinc-100 border border-zinc-200/50 px-2.5 py-1 rounded-lg text-[10px]">{client.Package_Tier}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <span className="text-zinc-500 text-xs font-semibold">Account Status</span>
              <span className="text-zinc-850 font-bold bg-zinc-100 border border-zinc-200/50 px-2.5 py-1 rounded-lg text-[10px]">{client.Account_Status}</span>
            </div>
            <div className="flex justify-between items-center pb-3">
              <span className="text-zinc-500 text-xs font-semibold">Join Date</span>
              <span className="text-zinc-850 font-bold bg-zinc-100 border border-zinc-200/50 px-2.5 py-1 rounded-lg text-[10px]">{new Date(client.Registration_Date || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
