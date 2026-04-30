import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);
  const navigate = useNavigate();
  const { user, loading: authLoading, country, deviceId, refreshUserData } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email, password });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
      return;
    }

    if (email.includes('+')) return toast.error("SECURITY ALERT: Alias emails are not allowed.");

    const now = Date.now();
    if (now - lastSubmit < 2000) {
      toast.error('Please wait a moment before trying again.');
      return;
    }
    
    setLastSubmit(now);
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
      } else {
        // Multi-Account Detection
        if (deviceId) {
           const usersRef = collection(db, 'users');
           const q = query(usersRef, where('fingerprints', 'array-contains', deviceId));
           const snap = await getDocs(q);
           if (!snap.empty) {
               throw new Error("DEVICE_BANNED: This device is already registered. Multi-accounting is strictly prohibited to protect advertisers.");
           }
        }

        const res = await createUserWithEmailAndPassword(auth, email, password);
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');

        await setDoc(doc(db, "users", res.user.uid), { 
          balance: 0, 
          tasks: 0, 
          refBy: refCode || null, 
          country: country !== 'Detecting...' ? country : 'Global', 
          name: email.split('@')[0], 
          completedTasks: {}, 
          hasWithdrawn: false,
          dailyStreak: 1,
          lastLogin: Date.now(),
          level: 'Bronze',
          trustScore: 100,
          fingerprints: deviceId ? [deviceId] : []
        });
        toast.success("Account created successfully!");
      }
      await refreshUserData();
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        toast.error("Invalid email or password. If you don't have an account, please register first.");
      } else {
        toast.error(err.message || "Authentication failed");
      }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (ua.indexOf("FBAV") > -1 || ua.indexOf("Instagram") > -1 || ua.indexOf("Telegram") > -1) {
      toast.error("Google Login may not work inside Telegram/Facebook. Please open this link in Chrome/Safari to continue with Google.", { duration: 8000 });
      // We still try to proceed, but at least the user is warned why it might fail.
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');

      const userRef = doc(db, 'users', res.user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        if (deviceId) {
           const usersRef = collection(db, 'users');
           const q = query(usersRef, where('fingerprints', 'array-contains', deviceId));
           const snap = await getDocs(q);
           if (!snap.empty) {
               throw new Error("DEVICE_BANNED: This device is already registered. Multi-accounting is strictly prohibited to protect advertisers.");
           }
        }
        await setDoc(userRef, {
          balance: 0, 
          tasks: 0, 
          refBy: refCode || null, 
          country: country !== 'Detecting...' ? country : 'Global', 
          name: res.user.displayName || res.user.email?.split('@')[0] || 'User', 
          completedTasks: {}, 
          hasWithdrawn: false,
          dailyStreak: 1,
          lastLogin: Date.now(),
          level: 'Bronze',
          trustScore: 100,
          fingerprints: deviceId ? [deviceId] : []
        });
      }

      await refreshUserData();
      toast.success("Welcome!");
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || "Google authentication failed");
    }
    setLoading(false);
  };

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="glass-card max-w-md mx-auto my-10 p-8 rounded-3xl"
    >
      <h2 className="mb-6 text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
        <AnimatePresence mode="wait">
          <motion.span
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {isLogin ? 'Login' : 'Create Account'}
          </motion.span>
        </AnimatePresence>
      </h2>
      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="custom-input p-4 rounded-xl text-base font-bold w-full focus:ring-2 focus:ring-primary-light transition-all outline-none"
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="custom-input p-4 rounded-xl text-base font-bold w-full focus:ring-2 focus:ring-primary-light transition-all outline-none"
        />
        
        <p className="text-[13px] text-text-dim font-semibold my-2 text-center leading-relaxed">
          By clicking continue you agree with our{' '}
          <a href="#" className="text-primary-light underline hover:text-white transition-colors">terms & conditions</a>.
        </p>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          disabled={loading}
          className={`btn-3d w-full mt-2 py-4 rounded-2xl text-sm ${loading ? 'loading' : ''}`}
        >
          {loading ? 'PLEASE WAIT...' : 'CONTINUE'}
        </motion.button>
      </form>

      <div className="my-6 flex items-center justify-center space-x-2">
        <div className="h-px w-full bg-white/10"></div>
        <span className="text-xs text-text-dim font-semibold uppercase tracking-wider">or</span>
        <div className="h-px w-full bg-white/10"></div>
      </div>

      {(() => {
        const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
        const isInApp = ua.indexOf("FBAV") > -1 || ua.indexOf("Instagram") > -1 || ua.indexOf("Telegram") > -1;
        if (isInApp) {
           return (
             <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied! Open Chrome/Safari and paste to login with Google.");
              }}
              className="w-full flex items-center justify-center gap-3 bg-yellow-500/20 text-yellow-300 py-4 rounded-2xl font-bold transition-all hover:bg-yellow-500/30 mb-4"
             >
               ⚠️ Copy Link (Open in Chrome)
             </motion.button>
           );
        }
        return null;
      })()}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-bold transition-all hover:bg-gray-100 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
          </g>
        </svg>
        Continue with Google
      </motion.button>

      <p 
        onClick={() => setIsLogin(!isLogin)} 
        className="text-center mt-8 text-primary-light cursor-pointer font-extrabold uppercase text-sm tracking-wide transition-colors hover:text-white"
      >
        {isLogin ? 'New user? Register Here' : 'Already have an account? Login'}
      </p>
    </motion.div>
  );
};
