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
    const [promptTaskFieldValues, setPromptTaskFieldValues] = useState(Array(numPromptTasks).fill(""));
    const [actflLevel, setActflLevel] = useState("Advanced-High");

    const tasksIndexes = Array.from({ length: numPromptTasks }, (_, i) => i);

    function handleChange(event, index) {
        const { name, value } = event.target;

        if (name === "actflLevel") {
            setActflLevel(value);
        } else if (name === "promptTask") {
            const newPromptTaskFieldValues = [...promptTaskFieldValues];
            newPromptTaskFieldValues[index] = value;
            setPromptTaskFieldValues(newPromptTaskFieldValues);
        }
    }

    async function generate(index) {
        try {
            const response = await fetch(`/prompts?promptLevel=${actflLevel}`);
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const promptObject = await response.json();
            const parsedPromptObject = JSON.parse(promptObject.prompt);
            const newPromptTaskFieldValues = [...promptTaskFieldValues];
            newPromptTaskFieldValues[index] = parsedPromptObject.prompt;
            setPromptTaskFieldValues(newPromptTaskFieldValues);
        } catch (error) {
            console.error("Error in generate function:", error);
            alert('An error occurred while generating your prompt. Please try again.');
        }
    }

    return (
        <div className="col-12">
            {tasksIndexes.map(index => (
                <div key={index}>
                    <div className="card mb-3">
                        <div className="mx-3 my-3">
                            <div className="row mb-3">
                                <label className="form-label" htmlFor={`promptTaskKey${index}`}>Prompt #{index + 1}:</label>
                                <input 
                                    className="form-control" 
                                    name="promptTask" 
                                    id={`promptTaskKey${index}`} 
                                    type="text" 
                                    value={promptTaskFieldValues[index]}
                                    onChange={(e) => handleChange(e, index)}
                                />
                            </div>
                            <div className="row pb-1">
                                <div className="d-flex justify-content-end">
                                    <select 
                                        className="form-select w-25 me-3" 
                                        name="actflLevel" 
                                        onChange={(e) => handleChange(e)}
                                    >
                                        <option selected disabled>ACTFL level</option>
                                        <option value="Novice-Low">Novice-Low</option>
                                        <option value="Novice-Mid">Novice-Mid</option>
                                        <option value="Novice-High">Novice-High</option>
                                        <option value="Intermediate-Low">Intermediate-Low</option>
                                        <option value="Intermediate-Mid">Intermediate-Mid</option>
                                        <option value="Intermediate-High">Intermediate-High</option>
                                        <option value="Advanced-Low">Advanced-Low</option>
                                        <option value="Advanced-Mid">Advanced-Mid</option>
                                        <option value="Advanced-High">Advanced-High</option>
                                        <option value="Superior">Superior</option>
                                        <option value="Distinguished">Distinguished</option>
                                    </select>
                                    <button type="button" className="btn btn-lg btn-block btn-primary" onClick={() => generate(index)}>Generate</button>
                                </div>                                
                            </div>
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
            const response = await fetch(`/prompts`, options);
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