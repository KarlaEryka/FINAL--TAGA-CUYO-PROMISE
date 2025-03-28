// Import Firestore and Auth functions from the Firebase Modular SDK
import { collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { db, app, getAuth } from './firebase-config.js';
import { onAuthStateChanged } from './dashboard.js';

// Initialize Firebase Auth
const auth = getAuth(app); 

function enforceAccessControl(user) {
    if (!user) {
        window.location.href = "login.html"; 
    } else {
        console.log("User is logged in:", user);
    }
}

onAuthStateChanged(auth, (user) => {
    enforceAccessControl(user);
});

// Email encryption function (kept for other parts of the application)
function encryptEmail(email) {
    if (!email) return "N/A";
    
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;
    
    const localPart = email.substring(0, atIndex);
    const domainPart = email.substring(atIndex);
    
    if (localPart.length > 5) {
        const firstThree = localPart.substring(0, 3);
        const lastTwo = localPart.substring(localPart.length - 2);
        const middlePart = localPart.substring(3, localPart.length - 2);
        return firstThree + '*'.repeat(middlePart.length) + lastTwo + domainPart;
    }
    
    if (localPart.length > 1) {
        return localPart.charAt(0) + '*'.repeat(localPart.length - 1) + domainPart;
    }
    
    return localPart + domainPart;
}

// Modified loadUserSupport function without email encryption
function loadUserSupport() {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, orderBy('timeStamp', 'desc'), limit(5));

    getDocs(q)
        .then((querySnapshot) => {
            const userSupportList = document.getElementById("userSupportList");
            userSupportList.innerHTML = "";

            querySnapshot.forEach((doc) => {
                const supportData = doc.data();
                const timeStamp = supportData.timeStamp
                    ? (typeof supportData.timeStamp.toDate === "function"
                        ? supportData.timeStamp.toDate()
                        : new Date(supportData.timeStamp))
                    : null;

                // Show full email (no encryption)
                const displayEmail = supportData.email || "No email";

                const supportItem = document.createElement("li");
                supportItem.innerHTML = `
                    <strong>Issue:</strong> ${supportData.issue || "No issue provided"}<br>
                    <strong>By:</strong> ${supportData.fullName || "Anonymous"} (${displayEmail})<br>
                    <strong>Submitted At:</strong> ${timeStamp ? timeStamp.toLocaleString() : "Unknown"}
                `;
                userSupportList.appendChild(supportItem);
            });
        })
        .catch((error) => {
            console.error("Error loading user support data: ", error);
        });
}

// fetchRecentActivities function keeps email encryption
async function fetchRecentActivities() {
    try {
        const activitiesRef = collection(db, 'activities');
        const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(5));

        const querySnapshot = await getDocs(q);
        let activityList = document.getElementById('activity-list');
        activityList.innerHTML = '';

        if (querySnapshot.empty) {
            activityList.innerHTML = "<li>No recent activities.</li>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const activityData = doc.data();
            
            // Still using encryption for activities
            const encryptedAddedBy = activityData.addedBy ? encryptEmail(activityData.addedBy) : "Unknown";

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>Action:</strong> ${activityData.action || "Unknown"} <br>
                <strong>By:</strong> ${encryptedAddedBy} <br>
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

// Load both functions on page load
document.addEventListener("DOMContentLoaded", () => {
    loadUserSupport();
    fetchRecentActivities();
});