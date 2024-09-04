document.addEventListener("DOMContentLoaded", function() {
    const username = localStorage.getItem("username");

    if (username) {
      fetch('/payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username })
      })
      .catch(error => {
        console.error("Error sending payment status request:", error);
      });
    } else {
      console.error("Username not found in localStorage.");
    }
  });

const query = new URLSearchParams(window.location.search);
const messageElement = document.getElementById('message');

if (query.get("success")) {
    messageElement.textContent = "The payment was successful! You're all set to start practicing with native speakers.";
}

if (query.get("canceled")) {
    messageElement.textContent = `The payment was either canceled or unsuccessful -- you will need to attempt payment again. 
    The payment screen can be reached by logging in with the username and password you set during registration.
    `;
}