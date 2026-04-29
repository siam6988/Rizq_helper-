import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface PTCState {
  active: boolean;
  taskId: string;
  reward: number;
  duration: number;
  remaining: number;
  elapsed: number;
  verifyMode: boolean;
  captchaToken: string | null;
  taskType: 'standard' | 'dynamic';
}

interface PTCContextType {
  ptcState: PTCState;
  startTask: (id: string, duration: number, reward: number, url: string, adWin?: Window | null, type?: 'standard' | 'dynamic') => void;
  cancelTask: () => void;
  submitTask: () => Promise<void>;
  setCaptchaToken: (t: string | null) => void;
}

const PTCContext = createContext<PTCContextType | null>(null);

export const usePTC = () => {
  const ctx = useContext(PTCContext);
  if (!ctx) throw new Error("usePTC must be used in a PTCProvider");
  return ctx;
};

export const PTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, refreshUserData } = useAuth();
  const [ptcState, setPtcState] = useState<PTCState>({
    active: false, taskId: '', reward: 0, duration: 0, remaining: 0, elapsed: 0, verifyMode: false, captchaToken: null, taskType: 'standard'
  });
  const [adW, setAdW] = useState<Window | null>(null);
  
  const lastActivityRef = useRef<number>(Date.now());
  const [isIdle, setIsIdle] = useState(false);
  
  const [mathProblem, setMathProblem] = useState({ num1: 0, num2: 0, answer: 0 });
  const [mathAnswer, setMathAnswer] = useState('');

  // Generate math problem when entering verify mode
  useEffect(() => {
    if (ptcState.verifyMode) {
      const n1 = Math.floor(Math.random() * 20) + 1;
      const n2 = Math.floor(Math.random() * 10) + 1;
      setMathProblem({ num1: n1, num2: n2, answer: n1 + n2 });
      setMathAnswer('');
    }
  }, [ptcState.verifyMode]);

  // Activity tracker for Dynamic Tasks
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (isIdle) setIsIdle(false);
    };
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity, true);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity, true);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    }
  }, [isIdle]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (ptcState.active && !ptcState.verifyMode && adW) {
      interval = setInterval(() => {
        if (adW.closed) {
          setPtcState(prev => {
            if (prev.taskType === 'dynamic' && prev.elapsed >= 10) {
              clearInterval(interval);
              return { ...prev, verifyMode: true };
            } else {
              clearInterval(interval);
              cancelTask();
              toast.error("🚨 TASK FAILED: You closed the advertisement tab early!");
              return prev;
            }
          });
          return;
        }

        const timeSinceActivity = Date.now() - lastActivityRef.current;
        const idleState = timeSinceActivity > 15000;
        if (idleState !== isIdle) setIsIdle(idleState);

        setPtcState(prev => {
          if (document.hidden || idleState) return prev; // Pause timer if idle or hidden
          
          if (prev.taskType === 'dynamic') {
             if (prev.elapsed >= prev.duration) {
                clearInterval(interval);
                return { ...prev, verifyMode: true };
             }
             return { ...prev, elapsed: prev.elapsed + 1 };
          } else {
            if (prev.remaining <= 1) {
              clearInterval(interval);
              return { ...prev, remaining: 0, verifyMode: true };
            }
            return { ...prev, remaining: prev.remaining - 1 };
          }
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [ptcState.active, ptcState.verifyMode, adW, isIdle]);

  const startTask = (id: string, duration: number, reward: number, url: string, preOpenedWin?: Window | null, type: 'standard' | 'dynamic' = 'standard') => {
    if (ptcState.active) return;
    
    let adWin = preOpenedWin;
    if (!adWin) {
      adWin = window.open(url, '_blank');
    }
    
    if (!adWin || adWin.closed || typeof adWin.closed === 'undefined') {
      toast.error("Popup Blocked! Please allow popups.");
      return;
    }
    
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    setAdW(adWin);
    setPtcState({ active: true, taskId: id, reward, duration, remaining: duration, elapsed: 0, verifyMode: false, captchaToken: null, taskType: type });
  };

  const cancelTask = () => {
    setPtcState({ active: false, taskId: '', reward: 0, duration: 0, remaining: 0, elapsed: 0, verifyMode: false, captchaToken: null, taskType: 'standard' });
    setAdW(null);
  };

  const setCaptchaToken = (token: string | null) => {
    setPtcState(prev => ({ ...prev, captchaToken: token }));
  };

  const submitTask = async () => {
    if (!mathAnswer || parseInt(mathAnswer) !== mathProblem.answer) {
      toast.error("Incorrect answer. Please try again!");
      return;
    }
    if (!user) return;

    try {
      const response = await fetch('/api/claim-reward', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            uid: user.uid,
            taskId: ptcState.taskId,
            duration: ptcState.elapsed, // dynamic duration
            captchaAnswer: parseInt(mathAnswer)
         })
      });

      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || "Failed to claim reward");
      }

      const finalReward = data.reward;
      
      toast.success(`Mission Success! +${finalReward.toFixed(2)} added.`);
      setPtcState({ active: false, taskId: '', reward: 0, duration: 0, remaining: 0, elapsed: 0, verifyMode: false, captchaToken: null, taskType: 'standard' });
      setAdW(null);
      await refreshUserData();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  return (
    <PTCContext.Provider value={{ ptcState, startTask, cancelTask, submitTask, setCaptchaToken }}>
      {children}
      
      {/* GLOBAL PTC OVERLAY */}
      {ptcState.active && (
        <div className="fixed inset-0 bg-[#020617fa] backdrop-blur-xl z-[9999] flex flex-col justify-center items-center text-center p-6 touch-none">
          
          {(document.hidden || isIdle) && !ptcState.verifyMode && (
             <div className="absolute top-10 bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-3 rounded-2xl font-bold md:min-w-[300px] flex items-center justify-center gap-3 animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.5)] z-50">
               ⚠️ TIMER PAUSED: Move mouse/scroll to verify activity!
             </div>
          )}

          {/* Progress Tracker */}
          {ptcState.taskType === 'dynamic' ? (
            <div className={`mb-8 w-full max-w-sm transition-all duration-300 ${(document.hidden || isIdle) && !ptcState.verifyMode ? 'opacity-30 blur-sm scale-95' : ''}`}>
              <h2 className="text-3xl font-black text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] mb-2">
                Reading Blog...
              </h2>
              <p className="text-text-dim text-lg font-bold mb-6">
                Active Time: <span className="text-primary-light">{ptcState.elapsed}s</span> / {ptcState.duration}s
              </p>
              
              <div className="bg-black/50 p-6 rounded-3xl border border-primary-light/30 shadow-[inset_0_0_30px_rgba(16,185,129,0.1),_0_0_30px_rgba(16,185,129,0.2)] mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-light)" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <p className="text-text-dim text-xs uppercase tracking-widest font-bold mb-2">Accumulated Reward</p>
                <p className="text-6xl font-black text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)] tabular-nums">
                  {(Number(ptcState.elapsed || 0) * 0.01).toFixed(2)} <span className="text-2xl text-yellow-500/80">ISLM</span>
                </p>
              </div>

              {ptcState.elapsed >= 10 && !ptcState.verifyMode && (
                <button 
                  onClick={() => setPtcState(prev => ({...prev, verifyMode: true}))} 
                  className="btn-3d w-full py-4 rounded-xl text-lg font-bold animate-in fade-in zoom-in"
                >
                  CLAIM REWARD ({(Number(ptcState.elapsed || 0) * 0.01).toFixed(2)})
                </button>
              )}

              {ptcState.elapsed < 10 && !ptcState.verifyMode && (
                <p className="text-sm font-bold text-red-400 bg-red-500/10 py-2 px-4 rounded-lg animate-pulse mt-4">
                  Read for {10 - ptcState.elapsed} more seconds to unlock claim!
                </p>
              )}
            </div>
          ) : (
            <div className={`mb-8 w-full max-w-sm transition-all duration-300 ${(document.hidden || isIdle) && !ptcState.verifyMode ? 'opacity-30 blur-sm scale-95' : ''}`}>
              <h2 className="text-3xl font-black text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] mb-2">
                Viewing Advertisement
              </h2>
              <p className="text-text-dim text-lg font-bold mb-6">
                Please wait... <span className="text-primary-light">{ptcState.remaining}s</span> remaining.
              </p>
              
              <div className="bg-white/10 w-full h-4 rounded-full overflow-hidden mb-2">
                <div 
                  className="bg-primary-light h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  style={{ width: `${100 - (ptcState.remaining / ptcState.duration) * 100}%` }}
                ></div>
              </div>
              
              <p className="text-sm font-bold text-yellow-500 animate-pulse mt-4">
                ⚠️ MUST KEEP AD TAB OPEN AND THIS TAB VISIBLE
              </p>
            </div>
          )}

          {/* Verification Module */}
          {ptcState.verifyMode && (
            <div className="glass-card p-8 rounded-3xl w-full max-w-sm mt-8 border border-white/20 animate-in fade-in zoom-in duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-2">Anti-Bot Verification</h3>
              <p className="text-text-dim mb-6 text-sm">Solve this simple math problem to prove you are human.</p>
              
              <div className="flex items-center justify-center gap-4 w-full mb-8 text-3xl font-black text-white">
                <span>{mathProblem.num1}</span>
                <span className="text-primary-light">+</span>
                <span>{mathProblem.num2}</span>
                <span className="text-primary-light">=</span>
                <input 
                  type="number"
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      submitTask();
                    }
                  }}
                  className="bg-black/50 border-b-2 border-white/20 w-24 text-center py-2 focus:border-primary-light focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
              
              <button 
                onClick={submitTask}
                disabled={!mathAnswer}
                className="btn-3d w-full py-4 rounded-xl text-lg font-bold disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all"
              >
                VERIFY & CLAIM {ptcState.taskType === 'dynamic' ? (Number(ptcState.elapsed || 0) * 0.01).toFixed(2) : Number(ptcState.reward || 0).toFixed(2)}
              </button>
            </div>
          )}
        </div>
      )}
    </PTCContext.Provider>
  );
};
