const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('unite_db');
const userCollection = db.collection('user');
const promptsCollection = db.collection('prompts');
const eventsCollection = db.collection('events');
const meetingsConfigCollection = db.collection('meetings-config');

function getUser(username) {
  return userCollection.findOne({ username: username });
}

function getUserByToken(token) {
  return userCollection.findOne({ token: token });
}

async function getClassRoomIdByToken(token) {
  const result = await userCollection.findOne({ token: token});
  
  return result.classRoomId;
}

async function generateNewSessionAuthToken(username) {
  const newToken = uuid.v4();

  await userCollection.updateOne(
    { username: username },
    { $set: { token: newToken } }
  );

  return newToken;
}

async function createUser(username, password, role, classRoomId) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    username: username,
    password: passwordHash,
    token: uuid.v4(),
    role: role,
    classRoomId: classRoomId
  };
  await userCollection.insertOne(user);

  return user;
}

async function addPrompts(classRoomId, promptsList) {
  const filter = { classRoomId: classRoomId };
  const options = { upsert: true };
  const updateDoc = {
    $set: {
      promptsList: promptsList
    }
  };
  
  await promptsCollection.updateOne(filter, updateDoc, options);
}

async function getPrompt(classRoomId, position) {
  const result = await promptsCollection.findOne(
    { classRoomId: classRoomId },
    { projection: { promptsList: { $slice: [position, 1] } } }
  );
  if (result && result.promptsList.length > 0) {
    return result.promptsList[0];
  } else {
    return "";
  }
}

async function getEvents(firstname, username, target) {
  try {
    const result = await eventsCollection.find({
      $and: [
        {
          $or: [
            { title: firstname },
            { native: target }
          ]
        },
        {
          $or: [
            { status: { $ne: "booked" } },
            {
              $or: [
                {
                  $and: [
                    { status: "booked"},
                    { participants: username}
                  ]
                }
              ]
            }
          ]
        }
      ]
    }).toArray();
    return result;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

async function deleteEvent(calEventId) {
  try {
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(calEventId) });
    
    if (result.deletedCount === 0) {
      console.error("No document matched the provided _id.");
    }
    
    return result;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}


async function addEvent(username, title, details, start, end, native, target) {
  try {
    const participants = new Array(1);
    participants[0] = username;

    await eventsCollection.insertOne({ username, 
      title, 
      details, 
      start, 
      end, 
      native, 
      target, 
      status: "waiting",
      participants: participants
    });
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
}

async function changeEventStatus(calEventId, username) {
  try {
    const filter = {
      _id: new ObjectId(calEventId)
    };
    const update = {
      $set: {
        status: "booked"
      },
      $push: {
        participants: username
      }
    };

    await eventsCollection.findOneAndUpdate(filter, update);
  } catch (error) {
    console.error("Error changing status of event:", error);
    throw error;
  }
}

async function getBookedEvents(username) {
  try {
    const result = eventsCollection.find({
      $and: [
        {
          participants: username
        },
        {
          status: "booked"
        }
      ]
    }).toArray();

    return result;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

async function removeNameFromEventParticipantList(calEventId) {
  try {
    const filter = {
      _id: new ObjectId(calEventId)
    };
    const update = {
      $set: {
        status: "waiting"
      },
      $pop: {
        participants: -1
      }
    };

    await eventsCollection.findOneAndUpdate(filter, update);
  } catch (error) {
    console.error("Error removing name from participant list on an event:", error);
    throw error;
  }
}

async function getDesiredMeetingsCountForUser(username) {
  try {
    const filter = { username: username };
    
    const meetingConfig = await meetingsConfigCollection.findOne(filter);

    return meetingConfig ? meetingConfig.desiredcount : 0;
  } catch (error) {
    console.error("Error setting desired meetings count for user:", error);
    throw error;
  }
}

async function setDesiredMeetingsCountForUser(username, meetingsCount) {
  try {
    const filter = { username: username };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        desiredcount: meetingsCount,
        actualcount: 0
      }
    };
    
    await meetingsConfigCollection.updateOne(filter, updateDoc, options);
  } catch (error) {
    console.error("Error setting desired meetings count for user:", error);
    throw error;
  }
}


module.exports = {
  getUser,
  getUserByToken,
  getClassRoomIdByToken,
  createUser,
  generateNewSessionAuthToken,
  addPrompts,
  getPrompt,
  getEvents,
  deleteEvent,
  addEvent,
  changeEventStatus,
  getBookedEvents,
  removeNameFromEventParticipantList,
  getDesiredMeetingsCountForUser,
  setDesiredMeetingsCountForUser
};