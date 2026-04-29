import React from 'react';
import { motion } from 'framer-motion';

export const AdBanner: React.FC<{ slot?: string; className?: string }> = ({ slot, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`glass-card flex items-center justify-center rounded-2xl border border-white/5 bg-black/20 overflow-hidden relative w-full h-full min-h-[60px] sm:min-h-[80px] p-2 sm:p-4 ${className}`}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      <div className="text-center relative z-10 w-full px-2 sm:px-4">
        <p className="text-text-dim text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-1 truncate">Advertisement</p>
        <div className="flex items-center justify-center w-full">
          {slot ? (
             <p className="text-white/30 text-[10px] sm:text-xs md:text-sm font-mono truncate max-w-full">Slot: {slot}</p>
          ) : (
             <p className="text-white/30 text-[10px] sm:text-xs md:text-sm font-mono truncate max-w-full">Space available for AD</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
