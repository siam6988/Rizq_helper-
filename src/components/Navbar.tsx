import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, Sun, Moon, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export const Navbar: React.FC<{ toggleSidebar: () => void }> = ({ toggleSidebar }) => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    if (theme === 'dark') {
      toast.info("Light Mode preview enabled (Visuals optimized for Dark Mode)");
      setTheme('light');
      document.body.classList.add('light-mode');
    } else {
      setTheme('dark');
      document.body.classList.remove('light-mode');
    }
  };

  return (
    <header className="px-5 py-4 flex justify-between items-center bg-[#020617b3] backdrop-blur-xl border-b border-border-glass sticky top-0 z-[1000] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4">
        {user && (
          <button onClick={toggleSidebar} className="p-1 cursor-pointer flex flex-col gap-1.5 focus:outline-none lg:hidden">
            <Menu className="text-white w-7 h-7" />
          </button>
        )}
        <Link to={user ? "/dashboard" : "/"} className="text-2xl font-extrabold text-white no-underline drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] flex items-center gap-2">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="var(--color-primary-light)">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="hidden sm:inline">RizQ<span className="text-primary-light">Helper</span></span>
        </Link>
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <button onClick={toggleTheme} className="hidden sm:flex text-white bg-white/5 p-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-300" />}
        </button>
        {user ? (
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                <Wallet className="w-4 h-4 text-primary-light" />
                <span className="text-white font-black">{Number.isNaN(userData?.balance) ? '0.00' : (userData?.balance?.toFixed(2) || '0.00')}</span>
                <span className="text-text-dim text-xs font-bold uppercase mr-2">ISLM</span>
                <Link to="/store" className="bg-primary-light/20 text-primary-light text-xs font-bold px-2 py-1 rounded hover:bg-primary-light hover:text-black transition-colors">Buy</Link>
             </div>
             
             <div className={`hidden sm:flex items-center gap-1 font-bold text-xs uppercase px-2 py-1 rounded-md border ${
                userData?.level === 'Gold' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                userData?.level === 'Silver' ? 'bg-gray-400/10 text-gray-400 border-gray-400/20' :
                'bg-amber-700/10 text-amber-600 border-amber-700/20'
             }`}>
                {userData?.level || 'Bronze'}
             </div>

             <div className="text-white font-bold text-sm tracking-wide bg-primary-dark/20 px-4 py-2 rounded-full border border-primary-light/30">
               {userData?.name || user.email?.split('@')[0]}
             </div>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/auth')}
            className="btn-3d px-6 py-2.5 text-sm font-bold rounded-xl shadow-[0_4px_0_var(--color-primary-shadow)]"
          >
            LOGIN
          </button>
        )}
      </div>
    </header>
  );
};
