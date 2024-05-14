import { useState } from "react";

function AssignmentConfigurationBody({ setIsConfiguringAssignment }) {
    const [translationTaskCount, setTranslationTaskCount] = useState(1);

    return (
        <div className="container-fluid">
            <form className="row g-3"> 
                <TranslationTaskCountSelector setTranslationTaskCount={setTranslationTaskCount} />
                <TranslationTaskFields numTranslationTasks={translationTaskCount} />
                <FinishedButton setIsConfiguringAssignment={setIsConfiguringAssignment} />
            </form>            
        </div>
    );
}

function TranslationTaskCountSelector({ setTranslationTaskCount }) {
    function handleChange(event) {
        const newTaskCount = parseInt(event.target.value);
        setTranslationTaskCount(newTaskCount);
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

function TranslationTaskFields({ numTranslationTasks }) {
    const tasksIndexes = Array.from({ length: numTranslationTasks }, (_, i) => i);

    return (
        <div className="col-12">
            {tasksIndexes.map(index => (
                <div key={index}>
                    <div className="card mb-3">
                        <div className="mx-3 mb-3">
                            <label className="form-label" htmlFor={`translationTaskKey${index}`}>Sentance #{index + 1} to translate:</label>
                            <input className="form-control" id={`translationTaskKey${index}`} type="text" />
                            <label className="form-label" htmlFor={`translationTaskAnswer${index}`}>Correct translation:</label>
                            <input className="form-control" id={`translationTaskAnswer${index}`} type="text" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function FinishedButton({ setIsConfiguringAssignment }) {
    function finish() {
        setIsConfiguringAssignment(false);
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto mb-4" id="doneAssignmentConfigButton" onClick={finish}>Done</button>
    );
}

export default AssignmentConfigurationBody;