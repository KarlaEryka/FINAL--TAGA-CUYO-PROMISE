// Initialize Firebase (Replace with your actual Firebase config)
const firebaseConfig = {
    apiKey: "AIzaSyD4Wfqy2TvkmLk0YnF6SSVQ9KS5AMO54FY",
        authDomain: "taga-cuyo-app.firebaseapp.com",
        databaseURL: "https://taga-cuyo-app-default-rtdb.asia-southeast1.firebasedatabase.app/",
        projectId: "taga-cuyo-app",
        storageBucket: "taga-cuyo-app.appspot.com",
        messagingSenderId: "908851804845",
        appId: "1:908851804845:web:dff839dc552a573a23a424",
        measurementId: "G-NVSY2HPNX4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Function to toggle notification dropdown
function toggleNotificationDropdown() {
    const dropdown = document.getElementById("notificationDropdown");
    dropdown.classList.toggle("show");

    // Reset the notification counter when opened
    if (dropdown.classList.contains("show")) {
        document.getElementById("notificationCounter").innerText = '0';
    }
}

// Function to create notifications
function createNotification(activity) {
    const notificationItem = document.createElement("li");

    // Get approval status
    const approvalStatus = activity.isApprove ? "<strong>Status:</strong> Approved" : "<strong>Status:</strong> Pending";

    // Format notification message
    notificationItem.innerHTML = `
        <strong>Lesson:</strong> ${activity.lesson_name} <br> 
        <strong>Question:</strong> ${activity.oldWord} <br> 
        <strong>Timestamp:</strong> ${new Date(activity.timestamp.toDate()).toLocaleString()} <br> 
        ${approvalStatus} <br>
    `;

    // Append to notification list
    const notificationList = document.getElementById("notificationList");
    notificationList.prepend(notificationItem);

    // Update notification counter
    const notificationCounter = document.getElementById("notificationCounter");
    let currentCount = parseInt(notificationCounter.innerText, 10) || 0;
    notificationCounter.innerText = currentCount + 1;
}

// Listen for changes in the "activities" collection
db.collection("activities").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            createNotification(change.doc.data());
        }
    });
});

// Close dropdown when clicking outside
document.addEventListener("click", function(event) {
    const dropdown = document.getElementById("notificationDropdown");
    const bellIcon = document.querySelector(".notification-icon");
    
    if (!dropdown.contains(event.target) && !bellIcon.contains(event.target)) {
        dropdown.classList.remove("show");
    }
});
