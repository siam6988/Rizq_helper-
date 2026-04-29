import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

export interface Withdrawal {
  id: string;
  address: string;
  amount: number;
  coin: string;
  status: 'paid' | 'pending';
  time: number;
}

export const TransparentLedger: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const q = query(
          collection(db, 'withdrawals'),
          orderBy('time', 'desc'),
          limit(30)
        );
        const snap = await getDocs(q);
        const docs = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }) as Withdrawal)
          .filter(doc => doc.status === 'paid')
          .slice(0, 10);
        
        setWithdrawals(docs);
      } catch (error) {
        console.error('Error fetching ledger:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, []);

  const maskAddress = (address: string) => {
    if (!address || address.length < 8) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 md:p-8 rounded-3xl w-full"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-light/20 flex items-center justify-center text-primary-light">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            Public Transparent Ledger
          </h2>
          <p className="text-sm text-text-dim font-medium">Recent successful withdrawals</p>
        </div>
      </div>

      <div className="bg-black/30 rounded-2xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-4 text-xs font-bold text-text-dim p-4 border-b border-white/5 uppercase tracking-wider">
          <div className="col-span-1">Amount</div>
          <div className="col-span-1">Asset</div>
          <div className="col-span-2 text-right">Recipient</div>
        </div>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 rounded-full border-2 border-primary-light border-t-transparent animate-spin"></div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-8 text-center text-text-dim text-sm font-medium">
              No recent paid withdrawals to show.
            </div>
          ) : (
            <AnimatePresence>
              {withdrawals.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={item.id}
                  className="grid grid-cols-4 items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <div className="col-span-1 font-black text-primary-light">
                    {Number(item.amount || 0).toFixed(2)}
                  </div>
                  <div className="col-span-1 font-bold text-white flex items-center gap-2">
                    {item.coin}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="font-mono text-sm text-text-dim group-hover:text-white transition-colors">
                      {maskAddress(item.address)}
                    </span>
                    <ArrowUpRight size={14} className="text-primary-light opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};
