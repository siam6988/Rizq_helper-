import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../services/firebase';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { isHaram } from '../utils/haramBlocker';

export const Advertiser: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [adTitle, setAdTitle] = useState('');
  const [adUrl, setAdUrl] = useState('https://yourwebsite.com');
  const [adDuration, setAdDuration] = useState('15');
  const [adViews, setAdViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);

  // Pricing:
  // 15 seconds = 0.5 Balance per view
  // 30 seconds = 1.0 Balance per view
  // 60 seconds = 2.0 Balance per view
  
  const getCostPerView = (duration: string) => {
    switch (duration) {
      case '15': return 0.5;
      case '30': return 1.0;
      case '60': return 2.0;
      default: return 0.5;
    }
  };

  const costPerView = getCostPerView(adDuration);
  const totalCost = (parseInt(adViews) || 0) * costPerView;

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle || !adUrl || !adViews || parseInt(adViews) < 10) {
      return toast.error("Please fill all fields. Minimun 10 views required.");
    }
    if (!adUrl.startsWith('http://') && !adUrl.startsWith('https://')) {
      return toast.error("URL must start with http:// or https://");
    }

    if (!userData || !auth.currentUser) return;

    if (userData.balance < totalCost) {
      return toast.error("Insufficient balance to create this campaign.");
    }

    setAiScanning(true);
    
    // Simulate AI Scanner Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (isHaram(adTitle) || isHaram(adUrl)) {
      setAiScanning(false);
      return toast.error("🚨 AI Sentinel Blocked Ad! Haram Content Detected! No mercy 😊.");
    }

    setAiScanning(false);
    setLoading(true);

    try {
      // Create campaign in globally available tasks collection
      // Ad admin handles ~20% cut for business logic, 80% goes to users.
      // So reward to user will be costPerView * 0.8;
      const userReward = costPerView * 0.8;
      
      await addDoc(collection(db, "ptx_tasks"), {
        title: adTitle,
        url: adUrl,
        duration: parseInt(adDuration),
        reward: userReward,
        totalViews: parseInt(adViews),
        currentViews: 0,
        advertiserId: auth.currentUser.uid,
        createdAt: Date.now(),
        status: 'active'
      });

      // Deduct balance
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { balance: increment(-totalCost) });
      
      toast.success("Campaign created successfully!");
      setAdTitle('');
      setAdUrl('');
      setAdViews('');
      
      await refreshUserData();
    } catch(err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card max-w-2xl mx-auto p-10 rounded-3xl"
    >
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">Advertiser Panel</h2>
          <p className="text-text-dim mt-2 font-medium">Create PTC campaigns to drive traffic</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-dim mb-1 font-bold">Available Balance</p>
          <div className="text-2xl font-black text-primary-light">
            {userData?.balance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-black/30 p-6 rounded-2xl border border-white/10 mb-8">
        <h3 className="text-white font-bold mb-4">Create New Campaign</h3>
        <form onSubmit={handleCreateAd} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-text-dim block mb-1">Ad Title</label>
            <input 
              type="text" 
              value={adTitle}
              onChange={e => setAdTitle(e.target.value)}
              placeholder="E.g., Join my crypto project"
              className="custom-input p-3 w-full rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-text-dim block mb-1">Target URL</label>
            <div className={`flex items-center bg-black/50 border transition-colors rounded-xl overflow-hidden ${
                adUrl && !adUrl.startsWith('http://') && !adUrl.startsWith('https://') 
                  ? 'border-red-500/50 focus-within:border-red-500' 
                  : 'border-white/10 focus-within:border-primary-light'
              }`}>
              <div className="px-3 text-text-dim border-r border-white/10 bg-black/40">URL</div>
              <input 
                type="url" 
                value={adUrl}
                onChange={e => setAdUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="bg-transparent text-white p-3 w-full outline-none"
              />
            </div>
            {adUrl && !adUrl.startsWith('http://') && !adUrl.startsWith('https://') && (
              <p className="text-red-400 text-xs font-bold mt-1">⚠️ URL must start with http:// or https://</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-text-dim block mb-1">Duration (Seconds)</label>
              <select 
                value={adDuration}
                onChange={e => setAdDuration(e.target.value)}
                className="custom-input p-3 w-full rounded-xl"
              >
                <option value="15">15 Seconds</option>
                <option value="30">30 Seconds</option>
                <option value="60">60 Seconds</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-text-dim block mb-1">
                Number of Views
              </label>
              <input 
                type="number" 
                value={adViews}
                onChange={e => setAdViews(e.target.value)}
                placeholder="10"
                min="1"
                className={`custom-input p-3 w-full rounded-xl transition-colors ${parseInt(adViews) < 10 && adViews !== '' ? 'border-yellow-500/50 focus:border-yellow-500' : ''}`}
              />
              {parseInt(adViews) < 10 && adViews !== '' && (
                 <p className="text-yellow-500 text-xs font-bold mt-1 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Minimum requirement is 10 views</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-end mt-6 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-text-dim font-bold uppercase tracking-widest">Rate details</p>
              <p className="text-white font-medium flex justify-between gap-4">
                 <span>Cost Per View:</span>
                 <span className="text-primary-light font-bold">{costPerView.toFixed(2)} pts</span>
              </p>
              <p className="text-white font-medium flex justify-between gap-4">
                 <span>Total Views:</span>
                 <span className="font-bold">{parseInt(adViews) || 0}</span>
              </p>
               <div className="h-px w-full bg-white/10 my-2"></div>
              <p className="text-lg text-white font-black flex justify-between gap-4">
                 <span>Total Cost:</span>
                 <span className="text-yellow-500">{totalCost.toFixed(2)} pts</span>
              </p>
            </div>
            <button 
              type="submit" 
              disabled={loading || aiScanning || totalCost > (userData?.balance || 0) || totalCost === 0 || !adUrl.startsWith('http')}
              className="btn-3d px-8 py-3 rounded-2xl font-bold flex items-center justify-center min-w-[200px]"
            >
              {aiScanning ? (
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                   <span>AI CHECKING...</span>
                </div>
              ) : loading ? 'CREATING...' : 'PAY & PUBLISH'}
            </button>
          </div>
        </form>
      </div>

    </motion.div>
  );
}
