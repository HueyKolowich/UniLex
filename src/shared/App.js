import { useState, useEffect } from "react";
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
  const [studentModule, setStudentModule] = useState("");

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("userRole", userRole);
  }, [userRole]);

  let bodyContent;
  switch (currentPage) {
    case pages.TMC:
      if (preventAccessOutsideOfRole(userRole, currentPage)) {
        bodyContent = <LoginBody setCurrentPage={setCurrentPage} setUserRole={setUserRole} />;
      } else {
        localStorage.setItem("currentPage", pages.TMC);
        bodyContent = <TMCBody />;
      }
      break;
    case pages.Collab:
      if (preventAccessOutsideOfRole(userRole, currentPage)) {
        bodyContent = <LoginBody setCurrentPage={setCurrentPage} setUserRole={setUserRole} />;
      } else {
        localStorage.setItem("currentPage", pages.Collab);
        bodyContent = <StudentBody studentModule={studentModule} setStudentModule={setStudentModule} />;
      }
      break;
    default:
      bodyContent = <LoginBody setCurrentPage={setCurrentPage} setUserRole={setUserRole} />;
      break;
  }

  return (
    <div>
      <Navbar setCurrentPage={setCurrentPage} setStudentModule={setStudentModule} />
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

/**
 * Prevents users lacking the correct role from accessing modules
 * 
 * @param {*} userRole 
 * @param {*} currentPage 
 * @returns true if access needs to be denied, false otherwise
 */
function preventAccessOutsideOfRole(userRole, currentPage) {
  if (userRole) {
    if ((userRole.includes("student")) && (currentPage === pages.TMC)) {
      localStorage.setItem("currentPage", pages.Default);
      return true;
    }

    if ((userRole.includes("teacher")) && (currentPage === pages.Collab)) {
      localStorage.setItem("currentPage", pages.Default);
      return true;
    }

    return false
  } else {
    localStorage.setItem("currentPage", pages.Default);
    return true;
  }
}

export default App;
