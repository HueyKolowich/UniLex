require('dotenv').config({path: __dirname +'/.env'})

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const DB = require('./Database.js');
const { webSocketHandler } = require('./WebSocketHandler.js');
const OpenAI = require('openai');

const app = express();
const port = 3000;

const openai = new OpenAI();

const authCookieName = 'token';
const roleCookieName = 'role';

app.use(express.json());

app.use(cookieParser());

app.use(express.static('../build')); //!IMPORTANT When pushed to dist folder this must be changed to './build'

app.post('/create', async (req, res) => {
  if (await DB.getUser(req.body.username)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await DB.createUser(req.body.username, req.body.password, req.body.role, req.body.classRoomId);

    res.send({
      id: user._id,
    });
  }
});

app.post('/login', async (req, res) => {
  const user = await DB.getUser(req.body.username);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const newToken = await DB.generateNewSessionAuthToken(req.body.username);

      res.cookie(authCookieName, newToken, {
        httpOnly: true,
        maxAge: 18000000,
        secure: true
      })
      res.cookie(roleCookieName, user.role, {
        httpOnly: true,
        secure: true
      })
      res.status(200).send({ msg: "Success", role: user.role, username: user.username, classRoomId: user.classRoomId});
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

app.get('/current-meeting-scheduled', async (req, res) => {
  try {
    const token = req.cookies[authCookieName];
    const user = await DB.getUserByToken(token);

    const events = await DB.getBookedEvents(user.username);
    const now = new Date();

    let result = false;

    for (const event of events) {
      const start = new Date(event.start);
      const end = new Date(event.end);

      if (start <= now && now <= end) {
        result = true;
        break;
      }
    }

    res.status(200).json({ result: result });
  } catch (error) {
    console.error('Error checking if there is a current meeting scheduled:', error);
    res.status(500).json({ error: 'An error occurred while checking if there is a current meeting scheduled' });
  }
});

app.get('/prompts', async (req, res) => {
  try {
    token = req.cookies[authCookieName];
    const user = await DB.getUserByToken(token);

    const { promptLevel } = req.query;

    const formattedPrompt = "Generate a " 
    + user.target
    + " discussion prompt based off the "
    + promptLevel
    + " ACTFL level."
    + " Return just the prompt as a JSON object";

    const completion = await openai.chat.completions.create({
        messages: [{role: "user", content: formattedPrompt}],
        model: "gpt-4o-mini"
    })

    let prompt = completion.choices[0].message.content;
    prompt = sanitzeJSONResponseObjects(prompt);

    res.status(200).json({ prompt });
  } catch (error) {
    console.error('Error generating prompt:', error);
    res.status(500).json({ error: 'An error occurred while generating a prompt' });
  }
});

app.post('/prompts', async (req, res) => {
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

app.get('/events', async (req, res) => {
  try {
    token = req.cookies[authCookieName];
    const user = await DB.getUserByToken(token);

    const events = await DB.getEvents(user.firstname, user.username, user.target);
    res.status(200).json({ events: events });
  } catch (error) {
    console.error("Error getting events:", error);
    res.status(500).json({ error: "An error occurred while getting events" });
  }
});

app.delete('/events', async (req, res) => {
  const { calEventId } = req.body;

  try {
    token = req.cookies[authCookieName];
    const user = await DB.getUserByToken(token);

    await DB.deleteEvent(calEventId);

    const events = await DB.getEvents(user.firstname, user.username, user.target);
    res.status(200).json({ events: events });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "An error occurred while deleting event" });
  }
});

app.post('/events', async (req, res) => {
  const { start, end } = req.body;

  try {
    token = req.cookies[authCookieName];
    const user = await DB.getUserByToken(token);

    await DB.addEvent(user.username, user.firstname, user.location, start, end, user.native, user.target);
    res.status(201).json({ message: 'Event added successfully', title: user.firstname, details: user.location });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while adding the event' });
  }
});

app.post('/events-status', async (req, res) => {
  const { calEventId } = req.body;

  try {
    token = req.cookies[authCookieName];
    const user = await DB.getUserByToken(token);

    await DB.changeEventStatus(calEventId, user.username);

    const events = await DB.getEvents(user.firstname, user.username, user.target);
    res.status(200).json({ events: events });
  } catch (error) {
    console.error("Error changing status of event:", error);
    res.status(500).json({ error: "An error occurred while changing the status of an event" });
  }
});

app.delete('/events-status', async (req, res) => {
  const { calEventId } = req.body;

  try {
    token = req.cookies[authCookieName];
    const user = await DB.getUserByToken(token);

    await DB.removeNameFromEventParticipantList(calEventId);

    const events = await DB.getEvents(user.firstname, user.username, user.target);
    res.status(200).json({ events: events });
  } catch (error) {
    console.error("Error changing status of event:", error);
    res.status(500).json({ error: "An error occurred while changing the status of an event" });
  } 
});

app.get('/meetingcount', async (req, res) => {
  try {
    token = req.cookies[authCookieName];
    const user = await DB.getUserByToken(token);

    const result = await DB.getDesiredMeetingsCountForUser(user.username);

    res.status(200).json({ count: result });
  } catch (error) {
    console.error("Error getting desired meetings count for user:", error);
    res.status(500).json({ error: "An error occurred while getting desired meetings count for user" });
  }
});

app.post('/meetingcount', async (req, res) => {
  const { meetingsCount } = req.body;

  try {
    token = req.cookies[authCookieName];
    const user = await DB.getUserByToken(token);

    await DB.setDesiredMeetingsCountForUser(user.username, meetingsCount);

    res.status(200).json({ msg: "Success" });
  } catch (error) {
    console.error("Error setting desired meetings count for user:", error);
    res.status(500).json({ error: "An error occurred while setting desired meetings count for user" });
  }
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

webSocketHandler(server);

function sanitzeJSONResponseObjects(input) {
  const firstBraceIndex = input.indexOf('{');
  const lastBraceIndex = input.lastIndexOf('}');
  
  if (firstBraceIndex === -1 || lastBraceIndex === -1 || firstBraceIndex >= lastBraceIndex) {
      return '';
  }
  
  return input.substring(firstBraceIndex, lastBraceIndex + 1);
}
