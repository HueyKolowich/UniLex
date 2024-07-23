import { useState } from "react";
import pages from "./Pages";

const uniteLogo = require("./unite-high-resolution-logo-transparent.png");

function LoginBody({ setCurrentPage, setUserRole, setStudentModule }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function authenticate() {
        try {
            const authenticationResponse = await fetch("/login", {
                method: "POST",
                headers: {
                  'Content-Type': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify({"username": username, "password": password})
            });
            const authenticationResult = await authenticationResponse.json();

            if (authenticationResult.msg.includes("Success")) {
                localStorage.setItem("username", authenticationResult.username);
                localStorage.setItem("classRoomId", authenticationResult.classRoomId);

                if (authenticationResult.role.includes("student")) {
                    setUserRole("student");
                    setCurrentPage(pages.Collab);
                    setStudentModule("");
                } else {
                    setUserRole("teacher");
                    setCurrentPage(pages.TMC);
                }
            }
        } catch (error) {
            console.error("Error during authentication:", error);
        }
    }

    return (
        <div className="container-fluid">
            <div className="d-flex flex-column align-items-center justify-content-center loginpagebody">
                <img src={uniteLogo} alt="Unite Logo" id="uniteLogo" />
                <form className="mt-5">
                    <div className="card mb-3">
                        <input type="text" id="name" placeholder="Name" className="form-control" onChange={(ev) => setUsername(ev.target.value)} />
                    </div>
                    <div className="card mb-4">
                        <input type="password" id="password" placeholder="Password" className="form-control" onChange={(ev) => setPassword(ev.target.value)} />
                    </div>
                </form>
                <button type="button" id="login" onClick={authenticate} className="btn btn-lg btn-block btn-primary mx-auto">
                    Login
                </button>
            </div>
        </div>
    );
}

export default LoginBody;
