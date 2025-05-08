const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // yahan aapki key file honi chahiye

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Home route
app.get('/', (req, res) => {
  res.send('Server running from Render');
});

// Signup route
app.post('/signup', async (req, res) => {
  const { name, email, password, referralCode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({ email, password });
    const uid = userRecord.uid;
    const userReferralCode = uid.slice(0, 6);
    let referredBy = '';
    let coins = 0;

    // Check referral code
    if (referralCode) {
      const refSnapshot = await db.collection('users')
        .where('referralCode', '==', referralCode)
        .limit(1)
        .get();

      if (!refSnapshot.empty) {
        const refDoc = refSnapshot.docs[0];
        const refData = refDoc.data();
        referredBy = referralCode;
        coins = 10;

        // Update referrer
        await db.collection('users').doc(refDoc.id).update({
          coins: (refData.coins || 0) + 5,
          referrals: (refData.referrals || 0) + 1
        });
      } else {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    // Create user document
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
    console.error(err);
    return res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server is live on port 3000');
});
