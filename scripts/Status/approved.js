import { getDocs, getDoc, query, doc, collection, addDoc, updateDoc, serverTimestamp, where, db, } from "./firebase_config.js";
import { loadPendingContent } from "./pending_table.js";

async function findLessonById(lessonId) {
    const lessonsRef = collection(db, "lessons");
    const q = query(lessonsRef, where("lesson_id", "==", lessonId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0]; // Return the first matching lesson
    }
    return null; // No matching lesson found
}

async function getSubcategoryId(categoryId, subcategoryName) {
    const subcategoriesRef = collection(db, `categories/${categoryId}/subcategories`);
    const q = query(subcategoriesRef, where("subcategory_name", "==", subcategoryName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id; // Get the subcategory document ID
    } else {
        console.error(`Subcategory '${subcategoryName}' not found.`);
        return null;
    }
}
async function findActivityDocByContent(activityData) {
    try {
        // Query the "activities" collection using shared fields (e.g., word, translated, and lesson_id/category_id)
        const activitiesRef = collection(db, "activities");
        let q;

        if (activityData.lesson_id) {
            // For lesson activities
            q = query(
                activitiesRef,
                where("word", "==", activityData.word),
                where("translated", "==", activityData.translated),
                where("lesson_id", "==", activityData.lesson_id)
            );
        } else if (activityData.category_id) {
            // For category activities
            q = query(
                activitiesRef,
                where("word", "==", activityData.word),
                where("translated", "==", activityData.translated),
                where("category_id", "==", activityData.category_id)
            );
        } else {
            console.error("Invalid activity data: missing lesson_id or category_id.");
            return null;
        }

        const querySnapshot = await getDocs(q);

        console.log("Querying activities collection for:", activityData);
        console.log("Query result:", querySnapshot.docs);

        if (!querySnapshot.empty) {
            const activityDocId = querySnapshot.docs[0].id;
            console.log("Found matching document in activities collection:", activityDocId);
            return activityDocId; // Return the correct document ID
        } else {
            console.error("No matching document found in activities collection.");
            return null;
        }
    } catch (error) {
        console.error("Error finding activity document by content:", error);
        return null;
    }
}

async function approveActivity(docId, activityData) {
    try {
        // Find the correct document ID in the "activities" collection using shared fields
        const activityDocId = await findActivityDocByContent(activityData);

        if (!activityDocId) {
            console.error("No matching document found in activities collection. Creating a new one...");

            // Create a new document in the "activities" collection
            const activitiesRef = collection(db, "activities");
            const newActivityDocRef = await addDoc(activitiesRef, {
                word: activityData.word,
                translated: activityData.translated,
                options: activityData.options || [],
                addedBy: activityData.addedBy,
                timestamp: serverTimestamp(),
                isApprove: true, // Mark as approved
                adminAction: "Approved Content",
                lesson_id: activityData.lesson_id || null, // Include lesson_id if available
                lesson_name: activityData.lesson_name || null, // Include lesson_name if available
                category_id: activityData.category_id || null, // Include category_id if available
                category_name: activityData.category_name || null, // Include category_name if available
                subcategory_name: activityData.subcategory_name || null // Include subcategory_name if available
            });

            console.log("New activity document created in activities collection:", newActivityDocRef.id);
            return;
        }

        // Reference to the correct document in "activities"
        const activityDocRef = doc(db, "activities", activityDocId);

        // Update the activity document
        await updateDoc(activityDocRef, {
            isApprove: true,
            adminAction: "Approved Content",
            timestamp: serverTimestamp()
        });

        console.log("Activity approved successfully in activities collection!");
    } catch (error) {
        console.error("Error approving activity in activities collection:", error);
    }
}
window.approveContent = async function (docId, type) {
    try {
        let wordsCollectionRef, lessonDocRef, actionDetails;

        // Fetch the activity document from the appropriate collection
        const collectionName = type === 'lesson' ? 'lesson_activities' : 'category_activities';
        const activityDocRef = doc(db, collectionName, docId);
        const activityDocSnapshot = await getDoc(activityDocRef);

        if (!activityDocSnapshot.exists()) {
            console.error("Activity document not found.");
            return;
        }

        const activityData = activityDocSnapshot.data();

        if (!activityData.word || !activityData.translated) {
            console.error("Missing required fields: 'word' or 'translated'.", activityData);
            return;
        }

        if (type === 'lesson') {
            if (!activityData.lesson_id || !activityData.lesson_name) {
                console.error("Missing lesson_id or lesson_name.");
                return;
            }

            // Find the lesson document using lesson_id
            const lessonDocSnapshot = await findLessonById(activityData.lesson_id);

            if (!lessonDocSnapshot) {
                console.error(`Lesson with ID ${activityData.lesson_id} not found.`);
                return;
            }

            lessonDocRef = doc(db, "lessons", lessonDocSnapshot.id); // Get the actual document ID
            wordsCollectionRef = collection(lessonDocRef, "words");
            actionDetails = `Added a content in ${activityData.lesson_name}`;

        } else if (type === 'category') {
            const categoryId = activityData.category_id; // Use the correct category document ID
            const subcategoryId = await getSubcategoryId(categoryId, activityData.subcategory_name);
            
            if (!subcategoryId) {
                console.error("Subcategory not found.");
                return;
            }
            
            wordsCollectionRef = collection(db, `categories/${categoryId}/subcategories/${subcategoryId}/words`);
            actionDetails = `Added a content in ${activityData.category_name} / ${activityData.subcategory_name}`;
        } else {
            console.error("Invalid document structure:", activityData);
            return;
        }

        // Prepare word data
        const wordData = {
            word: activityData.word,
            translated: activityData.translated,
            options: activityData.options || [],
            timestamp: serverTimestamp(),
            addedBy: activityData.addedBy
        };

        if (activityData.image_path) {
            wordData.image_path = activityData.image_path;
        }

        // Add the new word to the words subcollection
        await addDoc(wordsCollectionRef, wordData);

        // Mark the activity as approved in the original collection (lesson_activities or category_activities)
        await updateDoc(activityDocRef, {
            isApprove: true,
            adminAction: "Approved Content",
            timestamp: serverTimestamp()
        });

        // Update the corresponding document in the "activities" collection
        await approveActivity(docId, activityData);

        // Log the approval action in the history collection
        const historyRef = collection(db, "history");
        await addDoc(historyRef, {
            action: actionDetails,
            addedBy: activityData.addedBy,
            adminAction: "Added content",
            contentDetails: `Word: ${activityData.word} <br> Translated: ${activityData.translated} <br> Options: ${activityData.options.join(", ")}`,
            documentId: docId,
            lesson_name: activityData.lesson_name || activityData.category_name,
            timestamp: serverTimestamp()
        });

        alert("Content approved successfully!");
        console.log("Content approved and added successfully!");
    } catch (error) {
        console.error("Error approving content:", error);
    }
    loadPendingContent();
};

export{approveActivity,findLessonById,findActivityDocByContent,getSubcategoryId,loadPendingContent};