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

// Function to create and append a user list item to the user list
function createUserListItem(userData, userList) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <strong>Email:</strong> ${userData.email} <br>
        <strong>Name:</strong> ${userData.name} <br>
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
