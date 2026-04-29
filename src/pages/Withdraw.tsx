import React, { useState } from 'react';
import { db, auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { z } from 'zod';

const withdrawSchema = z.object({
  amount: z.number().min(28, "Minimum withdrawal is 28 ISLM"),
  address: z.string().min(10, "Please enter a valid wallet address").regex(/^[a-zA-Z0-9]+$/, "Invalid wallet address format"),
});

export const Withdraw: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [coin, setCoin] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    
    try {
      withdrawSchema.parse({ amount: amt, address });
    } catch (err: any) {
       if (err instanceof z.ZodError) {
         toast.error(err.errors[0].message);
       }
       return;
    }

    const now = Date.now();
    if (now - lastSubmit < 2000) {
      return toast.error("Please wait a moment before trying again.");
    }
    setLastSubmit(now);

    if (!userData || !auth.currentUser) return;
    
    if (userData.balance < amt) return toast.error("Insufficient Balance");

    setLoading(true);
    try {
      const response = await fetch('/api/request-withdrawal', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            uid: auth.currentUser.uid,
            amount: amt,
            address: address,
            coin: coin
         })
      });

      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || "Failed to request withdrawal");
      }
      
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
      <p className="text-text-dim text-sm font-semibold mb-8">Minimum: 28 ISLM</p>
      
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
          <label className="text-primary-light font-bold text-sm block mb-2">Amount (Minimum 28 ISLM)</label>
          <input 
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="custom-input p-4 rounded-xl w-full font-bold text-base"
          />
          <p className="text-text-dim text-xs mt-2 font-medium">3% Network & Service Fee will be deducted.</p>
        </div>
        
        <button 
          onClick={handleWithdraw}
          disabled={loading}
          className={`btn-3d w-full mt-4 py-4 rounded-2xl text-sm ${loading ? 'loading' : ''}`}
        >
          {loading ? 'PROCESSING...' : 'REQUEST PAYOUT'}
        </button>
      </div>
    </motion.div>
  );
};
