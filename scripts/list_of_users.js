// Firebase configuration and initialization (keep this part the same)
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const rtdb = firebase.database();

// Authentication and user management functions (keep these the same)
auth.onAuthStateChanged((user) => {
    if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
            if (idTokenResult.claims.admin) {
                console.log("Admin access granted.");
                fetchUsers();
            } else {
                checkAdminAccount(user.uid);
            }
        }).catch((error) => {
            console.error("Error checking admin status: ", error);
        });
    } else {
        console.log("User is not authenticated");
        alert("You are not logged in.");
    }
});

function checkAdminAccount(uid) {
    const adminRef = db.collection("admin").doc(uid);
    adminRef.get().then((doc) => {
        if (doc.exists) {
            console.log("Admin account exists:", doc.data());
            fetchUsers();
        } else {
            console.error("Admin account does not exist.");
            alert("You do not have permission to view this data.");
        }
    }).catch((error) => {
        console.error("Error checking admin account: ", error);
        alert("Error checking admin account: " + error.message);
    });
}

function encryptEmail(email) {
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;
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
            userTableBody.innerHTML = "";

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const encryptedEmail = encryptEmail(userData.email || "N/A");
                let createdAt = "N/A";
                if (userData.createdAt instanceof firebase.firestore.Timestamp) {
                    createdAt = userData.createdAt.toDate().toLocaleDateString();
                }

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
                updateUserStatusRealtime(doc.id);
            });
        })
        .catch((error) => {
            console.error("Error fetching users: ", error);
            alert("Error fetching users: " + error.message);
        });
}

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
                statusElement.textContent = "Offline";
                statusElement.style.backgroundColor = "gray";
                statusElement.style.color = "white";
            }
        } else {
            statusElement.textContent = "Offline";
            statusElement.style.backgroundColor = "gray";
            statusElement.style.color = "white";
        }
    });
}

// Improved menu handling
document.addEventListener('DOMContentLoaded', function() {
    // Handle dropdown menus
    const dropdownToggles = document.querySelectorAll('.side-menu > li > a:has(+ .side-dropdown)');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            // Only prevent default for dropdown toggles
            if (this.nextElementSibling && this.nextElementSibling.classList.contains('side-dropdown')) {
                e.preventDefault();
                const dropdown = this.nextElementSibling;
                
                // Close other open dropdowns
                document.querySelectorAll('.side-dropdown').forEach(dd => {
                    if (dd !== dropdown) {
                        dd.classList.remove('show');
                        dd.closest('li').classList.remove('active');
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('show');
                this.closest('li').classList.toggle('active');
            }
            // Regular links will work normally
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.side-menu li')) {
            document.querySelectorAll('.side-dropdown').forEach(dropdown => {
                dropdown.classList.remove('show');
                dropdown.closest('li').classList.remove('active');
            });
        }
    });
});