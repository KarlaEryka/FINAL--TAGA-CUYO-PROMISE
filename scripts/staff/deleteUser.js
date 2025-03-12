// scripts/staff/deleteUser.js
import { firestore } from "./firebaseConfig.js";
import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { displayUsers } from "./displayUsers.js";

// Delete a user
export async function deleteUserAccount(docId) {
    try {
        await deleteDoc(doc(firestore, "admin", docId));
        alert("User deleted successfully.");
        displayUsers(); // Refresh table
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user. Please try again.");
    }
}