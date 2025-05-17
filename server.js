const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const auth = admin.auth();

// Middleware: Verify ID token
async function verifyToken(req, res, next) {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided' 
    });
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
}

// Process referral bonus
app.post('/process-referral', verifyToken, async (req, res) => {
  const { newUserId, referrerId, referralCode } = req.body;

  // Input validation
  if (!newUserId || !referrerId || !referralCode) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    // Verify the referral exists and is valid
    const referralRef = db.collection('pending_referrals')
      .where('newUserId', '==', newUserId)
      .where('referrerId', '==', referrerId)
      .where('referralCode', '==', referralCode)
      .where('processed', '==', false)
      .limit(1);

    const referralSnapshot = await referralRef.get();

    if (referralSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No valid pending referral found'
      });
    }

    const referralDoc = referralSnapshot.docs[0];
    const batch = db.batch();

    // 1. Mark referral as processed
    batch.update(referralDoc.ref, { 
      processed: true,
      processedAt: admin.firestore.FieldValue.serverTimestamp() 
    });

    // 2. Update new user's coins (+10)
    const newUserRef = db.collection('users').doc(newUserId);
    batch.update(newUserRef, { 
      coins: admin.firestore.FieldValue.increment(10),
      referralStatus: 'bonus-received' 
    });

    // 3. Update referrer's coins (+5) and referral count
    const referrerRef = db.collection('users').doc(referrerId);
    batch.update(referrerRef, { 
      coins: admin.firestore.FieldValue.increment(5),
      referrals: admin.firestore.FieldValue.increment(1),
      lastReferralAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    res.json({ 
      success: true,
      message: 'Referral processed successfully',
      data: {
        newUserBonus: 10,
        referrerBonus: 5
      }
    });

  } catch (error) {
    console.error('Referral processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing referral',
      error: error.message
    });
  }
});

// Complete task and award coins
app.post('/complete-task', verifyToken, async (req, res) => {
  const { taskType } = req.body;
  const userId = req.uid;

  // Validate task type
  const validTaskTypes = ['youtube', 'instagram', 'twitter', 'facebook'];
  if (!validTaskTypes.includes(taskType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid task type'
    });
  }

  // Determine coins based on task type
  const coinValues = {
    youtube: 5,
    instagram: 3,
    twitter: 2,
    facebook: 1
  };
  const coinsEarned = coinValues[taskType] || 1;

  try {
    // Check if user already completed this task recently
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData.lastTaskCompleted && 
        (new Date() - userData.lastTaskCompleted.toDate()) < 3600000) { // 1 hour cooldown
      return res.status(429).json({
        success: false,
        message: 'Task cooldown active. Please wait before completing another task.'
      });
    }

    await db.collection('users').doc(userId).update({
      coins: admin.firestore.FieldValue.increment(coinsEarned),
      lastTaskCompleted: admin.firestore.FieldValue.serverTimestamp(),
      [`tasks.${taskType}`]: admin.firestore.FieldValue.increment(1)
    });

    res.json({ 
      success: true,
      coinsEarned,
      totalCoins: (userData.coins || 0) + coinsEarned
    });

  } catch (error) {
    console.error('Task completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing task',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CoEarn API'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
