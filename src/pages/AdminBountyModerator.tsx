import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, runTransaction, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface PendingProof {
  id: string;
  uid: string;
  userEmail: string;
  task_id: string;
  task_title: string;
  text_proof: string;
  image_url: string;
  reward: number;
  status: string;
  submittedAt: number;
}

export const AdminBountyModerator: React.FC = () => {
  const [proofs, setProofs] = useState<PendingProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingProofs();
  }, []);

  const fetchPendingProofs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'pending_bounty_proofs'),
        where('status', '==', 'pending'),
        // Note: Ordering might require an explicit index in Firestore. We could sort locally to be safe.
      );
      const snap = await getDocs(q);
      const fetchedProofs: PendingProof[] = [];
      snap.forEach((doc) => {
        fetchedProofs.push({ id: doc.id, ...doc.data() } as PendingProof);
      });
      // Sort locally to avoid index requirement errors temporarily
      fetchedProofs.sort((a, b) => b.submittedAt - a.submittedAt);
      setProofs(fetchedProofs);
    } catch (error) {
      console.error("Error fetching proofs:", error);
      toast.error("Failed to fetch pending proofs.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (proof: PendingProof, action: 'approve' | 'reject') => {
    setProcessingId(proof.id);
    try {
      if (action === 'approve') {
        const proofRef = doc(db, 'pending_bounty_proofs', proof.id);
        const userRef = doc(db, 'users', proof.uid);
        
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw new Error("User document does not exist.");
          }
          const currentBalance = userDoc.data().balance || 0;
          
          transaction.update(userRef, {
            balance: currentBalance + proof.reward
          });
          
          transaction.update(proofRef, {
            status: 'approved',
            reviewedAt: Date.now()
          });

          // Add earning record for transparency ledger
          const earningRef = doc(collection(db, "users", proof.uid, "earnings"));
          transaction.set(earningRef, {
             type: 'Premium Bounty',
             amount: proof.reward,
             timestamp: Date.now(),
             taskId: proof.task_id
          });
        });
        toast.success(`Proof approved! Sent ${proof.reward} ISLM to user.`);
      } else {
        const proofRef = doc(db, 'pending_bounty_proofs', proof.id);
        const batch = writeBatch(db);
        batch.update(proofRef, {
          status: 'rejected',
          reviewedAt: Date.now()
        });
        await batch.commit();
        toast.info("Proof rejected.");
      }

      // Remove from list
      setProofs(prev => prev.filter(p => p.id !== proof.id));
    } catch (error: any) {
      console.error("Transaction failed:", error);
      toast.error(error.message || "Failed to process the proof.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">Bounty <span className="text-indigo-400">Moderator</span></h1>
          <p className="text-slate-400 mt-1">Review user submissions for Premium Tasks.</p>
        </div>
        <button 
          onClick={fetchPendingProofs}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl border border-slate-700 transition"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
           <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : proofs.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 font-medium font-mono text-lg tracking-widest">
          NO PENDING PROOFS
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {proofs.map(proof => (
              <motion.div
                key={proof.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800/40 backdrop-blur-md border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row gap-6 relative overflow-hidden"
              >
                {/* Info Section */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{proof.task_title}</h3>
                      <p className="text-sm text-slate-400 font-mono">User: {proof.userEmail}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">Submitted: {new Date(proof.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-400 font-black px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      Reward: {proof.reward} ISLM
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">User's Text Proof</p>
                    <p className="text-white font-medium break-all">{proof.text_proof}</p>
                  </div>

                  {/* Actions Desktop */}
                  <div className="hidden lg:flex gap-3 pt-4 border-t border-slate-700/50 mt-4">
                    <button
                      onClick={() => handleAction(proof, 'approve')}
                      disabled={processingId !== null}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 border border-emerald-500/50"
                    >
                      {processingId === proof.id ? 'Processing...' : 'APPROVE'}
                    </button>
                    <button
                      onClick={() => handleAction(proof, 'reject')}
                      disabled={processingId !== null}
                      className="flex-1 bg-rose-900/60 hover:bg-rose-800 text-rose-300 font-bold py-3 rounded-xl transition-colors border border-rose-800/50 disabled:opacity-50"
                    >
                      REJECT
                    </button>
                  </div>
                </div>

                {/* Screenshot Section */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2">
                   <p className="text-xs text-slate-500 uppercase tracking-wider font-bold lg:hidden">Screenshot Proof</p>
                   <div 
                      className="w-full h-48 lg:h-full bg-slate-900 rounded-2xl border-2 border-slate-700 overflow-hidden cursor-pointer hover:border-slate-500 transition-colors relative group"
                      onClick={() => setSelectedImage(proof.image_url)}
                   >
                     <img 
                       src={proof.image_url} 
                       alt="Proof" 
                       className="w-full h-full object-cover" 
                       loading="lazy"
                     />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">View Full</span>
                     </div>
                   </div>
                </div>

                {/* Actions Mobile */}
                <div className="flex lg:hidden gap-3 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => handleAction(proof, 'approve')}
                    disabled={processingId !== null}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => handleAction(proof, 'reject')}
                    disabled={processingId !== null}
                    className="flex-1 bg-rose-900 hover:bg-rose-800 text-rose-300 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    REJECT
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 lg:p-10" onClick={() => setSelectedImage(null)}>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.img 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               src={selectedImage}
               alt="Proof Fullscreen"
               className="relative z-10 max-w-full max-h-full object-contain rounded-lg border border-slate-700 shadow-2xl"
               onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-20 bg-slate-800 text-white p-3 rounded-full hover:bg-slate-700 border border-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
