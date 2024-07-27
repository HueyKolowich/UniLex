import { useState, useEffect } from "react";
import { Dialog, DialogActions, DialogContent, Button } from "@mui/material";

function AssignmentConfigurationBody({ setIsConfiguringAssignment, bringBackToLogin }) {
    const [promptTaskCount, setPromptTaskCount] = useState(1);
    const [eventModalOpen, setEventModalOpen] = useState(false);

    const returnToTMC = () => {
        setEventModalOpen(false);
        setIsConfiguringAssignment(false);
    };

    return (
        <div className="container-fluid">
            <form className="row g-3"> 
                <PromptTaskCountSelector setPromptTaskCount={setPromptTaskCount} />
                <PromptTaskFields numPromptTasks={promptTaskCount} bringBackToLogin={bringBackToLogin} />
                <FinishedButton  
                    bringBackToLogin={bringBackToLogin}
                    setEventModalOpen={setEventModalOpen}
                />
            </form>

            <Dialog open={eventModalOpen}>
                <DialogContent>
                <div className="text-center">
                    <h3 style={{color: "#c751cb"}}>The prompts have successfuly been assigned to all students!</h3>
                </div>
                </DialogContent>
                <DialogActions sx={{justifyContent: "center"}}>
                <Button onClick={returnToTMC} style={{color: "#ce66d2"}}>
                    Okay
                </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

function PromptTaskCountSelector({ setPromptTaskCount }) {
    function handleChange(event) {
        const newTaskCount = parseInt(event.target.value);
        if (!isNaN(newTaskCount) && newTaskCount > 0) {
            setPromptTaskCount(newTaskCount);
        }
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

function PromptTaskFields({ numPromptTasks, bringBackToLogin }) {
    const [promptTaskFieldValues, setPromptTaskFieldValues] = useState([]);

    useEffect(() => {
        setPromptTaskFieldValues(prevValues => {
            const currentLength = prevValues.length;
            if (currentLength >= numPromptTasks) {
                return prevValues.slice(0, numPromptTasks);
            } else {
                const newValues = Array.from({ length: numPromptTasks - currentLength }, () => ({ prompt: "", filter: "", actflLevel: "Advanced-High" }));
                return [...prevValues, ...newValues];
            }
        });
    }, [numPromptTasks]);

    function handleChange(event, index) {
        const { name, value } = event.target;

        const newPromptTaskFieldValues = [...promptTaskFieldValues];
        newPromptTaskFieldValues[index][name] = value;
        setPromptTaskFieldValues(newPromptTaskFieldValues);
    }

    async function generate(index) {
        try {
            const response = await fetch(`/prompts?promptLevel=${promptTaskFieldValues[index].actflLevel}&filter=${promptTaskFieldValues[index].filter}`);
            if (!response.ok) {
                if (response.status === 401) {
                    bringBackToLogin();
                }
                throw new Error(`Server error: ${response.statusText}`);
            }

            const promptObject = await response.json();
            console.log(promptObject.prompt);
            const parsedPromptObject = JSON.parse(promptObject.prompt);
            console.log(parsedPromptObject);
            const newPromptTaskFieldValues = [...promptTaskFieldValues];
            newPromptTaskFieldValues[index].prompt = parsedPromptObject.prompt;
            setPromptTaskFieldValues(newPromptTaskFieldValues);
        } catch (error) {
            console.error("Error in generate function:", error);
            alert('An error occurred while generating your prompt. Please try again.');
        }
    }

    return (
        <div className="col-12">
            {promptTaskFieldValues.map((_, index) => (
                <div key={index}>
                    <div className="card mb-3">
                        <div className="mx-3 my-3">
                            <div className="row mb-3">
                                <label className="form-label ps-4" htmlFor={`promptTaskKey${index}`}>Prompt #{index + 1}:</label>
                                <input 
                                    className="form-control" 
                                    name="prompt" 
                                    id={`promptTaskKey${index}`} 
                                    type="text" 
                                    value={promptTaskFieldValues[index].prompt}
                                    onChange={(e) => handleChange(e, index)}
                                />
                            </div>
                            <div className="row pb-1">
                                <div className="d-flex justify-content-between">
                                    <select 
                                        className="form-select w-25 me-3" 
                                        name="time"
                                    >
                                        <option selected disabled value={300000}>Mininum time to spend on prompt</option>
                                        <option value={180000}>3 minutes</option>
                                        <option value={300000}>5 minutes</option>
                                        <option value={420000}>7 minutes</option>
                                        <option value={600000}>10 minutes</option>
                                    </select>
                                    <div className="d-flex justify-content-end">
                                        <input 
                                            className="form-control me-3" 
                                            name="filter" 
                                            type="text"
                                            placeholder="Prompt topic"
                                            value={promptTaskFieldValues[index].filter}
                                            onChange={(e) => handleChange(e, index)}
                                        />
                                        <select 
                                            className="form-select w-75 me-3" 
                                            name="actflLevel"
                                            onChange={(e) => handleChange(e, index)}
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
                </div>
            ))}
        </div>
    );
}

function FinishedButton({ bringBackToLogin, setEventModalOpen }) {
    async function finish() {
        try {
            const promptElements = document.getElementsByName("prompt");
            const timeElements = document.getElementsByName("time");

            let promptsList = [];
            for (let i = 0; i < promptElements.length; i++) {
                const prompt = promptElements[i].value;
                const time = Number(timeElements[i].value);

                promptsList.push({prompt, time});
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
                if (response.status === 401) {
                    bringBackToLogin();
                } else {
                    throw new Error(`Server error: ${response.statusText}`);
                }
            }

            setEventModalOpen(true);
        } catch (error) {
            console.error("Error in finish function:", error);
            alert('An error occurred while saving prompts. Please try again.');
        }
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="doneAssignmentConfigButton" onClick={finish}>Assign to students</button>
    );
}

export default AssignmentConfigurationBody;