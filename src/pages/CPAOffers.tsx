import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ChevronRight, Target } from 'lucide-react';
import { AdBanner } from '../components/AdBanner';
import { CPAModal, CPAOffer } from '../components/CPAModal';

// Dummy data for CPA offers (Admin would normally add these via a separate panel)
const DUMMY_OFFERS: CPAOffer[] = [
  {
    id: "cpa_001",
    title: "Sign up for HAQQ Wallet",
    description: "Install HAQQ Wallet and register a new account.",
    reward: 5.00,
    provider: "HAQQ Network",
    requirements: [
      "Must be a new user to HAQQ Wallet.",
      "Provide the public wallet address generated as proof."
    ]
  },
  {
    id: "cpa_002",
    title: "Join Islamic Coin Discord",
    description: "Join the official community and reach level 3.",
    reward: 2.50,
    provider: "Islamic Coin",
    requirements: [
      "Need to stay in the server for at least 7 days.",
      "Submit your Discord Username (e.g. user#1234) as proof."
    ]
  },
  {
    id: "cpa_003",
    title: "Retweet & Tag 3 Friends",
    description: "Help spread the word about RizQ Helper on Twitter/X.",
    reward: 1.00,
    provider: "Platform",
    requirements: [
      "Follow our official account.",
      "Quote retweet the pinned post tagging 3 people.",
      "Submit the link to your tweet."
    ]
  }
];

export const CPAOffers: React.FC = () => {
  const [selectedOffer, setSelectedOffer] = useState<CPAOffer | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)] flex items-center gap-3">
            <Target className="text-yellow-500" size={32} />
            High-Paying CPA Offers
          </h2>
          <p className="text-text-dim mt-2 font-medium">Complete manual tasks for massive rewards.</p>
        </div>
      </div>

      <AdBanner slot="cpa_top_banner" className="h-24 w-full mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DUMMY_OFFERS.map((offer, index) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card flex flex-col rounded-3xl p-6 border border-white/10 hover:border-primary-light/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Briefcase size={64} />
            </div>
            
            <div className="mb-4 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-light bg-primary-light/10 px-3 py-1 rounded-full">
                {offer.provider}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">{offer.title}</h3>
            <p className="text-sm text-text-dim mb-6 flex-grow relative z-10 line-clamp-3">
              {offer.description}
            </p>

            <div className="border-t border-white/10 pt-4 flex items-center justify-between mt-auto relative z-10">
              <div>
                <p className="text-xs text-text-dim font-bold uppercase tracking-wider">Reward</p>
                <p className="text-xl font-black text-yellow-500 drop-shadow-[0_2px_5px_rgba(234,179,8,0.3)]">
                  +{Number(offer.reward || 0).toFixed(2)} ISLM
                </p>
              </div>
              <button 
                onClick={() => setSelectedOffer(offer)}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AdBanner slot="cpa_bottom_banner" className="h-40 w-full mt-8" />

      <CPAModal 
        isOpen={!!selectedOffer}
        onClose={() => setSelectedOffer(null)}
        offer={selectedOffer}
      />
    </motion.div>
  );
};
