// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqr7jav_7l0Y7gIhfTklJXnHPzjAYV8f4",
    authDomain: "taga-cuyo-app.firebaseapp.com",
    projectId: "taga-cuyo-app",
    storageBucket: "taga-cuyo-app.appspot.com",
    messagingSenderId: "908851804845",
    appId: "1:908851804845:web:dff839dc552a573a23a424",
    measurementId: "G-NVSY2HPNX4"
};

// Initialize Firebase (v8 style)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const rtdb = firebase.database(); // Initialize Realtime Database

// Check if the user is authenticated and their admin status
auth.onAuthStateChanged((user) => {
    if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
            if (idTokenResult.claims.admin) {
                console.log("Admin access granted.");
                fetchUsers(); // Fetch users directly if admin
            } else {
                checkAdminAccount(user.uid); // Check if the user has admin access
            }
        }).catch((error) => {
            console.error("Error checking admin status: ", error);
        });
    } else {
        console.log("User is not authenticated");
        alert("You are not logged in.");
    }
});

// Function to check if the admin account exists in the admin collection
function checkAdminAccount(uid) {
    const adminRef = db.collection("admin").doc(uid); // Reference to the specific admin document
    adminRef.get().then((doc) => {
        if (doc.exists) {
            console.log("Admin account exists:", doc.data());
            fetchUsers(); // Call fetchUsers if admin account exists
        } else {
            console.error("Admin account does not exist.");
            alert("You do not have permission to view this data.");
        }
    }).catch((error) => {
        console.error("Error checking admin account: ", error);
        alert("Error checking admin account: " + error.message);
    });
}

// Function to encrypt the email (show first 3 and last 2 characters before "@" and hide the rest)
function encryptEmail(email) {
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email; // If no "@" symbol is found, return the email as is
    const localPart = email.substring(0, atIndex);
    const domainPart = email.substring(atIndex);
    if (localPart.length > 5) {
        const firstThree = localPart.substring(0, 3);
        const lastTwo = localPart.substring(localPart.length - 2);
        const middlePart = localPart.substring(3, localPart.length - 2);
        const encryptedLocalPart = firstThree + '*'.repeat(middlePart.length) + lastTwo;
        return encryptedLocalPart + domainPart;
    }
    return email;
}

// Function to fetch users from Firestore and render their rows
function fetchUsers() {
    console.log("Fetching user data...");
    db.collection("users")
        .orderBy("createdAt", "desc")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                console.log("No user data found.");
                return;
            }
            const userTableBody = document.getElementById("user-table-body");
            userTableBody.innerHTML = ""; // Clear previous rows

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const encryptedEmail = encryptEmail(userData.email || "N/A");
                let createdAt = "N/A";
                if (userData.createdAt instanceof firebase.firestore.Timestamp) {
                    createdAt = userData.createdAt.toDate().toLocaleDateString();
                }

                // Create the table row with a placeholder for status
                let row = document.createElement("tr");
                row.id = `user-row-${doc.id}`;
                row.innerHTML = `  
                    <td>
                        <div class="user-details">
                            <p>${userData.name || "N/A"}</p>
                            <p class="email">${encryptedEmail}</p>
                        </div>
                    </td>
                    <td class="center">${createdAt}</td>
                    <td class="center">${userData.gender || "N/A"}</td>
                    <td class="center">${userData.age || "N/A"}</td>
                    <td class="center" id="status-${doc.id}">Loading...</td>
                `;
                userTableBody.appendChild(row);

                // Set the status by reading from the Realtime Database
                updateUserStatusRealtime(doc.id);
            });
        })
        .catch((error) => {
            console.error("Error fetching users: ", error);
            alert("Error fetching users: " + error.message);
        });
}

// Function to listen for realtime status updates for a specific user
function updateUserStatusRealtime(userId) {
    const statusElement = document.getElementById(`status-${userId}`);
    const userStatusRef = rtdb.ref(`users/${userId}`);

    userStatusRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (data.online) {
                statusElement.textContent = "Online";
                statusElement.style.backgroundColor = "rgb(19, 178, 101)";
                statusElement.style.color = "white";
            } else {
                // If offline, simply show "Offline"
                statusElement.textContent = "Offline";
                statusElement.style.backgroundColor = "gray";
                statusElement.style.color = "white";
            }
        } else {
            // Fallback if no data is found
            statusElement.textContent = "Offline";
            statusElement.style.backgroundColor = "gray";
            statusElement.style.color = "white";
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Toggle User Management dropdown
    const userManagementToggle = document.querySelector('.side-menu > li > a'); 
    const userManagementDropdown = document.querySelector('.side-dropdown');
    
    userManagementToggle.addEventListener('click', function (event) {
        event.preventDefault();
        userManagementDropdown.classList.toggle('show');
    });
});