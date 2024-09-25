const { db } = require('./mongo/mongoClient');

const meetingsConfigCollection = db.collection('meetings-config');

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
  getDesiredMeetingsCountForUser,
  setDesiredMeetingsCountForUser
};