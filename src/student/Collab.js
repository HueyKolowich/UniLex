import { useState, useEffect } from 'react';
import CollabSession from './CollabSession.js';
import { getVideoToken, VideoSDKMeetingProvider } from './Video.js';
import webSocketMessageTypes from '../shared/WebSocketMessageTypes.js';

function CollabBody() {
    const [collabSession, setCollabSession] = useState(null);
    const [meetingId, setMeetingId] = useState(null);
    const [videoToken, setVideoToken] = useState(null);
    const [currentPrompt, setCurrentPrompt] = useState({"position" : -1, "prompt" : "..."});

    useEffect(() => {
        const initializeSession = async () => {
            const token = await getVideoToken();
            setVideoToken(token);
            const session = new CollabSession(token, (message) => handleWebSocketMessage(message, setMeetingId, setCurrentPrompt));
            setCollabSession(session);
        };

        initializeSession();

        return () => {
            if (collabSession && collabSession.socket) {
                collabSession.socket.close();
            }
        };
    }, []); //!IMPORTANT It is necessary that this depedency array remains empty so that it only runs once

    useEffect(() => {
        if (collabSession) {
            collabSession.send({ WebSocketRequestType: webSocketMessageTypes.MeetingId });
            collabSession.send({ WebSocketRequestType: webSocketMessageTypes.GetPrompt, "currentPromptPosition" : currentPrompt.position});
        }
    }, [collabSession]);

    return (
        <div className="container-fluid">
            {meetingId ? (
                <div>
                    <VideoSDKMeetingProvider videoToken={videoToken} meetingId={meetingId} setMeetingId={setMeetingId} />
                    <DiscussionPrompt currentPrompt={currentPrompt} collabSession={collabSession} />
                </div>
            ) : (
                <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border" role="status" />
                </div>
            )}
        </div>
    );
}

function DiscussionPrompt({ currentPrompt, collabSession }) {
    return (
        <div>
            <div className="card my-5">
                <div className="card-header">
                    Discuss/Discutan:
                </div>
                <div className="card-body">
                    <DiscussionPromptText prompt={currentPrompt.prompt} />
                </div>
            </div>
            <div className="d-flex justify-content-center">
                <NextPromptButton currentPromptPosition={currentPrompt.position} collabSession={collabSession} />
            </div>
        </div>
    );
}

function DiscussionPromptText({ prompt }) {
    return (
        <p className="my-1">{prompt}</p>
    );
}

function NextPromptButton({ currentPromptPosition, collabSession }) {
    function next() {
        collabSession.send({ WebSocketRequestType: webSocketMessageTypes.GetPrompt, "currentPromptPosition" : currentPromptPosition});
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="nextPromptButton" onClick={next}>
            Next/Siguente
        </button>
    );
}

const handleWebSocketMessage = (message, setMeetingId, setCurrentPrompt) => {
    const messageObject = JSON.parse(message);

    switch (messageObject.type) {
        case "MeetingId":
            setMeetingId(messageObject.data);
            break;
        case "GetPrompt":
            setCurrentPrompt({"position" : messageObject.newPromptPosition, "prompt" : messageObject.newPrompt});
            break;
    }
};

export default CollabBody;
