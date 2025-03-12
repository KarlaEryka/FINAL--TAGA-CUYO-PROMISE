import {getDocs,initializeApp,query,collection,db,orderBy,doc, getDoc } from "./firebase_config.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";
import  {approveEdit} from "./edit_content.js";
const storage = getStorage();

   let pendingContentCache = []; 

   async function getImageURL(imagePath) {
    if (!imagePath) return 'N/A'; // If no image, return "N/A"

    try {
        const imageRef = ref(storage, imagePath);
        const url = await getDownloadURL(imageRef);
        return `<img src="${url}" width="100" onclick="openModal('${url}')">`;
    } catch (error) {
        console.error("Error fetching image URL:", error);
        return 'N/A'; // Return "N/A" if fetching fails
    }
}

   async function loadPendingContent() {
    try {
        console.log("Loading pending content...");

        // Fetch lesson_activities & category_activities
        const lessonActivitiesSnapshot = await getDocs(query(collection(db, 'lesson_activities'), orderBy('timestamp', 'desc')));
        const categoryActivitiesSnapshot = await getDocs(query(collection(db, 'category_activities'), orderBy('timestamp', 'desc')));

        pendingContentCache = [];
        const tableBody = document.getElementById('pendingContentTableBody');
        tableBody.innerHTML = '';

        const dismissedContent = JSON.parse(localStorage.getItem('dismissedContent')) || [];

        // Combine both collections
        const allActivities = [
            ...lessonActivitiesSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data(), type: 'lesson' })),
            ...categoryActivitiesSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data(), type: 'category' }))
        ];

        for (const { id: docId, data, type } of allActivities) {
            if (dismissedContent.includes(docId) || data.isApprove) continue;

            // Determine name based on collection type
            let location_name = type === 'lesson' ? data.lesson_name || 'N/A' : data.subcategory_name || 'N/A';

            if (type === 'lesson' && data.lesson_id) {
                const lessonDocRef = doc(db, 'lessons', String(data.lesson_id)); // Convert to string
                const lessonDocSnapshot = await getDoc(lessonDocRef);
                if (lessonDocSnapshot.exists()) {
                    location_name = lessonDocSnapshot.data().lesson_name || 'N/A';
                }
            } else if (type === 'category' && data.subcategory_name) {
                const categoryDocRef = doc(db, 'categories', String(data.subcategory_name)); // Convert to string
                const categoryDocSnapshot = await getDoc(categoryDocRef);
                if (categoryDocSnapshot.exists()) {
                    location_name = data.subcategory_name || 'N/A';
                }
            }
            

            // Content details
            const contentDetails = `
                Word: ${data.word} <br>
                Translated: ${data.translated} <br>
                Options: ${data.options ? data.options.join(', ') : 'No options available'} <br>
            `;

            // Determine action buttons
            let actionButtons = `<button class="dismiss-btn" data-doc-id="${docId}" onclick="dismissContent('${docId}')">Dismiss</button>`;

            if (data.action.includes('Added')) {
                actionButtons = `
                    <button class="approve-btn" data-doc-id="${docId}" onclick="approveContent('${docId}', '${type}')">Add</button>
                    ${actionButtons}
                `;
            } else if (data.action.includes('Deleted')) {
                actionButtons = `
                    <button class="reject-btn" data-doc-id="${docId}" onclick="deleteContent('${docId}')">Delete</button>
                    ${actionButtons}
                `;
            } else if (data.action.includes('Edited')) {
                actionButtons = `
                    <button class="edit-btn" data-doc-id="${docId}" data-word-id="${data.wordId}" onclick="approveEdit('${docId}', '${data.wordId}')">Edit</button>
                    ${actionButtons}
                `;
            }

            // Format timestamp safely
            const formattedTimestamp = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'No timestamp';
            let imagePath = await getImageURL(data.image_path);

            

            const row = document.createElement('tr');
            row.setAttribute('data-doc-id', docId);
            row.innerHTML = `
                <td style="text-align: center;">${formattedTimestamp}</td>
                <td>${data.addedBy}</td>
                <td>${location_name}</td>
                <td>${contentDetails}</td>
                <td style="text-align: center;">${imagePath}</td>
                <td style="text-align: center;">${data.action || 'No action made'}</td>
                <td style="text-align: center;" class="status-pending">Pending</td>
                <td>${actionButtons}</td>
            `;
            
            tableBody.appendChild(row);
            pendingContentCache.push({ docId, data });
        }

        console.log("Pending content loaded successfully.");
    } catch (error) {
        console.error("Error loading pending content:", error);
    }
}


        function toggleTables() {
            const pendingTable = document.getElementById('pendingContentTable');
            const historyTable = document.getElementById('historyTable');
            const showPendingTableBtn = document.getElementById('showPendingTableBtn');
            const showHistoryTableBtn = document.getElementById('showHistoryTableBtn');

            // Ensure elements exist before adding event listeners
            if (!pendingTable || !historyTable || !showPendingTableBtn || !showHistoryTableBtn) {
                console.error("One or more elements not found.");
                return;
            }

            // Initially, show the Pending table and hide the History table
            pendingTable.style.display = 'table';
            historyTable.style.display = 'none';

            // Show Pending Table and hide History Table
            showPendingTableBtn.addEventListener('click', () => {
                pendingTable.style.display = 'table';  // Use 'table' instead of 'block'
                historyTable.style.display = 'none';
                showPendingTableBtn.classList.add('active');
                showHistoryTableBtn.classList.remove('active');
            });

            // Show History Table and hide Pending Table
            showHistoryTableBtn.addEventListener('click', () => {
                pendingTable.style.display = 'none';
                historyTable.style.display = 'table'; // Use 'table' instead of 'block'
                showHistoryTableBtn.classList.add('active');
                showPendingTableBtn.classList.remove('active');
            });
        }

        // Call the function when the DOM is fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Ensure the pending table is visible by default
            const pendingTable = document.getElementById('pendingContentTable');
            if (pendingTable) {
                pendingTable.style.display = 'table';
            }
        

            // Call the toggleTables function to set up the table toggle buttons
            toggleTables();

            // Load pending content when the page loads
            loadPendingContent();
        });

        export {loadPendingContent};