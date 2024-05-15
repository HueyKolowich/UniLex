const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const app = express();
const port = 3000;

app.use(express.static('./build'));

app.get('/generate-video-token', (req, res) => {
  const options = { 
      expiresIn: '120m', 
      algorithm: 'HS256' 
  };

  const payload = {
      apikey: process.env.VIDEOSDK_API_KEY,
      permissions: ['allow_join']
  };

  const videoToken = jwt.sign(payload, process.env.VIDEOSDK_SECRET_KEY, options);

  res.json({ videoToken });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});