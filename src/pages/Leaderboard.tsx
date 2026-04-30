import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion } from 'framer-motion';
import { AdBanner } from '../components/AdBanner';

interface Leader {
  id: string;
  name: string;
  tasks: number;
  balance: number;
  level: string;
}

export const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  const formatName = (fullName: string) => {
    if (!fullName) return 'Anonymous';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("tasks", "desc"), limit(10));
        const snap = await getDocs(q);
        const data: Leader[] = [];
        snap.forEach(doc => {
          const u = doc.data();
          data.push({
            id: doc.id,
            name: formatName(u.name),
            tasks: u.tasks || 0,
            balance: u.balance || 0,
            level: u.level || 'Bronze'
          });
        });
        setLeaders(data);
      } catch (e) {
        console.error("Leaderboard error:", e);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <AdBanner slot="leaderboard_top" className="mb-6" />

      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-white drop-shadow-[0_5px_15px_rgba(16,185,129,0.3)] mb-4">🏆 Top Earners</h2>
        <p className="text-text-dim text-lg font-medium">The most active users on RizQ Helper</p>
      </div>

      <AdBanner slot="leaderboard_mid" className="mb-6" />

      <div className="glass-card p-2 rounded-[2rem] overflow-hidden">
        <div className="bg-white/5 rounded-[1.8rem] p-6">
          {loading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white/10 rounded-2xl w-full"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {leaders.map((leader, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={leader.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border ${i < 3 ? 'bg-gradient-to-r from-primary-dark/20 to-transparent border-primary-light/30' : 'bg-white/5 border-white/10'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : i === 1 ? 'bg-gray-300 text-black shadow-[0_0_15px_rgba(209,213,219,0.5)]' : i === 2 ? 'bg-amber-700 text-white shadow-[0_0_15px_rgba(180,83,9,0.5)]' : 'bg-white/10 text-white'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{leader.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          leader.level === 'Gold' ? 'bg-yellow-500/20 text-yellow-500' :
                          leader.level === 'Silver' ? 'bg-gray-400/20 text-gray-400' :
                          'bg-amber-700/20 text-amber-600'
                        }`}>
                          {leader.level}
                        </span>
                        <span className="text-xs text-text-dim">{leader.tasks} Tasks</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-light font-black text-xl">{leader.balance.toFixed(2)}</p>
                    <p className="text-[10px] text-text-dim font-bold uppercase mt-1">Total Earned</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdBanner slot="leaderboard_bottom1" className="mt-8" />
      <AdBanner slot="leaderboard_bottom2" className="mt-6" />
    </motion.div>
  );
};
