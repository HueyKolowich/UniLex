import { useState, useEffect } from 'react';
import CollabSession from './CollabSession.js';
import { getVideoToken, VideoSDKMeetingProvider } from './Video.js';
import webSocketMessageTypes from '../shared/WebSocketMessageTypes.js';

function CollabBody({ collabSessionRef, leaveRef }) {
    const [collabSession, setCollabSession] = useState(null);
    const [meetingId, setMeetingId] = useState(null);
    const [videoToken, setVideoToken] = useState(null);
    const [currentPrompt, setCurrentPrompt] = useState({ position: -1, prompt: '' });
    const [promptHelps, setPromptHelps] = useState(['\n', '\n', '\n', '\n', '\n']);
    const [clientWithLock, setClientWithLock] = useState(null);
    const [clientId, setClientId] = useState(null);

    useEffect(() => {
        const initializeSession = async () => {
            try {
                const vidToken = await getVideoToken();
                setVideoToken(vidToken);
                const session = new CollabSession(
                    localStorage.getItem("classRoomId"), 
                    vidToken, 
                    (message) => handleWebSocketMessage(message)
                );
                collabSessionRef.current = session;
                setCollabSession(session);
            } catch (error) {
                console.error('Error initializing session:', error);
            }
        };

        initializeSession();

        return () => {
            if (collabSession && collabSession.socket) {
                collabSession.socket.close();
            }
        };
    }, []); // Empty dependency array ensures this runs only once

    useEffect(() => {
        if (collabSession) {
            collabSession.send({ WebSocketRequestType: webSocketMessageTypes.Initialize });
        }
    }, [collabSession]);

    const handleWebSocketMessage = (message) => {
        const messageObject = JSON.parse(message);

        switch (messageObject.type) {
            case "Initialize":
                setClientId(messageObject.ClientId);
                setClientWithLock(messageObject.UpdateLock);
                setMeetingId(messageObject.MeetingId);
                break;
            case "GetPrompt":
                setCurrentPrompt({ position: messageObject.newPromptPosition, prompt: messageObject.newPrompt });

                if (messageObject.promptHelps) {
                    const parsedPromptHelps = JSON.parse(messageObject.promptHelps);
                    setPromptHelps(parsedPromptHelps.words);
                } else {
                    setPromptHelps(["No hints available"]);
                }
                break;
            case "UpdateLock":
                setClientWithLock(messageObject.clientWithLock);
                break;
            case "ClientId":
                setClientId(messageObject.clientId);
                break;
            default:
                console.warn('Unhandled message type:', messageObject.type);
        }
    };

    return (
        <div>
            {meetingId ? (
                <div className="container-fluid">
                    <div className="row mt-5 d-flex justify-content-between align-items-stretch">
                        <div className="col-md-9">
                            <VideoSDKMeetingProvider videoToken={videoToken} meetingId={meetingId} setMeetingId={setMeetingId} leaveRef={leaveRef} />
                        </div>
                        <div className="col-md-3">
                            <PromptHelps promptHelps={promptHelps} />
                        </div>
                    </div>
                    <DiscussionPrompt
                        currentPrompt={currentPrompt}
                        collabSession={collabSession}
                        clientWithLock={clientWithLock}
                        clientId={clientId}
                    />
                </div>
            ) : (
                <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border" role="status" />
                </div>
            )}
        </div>
    );
}

function PromptHelps({ promptHelps }) {
    return (
        <div className="card h-100 me-5">
            <div className="card-body text-center d-flex flex-column justify-content-center">
                {promptHelps.map((help, index) => (
                    <p className="my-3" key={index}>{help}</p>
                ))}
            </div>
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
                <NextPromptButton
                    currentPromptPosition={currentPrompt.position}
                    collabSession={collabSession}
                    clientWithLock={clientWithLock}
                    clientId={clientId}
                />
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
    const next = () => {
        collabSession.send({ WebSocketRequestType: webSocketMessageTypes.GetPrompt, currentPromptPosition });
    };

    return (
        <button
            type="button"
            className="btn btn-lg btn-block btn-primary mx-auto mb-4"
            id="nextPromptButton"
            onClick={next}
            hidden={clientWithLock !== clientId}
        >
            Next
        </button>
    );
}

export default CollabBody;
