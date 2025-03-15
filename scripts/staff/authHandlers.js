// scripts/staff/authHandlers.js
import { auth, firestore } from "./firebase_init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { displayUsers } from "./displayUsers.js";

// Handle authentication state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User is signed in:", user);
        console.log("UID:", user.uid);
        console.log("Email:", user.email);

        // Fetch the user's role from Firestore
        try {
            const userDocRef = doc(firestore, "admin", user.uid); // Assuming "admin" is the collection name
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const role = userData.role; // Assuming the role is stored in a field called "role"
                console.log("User role:", role);
            } else {
                console.log("User document does not exist in Firestore.");
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
        }
    } else {
        console.log("No user is signed in.");
    }

    displayUsers();
});