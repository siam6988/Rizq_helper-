import React from 'react';
import { NavLink } from 'react-router-dom';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Wallet, CreditCard, Users, User, LogOut, X, Trophy, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar: React.FC<{ isOpen: boolean; toggleSidebar: () => void }> = ({ isOpen, toggleSidebar }) => {
  const handleLogout = async () => {
    await signOut(auth);
    toggleSidebar();
  };

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-4 px-6 py-4 rounded-xl font-bold transition-all duration-300 ${
      isActive
        ? 'bg-[rgba(5,150,105,0.15)] text-primary-light border border-[rgba(16,185,129,0.3)] shadow-[inset_0_2px_10px_rgba(16,185,129,0.1)] translate-x-1'
        : 'text-text-dim hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-6 lg:hidden px-2">
        <span className="text-white font-extrabold text-xl tracking-widest drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]">Menu</span>
        <button onClick={toggleSidebar} className="text-white bg-white/5 p-2 rounded-full border border-white/10 hover:bg-white/10">
          <X size={24} />
        </button>
      </div>

      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
        <NavLink to="/dashboard" onClick={toggleSidebar} className={navClass}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/earn" onClick={toggleSidebar} className={navClass}>
          <Wallet size={20} /> Earn Station
        </NavLink>
        <NavLink to="/offerwalls" onClick={toggleSidebar} className={navClass}>
          <CreditCard size={20} /> Offerwalls
        </NavLink>
        <NavLink to="/leaderboard" onClick={toggleSidebar} className={navClass}>
          <Trophy size={20} /> Leaderboard
        </NavLink>
        <NavLink to="/advertiser" onClick={toggleSidebar} className={navClass}>
          <Megaphone size={20} /> Advertiser Panel
        </NavLink>
        <NavLink to="/withdraw" onClick={toggleSidebar} className={navClass}>
          <CreditCard size={20} /> Withdraw
        </NavLink>
        <NavLink to="/refer" onClick={toggleSidebar} className={navClass}>
          <Users size={20} /> Referrals
        </NavLink>
        <NavLink to="/profile" onClick={toggleSidebar} className={navClass}>
          <User size={20} /> Profile
        </NavLink>
        
        <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-4 rounded-xl mt-4 text-red-500 font-bold hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all text-left">
          <LogOut size={20} /> Sign Out
        </button>
      </nav>

      <div className="mt-auto pt-5 border-t border-border-glass flex flex-col gap-3 pb-8 lg:pb-0 px-6">
        <NavLink to="/about" onClick={toggleSidebar} className="text-text-dim text-sm font-bold no-underline hover:text-white transition-colors">About Us</NavLink>
        <NavLink to="/contact" onClick={toggleSidebar} className="text-text-dim text-sm font-bold no-underline hover:text-white transition-colors">Contact Us</NavLink>
        <NavLink to="/privacy" onClick={toggleSidebar} className="text-text-dim text-sm font-bold no-underline hover:text-white transition-colors">Privacy Policy</NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[1500] lg:hidden backdrop-blur-sm"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed top-0 left-0 w-[280px] h-screen bg-[#020617fa] border-r border-border-glass z-[2000] p-5 shadow-[20px_0_50px_rgba(0,0,0,0.9)] lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-[74px] left-0 w-[280px] h-[calc(100vh-74px)] bg-transparent border-r border-border-glass z-[500] p-5 overflow-y-auto">
         {sidebarContent}
      </aside>
    </>
  );
};
