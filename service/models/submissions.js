const { db } = require('./mongo/mongoClient');

const submissionsCollection = db.collection('submissions');

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

module.exports = {
  getStudentSubmissions,
  setStudentSubmission,
  getLatestMeetingDateAndRating
}
