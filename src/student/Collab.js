import { useState, useEffect } from 'react';
import CollabSession from './CollabSession.js';
import { getVideoToken, VideoSDKMeetingProvider } from './Video.js';
import webSocketMessageTypes from '../shared/WebSocketMessageTypes.js';

function CollabBody() {
    const [collabSession, setCollabSession] = useState(null);
    const [meetingId, setMeetingId] = useState(null);
    const [videoToken, setVideoToken] = useState(null);
    const [currentPrompt, setCurrentPrompt] = useState({"position" : -1, "prompt" : ""});
    const [clientWithLock, setClientWithLock] = useState(null);
    const [clientId, setClientId] = useState(null);

    useEffect(() => {
        const initializeSession = async () => {
            const vidToken = await getVideoToken();
            setVideoToken(vidToken);
            const session = new CollabSession(
                localStorage.getItem("classRoomId"), 
                vidToken, 
                (message) => handleWebSocketMessage(message, setMeetingId, setCurrentPrompt, setClientWithLock, setClientId)
            );
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
            collabSession.send({ WebSocketRequestType: webSocketMessageTypes.Initialize });
            collabSession.send({ WebSocketRequestType: webSocketMessageTypes.GetPrompt, "currentPromptPosition" : currentPrompt.position});
        }
    }, [collabSession]);

    return (
        <div className="container-fluid">
            {meetingId ? (
                <div>
                    <VideoSDKMeetingProvider videoToken={videoToken} meetingId={meetingId} setMeetingId={setMeetingId} />
                    <DiscussionPrompt currentPrompt={currentPrompt} collabSession={collabSession} clientWithLock={clientWithLock} clientId={clientId} />
                </div>
            ) : (
                <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border" role="status" />
                </div>
            )}
        </div>
    );
}

function DiscussionPrompt({ currentPrompt, collabSession, clientWithLock, clientId }) {
    return (
        <div>
            <div className="card my-5">
                <div className="card-header">
                    Discuss:
                </div>
                <div className="card-body text-center">
                    <DiscussionPromptText prompt={currentPrompt.prompt} />
                </div>
            </div>
            <div className="d-flex justify-content-center">
                <NextPromptButton currentPromptPosition={currentPrompt.position} collabSession={collabSession} clientWithLock={clientWithLock} clientId={clientId} />
            </div>
        </div>
    );
}

function DiscussionPromptText({ prompt }) {
    return (
        <h4 className="my-1 DiscussionPromptText">{prompt}</h4>
    );
}

function NextPromptButton({ currentPromptPosition, collabSession, clientWithLock, clientId }) {
    function next() {
        collabSession.send({ WebSocketRequestType: webSocketMessageTypes.GetPrompt, "currentPromptPosition" : currentPromptPosition});
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="nextPromptButton" onClick={next} hidden={clientWithLock !== clientId}>
            Next
        </button>
    );
}

const handleWebSocketMessage = (message, setMeetingId, setCurrentPrompt, setClientWithLock, setClientId) => {
    const messageObject = JSON.parse(message);

    switch (messageObject.type) {
        case "Initialize":
            setClientId(messageObject.ClientId);
            setClientWithLock(messageObject.UpdateLock);
            setMeetingId(messageObject.MeetingId);
            break;
        case "GetPrompt":
            setCurrentPrompt({"position" : messageObject.newPromptPosition, "prompt" : messageObject.newPrompt});
            break;
        case "UpdateLock":
            setClientWithLock(messageObject.clientWithLock);
            break;
        case "ClientId":
            setClientId(messageObject.clientId);
            break;
    }
};

export default CollabBody;
