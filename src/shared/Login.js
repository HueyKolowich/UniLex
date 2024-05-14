import pages from "./Pages";

const uniteLogo = require("./unite-high-resolution-logo-transparent.png");

function LoginBody({ setCurrentPage }) {
    return (
        <div className="container-fluid">
            <div className="d-flex flex-column align-items-center justify-content-center loginpagebody">
                <img src={uniteLogo} alt="Unite Logo" id="uniteLogo" />
                <div className="mt-5">
                    <div className="card mb-3">
                        <input type="text" id="name" placeholder="Name" className="form-control" />
                    </div>
                    <div className="card mb-4">
                        <input type="password" id="password" placeholder="Password" className="form-control" />
                    </div>
                </div>
                <LoginButton setCurrentPage={setCurrentPage} />
            </div>
        </div>
    );
}

function LoginButton({ setCurrentPage }) {
    function updateCurrentPage() {
        localStorage.setItem("currentPage", pages.TMC);
        setCurrentPage(pages.TMC);
    };

    return (
        <button type="submit" id="login" onClick={updateCurrentPage} className="btn btn-lg btn-block btn-primary mx-auto">
            Login
        </button>
    );
}

export default LoginBody;