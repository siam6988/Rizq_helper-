import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const DesktopMate: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const tips = [
    "Konnichiwa! Check the Earn Station daily for fresh tasks!",
    "Tap the Offerwalls for massive ISLM rewards! ✨",
    "Did you know? Referring friends gives you a passive income! 💸",
    "Sugoi! You are doing great! Keep it up!",
    "Bounty Station has high-paying tasks. Don't miss out! 🚀"
  ];

  useEffect(() => {
    // Randomly show advice every 15-30 seconds
    const showAdvice = () => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setMessage(randomTip);
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    };

    const intervalId = setInterval(showAdvice, 30000);
    setTimeout(showAdvice, 5000); // Show first advice after 5s

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-4 bg-slate-800 text-white p-4 rounded-2xl rounded-br-sm shadow-2xl border-2 border-emerald-500/50 max-w-[220px] pointer-events-auto cursor-help"
            onClick={() => setIsVisible(false)}
          >
            <p className="font-bold text-sm leading-tight text-center">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-24 h-24 sm:w-28 sm:h-28 pointer-events-auto cursor-pointer group"
        onClick={() => {
           const randomTip = tips[Math.floor(Math.random() * tips.length)];
           setMessage(randomTip);
           setIsVisible(true);
           setTimeout(() => setIsVisible(false), 5000);
        }}
      >
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/40 transition-colors"></div>
        <img 
           src="/anime_character.png" 
           alt="Helper Mate" 
           className="w-full h-full object-cover rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] border-4 border-emerald-500 bg-slate-800"
           onError={(e) => { 
             e.currentTarget.src = 'https://api.dicebear.com/7.x/miniavs/svg?seed=Kitty'; 
           }}
        />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-black border-2 border-slate-900 shadow-md">
          ?
        </div>
      </motion.div>
    </div>
  );
};
