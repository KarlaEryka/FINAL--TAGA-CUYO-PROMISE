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

function handleEdit(event) {
    const user = auth.currentUser;

    if (!user) {
        alert("You must be logged in to edit categories.");
        return;
    }

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

    // Get the current values from the table
    const word = row.cells[0].innerText;
    const translated = row.cells[1].innerText;
    const options = row.cells[2].innerText;

    // Populate the modal fields
    document.getElementById("editWordId").value = wordId;
    document.getElementById("editWord").value = word;
    document.getElementById("editTranslated").value = translated;
    document.getElementById("editOptions").value = options;

    // Store category and subcategory in dataset for saving
    document.getElementById("editContentForm").dataset.categoryId = categoryId;
    document.getElementById("editContentForm").dataset.subcategoryId = subcategoryId;
    document.getElementById("editContentForm").dataset.rowIndex = row.rowIndex; // ✅ Store row index

    // ✅ Show the modal directly (Remove openEditModal)
    document.getElementById("editContentModal").style.display = "block";
}


document.getElementById("editContentForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form from refreshing the page

    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to save changes.");
        return;
    }

    // Get values from modal
    const wordId = document.getElementById("editWordId").value;
    const newWord = document.getElementById("editWord").value.trim();
    const newTranslated = document.getElementById("editTranslated").value.trim();
    const newOptions = document.getElementById("editOptions").value.split(",").map(option => option.trim());

    // ✅ Validate inputs (Only allow letters for word & translated fields)
    const lettersOnly = /^[A-Za-z\s]+$/;
    if (!lettersOnly.test(newWord) || !lettersOnly.test(newTranslated)) {
        alert("Only letters are allowed for the word and translated fields.");
        return;
    }

    // ✅ Validate options (Ensure they do not contain numbers)
    const numbersPattern = /\d/;
    if (newOptions.some(option => numbersPattern.test(option))) {
        alert("Numbers are not allowed in the options field.");
        return;
    }

    // Get category and subcategory from dataset
    const categoryId = event.target.dataset.categoryId;
    const subcategoryId = event.target.dataset.subcategoryId;
    const rowIndex = event.target.dataset.rowIndex; // ✅ Retrieve row index

    if (!wordId || !categoryId) {
        console.error("❌ Missing required IDs for saving!");
        return;
    }

    // ✅ Confirmation prompt
    const confirmUpdate = confirm(
        `Are you sure you want to update this word?\n\nWord: ${newWord}\nTranslated: ${newTranslated}\nOptions: ${newOptions.join(", ")}`
    );

    if (!confirmUpdate) {
        console.log("🚫 Update canceled by the user.");
        return; // Stop the function if the user cancels
    }

    let wordRef;
    if (subcategoryId) {
        wordRef = doc(db, "categories", categoryId, "subcategories", subcategoryId, "words", wordId);
    } else {
        wordRef = doc(db, "categories", categoryId, "words", wordId);
    }

    console.log("🔄 Updating document:", wordRef.path);

    try {
        // Update Firestore document
        await updateDoc(wordRef, {
            word: newWord,
            translated: newTranslated,
            options: newOptions
        });

        console.log("✅ Document successfully updated!");

        // Log the action in Firestore
        await addDoc(collection(db, "history"), {
            action: "Edited a word in category",
            addedBy: user.email,
            adminAction: "Edited content",
            contentDetails: `Word: ${newWord} <br> Translated: ${newTranslated} <br> Options: ${newOptions.join(", ")}`,
            documentId: wordId,
            lesson_id: categoryId,
            timestamp: serverTimestamp()
        });

        console.log("📜 Activity logged successfully!");

        // ✅ Update the table row dynamically
        const table = document.querySelector("table");
        if (table && rowIndex) {
            const row = table.rows[rowIndex];
            row.cells[0].innerText = newWord;
            row.cells[1].innerText = newTranslated;
            row.cells[2].innerText = newOptions.join(", ");
        }

        // Close the modal
        document.getElementById("editContentModal").style.display = "none";

    } catch (error) {
        console.error("❌ Error updating document:", error);
        alert("An error occurred while saving the changes. Please try again.");
    }
});


export { handleEdit };