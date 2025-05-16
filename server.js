const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
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

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Initialize user collections
app.post('/initialize-user', verifyToken, async (req, res) => {
  try {
    const { userId, referrerId, referralCode } = req.body;
    
    // 1. Create transactions subcollection
    const initialTransaction = {
      type: 'system',
      description: 'Account created',
      amount: 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userId)
      .collection('transactions').doc('initial')
      .set(initialTransaction);

    // 2. Process referral if exists
    if (referrerId && referralCode) {
      await db.collection('pending_referrals').add({
        newUserId: userId,
        referrerId,
        referralCode,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processed: false
      });

      // Add welcome bonus for new user
      await db.collection('users').doc(userId)
        .collection('transactions').doc('welcome_bonus')
        .set({
          type: 'credit',
          description: 'Referral welcome bonus',
          amount: 10,
          taskType: 'referral',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ message: 'Error initializing user' });
  }
});

// Process referral bonus
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

    // 3. Add transaction records
    const newUserTransaction = db.collection('users').doc(newUserId)
      .collection('transactions').doc();
    batch.set(newUserTransaction, {
      type: 'credit',
      description: 'Referral signup bonus',
      amount: 10,
      taskType: 'referral',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    const referrerTransaction = db.collection('users').doc(referrerId)
      .collection('transactions').doc();
    batch.set(referrerTransaction, {
      type: 'credit',
      description: 'Referral reward',
      amount: 5,
      taskType: 'referral',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    console.error('Referral processing error:', error);
    res.status(500).json({ message: 'Error processing referral' });
  }
});

// Complete task and award coins
app.post('/complete-task', verifyToken, async (req, res) => {
  const { taskType, coins } = req.body;
  const userId = req.uid;

  // Validate task type
  const validTasks = ['telegram', 'youtube', 'subscribe', 'instagram'];
  if (!validTasks.includes(taskType)) {
    return res.status(400).json({ message: 'Invalid task type' });
  }

  try {
    // Create transaction record
    const transactionRef = await db.collection('users').doc(userId)
      .collection('transactions').add({
        type: 'credit',
        description: `Completed ${taskType} task`,
        amount: coins,
        taskType,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    // Update user balance
    await db.collection('users').doc(userId).update({
      coins: admin.firestore.FieldValue.increment(coins),
      lastTaskCompleted: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, transactionId: transactionRef.id });
  } catch (error) {
    console.error('Task completion error:', error);
    res.status(500).json({ message: 'Error completing task' });
  }
});

// Process withdrawal request
app.post('/process-withdrawal', verifyToken, async (req, res) => {
  const { method, amount, upiId, accountNumber, ifscCode, bankName, accountName } = req.body;
  const userId = req.uid;

  try {
    // Validate minimum amount
    if (amount < 1000) {
      return res.status(400).json({ message: 'Minimum withdrawal is 1000 coins (₹10)' });
    }

    // Check user balance
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const currentBalance = userData.coins || 0;

    if (currentBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create withdrawal data object
    const withdrawalData = {
      userId,
      method,
      amount,
      status: 'pending',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      currency: 'INR',
      coinsToRupees: amount / 100 // 1000 coins = ₹10
    };

    // Add method-specific details
    if (method === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        return res.status(400).json({ message: 'Invalid UPI ID' });
      }
      withdrawalData.upiId = upiId;
    } else if (method === 'bank') {
      if (!accountNumber || !ifscCode || !bankName || !accountName) {
        return res.status(400).json({ message: 'All bank details are required' });
      }
      withdrawalData.accountNumber = accountNumber;
      withdrawalData.ifscCode = ifscCode;
      withdrawalData.bankName = bankName;
      withdrawalData.accountName = accountName;
    } else {
      return res.status(400).json({ message: 'Invalid withdrawal method' });
    }

    // Create withdrawal record
    const withdrawalRef = await db.collection('withdrawals').add(withdrawalData);

    // Deduct coins from user balance
    await db.collection('users').doc(userId).update({
      coins: admin.firestore.FieldValue.increment(-amount)
    });

    // Add transaction record
    await db.collection('users').doc(userId)
      .collection('transactions').add({
        type: 'debit',
        description: `Withdrawal request (${method})`,
        amount: -amount,
        withdrawalId: withdrawalRef.id,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ 
      success: true,
      withdrawalId: withdrawalRef.id,
      message: 'Withdrawal request submitted successfully'
    });
  } catch (error) {
    console.error('Withdrawal processing error:', error);
    res.status(500).json({ message: 'Error processing withdrawal' });
  }
});

// Get user withdrawal history
app.get('/withdrawal-history', verifyToken, async (req, res) => {
  const userId = req.uid;

  try {
    const snapshot = await db.collection('withdrawals')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const history = [];
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate().toISOString()
      });
    });

    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching withdrawal history:', error);
    res.status(500).json({ message: 'Error fetching history' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
