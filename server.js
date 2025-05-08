const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin initialization using environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Test route
app.get('/', (req, res) => {
  res.send('Render server is live!');
});

// Secure signup route
app.post('/signup', async (req, res) => {
  const { name, email, referralCodeInput } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const uid = email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + Date.now(); // Temporary UID
    const userReferralCode = uid.slice(0, 6);
    let coins = 0;
    let referredBy = '';

    if (referralCodeInput) {
      const refQuery = await db.collection('users').where('referralCode', '==', referralCodeInput).limit(1).get();
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

    return res.status(200).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server live on port ${PORT}`);
});
