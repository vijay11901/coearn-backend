const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const auth = admin.auth();

// Middleware: Verify ID token
async function verifyToken(req, res, next) {
  const idToken = req.headers.authorization;
  if (!idToken) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Process referral bonus (called from client when pending referral is detected)
app.post('/process-referral', verifyToken, async (req, res) => {
  const { newUserId, referrerId } = req.body;

  try {
    const batch = db.batch();

    // 1. Update new user's coins (+10)
    const newUserRef = db.collection('users').doc(newUserId);
    batch.update(newUserRef, {
      coins: admin.firestore.FieldValue.increment(10)
    });

    // 2. Update referrer's coins (+5) and referral count
    const referrerRef = db.collection('users').doc(referrerId);
    batch.update(referrerRef, {
      coins: admin.firestore.FieldValue.increment(5),
      referrals: admin.firestore.FieldValue.increment(1)
    });

    await batch.commit();
    res.json({ success: true });

  } catch (error) {
    console.error('Referral processing error:', error);
    res.status(500).json({ message: 'Error processing referral' });
  }
});

// Process batch rewards (called when 3+ tasks or 5 minutes passed)
app.post('/process-batch-rewards', verifyToken, async (req, res) => {
  const { rewards } = req.body;
  const userId = req.uid;

  try {
    // Here you would add verification logic for each task type
    // For now, we'll just log them
    rewards.forEach(reward => {
      console.log(`Processing ${reward.type} reward of ${reward.amount} coins for user ${userId}`);
    });

    // In a real app, you would:
    // 1. Verify each task (check Telegram API, YouTube API, etc.)
    // 2. Update transaction history
    // 3. Log the batch processing

    res.json({ success: true, processed: rewards.length });
  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({ message: 'Error processing batch' });
  }
});

// Complete individual task (legacy endpoint)
app.post('/complete-task', verifyToken, async (req, res) => {
  const { taskType, coins } = req.body;
  const userId = req.uid;

  try {
    await db.collection('users').doc(userId).update({
      coins: admin.firestore.FieldValue.increment(coins),
      lastTaskCompleted: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, coinsEarned: coins });
  } catch (error) {
    console.error('Task completion error:', error);
    res.status(500).json({ message: 'Error completing task' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
