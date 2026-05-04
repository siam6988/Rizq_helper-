import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { doc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { toast } from 'sonner';

interface ProofSubmissionModalProps {
  task: {
    id: string;
    title: string;
    reward: number;
  };
  onClose: () => void;
}

export const ProofSubmissionModal: React.FC<ProofSubmissionModalProps> = ({ task, onClose }) => {
  const { user } = useAuth();
  const [textProof, setTextProof] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const IMGBB_API_KEY = '6afc0ddfd27ed3da999d259a86ab44d4'; // Provided by user

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadToImgBB = async (imageFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image to ImgBB.');
    }
    
    const data = await response.json();
    if (data && data.data && data.data.url) {
      return data.data.url;
    } else {
      throw new Error('Invalid response from ImgBB.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!textProof.trim()) {
      toast.error('Please provide text proof (e.g., email or UID used).');
      return;
    }
    if (!file) {
      toast.error('Please upload an image screenshot as proof.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Verifying and uploading proof...');

    try {
      // 1. Check if user already submitted for this task
      const submissionsRef = collection(db, 'pending_bounty_proofs');
      const q = query(
        submissionsRef, 
        where('uid', '==', user.uid),
        where('task_id', '==', task.id)
      );
      
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error('You have already submitted proof for this task.', { id: toastId });
        setIsSubmitting(false);
        return;
      }
      
      // 2. Upload image to ImgBB
      toast.loading('Uploading image securely...', { id: toastId });
      const imageUrl = await uploadToImgBB(file);
      
      // 3. Save to Firestore
      toast.loading('Saving submission...', { id: toastId });
      
      // Using a custom document ID like: task_id_uid to be safe or just standard auto-gen ID
      const newSubmissionRef = doc(submissionsRef); 
      await setDoc(newSubmissionRef, {
        uid: user.uid,
        userEmail: user.email,
        task_id: task.id,
        task_title: task.title,
        text_proof: textProof,
        image_url: imageUrl,
        reward: task.reward,
        status: 'pending',
        submittedAt: Date.now()
      });

      toast.success('Proof submitted successfully! It will be reviewed shortly.', { id: toastId });
      onClose();
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'An error occurred during submission.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-8 overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-emerald-500/20 blur-[100px] pointer-events-none rounded-full" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <h2 className="text-2xl font-black text-white mb-2 relative z-10">Submit Proof</h2>
          <p className="text-slate-400 text-sm mb-6 relative z-10">
            For <span className="text-emerald-400 font-bold">{task.title}</span> (+{task.reward} ISLM)
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Email, UID, or Username used to sign up</label>
              <input
                type="text"
                value={textProof}
                onChange={(e) => setTextProof(e.target.value)}
                placeholder="e.g. user123@gmail.com"
                className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-500 font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Screenshot Proof</label>
              <div 
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                  file ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/60'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-upload"
                  required
                />
                <label 
                  htmlFor="screenshot-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-3 w-full h-full"
                >
                  {file ? (
                    <>
                      <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <p className="text-emerald-400 font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                      <div>
                        <p className="text-slate-300 font-bold text-sm">Click to upload screenshot</p>
                        <p className="text-slate-500 text-xs mt-1">JPEG, PNG up to 5MB</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 mt-4
                ${isSubmitting 
                  ? 'bg-slate-700 cursor-not-allowed opacity-80' 
                  : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/25 border border-emerald-400/20'
                }`}
            >
              {isSubmitting ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Processing...
                 </>
              ) : 'Submit for Review'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
