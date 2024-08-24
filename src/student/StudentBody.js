import { useEffect, useState } from "react";
import CalendarBody from "./CalendarBody";
import CollabBody from "./Collab";

function StudentBody({ studentModule, setStudentModule, collabSessionRef, leaveRef, bringBackToLogin }) {
    const [isMeetingEntryDisabled, setIsMeetingEntryDisabled] = useState(true);
    const [soughtUsername, setSoughtUsername] = useState("");

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
                        displayCardText={"No conversation currently scheduled"}
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
                {displayCardText && isDisabled && (
                    <p>{displayCardText}</p>
                )}
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
