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
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Process referral bonus
app.post('/process-referral', verifyToken, async (req, res) => {
  try {
    const { newUserId, referrerId } = req.body;

    // Verify both users exist
    const [newUser, referrer] = await Promise.all([
      db.doc(`users/${newUserId}`).get(),
      db.doc(`users/${referrerId}`).get()
    ]);

    if (!newUser.exists || !referrer.exists) {
      return res.status(404).json({ message: 'User documents not found' });
    }

    // Process using transaction
    await db.runTransaction(async (transaction) => {
      // Update referrer's data
      const referrerRef = db.doc(`users/${referrerId}`);
      transaction.update(referrerRef, {
        coins: admin.firestore.FieldValue.increment(100),
        referrals: admin.firestore.FieldValue.increment(1)
      });

      // Add to referrer's history
      const historyRef = referrerRef.collection('history').doc();
      transaction.set(historyRef, {
        type: 'referral_bonus',
        amount: 100,
        time: admin.firestore.FieldValue.serverTimestamp(),
        details: `Referred user: ${newUserId}`
      });
    });

    res.json({ success: true, message: 'Referral processed successfully' });

  } catch (error) {
    console.error('Referral processing error:', error);
    res.status(500).json({
      message: error.message || 'Error processing referral'
    });
  }
});

// Complete task and award coins
app.post('/complete-task', verifyToken, async (req, res) => {
  const { taskType } = req.body;
  const userId = req.uid;

  // Determine coins based on task type
  const taskRewards = {
    'telegram': 20,
    'youtube': 30,
    'subscribe': 10
  };

  const coinsEarned = taskRewards[taskType] || 0;

  try {
    await db.collection('users').doc(userId).update({
      coins: admin.firestore.FieldValue.increment(coinsEarned),
      completedTasks: admin.firestore.FieldValue.arrayUnion(taskType),
      lastTaskCompleted: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Add task history
    await db.collection('users').doc(userId).collection('history').add({
      type: 'task',
      taskType: taskType,
      amount: coinsEarned,
      time: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ coinsEarned });
  } catch (error) {
    console.error('Task completion error:', error);
    res.status(500).json({ message: 'Error completing task' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
