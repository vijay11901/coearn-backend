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
  const { code } = req.params;
  const refSnap = await db.collection('users').where('referralCode', '==', code).limit(1).get();

  if (refSnap.empty) return res.status(404).json({ exists: false });
  const user = refSnap.docs[0].data();
  res.json({ exists: true, name: user.name });
});

// Signup Route
app.post('/signup', verifyToken, async (req, res) => {
  const { name, email, referralCodeInput } = req.body;
  const uid = req.uid;

  try {
    const userReferralCode = uid.slice(0, 6);
    let coins = 0;
    let referredBy = '';

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

        await db.collection('users').doc(refDoc.id).update({
          coins: (refData.coins || 0) + 5,
          referrals: (refData.referrals || 0) + 1
        });
      } else {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    await db.collection('users').doc(uid).set({
      name,
      email,
      referralCode: userReferralCode,
      referredBy,
      coins,
      referrals: 0,
      createdAt: new Date().toISOString()
    });

    res.json({ message: 'Signup success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

