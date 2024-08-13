import { useState } from "react";
import pages from "./Pages";

const uniteLogo = require("./unite-high-resolution-logo-transparent.png");

function LoginBody({ setCurrentPage, setUserRole, setStudentModule }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [first, setFirst] = useState("");
    const [last, setLast] = useState("");
    const [location, setLocation] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("");
    const [classRoomId, setClassRoomId] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    async function authenticate() {
        try {
            const authenticationResponse = await fetch('/login', {
                method: "POST",
                headers: {
                  'Content-Type': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify({ "username": username, "password": password })
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

    async function register() {
        if (!username || !first || !last || !location || !email || !phone || !role || !classRoomId || !password || !confirmPassword) {
            window.alert("Cannot register: Missing field(s)");
            return;
        }

        const formattedUsername = username.trim();
        const formattedFirst = first.trim();
        const formattedLast = last.trim();
        const formattedLocation = location.trim();
        const formattedEmail = email.trim();
        const formattedPhone = phone.trim();
        const formattedRole = role.trim().toLowerCase();
        const formattedClassRoomId = classRoomId.trim();

        if (formattedRole !== "teacher" && formattedRole !== "student") {
            window.alert('Cannot register: Not a valid role (Must be either "Teacher" or "Student")');
            return;
        }

        if (password !== confirmPassword) {
            window.alert("Passwords do not match");
            return;
        }

        try {
            const classRoomInfoResponse = await fetch(`/getClassInfo?classRoomId=${formattedClassRoomId}`);
            const {native, target, teacher} = await classRoomInfoResponse.json();

            if (!native || !target) {
                window.alert("Not a valid Classroom Code");
                return;
            }

            if (teacher === true && formattedRole === "teacher") {
                window.alert("A teacher is already registered with this classroom");
                return;
            }

            const registrationResponse = await fetch('/register', {
                method: "POST",
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    "username": formattedUsername, 
                    "email": formattedEmail, 
                    "password": password,
                    "firstname": formattedFirst,
                    "lastname": formattedLast,
                    "phone": formattedPhone,
                    "role": formattedRole,
                    "classRoomId": classRoomId,
                    "native": native,
                    "target": target,
                    "location": formattedLocation
                })
            });
            const registrationResult = await registrationResponse.json();

            if (registrationResult.msg.includes("Success")) {
                window.alert("Registration successful");
                setIsRegistering(false);
            } else if (registrationResponse.status === 409) {
                window.alert("Username already in use. Please try again");
            } else if (registrationResponse.status === 406) {
                window.alert(registrationResult.msg);
            }
        } catch (error) {
            console.error("Error during registration:", error);
        }
    }

    return (
        <div className="container-fluid">
            <div className="d-flex flex-column align-items-center justify-content-center loginpagebody">
                {!isRegistering && (
                    <img src={uniteLogo} alt="Unite Logo" id="uniteLogo" />
                )}
                <form className="mt-5">
                    {isRegistering ? (
                        <div className="row">
                            <div className="col-md-6">
                                <div className="card mb-3">
                                    <input type="text" id="name" placeholder="Username" className="form-control" onChange={(ev) => setUsername(ev.target.value)} />
                                </div>
                                <div className="card mb-3">
                                    <input type="text" id="first" placeholder="First Name" className="form-control" onChange={(ev) => setFirst(ev.target.value)} />
                                </div>
                                <div className="card mb-3">
                                    <input type="text" id="last" placeholder="Last Name" className="form-control" onChange={(ev) => setLast(ev.target.value)} />
                                </div>
                                <div className="card mb-3">
                                    <input type="text" id="location" placeholder="Country or State" className="form-control" onChange={(ev) => setLocation(ev.target.value)} />
                                </div>
                                <div className="card mb-3">
                                    <input type="email" id="email" placeholder="Email" className="form-control" onChange={(ev) => setEmail(ev.target.value)} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card mb-3">
                                    <input type="tel" id="phone" placeholder="Phone Number" className="form-control" onChange={(ev) => setPhone(ev.target.value)} />
                                </div>
                                <div className="card mb-3">
                                    <input type="text" id="classCode" placeholder="Classroom Code" className="form-control" onChange={(ev) => setClassRoomId(ev.target.value)} />
                                </div>
                                <div className="card mb-3">
                                    <input type="text" id="role" placeholder="Teacher/Student" className="form-control" onChange={(ev) => setRole(ev.target.value)} />
                                </div>
                                <div className="card mb-3">
                                    <input type="password" id="password" placeholder="Password" className="form-control" onChange={(ev) => setPassword(ev.target.value)} />
                                </div>
                                <div className="card mb-3">
                                    <input type="password" id="confirmPassword" placeholder="Confirm Password" className="form-control" onChange={(ev) => setConfirmPassword(ev.target.value)} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="card mb-3">
                                <input type="text" id="name" placeholder="Username" className="form-control" onChange={(ev) => setUsername(ev.target.value)} />
                            </div>
                            <div className="card mb-3">
                                <input type="password" id="password" placeholder="Password" className="form-control" onChange={(ev) => setPassword(ev.target.value)} />
                            </div>
                        </>
                    )}
                </form>
                <button type="button" id="login" onClick={isRegistering ? register : authenticate} className="btn btn-lg btn-block btn-primary mx-auto mt-4">
                    {isRegistering ? "Register" : "Login"}
                </button>
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} id="registrationButton" className="btn btn-link mt-3">
                    {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
                </button>
            </div>
        </div>
    );    
}

export default LoginBody;
