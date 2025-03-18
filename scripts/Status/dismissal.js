import { getDoc, doc, collection, addDoc, updateDoc, query, where, getDocs, db } from "./firebase_config.js";
import { loadHistory } from "./history_table.js";

window.dismissContent = async function (docId) {
    console.log("🔹 Starting dismissal process...");

    if (!docId) {
        console.error("❌ Error: docId is missing!");
        alert("Error: docId is missing!");
        return;
    }

    // Define possible collections
    const collections = ['category_activities', 'lesson_activities'];
    let docRef, docSnapshot, collectionName, searchCriteria;

    // Search for the document in category_activities or lesson_activities
    for (let col of collections) {
        const ref = doc(db, col, docId);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
            docRef = ref;
            docSnapshot = snapshot;
            collectionName = col;
            searchCriteria = snapshot.data(); // Store document data to use for searching in `activities`
            break;
        }
    }

    if (!docSnapshot) {
        console.error(`❌ No document found in category_activities or lesson_activities for docId: ${docId}`);
        alert("Error: No such document found.");
        return;
    }

    // Extract key data for searching in activities
    const { word, translated, addedBy } = searchCriteria;

    const activitiesQuery = query(
        collection(db, 'activities'),
        where("word", "==", word?.trim()),  // Remove `toLowerCase()`
        where("translated", "==", translated?.trim()), 
        where("addedBy", "==", addedBy?.trim())
    );
    
    
    const activitiesSnapshot = await getDocs(activitiesQuery);
    let activitiesDocRef, activitiesDocData;

    if (!activitiesSnapshot.empty) {
        activitiesSnapshot.forEach((doc) => {
            activitiesDocRef = doc.ref;
            activitiesDocData = doc.data();
        });
    }

    if (!activitiesDocRef) {
        console.error(`❌ No matching document found in activities for word: ${word}, translated: ${translated}, addedBy: ${addedBy}`);
        alert("Error: No matching activity found.");
        return;
    }

    try {
        console.log(`🔄 Updating Firestore: Marking ${docId} and matching activity as dismissed...`);

        // Update in activities collection
        await updateDoc(activitiesDocRef, {
            isApprove: false,
            dismissed: true,
            admin_action: 'Dismissed'
        });

        console.log("✅ Updated activities collection.");

        // Update in category_activities or lesson_activities
        await updateDoc(docRef, {
            isApprove: false,
            dismissed: true,
            admin_action: 'Dismissed'
        });

        console.log(`✅ Updated ${collectionName} collection as well.`);

        alert('Content dismissed.');

        // **Store dismissed content in localStorage**
        let dismissedContent = JSON.parse(localStorage.getItem('dismissedContent')) || [];
        dismissedContent.push(docId);
        localStorage.setItem('dismissedContent', JSON.stringify(dismissedContent));

        // **Remove the row from the pending content table**
        const row = document.querySelector(`tr[data-doc-id="${docId}"]`);
        if (row) {
            console.log("🗑️ Removing row from table...");
            row.remove();
        } else {
            console.warn("⚠️ Row not found in table. Please refresh.");
        }

            console.log("📝 Adding dismissal action to history...");
            await addDoc(collection(db, 'history'), {
                action: activitiesDocData.action,
                addedBy: activitiesDocData.addedBy || 'Unknown',
                lesson_id: activitiesDocData.location === 'lessons' 
                    ? activitiesDocData.lesson_id || activitiesDocData.lesson_name || 'N/A'  // Take lesson_id first, then lesson_name
                    : activitiesDocData.location === 'category' 
                        ? activitiesDocData.category_name || activitiesDocData.category_id || 'N/A' // Take category_name first, then category_id
                        : 'N/A', // Default case if neither lessons nor category
                documentId: activitiesDocRef.id, // Store the correct activity document ID
                contentDetails: `Word: ${activitiesDocData.word || 'N/A'} <br> 
                                Translated: ${activitiesDocData.translated || 'N/A'} <br> 
                                Options: ${activitiesDocData.options ? activitiesDocData.options.join(', ') : 'No options available'}`,
                adminAction: 'Dismissed content',
                timestamp: new Date(),
            });

        console.log("✅ History log updated successfully.");
        
        // Reload history table (if applicable)
        if (typeof loadHistory === "function") {
            loadHistory();
        }
    } catch (error) {
        console.error("🔥 Error dismissing content:", error);
        alert("Error dismissing content. Check console for details.");
    }
};
 