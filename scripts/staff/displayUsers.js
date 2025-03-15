import { firebaseConfig } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { auth, firestore } from "./firebase_init.js";
import { deleteUserAccount } from "./deleteUser.js";

// Encrypt email for display
function encryptEmail(email) {
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;

    const localPart = email.substring(0, atIndex);
    const domainPart = email.substring(atIndex);

    if (localPart.length > 5) {
        const firstThree = localPart.substring(0, 3);
        const lastTwo = localPart.substring(localPart.length - 4);
        const middlePart = localPart.substring(3, localPart.length - 2);
        return firstThree + '*'.repeat(middlePart.length) + lastTwo + domainPart;
    }

    return email;
}

// Display users in the table
export async function displayUsers() {
    const adminRef = collection(firestore, "admin");
    const querySnapshot = await getDocs(adminRef);
    const userTable = document.getElementById("staffTable").querySelector("tbody");
    userTable.innerHTML = ""; // Clear the table

    const currentUser = auth.currentUser;

    // Fetch the current user's role from Firestore
    const currentUserDoc = await getDocs(collection(firestore, "admin"));
    let currentUserRole = "staff"; // Default role
    currentUserDoc.forEach((doc) => {
        if (doc.data().email === currentUser.email) {
            currentUserRole = doc.data().role; // Get the role of the current user
        }
    });

    querySnapshot.forEach((doc) => {
        const adminUser = doc.data();

        // If the current user is an admin, skip superadmins
        if (currentUserRole === "superadmin" && adminUser.role === "superadmin") {
            return;
        }

        // If the current user is a staff, skip admins and superadmins
        if (currentUserRole === "admin" && (adminUser.role === "admin" || adminUser.role === "superadmin")) {
            return;
        }

        const encryptedEmail = encryptEmail(adminUser.email);
        const dateJoined = adminUser.createdAt ? adminUser.createdAt.toDate().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }) : "N/A";

        const isCurrentUser = currentUser && currentUser.email === adminUser.email;
        const deleteButton = `<button class="delete-btn" data-id="${doc.id}" data-email="${adminUser.email}" ${isCurrentUser ? "disabled" : ""}>Delete</button>`;

        const row = `<tr>
            <td>${adminUser.firstName} ${adminUser.lastName}</td>
            <td>${encryptedEmail}</td>
            <td>${adminUser.role}</td> <!-- Display the role -->
            <td>${dateJoined}</td>
            <td>${deleteButton}</td>
        </tr>`;

        userTable.innerHTML += row;
    });
}

// Add event listener for delete buttons
document.getElementById("staffTable").addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
        const docId = event.target.getAttribute("data-id");
        const email = event.target.getAttribute("data-email");

        if (confirm(`Are you sure you want to delete the user with email: ${email}?`)) {
            await deleteUserAccount(docId);
        }
    }
});