import { 
    getDoc, 
    doc, 
    updateDoc, 
    serverTimestamp, 
    db, 
    addDoc, 
    collection 
} from "./firebase_config.js";
import { loadPendingContent } from "./approved.js";

export async function approveEdit(docId, exactLocation, addedBy) {
    try {
        console.log("approveEdit called with:", { docId, exactLocation, addedBy });

        // Validate exactLocation
        if (!exactLocation || typeof exactLocation !== "string") {
            console.error("Invalid exactLocation:", exactLocation);
            alert("Error: Invalid document path for approval.");
            return;
        }

        // Ensure the path has an even number of segments (Firestore document reference rule)
        const pathSegments = exactLocation.split("/");
        if (pathSegments.length % 2 !== 0) {
            console.error("Invalid Firestore document path:", exactLocation);
            alert("Error: Invalid document reference. Please check the document path.");
            return;
        }

        // Fetch the document from Firestore
        const activityDocRef = doc(db, exactLocation);
        const activityDocSnap = await getDoc(activityDocRef);

        if (!activityDocSnap.exists()) {
            console.error(`Document at path ${exactLocation} not found.`);
            alert("Error: Document not found for approval.");
            return;
        }

        const docData = activityDocSnap.data();
        console.log("Fetched document data:", docData);

        // Update the document to mark it as approved
        console.log("Updating document to approved...");
        await updateDoc(activityDocRef, {
            isApprove: true,  // Ensure field name matches Firestore schema
            adminAction: "Approved edit request",
            timestamp: serverTimestamp()
        });

        // Log the action in history collection
        console.log("Logging action in history...");
        const historyRef = collection(db, "history");
        await addDoc(historyRef, {
            action: "Edited word in Category",
            addedBy: addedBy,
            adminAction: "Approved edit",
            category_name: docData.category_name || "Unknown",
            subcategory_name: docData.subcategory_name || "Unknown",
            wordID: docId,
            oldWord: docData.oldWord || "N/A",
            updatedWord: docData.word || "N/A",
            translated: docData.translated || "N/A",
            image_path: docData.image_path || "",
            options: docData.options || [],
            timestamp: serverTimestamp()
        });

        alert("Edit request approved successfully!");
        console.log("Edit request approved successfully!");

        // Refresh the pending content list
        loadPendingContent();
    } catch (error) {
        console.error("Error approving edit request:", error);
        alert("An error occurred while approving the edit request. Check the console for details.");
    }
}

// Attach function to window for debugging/testing
window.approveEdit = approveEdit;
