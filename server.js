kconst functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Express app
const app = express();

// Configure middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const auth = admin.auth();

// Authentication middleware
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

// Referral processing endpoint
app.post('/processReferral', verifyToken, async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;

    if (!referralCode || !newUserId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify the requesting user matches the new user ID
    if (req.uid !== newUserId) {
      return res.status(403).json({ error: 'Unauthorized operation' });
    }

    const batch = db.batch();
    const usersRef = db.collection('users');

    // Find referrer
    const referrerQuery = await usersRef
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();

    if (referrerQuery.empty) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    const referrerDoc = referrerQuery.docs[0];
    const referrerId = referrerDoc.id;

    // Get references
    const newUserRef = usersRef.doc(newUserId);
    const referrerRef = usersRef.doc(referrerId);

    // Verify new user exists
    const newUserDoc = await newUserRef.get();
    if (!newUserDoc.exists) {
      return res.status(404).json({ error: 'New user not found' });
    }

    // Add transactions to batch
    batch.update(newUserRef, {
      coins: admin.firestore.FieldValue.increment(100)
    });

    batch.update(referrerRef, {
      coins: admin.firestore.FieldValue.increment(50),
      referrals: admin.firestore.FieldValue.increment(1)
    });

    // Create transaction history
    const newUserHistoryRef = newUserRef.collection('history').doc();
    batch.set(newUserHistoryRef, {
      type: 'referral_bonus',
      amount: 100,
      time: admin.firestore.FieldValue.serverTimestamp(),
      details: `Referral signup bonus using code ${referralCode}`
    });

    const referrerHistoryRef = referrerRef.collection('history').doc();
    batch.set(referrerHistoryRef, {
      type: 'referral_earnings',
      amount: 50,
      time: admin.firestore.FieldValue.serverTimestamp(),
      details: `Referral earnings from ${newUserId}`
    });

    // Commit the batch
    await batch.commit();

    res.status(200).json({
      success: true,
      message: 'Referral bonuses distributed successfully',
      newUserBonus: 100,
      referrerBonus: 50
    });
  } catch (error) {
    console.error('Error processing referral:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Export the Express app as Firebase Cloud Function
exports.api = functions.https.onRequest(app);
