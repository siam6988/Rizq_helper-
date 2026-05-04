import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ProofSubmissionModal } from '../components/ProofSubmissionModal';
import { toast } from 'sonner';

interface BountyTask {
  id: string;
  title: string;
  reward: number;
  description: string;
  instructions: string[];
}

export const Bounties: React.FC = () => {
  const [tasks, setTasks] = useState<BountyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<BountyTask | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const q = query(collection(db, 'bounties'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedTasks: BountyTask[] = [];
        querySnapshot.forEach((doc) => {
          fetchedTasks.push({ id: doc.id, ...doc.data() } as BountyTask);
        });
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error fetching bounties:", error);
        toast.error("Failed to load bounties.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md">
          Premium <span className="text-emerald-400">Bounty Station</span>
        </h1>
        <p className="text-slate-400 font-medium">Complete high-value tasks by directly signing up or testing apps and earn major ISLM rewards.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-white/5">
          <p className="text-slate-400 text-lg">No bounties currently available. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white leading-tight">{task.title}</h3>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black px-3 py-1 rounded-lg shrink-0 ml-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                      +{task.reward} ISLM
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    {task.description}
                  </p>
                  
                  <div className="mb-6 space-y-2">
                    <h4 className="text-slate-400 uppercase text-xs font-bold tracking-wider">Instructions:</h4>
                    <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1.5 ml-2">
                      {task.instructions && task.instructions.length > 0 ? (
                        task.instructions.map((step, i) => (
                          <li key={i} className="pl-2">{step}</li>
                        ))
                      ) : (
                         <li className="pl-2">Follow the link and complete sign up.</li>
                      )}
                    </ol>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTask(task)}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 border border-emerald-400/30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  Submit Proof
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedTask && (
        <ProofSubmissionModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  );
};
