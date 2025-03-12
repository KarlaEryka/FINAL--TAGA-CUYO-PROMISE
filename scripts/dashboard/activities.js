// Import Firestore functions from the Firebase Modular SDK
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { db } from './firebase-config.js'; // Import db from firebaseconfig.js
// import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { initializeApp } from './firebase-config.js';
import { onAuthStateChanged } from './dashboard.js';

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    enforceAccessControl(user);
});

// Fetch recent activities
async function fetchRecentActivities() {
    const activitiesRef = collection(db, 'activities'); // Get reference to the 'activities' collection
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(5)); // Create a query to order by timestamp and limit to 5

    const querySnapshot = await getDocs(q); // Execute the query

    let activityList = document.getElementById('activity-list');
    activityList.innerHTML = ''; // Clear previous activities

    querySnapshot.forEach(doc => {
        const activityData = doc.data();
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <strong>Action:</strong> ${activityData.action} <br>
            <strong>By:</strong> ${activityData.addedBy} <br>
            <strong>Location:</strong> ${activityData.location} <br>
            <strong>Timestamp:</strong> ${activityData.timestamp.toDate().toLocaleString()}
        `;
        activityList.appendChild(listItem);
    });
}

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
