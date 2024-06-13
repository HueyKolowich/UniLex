require('dotenv').config()

const express = require('express');
const jwt = require('jsonwebtoken');
const { webSocketHandler } = require('./WebSocketHandler.js');

const app = express();
const port = 3000;

app.use(express.static('../build')); //!IMPORTANT When pushed to dist folder this must be changed to './build'

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

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

webSocketHandler(server);
