import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User, signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { runSecurityAndFetchCountry } from '../services/security';

export interface UserData {
  balance: number;
  tasks: number;
  refBy?: string | null;
  country: string;
  name: string;
  completedTasks: Record<string, number>;
  hasWithdrawn: boolean;
  dailyStreak: number;
  lastLogin: number;
  level: 'Bronze' | 'Silver' | 'Gold';
  trustScore: number;
  fingerprints: string[];
  isVIP?: boolean;
  vipExpiryDate?: number;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  country: string;
  isVPN: boolean;
  deviceId: string;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  country: 'Detecting...',
  isVPN: false,
  deviceId: '',
  loading: true,
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const calculateLevel = (tasks: number): 'Bronze' | 'Silver' | 'Gold' => {
  if (tasks >= 200) return 'Gold';
  if (tasks >= 50) return 'Silver';
  return 'Bronze';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [country, setCountry] = useState<string>('Detecting...');
  const [isVPN, setIsVPN] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const countryRef = useRef<string>('Detecting...');
  const deviceRef = useRef<string>('');

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');

  useEffect(() => {
    runSecurityAndFetchCountry().then(({ country: detectedCountry, isVPN: detectedVPN, deviceId: detectedDevice }) => {
      setCountry(detectedCountry);
      setIsVPN(detectedVPN);
      setDeviceId(detectedDevice);
      countryRef.current = detectedCountry;
      deviceRef.current = detectedDevice;
    });

    const initTelegramAuth = async () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.initDataUnsafe?.user) {
        tg.ready();
        const twaUser = tg.initDataUnsafe.user;
        try {
          const res = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: twaUser })
          });
          const data = await res.json();
          if (data.token) {
            await signInWithCustomToken(auth, data.token);
          }
        } catch (e) {
          console.error("Telegram Auto-Auth Error:", e);
        }
      }
    };
    initTelegramAuth();
  }, []);

  const refreshUserData = async () => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const snap = await getDoc(userRef);
      
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      let data: UserData;
      if (!snap.exists()) {
        const name = auth.currentUser.email ? auth.currentUser.email.split('@')[0] : 'User';
        data = {
          balance: 0,
          tasks: 0,
          refBy: refCode || null,
          country: countryRef.current !== 'Detecting...' ? countryRef.current : 'Global',
          name,
          completedTasks: {},
          hasWithdrawn: false,
          dailyStreak: 1,
          lastLogin: now,
          level: 'Bronze',
          trustScore: 100,
          fingerprints: deviceRef.current ? [deviceRef.current] : []
        };
        await setDoc(userRef, data);
      } else {
        const rawData = snap.data() as any;
        data = {
          ...rawData,
          balance: Number(rawData.balance) || 0,
          tasks: Number(rawData.tasks) || 0,
          dailyStreak: Number(rawData.dailyStreak) || 1,
          trustScore: Number(rawData.trustScore) || 100,
        } as UserData;
        
        let needsUpdate = false;
        const updates: Partial<UserData> = {};

        // Gamification: Daily Streak
        if (data.lastLogin) {
          const daysSinceLastLogin = (now - data.lastLogin) / oneDay;
          if (daysSinceLastLogin >= 1 && daysSinceLastLogin < 2) {
            updates.dailyStreak = (data.dailyStreak || 0) + 1;
            updates.lastLogin = now;
            needsUpdate = true;
          } else if (daysSinceLastLogin >= 2) {
            updates.dailyStreak = 1; // Reset streak
            updates.lastLogin = now;
            needsUpdate = true;
          }
        } else {
          updates.lastLogin = now;
          updates.dailyStreak = 1;
          needsUpdate = true;
        }

        // Gamification: Leveling
        const properLevel = calculateLevel(data.tasks || 0);
        if (data.level !== properLevel) {
          updates.level = properLevel;
          needsUpdate = true;
        }
        
        // Security: Fingerprints
        if (deviceRef.current && (!data.fingerprints || !data.fingerprints.includes(deviceRef.current))) {
          updates.fingerprints = [...(data.fingerprints || []), deviceRef.current];
          needsUpdate = true;
        }

        if (data.country && data.country !== 'Unknown') {
          setCountry(data.country);
          countryRef.current = data.country;
        } else if (countryRef.current !== 'Detecting...' && data.country !== countryRef.current) {
          updates.country = countryRef.current;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(userRef, updates);
          data = { ...data, ...updates };
        }
      }
      setUserData(data);
    } catch (e) {
      console.error("Error refreshing data:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshUserData();
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, country, isVPN, deviceId, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
