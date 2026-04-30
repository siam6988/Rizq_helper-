import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface EarningRecord {
  id: string;
  type: string;
  amount: number;
  timestamp: number;
  taskId?: string;
  referredUser?: string;
}

import { TransparentLedger } from '../components/TransparentLedger';
import { AdBanner } from '../components/AdBanner';

export const Dashboard: React.FC = () => {
  const { userData } = useAuth();
  const [history, setHistory] = useState<EarningRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, "users", auth.currentUser.uid, "earnings"),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);
        const records: EarningRecord[] = [];
        snap.forEach(doc => {
          records.push({ id: doc.id, ...doc.data() } as EarningRecord);
        });
        setHistory(records);
      } catch (e) {
        console.error("Failed to fetch history:", e);
      }
      setLoadingHistory(false);
    };

    fetchHistory();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="stat-card p-10 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <p className="opacity-90 text-sm font-extrabold mb-3 text-white tracking-[1px] relative z-10">TOTAL BALANCE</p>
        {!userData ? (
          <div className="h-16 w-48 bg-white/20 animate-pulse rounded-2xl relative z-10"></div>
        ) : (
          <div className="relative z-10 flex items-end gap-3">
            <h1 className="text-6xl text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] font-bold">
              {Number(userData.balance || 0).toFixed(2)}
            </h1>
            <span className="text-2xl font-bold text-white/70 mb-2 tracking-wide">ISLM</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-8 rounded-3xl">
          <h4 className="text-text-dim mb-4 text-base font-semibold">Tasks Completed</h4>
          {!userData ? (
            <div className="h-12 w-24 bg-white/10 animate-pulse rounded-xl"></div>
          ) : (
            <h2 className="text-primary-light text-5xl font-bold drop-shadow-[0_5px_10px_rgba(16,185,129,0.2)]">
              {userData.tasks || 0}
            </h2>
          )}
        </div>
        <div className="glass-card p-8 rounded-3xl border border-primary-light/30 bg-gradient-to-br from-bg-panel to-primary-dark/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary-light/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          <h4 className="text-text-dim mb-4 text-base font-semibold relative z-10">Current Rank</h4>
          {!userData ? (
            <div className="h-12 w-32 bg-white/10 animate-pulse rounded-xl relative z-10"></div>
          ) : (
            <h2 className={`text-5xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)] relative z-10 ${
                userData.level === 'Gold' ? 'text-yellow-500' :
                userData.level === 'Silver' ? 'text-gray-300' :
                'text-amber-700'
            }`}>
              {userData.level || 'Bronze'}
            </h2>
          )}
        </div>
      </div>

      <div className="glass-card p-8 rounded-3xl mt-6">
        <h3 className="text-2xl font-bold text-white mb-6">Earnings History</h3>
        
        {loadingHistory ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 w-full bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-2xl">
            <p className="text-text-dim font-bold text-lg">No earnings yet. Start completing tasks!</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
                {history.map((record, i) => (
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={record.id} 
                    className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <div>
                    <h4 className="text-white font-extrabold text-base tracking-wide flex items-center gap-2">
                        {record.type === 'task' ? '🎯 Task Completed' : '🎁 Referral Bonus'}
                    </h4>
                    <p className="text-sm text-text-dim mt-1.5 font-medium">
                        {new Date(record.timestamp).toLocaleString()}
                        {record.type === 'referral_bonus' && record.referredUser && <span className="text-primary-light ml-2 truncate"> • From {record.referredUser}</span>}
                    </p>
                    </div>
                    <div className="text-primary-light font-black text-xl drop-shadow-[0_2px_5px_rgba(16,185,129,0.3)]">
                    +{Number(record.amount || 0).toFixed(2)}
                    </div>
                </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AdBanner slot="dashboard_mid" className="mt-6 mb-6 h-28" />

      <div className="mt-6">
        <TransparentLedger />
      </div>
    </motion.div>
  );
};
