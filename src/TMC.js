import { useState } from "react";

import AssignmentConfigurationBody from "./AssignmentConfig";

function TMCBody() {
    const [isConfiguringAssignment, setIsConfiguringAssignment] = useState(false);

    return (
        <div>
            { isConfiguringAssignment ? <AssignmentConfigurationBody setIsConfiguringAssignment={setIsConfiguringAssignment}/> :
                <div className="container-fluid">
                    <div className="row my-3">
                    <div className="col mx-3">
                        <Table />
                    </div>
                    <div className="col mx-5">
                        <AssignmentOption setIsConfiguringAssignment={setIsConfiguringAssignment} />
                        <ClassroomCodeCard />
                    </div>
                    </div>
                </div>
            }
        </div>
    );
}
  
function AssignmentOption({ setIsConfiguringAssignment }) {
    const headerText = "Assignment Configuration";

    return (
        <div className="card text-center mb-4">
            <CardHeader text={headerText} />
            <AssignmentOptionBody setIsConfiguringAssignment={setIsConfiguringAssignment} />      
        </div>
    );
}

function AssignmentOptionBody({ setIsConfiguringAssignment }) {
    function startNewAssignment() {
        setIsConfiguringAssignment(true);
    }

    return (
        <div className="card-body">
            <AssignmentOptionBodyButton startNewAssignment={startNewAssignment} />
        </div>
    );
}

function AssignmentOptionBodyButton({ startNewAssignment }) {
    return (
        <button type="button" className="btn btn-lg btn-block btn-primary" onClick={startNewAssignment}>New Assignment</button>
    );
}

function ClassroomCodeCard() {
    const headerText = "My Classroom Code";

    return (
        <div className="card text-center">
            <CardHeader text={headerText} />
            <ClassroomCodeCardBody />
        </div>
    );
}

function ClassroomCodeCardBody() {
    return (
        <h3 className="bold">ab7-Df2-Gh5</h3>
    );
}

function CardHeader({text}) {
    return (
        <div className="card-header">
            <h4>{text}</h4>
        </div>
    );
}

function Table() {
    return (
        <div className="panel">
            <table className="table table-borderless">
                <TableHead />
                <TableBodyItem />
            </table>
        </div>
    );
}

function TableHead() {
    return (
        <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">First</th>
                <th scope="col">Last</th>
                <th scope="col">Status</th>
                <th scope="col">Performance</th>
            </tr>
        </thead>
    );
}

function TableBodyItem() {
    return (
        <tbody>
            <tr className="rowItem">
                <th scope="row">1</th>
                <td>Johnny</td>
                <td>Appleseed</td>
                <td>Active</td>
                <td>87%</td>
            </tr>
            <tr className="rowItem">
                <th scope="row">2</th>
                <td>John</td>
                <td>Doe</td>
                <td>Active</td>
                <td>64%</td>
            </tr>
            <tr className="rowItem">
                <th scope="row">3</th>
                <td>Jane</td>
                <td>Smith</td>
                <td>Inactive</td>
                <td>93%</td>
            </tr>
            <tr className="rowItem">
                <th scope="row">4</th>
                <td>Tommy</td>
                <td>Johnson</td>
                <td>Inactive</td>
                <td>79%</td>
            </tr>
            <tr className="rowItem">
                <th scope="row">5</th>
                <td>Mia</td>
                <td>Rodriguez</td>
                <td>Active</td>
                <td>88%</td>
            </tr>
            <tr className="rowItem">
                <th scope="row">6</th>
                <td>Liam</td>
                <td>Patel</td>
                <td>Inactive</td>
                <td>63%</td>
            </tr>
            <tr className="rowItem">
                <th scope="row">7</th>
                <td>Sophie</td>
                <td>Lee</td>
                <td>Inactive</td>
                <td>71%</td>
            </tr>
            <tr className="rowItem">
                <th scope="row">8</th>
                <td>Ethan</td>
                <td>Smith</td>
                <td>Inactive</td>
                <td>96%</td>
            </tr>
            <tr className="rowItem">
                <th scope="row">9</th>
                <td>Olivia</td>
                <td>Brown</td>
                <td>Inactive</td>
                <td>78%</td>
            </tr>
        </tbody>
    );
}

export default TMCBody;