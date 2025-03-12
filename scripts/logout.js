import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const auth = getAuth();

// Logout function
document.getElementById("logoutButton").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // Clear session storage to prevent going back
            sessionStorage.clear();
            localStorage.clear();

            // Prevent back button navigation
            history.replaceState(null, null, location.href);
            window.location.href = "index.html"; // Redirect to login page
        })
        .catch((error) => {
            console.error("Error logging out: ", error);
            alert("Error logging out. Please try again.");
        });
});

// Prevent users from navigating back after logout
window.onload = function () {
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        history.go(1);
    };
};