// scripts/staff/displayUsers.js
import { firestore, auth } from "./firebaseConfig.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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

// Display users in the table (excluding admins)
export async function displayUsers() {
    const adminRef = collection(firestore, "admin");
    const querySnapshot = await getDocs(adminRef);
    const userTable = document.getElementById("staffTable").querySelector("tbody");
    userTable.innerHTML = ""; // Clear the table

    const currentUser = auth.currentUser;

    querySnapshot.forEach((doc) => {
        const adminUser = doc.data();

        // Skip users who have isAdmin set to true
        if (adminUser.isAdmin) return;

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
            <td>Staff</td> <!-- Role is always Staff since Admins are filtered out -->
            <td>${dateJoined}</td>
            <td>${deleteButton}</td>
        </tr>`;

        userTable.innerHTML += row;
    });
}
