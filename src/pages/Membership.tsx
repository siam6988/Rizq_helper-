import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../services/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Zap } from 'lucide-react';
import { AdBanner } from '../components/AdBanner';

export const Membership: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);

  const vipCost = 50.00; // Define cost for VIP in ISLM
  const vipDurationDays = 30;

  const isAlreadyVIP = userData?.isVIP && userData?.vipExpiryDate && userData.vipExpiryDate > Date.now();

  const handleUpgrade = async () => {
    if (!userData || !auth.currentUser) return;
    
    if (userData.balance < vipCost) {
      return toast.error("Insufficient Balance! Need " + vipCost + " ISLM.");
    }

    if (isAlreadyVIP) {
      return toast.error("You are already a VIP user!");
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const expiryDate = Date.now() + (vipDurationDays * 24 * 60 * 60 * 1000);
      
      await updateDoc(userRef, {
        balance: increment(-vipCost),
        isVIP: true,
        vipExpiryDate: expiryDate
      });

      toast.success("Successfully upgraded to VIP!");
      await refreshUserData();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <>
    <AdBanner slot="membership_top" className="mb-6 max-w-3xl mx-auto" />
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">VIP Membership</h2>
          <p className="text-text-dim mt-2 font-medium">Upgrade to Premium for exclusive perks.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-dim mb-1 font-bold">Your Balance</p>
          <div className="text-2xl font-black text-primary-light">
            {Number(userData?.balance || 0).toFixed(2)} ISLM
          </div>
        </div>
      </div>

      <AdBanner slot="membership_mid" className="my-6" />

      <div className="glass-card p-10 rounded-3xl relative overflow-hidden border border-yellow-500/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-yellow-500">
           <Crown size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1">
            <h3 className="text-3xl font-black text-yellow-500 mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
              Premium Helper Badge
            </h3>
            <p className="text-white/80 font-medium mb-6 max-w-sm">
              Maximize your earnings and become a priority member of the Halal network. Valid for {vipDurationDays} days.
            </p>

            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-yellow-500" size={20} />
                <span className="text-white font-bold text-lg">10% Multiplier on ALL Task Rewards</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-yellow-500" size={20} />
                <span className="text-white font-bold text-lg">Priority Support</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-yellow-500" size={20} />
                <span className="text-white font-bold text-lg">Exclusive VIP Badge on Profile</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#020617]/80 p-8 rounded-3xl border border-yellow-500/10 min-w-[280px] text-center">
            {isAlreadyVIP ? (
              <>
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mx-auto mb-4">
                   <Zap size={32} />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Active VIP</h4>
                <p className="text-sm text-text-dim font-medium mb-6">
                  Expires: {new Date(userData?.vipExpiryDate || 0).toLocaleDateString()}
                </p>
                <button disabled className="btn-3d w-full py-4 rounded-xl text-lg font-bold opacity-50 cursor-not-allowed">
                  CURRENTLY ACTIVE
                </button>
              </>
            ) : (
               <>
                <p className="text-text-dim text-sm font-bold uppercase tracking-widest mb-2">30-Day Pass</p>
                <div className="text-5xl font-black text-white mb-6">
                  {vipCost.toFixed(2)}
                  <span className="text-xl text-yellow-500 ml-2">ISLM</span>
                </div>
                <button 
                  onClick={handleUpgrade}
                  disabled={loading}
                  className={`bg-yellow-500 hover:bg-yellow-400 text-black w-full py-4 rounded-xl text-lg font-black transition-colors shadow-[0_10px_25px_rgba(234,179,8,0.3)] disabled:opacity-50 ${loading ? 'btn-flat-loading' : ''}`}
                >
                  {loading ? 'PROCESSING...' : 'UPGRADE NOW'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
    <AdBanner slot="membership_bottom1" className="mt-6 max-w-3xl mx-auto" />
    <AdBanner slot="membership_bottom2" className="mt-6 max-w-3xl mx-auto" />
    </>
  );
};
