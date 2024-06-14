require('dotenv').config()

const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const DB = require('./Database.js');
const { webSocketHandler } = require('./WebSocketHandler.js');

const app = express();
const port = 3000;

const authCookieName = 'token';

app.use(express.json());

app.use(cookieParser());

app.use(express.static('../build')); //!IMPORTANT When pushed to dist folder this must be changed to './build'

app.post('/create', async (req, res) => {
  if (await DB.getUser(req.body.name)) {
      res.status(409).send({ msg: 'Existing user' });
    } else {
      const user = await DB.createUser(req.body.name, req.body.password, req.body.role);
  
      res.send({
        id: user._id,
      });
    }
});

app.post('/login', async (req, res) => {
  const user = await DB.getUser(req.body.name);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const newToken = await DB.generateNewSessionAuthToken(req.body.name);

      res.cookie(authCookieName, newToken, {
        httpOnly: true,
        maxAge: 18000000,
        secure: true
      })
      res.send({ id: user._id, role: user.role });
      return;
    }
  }
  res.status(401).send({ msg: 'Unauthorized' });
});

app.use(async (req, res, next) => {
  token = req.cookies[authCookieName];
  const user = await DB.getUserByToken(token);
  if (user) {
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
});

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
