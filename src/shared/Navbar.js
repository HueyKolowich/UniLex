import React from "react";
import pages from "./Pages";

const unilexNavLogo = require("./unilex-singlecolorNav.svg").default;

function Navbar({ setCurrentPage, setStudentModule, cleanup }) {
    return (
        <nav className="navbar navbar-expand-lg">
            <div className="container-fluid">
            <img src={unilexNavLogo} alt="UniLex" id="unilexNavLogo" />
                <div className="d-flex justify-content-center align-items-center mx-2">
                    <NavItem 
                        setCurrentPage={setCurrentPage}  
                        setStudentModule={setStudentModule}
                        cleanup={cleanup}
                    />
                    <LogoutButton setCurrentPage={setCurrentPage} cleanup={cleanup} />
                </div>        
            </div>
        </nav>
    );
}

function NavItem({ setCurrentPage, setStudentModule, cleanup }) {
    async function updateCurrentPage() {
        cleanup();

        const roleResponse = await fetch('/role');
        if (roleResponse.status === 200) {
            const role = await roleResponse.json();

            const page = role.role === "student" ? pages.Collab : role.role === "teacher" ? pages.TMC : null;

            if (page) {
                localStorage.setItem("currentPage", page);
                setCurrentPage(page);
                if (role.role === "student") {
                    setStudentModule("");
                } else {
                    window.location.reload();
                }
            }
        }
    };

    return (
        <button className="navigation-item mx-2 my-auto" onClick={updateCurrentPage}>
            Home
        </button>
    );
}

function LogoutButton({ setCurrentPage, cleanup }) {
    function logout() {
        cleanup();

        localStorage.removeItem("studentModule");
        localStorage.removeItem("username");
        localStorage.removeItem("userRole");
        localStorage.removeItem("classRoomId");

        fetch('/logout');
        
        setCurrentPage(pages.Default);
    };

    return (
        <button className="navigation-item mx-2 my-auto" onClick={logout}>
            Logout
        </button>
    );
}

export default Navbar;
