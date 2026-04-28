import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Home: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="text-center py-24 px-5 max-w-4xl mx-auto">
      <div className="bg-primary-light/15 text-primary-light px-6 py-2.5 rounded-full inline-block font-extrabold mb-6 text-sm border border-primary-light/40 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
        WEB3 EARNING PLATFORM
      </div>
      <h1 className="text-[clamp(45px,8vw,80px)] leading-[1.1] mb-6 text-shadow-xl font-extrabold drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        Ethical RizQ <br/>
        <span className="text-primary-light">Crypto Rewards.</span>
      </h1>
      <p className="text-text-dim text-lg font-semibold mx-auto mb-10 max-w-xl drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">
        Complete tasks, earn rewards, and withdraw instantly via BTC, SOL or ISLM.
      </p>
      <Link to="/auth" className="btn-3d inline-block px-8 py-4 rounded-2xl text-lg relative z-10">
        START EARNING
      </Link>
    </div>
  );
};
