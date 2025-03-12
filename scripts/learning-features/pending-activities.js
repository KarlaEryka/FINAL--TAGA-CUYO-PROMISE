
// Function to fetch pending activities
async function fetchPendingActivities() {
  const tableBody = document.getElementById("pendingTableBody");
  tableBody.innerHTML = ""; // Clear table before fetching data

  const q = query(collection(db, "activities"), where("isApprove", "==", false));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.lesson_name}</td>
      <td>${data.word}</td>
      <td>${data.addedBy}</td>
      <td>${new Date(data.timestamp).toLocaleString()}</td>
      <td>
        <button class="approve-btn" data-id="${docSnap.id}">Approve</button>
        <button class="dismiss-btn" data-id="${docSnap.id}">Dismiss</button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  addEventListeners();
}

// Function to handle Approve and Dismiss actions
function addEventListeners() {
  document.querySelectorAll(".approve-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const docId = event.target.getAttribute("data-id");
      await updateDoc(doc(db, "activities", docId), { isApprove: true });
      fetchPendingActivities(); // Refresh table
    });
  });

  document.querySelectorAll(".dismiss-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const docId = event.target.getAttribute("data-id");
      await deleteDoc(doc(db, "activities", docId));
      fetchPendingActivities(); // Refresh table
    });
  });
}

// Load pending activities on page load
fetchPendingActivities();