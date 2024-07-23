import React from "react";
import pages from "./Pages";

function Navbar({ setCurrentPage, setStudentModule, cleanup, preventAccessWhenExpiredAuthToken, preventAccessOutsideOfRole }) {
    return (
        <nav className="navbar navbar-expand-lg mb-4 mt-1 mx-1">
            <div className="container-fluid">
                <span className="navbar-brand bold ms-3">Unite</span>
                <ul className="navbar-nav me-3">
                    <NavItem 
                        setCurrentPage={setCurrentPage} 
                        navItemText="Students" 
                        pageLink={pages.Collab} 
                        setStudentModule={setStudentModule}
                        cleanup={cleanup}
                        preventAccessWhenExpiredAuthToken={preventAccessWhenExpiredAuthToken}
                        preventAccessOutsideOfRole={preventAccessOutsideOfRole}
                    />
                    <NavItem 
                        setCurrentPage={setCurrentPage} 
                        navItemText="Teachers" 
                        pageLink={pages.TMC}
                        cleanup={cleanup}
                        preventAccessWhenExpiredAuthToken={preventAccessWhenExpiredAuthToken}
                        preventAccessOutsideOfRole={preventAccessOutsideOfRole}
                    />
                    <LogoutButton setCurrentPage={setCurrentPage} cleanup={cleanup} />
                </ul>        
            </div>
        </nav>
    );
}

function NavItem({ setCurrentPage, navItemText, pageLink, setStudentModule, cleanup, preventAccessWhenExpiredAuthToken, preventAccessOutsideOfRole }) {
    async function updateCurrentPage() {
        cleanup();

        const isAuthTokenExpired = await preventAccessWhenExpiredAuthToken();
        const isAccessOutsideRole = preventAccessOutsideOfRole();

        if (isAuthTokenExpired || isAccessOutsideRole) {
            return;
        } else {
            localStorage.setItem("currentPage", pageLink);

            if (pageLink === pages.Collab) {
                setStudentModule("");
            }
            
            setCurrentPage(pageLink);
        }
    };

    return (
        <li className="nav-item">
            <button type="button" className="btn btn-md btn-block btn-primary mx-1" onClick={updateCurrentPage}>{navItemText}</button>
        </li>
    );
}

function LogoutButton({ setCurrentPage, cleanup }) {
    function updateCurrentPage() {
        cleanup();

        localStorage.removeItem("studentModule");
        localStorage.removeItem("username");
        localStorage.removeItem("userRole");
        localStorage.removeItem("classRoomId");

        fetch('/logout');
        
        setCurrentPage(pages.Default);
    };

    return (
        <button className="bi bi-box-arrow-right my-auto" onClick={updateCurrentPage}></button>
    );
}

export default Navbar;
