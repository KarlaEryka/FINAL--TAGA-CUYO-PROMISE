import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const auth = getAuth();

// Logout function
document.getElementById("logoutButton").addEventListener("click", (e) => {
    e.preventDefault(); // Prevent the default link behavior

    signOut(auth)
        .then(() => {
            // Clear session and local storage
            sessionStorage.clear();
            localStorage.clear();

            // Replace the current history entry with the login page
            history.replaceState(null, null, "login.html");

            // Redirect to the login page
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Error logging out: ", error);
            alert("Error logging out. Please try again.");
        });
});

// Prevent users from navigating back after logout
window.onload = function () {
    // Push a new state to the history stack
    history.pushState(null, null, location.href);

    // Listen for the popstate event (back/forward navigation)
    window.onpopstate = function () {
        // Replace the current state with the login page
        history.replaceState(null, null, "login.html");

        // Redirect to the login page
        window.location.href = "login.html";
    };
};

// Additional measure to prevent going back
window.onpageshow = function (event) {
    // If the page is loaded from the cache (back/forward navigation), reload it
    if (event.persisted) {
        window.location.reload();
    }
};