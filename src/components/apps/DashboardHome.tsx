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
  const isBotOnline = botStatus === 'ONLINE' || botStatus === 'CONNECTED';
  const activeGroupsCount = [client.Group_1, client.Group_2, client.Group_3, client.Group_4, client.Group_5].filter(Boolean).length;
  
  // Calculate active commands: Custom responders + enabled feature switches
  const activeFeaturesCount = [
    config.Anti_Link_Group,
    config.Welcome_Message_Status,
    config.Cmd_SetDel_Status,
    config.Cmd_Hidetag_Status,
    config.Cmd_Stiker_Status
  ].filter(Boolean).length;
  
  const totalCommands = responders.length + activeFeaturesCount;

  const stats = [
    { 
      label: 'Responders', 
      value: responders.length, 
      icon: 'robot_2', 
      cardBg: 'bg-[#fdfcf7] border border-zinc-950 shadow-[3px_3px_0px_#09090b]', 
      iconBg: 'bg-zinc-100/80 border border-zinc-200/50',
      iconColor: 'text-zinc-900', 
      textColor: 'text-zinc-950' 
    },
    { 
      label: 'Active Cmds', 
      value: totalCommands, 
      icon: 'terminal', 
      cardBg: 'bg-[#fdfcf7] border border-zinc-950 shadow-[3px_3px_0px_#09090b]', 
      iconBg: 'bg-zinc-100/80 border border-zinc-200/50',
      iconColor: 'text-zinc-900', 
      textColor: 'text-zinc-950' 
    },
    { 
      label: 'Linked Groups', 
      value: activeGroupsCount, 
      icon: 'group', 
      cardBg: 'bg-[#fdfcf7] border border-zinc-950 shadow-[3px_3px_0px_#09090b]', 
      iconBg: 'bg-zinc-100/80 border border-zinc-200/50',
      iconColor: 'text-zinc-900', 
      textColor: 'text-zinc-950' 
    },
    { 
      label: 'Active Groups', 
      value: isBotOnline ? activeGroupsCount : 0, 
      icon: 'hub', 
      cardBg: 'bg-[#fdfcf7] border border-zinc-950 shadow-[3px_3px_0px_#09090b]', 
      iconBg: 'bg-zinc-100/80 border border-zinc-200/50',
      iconColor: 'text-zinc-900', 
      textColor: 'text-zinc-950' 
    },
    { 
      label: 'Days Left', 
      value: `${client.Days_Left || 0}d`, 
      icon: 'calendar_month', 
      cardBg: 'bg-[#fdfcf7] border border-zinc-950 shadow-[3px_3px_0px_#09090b]', 
      iconBg: 'bg-zinc-100/80 border border-zinc-200/50',
      iconColor: 'text-zinc-900', 
      textColor: 'text-zinc-950' 
    },
    { 
      label: 'Status', 
      value: isBotOnline ? 'Active' : 'Offline', 
      icon: isBotOnline ? 'check_circle' : 'power_settings_new', 
      cardBg: 'bg-[#fdfcf7] border border-zinc-955 shadow-[3px_3px_0px_#09090b]',
      iconBg: isBotOnline ? 'bg-emerald-100/80 border border-emerald-200/50' : 'bg-rose-100/80 border border-rose-200/50',
      iconColor: isBotOnline ? 'text-emerald-600' : 'text-rose-600', 
      textColor: isBotOnline ? 'text-emerald-700' : 'text-rose-600' 
    }
  ];

  // Simulated activity levels for 24 hours (0 = none, 1 = low, 2 = medium, 3 = high, 4 = max)
  // Reflects mock commits/edits heatmap
  const hourActivity = [
    { hour: '00:00', level: 0, edits: 0 },
    { hour: '01:00', level: 0, edits: 0 },
    { hour: '02:00', level: 0, edits: 0 },
    { hour: '03:00', level: 0, edits: 0 },
    { hour: '04:00', level: 0, edits: 0 },
    { hour: '05:00', level: 0, edits: 0 },
    { hour: '06:00', level: 0, edits: 0 },
    { hour: '07:00', level: 1, edits: 1 },
    { hour: '08:00', level: 1, edits: 2 },
    { hour: '09:00', level: 2, edits: 4 },
    { hour: '10:00', level: 0, edits: 0 },
    { hour: '11:00', level: 3, edits: 9 },
    { hour: '12:00', level: 1, edits: 1 },
    { hour: '13:00', level: 2, edits: 5 },
    { hour: '14:00', level: 4, edits: 16 },
    { hour: '15:00', level: 4, edits: 18 },
    { hour: '16:00', level: 3, edits: 11 },
    { hour: '17:00', level: 1, edits: 2 },
    { hour: '18:00', level: 0, edits: 0 },
    { hour: '19:00', level: 2, edits: 6 },
    { hour: '20:00', level: 3, edits: 10 },
    { hour: '21:00', level: 4, edits: 22 },
    { hour: '22:00', level: 2, edits: 7 },
    { hour: '23:00', level: 3, edits: 12 },
  ];

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-zinc-200 border-zinc-300';
      case 2: return 'bg-zinc-400 border-zinc-500';
      case 3: return 'bg-zinc-700 border-zinc-800';
      case 4: return 'bg-zinc-950 border-zinc-950';
      default: return 'bg-[#fdfcf7] border-zinc-200';
    }
  };

  const getRelativeTime = () => {
    const now = new Date();
    return `Today at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Title Banner */}
      <div className="flex flex-col gap-1 text-left">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Welcome back, {client.WhatsApp_Owner || 'User'}</h1>
        <p className="text-xs text-zinc-500 font-semibold">Here's what's happening with your bot today.</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            key={i} 
            className={`rounded-2xl p-4 flex flex-col justify-between gap-3 ${stat.cardBg}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{stat.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.iconBg} ${stat.iconColor} shrink-0`}>
                <span className="material-symbols-outlined text-[16px] font-medium">{stat.icon}</span>
              </div>
            </div>
            <div className="text-left mt-1">
              <div className={`text-lg font-black tracking-tight ${stat.textColor}`}>{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* System Information Card */}
        <div className="bg-[#fdfcf7] border border-zinc-955 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] text-left flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black text-zinc-950 flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-zinc-900 text-[18px]">info</span>
              System Information
            </h2>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200/50">
                <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Package Tier</span>
                <span className="text-zinc-55 font-bold bg-zinc-955 border border-zinc-800 px-3 py-0.5 rounded-full text-[9px]">{client.Package_Tier}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200/50">
                <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Account Status</span>
                <span className="text-zinc-55 font-bold bg-zinc-955 border border-zinc-800 px-3 py-0.5 rounded-full text-[9px]">{client.Account_Status}</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Join Date</span>
                <span className="text-zinc-55 font-bold bg-zinc-955 border border-zinc-800 px-3 py-0.5 rounded-full text-[9px]">
                  {new Date(client.Registration_Date || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Tracker Heatmap Card (GitHub-like) */}
        <div className="bg-[#fdfcf7] border border-zinc-955 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] text-left flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black text-zinc-950 flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-zinc-900 text-[18px]">calendar_view_month</span>
              Activity Tracker
            </h2>
            <div className="text-[10px] text-zinc-500 font-semibold mb-6">
              Last active: <span className="font-bold text-zinc-900">{getRelativeTime()}</span>
            </div>

            {/* 24-box row layout */}
            <div className="space-y-3">
              <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black mb-1.5 ml-0.5">Today's Hourly Activity (24h)</div>
              <div className="flex gap-1.5 items-center overflow-x-auto py-1">
                {hourActivity.map((act) => (
                  <div 
                    key={act.hour} 
                    title={`${act.hour}: ${act.edits} edits`}
                    className={`w-3.5 h-3.5 rounded-sm border ${getHeatmapColor(act.level)} transition-all duration-300 hover:scale-110 shrink-0 relative group`}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-950 text-zinc-50 text-[8px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
                      {act.hour}: {act.edits} edits
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[8px] text-zinc-400 font-bold tracking-wider uppercase border-t border-zinc-200/50 pt-4 mt-6">
            <span>24 blocks (00:00 - 23:00)</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-sm border border-zinc-200 bg-[#fdfcf7]"></div>
              <div className="w-2.5 h-2.5 rounded-sm border border-zinc-300 bg-zinc-200"></div>
              <div className="w-2.5 h-2.5 rounded-sm border border-zinc-500 bg-zinc-400"></div>
              <div className="w-2.5 h-2.5 rounded-sm border border-zinc-800 bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-sm border border-zinc-950 bg-zinc-950"></div>
              <span>More</span>
            </div>
          </div>
        </div>

      </div>
      
    </div>
  );
}
