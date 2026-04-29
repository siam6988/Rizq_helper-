import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const Profile: React.FC = () => {
  const { userData, refreshUserData, isVPN } = useAuth();
  const [name, setName] = useState(userData?.name || '');
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { name });
      toast.success("Profile Updated Successfully!");
      await refreshUserData();
    } catch (err: any) {
      toast.error("Error saving profile: " + err.message);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card max-w-lg mx-auto p-8 rounded-3xl"
    >
      <h2 className="mb-4 text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">My Profile</h2>
      <p className="text-text-dim text-sm font-semibold mb-8">Manage your personal details and location.</p>
      
      <div className="space-y-6">
        <div>
          <label className="text-primary-light font-bold text-sm block mb-2">Full Name</label>
          <input 
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="custom-input p-4 rounded-xl w-full font-bold"
          />
        </div>
        
        <div className="pt-4 mt-6 border-t border-border-glass">
            <h3 className="text-white font-bold mb-4">Gamification Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-text-dim text-xs font-bold mb-1 uppercase tracking-wider">Level</p>
                <p className={`text-lg font-black ${
                    userData?.level === 'Gold' ? 'text-yellow-500' :
                    userData?.level === 'Silver' ? 'text-gray-400' :
                    'text-amber-700'
                  }`}>{userData?.level || 'Bronze'}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-text-dim text-xs font-bold mb-1 uppercase tracking-wider">Daily Streak</p>
                <p className="text-white text-lg font-black">{userData?.dailyStreak || 1} 🔥</p>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-text-dim text-xs font-bold mb-1 uppercase tracking-wider">Trust Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-light" style={{ width: `${userData?.trustScore || 100}%` }}></div>
                  </div>
                  <span className="text-white text-sm font-bold">{userData?.trustScore || 100}%</span>
                </div>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-text-dim text-xs font-bold mb-1 uppercase tracking-wider">Total Tasks</p>
                <p className="text-white text-lg font-black">{userData?.tasks || 0}</p>
              </div>
            </div>
        </div>

        <div>
          <label className="text-primary-light font-bold text-sm block mb-2 mt-6">Country (Detected Securely)</label>
          <div className="flex bg-black/30 p-4 rounded-xl font-bold justify-between items-center border border-white/5">
            <span>{userData?.country || 'Detecting...'}</span>
            {isVPN && <span className="text-red-500 text-xs px-2 py-1 bg-red-500/10 rounded uppercase">VPN DETECTED</span>}
          </div>
        </div>
        
        <button 
          onClick={saveProfile}
          disabled={loading}
          className={`btn-3d w-full mt-4 py-4 rounded-2xl text-sm ${loading ? 'loading' : ''}`}
        >
          {loading ? 'SAVING...' : 'SAVE PROFILE'}
        </button>
      </div>
    </motion.div>
  );
};
