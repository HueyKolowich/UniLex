import { useState, useEffect } from 'react';
import CollabSession from './CollabSession.js';
import { getVideoToken, VideoSDKMeetingProvider } from './Video.js';
import webSocketMessageTypes from '../shared/WebSocketMessageTypes.js';

const statuses = {
    waiting: "waiting",
    ready: "ready"
};

const turns = {
    this: "this",
    other: "other"
};

function CollabBody() {
    const [status, setStatus] = useState(statuses.waiting);
    const [collabSession, setCollabSession] = useState(null);
    const [meetingId, setMeetingId] = useState(null);
    const [videoToken, setVideoToken] = useState(null);

    useEffect(() => {
        const initializeSession = async () => {
            const token = await getVideoToken();
            setVideoToken(token);
            const session = new CollabSession(token, handleWebSocketMessage);
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
        }
    }, [collabSession]);

    const handleWebSocketMessage = (message) => {
        setMeetingId(message);
    };

    return (
        <div className="container-fluid">
            {meetingId ? (
                status === statuses.ready ? (
                    <div>
                        <VideoSDKMeetingProvider videoToken={videoToken} meetingId={meetingId} setMeetingId={setMeetingId} />
                        <ActivityBody />
                    </div>
                ) : (
                    <div>
                        <VideoSDKMeetingProvider videoToken={videoToken} meetingId={meetingId} setMeetingId={setMeetingId} />
                        <StartCollabButton setStatus={setStatus} />
                    </div>
                )
            ) : (
                <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border" role="status" />
                </div>
            )}
        </div>
    );
}

function StartCollabButton({ setStatus }) {
    function startCollab() {
        setStatus(statuses.ready);
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="StartCollabButton" onClick={startCollab}>
        Ready!
        </button>
    );
}

function ActivityBody() {
    const [turn, setTurn] = useState(turns.other);

    let bodyContent;
    switch (turn) {
        case turns.this:
            bodyContent = <ThisTurnActivity />;
            break;
        case turns.other:
            bodyContent = <OtherTurnActivity setTurn={setTurn} />;
            break;
        default:
            bodyContent = <p>Something has gone wrong, please try again.</p>;
    }

    return <div>{bodyContent}</div>;
}

function ThisTurnActivity() {
    return (
        <div>
            <ThisTurnTaskText />
        </div>
    );
}

function ThisTurnTaskText() {
    return (
        <div className="card my-5">
            <div className="card-header">
                Traduzca:
            </div>
            <div className="card-body">
                <p className="my-1">Jugaron felices en el parque hasta que empezó a llover.</p>
            </div>
        </div>
    );
}

function OtherTurnActivity({ setTurn }) {
    return (
        <div className="d-flex flex-column justify-content-center">
            <OtherTurnTaskText />
            <TheyGotItButton setTurn={setTurn} />
        </div>
    );
}

function OtherTurnTaskText() {
    return (
        <div>
            <div className="card my-5">
                <div className="card-header">
                    Help them translate:
                </div>
                <div className="card-body">
                    <p className="my-1">She walked quickly to catch the bus before it left the stop.</p>
                </div>
            </div>
            <div className="card mb-5">
                <div className="card-header">
                    Into:
                </div>
                <div className="card-body">
                    <p className="my-1">Ella caminó rápido para alcanzar el autobús antes de que saliera de la parada.</p>
                </div>
            </div>
        </div>
    );
}

function TheyGotItButton({ setTurn }) {
    function finish() {
        setTurn(turns.this);
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="theyGotItButton" onClick={finish}>
            They got it!
        </button>
    );
}

export default CollabBody;
