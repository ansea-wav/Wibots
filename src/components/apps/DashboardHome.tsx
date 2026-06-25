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
    { label: 'Auto Responders', value: responders.length, icon: 'robot_2', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Linked Groups', value: [client.Group_1, client.Group_2, client.Group_3, client.Group_4, client.Group_5].filter(Boolean).length, icon: 'group', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Subscription Days', value: client.Days_Left || 0, icon: 'calendar_month', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Status', value: botStatus, icon: 'power', color: botStatus === 'ONLINE' ? 'text-green-400' : 'text-red-400', bg: botStatus === 'ONLINE' ? 'bg-green-400/10' : 'bg-red-400/10' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back, {client.WhatsApp_Owner}</h1>
        <p className="text-sm text-white/50">Here's what's happening with your bot today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-lg"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-purple-400">info</span>
            System Information
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-white/50 text-sm">Package Tier</span>
              <span className="text-white font-medium bg-white/5 px-2 py-1 rounded text-xs">{client.Package_Tier}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-white/50 text-sm">Account Status</span>
              <span className="text-white font-medium bg-white/5 px-2 py-1 rounded text-xs">{client.Account_Status}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-white/50 text-sm">Join Date</span>
              <span className="text-white font-medium bg-white/5 px-2 py-1 rounded text-xs">{new Date(client.Registration_Date || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
