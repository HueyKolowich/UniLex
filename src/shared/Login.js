import { useState, useEffect } from "react";
import pages from "./Pages";
import ProductDisplay from "./Payment";

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
    const [incorrectPassword, setIncorrectPassword] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [isResetPage, setIsResetPage] = useState(false);
    const [resetToken, setResetToken] = useState(null);
    const [resetEmail, setResetEmail] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const resetToken = queryParams.get("resetToken");
        const resetEmail = queryParams.get("email");

        if (resetToken) {
            setIsResetPage(true);
            setResetToken(resetToken);
            setResetEmail(resetEmail);
        }
    }, []);

    const handlePasswordReset = async () => {
        try {
            if (password !== confirmPassword) {
                window.alert("Passwords do not match");
                return;
            }

            const response = await fetch("/password-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "email": resetEmail, resetToken, password }),
            });
            const data = await response.json();
            alert(data.msg);
            if (response.ok) {
                window.location.href = "/";
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    async function resetPassword() {
        try {
            const resetEmail = window.prompt(
                "Please enter the email address associated with your account for password reset intstructions."
            );
            
            const passwordResetResponse = await fetch('/password-reset-request', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify({ "email": resetEmail })
            });
            if (passwordResetResponse.status === 404) {
                window.alert("Could not find an account with the provided email address.");
            } else {
                window.alert("Password reset instructions have been sent to your email.");
            }
        } catch (error) {
            console.error("Couldn't reset password", error);
        }
    }

    async function authenticate() {
        try {
            setIncorrectPassword(false);

            const authenticationResponse = await fetch('/login', {
                method: "POST",
                headers: {
                  'Content-Type': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify({ "username": username, "password": password })
            });
            if (authenticationResponse.status === 401) {
                setIncorrectPassword(true);
            } else if (authenticationResponse.status === 403) {
                localStorage.setItem("username", username);
                setIsPaying(true);
            }

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
            localStorage.setItem("username", formattedUsername);

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
                    "classRoomId": formattedClassRoomId,
                    "native": native,
                    "target": target,
                    "location": formattedLocation
                })
            });
            const registrationResult = await registrationResponse.json();

            if (registrationResult.msg.includes("Success")) {                
                window.alert("Registration successful");
                setIsRegistering(false);

                if (formattedRole !== 'teacher' && registrationResult.paymentRequired) {
                    setIsPaying(true);
                } else {
                    fetch('/payment-status', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username: username, noPaymentRequired: true })
                        })
                        .catch(error => {
                        console.error("Error sending payment status request:", error);
                    });
                }
            } else if (registrationResponse.status === 409) {
                window.alert("Username already in use. Please try again");
            } else if (registrationResponse.status === 406) {
                window.alert(registrationResult.msg);
            }
        } catch (error) {
            console.error("Error during registration:", error);
        }
    }

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Enter") {
                if (isRegistering) {
                    register();
                } else {
                    authenticate();
                }
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isRegistering, username, password, email, first, last, location, phone, role, classRoomId, confirmPassword]);

    const togglePasswordVisiblity = () => {
        setPasswordVisible(passwordVisible ? false : true);
    };

    if (isResetPage) {
        return (
            <div className="container-fluid">
                <div className="d-flex align-items-center justify-content-around login-body">
                    <div className="d-flex flex-column">
                        <h2 className="heading-style-h2">
                            Collaborative
                        </h2>
                        <h2 className="heading-style-h2">
                            Language
                        </h2>
                        <h2 className="heading-style-h2">
                            Learning
                        </h2>
                    </div>
                    <div className="d-flex flex-column">
                        <div className="password-wrapper d-flex align-items-center justify-content-end">
                            <input type={passwordVisible ? "text" : "password"} id="password" placeholder="New Password" className="text-field mb-3" onChange={(ev) => setPassword(ev.target.value)} />
                            <i className="bi bi-eye mb-3 me-3" onClick={togglePasswordVisiblity}/>
                        </div>
                        <input type={passwordVisible ? "text" : "password"} id="confirmPassword" placeholder="Confirm New Password" className="text-field mb-3" onChange={(ev) => setConfirmPassword(ev.target.value)} />
                        <button type="button" id="login" onClick={() => handlePasswordReset()} className="button">
                            Reset Password
                        </button>
                    </div>
                </div>

                <div className="text-center mb-3">
                    <a className="navigation-item" href="/about">About</a>
                    <p>&copy; 2024 UniLex. All Rights Reserved.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="d-flex align-items-center justify-content-around login-body">
                {isPaying ? (<ProductDisplay />) : (
                    <>
                        {!isRegistering && (
                            <div className="d-flex flex-column">
                                <h2 className="heading-style-h2">
                                    Collaborative
                                </h2>
                                <h2 className="heading-style-h2">
                                    Language
                                </h2>
                                <h2 className="heading-style-h2">
                                    Learning
                                </h2>
                            </div>
                        )}
                        <div className="d-flex flex-column align-items-center mt-5">
                            <form className="mb-1 text-center">
                                {!isRegistering && incorrectPassword ? (
                                    <p className="incorrect-password">Username or Password is incorrect</p>
                                ) : (
                                    <></>
                                )}
                                {isRegistering ? (
                                    <div className="row">
                                        <div className="col-md-6 d-flex flex-column">
                                                <input type="text" id="name" placeholder="Username" className="text-field text-field-small mb-3" onChange={(ev) => setUsername(ev.target.value)} />
                                                <input type="text" id="first" placeholder="First Name" className="text-field text-field-small mb-3" onChange={(ev) => setFirst(ev.target.value)} />
                                                <input type="text" id="last" placeholder="Last Name" className="text-field text-field-small mb-3" onChange={(ev) => setLast(ev.target.value)} />
                                                <input type="text" id="location" placeholder="Country or State" className="text-field text-field-small mb-3" onChange={(ev) => setLocation(ev.target.value)} />
                                                <input type="email" id="email" placeholder="Email" className="text-field text-field-small mb-3" onChange={(ev) => setEmail(ev.target.value)} />
                                        </div>
                                        <div className="col-md-6 d-flex flex-column">
                                                <input type="tel" id="phone" placeholder="Phone Number" className="text-field text-field-small mb-3" onChange={(ev) => setPhone(ev.target.value)} />
                                                <input type="text" id="classCode" placeholder="Classroom Code" className="text-field text-field-small mb-3" onChange={(ev) => setClassRoomId(ev.target.value)} />
                                                <select id="role" className="text-field text-field-small role-select mb-3" required onChange={(ev) => setRole(ev.target.value)}>
                                                    <option value="" disabled selected>Role</option>
                                                    <option value="teacher">Teacher</option>
                                                    <option value="student">Student</option>
                                                </select>
                                                <div className="password-wrapper d-flex align-items-center justify-content-end">
                                                    <input type={passwordVisible ? "text" : "password"} id="password" placeholder="Password" className="text-field text-field-small mb-3" onChange={(ev) => setPassword(ev.target.value)} />
                                                    <i className="bi bi-eye mb-3 me-3" onClick={togglePasswordVisiblity}/>
                                                </div>
                                                <div className="password-wrapper d-flex align-items-center justify-content-end">
                                                    <input type={passwordVisible ? "text" : "password"} id="confirmPassword" placeholder="Confirm Password" className="text-field text-field-small mb-3" onChange={(ev) => setConfirmPassword(ev.target.value)} />
                                                    <i className="bi bi-eye mb-3 me-3" onClick={togglePasswordVisiblity}/>
                                                </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column">
                                        <input type="text" id="name" placeholder="Username" className="text-field mb-3" onChange={(ev) => setUsername(ev.target.value)} />
                                        <div className="password-wrapper d-flex align-items-center justify-content-end">
                                            <input type={passwordVisible ? "text" : "password"} id="password" placeholder="Password" className="text-field mb-3" onChange={(ev) => setPassword(ev.target.value)} />
                                            <i className="bi bi-eye mb-3 me-3" onClick={togglePasswordVisiblity}/>
                                        </div>
                                    </div>
                                )}
                            </form>
                            <button type="button" id="login" onClick={isRegistering ? register : authenticate} className="button">
                                {isRegistering ? "Register" : "Login"}
                            </button>
                            <button type="button" onClick={() => setIsRegistering(!isRegistering)} id="registrationButton" className="btn btn-link registration-option pb-0 mb-0">
                                {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
                            </button>
                            <button type="button" onClick={() => resetPassword()} id="forgotPasswordButton" className="btn btn-link registration-option pb-0 mb-0">
                                {isRegistering ? "" : "Forgot password?"}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="text-center mb-3">
                <a className="navigation-item" href="/about">About</a>
                <p>&copy; 2024 UniLex. All Rights Reserved.</p>
            </div>
        </div>
    );    
}

export default LoginBody;
