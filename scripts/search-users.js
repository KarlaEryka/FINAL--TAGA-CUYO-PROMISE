// search-users.js
async function searchUsers(term) {
    const querySnapshot = await db.collection('users').get();
    const userList = document.getElementById('user-list');
    userList.innerHTML = ''; // Clear the list before displaying search results

    querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Check if the user's name or email includes the search term
        if (
            userData.firstname.toLowerCase().includes(term) || 
            userData.lastname.toLowerCase().includes(term) || 
            userData.email.toLowerCase().includes(term)
        ) {
            createUserListItem(userData, userList);
        }
    });
}

// Helper function to create user list items
function createUserListItem(userData, userList) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>Name:</strong> ${userData.firstName} ${userData.lastName} 
                    <strong>Email:</strong> ${userData.email} 
                    <strong>Gender:</strong> ${userData.gender}`;
    userList.appendChild(li);
}
