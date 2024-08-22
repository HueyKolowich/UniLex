import { useEffect, useState } from "react";

import AssignmentConfigurationBody from "./AssignmentConfig";
import AssignmentView from "./AssignmentView";
import StudentRecord from "./StudentRecord";
import formatGMTDate from "./FormatGMTDate";

function TMCBody({ bringBackToLogin }) {
    const [isConfiguringAssignment, setIsConfiguringAssignment] = useState(false);
    const [isViewingAssignment, setIsViewingAssignment] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentData, setStudentData] = useState([]);
    const [classStats, setClassStats] = useState({ avgComfort: 0, avgHelpfulness: 0, conversationPercentage: 0 });

    return (
        <div>
            { 
                isConfiguringAssignment ? 
                <AssignmentConfigurationBody 
                    setIsConfiguringAssignment={setIsConfiguringAssignment}
                    bringBackToLogin={bringBackToLogin}
                /> 
                : isViewingAssignment ?
                <AssignmentView />
                :
                <div className="container-fluid">
                    <div className="row my-3 mx-2">
                        <div className="col">
                            <div className="d-flex flex-column mb-4">
                                <ClassStats classStats={classStats} />
                                <Table 
                                    bringBackToLogin={bringBackToLogin} 
                                    setSelectedStudent={setSelectedStudent}
                                    setModalOpen={setModalOpen}
                                    setStudentData={setStudentData}
                                    setClassStats={setClassStats}
                                />
                            </div>
                        </div>
                        <div className="col">
                            <AssignmentOption setIsConfiguringAssignment={setIsConfiguringAssignment} setIsViewingAssignment={setIsViewingAssignment} />
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

function ClassStats({ classStats }) {
    const { avgComfort, avgHelpfulness, conversationPercentage } = classStats;

    return (
        <div className="d-flex justify-content-evenly text-center mt-1 mb-3">
            <div className="card class-stats mx-3">
                <div className="card-header">
                    Avg. Helpfulness
                </div>
                <div className="card-body primary">
                    {avgHelpfulness.toFixed(1)}
                </div>
            </div>
            <div className="card class-stats mx-3">
                <div className="card-header">
                    Avg. Comfort
                </div>
                <div className="card-body">
                    {avgComfort.toFixed(1)}
                </div>
            </div>
            <div className="card class-stats mx-3">
                <div className="card-header">
                    Weekly Participation Rate
                </div>
                <div className="card-body">
                    {conversationPercentage.toFixed(1)}%
                </div>
            </div>
        </div>
    );
}
  
function AssignmentOption({ setIsConfiguringAssignment, setIsViewingAssignment }) {
    const headerText = "Assignment Configuration";

    return (
        <div className="card text-center mb-4">
            <CardHeader text={headerText} />
            <AssignmentOptionBody setIsConfiguringAssignment={setIsConfiguringAssignment} setIsViewingAssignment={setIsViewingAssignment} />      
        </div>
    );
}

function AssignmentOptionBody({ setIsConfiguringAssignment, setIsViewingAssignment }) {
    function startNewAssignment() {
        setIsConfiguringAssignment(true);
    }

    function viewCurrentAssignment() {
        setIsViewingAssignment(true);
    }

    return (
        <div className="card-body">
            <AssignmentOptionBodyButton handler={startNewAssignment} buttonText={"New"} />
            <AssignmentOptionBodyButton handler={viewCurrentAssignment} buttonText={"Current"}/>
        </div>
    );
}

function AssignmentOptionBodyButton({ handler, buttonText }) {
    return (
        <button type="button" className="button mx-4 my-2" onClick={handler}>{buttonText}</button>
    );
}

function ClassroomCodeCard() {
    const headerText = "My Classroom Code";

    return (
        <div className="card text-center mb-4">
            <CardHeader text={headerText} />
            <ClassroomCodeCardBody />
        </div>
    );
}

function ClassroomCodeCardBody() {
    const [classCode, setClassCode] = useState("");

    useEffect(() => {
        const getClassroomCode = async () => {
            setClassCode(localStorage.getItem("classRoomId"));
        };

        getClassroomCode();
    }, []);

    return (
        <h4 className="heading-style-h4-half primary">{classCode}</h4>
    );
}

function CardHeader({text}) {
    return (
        <div className="card-header">
            <h4 className="heading-style-h4-half">{text}</h4>
        </div>
    );
}

function Table({ bringBackToLogin, setSelectedStudent, setModalOpen, setStudentData, setClassStats }) {
    const [studentList, setStudentList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "lastname", direction: "ascending" });

    useEffect(() => {
        const getStudentList = async () => {
            try {
                const response = await fetch("/student-list");
                if (response.status === 401) {
                    bringBackToLogin();
                    return;
                }
    
                const studentListData = await response.json();
    
                const studentList = await Promise.all(
                    studentListData.studentList.map(async (student) => {
                        const studentInfoResponse = await fetch(`/student-table-info?username=${student.username}`);
                        const studentInfoData = await studentInfoResponse.json();

                        const formatValue = (value) => value === "NA" ? "" : value.toFixed(1);
    
                        return {
                            username: student.username,
                            firstname: student.firstname,
                            lastname: student.lastname,
                            rating: formatValue(studentInfoData.rating),
                            recent: studentInfoData.recent,
                            score: formatValue(studentInfoData.score),
                        };
                    })
                );
    
                setStudentList(studentList);
                calculateStats(studentList);
            } catch (error) {
                console.error("Error fetching the student list:", error);
            }
        };
    
        getStudentList();
    }, []);
    
    const calculateStats = (studentList) => {
        if (studentList.length === 0) return;

        const calculateAverage = (studentList, field) => {
            const filteredList = studentList.filter(student => student[field] !== "" && !isNaN(student[field]));
            
            if (filteredList.length === 0) return 0;
        
            const total = filteredList.reduce((acc, student) => acc + Number(student[field]), 0);
            return total / filteredList.length;
        };
        
        const avgComfort = calculateAverage(studentList, "rating");
        const avgHelpfulness = calculateAverage(studentList, "score");                

        const startOfWeek = new Date();
        const dayOfWeek = (startOfWeek.getDay() + 6) % 7;
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

        const recentMeetingsCount = studentList.filter(student => new Date(student.recent).getTime() >= startOfWeek.getTime()).length;
        const conversationPercentage = (recentMeetingsCount / studentList.length) * 100;

        setClassStats({ avgComfort, avgHelpfulness, conversationPercentage });
    };

    const sortedStudentList = [...studentList].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
    });

    const filteredStudentList = sortedStudentList.filter(student =>
        student.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastname.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSort = (key) => {
        let direction = "ascending";
        if (sortConfig.key === key && sortConfig.direction === "ascending") {
            direction = "descending";
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="panel">
            <div className="d-flex">
                <i className="bi bi-search" style={{ padding: "0.5rem" }} />
                <input
                    type="text"
                    placeholder="Search by first or last name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>
            <div className="scroll-wrapper scroll-wrapper-table">
                <table className="table table-borderless">
                    <TableHead handleSort={handleSort} />
                    <tbody>
                        {filteredStudentList.map((student, index) => (
                            <TableBodyItem
                                key={index}
                                index={index}
                                student={student}
                                setSelectedStudent={setSelectedStudent}
                                setModalOpen={setModalOpen}
                                setStudentData={setStudentData}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TableHead({ handleSort }) {
    return (
        <thead>
            <tr className="table-no-top-border">
                <th scope="col">#</th>
                <th scope="col" onClick={() => handleSort("firstname")}>First</th>
                <th scope="col" onClick={() => handleSort("lastname")}>Last</th>
                <th scope="col" onClick={() => handleSort("rating")}>Comfort</th>
                <th scope="col" onClick={() => handleSort("score")}>Helpfulness</th>
                <th scope="col" onClick={() => handleSort("recent")}>Last Meeting</th>
            </tr>
        </thead>
    );
}

function TableBodyItem({ index, student, setSelectedStudent, setModalOpen, setStudentData }) {
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

    return (
        <tr className="rowItem" onClick={() => bringUpStudentData(student)}>
            <th scope="row">{index + 1}</th>
            <td>{student.firstname}</td>
            <td>{student.lastname}</td>
            <td>{student.rating}</td>
            <td>{student.score}</td>
            <td>{formatGMTDate(student.recent).date}</td>
        </tr>
    );
}

export default TMCBody;