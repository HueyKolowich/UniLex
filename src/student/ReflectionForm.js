function ReflectionForm({ otherStudentUsername, setStudentModule }) {
    return(
        <div className="card">
            <div className="container d-flex my-4">
                <div className="container d-flex flex-column align-items-center justify-content-center">
                <div className="row justify-content-center">
                        <h5 className="circle-rating-header mb-1">Rate how helpful your parter was during the conversation:</h5>
                    </div>
                    <div className="row justify-content-center">    
                        <div className="rating-wrapper">
                            
                            <input className="star-input" type="radio" id="5-star-rating" name="star-rating" value={5} />
                            <label for="5-star-rating" className="star-rating">
                            <i className="bi bi-star-fill d-inline-block"></i>
                            </label>
                            
                            <input className="star-input" type="radio" id="4-star-rating" name="star-rating" value={4} />
                            <label for="4-star-rating" className="star-rating">
                            <i className="bi bi-star-fill d-inline-block"></i>
                            </label>
                            
                            <input className="star-input" type="radio" id="3-star-rating" name="star-rating" value={3} />
                            <label for="3-star-rating" className="star-rating">
                            <i className="bi bi-star-fill d-inline-block"></i>
                            </label>
                            
                            <input className="star-input" type="radio" id="2-star-rating" name="star-rating" value={2} />
                            <label for="2-star-rating" className="star-rating">
                            <i className="bi bi-star-fill d-inline-block"></i>
                            </label>
                            
                            <input className="star-input" type="radio" id="1-star-rating" name="star-rating" value={1} />
                            <label for="1-star-rating" className="star-rating">
                            <i className="bi bi-star-fill d-inline-block"></i>
                            </label>
                            
                        </div>
                    </div>
                </div>
                <div className="container d-flex flex-column align-items-center justify-content-center">
                    <div className="row justify-content-center">
                        <h5 className="circle-rating-header mb-1">How comfortable did you feel during the conversation?</h5>
                    </div>
                    <div className="row justify-content-center">    
                        <div className="rating-wrapper">
                            
                            <input className="circle-input" type="radio" id="5-circle-rating" name="circle-rating" value={5} />
                            <label for="5-circle-rating" className="circle-rating">
                            <i className="bi bi-5-circle d-inline-block"></i>
                            </label>
                            
                            <input className="circle-input" type="radio" id="4-circle-rating" name="circle-rating" value={4} />
                            <label for="4-circle-rating" className="circle-rating">
                            <i className="bi bi-4-circle d-inline-block"></i>
                            </label>
                            
                            <input className="circle-input" type="radio" id="3-circle-rating" name="circle-rating" value={3} />
                            <label for="3-circle-rating" className="circle-rating">
                            <i className="bi bi-3-circle d-inline-block"></i>
                            </label>
                            
                            <input className="circle-input" type="radio" id="2-circle-rating" name="circle-rating" value={2} />
                            <label for="2-circle-rating" className="circle-rating">
                            <i className="bi bi-2-circle d-inline-block"></i>
                            </label>
                            
                            <input className="circle-input" type="radio" id="1-circle-rating" name="circle-rating" value={1} />
                            <label for="1-circle-rating" className="circle-rating">
                            <i className="bi bi-1-circle d-inline-block"></i>
                            </label>
                            
                        </div>
                    </div>
                </div>
            </div>
            
            <textarea className="reflectionFormTextField mb-3 mx-3" id="difficultiesSubmission" placeholder="Please describe any difficulties that you had this week in your conversation:" rows={2} />
            <textarea className="reflectionFormTextField mb-3 mx-3" id="improvementSubmission" placeholder="Based on this most recent conversation, what would you like to improve on:" rows={2} />
            <textarea className="reflectionFormTextField mb-3 mx-3" id="cultureSubmission" placeholder="Describe what you learned about your partner's language and culture during this week's conversation:" rows={2} />
            
            <SumbitButton otherStudentUsername={otherStudentUsername} setStudentModule={setStudentModule} />
        </div>
    );
}

function SumbitButton({ otherStudentUsername, setStudentModule }) {
    async function submit() {
        try {
            const difficultiesSubmission = document.getElementById("difficultiesSubmission").value;
            const improvementSubmission = document.getElementById("improvementSubmission").value;
            const cultureSubmission = document.getElementById("cultureSubmission").value;

            let otherStudentRating;
            if (document.querySelector('input[name="star-rating"]:checked')) {
                otherStudentRating = parseInt(document.querySelector('input[name="star-rating"]:checked').value);
            } else {
                otherStudentRating = 0;
            }

            let comfortableRating;
            if (document.querySelector('input[name="circle-rating"]:checked')) {
                comfortableRating = parseInt(document.querySelector('input[name="circle-rating"]:checked').value);
            } else {
                comfortableRating = 0;
            }

            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    difficultiesSubmission,
                    improvementSubmission,
                    cultureSubmission,
                    otherStudentRating,
                    otherStudentUsername,
                    comfortableRating
                })
            };

            const response = await fetch(`/submissions`, options);
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            window.alert("Submission successful!");
            setStudentModule("");
        } catch (error) {
            console.error("Error in submit action:", error);
            alert('An error occurred while submitting your response. Please try again.');
        }
    }

    return (
        <button type="button" className="btn btn-lg btn-block btn-primary mx-auto my-4" id="submitReflectionButton" onClick={submit}>Submit</button>
    );
}

export default ReflectionForm;