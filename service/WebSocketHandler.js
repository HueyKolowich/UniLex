const { WebSocketServer } = require('ws');
const uuid = require('uuid');
const url = require('url');
const fetch = require('node-fetch');
const DB = require('./Database.js');
const { sanitzeJSONResponseObjects } = require('./lib/SanitizeResponses.js');
const OpenAI = require('openai');

const openai = new OpenAI();

const groups = new Map();
const locks = new Map();
const promptCounters = new Map();

function webSocketHandler(server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const { query } = url.parse(request.url, true);
        const classRoomId = query.classRoomId;
        const videoToken = query.videoToken;

        if (!videoToken || !classRoomId) {
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, function done(ws) {
            ws.classRoomId = classRoomId;
            ws.videoToken = videoToken;
            wss.emit('connection', ws, request);
        });
    });

    wss.on('connection', async (ws) => {
        const connection = { id: uuid.v4(), ws: ws, classRoomId: ws.classRoomId};
        await groupManager(connection, ws.videoToken);

        logGroups();

        ws.on('message', async function message(data) {
            const dataAsJSON = JSON.parse(data.toString());
            const webSocketRequestType = dataAsJSON.WebSocketRequestType;

            const groupKey = findGroupForConnection(connection);
            if (groupKey) {
                const group = groups.get(groupKey);

                switch (webSocketRequestType) {
                    case "Initialize":
                        group.forEach((c) => {
                            c.ws.send(JSON.stringify({"type" : "Initialize", "MeetingId" : groupKey, "UpdateLock" : locks.get(groupKey), "ClientId" : c.id}));
                        });
                        break;
                    case "GetPrompt":
                        if (locks.get(groupKey) === connection.id) {
                            let promptCounter = promptCounters.get(groupKey);
                            let { currentParticipantReceivingPrompts, promptIndex, finishedFirstParticipantsPrompts } = promptCounter;

                            try {
                                let newPrompt = await DB.getPrompt(currentParticipantReceivingPrompts.classRoomId, promptIndex);

                                if (newPrompt) {
                                    const promptHelps = await generatePromptHelps(newPrompt.prompt);

                                    group.forEach((c) => {
                                        c.ws.send(JSON.stringify({ "type": "GetPrompt", "newPrompt": newPrompt, "promptHelps": promptHelps }));
                                    });

                                    promptCounters.set(groupKey, { ...promptCounter, promptIndex: promptIndex + 1 });
                                } else if (!finishedFirstParticipantsPrompts) {
                                    const otherConnection = Array.from(group).find(c => c.id !== currentParticipantReceivingPrompts.id);

                                    promptCounters.set(groupKey, { currentParticipantReceivingPrompts: otherConnection, promptIndex: 0, finishedFirstParticipantsPrompts: true });

                                    newPrompt = await(DB.getPrompt(otherConnection.classRoomId, 0));

                                    if (newPrompt) {
                                        const promptHelps = await generatePromptHelps(newPrompt.prompt);

                                        group.forEach((c) => {
                                            c.ws.send(JSON.stringify({ "type": "GetPrompt", "newPrompt": newPrompt, "promptHelps": promptHelps }));
                                        });
                                        
                                        promptCounters.set(groupKey, { currentParticipantReceivingPrompts: otherConnection, promptIndex: 1, finishedFirstParticipantsPrompts: true });
                                    } else {
                                        throw new Error();
                                    }

                                    locks.set(groupKey, currentParticipantReceivingPrompts.id);
                                    group.forEach((c) => {
                                        c.ws.send(JSON.stringify({ "type": "UpdateLock", "clientWithLock": currentParticipantReceivingPrompts.id }));
                                    });
                                } else {
                                    group.forEach((c) => {
                                        c.ws.send(JSON.stringify({ "type": "GetPrompt", "newPrompt": "Finished/Terminado" }));
                                        c.ws.send(JSON.stringify({ "type": "UpdateLock", "clientWithLock": null }));
                                    });
                                }
                            } catch (error) {
                                console.error('Error getting prompt:', error);
                                group.forEach((c) => {
                                    c.ws.send(JSON.stringify({ "type": "GetPrompt", "error": "Error retrieving prompt" }));
                                });
                            }
                        } else {
                            ws.send(JSON.stringify({ "type": "GetPrompt", "error": "You don't have the lock" }));
                        }

                        break;
                }
            }
        });

        ws.on('close', () => {
            console.log('Connection closed');
            removeConnectionFromGroup(connection);
            logGroups();
        });
    });
}

async function groupManager(connection, token) {
    let groupKey = null;

    for (const [key, value] of groups) {
        if (value.size <= 1) {
            value.add(connection);
            promptCounters.set(key, {currentParticipantReceivingPrompts: connection, promptIndex: 0, finishedFirstParticipantsPrompts: false});

            groupKey = key;
            break;
        }
    }

    if (!groupKey) {
        groupKey = await generateMeetingId(token);
        groups.set(groupKey, new Set([connection]));
        locks.set(groupKey, connection.id);
    }
}

function findGroupForConnection(connection) {
    for (const [key, value] of groups) {
        if (value.has(connection)) {
            return key;
        }
    }
    return null;
}

function removeConnectionFromGroup(connection) {
    for (const [key, value] of groups) {
        if (value.delete(connection)) {
            if (value.size === 0) {
                groups.delete(key);
                locks.delete(key);
                promptCounters.delete(key);
            }
            break;
        }
    }
}

async function generateMeetingId(token) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token,
        },
    };
    try {
        const result = await fetch(`https://api.videosdk.live/v2/rooms`, options);
        const { roomId } = await result.json();
        return roomId;
    } catch (error) {
        console.log("error", error);
        throw error;
    }
}

async function generatePromptHelps(prompt) {
    const formattedPrompt = "Make an array titled words of 5 words (either in English or Spanish depending on the language of the question) that are not included in the question that you would expect to hear when answering the following question:" 
    + prompt 
    + " return as a JSON object";

    const completion = await openai.chat.completions.create({
        messages: [{role: "user", content: formattedPrompt}],
        model: "gpt-3.5-turbo-1106"
    })

    let helps = completion.choices[0].message.content;
    helps = sanitzeJSONResponseObjects(helps);

    return helps;
}

function logGroups() {
    const groupArray = Array.from(groups.entries()).map(([key, value]) => ({
        key,
        connections: Array.from(value).map(conn => conn.id)
    }));
    console.log(JSON.stringify(groupArray, null, 2));
}

module.exports = { webSocketHandler };
