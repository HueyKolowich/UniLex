const { db } = require('./mongo/mongoClient');

const studentRatingsCollection = db.collection('student-ratings');

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

module.exports = {
    getAverageHelpfulnessScore,
    setRatingForOtherStudent
}
