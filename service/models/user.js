const { hash } = require('bcrypt');
const { v4 } = require('uuid');
const { db } = require('./mongo/mongoClient');

const userCollection = db.collection('user');

async function getUser(username) {
    return await userCollection.findOne({ username: username });
}

async function getUserByToken(token) {
    return await userCollection.findOne({ token: token });
}

async function getClassRoomIdByToken(token) {
    const result = await userCollection.findOne({ token: token});
    
    return result.classRoomId;
}

async function generateNewSessionAuthToken(username) {
    const newToken = v4();
  
    await userCollection.updateOne(
      { username: username },
      { $set: { token: newToken } }
    );
  
    return newToken;
}

async function createUser(username, password, role, classRoomId, email, first, last, phone, target, native, location) {
    const passwordHash = await hash(password, 10);
  
    const user = {
      username: username,
      password: passwordHash,
      token: v4(),
      role: role,
      classRoomId: classRoomId,
      email: email,
      firstname: first,
      lastname: last,
      phone: phone,
      target: target,
      native: native,
      location: location
    };
    await userCollection.insertOne(user);
  
    return user;
}

module.exports = {
    getUser,
    getUserByToken,
    getClassRoomIdByToken,
    generateNewSessionAuthToken,
    createUser
}
