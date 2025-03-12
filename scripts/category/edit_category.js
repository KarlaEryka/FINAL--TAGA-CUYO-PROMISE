import { auth, db, doc, updateDoc, addDoc, collection, serverTimestamp, getDoc } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js"; // ✅ Fix Import

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ User is logged in:", user.uid);
        console.log("Email:", user.email);
    } else {
        console.log("❌ No user logged in.");
    }
});

console.log("Current User (Before Auth Check):", auth.currentUser);
console.log("User UID:", auth.currentUser ? auth.currentUser.uid : "No user logged in");

async function handleEdit(event) {
    const user = auth.currentUser;

    if (!user) {
        console.error("❌ User is not logged in!");
        alert("You must be logged in to edit categories.");
        return;
    }

    const userRef = doc(db, "admin", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.error("❌ User document not found in Firestore!");
        alert("Your account does not have the necessary permissions.");
        return;
    }

    const userData = userSnap.data();
    if (userData.role !== "admin" && userData.role !== "superadmin") {
        console.error("❌ Permission denied! Only admins can edit.");
        alert("Only administrators can edit categories.");
        return;
    }

    console.log("✅ Authenticated Admin:", user.email);
    
    // Proceed with edit after authentication
    const button = event.target;
    const row = button.closest("tr");
    const wordId = button.dataset.id;
    const categoryId = button.dataset.category;
    const subcategoryId = button.dataset.subcategory;

    if (!wordId || !categoryId) {
        console.error("❌ Missing required IDs for editing!");
        return;
    }

    console.log("✏️ Editing word:", wordId, "in category:", categoryId);

    // Get the cells (except action buttons)
    const wordCell = row.cells[0];
    const translatedCell = row.cells[1];
    const optionsCell = row.cells[2];

    // Store original values
    const word = wordCell.innerText;
    const translated = translatedCell.innerText;
    const options = optionsCell.innerText;

    // Replace text with input fields
    wordCell.innerHTML = `<input type="text" value="${word}" class="edit-input">`;
    translatedCell.innerHTML = `<input type="text" value="${translated}" class="edit-input">`;
    optionsCell.innerHTML = `<input type="text" value="${options}" class="edit-input">`;

    // Change button to "Save"
    button.innerText = "Save";
    button.style.backgroundColor = "green";
    
    button.removeEventListener("click", handleEdit);
    button.addEventListener("click", async () => {
        await saveEdit(row, wordId, categoryId, subcategoryId, button);
    });
}

async function saveEdit(row, wordId, categoryId, subcategoryId, button) {
    const user = auth.currentUser;
    if (!user) {
        console.error("❌ User is not authenticated!");
        return;
    }

    // Get the new values from the input fields
    const wordInput = row.cells[0].querySelector("input");
    const translatedInput = row.cells[1].querySelector("input");
    const optionsInput = row.cells[2].querySelector("input");

    const newWord = wordInput.value;
    const newTranslated = translatedInput.value;

    // Convert options input to an array
    const newOptions = optionsInput.value.split(",").map(option => option.trim());

    console.log("🔍 New Values:", { newWord, newTranslated, newOptions });

    // 🛠 FIX: Ensure correct reference path
    let wordRef;
    if (subcategoryId) {
        wordRef = doc(db, "categories", categoryId, "subcategories", subcategoryId, "words", wordId);
    } else {
        wordRef = doc(db, "categories", categoryId, "words", wordId);
    }

    console.log("🔄 Updating document path:", wordRef.path);

    try {
        // Update the document in Firestore
        await updateDoc(wordRef, {
            word: newWord,
            translated: newTranslated,
            options: newOptions // Ensure this is an array
        });

        console.log("✅ Document successfully updated!");
        // Log the action in the `history` collection
        await addDoc(collection(db, "history"), {
            action: "Edited a word in category",
            addedBy: user.email,
            adminAction: "Edited content",
            contentDetails: `Word: ${newWord} <br> Translated: ${newTranslated} <br> Options: ${newOptions.join(", ")}`,
            documentId: wordId,
            lesson_id: categoryId, // Assuming `categoryId` is the lesson ID
            timestamp: serverTimestamp() // Firestore server timestamp
        });

        console.log("📜 Activity logged successfully!");
        // Revert the row back to display mode
        row.cells[0].innerText = newWord;
        row.cells[1].innerText = newTranslated;
        row.cells[2].innerText = newOptions.join(", "); // Display options as a comma-separated string

        // Change button back to "Edit"
        button.innerText = "Edit";
        button.style.backgroundColor = "";

        // Ensure the button is not disabled
        button.disabled = false; // Explicitly enable the button

        // Re-attach the edit event listener
        button.removeEventListener("click", saveEdit);
        button.addEventListener("click", handleEdit);

    } catch (error) {
        console.error("❌ Error updating document:", error);
        console.error("Error code:", error.code); // Firebase error code
        console.error("Error message:", error.message); // Firebase error message
        alert("An error occurred while saving the changes. Please try again.");
    }
}

export { handleEdit };