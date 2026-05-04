import React, { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { usePTC } from '../context/PTCContext';
import { motion } from 'framer-motion';
import { filterHaramTasks } from '../utils/haramBlocker';
import { AdBanner } from '../components/AdBanner';

interface Task {
  id: string;
  title: string;
  duration: number;
  reward: number;
  url: string;
  countries?: string;
  advertiserId?: string;
  isDynamic?: boolean;
}

export const Earn: React.FC = () => {
  const { userData } = useAuth();
  const { startTask } = usePTC();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState(true);

  // Gamification multiplier
  const getMultiplier = (level: string) => {
    if (level === 'Gold') return 1.1;
    if (level === 'Silver') return 1.05;
    return 1.0;
  };

  const multiplier = getMultiplier(userData?.level || 'Bronze');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const snapAdmin = await getDocs(collection(db, 'tasks'));
        const snapUsers = await getDocs(query(collection(db, 'ptx_tasks')));
        
        const loadedTasks: Task[] = [];
        
        const processDoc = (doc: any, isAdmin: boolean) => {
          const t = doc.data();
          if (!isAdmin && t.status !== 'active') return;
          
          const allowed = (t.countries || t.targetCountry || 'ALL').toUpperCase();
          
          loadedTasks.push({ 
            id: doc.id, 
            title: t.title || t.adTitle || 'Task',
            duration: Number(t.duration) || 15,
            reward: Number(t.reward) || (Number(t.costPerClick) * 0.8) || 0.01,
            url: t.url || t.adUrl || '',
            countries: allowed,
            advertiserId: isAdmin ? undefined : t.userId,
            ...t 
          } as Task);
        };

        snapAdmin.forEach(doc => processDoc(doc, true));
        snapUsers.forEach(doc => processDoc(doc, false));

        // Filter out any haram content
        const safeTasks = filterHaramTasks(loadedTasks);

        setTasks(safeTasks);
      } catch (e: any) {
        console.error("Error loading tasks", e);
      }
      setLoading(false);
    };

    if (userData) fetchTasks();
  }, [userData]);

  const isTaskAvailable = (taskId: string) => {
    if (!userData || !userData.completedTasks) return true;
    const lastDone = userData.completedTasks[taskId];
    if (!lastDone) return true;

    const oneDay = 24 * 60 * 60 * 1000;
    const timeSinceLast = Date.now() - lastDone;
    
    if (timeSinceLast < oneDay) return false;
    return true;
  };

  const [startingTask, setStartingTask] = useState<string | null>(null);
  const [confirmTask, setConfirmTask] = useState<any>(null);

  const handleStart = (task: any) => {
    setStartingTask(task.id);
    // Synchoronous window open to bypass pop-up blockers
    const adWin = window.open(task.url, '_blank');
    
    // Delay setting global state so the user can enjoy the loading animation on the button
    setTimeout(() => {
      startTask(task.id, task.duration, task.finalReward, task.url, adWin, task.isDynamic ? 'dynamic' : 'standard');
      setStartingTask(null);
      setConfirmTask(null);
    }, 600);
  };

  const userCountry = (userData?.country || 'GLOBAL').toUpperCase();

  const filteredTasks = tasks.filter(t => {
    if (!countryFilter) return true;
    const allowed = t.countries || 'ALL';
    return allowed === 'ALL' || allowed.includes(userCountry);
  });

  const activeTasks = filteredTasks.map(t => ({
    ...t,
    available: isTaskAvailable(t.id),
    finalReward: t.reward * multiplier
  }));

  const standardTasks = activeTasks.filter(t => !t.isDynamic);
  const dynamicTasks = activeTasks.filter(t => t.isDynamic);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-10"
    >
      <AdBanner slot="earn_top1" className="mb-6" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-glass pb-8 mb-8">
        <div>
          <h2 className="text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">Earn Station</h2>
          <p className="text-text-dim text-sm font-medium mt-1">
            Current Multiplier: <span className="text-yellow-500 font-bold">{multiplier}x ({userData?.level})</span>
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center cursor-pointer gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
            <span className="text-sm font-bold text-white">Available to me</span>
            <div className={`relative inline-block w-10 h-5 transition duration-200 ease-in-out rounded-full ${countryFilter ? 'bg-primary-light' : 'bg-white/20'}`}>
              <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${countryFilter ? 'transform translate-x-5' : ''}`}></div>
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={countryFilter}
              onChange={() => setCountryFilter(!countryFilter)}
            />
          </label>
          <div className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center backdrop-blur-md border border-white/5">
            🌍 <span className="ml-2 uppercase tracking-widest">{userData?.country || 'Detecting...'}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white/10 rounded-2xl w-full"></div>
            ))}
        </div>
      ) : activeTasks.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          className="flex flex-col items-center justify-center p-12 glass-card rounded-3xl border-dashed border-2 border-primary-light/30 text-center gap-6"
        >
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="relative"
          >
            {/* Cute anime character */}
            <div className="w-40 h-40 bg-gradient-to-tr from-primary-light/20 to-primary-dark/20 rounded-full flex items-center justify-center mb-4 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.3)]">
               <img 
                 src="/anime_character.png" 
                 alt="Cute Anime Character" 
                 className="w-full h-full object-cover scale-125" 
                 onError={(e) => { 
                    e.currentTarget.src = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cheer'; 
                    e.currentTarget.className = 'w-full h-full object-cover p-4'; 
                 }} 
               />
               <motion.div 
                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border-4 border-yellow-400 rounded-full mix-blend-overlay"
               />
            </div>
            {/* Sparkles */}
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="absolute text-yellow-400 text-2xl -top-2 -left-4">✨</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} className="absolute text-yellow-400 text-xl top-4 -right-6">🌟</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 1 }} className="absolute text-yellow-400 text-lg bottom-4 -left-6">✨</motion.span>
          </motion.div>

          <div>
            <h3 className="text-3xl font-black text-white drop-shadow-[0_2px_10px_rgba(16,185,129,0.5)] mb-2">
              Sugoi! You did it! 🎉
            </h3>
            <p className="text-emerald-300 font-bold mb-1 border-b border-emerald-500/30 pb-2 inline-block">
              All tasks completed! You are amazing! 💖
            </p>
            <p className="text-text-dim text-sm max-w-sm mx-auto mt-4 px-4 leading-relaxed">
              New tasks will appear when advertisers create them or after your 24h reset period. Take a break and come back later!
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-10">
          <AdBanner slot="earn_top2" />
          
          {/* DYNAMIC TASKS */}
          {dynamicTasks.length > 0 && (
            <div>
              <h3 className="text-2xl font-black text-white mb-4 drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)] flex items-center gap-2">
                <span className="text-yellow-500">🔥</span> Dynamic Blog Reads
              </h3>
              <p className="text-text-dim text-sm font-semibold mb-6">Earn up to 0.1 ISLM every 10 seconds. Stay active on the page. Max 3 minutes.</p>
              
              <div className="space-y-4">
                {dynamicTasks.map(task => (
                  <div key={task.id} className={`glass-card p-6 flex flex-col md:flex-row justify-between md:items-center gap-6 rounded-2xl transition-all duration-300 border ${task.available ? 'border-yellow-500/30 hover:border-yellow-500/60 bg-gradient-to-r from-bg-main to-yellow-900/20' : 'border-white/5 opacity-60 grayscale'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{task.title}</h3>
                        {!task.available && <span className="bg-white/10 text-text-dim text-[10px] uppercase font-black px-2 py-1 rounded">WAIT 24H</span>}
                      </div>
                      <div className="flex items-center gap-4 text-sm font-semibold">
                        <span className="text-yellow-500 bg-yellow-500/20 px-3 py-1 rounded-md">Up to {task.duration / 60} Mins</span>
                        {multiplier > 1 && task.available && (
                          <span className="text-yellow-500 text-xs">+{((Number(task.finalReward) - Number(task.reward)) || 0).toFixed(2)} Bonus</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-5 justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-sm font-bold text-text-dim uppercase tracking-widest mb-1">Max Reward</p>
                        <p className="text-yellow-500 text-2xl font-black drop-shadow-[0_2px_5px_rgba(234,179,8,0.3)]">+{Number(task.finalReward || 0).toFixed(2)}</p>
                      </div>
                      {task.available ? (
                        <button 
                          onClick={() => setConfirmTask(task)}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-xl font-black flex items-center justify-center min-w-[140px] transition-colors shadow-[0_10px_25px_rgba(234,179,8,0.3)]"
                        >
                          READ NOW
                        </button>
                      ) : (
                        <button disabled className="bg-white/5 text-text-dim px-8 py-3 rounded-xl font-bold cursor-not-allowed">
                          DONE
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AdBanner slot="earn_mid" className="my-8" />

          {/* STANDARD TASKS */}
          {standardTasks.length > 0 && (
            <div>
              <h3 className="text-2xl font-black text-white mb-6 drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]">
                Standard PTC Tasks
              </h3>
              <div className="space-y-4">
                {standardTasks.map(task => (
                  <div key={task.id} className={`glass-card p-6 flex flex-col md:flex-row justify-between md:items-center gap-6 rounded-2xl transition-all duration-300 border ${task.available ? 'border-primary-dark/50 hover:border-primary-light/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] bg-gradient-to-r from-bg-main to-bg-panel' : 'border-white/5 opacity-60 grayscale'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{task.title}</h3>
                      {!task.available && <span className="bg-white/10 text-text-dim text-[10px] uppercase font-black px-2 py-1 rounded">WAIT 24H</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm font-semibold">
                      <span className="text-primary-light bg-primary-dark/20 px-3 py-1 rounded-md">{task.duration} Seconds</span>
                      {multiplier > 1 && task.available && (
                        <span className="text-yellow-500 text-xs">+{((task.finalReward - task.reward)).toFixed(2)} Bonus</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-5 justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-sm font-bold text-text-dim uppercase tracking-widest mb-1">Reward</p>
                      <p className="text-primary-light text-2xl font-black drop-shadow-[0_2px_5px_rgba(16,185,129,0.3)]">+{Number(task.finalReward || 0).toFixed(2)}</p>
                    </div>
                    {task.available ? (
                      <button 
                        onClick={() => setConfirmTask(task)}
                        className="btn-3d px-8 py-3 rounded-xl font-bold flex items-center justify-center min-w-[140px]"
                      >
                        START MISSION
                      </button>
                    ) : (
                      <button disabled className="bg-white/5 text-text-dim px-8 py-3 rounded-xl font-bold cursor-not-allowed">
                        DONE
                      </button>
                    )}
                  </div>
                </div>
                ))}
            </div>
            </div>
          )}

          <AdBanner slot="earn_bottom" className="my-8" />
          <AdBanner slot="earn_bottom2" className="my-8" />
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-panel border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative"
          >
            <div className="w-16 h-16 bg-primary-light/20 rounded-full flex items-center justify-center text-primary-light mb-6 mx-auto">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 text-center">Are you sure?</h3>
            <p className="text-text-dim mb-8 text-center font-medium">Do you want to start this mission? To earn your reward, you must keep the target window open and stay active for <span className="text-white font-bold">{confirmTask.duration} seconds</span>.</p>
            <div className="flex gap-4 w-full">
               <button 
                 onClick={() => setConfirmTask(null)} 
                 className="flex-1 py-4 text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors font-bold"
               >
                 CANCEL
               </button>
               <button 
                 onClick={() => handleStart(confirmTask)} 
                 disabled={startingTask === confirmTask.id} 
                 className="flex-1 py-4 text-black bg-primary-light rounded-xl hover:bg-primary-dark hover:text-white transition-colors font-black flex items-center justify-center shadow-[0_10px_20px_rgba(16,185,129,0.3)]"
               >
                 {startingTask === confirmTask.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span>WAIT</span>
                    </div>
                 ) : (
                    'CONFIRM'
                 )}
               </button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};
