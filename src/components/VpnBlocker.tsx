import React from 'react';
import { useAuth } from '../context/AuthContext';

export const VpnBlocker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isVPN, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#020617] z-[99999] flex flex-col items-center justify-center transition-all bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#064e3b] via-[#020617] to-[#020617]">
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-2xl bg-primary-dark relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-pulse mb-8 border border-primary-light/50 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary-light/40 to-transparent"></div>
             <div className="absolute inset-2 border-2 border-white/50 rounded-xl flex items-center justify-center">
                <span className="text-white text-4xl font-black tracking-tighter">RH</span>
             </div>
             
             {/* Spinning border effect overlay */}
             <div className="absolute inset-0 border-4 border-transparent border-t-primary-light border-b-primary-light rounded-2xl animate-spin shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-widest drop-shadow-[0_2px_10px_rgba(16,185,129,0.5)] mb-4 flex items-center gap-2">
            RizQ<span className="text-primary-light">Helper</span>
          </h1>
          
          <div className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-full border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
            <div className="w-3 h-3 rounded-full bg-primary-light animate-ping"></div>
            <p className="text-text-dim font-bold tracking-widest uppercase text-sm">
              Initializing Experience
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isVPN) {
    return (
      <div className="fixed inset-0 bg-[#020617f0] z-[100000] flex flex-col items-center justify-center p-5 text-center backdrop-blur-md">
        <div className="bg-gradient-to-br from-[#450a0a] to-[#020617] border-2 border-red-500 rounded-3xl p-10 w-full max-w-md shadow-[0_30px_60px_rgba(239,68,68,0.3),inset_0_2px_5px_rgba(255,255,255,0.1)]">
          <div className="flex flex-col items-center mb-8">
            <div className="text-8xl mb-6 shrink-0 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]" style={{ animation: 'pulseRed 2s infinite ease-in-out' }}>🛡️</div>
            <div className="flex items-center gap-3 mb-3 bg-red-950/40 px-6 py-3 rounded-2xl border border-red-500/20">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="var(--color-primary-light)" className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <h2 className="text-white font-black text-3xl tracking-widest drop-shadow-md">RizQ<span className="text-primary-light">Sentinel</span></h2>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          </div>
          <h1 className="text-red-500 mb-4 text-3xl font-extrabold drop-shadow-[0_5px_15px_rgba(239,68,68,0.5)]">ACCESS DENIED</h1>
          <p className="text-text-dim text-base font-semibold leading-relaxed mb-6">
            Our Sentinel Engine has detected a <b>VPN, Proxy, or Datacenter IP</b>.
            <br /><br />
            To protect our advertisers and maintain task quality, you must disable your VPN to access RizQ Helper.
          </p>
          <button 
            className="btn-3d w-full py-4 text-sm font-extrabold rounded-2xl"
            style={{ background: 'linear-gradient(to bottom, #ef4444, #991b1b)', boxShadow: '0 8px 0 #7f1d1d' }}
            onClick={() => window.location.reload()}
          >
            RELOAD SECURELY
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
