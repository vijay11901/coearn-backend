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
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Process referral endpoint
app.post('/process-referral', verifyToken, async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    const referrerId = req.user.uid;

    // Validate input
    if (!referralCode || !newUserId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get referrer document
    const referrerSnapshot = await db.collection('users')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();

    if (referrerSnapshot.empty) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    const referrerDoc = referrerSnapshot.docs[0];
    const referrerRef = referrerDoc.ref;
    const newUserRef = db.collection('users').doc(newUserId);

    // Process transaction
    await db.runTransaction(async (transaction) => {
      // Update referrer's data
      transaction.update(referrerRef, {
        coins: admin.firestore.FieldValue.increment(100),
        referrals: admin.firestore.FieldValue.increment(1)
      });

      // Update new user's data
      transaction.update(newUserRef, {
        coins: admin.firestore.FieldValue.increment(50),
        referredBy: referralCode
      });

      // Add history entries
      const referrerHistoryRef = referrerRef.collection('history').doc();
      transaction.set(referrerHistoryRef, {
        type: 'referral_bonus',
        amount: 100,
        time: admin.firestore.FieldValue.serverTimestamp(),
        details: `Referred user: ${newUserId}`
      });

      const newUserHistoryRef = newUserRef.collection('history').doc();
      transaction.set(newUserHistoryRef, {
        type: 'referral_signup',
        amount: 50,
        time: admin.firestore.FieldValue.serverTimestamp(),
        details: `Used referral code: ${referralCode}`
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
