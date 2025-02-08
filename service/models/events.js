const { ObjectId } = require('mongodb');
const { db } = require('./mongo/mongoClient');

const eventsCollection = db.collection('events');

async function getEvents(username, target) {
    try {
        const result = await eventsCollection
            .find({
                $and: [
                    {
                        $or: [{ username: username }, { native: target }],
                    },
                    {
                        $or: [
                            { status: { $ne: 'booked' } },
                            {
                                $and: [
                                    { status: 'booked' },
                                    { participants: username },
                                ],
                            },
                        ],
                    },
                ],
            })
            .toArray();
        return result;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

async function deleteEvent(calEventId) {
    try {
        const result = await eventsCollection.deleteOne({
            _id: new ObjectId(calEventId),
        });

        if (result.deletedCount === 0) {
            console.error('No document matched the provided _id.');
        }

        return result;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}

async function addEvent(username, title, details, start, end, native, target) {
    try {
        const participants = new Array(1);
        participants[0] = username;

        await eventsCollection.insertOne({
            username,
            title,
            details,
            start,
            end,
            native,
            target,
            status: 'waiting',
            participants: participants,
        });
    } catch (error) {
        console.error('Error adding event:', error);
        throw error;
    }
}

async function changeEventStatus(calEventId, username, firstname) {
    try {
        const filter = {
            _id: new ObjectId(calEventId),
        };

        const event = await eventsCollection.findOne(filter);
        const currentTitle = event.title || '';

        const newTitle = `${currentTitle} + ${firstname}`;

        const update = {
            $set: {
                status: 'booked',
                title: newTitle,
            },
            $push: {
                participants: username,
            },
        };

        const updatedEvent = await eventsCollection.findOneAndUpdate(
            filter,
            update,
            { returnDocument: 'after' }
        );

        return updatedEvent;
    } catch (error) {
        console.error('Error changing status of event:', error);
        throw error;
    }
}

async function getBookedEvents(username) {
    try {
        const result = eventsCollection
            .find({
                $and: [
                    {
                        participants: username,
                    },
                    {
                        status: 'booked',
                    },
                ],
            })
            .toArray();

        return result;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

async function removeNameFromEventParticipantList(
    calEventId,
    otherParticipantFirstname
) {
    try {
        const filter = {
            _id: new ObjectId(calEventId),
        };

        const event = await eventsCollection.findOne(filter);

        const update = {
            $set: {
                title: otherParticipantFirstname,
                status: 'waiting',
            },
            $pop: {
                participants: 1,
            },
        };

        await eventsCollection.findOneAndUpdate(filter, update);
    } catch (error) {
        console.error(
            'Error removing name from participant list on an event:',
            error
        );
        throw error;
    }
}

module.exports = {
    getEvents,
    deleteEvent,
    addEvent,
    changeEventStatus,
    getBookedEvents,
    removeNameFromEventParticipantList,
};
