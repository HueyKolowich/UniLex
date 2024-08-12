import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

function StudentRecord({ modalOpen, setModalOpen, selectedStudent, studentData }) {
    const formatGMTDate = (GMTDateString) => {
        if (!GMTDateString) {
            return { date: "", time: "" };
        }
    
        const date = new Date(GMTDateString);
    
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
    
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
    
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = String(hours).padStart(2, '0');
    
        return { date: `${month}/${day}/${year}`, time: `${formattedHours}:${minutes} ${ampm}` };
    };
    

    return(
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
            <DialogTitle>
                <div className="d-flex justify-content-between">
                    <h2 className="coloredHeader me-4">{selectedStudent?.firstname} {selectedStudent?.lastname}</h2>
                    <i class="bi bi-question-circle hinticon" onClick={() => window.alert(
                        "- Student rating of how comfortable they felt during the conversation\n" +
                        "- What the student would like to work on after the conversation\n" +
                        "- What the student struggled with during the conversation\n" +
                        "- What the student learned about their partner's culture during the conversation")} />
                </div>
            </DialogTitle>
            <DialogContent>
                { studentData.map((submission) => (
                    <div className="card my-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <h5 className="coloredHeader">{formatGMTDate(submission.attendedMeeting).date}</h5>
                                <h5 className="coloredHeader">{formatGMTDate(submission.attendedMeeting).time}</h5>
                            </div>
                            <div className="d-flex justify-content-center">
                                <h3 className="coloredHeader">{submission.comfortableRating}/5</h3>
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
            <Button onClick={() => setModalOpen(false)} style={{color: "#ce66d2"}}>
                Cancel
            </Button>
            </DialogActions>
        </Dialog>
    );
}

export default StudentRecord;