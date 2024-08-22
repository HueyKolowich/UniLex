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
const submissionsCollection = db.collection('submissions');
const classroomsCollection = db.collection('classrooms');
const studentRatingsCollection = db.collection('student-ratings');

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

async function createUser(username, password, role, classRoomId, email, first, last, phone, target, native, location) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    username: username,
    password: passwordHash,
    token: uuid.v4(),
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

async function addUserToClassroom(classRoomId, username, role) {
  try {
    const filter = { classRoomId: classRoomId };

    let updateDoc;

    if (role === "teacher") {
      updateDoc = {
        $set: {
          teacher: username
        }
      };
    } else if (role === "student") {
      updateDoc = {
        $push: {
          studentList: username
        }
      };
    } else {
      throw new Error("Invalid role provided. Must be 'teacher' or 'student'.");
    }

    const result = await classroomsCollection.updateOne(filter, updateDoc);

    if (result.modifiedCount === 0) {
      console.warn("No documents were updated. Check if the classRoomId is correct and the role is valid.");
    }
  } catch (error) {
    console.error("Error adding user to classroom:", error);
    throw error;
  }
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

async function getAllPrompts(classRoomId) {
  try {
    const result = await promptsCollection.findOne({ classRoomId });

    if (result && Array.isArray(result.promptsList)) {
      return result.promptsList;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching prompts from database", error);
    return [];
  }
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

async function getEvents(username, target) {
  try {
    const result = await eventsCollection.find({
      $and: [
        {
          $or: [
            { username: username },
            { native: target }
          ]
        },
        {
          $or: [
            { status: { $ne: "booked" } },
            {
              $and: [
                { status: "booked"},
                { participants: username}
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

async function changeEventStatus(calEventId, username, firstname) {
  try {
    const filter = {
      _id: new ObjectId(calEventId)
    };

    const event = await eventsCollection.findOne(filter);
    const currentTitle = event.title || "";

    const newTitle = `${currentTitle} + ${firstname}`;

    const update = {
      $set: {
        status: "booked",
        title: newTitle
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
    
    const event = await eventsCollection.findOne(filter);
    const otherParticipant = await getUser(event.participants[0]);

    const update = {
      $set: {
        title: otherParticipant.firstname,
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

async function getStudentSubmissions(username) {
  try {
    let result = await submissionsCollection.find({
      username: username
    }).toArray();

    result = result.reverse();
    return result;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    throw error;
  }
}

async function setStudentSubmission(username, classRoomId, timestampOfMeetingAttendance, difficultiesSubmission, improvementSubmission, cultureSubmission, comfortableRating) {
  try {
    const filter = { 
      username: username,
      classRoomId: classRoomId,
      attendedMeeting: timestampOfMeetingAttendance
    };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        classRoomId: classRoomId,
        username: username,
        attendedMeeting: timestampOfMeetingAttendance,
        difficultiesSubmission: difficultiesSubmission,
        improvementSubmission: improvementSubmission,
        cultureSubmission: cultureSubmission,
        comfortableRating: comfortableRating
      }
    };

    await submissionsCollection.updateOne(filter, updateDoc, options);
  } catch (error) {
    console.error("Error submitting student reflection response:", error);
    throw error;
  }
}

async function getLatestMeetingDateAndRating(username) {
  try {
    const filter = { username: username };
    const options = {
      sort: { attendedMeeting: -1 },
      projection: { comfortableRating: 1, attendedMeeting: 1 }
    };

    const latestSubmission = await submissionsCollection.findOne(filter, options);

    if (latestSubmission) {
      return { rating: latestSubmission.comfortableRating, recent: latestSubmission.attendedMeeting };
    } else {
      return { rating: "NA", recent: "NA" };
    }
  } catch (error) {
    console.error("Error getting latest meeting date and rating:", error);
    throw error;
  }
}

async function getAverageHelpfulnessScore(username) {
  try {
    const filter = { username: username };
    const options = {
      projection: { allRatings: 1 }
    };

    const allRatings = await studentRatingsCollection.findOne(filter, options);

    if (allRatings) {
      const ratingAvg = ratings => ratings.reduce((a, b) => a + b) / ratings.length;

      return ratingAvg(allRatings.allRatings);
    } else {
      return "NA";
    }
  } catch (error) {
    console.error("Error getting latest meeting date and rating:", error);
    throw error;
  }
}

async function setRatingForOtherStudent(username, rating) {
  try {
    const filter = {
      username: username
    };
    const options = { upsert: true };
    const updateDoc = {
      $push: {
        allRatings: rating
      }
    };

    await studentRatingsCollection.updateOne(filter, updateDoc, options);
  } catch (error) {
    console.error("Error submitting student rating:", error);
    throw error;
  }
}

async function getStudentUsernamesByClassRoomId(classRoomId) {
  try {
    const filter = { classRoomId: classRoomId };
    
    const classInfo = await classroomsCollection.findOne(filter);

    return classInfo.studentList;
  } catch (error) {
    console.error("Error setting getting student list for classroom:", error);
    throw error;
  }
}

async function getClassInfo(classRoomId) {
  try {
    const filter = { classRoomId: classRoomId };
    
    const classInfo = await classroomsCollection.findOne(filter);

    if (classInfo.native && classInfo.target) {
      return { native: classInfo.native, target: classInfo.target, teacher: !!classInfo.teacher };
    } else {
      return { native: null, target: null, teacher: null };
    }
  } catch (error) {
    console.error("Error setting getting info for classroom:", error);
    throw error;
  }
}

module.exports = {
  getUser,
  getUserByToken,
  getClassRoomIdByToken,
  createUser,
  addUserToClassroom,
  generateNewSessionAuthToken,
  addPrompts,
  getAllPrompts,
  getPrompt,
  getEvents,
  deleteEvent,
  addEvent,
  changeEventStatus,
  getBookedEvents,
  removeNameFromEventParticipantList,
  getDesiredMeetingsCountForUser,
  setDesiredMeetingsCountForUser,
  getStudentSubmissions,
  setStudentSubmission,
  getLatestMeetingDateAndRating,
  getAverageHelpfulnessScore,
  setRatingForOtherStudent, 
  getStudentUsernamesByClassRoomId,
  getClassInfo
};