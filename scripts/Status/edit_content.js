import { getDoc, doc, updateDoc, serverTimestamp, db, addDoc, collection, getDocs, query, where } from "./firebase_config.js";
import { loadPendingContent } from "./pending_table.js";
window.approveEdit = approveEdit;
window.approveCategoryEdit = approveCategoryEdit;

async function approveEdit(activityId, wordId, location) {
    try {
        console.log("✅ approveEdit called with:", { activityId, wordId, location });

        // 🔥 Step 1: Fetch the activity document from 'lesson_activities'
        const activityRef = doc(db, "lesson_activities", String(activityId));
        const activitySnap = await getDoc(activityRef);

        if (!activitySnap.exists()) {
            console.error("❌ Activity document not found:", activityId);
            alert("Error: Activity document not found.");
            return;
        }

        const activityData = activitySnap.data();
        console.log("📌 Activity Data:", activityData);

        // 🔥 Step 2: Ensure `lessonId` is correct
        let lessonId = activityData.lesson_id;
        if (!lessonId || typeof lessonId !== "string") {
            console.warn("⚠️ Invalid or missing lesson_id. Searching Firestore for lesson_name:", activityData.lesson_name);
            
            const lessonQuery = query(collection(db, "lessons"), where("lesson_name", "==", activityData.lesson_name));
            const lessonSnapshot = await getDocs(lessonQuery);

            if (lessonSnapshot.empty) {
                console.error("❌ No matching lesson found for:", activityData.lesson_name);
                alert("Error: No matching lesson found.");
                return;
            }

            lessonId = lessonSnapshot.docs[0].id;
            console.log("✅ Found correct lesson ID:", lessonId);
        }

        // 🔥 Step 3: Determine Correct `exactLocation`
        if (!location || location === "lesson") {
            location = activityData.exactLocation; // Fetch from activity document
            console.log("✅ Using exactLocation from activity document:", location);
        }

        if (!location || typeof location !== "string") {
            console.error("❌ Invalid or missing location:", location);
            alert("Error: Invalid document location.");
            return;
        }

        // 🔥 Step 4: Search and update documents in `activities`
        console.log("🔍 Searching for documents in 'activities' where exactLocation =", location);
        const activitiesQuery = query(
            collection(db, "activities"),
            where("exactLocation", "==", location) // Must match the stored format
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);

        if (activitiesSnapshot.empty) {
            console.warn("⚠️ No matching document found in 'activities' for:", location);
        } else {
            // ✅ Update all matching documents in 'activities'
            const updatePromises = activitiesSnapshot.docs.map((docSnap) => {
                console.log(`📝 Updating document: ${docSnap.id} in 'activities'`);
                return updateDoc(docSnap.ref, {
                    isApprove: true,
                    adminAction: "Approved edit request",
                    timestamp: serverTimestamp()
                });
            });

            await Promise.all(updatePromises);
            console.log(`✅ Updated ${activitiesSnapshot.size} document(s) in 'activities'`);
        }

        // 🔥 Step 5: Ensure `wordId` is valid
        if (!wordId || typeof wordId !== "string") {
            console.error("❌ Invalid wordId:", wordId);
            alert("Error: Invalid word ID.");
            return;
        }

        // 🔥 Step 6: Ensure word document exists inside the correct lesson
        const wordRef = doc(db, "lessons", lessonId, "words", wordId);
        const wordSnap = await getDoc(wordRef);

        if (!wordSnap.exists()) {
            console.error("❌ Word document NOT found:", wordRef.path);
            alert(`Error: The word document does not exist at ${wordRef.path}`);
            return;
        }

        // 🔥 Step 7: Update the word document
        await updateDoc(wordRef, {
            word: activityData.word,
            translated: activityData.translated,
            options: activityData.options,
            isApprove: true,
            adminAction: "Approved edit request",
            timestamp: serverTimestamp()
        });

        console.log("✅ Word document updated successfully:", wordRef.path);
        // **🔹 Log the approval action in the history collection**
        try {
            const historyRef = collection(db, "history");
        await addDoc(historyRef, {
            action: "Content Edit",
            addedBy: activityData.addedBy, // Corrected variable
            adminAction: "Edited content",
            contentDetails: `Word: ${activityData.word} <br> Translated: ${activityData.translated} <br> Options: ${activityData.options.join(", ")}`,
            documentId: activityId, // Use activityId as documentId
            lesson_name: activityData.lesson_name,
            timestamp: serverTimestamp()
        });

            console.log("✅ Successfully logged deletion in history collection.");
        } catch (historyError) {
            console.error("❌ Error logging deletion in history collection:", historyError);
        }
        // 🔥 Step 8: Mark the activity as approved in 'lesson_activities'
        await updateDoc(activityRef, {
            isApprove: true,
            adminAction: "Approved edit request",
            timestamp: serverTimestamp()
        });

        console.log("✅ Activity document updated successfully:", activityRef.path);

        alert("✅ Edit request approved successfully!");
        console.log("✅ Edit request approved successfully!");

        // 🔄 Refresh pending content list
        loadPendingContent();
    } catch (error) {
        console.error("❌ Error approving edit request:", error);
        alert("An error occurred while approving the edit. Check the console for details.");
    }
}


