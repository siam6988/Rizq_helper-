import React from 'react';
import { motion } from 'framer-motion';

export const AdBanner: React.FC<{ slot?: string; className?: string; sticky?: boolean }> = ({ slot, className = '', sticky = false }) => {
  const adUnitId = sticky ? '2436098' : '2436091';

  if (sticky) {
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', padding: '5px' }}>
        <iframe 
          data-aa={adUnitId}
          src={`//ad.a-ads.com/${adUnitId}?size=320x50&background_color=transparent&title_color=067b13&title_hover_color=0a3206&text_color=18208e&link_color=000000&link_hover_color=ffffff`}
          style={{ border: 0, padding: 0, width: '320px', height: '50px', overflow: 'hidden', display: 'block', margin: 'auto' }}
        ></iframe>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`glass-card flex items-center justify-center rounded-2xl border border-white/5 bg-black/20 overflow-hidden relative w-full h-full min-h-[60px] sm:min-h-[80px] p-2 sm:p-4 ${className}`}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      <div className="text-center relative z-10 w-full px-2 sm:px-4">
        <p className="text-text-dim text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-1 truncate">Advertisement</p>
        <div className="flex items-center justify-center w-full mt-2">
           <div id="frame" style={{ width: '320px', margin: 'auto', zIndex: 99998, height: 'auto' }}>
             <iframe 
               data-aa={adUnitId} 
               src={`//ad.a-ads.com/${adUnitId}?size=320x50&background_color=transparent&title_color=067b13&title_hover_color=0a3206&text_color=18208e&link_color=000000&link_hover_color=ffffff`}
               style={{ border: 0, padding: 0, width: '320px', height: '50px', overflow: 'hidden', display: 'block', margin: 'auto' }}
             ></iframe>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
