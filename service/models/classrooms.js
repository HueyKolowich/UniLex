const { db } = require('./mongo/mongoClient');

const classroomsCollection = db.collection('classrooms');

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

async function getPrompt(classRoomId, position) {
    try {
        const capitalizeFirstLetter = (string) => {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        const language = await classroomsCollection.findOne(
            { classRoomId: classRoomId },
            { projection: { target: 1 } }
        );

        const classPrompt = await promptsCollection.findOne(
            { classRoomId: classRoomId },
            { projection: { promptsList: { $slice: [position, 1] } } }
        );

        if (classPrompt && classPrompt.promptsList.length > 0) {
            return { ...classPrompt.promptsList[0], language: language ? capitalizeFirstLetter(language.target) : "" };
        } else {
            return "";
        }
    } catch (error) {
        console.error("Error fetching prompt:", error);
        return "";
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
    
        if (classInfo.native && classInfo.target && classInfo.name) {
            return { 
                native: classInfo.native, 
                target: classInfo.target, 
                teacher: !!classInfo.teacher,
                name: classInfo.name
            };
        } else {
            return { 
                native: null, 
                target: null, 
                teacher: null,
                name: null 
            };
        }
    } catch (error) {
        console.error("Error setting getting info for classroom:", error);
        throw error;
    }
}

async function getClasses(username) {
    try {
        const filter = { teacher: username };
    
        const classes = await classroomsCollection.find(filter).toArray();
    
        return classes;
    } catch (error) {
        console.error("Error setting getting info for all classrooms:", error);
        throw error;
    }
}

async function checkPaymentRequirementForClassroom(classRoomId) {
    try {
        const filter = { classRoomId: classRoomId };
        const result = await classroomsCollection.findOne(filter, { projection: { paymentRequired: 1, _id: 0 } });
    
        return result.paymentRequired;
    } catch (error) {
        console.error("Error retrieving the payment requirement for classroom:", error);
        throw error;
    }
}

module.exports = { 
    addUserToClassroom, 
    getPrompt, 
    getStudentUsernamesByClassRoomId, 
    getClassInfo, 
    getClasses, 
    checkPaymentRequirementForClassroom 
}; 
