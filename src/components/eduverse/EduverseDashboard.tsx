'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Sparkles, X, Trophy, PlayCircle } from 'lucide-react';
import KanbanBoard from '../KanbanBoard';

export default function EduverseApp() {
  const [activeClass, setActiveClass] = useState<string | null>(null);

  // Fake class data
  const classes = [
    { id: 'math', name: 'Fisika Kuantum Dasar', teacher: 'Prof. YAY', tasks: 2, color: 'from-purple-500/40 to-blue-500/40' },
    { id: 'bio', name: 'Biologi Sintetis', teacher: 'Dr. Netals', tasks: 0, color: 'from-green-500/40 to-emerald-500/40' },
    { id: 'code', name: 'Algoritma AI', teacher: 'YAY Bot', tasks: 1, color: 'from-orange-500/40 to-red-500/40', alert: true },
  ];

  return (
    <div className="w-full h-full text-white overflow-hidden relative font-sans flex flex-col">
      
      {/* Liquid Glass Background for App */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-purple-600/30 to-blue-600/30 blur-[100px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-l from-[#deff9a]/20 to-teal-500/20 blur-[120px] mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[#deff9a] to-[#a2ff00] text-black">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">YAY Eduverse</h1>
            <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mt-0.5">The Canvas-Kahoot Fusion</p>
          </div>
        </div>
        
        {/* Gamification Streak */}
        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={18} />
            <span className="font-bold text-sm">Lv. 14 (3400 XP)</span>
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-sm">12 Day Streak</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-8 hide-scrollbar">
        <AnimatePresence mode="wait">
          {!activeClass ? (
            // BENTO BOX PORTAL (Dashboard Utama)
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-6xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Portal Kampus Dinamis</h2>
                <button className="px-6 py-2 rounded-full glass-panel-dark text-sm hover:bg-white/10 transition-colors border border-white/20">
                  + Gabung Kelas
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((c) => (
                  <motion.div
                    key={c.id}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveClass(c.id)}
                    className={`relative cursor-pointer rounded-[2rem] p-6 glass-panel overflow-hidden border border-white/10 group ${c.alert ? 'shadow-[0_0_30px_rgba(255,0,0,0.2)] border-red-500/50' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-40 group-hover:opacity-70 transition-opacity`}></div>
                    
                    {c.alert && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 blur-[30px] opacity-60"></div>
                    )}

                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <span className="text-xl">📚</span>
                          </div>
                          {c.tasks > 0 && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.alert ? 'bg-red-500 text-white' : 'bg-[#deff9a] text-black'}`}>
                              {c.tasks} Misi Tertunda
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold mb-1 leading-tight">{c.name}</h3>
                        <p className="text-white/60 text-sm">{c.teacher}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Liquid Leaderboard Snippet */}
              <div className="mt-12 glass-panel-dark rounded-[2rem] p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="text-yellow-400" />
                  <h3 className="text-xl font-bold">Liquid Leaderboard Global</h3>
                </div>
                <div className="space-y-3">
                  {['Satria (You)', 'Alex_Hacker', 'Nadia_Quantum'].map((name, i) => (
                    <div key={name} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                      <div className="flex items-center gap-4">
                        <span className={`font-bold w-6 ${i === 0 ? 'text-yellow-400 text-lg' : 'text-white/50'}`}>#{i+1}</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400"></div>
                        <span className="font-semibold">{name}</span>
                      </div>
                      <span className="font-mono text-[var(--neon-green)]">{4000 - (i * 300)} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            // KANBAN QUEST LOG & ARENA
            <motion.div
              key="class-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveClass(null)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors border border-transparent hover:border-white/20"
                  >
                    <X size={24} />
                  </button>
                  <h2 className="text-3xl font-bold">{classes.find(c => c.id === activeClass)?.name}</h2>
                </div>
                
                {/* The Kahoot Mode Trigger */}
                <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#deff9a] text-black font-bold hover:bg-[#cbf571] hover:shadow-[0_0_30px_rgba(222,255,154,0.5)] transition-all transform hover:scale-105">
                  <PlayCircle size={20} fill="currentColor" />
                  MASUK LIVE ARENA
                </button>
              </div>

              {/* The Academic Kanban */}
              <div className="flex-1 bg-black/20 rounded-[2rem] border border-white/10 overflow-hidden">
                <KanbanBoard />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
