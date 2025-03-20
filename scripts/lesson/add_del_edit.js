import { db, auth } from './firebase_config.js';
import { collection, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { loadFilterOptions, loadLessons, loadLessonsAndWords } from './lesson.js';

// ADD CONTENT FUNCTION
function addOptionField() {
    const optionsContainer = document.getElementById('optionsContainer');
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'option-input';
    newInput.placeholder = 'Enter an option';
    optionsContainer.appendChild(newInput);
}

document.getElementById('addOptionButton').addEventListener('click', addOptionField);

async function addContent(event) {
    event.preventDefault();

    const lessonId = document.getElementById('lessonSelect').value;
    const word = document.getElementById('word').value.trim();
    const translated = document.getElementById('translated').value.trim();
 
    const onlyLettersRegex = /^[A-Za-z\s]+$/;

    if (!onlyLettersRegex.test(word) || !onlyLettersRegex.test(translated)) {
        alert("Only letters are allowed in the word and translated fields.");
        return;
    }

    const optionFields = document.querySelectorAll('.option-input');
    const options = Array.from(optionFields)
        .map(input => input.value.trim())
        .filter(opt => opt !== "");

    if (!lessonId || !word || !translated || options.length === 0) {
        alert("Please fill out all required fields and provide at least one option.");
        return;
    }

    try {
        const lessonDocRef = doc(db, 'lessons', lessonId);
        const wordsSubcollectionRef = collection(lessonDocRef, 'words');
        const wordDocRef = await addDoc(wordsSubcollectionRef, {
            word,
            translated,
            options,
            addedBy: auth.currentUser ? auth.currentUser.email : "unknown",
            timestamp: new Date()
        });

        alert("Content added successfully!");

        // Log the action in the `history` collection
        await addDoc(collection(db, "history"), {
            action: "Added a Lesson",
            addedBy: auth.currentUser.email,
            adminAction: "Added content",
            contentDetails: `Word: ${word} <br> Translated: ${translated} <br> Options: ${options.join(", ")}`,
            documentId: wordDocRef.id, // Use the ID of the newly added word
            lesson_id: lessonId, // Use the lesson ID
            timestamp: serverTimestamp()
        });

        closeAddModal();
        loadLessonsAndWords(lessonId);
        await loadFilterOptions(lessonId);

    } catch (error) {
        console.error("Error adding content:", error);
        alert("Failed to add content. Please try again.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const addContentForm = document.getElementById('addContentForm');
    if (addContentForm) {
        addContentForm.addEventListener('submit', addContent);
    } else {
        console.error("Element with ID 'addContentForm' not found.");
    }
});

function closeAddModal() {
    const addModal = document.getElementById('addContentModal');
    if (addModal) {
        addModal.style.display = 'none';
    }
}

// DELETE FUNCTION
async function deleteWord(lessonId, wordId) {
    const isConfirmed = confirm("Are you sure you want to delete this content? This action cannot be undone.");

    if (isConfirmed) {
        const wordDocRef = doc(db, "lessons", lessonId, "words", wordId);
        try {
            const wordDoc = await getDoc(wordDocRef);
            const wordData = wordDoc.data();

            await deleteDoc(wordDocRef);
            alert("Content deleted successfully!");

            // Log the action in the `history` collection
            await addDoc(collection(db, "history"), {
                action: "Deleted a Lesson",
                addedBy: auth.currentUser.email,
                adminAction: "Deleted content",
                contentDetails: `Word: ${wordData.word} <br> Translated: ${wordData.translated} <br> Options: ${wordData.options.join(", ")}`,
                documentId: wordId,
                lesson_id: lessonId,
                timestamp: serverTimestamp()
            });

            console.log("📜 Activity logged successfully!");
            loadLessonsAndWords();
        } catch (error) {
            console.error("Error deleting content:", error);
            alert("Failed to delete content. Please try again.");
        }
    } else {
        console.log("Deletion canceled by the user.");
    }
}

// EDIT FUNCTION
async function editWord(lessonId, wordId) {
    if (!lessonId || !wordId) {
        console.error("Invalid lessonId or wordId:", lessonId, wordId);
        return;
    }

    const wordDocRef = doc(db, "lessons", lessonId, "words", wordId);
    const wordDoc = await getDoc(wordDocRef);

    if (wordDoc.exists()) {
        const wordData = wordDoc.data();
        document.getElementById('editWordId').value = wordId;
        document.getElementById('editWord').value = wordData.word;
        document.getElementById('editTranslated').value = wordData.translated;
        document.getElementById('editOptions').value = wordData.options.join(", ");

        await loadLessons();
        await loadFilterOptions(lessonId);

        document.getElementById('lessonSelect').value = lessonId;
        document.getElementById('editContentModal').style.display = 'block';
    } else {
        alert("Content not found.");
    }
}
async function updateWord(event) {
    event.preventDefault();

    const wordId = document.getElementById('editWordId').value;
    const lessonId = document.getElementById('lessonSelect').value;
    const word = document.getElementById('editWord').value.trim();
    const translated = document.getElementById('editTranslated').value.trim();
    const options = document.getElementById('editOptions').value
        .split(",")
        .map(opt => opt.trim())
        .filter(opt => opt !== "");

    // Allow letters, spaces, and special characters
    const validTextRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s.,'!?()-]+$/;

    if (!validTextRegex.test(word) || !validTextRegex.test(translated)) {
        alert("Only letters, spaces, and special characters (.,'!?()-) are allowed.");
        return;
    }

    if (!lessonId || !wordId || !word || !translated || options.length === 0) {
        alert("Please fill out all required fields and provide at least one option.");
        return;
    }

    // Confirmation dialog before proceeding
    const isConfirmed = confirm("Are you sure you want to update this content?");
    if (!isConfirmed) return;

    try {
        const wordDocRef = doc(db, "lessons", lessonId, "words", wordId);
        await updateDoc(wordDocRef, {
            word,
            translated,
            options,
            updatedBy: auth.currentUser ? auth.currentUser.email : "unknown",
            updatedAt: new Date()
        });

        alert("Content updated successfully!");

        // Log the action in Firestore history
        await addDoc(collection(db, "history"), {
            action: "Edited a lesson",
            addedBy: auth.currentUser.email,
            adminAction: "Edited content",
            contentDetails: `Word: ${word} <br> Translated: ${translated} <br> Options: ${options.join(", ")}`,
            documentId: wordId,
            lesson_id: lessonId,
            timestamp: serverTimestamp()
        });

        console.log("📜 Activity logged successfully!");
        closeEditModal();

        // ✅ Reload only the filtered lesson's words
        await loadLessonsAndWords(lessonId);

    } catch (error) {
        console.error("Error updating content:", error);
        alert("Failed to update content. Please try again.");
    }
}



function closeEditModal() {
    const editModal = document.getElementById('editContentModal');
    if (editModal) {
        editModal.style.display = 'none';
    }
}

export { addContent, deleteWord, editWord, updateWord, closeEditModal, addOptionField };