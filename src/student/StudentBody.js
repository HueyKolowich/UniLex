import { useEffect, useState } from "react";

import CalendarBody from "./CalendarBody";
import CollabBody from "./Collab";
import formatGMTDate from "../shared/FormatGMTDate";

function StudentBody({ studentModule, setStudentModule, collabSessionRef, leaveRef, bringBackToLogin }) {
    const [isMeetingEntryDisabled, setIsMeetingEntryDisabled] = useState(true);
    const [soughtUsername, setSoughtUsername] = useState("");
    const [nextMeeting, setNextMeeting] = useState(null);

    useEffect(() => {
        const checkForMeetings = async () => {
            try {
                const response = await fetch("/current-meeting-scheduled");
                if (response.status === 401) {
                    bringBackToLogin();
                }

                const data = await response.json();

                setIsMeetingEntryDisabled(!data.result);
                setSoughtUsername(data.soughtUsername);

                if (data.nextEvent) {
                    const { date, time } = formatGMTDate(new Date(data.nextEvent.start));

                    setNextMeeting({ date, time });
                } else {
                    setNextMeeting(null);
                }
                
            } catch (error) {
                console.error("Error checking if there is a current meeting scheduled:", error);
            }
        };

        checkForMeetings();
    });

    let bodyContent;
    switch (studentModule) {
        case "calendar":
            bodyContent = <CalendarBody bringBackToLogin={bringBackToLogin} />;
            break;
        case "collab":
            bodyContent = <CollabBody 
                collabSessionRef={collabSessionRef} 
                leaveRef={leaveRef} 
                bringBackToLogin={bringBackToLogin}
                setStudentModule={setStudentModule}
                soughtUsername={soughtUsername}
                />;
            break;
        default:
            bodyContent = 
                <div className="student-body d-flex align-items-center justify-content-around">
                    <ModuleCard 
                        setStudentModule={setStudentModule} 
                        headerText={"Calendar"} 
                        whichModule={"calendar"} 
                        isDisabled={false}
                    />
                    <ModuleCard 
                        setStudentModule={setStudentModule} 
                        headerText={"Conversation"} 
                        whichModule={"collab"} 
                        isDisabled={isMeetingEntryDisabled}
                        displayCardText={{ msg: "Next converstation scheduled for: ", nextMeeting }}
                    />
                </div>
            break;
    }

    return (
        <div className="container-fluid">
            {bodyContent}
        </div>
    );
}
  
function ModuleCard({ setStudentModule, headerText, whichModule, isDisabled, displayCardText }) {
    function enterModule() {
        setStudentModule(whichModule);
    }
    
    return (
        <div className="d-flex flex-column align-items-center justify-content-center">
            <h4 className="heading-style-h4">{headerText}</h4>
            <div className="d-flex flex-column align-items-center justify-content-center student-module-card">
                <ModuleCardBodyButton 
                    enterModule={enterModule}  
                    isDisabled={isDisabled}
                    whichIcon={whichModule === "calendar" ? "bi bi-calendar4-week" : "bi bi-play"}
                />
                {displayCardText && isDisabled ? (
                    displayCardText.nextMeeting ? (
                        <p>{displayCardText.msg} {displayCardText.nextMeeting?.date} at {displayCardText.nextMeeting?.time}</p>
                    ) : (
                        <p>You have no conversations scheduled</p>
                    )
                ) : null}
            </div>            
        </div>
    );    
}

function ModuleCardBodyButton({ enterModule, isDisabled, whichIcon }) {
    function handleClick() {
        if (!isDisabled) {
            enterModule();
        }
    }

    return (
        <i
            className={`${whichIcon} student-module-icon ${isDisabled ? 'icon-disabled' : ''}`}
            onClick={handleClick}
        />
    );
}

export default StudentBody;
