import React from 'react';
import { motion } from 'framer-motion';

export const Privacy: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-10"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-white mb-4">Privacy Policy</h1>
        <p className="text-text-dim">Last updated: April 28, 2026</p>
      </div>

      <div className="glass-card p-10 rounded-3xl space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
          <p className="text-text-dim leading-relaxed mb-3">
            To provide a secure and bot-free environment, RizQ Helper collects the following information when you register and interact with our platform:
          </p>
          <ul className="list-disc list-inside text-text-dim space-y-2 ml-4">
            <li><strong>Authentication Data:</strong> Email addresses and masked passwords via Google Firebase Auth.</li>
            <li><strong>Device Fingerprints:</strong> Unique identifiers generated from your browser/device parameters to enforce our 1-account-per-user policy.</li>
            <li><strong>Network Data:</strong> IP Addresses used strictly for geographical tracking and VPN/proxy detection.</li>
            <li><strong>Usage Data:</strong> Timestamps of tasks completed, pages visited, and interactions with advertisements.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Data</h2>
          <p className="text-text-dim leading-relaxed mb-3">
            We use the gathered information to:
          </p>
          <ul className="list-disc list-inside text-text-dim space-y-2 ml-4">
            <li>Prevent fraud, botting, and double-accounting, which protects advertising budgets.</li>
            <li>Manage your rewards, ISLM balances, gamification levels, and payouts.</li>
            <li>Geographically align advertisements with target demographics.</li>
            <li>Process payments to your Web3 wallet address securely.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. Data Sharing & Third Parties</h2>
          <p className="text-text-dim leading-relaxed mb-3">
            We <strong>do not</strong> sell your personal data. We may share anonymous/aggregated diagnostic data with:
          </p>
          <ul className="list-disc list-inside text-text-dim space-y-2 ml-4">
            <li><strong>Advertisers:</strong> We share click outcomes and anonymized country origins (never emails or names).</li>
            <li><strong>Security Providers:</strong> Data sent to Cloudflare and other VPN API providers strictly to verify network integrity.</li>
            <li><strong>Offerwalls:</strong> To attribute completions, we provide unique anonymous User IDs to third-party offerwall providers (e.g., CPALead, BitLabs).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Cookies & Local Storage</h2>
          <p className="text-text-dim leading-relaxed">
            RizQ Helper utilizes local storage and essential cookies to maintain your login session, store your device fingerprint, and persist your Dark/Light mode preferences. By using the platform, you consent to the use of these necessary tracking mechanisms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Account Deletion & Rights</h2>
          <p className="text-text-dim leading-relaxed">
            You have the right to request a complete deletion of your account and associated data. However, for fraud prevention, hashes of device fingerprints associated with banned accounts may be kept indefinitely to prevent future platform abuse. To request account deletion, contact our support team.
          </p>
        </section>
      </div>
    </motion.div>
  );
};
