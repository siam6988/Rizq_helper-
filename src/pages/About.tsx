import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Coins, Users, Zap } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-10"
    >
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-white drop-shadow-[0_5px_15px_rgba(16,185,129,0.3)] mb-4">
          About RizQ <span className="text-primary-light">Helper</span>
        </h1>
        <p className="text-text-dim text-lg max-w-2xl mx-auto">
          We are building the most secure, rewarding, and transparent halal-friendly PTC (Paid-To-Click) platform powered by the HAQQ network and ISLM.
        </p>
      </div>

      <div className="glass-card p-10 rounded-3xl mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
        <p className="text-text-dim leading-relaxed mb-6">
          RizQ Helper was created with a clear vision: to provide a fair and equitable platform where users can earn cryptocurrency for their time, and advertisers can get high-quality, bot-free traffic to their projects. We believe in the principles of ethical finance, which is why we chose the HAQQ network and Islamic Coin (ISLM) as our primary currency.
        </p>
        <p className="text-text-dim leading-relaxed">
          Through advanced anti-bot measures, dynamic gamification, and a transparent reward system, we ensure that every interaction on our platform brings genuine value to both earners and advertisers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/30 p-8 rounded-3xl border border-white/5">
          <Shield className="w-12 h-12 text-primary-light mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Bot-Free & Secure</h3>
          <p className="text-text-dim">
            We use enterprise-grade location detection, strict VPN/Proxy blocking, and invisible CAPTCHA to guarantee 100% human traffic.
          </p>
        </div>
        <div className="bg-black/30 p-8 rounded-3xl border border-white/5">
          <Coins className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Fair Compensation</h3>
          <p className="text-text-dim">
            No middleman fees inflating the cost. We pass the majority of advertising revenue directly to the users completing the tasks.
          </p>
        </div>
        <div className="bg-black/30 p-8 rounded-3xl border border-white/5">
          <Users className="w-12 h-12 text-blue-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Community Driven</h3>
          <p className="text-text-dim">
            With our 20% referral system and global leaderboards, we encourage community growth and team-level earnings.
          </p>
        </div>
        <div className="bg-black/30 p-8 rounded-3xl border border-white/5">
          <Zap className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Gamified Experience</h3>
          <p className="text-text-dim">
            Level up from Bronze to Gold to permanently boost your earning multipliers and unlock premium offerwalls.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
