const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Home route (just to check if server is live)
app.get('/', (req, res) => {
  res.send('Server running from Render');
});

// Actual Signup route
app.post('/signup', (req, res) => {
  const { name, email, password, referralCode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  // Temporary response for testing
  res.status(200).json({
    message: 'Signup successful (Mock)',
    name,
    email,
    referralCode
  });
});

app.listen(3000, () => {
  console.log('Server is live on port 3000');
});
