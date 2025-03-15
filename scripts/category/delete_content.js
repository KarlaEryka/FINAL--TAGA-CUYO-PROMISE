import { auth, db, doc, deleteDoc, addDoc, collection, serverTimestamp, getDoc } from "./firebaseConfig.js";
import { loadWords } from "./load_category.js";

async function deleteContent(event, categoryId, subcategoryId) {
    const wordId = event.target.getAttribute("data-id");

    if (confirm("Are you sure you want to delete this word?")) {
        try {
            // Get the current user's email
            const currentUserEmail = auth.currentUser ? auth.currentUser.email : null;

            // If there's no user, prevent deletion and alert the user
            if (!currentUserEmail) {
                alert("You must be logged in to perform this action.");
                return;
            }

            // Reference to the word document
            const wordRef = doc(db, "categories", categoryId, "subcategories", subcategoryId, "words", wordId);

            // Fetch the word document to get its data
            const wordSnap = await getDoc(wordRef);

            if (!wordSnap.exists()) {
                alert("Word not found!");
                return;
            }

            // Extract word data
            const wordData = wordSnap.data();
            const word = wordData.word;
            const translated = wordData.translated;
            const options = wordData.options || []; // Default to an empty array if options is undefined

            // Delete the word document from Firestore
            await deleteDoc(wordRef);

            // Log the deletion activity in Firestore (history collection)
            await addDoc(collection(db, "history"), {
                action: "Deleted a word in category",
                addedBy: currentUserEmail,
                adminAction: "Deleted content",
                contentDetails: `Word: ${word} <br> Translated: ${translated} <br> Options: ${options.join(", ")}`,
                documentId: wordId,
                lesson_id: categoryId,
                timestamp: serverTimestamp() // Automatically generates timestamp
            });

            // Reload the words table with the same category and subcategory filters
            loadWords(categoryId, subcategoryId); // Pass the current categoryId and subcategoryId

            alert("Word deleted successfully!");
        } catch (error) {
            console.error("Error deleting content:", error);
            alert("An error occurred while deleting the word.");
        }
    }
}

export { deleteContent };