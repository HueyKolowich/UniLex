import { useEffect, useState } from "react";

import AssignmentConfigurationBody from "./AssignmentConfig";
import StudentRecord from "./StudentRecord";

function TMCBody({ bringBackToLogin }) {
    const [isConfiguringAssignment, setIsConfiguringAssignment] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentData, setStudentData] = useState([]);

    return (
        <div>
            { 
                isConfiguringAssignment ? 
                <AssignmentConfigurationBody 
                    setIsConfiguringAssignment={setIsConfiguringAssignment}
                    bringBackToLogin={bringBackToLogin}
                /> 
                :
                <div className="container-fluid">
                    <div className="row my-3">
                        <div className="col mx-3">
                            <Table 
                                bringBackToLogin={bringBackToLogin} 
                                setSelectedStudent={setSelectedStudent}
                                setModalOpen={setModalOpen}
                                setStudentData={setStudentData}
                            />
                        </div>
                        <div className="col mx-5">
                            <AssignmentOption setIsConfiguringAssignment={setIsConfiguringAssignment} />
                            <ClassroomCodeCard />
                        </div>
                    </div>

                    <StudentRecord
                        modalOpen={modalOpen}
                        setModalOpen={setModalOpen}
                        selectedStudent={selectedStudent}
                        studentData={studentData}
                    />
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

function Table({ bringBackToLogin, setSelectedStudent, setModalOpen, setStudentData }) {
    const [studentList, setStudentList] = useState([]);

    useEffect(() => {
        const getStudentList = async () => {
            try {
                const response = await fetch("/student-list");
                if (response.status === 401) {
                    bringBackToLogin();
                }

                const data = await response.json();
                setStudentList(data.studentList);
            } catch (error) {
                console.error("Error checking if there is a current meeting scheduled:", error);
            }
        };

        getStudentList();
    }, []);


    return (
        <div className="panel">
            <table className="table table-borderless">
                <TableHead />
                <tbody>
                    { studentList.map((student, index) => (
                        <TableBodyItem 
                            key={index} 
                            index={index} 
                            student={student} 
                            setSelectedStudent={setSelectedStudent}
                            setModalOpen={setModalOpen}
                            setStudentData={setStudentData}
                        />
                    )) }
                </tbody>
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
                <th scope="col">Comfort Level</th>
            </tr>
        </thead>
    );
}

function TableBodyItem({ index, student, setSelectedStudent, setModalOpen, setStudentData }) {
    const [comfortableRating, setComfortableRating] = useState("");

    const bringUpStudentData = async (student) => {
        try {
            const response = await fetch(`/submissions?username=${student.username}`);

            const data = await response.json();
            setStudentData(data.submissions);
        } catch (error) {
            console.error("Error fetching data for the selected student:", error);
        }

        setSelectedStudent(student);
        setModalOpen(true);
    };

    useEffect(() => {
        const getMostRecentComfortableScore = async (student) => {
            try {
                const response = await fetch(`/comfortRating?username=${student.username}`);
    
                const data = await response.json();
                setComfortableRating(data.rating);
            } catch (error) {
                console.error("Error fetching data for the selected student:", error);
            }
        };

        getMostRecentComfortableScore(student);
    }, [student]);

    return (
        <tr className="rowItem" onClick={() => bringUpStudentData(student)}>
            <th scope="row">{index + 1}</th>
            <td>{student.firstname}</td>
            <td>{student.lastname}</td>
            <td>{comfortableRating}</td>
        </tr>
    );
}

export default TMCBody;