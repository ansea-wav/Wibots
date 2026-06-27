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
      cardBg: 'bg-[#fdfcf7] border border-zinc-200/60', 
      iconBg: 'bg-zinc-100/80 border border-zinc-200/50',
      iconColor: 'text-zinc-900', 
      textColor: 'text-zinc-950' 
    },
    { 
      label: 'Linked Groups', 
      value: [client.Group_1, client.Group_2, client.Group_3, client.Group_4, client.Group_5].filter(Boolean).length, 
      icon: 'group', 
      cardBg: 'bg-[#fdfcf7] border border-zinc-200/60', 
      iconBg: 'bg-zinc-100/80 border border-zinc-200/50',
      iconColor: 'text-zinc-900', 
      textColor: 'text-zinc-950' 
    },
    { 
      label: 'Subscription Days', 
      value: client.Days_Left || 0, 
      icon: 'calendar_month', 
      cardBg: 'bg-[#fdfcf7] border border-zinc-200/60', 
      iconBg: 'bg-zinc-100/80 border border-zinc-200/50',
      iconColor: 'text-zinc-900', 
      textColor: 'text-zinc-950' 
    },
    { 
      label: 'Status', 
      value: botStatus, 
      icon: botStatus === 'ONLINE' ? 'check_circle' : 'power_settings_new', 
      cardBg: 'bg-[#fdfcf7] border border-zinc-200/60',
      iconBg: botStatus === 'ONLINE' ? 'bg-emerald-100/80 border border-emerald-200/50' : 'bg-rose-100/80 border border-rose-200/50',
      iconColor: botStatus === 'ONLINE' ? 'text-emerald-600' : 'text-rose-600', 
      textColor: botStatus === 'ONLINE' ? 'text-emerald-950' : 'text-rose-950' 
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Title Banner */}
      <div className="flex flex-col gap-1 text-left">
        <h1 className="text-3xl font-black tracking-tight text-white">Welcome back, {client.WhatsApp_Owner || 'User'}</h1>
        <p className="text-xs text-zinc-400 font-medium">Here's what's happening with your bot today.</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i} 
            className={`rounded-3xl p-5 flex items-center gap-4 shadow-sm ${stat.cardBg}`}
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${stat.iconBg} shrink-0`}>
              <span className="material-symbols-outlined text-[20px] font-medium">{stat.icon}</span>
            </div>
            <div className="text-left">
              <div className={`text-xl font-black tracking-tight ${stat.textColor}`}>{stat.value}</div>
              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-[#fdfcf7] border border-zinc-200/60 rounded-3xl p-6 shadow-sm text-left">
          <h2 className="text-sm font-black text-zinc-950 flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-zinc-900 text-[18px]">info</span>
            System Information
          </h2>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200/40">
              <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Package Tier</span>
              <span className="text-white font-bold bg-zinc-950 border border-zinc-800 px-3 py-0.5 rounded-full text-[9px]">{client.Package_Tier}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200/40">
              <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Account Status</span>
              <span className="text-white font-bold bg-zinc-950 border border-zinc-800 px-3 py-0.5 rounded-full text-[9px]">{client.Account_Status}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Join Date</span>
              <span className="text-white font-bold bg-zinc-950 border border-zinc-800 px-3 py-0.5 rounded-full text-[9px]">
                {new Date(client.Registration_Date || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
