const { db } = require('./mongo/mongoClient');

const promptsCollection = db.collection('prompts');

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
  try {
    const classPrompt = await promptsCollection.findOne(
      { classRoomId: classRoomId },
      { projection: { promptsList: { $slice: [position, 1] } } }
    );

    if (classPrompt && classPrompt.promptsList.length > 0) {
        return { ...classPrompt.promptsList[0] };
      } else {
        return "";
      }
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return "";
  }
}

module.exports = {
  addPrompts,
  getAllPrompts,
  getPrompt
};
