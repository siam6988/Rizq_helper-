import React from 'react';
import { motion } from 'framer-motion';
import { AdBanner } from '../components/AdBanner';

export const Offerwalls: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <AdBanner slot="offerwalls_top" className="mb-6" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 border-b border-border-glass pb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-white drop-shadow-[0_5px_15px_rgba(16,185,129,0.3)] mb-3">Offerwalls</h2>
          <p className="text-text-dim text-lg font-medium leading-relaxed">
            Complete high-paying surveys and app downloads.
          </p>
        </div>
      </div>

      <AdBanner slot="offerwalls_mid" className="mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-primary-light/30 transition-all group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">CPALead</h3>
            <span className="bg-primary-dark/30 text-primary-light text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Top Network</span>
          </div>
          <p className="text-text-dim mb-8">Install apps, play games, and complete simple offers to earn massive crypto rewards instantly.</p>
          <button className="btn-3d w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform">
            OPEN CPALEAD
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-primary-light/30 transition-all group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">BitLabs</h3>
            <span className="bg-purple-900/40 text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Premium Surveys</span>
          </div>
          <p className="text-text-dim mb-8">Share your opinion on premium surveys. Highly optimized for fast completions and huge payouts.</p>
          <button className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_5px_10px_rgba(147,51,234,0.3)] w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform">
            OPEN BITLABS
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-all group opacity-80 mt-6 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-white">Watch & Earn</h3>
            <span className="bg-blue-900/40 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider hidden sm:block">Coming Soon</span>
          </div>
          <p className="text-text-dim text-sm">Watch short promotional videos and get paid automatically. Feature unlocks at Level Silver.</p>
        </div>
      </div>

      <AdBanner slot="offerwalls_bottom1" className="mt-8" />
      <AdBanner slot="offerwalls_bottom2" className="mt-6" />

    </motion.div>
  );
};
