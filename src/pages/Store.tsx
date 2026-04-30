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
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success && sessionId && !verifying) {
      setVerifying(true);
      verifyPayment(sessionId);
    } else if (canceled) {
      toast.error('Payment was canceled');
      navigate('/store');
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
     try {
        const response = await fetch('/api/verify-session', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ session_id: sessionId })
        });
        const data = await response.json();
        if (response.ok && data.success) {
           toast.success(`Successfully purchased ${data.amountISLM} ISLM`);
           await refreshUserData();
        } else {
           toast.error(data.error || 'Failed to verify payment');
        }
     } catch (e: any) {
        toast.error('Error verifying payment');
     } finally {
        setVerifying(false);
        navigate('/store');
     }
  };

  const handleCheckout = async () => {
    const amt = parseFloat(purchaseAmount);
    if (!amt || amt < 10) return toast.error("Minimum purchase is 10 ISLM");
    if (!auth.currentUser) return toast.error("Please login to purchase");

    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            uid: auth.currentUser.uid,
            amountISLM: amt
         })
      });

      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || "Failed to create checkout session");
      }
      
      if (data.url) {
         window.location.href = data.url;
      }
    } catch(e: any) {
      toast.error("Error: " + e.message);
      setLoading(false);
    }
  };

  const costUSD = (parseFloat(purchaseAmount) || 0) * 0.05;

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
            <h2 className="text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">ISLM Store</h2>
            <p className="text-text-dim text-sm font-semibold">Purchase ISLM for campaigns securely</p>
         </div>
      </div>
      
      <div className="space-y-5">
        <div>
          <label className="text-primary-light font-bold text-sm block mb-2">Amount of ISLM</label>
          <input 
            type="number"
            placeholder="Min 10 ISLM"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
            className="custom-input p-4 rounded-xl w-full font-bold text-base text-center text-2xl"
          />
        </div>
        
        <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
           <p className="text-text-dim text-sm font-bold uppercase tracking-wider mb-1">Total Cost (USD)</p>
           <p className="text-3xl font-black text-white">${costUSD.toFixed(2)}</p>
        </div>
        
        <button 
          onClick={handleCheckout}
          disabled={loading || verifying}
          className={`btn-3d w-full mt-4 py-4 rounded-2xl font-bold ${loading || verifying ? 'loading' : ''}`}
        >
          {loading ? 'REDIRECTING TO STRIPE...' : verifying ? 'VERIFYING...' : 'CHECKOUT'}
        </button>
        
        <p className="text-text-dim text-xs mt-4 text-center font-medium">Payments are securely processed by Stripe. Your card details are never stored on our servers.</p>
      </div>
    </motion.div>
  );
};
