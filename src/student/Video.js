import React, { useEffect, useMemo, useRef } from "react";
import {
  MeetingProvider,
  // MeetingConsumer,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import ReactPlayer from "react-player";

async function getVideoToken({ bringBackToLogin }) {
    const videoTokenResponse = await fetch('/generate-video-token');
    if (videoTokenResponse.status === 401) {
        bringBackToLogin();
    }
    const videoToken = await videoTokenResponse.json();

    return videoToken.videoToken;
}

function VideoSDKMeetingProvider({ videoToken, meetingId, setMeetingId, leaveRef }) {
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
        joinWithoutUserInteraction={true}
        >
        <MeetingView onMeetingLeave={onMeetingLeave} leaveRef={leaveRef} />
        </MeetingProvider>
    ) : (
        <p>Missing credentials to start a meeting... please re-try</p>
    );
}

function MeetingView({ onMeetingLeave, leaveRef }) {
    const { participants, leave } = useMeeting({
        onMeetingLeft: () => {
            onMeetingLeave();
        },
    });

    useEffect(() => {
        if (leaveRef) {
            leaveRef.current = leave;
        }
    }, [leave, leaveRef]);

    return (
        <div className="container">
            <div className="row d-flex justify-content-center"> 
            {[...participants.keys()].map((participantId) => (
                <div className="col-md-5">
                    <ParticipantView
                    participantId={participantId}
                    />
                </div>
            ))}
            </div>
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
                onError={(err) => {
                    console.log(err, "participant video error");
                }}
                />
            )}
        </div>
    );
}

export { getVideoToken, VideoSDKMeetingProvider };