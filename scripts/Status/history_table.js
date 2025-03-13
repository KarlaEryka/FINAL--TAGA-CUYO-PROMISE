import {getDocs,initializeApp,query,collection,db,orderBy } from "./firebase_config.js";

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
        `;
        historyTableBody.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", loadHistory);
export {loadHistory};