import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";

import CalendarDesiredMeetingsCard from "./CalendarDesiredMeetingsCard";

import "react-big-calendar/lib/css/react-big-calendar.css";
import 'react-big-calendar/lib/sass/styles.scss';
import "../shared/CustomStyles.scss"

const localizer = momentLocalizer(moment);

function CalendarBody() {
  const [events, setEvents] = useState([]);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/events");
        const data = await response.json();
        setEvents(data.events);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  const handleSelectEvent = useCallback(async (calEvent) => {
    const localUsername = localStorage.getItem("username");

    const deleteEvent = async (calEvent) => {
      const calEventId = calEvent._id;
      const options = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calEventId }),
      };

      try {
        let response = await fetch("/events", options);
        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }
        const data = await response.json();

        setEvents(data.events);
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    };

    const removeNameFromEventParticipantList = async (calEvent) => {
      const calEventId = calEvent._id;
      const options = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calEventId }),
      };

      try {
        let response = await fetch("/events-status", options);
        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }
        const data = await response.json();

        setEvents(data.events);
      } catch (error) {
        console.error("Error removing name from event:", error);
      }
    };

    if (calEvent.username === localUsername) {
      if (calEvent.status === "booked") {
        const answer = window.prompt(
          "This is an event you have scheduled with another student (" + calEvent.participants[1] + ")... would you like to delete it? (Type \"Yes\" to delete it)"
        );
        if (answer === "Yes") {
          deleteEvent(calEvent);
          //TODO Notify the other participant
        }
      } else {
        deleteEvent(calEvent);
      }
    } else {
      if (calEvent.status === "booked") {
        const answer = window.prompt(
          "This is an event you have scheduled with another student (" + calEvent.participants[0] + ")... would you like to remove your name from it? (Type \"Yes\" if so)"
        );
        if (answer === "Yes") {
          removeNameFromEventParticipantList(calEvent);
          console.log("Removing name from event");
          //TODO Notify the other participant
        }
      } else {
        setSelectedEventDetails(calEvent);
        setEventModalOpen(true);
        //TODO Possibly notify the other participant
      }
    }
  }, []);

  const handleSelectSlot = useCallback(async ({ start, end }) => {
    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ start, end }),
      };

      let response = await fetch("/events", options);
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      await response.json();

      response = await fetch("/events");
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data = await response.json();

      setEvents(data.events);
    } catch (error) {
      console.error("Error adding event:", error);
    }
  }, []);

  const formats = useMemo(
    () => ({
      eventTimeRangeFormat: () => "",
    }),
    []
  );

  const handleEventClose = () => {
    setEventModalOpen(false);
  };

  const handleEventSave = async (event) => {
    try {
      const calEventId = event._id;
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calEventId }),
      };

      let response = await fetch("/events-status", options);
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      await response.json();

      response = await fetch("/events");
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data = await response.json();

      setEvents(data.events);
    } catch (error) {
      console.error("Error updating event:", error);
    }
    setEventModalOpen(false);
  };

  const eventStyleGetter = useCallback((event, start, end, isSelected) => {
    const style = {
      borderRadius: '5px',
      opacity: 0.8,
      border: '0px',
    };

    if (event.status === "waiting") {
      style.backgroundColor = "#f1d3f2";
      style.color = "#c751cb";
    }

    if (event.status === "booked") {
      style.backgroundColor = "#c751cb";
      style.color = "#ffffff";
    }

    return { style };
  }, []);

  return (
    <div>
      <div className="container-fluid">
        <div className="row mb-4 d-flex align-items-center justify-content-center">
          <CalendarDesiredMeetingsCard />
          <div className="col-md-4 mx-5">
            <div className="card text-center">
              <div className="card-header">
                  <h4># of Meetings Scheduled</h4>
              </div>
              <h3 className="bold">#</h3>      
            </div>
          </div>
        </div>
      </div>

      <Calendar
        defaultDate={moment().toDate()}
        defaultView="week"
        views={["week"]}
        events={events}
        dayLayoutAlgorithm={"no-overlap"}
        startAccessor={(event) => new Date(event.start)}
        endAccessor={(event) => new Date(event.end)}
        localizer={localizer}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        formats={formats}
        eventPropGetter={eventStyleGetter}
        selectable
        style={{ height: "65vh" }}
      />

      <Dialog open={eventModalOpen} onClose={handleEventClose}>
        <DialogTitle sx={{color: "#ce66d2"}}>Schedule meeting with:</DialogTitle>
        <DialogContent>
          <div className="text-center">
            <h1 style={{color: "#c751cb"}}>{selectedEventDetails?.title}</h1>
            <h4 style={{color: "#ce66d2"}}>{selectedEventDetails?.details}</h4>
          </div>
        </DialogContent>
        <DialogActions sx={{justifyContent: "center"}}>
          <Button onClick={() => handleEventClose()} style={{color: "#ce66d2"}}>
            Cancel
          </Button>
          <Button onClick={() => handleEventSave(selectedEventDetails)} style={{color: "#ce66d2"}}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default CalendarBody;
