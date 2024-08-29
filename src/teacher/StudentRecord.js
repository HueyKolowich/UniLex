import formatGMTDate from "../shared/FormatGMTDate";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

function StudentRecord({ modalOpen, setModalOpen, selectedStudent, studentData }) {
    return(
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
            <DialogTitle>
                <div className="d-flex justify-content-between">
                    <h2 className="me-4 primary">{selectedStudent?.firstname} {selectedStudent?.lastname}</h2>
                    <i class="bi bi-question-circle" onClick={() => window.alert(
                        "- Student rating of how comfortable they felt during the conversation\n" +
                        "- What the student would like to work on after the conversation\n" +
                        "- What the student struggled with during the conversation\n" +
                        "- What the student learned about their partner's culture during the conversation")} />
                </div>
            </DialogTitle>
            <DialogContent>
                { studentData.map((submission) => (
                    <div className="card my-3">
                        <div className="card-body student-record-body">
                            <div className="d-flex justify-content-between">
                                <h5>{formatGMTDate(submission.attendedMeeting).date}</h5>
                                <h5>{formatGMTDate(submission.attendedMeeting).time}</h5>
                            </div>
                            <div className="d-flex justify-content-center">
                                <h3>{submission.comfortableRating}/5</h3>
                            </div>
                            <p>- {submission.improvementSubmission}</p>
                            <p>- {submission.difficultiesSubmission}</p>
                            <p>- {submission.cultureSubmission}</p>
                        </div>
                    </div>
                ))
                }
            </DialogContent>
            <DialogActions sx={{justifyContent: "center"}}>
            <Button onClick={() => setModalOpen(false)} style={{color: "#000000"}}>
                Cancel
            </Button>
            </DialogActions>
        </Dialog>
    );
}

export default StudentRecord;