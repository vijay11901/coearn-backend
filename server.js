const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server running from Render');
});

app.listen(3000, () => {
  console.log('Server is live on port 3000');
});
