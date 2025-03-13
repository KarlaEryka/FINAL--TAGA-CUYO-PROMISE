import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { firebaseConfig } from "./firebase-config.js"; // Import Firebase config

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Check user authentication state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Fetch user role from the database
            const userRef = ref(database, `admin/${user.uid}/role`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const role = snapshot.val();

                // Select the container for the entire page content
                const pageContent = document.body; // Clear the entire body content

                if (role === "admin") {
                    // Clear the entire page content for admin users
                    pageContent.innerHTML = ""; // Remove all content from the page
                    pageContent.style.backgroundColor = "white"; // Optional: Set a blank background
                } else if (role === "superadmin") {
                    // Show the full dashboard for superadmin users
                    // No changes needed, the content remains visible
                } else {
                    // Handle other roles or unauthorized access
                    alert("Unauthorized access. Contact support.");
                    window.location.href = "login.html";
                }
            } else {
                alert("User role not found. Contact support.");
                window.location.href = "login.html";
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
            alert("Error checking user role. Please try again.");
            window.location.href = "login.html";
        }
    } else {
        // If not authenticated, redirect to login
        window.location.href = "login.html";
    }
});


export{onAuthStateChanged}