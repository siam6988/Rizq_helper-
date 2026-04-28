import React, { useState } from 'react';
import { usePTC } from '../context/PTCContext';

export const PtcEngineModal: React.FC = () => {
  const { ptcState, cancelTask, submitTask } = usePTC();
  const [ansStr, setAnsStr] = useState<string>('');
  const [claiming, setClaiming] = useState(false);

  if (!ptcState.active) return null;

  const handleClaim = async () => {
    setClaiming(true);
    await submitTask(parseInt(ansStr));
    setClaiming(false);
    setAnsStr(''); // reset
  };

  return (
    <div className="fixed inset-0 bg-[#020617fa] z-[10000] flex flex-col items-center justify-center p-5 text-center backdrop-blur-md">
      <div className="bg-gradient-to-br from-[#0f172a] to-[#020617] border-2 border-border-glass rounded-3xl p-10 w-full max-w-sm shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.05)]">
        {!ptcState.verifyMode ? (
          <div>
            <div className="text-sm text-text-dim font-extrabold mb-5 tracking-[2px] uppercase">Connection Open</div>
            <div className="text-7xl font-extrabold text-primary-light mb-5 drop-shadow-[0_10px_20px_rgba(16,185,129,0.4)]">
              {ptcState.remaining}
            </div>
            <p className="text-gold text-sm font-bold mb-6">
              Engine is tracking. Do NOT close the ad tab.
            </p>
            <button 
              onClick={cancelTask}
              className="btn-3d w-full py-4 text-sm rounded-2xl"
              style={{ background: 'linear-gradient(to bottom, #ef4444, #b91c1c)', boxShadow: '0 6px 0 #7f1d1d' }}
            >
              CANCEL MISSION
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-primary-light mb-2 text-2xl font-bold">Human Verification</h3>
            <p className="text-text-dim text-sm font-semibold mb-5">Solve to verify engagement.</p>
            <h2 className="text-5xl text-white mb-5 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] font-bold">
              {ptcState.mathAns !== null ? `${ptcState.mathAns - (ptcState.mathAns % 2)} + ${ptcState.mathAns % 2}` : ''} = ?
            </h2>
            <input 
              type="number" 
              placeholder="Answer" 
              value={ansStr}
              onChange={(e) => setAnsStr(e.target.value)}
              className="custom-input w-full p-4 rounded-xl text-center text-2xl font-extrabold mb-4"
            />
            <button 
              onClick={handleClaim}
              disabled={claiming}
              className="btn-3d w-full py-4 rounded-2xl text-sm"
            >
              {claiming ? 'VERIFYING...' : 'VERIFY & CLAIM'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
