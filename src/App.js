import { useState } from "react";

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import pages from "./Pages";
import Navbar from "./Navbar";
import TMCBody from "./TMC";
import CollabBody from "./Collab";

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
      bodyContent = <p>Login Page</p>;
      break;
    default:
      bodyContent = <p>Login Page</p>;
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
