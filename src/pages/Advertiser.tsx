import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { isHaram } from '../utils/haramBlocker';
import { z } from 'zod';
import { AdBanner } from '../components/AdBanner';

const advertiserSchema = z.object({
  adTitle: z.string().min(5, "Title must be at least 5 characters"),
  adUrl: z.string().url("Must be a valid URL starting with http:// or https://"),
  adDuration: z.number().min(5, "Minimum duration is 5 seconds"),
  adViews: z.number().min(10, "Minimum views is 10"),
  rewardPerView: z.number().min(0.01, "Minimum reward is 0.01 ISLM"),
});

export const Advertiser: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [adTitle, setAdTitle] = useState('');
  const [adUrl, setAdUrl] = useState('https://yourwebsite.com');
  const [adDuration, setAdDuration] = useState('15');
  const [adViews, setAdViews] = useState('');
  const [rewardPerView, setRewardPerView] = useState('0.1');
  const [loading, setLoading] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);

  const parsedReward = parseFloat(rewardPerView) || 0;
  const parsedViews = parseInt(adViews) || 0;
  const parsedDuration = parseInt(adDuration) || 0;
  
  const subTotal = parsedReward * parsedViews;
  const adminFee = subTotal * 0.20;
  const totalCost = subTotal + adminFee;

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastSubmit < 2000) {
      toast.error('Please wait a moment before submitting again.');
      return;
    }

    try {
      advertiserSchema.parse({
        adTitle,
        adUrl,
        adDuration: parsedDuration,
        adViews: parsedViews,
        rewardPerView: parsedReward
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
      return;
    }

    if (!userData || !auth.currentUser) return;

    if (userData.balance < totalCost) {
      return toast.error("Insufficient balance to create this campaign.");
    }

    setAiScanning(true);
    setLoading(true);
    setLastSubmit(now);
    
    // Simulate AI Scanner Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (isHaram(adTitle) || isHaram(adUrl)) {
      setAiScanning(false);
      setLoading(false);
      return toast.error("🚨 AI Sentinel Blocked Ad! Haram Content Detected! No mercy 😊.");
    }

    setAiScanning(false);

    try {
      const response = await fetch('/api/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: auth.currentUser.uid,
          title: adTitle,
          url: adUrl,
          duration: parsedDuration,
          views: parsedViews,
          rewardPerView: parsedReward
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }
      
      toast.success("Campaign submitted for approval successfully!");
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
      <AdBanner slot="advertiser_top" className="mb-6" />

      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">P2P Halal Task Board</h2>
          <p className="text-text-dim mt-2 font-medium">Create ethical PTC campaigns to drive traffic</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-dim mb-1 font-bold">Available Balance</p>
          <div className="text-2xl font-black text-primary-light">
            {Number(userData?.balance || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <AdBanner slot="advertiser_mid1" className="mb-6" />

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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-text-dim block mb-1">Duration</label>
              <select 
                value={adDuration}
                onChange={e => setAdDuration(e.target.value)}
                className="custom-input p-3 w-full rounded-xl"
              >
                <option value="15">15s</option>
                <option value="30">30s</option>
                <option value="60">60s</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-text-dim block mb-1">
                Reward / View
              </label>
              <input 
                type="number" 
                value={rewardPerView}
                onChange={e => setRewardPerView(e.target.value)}
                placeholder="0.1"
                step="0.01"
                min="0.01"
                className="custom-input p-3 w-full rounded-xl transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-dim block mb-1">
                Views Needed
              </label>
              <input 
                type="number" 
                value={adViews}
                onChange={e => setAdViews(e.target.value)}
                placeholder="10"
                min="10"
                className={`custom-input p-3 w-full rounded-xl transition-colors ${parsedViews < 10 && adViews !== '' ? 'border-yellow-500/50 focus:border-yellow-500' : ''}`}
              />
            </div>
          </div>
          
          {parsedViews < 10 && adViews !== '' && (
            <p className="text-yellow-500 text-xs font-bold mt-1 flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Minimum requirement is 10 views</p>
          )}

          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-end mt-6 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-text-dim font-bold uppercase tracking-widest">Rate details</p>
              <p className="text-white font-medium flex justify-between gap-4">
                 <span>Subtotal:</span>
                 <span>{subTotal.toFixed(2)} ISLM</span>
              </p>
              <p className="text-white font-medium flex justify-between gap-4">
                 <span>Platform Fee (20%):</span>
                 <span className="text-red-400">+{adminFee.toFixed(2)} ISLM</span>
              </p>
               <div className="h-px w-full bg-white/10 my-2"></div>
              <p className="text-lg text-white font-black flex justify-between gap-4">
                 <span>Total Cost:</span>
                 <span className="text-yellow-500">{totalCost.toFixed(2)} ISLM</span>
              </p>
            </div>
            <button 
              type="submit" 
              disabled={loading || aiScanning || totalCost > (userData?.balance || 0) || totalCost === 0 || !adUrl.startsWith('http')}
              className={`btn-3d px-8 py-3 rounded-2xl font-bold flex items-center justify-center min-w-[200px] ${loading ? 'loading' : ''}`}
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

        <AdBanner slot="advertiser_mid2" className="mt-8" />
      </div>

      <AdBanner slot="advertiser_bottom1" className="mt-6" />
      <AdBanner slot="advertiser_bottom2" className="mt-6" />

    </motion.div>
  );
}
