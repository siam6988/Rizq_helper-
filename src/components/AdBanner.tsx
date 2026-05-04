import React from 'react';
import { motion } from 'framer-motion';

export const AdBanner: React.FC<{ slot?: string; className?: string; sticky?: boolean }> = ({ slot, className = '', sticky = false }) => {
  const adUnitId = sticky ? '2436098' : '2436091';
  const iframeSrc = `//ad.a-ads.com/${adUnitId}?size=320x50&background_color=transparent&title_color=10b981&title_hover_color=34d399&text_color=cbd5e1&link_color=10b981&link_hover_color=ffffff`;

  if (sticky) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[99999] flex justify-center bg-slate-900/80 backdrop-blur-md border-t border-emerald-500/20 p-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <iframe 
          data-aa={adUnitId}
          src={iframeSrc}
          style={{ border: 0, padding: 0, width: '320px', height: '50px', overflow: 'hidden', display: 'block', margin: 'auto' }}
        ></iframe>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card flex items-center justify-center rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-primary-dark/5 overflow-hidden relative w-full h-full min-h-[60px] sm:min-h-[80px] p-2 sm:p-4 shadow-lg group ${className}`}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
      
      <div className="text-center relative z-10 w-full px-2 sm:px-4">
        <p className="text-emerald-400/50 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-2 truncate group-hover:text-emerald-400/80 transition-colors">Sponsored</p>
        <div className="flex items-center justify-center w-full relative">
           <div id="frame" style={{ width: '320px', margin: 'auto', zIndex: 99998, height: 'auto', position: 'relative' }}>
             <iframe 
               data-aa={adUnitId} 
               src={iframeSrc}
               style={{ border: 0, padding: 0, width: '320px', height: '50px', overflow: 'hidden', display: 'block', margin: 'auto' }}
             ></iframe>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
