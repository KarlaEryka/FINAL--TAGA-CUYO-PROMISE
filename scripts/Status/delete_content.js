import { getFirestore, doc, getDoc, deleteDoc, updateDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { db } from "./firebase_config.js"; // Ensure firebase_config.js correctly exports `db`
window.deleteContent = async function (docId, type) {
    try {
        const collectionsToCheck = type === 'lesson' ? ['lesson_activities'] : ['category_activities'];
        let requestDocRef = null;
        let requestDocSnapshot = null;
        let collectionName = '';

        // Check each collection for the document
        for (const col of collectionsToCheck) {
            requestDocRef = doc(db, col, docId);
            requestDocSnapshot = await getDoc(requestDocRef);
            if (requestDocSnapshot.exists()) {
                collectionName = col;
                break;
            }
        }

        if (!requestDocSnapshot || !requestDocSnapshot.exists()) {
            console.error(`Request document not found in ${collectionsToCheck.join(' or ')}`);
            return;
        }

        const requestData = requestDocSnapshot.data();
        console.log("Request Data:", requestData); // Debugging

        if (!requestData.exactLocation) {
            console.error("Missing exact location of the word document.");
            return;
        }

        // Ensure valid Firestore document path
        const locationParts = requestData.exactLocation.split('/');
        console.log("Exact Location:", requestData.exactLocation); // Debugging
        console.log("Location Parts:", locationParts); // Debugging

        if (locationParts.length % 2 === 0) { // Valid Firestore document path should have an even number of segments
            const wordDocRef = doc(db, ...locationParts);
            await deleteDoc(wordDocRef);
            console.log("Deleted word document from:", requestData.exactLocation);
        } else {
            console.error("Invalid Firestore document path:", requestData.exactLocation);
            return;
        }

        // Mark request as approved
        await updateDoc(requestDocRef, {
            isApprove: true,
            adminAction: "Deleted content",
            timestamp: serverTimestamp()
        });

        console.log("Deleted request document and updated status.");

        // Log the deletion in history
        console.log("Firestore DB instance:", db); // Debugging
        const historyRef = collection(db, "history");
        await addDoc(historyRef, {
            action: `Deleted word from ${type === 'lesson' ? 'Lesson' : 'Category'}`,
            addedBy: requestData.addedBy,
            adminAction: "Deleted content",
            contentDetails: `Word: ${requestData.word} <br> Translated: ${requestData.translated} <br> Options: ${(requestData.options || []).join(", ")}`,
            documentId: docId,
            lesson_id: requestData.lesson_id || requestData.category_id || 'N/A',
            lesson_name: requestData.lesson_name || requestData.category_name || 'N/A',
            subcategory_name: requestData.subcategory_name || 'N/A',
            timestamp: serverTimestamp()
        });

        alert(`Content deleted successfully from ${type === 'lesson' ? 'Lesson' : 'Category'}!`);
    } catch (error) {
        console.error("Error deleting content:", error);
    }

    if (typeof loadPendingContent === "function") {
        loadPendingContent();
    } else {
        console.warn("loadPendingContent function is not defined.");
    }
};