import { doc, getDoc, deleteDoc, updateDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js";
import { db } from "./firebase_config.js"; // Ensure firebase_config.js correctly exports `db`

window.deleteContent = async function (docId, type) {
    try {
        const collectionName = type === 'lesson' ? 'lesson_activities' : 'category_activities';
        const requestDocRef = doc(db, collectionName, docId);
        const requestDocSnapshot = await getDoc(requestDocRef);

        if (!requestDocSnapshot.exists()) {
            console.error(`Request document not found in ${collectionName}`);
            return;
        }

        const requestData = requestDocSnapshot.data();

        if (!requestData.exactLocation) {
            console.error("Missing exact location of the word document.");
            return;
        }

        // Delete word document from Firestore
        const wordDocRef = doc(db, requestData.exactLocation);
        await deleteDoc(wordDocRef);
        console.log("Deleted word document from:", requestData.exactLocation);

        // Mark request as approved
        await updateDoc(requestDocRef, {
            isApprove: true,
            adminAction: "Deleted content",
            timestamp: serverTimestamp()
        });

        console.log("Deleted request document and updated status.");

        // Prepare history log
        let lessonOrCategoryId = requestData.lesson_id || requestData.category_id || 'N/A';
        let lessonOrCategoryName = requestData.lesson_name || requestData.category_name || 'N/A';
        let subcategoryName = requestData.subcategory_name || 'N/A';

        // Log the deletion in the history collection
        const historyRef = collection(db, "history");
        await addDoc(historyRef, {
            action: `Deleted word from ${type === 'lesson' ? 'Lesson' : 'Category'}`,
            addedBy: requestData.addedBy,
            adminAction: "Deleted content",
            contentDetails: `Word: ${requestData.word} <br> Translated: ${requestData.translated} <br> Options: ${(requestData.options || []).join(", ")}`,
            documentId: docId,
            lesson_id: lessonOrCategoryId,
            lesson_name: lessonOrCategoryName,
            subcategory_name: subcategoryName,
            timestamp: serverTimestamp()
        });

        alert(`Content deleted successfully from ${type === 'lesson' ? 'Lesson' : 'Category'}!`);
    } catch (error) {
        console.error("Error deleting content:", error);
    }

    // Ensure `loadPendingContent` exists before calling
    if (typeof loadPendingContent === "function") {
        loadPendingContent();
    } else {
        console.warn("loadPendingContent function is not defined.");
    }
};
