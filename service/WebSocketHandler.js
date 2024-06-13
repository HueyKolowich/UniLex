
const { WebSocketServer } = require('ws');
const uuid = require('uuid');
const url = require('url');
const fetch = require('node-fetch');

const groups = new Map();

function webSocketHandler(server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const { query } = url.parse(request.url, true);
        const token = query.token;

        if (!token) {
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, function done(ws) {
            ws.token = token;
            wss.emit('connection', ws, request);
        });
    });

    wss.on('connection', async (ws) => {
        const connection = { id: uuid.v4(), ws: ws };
        await groupManager(connection, ws.token);

        logGroups();

        ws.on('message', function message(data) {
            const groupKey = findGroupForConnection(connection);
            if (groupKey) {
                const group = groups.get(groupKey);
                group.forEach((c) => {
                    c.ws.send(groupKey);
                });
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

function logGroups() {
    const groupArray = Array.from(groups.entries()).map(([key, value]) => ({
        key,
        connections: Array.from(value).map(conn => conn.id)
    }));
    console.log(JSON.stringify(groupArray, null, 2));
}

module.exports = { webSocketHandler };
