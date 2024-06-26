import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingProvider,
  // MeetingConsumer,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import ReactPlayer from "react-player";

async function getVideoToken() {
    const videoTokenResponse = await fetch('/generate-video-token');
    const videoToken = await videoTokenResponse.json();

    return videoToken.videoToken;
}

function VideoSDKMeetingProvider({ videoToken, meetingId, setMeetingId }) {
    const onMeetingLeave = () => {
        setMeetingId(null);
    };

    return meetingId && videoToken ? (
        <MeetingProvider
        config={{
            meetingId,
            micEnabled: true,
            webcamEnabled: true,
            name: "CollabMeeting",
        }}
        token={videoToken}
        >
        <MeetingView onMeetingLeave={onMeetingLeave} />
        </MeetingProvider>
    ) : (
        <p>Missing credentials to start a meeting... please re-try</p>
    );
}

function MeetingView({ onMeetingLeave }) {
    const [joined, setJoined] = useState(null);

    const { join, participants } = useMeeting({
        onMeetingJoined: () => {
            setJoined("JOINED");
        },

        onMeetingLeft: () => {
            onMeetingLeave();
        },
    });

    const joinMeeting = () => {
        setJoined("JOINING");
        join();
    };

    return (
        <div className="container mt-5">
        {joined && joined === "JOINED" ? (
            <div className="row my-3 mx-3 d-flex justify-content-center"> 
            {[...participants.keys()].map((participantId) => (
                <div className="col-md-6">
                    <ParticipantView
                    participantId={participantId}        
                    />
                </div>
            ))}
            </div>
        ) : joined && joined === "JOINING" ? (
            <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status" />
            </div>
        ) : (
            <div className="d-flex justify-content-center">
                <button className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="JoinMeetingButton" onClick={joinMeeting}>
                Join
                </button>
            </div>
        )}
        </div>
    );
}

function ParticipantView({ participantId }) {
    const micRef = useRef(null);
    const { webcamStream, micStream, webcamOn, micOn, isLocal } = useParticipant(participantId);

    const videoStream = useMemo(() => {
        if (webcamOn && webcamStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(webcamStream.track);
        return mediaStream;
        }
    }, [webcamStream, webcamOn]);

    useEffect(() => {
        if (micRef.current) {
        if (micOn && micStream) {
            const mediaStream = new MediaStream();
            mediaStream.addTrack(micStream.track);

            micRef.current.srcObject = mediaStream;
            micRef.current
            .play()
            .catch((error) =>
                console.error("videoElem.current.play() failed", error)
            );
        } else {
            micRef.current.srcObject = null;
        }
        }
    }, [micStream, micOn]);

    const width = window.screen.width / 3;

    return (
        <div className="card d-flex justify-content-center align-items-center interlocutorVideoBox">
            <audio ref={micRef} autoPlay playsInline muted={isLocal} />
            {webcamOn && (
                <ReactPlayer
                playsinline // extremely crucial prop
                pip={false}
                light={false}
                controls={false}
                muted={true}
                playing={true}
                url={videoStream}
                width={width}
                onError={(err) => {
                    console.log(err, "participant video error");
                }}
                />
            )}
        </div>
    );
}

export { getVideoToken, VideoSDKMeetingProvider };