const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin using environment variable (if deployed on Render)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Token verification middleware
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

// POST: /processReferral
app.post('/processReferral', verifyToken, async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;

    if (!referralCode || !newUserId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (req.uid !== newUserId) {
      return res.status(403).json({ error: 'Unauthorized operation' });
    }

    const usersRef = db.collection('users');

    // Find referrer by referralCode
    const refQuery = await usersRef.where('referralCode', '==', referralCode).limit(1).get();
    if (refQuery.empty) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    const referrerDoc = refQuery.docs[0];
    const referrerId = referrerDoc.id;

    const newUserRef = usersRef.doc(newUserId);
    const referrerRef = usersRef.doc(referrerId);

    const newUserDoc = await newUserRef.get();
    if (!newUserDoc.exists) {
      return res.status(404).json({ error: 'New user not found' });
    }

    const batch = db.batch();

    // Update coins and referral count
    batch.update(newUserRef, {
      coins: admin.firestore.FieldValue.increment(100)
    });

    batch.update(referrerRef, {
      coins: admin.firestore.FieldValue.increment(50),
      referrals: admin.firestore.FieldValue.increment(1)
    });

    // Add to history
    batch.set(newUserRef.collection('history').doc(), {
      type: 'referral_bonus',
      amount: 100,
      time: admin.firestore.FieldValue.serverTimestamp(),
      details: `Used referral code ${referralCode}`
    });

    batch.set(referrerRef.collection('history').doc(), {
      type: 'referral_earnings',
      amount: 50,
      time: admin.firestore.FieldValue.serverTimestamp(),
      details: `Earned from referral ${newUserId}`
    });

    await batch.commit();

    res.status(200).json({
      success: true,
      message: 'Referral bonuses distributed successfully',
      newUserBonus: 100,
      referrerBonus: 50
    });
  } catch (err) {
    console.error('Referral processing error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Referral server running on port ${PORT}`);
});
