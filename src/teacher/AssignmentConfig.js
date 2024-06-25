import { useState } from "react";

function AssignmentConfigurationBody({ setIsConfiguringAssignment }) {
    const [promptTaskCount, setPromptTaskCount] = useState(1);

    return (
        <div className="container-fluid">
            <form className="row g-3"> 
                <PromptTaskCountSelector setPromptTaskCount={setPromptTaskCount} />
                <PromptTaskFields numPromptTasks={promptTaskCount} />
                <FinishedButton setIsConfiguringAssignment={setIsConfiguringAssignment} />
            </form>            
        </div>
    );
}

function PromptTaskCountSelector({ setPromptTaskCount }) {
    function handleChange(event) {
        const newTaskCount = parseInt(event.target.value);
        setPromptTaskCount(newTaskCount);
    }

    return (
        <div className="col mx-5">
            <div className="card text-center">        
                <div data-mdb-input-init className="form-outline">
                    <label className="form-label" htmlFor="taskCountInput">Select Task Count</label>
                    <input 
                    type="number" 
                    id="taskCountInput" 
                    className="form-control mx-auto"
                    defaultValue="1"
                    min="1"
                    onChange={handleChange}
                    />                    
                </div>           
            </div>            
        </div>        
    );
}

function PromptTaskFields({ numPromptTasks }) {
    const tasksIndexes = Array.from({ length: numPromptTasks }, (_, i) => i);

    return (
        <div className="col-12">
            {tasksIndexes.map(index => (
                <div key={index}>
                    <div className="card mb-3">
                        <div className="mx-3 mb-3">
                            <label className="form-label" htmlFor={`promptTaskKey${index}`}>Prompt #{index + 1}:</label>
                            <input className="form-control" name="prompt" id={`promptTaskKey${index}`} type="text" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function FinishedButton({ setIsConfiguringAssignment }) {
    async function finish() {
        try {
            const promptElements = document.getElementsByName("prompt");
            let promptsList = [];
            for (let i = 0; i < promptElements.length; i++) {
                promptsList.push(promptElements[i].value);
            }

            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ promptsList })
            };
            const response = await fetch(`/add-prompts`, options);
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            setIsConfiguringAssignment(false);
        } catch (error) {
            console.error("Error in finish function:", error);
            alert('An error occurred while saving prompts. Please try again.');
        }
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="doneAssignmentConfigButton" onClick={finish}>Done</button>
    );
}

export default AssignmentConfigurationBody;