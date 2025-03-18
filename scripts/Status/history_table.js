import { getDocs, query, collection, db, orderBy, deleteDoc, doc, setDoc } from "./firebase_config.js";

async function loadHistory() {
    const historySnapshot = await getDocs(
        query(
            collection(db, 'history'),
            orderBy('timestamp', 'desc')
        )
    );

    const historyTableBody = document.getElementById('historyTableBody');
    historyTableBody.innerHTML = '';

    historySnapshot.forEach((historyDoc) => {
        const data = historyDoc.data();
        const row = document.createElement('tr');

        // Apply background color based on adminAction
        if (data.adminAction === 'Deleted content') {
            row.classList.add('deleted-content');
        } else if (data.adminAction === 'Added content') {
            row.classList.add('added-content');
        } else if (data.adminAction === 'Edited content') {
            row.classList.add('edited-content');
        } else if (data.adminAction === 'Dismissed content') {
            row.classList.add('dismissed-content');
        }

        row.innerHTML = `
            <td>${data.timestamp.toDate().toLocaleString()}</td>
            <td>${data.addedBy}</td>
            <td>${data.documentId}</td>
            <td>${data.lesson_name ?? data.lesson_id ?? 'N/A'}</td>
            <td>${data.contentDetails}</td>
            <td>${data.action}</td>
            <td>${data.adminAction}</td>
            <td>
                <button class="delete-btn">
                    <i class="fas fa-trash-alt"></i> 
                </button>
            </td>
        `;

        // Move document to "deleted_history" and delete from "history"
        row.querySelector(".delete-btn").addEventListener("click", async () => {
            try {
                console.log("Moving document to deleted_history:", historyDoc.id);

                // Move document to "deleted_history"
                await setDoc(doc(db, "deleted_history", historyDoc.id), data);
                console.log("Document moved to deleted_history:", historyDoc.id);

                // Delete from "history"
                await deleteDoc(doc(db, "history", historyDoc.id));
                console.log("Document deleted from history:", historyDoc.id);

                // Remove row from table
                row.remove();
                console.log("Row removed from table:", historyDoc.id);

            } catch (error) {
                console.error("Error moving document to deleted_history:", error);
            }
        });

        historyTableBody.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", loadHistory);
export { loadHistory };
