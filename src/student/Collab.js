import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogActions, Button } from "@mui/material";
import Countdown from 'react-countdown';
import CollabSession from './CollabSession.js';
import ReflectionForm from './ReflectionForm.js';
import { getVideoToken, VideoSDKMeetingProvider } from './Video.js';
import webSocketMessageTypes from '../shared/WebSocketMessageTypes.js';

function CollabBody({ collabSessionRef, leaveRef, bringBackToLogin, setStudentModule, soughtUsername }) {
    const [collabSession, setCollabSession] = useState(null);
    const [meetingId, setMeetingId] = useState(null);
    const [videoToken, setVideoToken] = useState(null);
    const [currentPrompt, setCurrentPrompt] = useState({ prompt: '', time: 0, language: '' });
    const [promptHelps, setPromptHelps] = useState(['\n', '\n', '\n', '\n', '\n']);
    const [clientWithLock, setClientWithLock] = useState(null);
    const [clientId, setClientId] = useState(null);
    const [meetingOver, setMeetingOver] = useState(false);
    const [otherParticipantUsername, setOtherParticipantUsername] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const initializeSession = async () => {
            try {
                const vidToken = await getVideoToken(bringBackToLogin);
                setVideoToken(vidToken);
                const session = new CollabSession(
                    localStorage.getItem("classRoomId"), 
                    vidToken, 
                    localStorage.getItem("username"),
                    soughtUsername,
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
    }, []);
    
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
                setCurrentPrompt(messageObject.newPrompt);

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
            case "MeetingOver":
                setOtherParticipantUsername(messageObject.otherParticipantUsername);
                setModalOpen(true);
                break;
            default:
                console.warn('Unhandled message type:', messageObject.type);
        }
    };

    const handleMeetingClose = () => {
        setMeetingOver(true);

        if (collabSessionRef.current && collabSessionRef.current.socket) {
            collabSessionRef.current.socket.close();
        }

        if (leaveRef.current) {
            leaveRef.current();
        }

        setModalOpen(false);
    };

    return (
        meetingOver ? (
            <div>
                <ReflectionForm otherStudentUsername={otherParticipantUsername} setStudentModule={setStudentModule} />
            </div>
        ) : (
            <div>
                { meetingId ? (
                    <div className="container-fluid student-body d-flex flex-column justify-content-evenly">
                        <div className="d-flex justify-content-evenly mt-2">
                            <VideoSDKMeetingProvider videoToken={videoToken} meetingId={meetingId} setMeetingId={setMeetingId} leaveRef={leaveRef} />
                            <PromptHelps promptHelps={promptHelps} />
                        </div>
                        <DiscussionPrompt
                            currentPrompt={currentPrompt}
                            collabSession={collabSession}
                            clientWithLock={clientWithLock}
                            clientId={clientId}
                        />

                        <Dialog open={modalOpen} onClose={() => handleMeetingClose()}>
                            <DialogContent>
                            <div className="text-center">
                                <h3>The conversation has ended!</h3>
                            </div>
                            </DialogContent>
                            <DialogActions sx={{justifyContent: "center"}}>
                            <Button onClick={() => handleMeetingClose()} sx={{color: "#000000"}}>
                                Okay
                            </Button>
                            </DialogActions>
                        </Dialog>
                    </div>
                ) : (
                    <div className="student-body d-flex flex-column justify-content-center align-items-center">
                        <div className="spinner-border mb-5" role="status" />
                        <h5 className="heading-style-h5 text-center primary">Waiting for the other participant to join the meeting...</h5>
                    </div>
                )}
            </div>
        )
    );
}

function PromptHelps({ promptHelps }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10000);
  
      return () => clearTimeout(timer);
    }, []);

    try {
    return (
         isVisible ? (
            <div className="card suggestions">
                <div className="card-header text-center pb-0">
                    <h6 className="heading-style-h6 primary">Suggestions</h6>
                </div>
                <div className="card-body text-center d-flex flex-column justify-content-center pt-0">
                    {promptHelps.map((help, index) => (
                        <p className="my-auto" key={index}>{help}</p>
                    ))}
                </div>
            </div>
        ) : (
            <></>
        )
    );
    } catch (error) {
        return (
            <div className="card suggestions">
            <div className="card-header text-center">
                <h6 className="heading-style-h6 primary">Suggestions</h6>
            </div>
            <div className="card-body text-center d-flex flex-column justify-content-center">
                <p className="my-3">No hints available</p>
            </div>
        </div>
        );
    }
}

function DiscussionPrompt({ currentPrompt, collabSession, clientWithLock, clientId }) {
    const timeRenderer = ({ minutes, seconds, completed }) => {
        return (
            <span className="d-flex" style={{width: "75px"}}>
                {completed ? (
                    <h1>00:00</h1>
                ) : (
                    <>
                        <h1>{minutes < 10 ? `0${minutes}` : minutes}</h1>
                        <h1>:</h1>
                        <h1>{seconds < 10 ? `0${seconds}` : seconds}</h1>
                    </>
                )}
            </span>
        );
    };

    return (
        <div className="mt-2">
            { currentPrompt.prompt ? (
                <div className="d-flex align-items-center my-3">
                    <div className="d-flex justify-content-center align-items-center ms-4 me-5" style={{height: "112px"}}>
                        <Countdown 
                            date={Date.now() + currentPrompt.time}
                            renderer={timeRenderer}
                            overtime={true}
                        />
                    </div>
                    <div className="card w-100">
                        <div className="card-header text-center heading-style-h5">
                            <h5 className="heading-style-h5 primary">Discuss the following in {currentPrompt.language} together:</h5>
                        </div>
                        <div className="card-body text-center pt-0">
                            <DiscussionPromptText prompt={currentPrompt.prompt} />
                        </div>
                    </div>
                    <div className="d-flex justify-content-center align-items-center mx-3">
                        <NextPromptButton
                            collabSession={collabSession}
                            clientWithLock={clientWithLock}
                            clientId={clientId}
                        />
                    </div>
                </div>
            ) : (
                <div className="d-flex flex-column align-items-center justify-content-center">
                    <h5 className="heading-style-h5 text-center primary">
                        { clientWithLock === clientId ? 
                        "Take a minute to introduce yourselves! Click the icon whenever you are ready for the next prompt." 
                        : 
                        "Take a minute to introduce yourselves!"
                        }
                        </h5>
                    <NextPromptButton
                        collabSession={collabSession}
                        clientWithLock={clientWithLock}
                        clientId={clientId}
                    />
                </div>
            )}
        </div>
    );
}

function DiscussionPromptText({ prompt }) {
    return (
        <h4>{prompt}</h4>
    );
}

function NextPromptButton({ collabSession, clientWithLock, clientId }) {
    const next = () => {
        collabSession.send({ WebSocketRequestType: webSocketMessageTypes.GetPrompt });
    };

    return (
        <i className="bi bi-chevron-double-right next-prompt-icon" onClick={next} hidden={clientWithLock !== clientId} />
    );
}

export default CollabBody;