async function approveCategoryEdit(activityId, wordId, categoryId, subcategoryId) {
    try {
        console.log("✅ approveCategoryEdit called with:", { activityId, wordId, categoryId, subcategoryId });

        // Step 1: Fetch the activity document from category_activities
        const activityRef = doc(db, "category_activities", String(activityId));
        const activitySnap = await getDoc(activityRef);
        if (!activitySnap.exists()) {
            console.error("❌ Category activity document not found:", activityId);
            alert("Error: Category activity document not found.");
            return;
        }
        const activityData = activitySnap.data();
        console.log("📌 Activity Data:", activityData);

        // Step 2: Extract categoryId and subcategoryId from exactLocation
        if ((!categoryId || categoryId === "undefined") || (!subcategoryId || subcategoryId === "undefined")) {
            if (activityData.exactLocation) {
                const segments = activityData.exactLocation.split("/");
                if (segments.length >= 6 && segments[0] === "categories" && segments[2] === "subcategories") {
                    categoryId = segments[1]; 
                    subcategoryId = segments[3];
                    console.log("✅ Extracted from exactLocation - categoryId:", categoryId, "subcategoryId:", subcategoryId);
                } else {
                    console.error("❌ exactLocation format is invalid:", activityData.exactLocation);
                    alert("Error: Invalid exactLocation format.");
                    return;
                }
            }
        }

        // Step 3: Validate extracted categoryId and subcategoryId
        if (!categoryId || !subcategoryId || categoryId === "undefined" || subcategoryId === "undefined") {
            console.error("❌ Missing categoryId or subcategoryId after extraction.");
            alert("Error: Unable to determine categoryId or subcategoryId.");
            return;
        }

        // Step 4: Construct the correct word document path
        const wordRef = doc(db, "categories", categoryId, "subcategories", subcategoryId, "words", wordId);
        console.log("📌 Final Word Document Path:", wordRef.path);

        // Step 5: Ensure the word document exists
        const wordSnap = await getDoc(wordRef);
        if (!wordSnap.exists()) {
            console.error("❌ Word document NOT found:", wordRef.path);
            alert(`Error: The word document does not exist at ${wordRef.path}`);
            return;
        }
         // **🔹 Log the approval action in the history collection**
         try {
            const historyRef = collection(db, "history");
        await addDoc(historyRef, {
            action: "Content Edit",
            addedBy: activityData.addedBy, // Corrected variable
            adminAction: "Edited content",
            contentDetails: `Word: ${activityData.word} <br> Translated: ${activityData.translated} <br> Options: ${activityData.options.join(", ")}`,
            documentId: activityId, // Use activityId as documentId
            lesson_name: activityData.lesson_name,
            timestamp: serverTimestamp()
        });

            console.log("✅ Successfully logged deletion in history collection.");
        } catch (historyError) {
            console.error("❌ Error logging deletion in history collection:", historyError);
        }

        // Step 6: Update the word document
        await updateDoc(wordRef, {
            word: activityData.newWord,
            translated: activityData.translated,
            options: activityData.options,
            image_path: activityData.image_path
        });
        console.log("✅ Word document updated successfully:", wordRef.path);

        // Step 7: Mark the category_activities document as approved
        await updateDoc(activityRef, { isApprove: true });
        console.log("✅ Category activity document updated:", activityRef.path);

        // Step 8: Update the general activities collection if needed
        const activitiesQuery = query(
            collection(db, "activities"),
            where("exactLocation", "==", `categories/${categoryId}/subcategories/${subcategoryId}/words/${wordId}`)
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);
        if (!activitiesSnapshot.empty) {
            const actDocRef = activitiesSnapshot.docs[0].ref;
            await updateDoc(actDocRef, { isApprove: true });
            console.log("✅ General activity document updated:", actDocRef.path);
        }

        alert("✅ Category edit approved successfully!");
        console.log("✅ Category edit approved successfully!");

        // Refresh pending content list
        loadPendingContent();
    } catch (error) {
        console.error("❌ Error approving category edit:", error);
        alert("An error occurred while approving the category edit. Check the console for details.");
    }
}

export{approveCategoryEdit,approveEdit}