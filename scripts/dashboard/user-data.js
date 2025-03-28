// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { onAuthStateChanged } from "./dashboard.js";
// Import Firebase config
import { firebaseConfig } from "./firebase-config.js"; 
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ✅ Initialize Firebase App first
const app = initializeApp(firebaseConfig); 
const db = getFirestore(app); // Initialize Firestore
const auth = getAuth(app); // Initialize Auth
const rtdb = getDatabase(app); // Initialize Realtime Database

// Function to check if the user is a SuperAdmin
async function checkSuperAdmin(uid) {
    const adminRef = doc(db, 'admin', uid); // Get the specific admin document
    const adminSnap = await getDoc(adminRef);
    return adminSnap.exists() && adminSnap.data().role === "superadmin";
}

// Function to encrypt the name (show first letter and last letter, hide middle)
function encryptName(name) {
    if (!name || name.length <= 2) return name; // Return as is if too short
    
    const firstChar = name.substring(0, 1);
    const lastChar = name.substring(name.length - 1);
    const middleChars = name.substring(1, name.length - 1);
    
    return firstChar + '*'.repeat(middleChars.length) + lastChar;
}

// Function to encrypt the email (show first 3 and last 2 characters before "@" and hide the rest)
function encryptEmail(email) {
    if (!email) return "N/A";
    
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email; // If no "@" symbol is found, return as is
    
    const localPart = email.substring(0, atIndex);
    const domainPart = email.substring(atIndex);
    
    if (localPart.length > 5) {
        const firstThree = localPart.substring(0, 3);
        const lastTwo = localPart.substring(localPart.length - 2);
        const middlePart = localPart.substring(3, localPart.length - 2);
        return firstThree + '*'.repeat(middlePart.length) + lastTwo + domainPart;
    }
    
    // For short local parts, just show first character and last character
    if (localPart.length > 1) {
        return localPart.charAt(0) + '*'.repeat(localPart.length - 1) + domainPart;
    }
    
    return localPart + domainPart;
}

// Function to create and append a user list item to the user list
function createUserListItem(userData, userList) {
    const listItem = document.createElement('li');
    const encryptedName = encryptName(userData.name);
    const encryptedEmail = encryptEmail(userData.email);
    listItem.innerHTML = `
        <strong>Email:</strong> ${encryptedEmail} <br>
        <strong>Name:</strong> ${encryptedName} <br>
        <strong>Gender:</strong> ${userData.gender || 'N/A'} <br>
    `;
    userList.appendChild(listItem);
}

// Function to fetch and display user data (total users from Firestore)
async function fetchUserData() {
    const usersRef = collection(db, 'users');
    const totalUsersSnapshot = await getDocs(usersRef);
    const totalUsers = totalUsersSnapshot.size;

    let userList = document.getElementById('user-list');
    userList.innerHTML = '';

    document.getElementById('total-users').innerText = totalUsers;

    // Fetch recent users from Firestore
    fetchRecentUsers();
}

// Function to fetch and display recent users (from Firestore)
async function fetchRecentUsers() {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    const recentUsersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(10)
    );

    const recentUsersSnapshot = await getDocs(recentUsersQuery);

    recentUsersSnapshot.forEach((doc) => {
        const userData = doc.data();
        createUserListItem(userData, userList);
    });
}

// Function to fetch and display the online users (from Realtime Database)
async function fetchOnlineUsers() {
    const usersRef = ref(rtdb, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
        let onlineUsersCount = 0;
        snapshot.forEach(user => {
            if (user.val().online) {
                onlineUsersCount++;
            }
        });
        document.getElementById('online-users').innerText = onlineUsersCount;
    } else {
        document.getElementById('online-users').innerText = 0;
    }
}

// Listen for authentication state changes and enforce access control
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("You must be logged in to access this page.");
        window.location.href = "login.html";
        return;
    }
    
    const isSuperAdmin = await checkSuperAdmin(user.uid);
    if (!isSuperAdmin) {
        alert("Access Denied: You are not authorized to view this dashboard.");
        document.body.innerHTML = "<h1>Access Denied</h1><p>You are not allowed to view this page.</p>";
        return;
    }
});

// Call both functions when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchUserData();    // Get total users and recent users from Firestore
    fetchOnlineUsers(); // Get online users count from Realtime Database
});