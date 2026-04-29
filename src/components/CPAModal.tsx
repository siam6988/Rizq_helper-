import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud } from 'lucide-react';
import { db, auth } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { z } from 'zod';

const cpaSchema = z.object({
  proof: z.string().min(10, "Proof must be at least 10 characters long").max(500, "Proof is too long")
});

export interface CPAOffer {
  id: string;
  title: string;
  description: string;
  reward: number;
  provider: string;
  requirements: string[];
}

interface CPAModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: CPAOffer | null;
}

export const CPAModal: React.FC<CPAModalProps> = ({ isOpen, onClose, offer }) => {
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);

  if (!isOpen || !offer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      cpaSchema.parse({ proof: proof.trim() });
    } catch (err: any) {
      if (err instanceof z.ZodError) toast.error(err.errors[0].message);
      return;
    }

    const now = Date.now();
    if (now - lastSubmit < 2000) {
      toast.error('Please wait a moment before trying again.');
      return;
    }

    if (!auth.currentUser) return toast.error("Not authenticated");

    setLastSubmit(now);
    setLoading(true);
    try {
      await addDoc(collection(db, "pending_cpa_approvals"), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        offerId: offer.id,
        offerTitle: offer.title,
        reward: offer.reward,
        proof: proof,
        status: 'pending',
        submittedAt: Date.now()
      });
      toast.success("Proof submitted successfully! Awaiting admin approval.");
      setProof('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit proof");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card relative w-full max-w-lg p-6 md:p-8 rounded-3xl z-10 border border-white/10"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-text-dim hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <div className="mb-6 pr-8">
            <h3 className="text-2xl font-bold text-white mb-2">{offer.title}</h3>
            <p className="text-text-dim font-medium">{offer.description}</p>
          </div>

          <div className="bg-black/40 p-4 rounded-xl mb-6 border border-white/5">
            <p className="text-sm text-white/70 font-bold uppercase tracking-wider mb-3">Requirements</p>
            <ul className="space-y-2">
              {offer.requirements.map((req, i) => (
                <li key={i} className="text-text-dim text-sm flex items-start gap-2">
                  <span className="text-primary-light mt-0.5">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <UploadCloud size={16} className="text-primary-light" />
                Submit Proof
              </label>
              <textarea
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="Enter email used, transaction hash, or profile link..."
                className="custom-input p-4 w-full rounded-xl min-h-[120px] resize-y"
                required
              />
              <p className="text-xs text-text-dim mt-2 font-medium">
                Admins will verify this proof manually. False proofs may lead to account ban.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <div>
                <p className="text-xs text-text-dim font-bold uppercase tracking-wider">Expected Reward</p>
                <p className="text-xl font-black text-yellow-500">+{Number(offer.reward || 0).toFixed(2)} ISLM</p>
              </div>
              <button
                type="submit"
                disabled={loading || !proof.trim()}
                className={`btn-3d px-6 py-3 rounded-xl font-bold disabled:opacity-50 min-w-[140px] ${loading ? 'loading' : ''}`}
              >
                {loading ? 'SUBMITTING...' : 'SUBMIT PROOF'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
