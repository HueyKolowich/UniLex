const { WebSocketServer } = require('ws');
const uuid = require('uuid');
const url = require('url');
const fetch = require('node-fetch');
const DB = require('./Database.js');
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
                        const currentCount = promptCounters.get(groupKey) || 0;
                        const increment = currentCount % 2 === 0 ? 1 : 0;
                        const newPromptPosition = dataAsJSON.currentPromptPosition + increment;
                        const clientId = connection.id;

                        if (locks.get(groupKey) === clientId) {
                            const otherClient = Array.from(group).find(c => c.id !== clientId);

                            try {
                                if (otherClient) {
                                    const newPrompt = await DB.getPrompt(otherClient.classRoomId, newPromptPosition);

                                    if (newPrompt) {
                                        const promptHelps = await generatePromptHelps(newPrompt);

                                        group.forEach((c) => {
                                            c.ws.send(JSON.stringify({ "type": "GetPrompt", "newPromptPosition": newPromptPosition, "newPrompt": newPrompt, "promptHelps": promptHelps }));
                                        });
                                    } else {
                                        group.forEach((c) => {
                                            c.ws.send(JSON.stringify({ "type": "GetPrompt", "newPromptPosition": newPromptPosition, "newPrompt": "Finished/Terminado" }));
                                            c.ws.send(JSON.stringify({ "type": "UpdateLock", "clientWithLock": null }));
                                        });
                                    }
                                }
                            } catch (error) {
                                console.error('Error getting prompt:', error);
                                group.forEach((c) => {
                                    c.ws.send(JSON.stringify({ "type": "GetPrompt", "error": "Error retrieving prompt" }));
                                });
                            }

                            if (otherClient) {
                                locks.set(groupKey, otherClient.id);
                                group.forEach((c) => {
                                    c.ws.send(JSON.stringify({ "type": "UpdateLock", "clientWithLock": otherClient.id }));
                                });
                            }

                            promptCounters.set(groupKey, currentCount + 1);
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
            groupKey = key;
            break;
        }
    }

    if (!groupKey) {
        groupKey = await generateMeetingId(token);
        groups.set(groupKey, new Set([connection]));
        locks.set(groupKey, connection.id);
        promptCounters.set(groupKey, 0);
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

    return completion.choices[0].message.content;
}

function logGroups() {
    const groupArray = Array.from(groups.entries()).map(([key, value]) => ({
        key,
        connections: Array.from(value).map(conn => conn.id)
    }));
    console.log(JSON.stringify(groupArray, null, 2));
}

module.exports = { webSocketHandler };
