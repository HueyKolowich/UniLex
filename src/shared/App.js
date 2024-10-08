import { useState, useEffect, useRef } from "react";
import './New.css';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function detectMobile() {
      return /Mobi|Android/i.test(navigator.userAgent);
    }

    setIsMobile(detectMobile());
  }, []);

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

  const bringBackToLogin = () => {
    cleanup();

    localStorage.setItem("currentPage", pages.Default);
    setCurrentPage(pages.Default);
  };

  if (isMobile) {
    return (
      <div className="mobile-warning mt-5 mx-auto text-center">
        <h2>UniLex is better experienced on a computer. Please switch to your computer to use this application.</h2>
      </div>
    );
  }

  let bodyContent;
  switch (currentPage) {
    case pages.TMC:
      if (preventAccessOutsideOfRole(userRole, currentPage)) {
        bodyContent = <LoginBody 
            setCurrentPage={setCurrentPage} 
            setUserRole={setUserRole} 
            setStudentModule={setStudentModule} 
          />;
      } else {
        localStorage.setItem("currentPage", pages.TMC);
        bodyContent = <TMCBody
            localStorageClassRoomId={localStorage.getItem("classRoomId")} 
            bringBackToLogin={bringBackToLogin} 
          />;
      }
      break;
    case pages.Collab:
      if (preventAccessOutsideOfRole(userRole, currentPage)) {
        bodyContent = <LoginBody 
            setCurrentPage={setCurrentPage} 
            setUserRole={setUserRole} 
            setStudentModule={setStudentModule} 
          />;
      } else {
        localStorage.setItem("currentPage", pages.Collab);
        bodyContent = <StudentBody 
            studentModule={studentModule} 
            setStudentModule={setStudentModule} 
            collabSessionRef={collabSessionRef} 
            leaveRef={leaveRef} 
            bringBackToLogin={bringBackToLogin}
          />;
      }
      break;
    default:
      bodyContent = bodyContent = <LoginBody 
          setCurrentPage={setCurrentPage} 
          setUserRole={setUserRole} 
          setStudentModule={setStudentModule} 
        />;
      break;
  }

  return (
    <div>
      <Navbar 
        setCurrentPage={setCurrentPage} 
        setStudentModule={setStudentModule} 
        cleanup={cleanup} 
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
