// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit,getDoc,doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { onAuthStateChanged } from "./dashboard.js";
// Import Firebase config
import { firebaseConfig } from "./firebase-config.js"; 

// ✅ Initialize Firebase App first
const app = initializeApp(firebaseConfig); 
const db = getFirestore(app); // Initialize Firestore
const auth = getAuth(app); // Initialize Auth

// Function to check if the user is a SuperAdmin
async function checkSuperAdmin(uid) {
    const adminRef = doc(db, 'admin', uid); // Get the specific admin document
    const adminSnap = await getDoc(adminRef);

    return adminSnap.exists() && adminSnap.data().role === "superadmin";
}

// Function to handle access control
async function enforceAccessControl(user) {
    if (!user) {
        alert("You must be logged in to access this page.");
        window.location.href = "login.html"; // Redirect to login
        return;
    }

    const isSuperAdmin = await checkSuperAdmin(user.uid);
    if (!isSuperAdmin) {
        alert("Access Denied: You are not authorized to view this dashboard.");
        document.body.innerHTML = "<h1>Access Denied</h1><p>You are not allowed to view this page.</p>";
        return;
    }
    }
// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    enforceAccessControl(user);
});

// Function to create and append a user list item to the user list
function createUserListItem(userData, userList) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <strong>Email:</strong> ${userData.email} <br>
        <strong>Name:</strong> ${userData.firstName} ${userData.lastName} <br>
        <strong>Gender:</strong> ${userData.gender || 'N/A'} <br>
    `;

    userList.appendChild(listItem);
}

// Function to fetch and display user data
async function fetchUserData() {
    const usersRef = collection(db, 'users');
    const totalUsersSnapshot = await getDocs(usersRef);
    const totalUsers = totalUsersSnapshot.size;

    let onlineUsersCount = 0;
    let userList = document.getElementById('user-list');
    userList.innerHTML = '';

    totalUsersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.status === "Online") {
            onlineUsersCount++;
        }
    });

    document.getElementById('total-users').innerText = totalUsers;
    document.getElementById('online-users').innerText = onlineUsersCount;

    fetchRecentUsers();
}

// Function to fetch and display recent users
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

document.addEventListener('DOMContentLoaded', fetchUserData);
