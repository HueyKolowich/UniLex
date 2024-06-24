const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('unite_db');
const userCollection = db.collection('user');
const promptsCollection = db.collection('prompts');

function getUser(name) {
  return userCollection.findOne({ name: name });
}

function getUserByToken(token) {
  return userCollection.findOne({ token: token });
}

async function generateNewSessionAuthToken(name) {
  const newToken = uuid.v4();

  await userCollection.updateOne(
    { name: name },
    { $set: { token: newToken } }
  );

  return newToken;
}

async function createUser(name, password, role) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    name: name,
    password: passwordHash,
    token: uuid.v4(),
    role: role
  };
  await userCollection.insertOne(user);

  return user;
}

async function getPrompt(position) {
  const result = await promptsCollection.findOne(
    { classRoomId: "1" },
    { projection: { promptsList: { $slice: [position, 1] } } }
  );
  if (result && result.promptsList.length > 0) {
    return result.promptsList[0];
  } else {
    return "";
  }
}


module.exports = {
  getUser,
  getUserByToken,
  createUser,
  generateNewSessionAuthToken,
  getPrompt
};