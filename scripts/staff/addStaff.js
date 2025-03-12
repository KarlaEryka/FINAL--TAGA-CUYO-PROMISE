import { auth, firestore, database, app,initializeApp } from "./firebaseConfig.js"; // Ensure 'app' is imported
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { displayUsers } from "./displayUsers.js";

// ✅ Initialize a secondary Firebase app instance for temporary authentication
const tempApp = initializeApp(app.options, "TempApp"); // Use the same config as the main app
const tempAuth = getAuth(tempApp); // Use the secondary app instance

export const addStaff = () => {
    document.getElementById("addStaffModal").addEventListener("submit", async (event) => {
        event.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("email").value.trim();
        const birthdate = document.getElementById("birthdate").value;
        const phoneNumber = document.getElementById("phoneNumber").value.trim();
        const role = document.getElementById("role").value;
        const gender = document.getElementById("gender").value;
        
        const currentAdmin = auth.currentUser;
        if (!currentAdmin) {
            alert("No admin is currently signed in.");
            return;
        }

        // ✅ Validate that the role is not "admin"
        if (role === "admin") {
            alert("Admins cannot add other admins. Please select the 'staff' role.");
            return;
        }
        try {
            // Check if the user already exists in Firestore
            const userRef = doc(firestore, "admin", email);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                alert("User already exists!");
                return;
            }

            // ✅ Create the new user in Firebase Authentication using the secondary app instance
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, "TagaCuyo2025!");
            const newUserUid = userCredential.user.uid;

            // ✅ Store user details in Firestore
            const newUser = {
                uid: newUserUid,
                firstName,
                lastName,
                email,
                birthdate,
                phoneNumber: phoneNumber || null,
                gender,
                role,
                isAdmin: role === "admin",
                isActive: true,
                createdAt: serverTimestamp()
            };

            await setDoc(doc(firestore, "admin", newUserUid), newUser);

            // ✅ Store user details in Realtime Database
            await set(ref(database, `admin/${newUserUid}`), newUser);

            // ✅ Send a password reset email to the new user using the secondary app instance
            await sendPasswordResetEmail(tempAuth, email);

            alert(`${lastName} ${firstName} added successfully as ${role}! A password reset email has been sent.`);

            // Reset form and close modal
            document.getElementById("addStaffForm").reset();
            console.log("Closing modal...");
            document.getElementById("addStaffModal").style.display = "none";
            console.log("Modal closed.");
            displayUsers();
        } catch (error) {
            console.error("Error adding user:", error);
            alert(`Failed to add staff/admin: ${error.message}`);
        }
    });
};