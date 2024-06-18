import { useState } from "react";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";

import pages from "./Pages";
import Navbar from "./Navbar";
import LoginBody from "./Login";
import TMCBody from "../teacher/TMC";
import CollabBody from "../student/Collab";

function App() {
  const [userRole, setUserRole] = useState("");
  const [currentPage, setCurrentPage] = useState(discoverCurrentPage());

  let bodyContent;
  switch (currentPage) {
    case pages.TMC:
      if (preventAccessOutsideOfRole(userRole, currentPage)) {
        bodyContent = <LoginBody setCurrentPage={setCurrentPage} setUserRole={setUserRole} />;
      } else {
        bodyContent = <TMCBody />;
      }
      break;
    case pages.Collab:
      if (preventAccessOutsideOfRole(userRole, currentPage)) {
        bodyContent = <LoginBody setCurrentPage={setCurrentPage} setUserRole={setUserRole} />;
      } else {
        bodyContent = <CollabBody />;
      }
      break;
    case pages.Default:
    default:
      bodyContent = <LoginBody setCurrentPage={setCurrentPage} setUserRole={setUserRole} />;
      break;
  }

  return (
    <div>
      <Navbar setCurrentPage={setCurrentPage} />
      {bodyContent}
    </div>
  );
}

function discoverCurrentPage() {
  return localStorage.getItem("currentPage") || pages.Default;
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
