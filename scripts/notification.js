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

// Initialize Firebase
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

        // Reset the notification counter when opened
        if (dropdown.classList.contains("show")) {
            const notificationCounter = document.getElementById("notificationCounter");
            if (notificationCounter) {
                notificationCounter.innerText = '0';
            }
        }
    }
}

// Attach to the window object for global access
window.toggleNotificationDropdown = toggleNotificationDropdown;

function createNotification(activity) {
    const notificationList = document.getElementById("notificationList");
    if (!notificationList) return;

    const notificationItem = document.createElement("li");

    // Format notification message with structured content
    notificationItem.innerHTML = `
        <div><strong>Action:</strong> ${activity.action}</div>
        <div><strong>Added By:</strong> ${activity.addedBy}</div>
        <div><strong>Location:</strong> ${activity.location}</div>
    `;

    // Make the notification item clickable
    notificationItem.style.cursor = "pointer"; // Change cursor to pointer
    notificationItem.addEventListener("click", () => {
        // Redirect to status.html when clicked
        window.location.href = "status.html";
    });

    // Append to notification list
    notificationList.prepend(notificationItem);

    // Update notification counter
    const notificationCounter = document.getElementById("notificationCounter");
    if (notificationCounter) {
        let currentCount = parseInt(notificationCounter.innerText, 10) || 0;
        notificationCounter.innerText = currentCount + 1;
        notificationCounter.style.display = 'inline'; // Show the counter
    }
}

// Check if the user is signed in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, proceed with Firestore query
        db.collection("activities").onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    createNotification(change.doc.data());
                }
            });
        }, (error) => {
            console.error("Error listening to Firestore changes:", error);
        });
    } else {
        // User is not signed in, redirect to login page
        console.log("User is not signed in.");
        window.location.href = "/login.html"; // Redirect to login page
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