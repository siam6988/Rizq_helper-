import express from 'express';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { adminDb, adminAuth } from './src/services/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import path from 'path';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key', {
  apiVersion: '2023-10-16' as any
});

// Schema for request validation
const ClaimRewardSchema = z.object({
  uid: z.string().min(1),
  taskId: z.string().min(1, "Task ID is required").regex(/^[a-zA-Z0-9_\-]+$/, "Invalid Task ID format"),
  duration: z.number().min(1),
  captchaAnswer: z.number().int("Captcha answer must be an integer").min(0, "Captcha answer cannot be negative")
});

const WithdrawSchema = z.object({
  uid: z.string().min(1),
  amount: z.number().min(28),
  address: z.string().min(10),
  coin: z.literal('ISLM')
});

const CampaignSchema = z.object({
  uid: z.string().min(1),
  title: z.string().min(5),
  url: z.string().url(),
  duration: z.number().min(5),
  views: z.number().min(10),
  rewardPerView: z.number().min(0.01)
});

// Simple Rate Limiting in-memory dict (uid => lastClaimTime)
const rateLimits: Record<string, number> = {};
const RATE_LIMIT_MS = 10000; // 10 seconds

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === SECURE API ROUTES ===

  // 0. Telegram Auth Endpoint
  app.post('/api/auth/telegram', async (req, res) => {
    try {
      const { user } = req.body;
      if (!user || !user.id) {
         return res.status(400).json({ error: "No Telegram User provided" });
      }
      
      const uid = `telegram_${user.id}`;
      // Verify user exists in Firestore, or create if not
      const userRef = adminDb.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
         await userRef.set({
           name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
           balance: 0,
           tasks: 0,
           level: 'Bronze',
           createdAt: Date.now()
         });
      }

      const customToken = await adminAuth.createCustomToken(uid);
      res.json({ token: customToken });
    } catch(e: any) {
      console.error("Telegram auth error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // 1. Claim Reward Endpoint
  app.post('/api/claim-reward', async (req, res) => {
    try {
      // Input Validation
      const data = ClaimRewardSchema.parse(req.body);
      
      const now = Date.now();
      const lastClaim = rateLimits[data.uid] || 0;

      // Rate Limiting Check
      if (now - lastClaim < RATE_LIMIT_MS) {
         return res.status(429).json({ error: "Too many requests. Please wait 10 seconds." });
      }
      rateLimits[data.uid] = now;

      // Real system would also dynamically verify the Captcha equation again 
      // based on session/secret. For now we assume captcha passes basic structural check.

      const userRef = adminDb.collection('users').doc(data.uid);
      let expectedReward = 0;

      // Use Firestore Transactions for Atomicity
      await adminDb.runTransaction(async (t) => {
         const userDoc = await t.get(userRef);
         if (!userDoc.exists) throw new Error("User not found");
         
         const uData = userDoc.data();
         if (uData?.completedTasks && uData.completedTasks[data.taskId]) {
            const timeSinceCompletion = now - uData.completedTasks[data.taskId];
            // Only allow re-doing task if 24 hours have passed
            if (timeSinceCompletion < 24 * 60 * 60 * 1000) {
               throw new Error("Task already completed recently.");
            }
         }

         // Fetch the trusted Task from Admin Firestore securely in transaction
         const taskRef = adminDb.collection('tasks').doc(data.taskId);
         const taskSnap = await t.get(taskRef);
         let selectedTask = taskSnap.data();
         
         if (!selectedTask) {
           // Fallback to ptx_tasks (user generated)
           const userTaskRef = adminDb.collection('ptx_tasks').doc(data.taskId);
           const userTaskSnap = await t.get(userTaskRef);
           selectedTask = userTaskSnap.data();
           if (!selectedTask || selectedTask.status !== 'active') {
              throw new Error("Task not found or inactive");
           }
         }

         const rewardAmount = typeof selectedTask.reward === 'number' ? selectedTask.reward : 
                             (typeof selectedTask.costPerClick === 'number' ? selectedTask.costPerClick * 0.8 : 0);
      
         // Multiplier Logic securely calculated on server
         let multiplier = 1.0;
         if (uData?.level === 'Gold') multiplier = 1.1;
         else if (uData?.level === 'Silver') multiplier = 1.05;

         expectedReward = rewardAmount * multiplier;

         t.update(userRef, {
           balance: FieldValue.increment(expectedReward),
           tasks: FieldValue.increment(1),
           [`completedTasks.${data.taskId}`]: now
         });

         const earningRef = adminDb.collection('users').doc(data.uid).collection('earnings').doc();
         t.set(earningRef, {
           type: 'task',
           taskId: data.taskId,
           amount: expectedReward,
           timestamp: now
         });
      });

      return res.status(200).json({ success: true, reward: expectedReward });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
         return res.status(400).json({ error: "Invalid payload parameters" });
      }
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });


  // 2. Request Withdrawal Endpoint
  app.post('/api/request-withdrawal', async (req, res) => {
    try {
      const data = WithdrawSchema.parse(req.body);
      
      const now = Date.now();
      const lastClaim = rateLimits[data.uid] || 0;

      if (now - lastClaim < RATE_LIMIT_MS) {
         return res.status(429).json({ error: "Too many requests. Please wait." });
      }
      rateLimits[data.uid] = now;

      // Transaction to safely check balance and deduct
      const result = await adminDb.runTransaction(async (t) => {
         const userRef = adminDb.collection('users').doc(data.uid);
         const doc = await t.get(userRef);
         if (!doc.exists) throw new Error("User not found");
         
         const userData = doc.data();
         if ((userData?.balance || 0) < data.amount) {
            throw new Error("Insufficient Balance");
         }

         // Referrer tracking logic
         if (!userData?.hasWithdrawn && userData?.refBy) {
            const refBonus = data.amount * 0.10;
            const refUserRef = adminDb.collection('users').doc(userData.refBy);
            const refUserDoc = await t.get(refUserRef);
            
            if (refUserDoc.exists) {
               t.update(refUserRef, { balance: FieldValue.increment(refBonus) });
               const refEarningRef = adminDb.collection('users').doc(userData.refBy).collection('earnings').doc();
               t.set(refEarningRef, {
                  type: 'referral_bonus',
                  amount: refBonus,
                  referredUser: userData.name || data.uid,
                  timestamp: Date.now()
               });
            }
         }

         const fee = data.amount * 0.03;
         const amountAfterFee = data.amount - fee;

         const withdrawalRef = adminDb.collection('withdrawals').doc();
         t.set(withdrawalRef, {
            uid: data.uid,
            email: userData?.name || data.uid,
            address: data.address,
            coin: data.coin,
            amount: amountAfterFee,
            fee: fee,
            originalAmount: data.amount,
            status: 'pending',
            time: Date.now()
         });

         t.update(userRef, {
            balance: FieldValue.increment(-data.amount),
            hasWithdrawn: true
         });

         return amountAfterFee;
      });

      return res.status(200).json({ success: true, payload: result });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid payload parameters" });
        }
        return res.status(400).json({ error: error.message || "Failed to process withdrawal" });
    }
  });


  // 3. Create Campaign Endpoint
  app.post('/api/create-campaign', async (req, res) => {
    try {
      const data = CampaignSchema.parse(req.body);
      
      const now = Date.now();
      const lastClaim = rateLimits[data.uid] || 0;

      if (now - lastClaim < RATE_LIMIT_MS) {
         return res.status(429).json({ error: "Too many requests. Please wait." });
      }
      rateLimits[data.uid] = now;

      const subTotal = data.rewardPerView * data.views;
      const adminFee = subTotal * 0.20;
      const totalCost = subTotal + adminFee;

      await adminDb.runTransaction(async (t) => {
         const userRef = adminDb.collection('users').doc(data.uid);
         const doc = await t.get(userRef);
         if (!doc.exists) throw new Error("User not found");
         
         const userData = doc.data();
         if ((userData?.balance || 0) < totalCost) {
            throw new Error("Insufficient Balance");
         }

         const campaignRef = adminDb.collection('pending_campaigns').doc();
         t.set(campaignRef, {
            title: data.title,
            url: data.url,
            duration: data.duration,
            reward: data.rewardPerView,
            totalViews: data.views,
            currentViews: 0,
            advertiserId: data.uid,
            createdAt: Date.now(),
            status: 'pending'
         });

         t.update(userRef, {
            balance: FieldValue.increment(-totalCost)
         });
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid payload parameters: " + error.issues.map((e: any) => e.message).join(", ") });
        }
        return res.status(400).json({ error: error.message || "Failed to create campaign" });
    }
  });

  // === MANUAL CRYPTO DEPOSIT ===
  app.post('/api/submit-deposit', async (req, res) => {
    try {
      const { uid, amountISLM, txHash } = req.body;
      if (!uid || !amountISLM || amountISLM < 10) return res.status(400).json({ error: "Invalid amount. Minimum 10 ISLM" });
      if (!txHash || txHash.length < 10) return res.status(400).json({ error: "Invalid Transaction Hash" });
      
      const logRef = adminDb.collection('deposits').doc(txHash);
      const logDoc = await logRef.get();
      if (logDoc.exists) {
         return res.status(400).json({ error: "Transaction already submitted" });
      }

      await logRef.set({
         uid,
         amountISLM,
         txHash,
         status: 'pending', // Admins will review this manually or via a bot later
         timestamp: Date.now()
      });

      res.json({ success: true, message: "Deposit submitted for review" });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // === VITE / STATIC ROUTING ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
