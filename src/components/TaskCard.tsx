import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePTC } from '../context/PTCContext';

interface Task {
  id: string;
  title: string;
  duration: number;
  reward: number;
  url: string;
  countries?: string;
}

export const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const { userData } = useAuth();
  const { startTask } = usePTC();

  const lastDone = userData?.completedTasks?.[task.id] || 0;
  const hoursPassed = (Date.now() - lastDone) / (1000 * 60 * 60);
  const isLocked = hoursPassed < 24;

  return (
    <div className={`glass-card relative overflow-hidden flex flex-col ${isLocked ? 'opacity-60' : 'opacity-100'}`}>
      <div className="absolute top-5 right-5 bg-primary-light/20 text-primary-light px-3 py-1.5 rounded-xl font-extrabold text-sm">
        +{task.reward}
      </div>
      <h3 className="mb-4 text-2xl font-bold w-[70%]">{task.title}</h3>
      <p className="text-text-dim text-sm font-semibold mb-6 flex-grow">
        Required Time: {task.duration}s
      </p>
      
      {isLocked ? (
        <button disabled className="btn-3d w-full text-xs py-3 rounded-xl opacity-80 cursor-not-allowed">
          WAIT 24H
        </button>
      ) : (
        <button 
          onClick={() => startTask(task.id, task.duration, task.reward, task.url)} 
          className="btn-3d w-full text-sm py-3 rounded-xl"
        >
          START MISSION
        </button>
      )}
    </div>
  );
};
