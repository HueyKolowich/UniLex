import { useEffect, useState } from "react";

function AssignmentView() {
    const [prompts, setPrompts] = useState([{prompt: "", time: 0}]);

    useEffect(() => {
        const getPrompts = async () => {
            try {
                const response = await fetch(`/class-assignment?classRoomId=${localStorage.getItem("classRoomId")}`);
    
                const data = await response.json();
                setPrompts(data.prompts);
            } catch (error) {
                console.error("Error fetching the student list:", error);
            }
        };
    
        getPrompts();
    }, []);

    return (
        <div className="mt-4 mx-4">
            <h4 className="heading-style-h4-half text-center primary">Current Assignment</h4>
            <div className="scroll-wrapper">
                {prompts.map((prompt) => {
                    const formatTime = (milliseconds) => {
                        const totalSeconds = Math.floor(milliseconds / 1000);
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;
                    
                        const paddedMinutes = String(minutes).padStart(2, '0');
                        const paddedSeconds = String(seconds).padStart(2, '0');
                    
                        return `${paddedMinutes}:${paddedSeconds}`;
                    }
                    
                    return (
                        <div className="d-flex my-5">
                            <div className="card w-100">
                                <div className="card-body">
                                    <DiscussionPromptText prompt={prompt.prompt} />
                                </div>
                            </div>
                            <div className="d-flex justify-content-center align-items-center ms-5 me-4">
                                <h1>{formatTime(prompt.time)}</h1>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>    
    );
}

function DiscussionPromptText({ prompt }) {
    return (
        <h4 className="my-1 DiscussionPromptText">{prompt}</h4>
    );
}

export default AssignmentView;