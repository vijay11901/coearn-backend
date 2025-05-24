const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://coearn1.firebaseio.com"
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

// Pending referrals collection
const pendingRef = db.collection('pendingReferrals');

// 1. Initial Referral Validation Endpoint
app.post('/process-referral', async (req, res) => {
  try {
    const { referralCode, newUserEmail } = req.body;
    
    // Validate referral code
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }

    // Store pending referral
    await pendingRef.add({
      referralCode,
      newUserEmail,
      processed: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ valid: true });
  } catch (error) {
    console.error('Referral validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Final Referral Processing Endpoint
app.post('/finalize-referral', async (req, res) => {
  const { referralCode, newUserId } = req.body;
  const batch = db.batch();

  try {
    // Get new user data
    const newUserRef = db.collection('users').doc(newUserId);
    const newUserDoc = await newUserRef.get();
    const newUserEmail = newUserDoc.data().email;

    // Find pending referral
    const pendingQuery = await pendingRef
      .where('referralCode', '==', referralCode)
      .where('newUserEmail', '==', newUserEmail)
      .where('processed', '==', false)
      .limit(1)
      .get();

    if (pendingQuery.empty) {
      return res.status(400).json({ error: 'No valid pending referral' });
    }

    const pendingId = pendingQuery.docs[0].id;
    const referrerQuery = await db.collection('users')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();

    if (referrerQuery.empty) {
      return res.status(400).json({ error: 'Referrer not found' });
    }

    const referrerRef = referrerQuery.docs[0].ref;

    // Transaction for atomic updates
    await db.runTransaction(async (transaction) => {
      // Add 100 coins to new user
      transaction.update(newUserRef, {
        coins: admin.firestore.FieldValue.increment(100)
      });

      // Add 50 coins to referrer
      transaction.update(referrerRef, {
        coins: admin.firestore.FieldValue.increment(50),
        referrals: admin.firestore.FieldValue.increment(1)
      });

      // Mark referral as processed
      transaction.update(pendingRef.doc(pendingId), {
        processed: true
      });
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Final processing error:', error);
    res.status(500).json({ error: 'Failed to process referral' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
