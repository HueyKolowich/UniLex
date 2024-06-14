const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('unite_db');
const userCollection = db.collection('user');

function getUser(name) {
    return userCollection.findOne({ name: name });
}

function getUserByToken(token) {
  return userCollection.findOne({ token: token });
}

async function generateNewSessionAuthToken(name) {
    const newToken = uuid.v4();

    userCollection.runCommand(
        {
            update: "users",
            updates: [
                {
                    q: { name: name }, u: { $set: { token: newToken} }
                }
            ]
        }
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

module.exports = {
  getUser,
  getUserByToken,
  createUser,
  generateNewSessionAuthToken
};