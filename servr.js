const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server running from Render');
});

// Render ke liye port ENV se lena zaruri hai
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is live on port ${PORT}`);
});
