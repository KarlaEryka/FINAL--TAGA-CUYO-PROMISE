// loadData.js

import { db } from "./firebase-config.js";
import { getDocs, collection, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

window.loadHistory = async function() {
    const historySnapshot = await getDocs(query(collection(db, 'history'), orderBy('timestamp', 'desc')));

    const historyTableBody = document.getElementById('historyTableBody');
    historyTableBody.innerHTML = '';

    for (const historyDoc of historySnapshot.docs) {
        const data = historyDoc.data();
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${new Date(data.timestamp.toDate()).toLocaleString()}</td>
            <td>${data.addedBy}</td>
            <td>${data.documentId}</td>
            <td>${data.contentDetails}</td>
            <td>${data.adminAction}</td>
        `;

        historyTableBody.appendChild(row);
    }
};
