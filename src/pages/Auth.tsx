import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, country, deviceId, refreshUserData } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Fields required");
    if (email.includes('+')) return toast.error("SECURITY ALERT: Alias emails are not allowed.");

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
      toast.error(err.message || "Authentication failed");
    }
    setLoading(false);
  };

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="glass-card max-w-md mx-auto my-10 p-8 rounded-3xl">
      <h2 className="mb-6 text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
        {isLogin ? 'Login' : 'Create Account'}
      </h2>
      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="custom-input p-4 rounded-xl text-base font-bold w-full"
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="custom-input p-4 rounded-xl text-base font-bold w-full"
        />
        
        <p className="text-[13px] text-text-dim font-semibold my-2 text-center leading-relaxed">
          By clicking continue you agree with our{' '}
          <a href="#" className="text-primary-light underline">terms & conditions</a>.
        </p>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-3d w-full mt-2 py-4 rounded-2xl text-sm"
        >
          {loading ? 'PLEASE WAIT...' : 'CONTINUE'}
        </button>
      </form>

      <p 
        onClick={() => setIsLogin(!isLogin)} 
        className="text-center mt-8 text-primary-light cursor-pointer font-extrabold uppercase text-sm tracking-wide"
      >
        {isLogin ? 'New user? Register Here' : 'Already have an account? Login'}
      </p>
    </div>
  );
};
