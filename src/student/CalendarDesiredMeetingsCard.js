import { useState, useEffect } from "react";

function CalendarDesiredMeetingsCard() {
    const [meetingsCount, setMeetingsCount] = useState(0);

    useEffect(() => {
        const fetchMeetingsCount = async () => {
            try {
                const response = await fetch('/meetingcount');
                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }
                const data = await response.json();
                setMeetingsCount(data.count);
            } catch (error) {
                console.error("Error fetching meetings count:", error);
                alert('An error occurred while fetching the meetings count. Please try again.');
            }
        };

        fetchMeetingsCount();
    }, []);

    return (
        <div className="col-md-4 mx-5">
            <div className="card text-center">
                <div className="card-header">
                    <h4>Desired # of Meetings</h4>
                </div>
                <h3 className="bold">{meetingsCount}</h3>
                <div className="d-flex justify-content-center align-items-center mb-2">
                    <DecreaseButton meetingsCount={meetingsCount} setMeetingsCount={setMeetingsCount} />
                    <SetButton meetingsCount={meetingsCount} />
                    <IncreaseButton meetingsCount={meetingsCount} setMeetingsCount={setMeetingsCount} />
                </div>
            </div>
        </div>
    );
}

function IncreaseButton({ meetingsCount, setMeetingsCount }) {
    function increaseMeetingsCount() {
        setMeetingsCount(meetingsCount + 1);
    }

    return (
        <button type="button" className="btn btn-md btn-block btn-primary mx-2" onClick={increaseMeetingsCount}>Increase</button>
    );
}

function DecreaseButton({ meetingsCount, setMeetingsCount }) {
    function decreaseMeetingsCount() {
        setMeetingsCount(meetingsCount - 1);
    }

    return (
        <button type="button" className="btn btn-md btn-block btn-primary mx-2" onClick={decreaseMeetingsCount}>Decrease</button>
    );
}

function SetButton({ meetingsCount }) {
    async function set() {
        try {
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ meetingsCount })
            };
            const response = await fetch(`/meetingcount`, options);
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error setting # of desired meetings:", error);
            alert('An error occurred while setting # of desired meetings. Please try again.');
        }
    }

    return (
        <button type="button" className="btn btn-md btn-block btn-primary mx-2" onClick={set}>Set</button>
    );
}

export default CalendarDesiredMeetingsCard;
