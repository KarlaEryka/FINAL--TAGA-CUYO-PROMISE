// Import Firestore and Auth functions from the Firebase Modular SDK
import { collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { db, app,getAuth } from './firebase-config.js'; // Import db and app from firebase-config.js
import { onAuthStateChanged } from './dashboard.js';
// Initialize Firebase Auth
const auth = getAuth(app); 
function enforceAccessControl(user) {
    if (!user) {
        // Redirect to login or show an access denied message
        window.location.href = "login.html"; 
    } else {
        console.log("User is logged in:", user);
    }
}

// Now, it can be used in the onAuthStateChanged function
onAuthStateChanged(auth, (user) => {
    enforceAccessControl(user);
});

async function fetchRecentActivities() {
    try {
        console.log("Fetching recent activities...");
        const activitiesRef = collection(db, 'activities'); // Reference to 'activities' collection
        const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(5));

        const querySnapshot = await getDocs(q); // Execute the query
        console.log("Query snapshot size:", querySnapshot.size); // Debugging

        let activityList = document.getElementById('activity-list');
        activityList.innerHTML = ''; // Clear previous activities

        if (querySnapshot.empty) {
            console.log("No activities found.");
            activityList.innerHTML = "<li>No recent activities.</li>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const activityData = doc.data();
            console.log("Activity Data:", activityData); // Debugging

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>Action:</strong> ${activityData.action || "Unknown"} <br>
                <strong>By:</strong> ${activityData.addedBy || "Unknown"} <br>
                <strong>Location:</strong> ${activityData.location || "Unknown"} <br>
                <strong>Timestamp:</strong> ${activityData.timestamp ? activityData.timestamp.toDate().toLocaleString() : "Unknown"}
            `;
            activityList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Error fetching activities:", error);
        document.getElementById('activity-list').innerHTML = "<li>Error loading activities.</li>";
    }
}
document.addEventListener("DOMContentLoaded", fetchRecentActivities);

// Load user support data
function loadUserSupport() {
    const ticketsRef = collection(db, 'tickets'); // Get reference to the 'tickets' collection
    const q = query(ticketsRef, orderBy('timeStamp', 'desc'), limit(5)); // Create a query to order by timestamp and limit to 5

    getDocs(q)
        .then((querySnapshot) => {
            const userSupportList = document.getElementById("userSupportList");
            userSupportList.innerHTML = ""; // Clear existing data

            querySnapshot.forEach((doc) => {
                const supportData = doc.data();
                const timeStamp = supportData.timeStamp
                    ? (typeof supportData.timeStamp.toDate === "function"
                        ? supportData.timeStamp.toDate()
                        : new Date(supportData.timeStamp)) // If it's a string, convert to Date
                    : null;

                const supportItem = document.createElement("li");
                supportItem.innerHTML = `
                    <strong>Issue:</strong> ${supportData.issue || "No issue provided"}<br>
                    <strong>By:</strong> ${supportData.fullName || "Anonymous"} (${supportData.email || "No email"})<br>
                    <strong>Submitted At:</strong> ${timeStamp ? timeStamp.toLocaleString() : "Unknown"}
                `;
                userSupportList.appendChild(supportItem);
            });
        })
        .catch((error) => {
            console.error("Error loading user support data: ", error);
        });
}

// Load user support data on page load
document.addEventListener("DOMContentLoaded", loadUserSupport);
