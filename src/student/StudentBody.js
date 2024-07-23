import { useEffect, useState } from "react";
import CalendarBody from "./CalendarBody";
import CollabBody from "./Collab";

function StudentBody({ studentModule, setStudentModule, collabSessionRef, leaveRef, bringBackToLogin }) {
    const [isMeetingEntryDisabled, setIsMeetingEntryDisabled] = useState(true);

    useEffect(() => {
        const checkForMeetings = async () => {
            try {
                const response = await fetch("/current-meeting-scheduled");
                if (response.status == 401) {
                    bringBackToLogin();
                }

                const data = await response.json();
                setIsMeetingEntryDisabled(!data.result);
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
            bodyContent = <CollabBody collabSessionRef={collabSessionRef} leaveRef={leaveRef} bringBackToLogin={bringBackToLogin} />;
            break;
        default:
            bodyContent = 
            <div className="container-fluid">
                <div className="row my-3 d-flex align-items-center justify-content-center" style={{height: "75vh"}}>
                    <div className="col mx-3">
                        <ModuleCard 
                            setStudentModule={setStudentModule} 
                            headerText={"Calendar"} 
                            whichModule={"calendar"} 
                            moduleButtonText={"Go To Calendar"} 
                            isDisabled={false}
                        />
                    </div>
                    <div className="col mx-3">
                        <ModuleCard 
                            setStudentModule={setStudentModule} 
                            headerText={"Meeting"} 
                            whichModule={"collab"} 
                            moduleButtonText={"Join Meeting"} 
                            isDisabled={isMeetingEntryDisabled}
                            displayCardText={"No meeting currently scheduled"}
                        />
                    </div>
                </div>
            </div>
            break;
    }

    return (
        <div className="container-fluid">
            {bodyContent}
        </div>
    );
}
  
function ModuleCard({ setStudentModule, headerText, whichModule, moduleButtonText, isDisabled, displayCardText }) {
    return (
        <div className="card text-center mb-4" style={{height: "35vh"}}>
            <CardHeader text={headerText} />
            <ModuleCardBody 
                setStudentModule={setStudentModule} 
                whichModule={whichModule} 
                moduleButtonText={moduleButtonText} 
                isDisabled={isDisabled}
                displayCardText={displayCardText}
            />      
        </div>
    );
}

function ModuleCardBody({ setStudentModule, whichModule, moduleButtonText, isDisabled, displayCardText }) {
    function enterModule() {
        setStudentModule(whichModule);
    }

    return (
        <div className="card-body d-flex flex-column align-items-center justify-content-center">
            { displayCardText && isDisabled ? (
                <div>
                    <p className="mb-4">{displayCardText}</p>
                    <ModuleCardBodyButton 
                        enterModule={enterModule} 
                        moduleButtonText={moduleButtonText} 
                        isDisabled={isDisabled}
                    />
                </div>
            ) : (
                <div>
                    <ModuleCardBodyButton 
                        enterModule={enterModule} 
                        moduleButtonText={moduleButtonText} 
                        isDisabled={isDisabled}
                    />
                </div>
            )}
        </div>
    );
}

function ModuleCardBodyButton({ enterModule, moduleButtonText, isDisabled }) {
    return (
        <button 
            type="button" 
            className="btn btn-lg btn-block btn-primary" 
            onClick={enterModule} 
            disabled={isDisabled}
        >
            {moduleButtonText}
        </button>
    );
}

function CardHeader({ text }) {
    return (
        <div className="card-header">
            <h4>{text}</h4>
        </div>
    );
}

export default StudentBody;
