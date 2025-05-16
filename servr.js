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

// Route to validate referral code
app.get('/check-referral/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const refSnap = await db.collection('users').where('referralCode', '==', code).limit(1).get();

    if (refSnap.empty) return res.status(404).json({ exists: false });
    const user = refSnap.docs[0].data();
    res.json({ exists: true, name: user.name });
  } catch (err) {
    res.status(500).json({ message: 'Error checking referral' });
  }
});

// Signup Route
app.post('/signup', verifyToken, async (req, res) => {
  const { name, email, referralCodeInput } = req.body;
  const uid = req.uid;

  try {
    const userReferralCode = uid.slice(0, 6);
    let coins = 0;
    let referredBy = '';
    const tasks = [];

    if (referralCodeInput) {
      const refQuery = await db.collection('users')
        .where('referralCode', '==', referralCodeInput)
        .limit(1)
        .get();

      if (!refQuery.empty) {
        const refDoc = refQuery.docs[0];
        const refData = refDoc.data();
        referredBy = referralCodeInput;
        coins = 10;

        // Add referral update task
        tasks.push(
          db.collection('users').doc(refDoc.id).update({
            coins: (refData.coins || 0) + 5,
            referrals: (refData.referrals || 0) + 1
          })
        );
      } else {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    // Add user creation task
    tasks.push(
      db.collection('users').doc(uid).set({
        name,
        email,
        referralCode: userReferralCode,
        referredBy,
        coins,
        referrals: 0,
        createdAt: new Date().toISOString()
      })
    );

    await Promise.all(tasks);
    res.json({ message: 'Signup success' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW: Secure backend endpoint to process referral after signup
app.post('/process-referral', async (req, res) => {
  const { userId, referralCode } = req.body;

  try {
    // 1. Verify referral code exists in referralCodes collection
    const refDoc = await admin.firestore().collection('referralCodes').doc(referralCode).get();
    if (!refDoc.exists) return res.status(400).json({ error: "Invalid code" });

    // 2. Transaction to update both users securely
    await admin.firestore().runTransaction(async t => {
      const referrerId = refDoc.data().userId;

      // New user gets +10 coins
      t.update(admin.firestore().collection('users').doc(userId), {
        coins: admin.firestore.FieldValue.increment(10)
      });

      // Referrer gets +5 coins and referral count
      t.update(admin.firestore().collection('users').doc(referrerId), {
        coins: admin.firestore.FieldValue.increment(5),
        totalReferrals: admin.firestore.FieldValue.increment(1)
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Referral processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
