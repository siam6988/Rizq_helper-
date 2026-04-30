import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const Store: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [purchaseAmount, setPurchaseAmount] = useState('100');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const depositAddress = "haqq1q25md8v4dlyftc2v852n0shn8j8ksuuf3gckr4"; // Example HAQQ Address
  
  const handleSubmitDeposit = async () => {
    const amt = parseFloat(purchaseAmount);
    if (!amt || amt < 10) return toast.error("Minimum purchase is 10 ISLM");
    if (!txHash || txHash.length < 10) return toast.error("Please enter a valid Transaction Hash");
    if (!auth.currentUser) return toast.error("Please login to purchase");

    setLoading(true);
    try {
      const response = await fetch('/api/submit-deposit', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            uid: auth.currentUser.uid,
            amountISLM: amt,
            txHash: txHash
         })
      });

      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || "Failed to submit deposit");
      }
      
      toast.success("Deposit submitted! It will be credited once verified by the network.");
      setTxHash('');
    } catch(e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card max-w-lg mx-auto p-8 rounded-3xl"
    >
      <div className="flex items-center gap-3 mb-6">
         <div className="w-12 h-12 bg-primary-light/20 text-primary-light rounded-xl flex items-center justify-center">
            <ShoppingCart size={24} />
         </div>
         <div>
            <h2 className="text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">ISLM Deposit</h2>
            <p className="text-text-dim text-sm font-semibold">Fund your account directly via HAQQ Network</p>
         </div>
      </div>
      
      <div className="space-y-5">
        <div className="bg-primary-light/10 p-4 rounded-xl border border-primary-light/20">
           <p className="text-sm font-bold text-white mb-2">Send ISLM to this address:</p>
           <div className="bg-black/50 p-3 rounded-lg flex justify-between items-center break-all">
              <span className="font-mono text-primary-light text-sm">{depositAddress}</span>
              <button 
                 onClick={() => {
                   navigator.clipboard.writeText(depositAddress);
                   toast.success("Address copied to clipboard!");
                 }}
                 className="text-xs bg-primary-light text-black px-2 py-1 rounded font-bold ml-2 shrink-0 hover:bg-white transition-colors"
              >
                COPY
              </button>
           </div>
           <p className="text-xs text-text-dim mt-2">Only send ISLM on the HAQQ Mainnet. Deposits usually process within a few minutes after verification.</p>
        </div>

        <div>
          <label className="text-primary-light font-bold text-sm block mb-2">Amount you sent (ISLM)</label>
          <input 
            type="number"
            placeholder="Min 10 ISLM"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
            className="custom-input p-4 rounded-xl w-full font-bold text-base"
          />
        </div>
        
        <div>
          <label className="text-primary-light font-bold text-sm block mb-2">Transaction Hash (TxID)</label>
          <input 
            type="text"
            placeholder="0x..."
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="custom-input p-4 rounded-xl w-full font-bold text-base font-mono text-xs"
          />
        </div>
        
        <button 
          onClick={handleSubmitDeposit}
          disabled={loading}
          className={`btn-3d w-full mt-4 py-4 rounded-2xl font-bold ${loading ? 'loading' : ''}`}
        >
          {loading ? 'SUBMITTING...' : 'I HAVE PAID'}
        </button>
      </div>
    </motion.div>
  );
};
