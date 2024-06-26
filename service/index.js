require('dotenv').config({path: __dirname +'/.env'})

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const DB = require('./Database.js');
const { webSocketHandler } = require('./WebSocketHandler.js');

const app = express();
const port = 3000;

const authCookieName = 'token';
const roleCookieName = 'role';

app.use(express.json());

app.use(cookieParser());

app.use(express.static('../build')); //!IMPORTANT When pushed to dist folder this must be changed to './build'

app.post('/create', async (req, res) => {
  if (await DB.getUser(req.body.name)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await DB.createUser(req.body.name, req.body.password, req.body.role, req.body.classRoomId);

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
      res.cookie(roleCookieName, user.role, {
        httpOnly: true,
        secure: true
      })
      res.status(200).send({ msg: "Success", role: user.role, classRoomId: user.classRoomId});
      return;
    }
  }
  res.status(401).send({ msg: "Unauthorized" });
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

app.post('/add-prompts', async (req, res) => {
  try {
    const classRoomId = await DB.getClassRoomIdByToken(req.cookies[authCookieName]);
    if (!classRoomId) {
      return res.status(401).json({ error: 'Invalid or missing authentication token' });
    }

    const { promptsList } = req.body;
    if (!Array.isArray(promptsList)) {
      return res.status(400).json({ error: 'Invalid promptsList format' });
    }

    await DB.addPrompts(classRoomId, promptsList);

    res.status(200).json({ message: 'Prompts added successfully' });
  } catch (error) {
    console.error('Error adding prompts:', error);
    res.status(500).json({ error: 'An error occurred while adding prompts' });
  }
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

webSocketHandler(server);
