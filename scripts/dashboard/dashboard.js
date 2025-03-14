import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { firebaseConfig } from "./firebase-config.js"; // Import Firebase config

// Check if Firebase app is already initialized
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const database = getDatabase(app);

// Function to toggle the visibility of sidebar menus based on the user's role
function toggleSidebarMenuVisibility(role) {
    const sidebar = document.getElementById("sidebar");
    // Show the sidebar only after the role is verified
    if (sidebar) sidebar.style.display = "block";

    const dashboardMenu = document.getElementById("dashboard-menu");
    const userManagementMenu = document.getElementById("user-management-menu");
    const learningFeatureMenu = document.getElementById("learning-feature-menu");
    const supportFeedbackMenu = document.getElementById("support-feedback-menu");
    const termsMenu = document.getElementById("terms-menu");
    const settingsMenu = document.getElementById("settings-menu");

    // Define which menus are visible for each role
    if (role === "superadmin") {
        // Superadmin can see all menus
        if (dashboardMenu) dashboardMenu.style.display = "block";
        if (userManagementMenu) userManagementMenu.style.display = "block";
        if (learningFeatureMenu) learningFeatureMenu.style.display = "block";
        if (supportFeedbackMenu) supportFeedbackMenu.style.display = "block";
        if (termsMenu) termsMenu.style.display = "block";
        if (settingsMenu) settingsMenu.style.display = "block";
    } else if (role === "admin") {
        // Admin can see specific menus (e.g., no Dashboard menu)
        if (dashboardMenu) dashboardMenu.style.display = "none"; // Hide Dashboard
        if (userManagementMenu) userManagementMenu.style.display = "block";
        if (learningFeatureMenu) learningFeatureMenu.style.display = "block";
        if (supportFeedbackMenu) supportFeedbackMenu.style.display = "block";
        if (termsMenu) termsMenu.style.display = "block";
        if (settingsMenu) settingsMenu.style.display = "block";
    } else {
        // Other roles (e.g., no access)
        if (dashboardMenu) dashboardMenu.style.display = "none";
        if (userManagementMenu) userManagementMenu.style.display = "none";
        if (learningFeatureMenu) learningFeatureMenu.style.display = "none";
        if (supportFeedbackMenu) supportFeedbackMenu.style.display = "none";
        if (termsMenu) termsMenu.style.display = "none";
        if (settingsMenu) settingsMenu.style.display = "none";
    }
}

// Check user authentication state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Fetch user role from the database
            const userRef = ref(database, `admin/${user.uid}/role`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const role = snapshot.val();

                // Toggle the visibility of sidebar menus based on the user's role
                toggleSidebarMenuVisibility(role);

                // Handle other role-based logic (e.g., redirects)
                if (role === "admin") {
                    // Additional logic for admin users
                } else if (role === "superadmin") {
                    // Additional logic for superadmin users
                } else {
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

export { onAuthStateChanged };