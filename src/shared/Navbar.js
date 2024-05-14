import pages from "./Pages";

function Navbar({ setCurrentPage }) {
    return (
        <nav className="navbar navbar-expand-lg mb-4 mt-1 mx-1">
            <div className="container-fluid">
                <span className="navbar-brand bold ms-3">Unite</span>
                <ul className="navbar-nav me-3">
                <NavItem setCurrentPage={setCurrentPage} navItemText="Students" pageLink={pages.Collab} />
                <NavItem setCurrentPage={setCurrentPage} navItemText="Teachers" pageLink={pages.TMC} />
                <LogoutButton setCurrentPage={setCurrentPage} />
                </ul>        
            </div>
        </nav>
    );
}

function NavItem({ setCurrentPage, navItemText, pageLink }) {
    function updateCurrentPage() {
        localStorage.setItem("currentPage", pageLink);
        setCurrentPage(pageLink);
    };

    return (
        <li className="nav-item">
            <button type="button" className="btn btn-md btn-block btn-primary mx-1" onClick={updateCurrentPage}>{navItemText}</button>
        </li>
    );
}

function LogoutButton({ setCurrentPage }) {
    function updateCurrentPage() {
        localStorage.setItem("currentPage", pages.Default);
        setCurrentPage(pages.Default);
    };

    return (
        <button className="bi bi-box-arrow-right my-auto" onClick={updateCurrentPage}></button>
    );
}

export default Navbar;