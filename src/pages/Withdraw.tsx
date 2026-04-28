import React, { useState } from 'react';
import { addDoc, collection, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const Withdraw: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [coin, setCoin] = useState('BTC');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt < 28) return toast.error("Minimum withdrawal is 28");
    if (!address) return toast.error("Please enter your wallet address");
    if (!userData || !auth.currentUser) return;
    
    if (userData.balance < amt) return toast.error("Insufficient Balance");

    setLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      if (!userData.hasWithdrawn && userData.refBy) {
        const refBonus = amt * 0.10;
        try {
          await setDoc(doc(db, "users", userData.refBy), { balance: increment(refBonus) }, { merge: true });
          
          await addDoc(collection(db, "users", userData.refBy, "earnings"), {
            type: 'referral_bonus',
            referredUser: userData.name || auth.currentUser.email || auth.currentUser.uid,
            amount: refBonus,
            timestamp: Date.now()
          });
        } catch(e) {
          console.error("Ref bonus failed:", e);
        }
      }

      await addDoc(collection(db, "withdrawals"), { 
        uid: auth.currentUser.uid, 
        email: userData.name || auth.currentUser.email, 
        address, 
        coin, 
        amount: amt, 
        status: 'pending', 
        time: Date.now() 
      });

      await updateDoc(userRef, { balance: increment(-amt), hasWithdrawn: true });
      
      toast.success("Withdrawal Requested Successfully!");
      setAmount('');
      setAddress('');
      await refreshUserData();
    } catch(e: any) {
      toast.error("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card max-w-lg mx-auto p-8 rounded-3xl"
    >
      <h2 className="mb-4 text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">Withdraw Funds</h2>
      <p className="text-text-dim text-sm font-semibold mb-8">Minimum: 28 Units</p>
      
      <div className="space-y-5">
        <div>
          <label className="text-primary-light font-bold text-sm block mb-2">Select Coin</label>
          <select 
            value={coin} 
            onChange={(e) => setCoin(e.target.value)}
            className="custom-input p-4 rounded-xl w-full font-bold text-base"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="SOL">Solana (SOL)</option>
            <option value="ISLM">Islamic Coin (ISLM)</option>
          </select>
        </div>

        <div>
          <label className="text-primary-light font-bold text-sm block mb-2">Wallet Address</label>
          <input 
            type="text"
            placeholder="Enter Wallet Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="custom-input p-4 rounded-xl w-full font-bold text-base"
          />
        </div>
        
        <div>
          <label className="text-primary-light font-bold text-sm block mb-2">Amount</label>
          <input 
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="custom-input p-4 rounded-xl w-full font-bold text-base"
          />
        </div>
        
        <button 
          onClick={handleWithdraw}
          disabled={loading}
          className="btn-3d w-full mt-4 py-4 rounded-2xl text-sm"
        >
          {loading ? 'PROCESSING...' : 'REQUEST PAYOUT'}
        </button>
      </div>
    </motion.div>
  );
};
