// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAqr7jav_7l0Y7gIhfTklJXnHPzjAYV8f4",
    authDomain: "taga-cuyo-app.firebaseapp.com",
    projectId: "taga-cuyo-app",
    storageBucket: "taga-cuyo-app.appspot.com",
    messagingSenderId: "908851804845",
    appId: "1:908851804845:web:dff839dc552a573a23a424",
    measurementId: "G-NVSY2HPNX4"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Toggle notification dropdown
function toggleNotificationDropdown() {
    const dropdown = document.getElementById("notificationDropdown");
    if (dropdown) {
        dropdown.classList.toggle("show");

        // Reset notification counter display but keep the count
        const notificationCounter = document.getElementById("notificationCounter");
        if (notificationCounter && dropdown.classList.contains("show")) {
            notificationCounter.style.display = "none";
        }
    }
}

// Attach to the window object for global access
window.toggleNotificationDropdown = toggleNotificationDropdown;

// Function to create a notification
function createNotification(activity, docId) {
    console.log("Creating notification:", activity); // DEBUGGING

    const notificationList = document.getElementById("notificationList");
    if (!notificationList) return;

    const notificationItem = document.createElement("li");
    notificationItem.innerHTML = `
        <div><strong>Action:</strong> ${activity.action}</div>
        <div><strong>Added By:</strong> ${activity.addedBy}</div>
        <div><strong>Location:</strong> ${activity.location}</div>
    `;
    notificationItem.style.cursor = "pointer";

    // On click, mark as read & remove
    notificationItem.addEventListener("click", async () => {
        try {
            // Mark as read in Firestore
            await db.collection("activities").doc(docId).update({ read: true });
            console.log("Marked as read:", docId);

            // Remove from UI
            notificationItem.remove();
            updateNotificationCounter();
        } catch (error) {
            console.error("Error updating document:", error);
        }

        // Redirect to status page
        window.location.href = "status.html";
    });

    notificationList.prepend(notificationItem);
    updateNotificationCounter();
}

// Function to update the notification counter
function updateNotificationCounter() {
    const notificationCounter = document.getElementById("notificationCounter");
    const notificationList = document.getElementById("notificationList");
    if (!notificationCounter || !notificationList) return;

    let count = notificationList.children.length;
    if (count > 0) {
        notificationCounter.innerText = count;
        notificationCounter.style.display = "inline";
    } else {
        notificationCounter.style.display = "none";
    }
}

// Check if the user is signed in
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User signed in:", user.uid); // DEBUGGING

        db.collection("activities")
            .where("read", "==", false) // Only fetch unread notifications
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    console.log("No unread notifications found.");
                }

                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        console.log("New notification:", change.doc.data()); // DEBUGGING
                        createNotification(change.doc.data(), change.doc.id);
                    }
                });
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
