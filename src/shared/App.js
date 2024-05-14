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
  const [currentPage, setCurrentPage] = useState(discoverCurrentPage());  
  
  let bodyContent;
  switch (currentPage) {
    case pages.TMC:
      bodyContent = <TMCBody />;
      break;
    case pages.Collab:
      bodyContent = <CollabBody />;
      break;
    case pages.default:
      bodyContent = <LoginBody setCurrentPage={setCurrentPage} />;
      break;
    default:
      bodyContent = <LoginBody setCurrentPage={setCurrentPage} />;
  }

  return (
    <div>
      <Navbar setCurrentPage={setCurrentPage} />
      {bodyContent}
    </div>
  );
}

function discoverCurrentPage() {
  return localStorage.getItem("currentPage");
}

export default App;
