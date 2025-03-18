// Import Firebase modules (ES6+ modular syntax)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, updateDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { firebaseConfig } from "./dashboard/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Toggle notification dropdown
function toggleNotificationDropdown() {
    const dropdown = document.getElementById("notificationDropdown");
    if (dropdown) {
        dropdown.classList.toggle("show");

        // Reset notification counter display when dropdown is opened
        const notificationCounter = document.getElementById("notificationCounter");
        if (notificationCounter && dropdown.classList.contains("show")) {
            notificationCounter.style.display = "none";
        }
    }
}

// Attach to the window object for global access
window.toggleNotificationDropdown = toggleNotificationDropdown;

// Function to format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return "Unknown time";
    const date = timestamp.toDate();
    return date.toLocaleString(); // Format to readable date-time string
}

// Function to create a notification
function createNotification(activity, docId) {
    console.log("Creating notification:", activity); // DEBUGGING

    const notificationList = document.getElementById("notificationList");
    if (!notificationList) return;

    const notificationItem = document.createElement("li");
    notificationItem.innerHTML = `
        <div><strong>Time:</strong> ${formatTimestamp(activity.timestamp)}</div>
        <div><strong>Action:</strong> ${activity.action}</div>
        <div><strong>Added By:</strong> ${activity.addedBy}</div>
        <div><strong>Location:</strong> ${activity.location}</div>
    `;
    notificationItem.style.cursor = "pointer"; 

    // On click, mark as read & remove from the UI
    notificationItem.addEventListener("click", async () => {
        try {
            // Mark the notification as read in Firestore
            const activityRef = doc(db, "activities", docId);
            await updateDoc(activityRef, { read: true });
            console.log("Marked as read:", docId);

            // Remove the notification from the UI
            notificationItem.remove();

            // Update the notification counter
            updateNotificationCounter();

            // Redirect to status.html
            window.location.href = "status.html";
        } catch (error) {
            console.error("Error updating document:", error);
        }
    });

    // Append to notification list (most recent first)
    notificationList.prepend(notificationItem);
}

// Function to update the notification counter
function updateNotificationCounter() {
    const notificationCounter = document.getElementById("notificationCounter");
    const notificationList = document.getElementById("notificationList");
    if (!notificationCounter || !notificationList) return;

    // Count the number of unread notifications
    const count = notificationList.children.length;
    if (count > 0) {
        notificationCounter.innerText = count;
        notificationCounter.style.display = "inline"; // Show the counter
    } else {
        notificationCounter.style.display = "none"; // Hide the counter if no notifications
    }
}

// Check if the user is signed in
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User signed in:", user.uid); // DEBUGGING

        // Listen for unread notifications
        const activitiesRef = collection(db, "activities");
        const q = query(activitiesRef, where("read", "==", false)); // Only fetch unread notifications
        onSnapshot(q, (snapshot) => {
            const notificationList = document.getElementById("notificationList");
            if (!notificationList) return;

            // Clear the current list
            notificationList.innerHTML = "";

            if (snapshot.empty) {
                console.log("No unread notifications found.");
                updateNotificationCounter(); // Update counter to 0
                return;
            }

            // Convert snapshot to an array of documents
            const notifications = [];
            snapshot.forEach((doc) => {
                notifications.push({ id: doc.id, data: doc.data() });
            });

            // Sort notifications by timestamp (latest first)
            notifications.sort((a, b) => {
                const timestampA = a.data.timestamp?.toDate().getTime() || 0; // Use optional chaining and fallback to 0
                const timestampB = b.data.timestamp?.toDate().getTime() || 0;
                return timestampB - timestampA; // Sort in descending order (latest first)
            });

            // Add sorted notifications to the UI
            notifications.forEach((notification) => {
                createNotification(notification.data, notification.id);
            });

            // Update the notification counter
            updateNotificationCounter();
        }, (error) => {
            console.error("Firestore error:", error);
        });
    } else {
        console.log("User not signed in.");
        window.location.href = "/login.html";
    }
});

// Close dropdown when clicking outside
document.addEventListener("click", function(event) {
    const dropdown = document.getElementById("notificationDropdown");
    const bellIcon = document.querySelector(".notification-icon");
    
    if (dropdown && bellIcon && !dropdown.contains(event.target) && !bellIcon.contains(event.target)) {
        dropdown.classList.remove("show");
    }
});
