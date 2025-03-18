import { getDocs, initializeApp, query, where, collection, db, setDoc, orderBy, doc, getDoc, deleteDoc, updateDoc, addDoc, serverTimestamp } from "./firebase_config.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";
import { approveEdit,approveCategoryEdit } from "./edit_content.js";
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

        const lessonActivitiesSnapshot = await getDocs(query(collection(db, 'lesson_activities'), orderBy('timestamp', 'desc')));
        const categoryActivitiesSnapshot = await getDocs(query(collection(db, 'category_activities'), orderBy('timestamp', 'desc')));

        pendingContentCache = [];
        const tableBody = document.getElementById('pendingContentTableBody');
        tableBody.innerHTML = '';

        const dismissedContent = JSON.parse(localStorage.getItem('dismissedContent')) || [];

        const allActivities = [
            ...lessonActivitiesSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data(), type: 'lesson' })),
            ...categoryActivitiesSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data(), type: 'category' }))
        ];

        for (const { id: docId, data, type } of allActivities) {
            if (dismissedContent.includes(docId) || data.isApprove) continue;

            let location_name = type === 'lesson' ? data.lesson_name || 'N/A' : data.subcategory_name || 'N/A';

            // Fetch additional details if needed
            if (type === 'lesson' && data.lesson_id && typeof data.lesson_id === 'string') {
                console.log("Fetching lesson details for:", data.lesson_id);
                const lessonDocRef = doc(db, 'lessons', data.lesson_id);
                const lessonDocSnapshot = await getDoc(lessonDocRef);
                if (lessonDocSnapshot.exists()) {
                    location_name = lessonDocSnapshot.data().lesson_name || 'N/A';
                }
            } else if (type === 'category' && data.subcategory_name && typeof data.subcategory_name === 'string') {
                console.log("Fetching category details for:", data.subcategory_name);
                const categoryDocRef = doc(db, 'categories', data.subcategory_name);
                const categoryDocSnapshot = await getDoc(categoryDocRef);
                if (categoryDocSnapshot.exists()) {
                    location_name = data.subcategory_name || 'N/A';
                }
            }

            const contentDetails = `
                Word: ${data.word} <br>
                Translated: ${data.translated} <br>
                Options: ${data.options ? data.options.join(', ') : 'No options available'} <br>
            `;

            let actionButtons = `<button class="dismiss-btn" data-doc-id="${docId}" onclick="dismissContent('${docId}')">Dismiss</button>`;

            if (typeof data.action === 'string') {
                if (data.action.includes('Added')) {
                    actionButtons = `
                        <button class="approve-btn" data-doc-id="${docId}" onclick="approveContent('${docId}', '${type}')">Add</button>
                        ${actionButtons}
                    `;
                } else if (data.action.includes('Deleted')) {
                    actionButtons = `
                    <button class="reject-btn" data-doc-id="${docId}" 
                        onclick="${type === 'lesson' ? 'deleteLessonContent' : 'deleteCategoryContent'}('${docId}')">
                        Delete
                    </button>
                    ${actionButtons}
                    `; //ANGEL MAE GABAYAN --- from actionButtons = ' to pababa
                    
                } else if (data.action.includes('Edited') && data.wordId) {
                    if (data.location === "lesson") {
                        actionButtons = `
                            <button class="edit-btn" data-doc-id="${docId}" data-word-id="${data.wordId}" data-location="${data.location}" 
                                onclick="approveEdit('${docId}', '${data.wordId}', '${data.location}')">Edit</button>
                            ${actionButtons}
                        `;
                    } else if (data.action.includes('Edited') && data.wordId && data.location === "category") {
                        actionButtons = `
                            <button class="edit-btn" data-doc-id="${docId}" data-word-id="${data.wordId}" data-location="${data.location}"
                                onclick="approveCategoryEdit('${docId}', '${data.wordId}', '${data.categoryId}', '${data.subcategoryId}')">Edit</button>
                            ${actionButtons}
                        `;
                    }
                }
            }
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
// LESSON DELETION
window.deleteLessonContent = async function (docId) {
    // Confirmation dialog
    const isConfirmed = confirm("Are you sure you want to delete this content?");
    if (!isConfirmed) {
        console.log("❌ Deletion canceled by user.");
        return;
    }

    try {
        console.log(`🔍 Attempting to delete lesson content (ID: ${docId})`);

        const requestDocRef = doc(db, "lesson_activities", docId);
        const requestDocSnapshot = await getDoc(requestDocRef);

        if (!requestDocSnapshot.exists()) {
            console.error(`❌ Request document (${docId}) not found in lesson_activities`);
            return;
        }

        const requestData = requestDocSnapshot.data();
        console.log("📌 requestData:", requestData);

        if (!requestData.exactLocation || typeof requestData.exactLocation !== "string") {
            console.error("❌ Error: `exactLocation` is missing or not a string:", requestData.exactLocation);
            return;
        }

        let cleanPath = requestData.exactLocation.trim().replace(/\s/g, "").replace(/^\/+|\/+$/g, "");
        console.log("📌 Cleaned Exact Location:", cleanPath);

        const pathSegments = cleanPath.split("/");
        if (pathSegments.length !== 4 || pathSegments[0] !== "lessons" || pathSegments[2] !== "words") {
            console.error("❌ Invalid `exactLocation` format:", cleanPath);
            return;
        }

        const [collectionType, parentId, , wordId] = pathSegments;
        const wordDocRef = doc(db, collectionType, parentId, "words", wordId);

        const wordDocSnapshot = await getDoc(wordDocRef);
        if (wordDocSnapshot.exists()) {
            await deleteDoc(wordDocRef);
            console.log(`✅ Deleted word document from lessons:`, cleanPath);
        } else {
            console.warn("⚠️ Warning: Document already deleted or not found:", cleanPath);
        }

        // **🔹 Update `lesson_activities` Collection**
        try {
            await updateDoc(requestDocRef, {
                isApprove: true,
                adminAction: "Deleted content",
                delete: true,
                timestamp: serverTimestamp()
            });
            console.log("✅ Successfully updated `lesson_activities` collection.");
        } catch (updateError) {
            console.error("❌ Error updating `lesson_activities`:", updateError);
        }

        // **🔹 Log the approval action in the history collection**
        try {
            const historyRef = collection(db, "history");
            await addDoc(historyRef, {
                action: "Content Deletion",
                addedBy: requestData.addedBy, // Assuming `addedBy` is available in `requestData`
                adminAction: "Deleted content",
                contentDetails: `Word: ${requestData.word} <br> Translated: ${requestData.translated} <br> Options: ${requestData.options.join(", ")}`,
                documentId: docId,
                lesson_name: requestData.lesson_name, // Assuming `lesson_name` is available in `requestData`
                timestamp: serverTimestamp()
            });
            console.log("✅ Successfully logged deletion in history collection.");
        } catch (historyError) {
            console.error("❌ Error logging deletion in history collection:", historyError);
        }

        // **🔹 Update `activities` Collection**
        try {
            const activitiesQuery = query(collection(db, "activities"), where("exactLocation", "==", requestData.exactLocation));
            const activitiesSnapshot = await getDocs(activitiesQuery);

            if (!activitiesSnapshot.empty) {
                const activitiesDocRef = activitiesSnapshot.docs[0].ref;
                await updateDoc(activitiesDocRef, { delete: true });
                console.log("✅ Successfully updated `delete` field in activities collection.");
            } else {
                console.warn("⚠️ No matching document found in `activities` collection for exactLocation:", requestData.exactLocation);
            }
        } catch (updateActivitiesError) {
            console.error("❌ Error updating `activities` collection:", updateActivitiesError);
        }

        alert(`✅ Content deleted successfully from Lesson!`);
    } catch (error) {
        console.error("❌ Error deleting lesson content:", error);
    }

    if (typeof loadPendingContent === "function") {
        loadPendingContent();
    } else {
        console.warn("⚠️ loadPendingContent function is not defined.");
    }
};


// CATEGORY DELETION
window.deleteCategoryContent = async function (docId) {
    // Confirmation dialog
    const isConfirmed = confirm("Are you sure you want to delete this content?");
    if (!isConfirmed) {
        console.log("❌ Deletion canceled by user.");
        return;
    }

    try {
        console.log(`🔍 Attempting to delete category content (ID: ${docId})`);

        const requestDocRef = doc(db, "category_activities", docId);
        const requestDocSnapshot = await getDoc(requestDocRef);

        if (!requestDocSnapshot.exists()) {
            console.error(`❌ Request document (${docId}) not found in category_activities`);
            return;
        }

        const requestData = requestDocSnapshot.data();
        console.log("📌 requestData:", requestData);

        if (!requestData.exactLocation || typeof requestData.exactLocation !== "string") {
            console.error("❌ Error: `exactLocation` is missing or not a string:", requestData.exactLocation);
            return;
        }

        let cleanPath = requestData.exactLocation.trim().replace(/\s/g, "").replace(/^\/+|\/+$/g, "");
        console.log("📌 Cleaned Exact Location:", cleanPath);

        const pathSegments = cleanPath.split("/");
        if (pathSegments.length !== 6 || pathSegments[0] !== "categories" || pathSegments[2] !== "subcategories" || pathSegments[4] !== "words") {
            console.error("❌ Invalid `exactLocation` format:", cleanPath);
            return;
        }

        const [collectionType, categoryId, , subcategoryId, , wordId] = pathSegments;
        const wordDocRef = doc(db, collectionType, categoryId, "subcategories", subcategoryId, "words", wordId);

        const wordDocSnapshot = await getDoc(wordDocRef);
        if (wordDocSnapshot.exists()) {
            await deleteDoc(wordDocRef);
            console.log(`✅ Deleted word document from category:`, cleanPath);
        } else {
            console.warn("⚠️ Warning: Document already deleted or not found:", cleanPath);
        }

        // **🔹 Update `category_activities` Collection**
        try {
            await updateDoc(requestDocRef, {
                isApprove: true,
                adminAction: "Deleted content",
                delete: true,
                timestamp: serverTimestamp()
            });
            console.log("✅ Successfully updated `category_activities` collection.");
        } catch (updateError) {
            console.error("❌ Error updating `category_activities`:", updateError);
        }

        // **🔹 Log the approval action in the history collection**
        try {
            const historyRef = collection(db, "history");
            await addDoc(historyRef, {
                action: "Content Deletion",
                addedBy: requestData.addedBy, // Assuming `addedBy` is available in `requestData`
                adminAction: "Deleted content",
                contentDetails: `Word: ${requestData.word} <br> Translated: ${requestData.translated} <br> Options: ${requestData.options.join(", ")}`,
                documentId: docId,
                lesson_name: requestData.category_name, // Assuming `category_name` is available in `requestData`
                timestamp: serverTimestamp()
            });
            console.log("✅ Successfully logged deletion in history collection.");
        } catch (historyError) {
            console.error("❌ Error logging deletion in history collection:", historyError);
        }

        // **🔹 Update `activities` Collection (Set `delete: true`)**
        try {
            const activitiesQuery = query(collection(db, "activities"), where("exactLocation", "==", requestData.exactLocation));
            const activitiesSnapshot = await getDocs(activitiesQuery);

            if (!activitiesSnapshot.empty) {
                const activitiesDocRef = activitiesSnapshot.docs[0].ref;
                await updateDoc(activitiesDocRef, { delete: true });
                console.log("✅ Successfully updated `delete` field in activities collection.");
            } else {
                console.warn("⚠️ No matching document found in `activities` collection for exactLocation:", requestData.exactLocation);
            }
        } catch (updateActivitiesError) {
            console.error("❌ Error updating `activities` collection:", updateActivitiesError);
        }

        alert(`✅ Content deleted successfully from Category!`);
    } catch (error) {
        console.error("❌ Error deleting category content:", error);
    }

    if (typeof loadPendingContent === "function") {
        loadPendingContent();
    } else {
        console.warn("⚠️ loadPendingContent function is not defined.");
    }
};







function toggleTables() {
    const pendingTable = document.getElementById('pendingContentTable');
    const historyTable = document.getElementById('historyTable');
    const showPendingTableBtn = document.getElementById('showPendingTableBtn');
    const showHistoryTableBtn = document.getElementById('showHistoryTableBtn');

    if (!pendingTable || !historyTable || !showPendingTableBtn || !showHistoryTableBtn) {
        console.error("One or more elements not found.");
        return;
    }

    pendingTable.style.display = 'table';
    historyTable.style.display = 'none';

    showPendingTableBtn.addEventListener('click', () => {
        pendingTable.style.display = 'table';
        historyTable.style.display = 'none';
        showPendingTableBtn.classList.add('active');
        showHistoryTableBtn.classList.remove('active');
    });

    showHistoryTableBtn.addEventListener('click', () => {
        pendingTable.style.display = 'none';
        historyTable.style.display = 'table';
        showHistoryTableBtn.classList.add('active');
        showPendingTableBtn.classList.remove('active');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const pendingTable = document.getElementById('pendingContentTable');
    if (pendingTable) {
        pendingTable.style.display = 'table';
    }

    toggleTables();
    loadPendingContent();
});

export { loadPendingContent };
