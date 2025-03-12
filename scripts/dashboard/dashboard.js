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

                // Select the Admin Dashboard menu item
                const adminDashboardMenuItem = document.querySelector(".side-menu li a.active");

                if (role === "admin") {
                    // Hide the Admin Dashboard menu option
                    if (adminDashboardMenuItem) {
                        adminDashboardMenuItem.parentElement.style.display = "none"; 
                    }
                }
                // If role is "superadmin", do nothing (they can see everything)

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
export{onAuthStateChanged};