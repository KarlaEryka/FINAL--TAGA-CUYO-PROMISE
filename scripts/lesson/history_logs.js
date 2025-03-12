import { db } from './firebase_config.js';
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

async function loadHistory() {
    const historySnapshot = await getDocs(
        query(
            collection(db, 'history'),
            orderBy('timestamp', 'desc')
        )
    );

    const historyTableBody = document.getElementById('historyTableBody');
    historyTableBody.innerHTML = '';

    for (const historyDoc of historySnapshot.docs) {
        const data = historyDoc.data();
        const row = document.createElement('tr');

        // Apply background color based on adminAction
        if (data.adminAction === 'Deleted content') {
            row.style.backgroundColor = 'red'; // For deleted content
        } else if (data.adminAction === 'Approved content') {
            row.style.backgroundColor = 'green'; // For approved content
        } else if (data.adminAction === 'Edited content') {
            row.style.backgroundColor = 'green'; // For edited content
        } else if (data.adminAction === 'Dismissed content') {
            row.style.backgroundColor = 'gray'; // For dismissed content
        }

        row.innerHTML = `
            <td>${data.timestamp.toDate().toLocaleString()}</td>
            <td>${data.addedBy}</td>
            <td>${data.documentId}</td>
            <td>${data.lessonId}</td>
            <td>${data.contentDetails}</td>
            <td>${data.action}</td>
            <td>${data.adminAction}</td>
        `;
        historyTableBody.appendChild(row);
    }
}

export { loadHistory };
