import { useState, useEffect, useRef } from "react";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";

import pages from "./Pages";
import Navbar from "./Navbar";
import LoginBody from "./Login";
import TMCBody from "../teacher/TMC";
import StudentBody from "../student/StudentBody";

function App() {
  const [userRole, setUserRole] = useState(() => discoverUserRole());
  const [currentPage, setCurrentPage] = useState(() => discoverCurrentPage());
  const [studentModule, setStudentModule] = useState(() => discoverStudentModule());

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("userRole", userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem("studentModule", studentModule);
  }, [studentModule]);

  const collabSessionRef = useRef(null);
  const leaveRef = useRef(null);

  const cleanup = () => {
    if (collabSessionRef.current && collabSessionRef.current.socket) {
      collabSessionRef.current.socket.close();
    }

    if (leaveRef.current) {
      leaveRef.current();
    }
  };

  let bodyContent;
  switch (currentPage) {
    case pages.TMC:
      if (preventAccessOutsideOfRole(userRole, currentPage)) {
        bodyContent = <LoginBody setCurrentPage={setCurrentPage} setUserRole={setUserRole} setStudentModule={setStudentModule} />;
      } else {
        localStorage.setItem("currentPage", pages.TMC);
        bodyContent = <TMCBody />;
      }
      break;
    case pages.Collab:
      if (preventAccessOutsideOfRole(userRole, currentPage)) {
        bodyContent = <LoginBody setCurrentPage={setCurrentPage} setUserRole={setUserRole} setStudentModule={setStudentModule} />;
      } else {
        localStorage.setItem("currentPage", pages.Collab);
        bodyContent = <StudentBody studentModule={studentModule} setStudentModule={setStudentModule} collabSessionRef={collabSessionRef} leaveRef={leaveRef} />;
      }
      break;
      default:
        bodyContent = <LoginBody setCurrentPage={setCurrentPage} setUserRole={setUserRole} setStudentModule={setStudentModule} />;
        break;
  }

  return (
    <div>
      <Navbar 
        setCurrentPage={setCurrentPage} 
        setStudentModule={setStudentModule} 
        cleanup={cleanup} 
        preventAccessWhenExpiredAuthToken={() => preventAccessWhenExpiredAuthToken()}
        preventAccessOutsideOfRole={() => preventAccessOutsideOfRole(userRole, currentPage)} 
      />
      {bodyContent}
    </div>
  );
}

function discoverCurrentPage() {
  return localStorage.getItem("currentPage") || pages.Default;
}

function discoverUserRole() {
  return localStorage.getItem("userRole") || "";
}

function discoverStudentModule() {
  return localStorage.getItem("studentModule") || "";
}

async function preventAccessWhenExpiredAuthToken() {
  const response = await fetch('/check-auth');
  return !response.ok;
}

function preventAccessOutsideOfRole(userRole, currentPage) {
  if (userRole) {
    if ((userRole.includes("student")) && (currentPage === pages.TMC)) {
      localStorage.setItem("currentPage", pages.Default);
      return true;
    } else if ((userRole.includes("teacher")) && (currentPage === pages.Collab)) {
      localStorage.setItem("currentPage", pages.Default);
      return true;
    } else {
      return false;
    }
  } else {
    localStorage.setItem("currentPage", pages.Default);
    return true;
}
}

export default App;
