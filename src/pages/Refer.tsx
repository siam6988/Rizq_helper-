import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Twitter, Facebook, MessageCircle, Send, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const Refer: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalSignedUp: 0, totalWithdrawn: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const refLink = user ? `${window.location.origin}/auth?ref=${user.uid}` : 'Login to get your referral link';

  useEffect(() => {
    if (!user) {
      setLoadingStats(false);
      return;
    }
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/referral-stats/${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalSignedUp: data.totalSignedUp || 0,
            totalWithdrawn: data.totalWithdrawn || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch referral stats", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [user]);

  const copyRef = () => {
    if (!user) return toast.error("Please login first!");
    navigator.clipboard.writeText(refLink)
      .then(() => toast.success("Link Copied!"))
      .catch((err) => console.error("Clipboard copy failed", err));
  };

  const shareText = "Join RizQ Helper and earn crypto rewards! Sign up using my link: ";
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(refLink);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    if (!user) return toast.error("Please login first!");
    window.open(shareLinks[platform], '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card max-w-lg mx-auto p-8 text-center rounded-3xl"
    >
      <h2 className="text-primary-light mb-4 text-4xl font-bold drop-shadow-[0_5px_15px_rgba(16,185,129,0.3)]">Refer & Earn</h2>
      <p className="text-text-dim text-base leading-relaxed font-semibold mb-8">
        Earn a <b>10% commission</b> exclusively when your invited friend makes their <b>FIRST withdrawal!</b>
      </p>
      
      {/* Referral Stats Tracker */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
          <Users className="w-8 h-8 text-blue-400 mb-2 opacity-80" />
          <h3 className="text-3xl font-black text-white">{loadingStats ? '-' : stats.totalSignedUp}</h3>
          <p className="text-text-dim text-xs font-bold uppercase mt-1 text-center">Friends<br/>Joined</p>
        </div>
        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5">
            <CheckCircle className="w-12 h-12" />
          </div>
          <CheckCircle className="w-8 h-8 text-primary-light mb-2 opacity-80" />
          <h3 className="text-3xl font-black text-white">{loadingStats ? '-' : stats.totalWithdrawn}</h3>
          <p className="text-text-dim text-xs font-bold uppercase mt-1 text-center">First<br/>Withdrawals</p>
        </div>
      </div>
      
      <input 
        type="text"
        readOnly
        value={refLink}
        onClick={(e) => (e.target as HTMLInputElement).select()}
        className="w-full p-5 rounded-xl text-center text-primary-light font-bold bg-[rgba(16,185,129,0.1)] border-2 border-primary-light/50 outline-none mb-6 cursor-text"
      />
      
      <button 
        onClick={copyRef}
        className="btn-3d w-full py-4 rounded-2xl text-sm mb-6"
      >
        COPY LINK
      </button>

      <div className="pt-6 border-t border-border-glass">
        <p className="text-text-dim text-sm font-semibold mb-4 text-center">Share your link directly</p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => handleShare('twitter')}
            className="p-3 rounded-full bg-[#1DA1F2]/20 text-[#1DA1F2] hover:bg-[#1DA1F2]/30 transition-colors border border-[#1DA1F2]/30"
            title="Share on Twitter"
          >
            <Twitter size={24} />
          </button>
          <button 
            onClick={() => handleShare('facebook')}
            className="p-3 rounded-full bg-[#1877F2]/20 text-[#1877F2] hover:bg-[#1877F2]/30 transition-colors border border-[#1877F2]/30"
            title="Share on Facebook"
          >
            <Facebook size={24} />
          </button>
          <button 
            onClick={() => handleShare('whatsapp')}
            className="p-3 rounded-full bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors border border-[#25D366]/30"
            title="Share on WhatsApp"
          >
            <MessageCircle size={24} />
          </button>
          <button 
            onClick={() => handleShare('telegram')}
            className="p-3 rounded-full bg-[#0088cc]/20 text-[#0088cc] hover:bg-[#0088cc]/30 transition-colors border border-[#0088cc]/30"
            title="Share on Telegram"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
