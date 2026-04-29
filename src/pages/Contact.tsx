import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const Contact: React.FC = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !subject || !email) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'contact_messages'), {
        userId: user?.uid || null,
        email,
        subject,
        message,
        status: 'unread',
        createdAt: serverTimestamp()
      });
      toast.success('Message sent! We will get back to you shortly.');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-10"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-white mb-4">Contact Us</h1>
        <p className="text-text-dim text-lg">Have a question or need support? We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-white/5">
            <Mail className="w-8 h-8 text-primary-light mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
            <p className="text-text-dim text-sm mb-4">For general inquiries and account assistance.</p>
            <a href="mailto:support@rizqhelper.app" className="text-primary-light font-bold hover:underline">
              support@rizqhelper.app
            </a>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-white/5">
            <MessageSquare className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Advertiser Sales</h3>
            <p className="text-text-dim text-sm mb-4">Want to launch a massive Web3 campaign?</p>
            <a href="mailto:ads@rizqhelper.app" className="text-blue-400 font-bold hover:underline">
              ads@rizqhelper.app
            </a>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Send a Message</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-text-dim mb-2 uppercase tracking-wider">Your Email</label>
                <input 
                  type="email" 
                  value={email}
                  disabled={!!user}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-light focus:outline-none transition-colors ${user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-dim mb-2 uppercase tracking-wider">Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-light focus:outline-none transition-colors"
                  placeholder="What is this regarding?"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-dim mb-2 uppercase tracking-wider">Message</label>
                <textarea 
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-light focus:outline-none transition-colors resize-none"
                  placeholder="Explain your issue or question in detail..."
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`btn-3d w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${loading ? 'loading' : ''}`}
              >
                {loading ? 'SENDING...' : (
                  <>
                    SEND MESSAGE
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
