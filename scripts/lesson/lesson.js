    import { db } from './firebase_config.js';
    import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
    import { addContent, deleteWord, editWord,updateWord,closeEditModal,addOptionField } from './add_del_edit.js';

    async function loadFilterOptions(selectedLessonId = "") {
        const filterSelect = document.getElementById("filterLesson");
        filterSelect.innerHTML = ''; // Clear previous options

        // Add default disabled option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a lesson";
        defaultOption.disabled = true;
        defaultOption.selected = !selectedLessonId; // Select if no lessonId is provided
        filterSelect.appendChild(defaultOption);

        const lessonsSnapshot = await getDocs(collection(db, "lessons"));
        lessonsSnapshot.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.data().lesson_name || doc.id;
            option.selected = doc.id === selectedLessonId; // Select the option if it matches the lessonId
            filterSelect.appendChild(option);
        });
    }

    async function loadLessons() {
        try {
            const lessonSelect = document.getElementById('lessonSelect');
            lessonSelect.innerHTML = ""; // Clear existing options
    
            // Add default disabled option
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Select a lesson";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            lessonSelect.appendChild(defaultOption);
    
            const lessonsSnapshot = await getDocs(collection(db, "lessons"));
            lessonsSnapshot.forEach((doc) => {
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = doc.data().lesson_name || doc.id;
                lessonSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading lessons:", error);
        }
    }

    
    // Load and display lessons and words
    async function loadLessonsAndWords(selectedLessonId = "") {
    const lessonsTableBody = document.getElementById("lessonsTableBody");
    lessonsTableBody.innerHTML = ""; // Clear previous content

    let rowIndex = 1; // Initialize row number

    const lessonsSnapshot = await getDocs(collection(db, "lessons"));
    for (const lessonDoc of lessonsSnapshot.docs) {
        const lessonId = lessonDoc.id;

        // Filter by the selected lesson if a specific lesson is chosen
        if (selectedLessonId && selectedLessonId !== lessonId) continue;

        const wordsSnapshot = await getDocs(collection(lessonDoc.ref, "words"));
        wordsSnapshot.forEach((wordDoc) => {
            const wordData = wordDoc.data();
            const wordId = wordDoc.id; // Capture document ID

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${rowIndex}</td> <!-- Row number added here -->
                <td>${wordData.word}</td>
                <td>${wordData.translated}</td>
                <td>${wordData.options.join(", ")}</td>
                <td>
                    <button class="edit-btn" style="background-color: rgb(223, 223, 2); color: white; border:none; padding: 10px 15px;" data-lesson-id="${lessonId}" data-word-id="${wordId}">Edit</button>
                    <button class="delete-btn" style="background-color: #f44336; color: white; border:none; padding: 10px 10px;" data-lesson-id="${lessonId}" data-word-id="${wordId}">Delete</button>
                </td>
            `;
            lessonsTableBody.appendChild(row);
            rowIndex++; // Increment row number
        });
    }
}

    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM fully loaded");
    
        // Load lessons and filter options
        loadLessons();
        loadFilterOptions();
    
        // Add event listeners for delete and edit buttons
        document.addEventListener("click", async (event) => {
            if (event.target.classList.contains("delete-btn")) {
                const lessonId = event.target.getAttribute("data-lesson-id");
                const wordId = event.target.getAttribute("data-word-id");
                console.log("Deleting word - Lesson ID:", lessonId, "Word ID:", wordId);
                await deleteWord(lessonId, wordId);
                loadLessonsAndWords(); // Refresh the table after deletion
            }
    
            if (event.target.classList.contains("edit-btn")) {
                const lessonId = event.target.getAttribute("data-lesson-id");
                const wordId = event.target.getAttribute("data-word-id");
                console.log("Editing word - Lesson ID:", lessonId, "Word ID:", wordId);
                await editWord(lessonId, wordId);
            }
        });
    
        // Listen for filter changes and reload data accordingly
        const filterLesson = document.getElementById("filterLesson");
        if (filterLesson) {
            filterLesson.addEventListener("change", (event) => {
                const selectedLessonId = event.target.value;
                loadLessonsAndWords(selectedLessonId);
            });
        }
    
        // Add event listener for the edit form submission
        const editContentForm = document.getElementById("editContentForm");
        if (editContentForm) {
            editContentForm.addEventListener("submit", updateWord);
        }
    
        // Add event listener for the close modal button
        const closeEditModalButton = document.getElementById("closeEditModalButton");
        if (closeEditModalButton) {
            closeEditModalButton.addEventListener("click", closeEditModal);
        }
    
        // Add event listener for the "Add Content" button
        const addContentButton = document.getElementById("addContentButton");
        if (addContentButton) {
            addContentButton.addEventListener("click", () => {
                document.getElementById("addContentModal").style.display = "block";
            });
        }
    
        // Add event listener for the "Add Option" button
        const addOptionButton = document.getElementById("addOptionButton");
        if (addOptionButton) {
            addOptionButton.addEventListener("click", addOptionField);
        }
    
        // Add event listener for the "Close" button in the add content modal
        const closeAddModalButton = document.querySelector("#addContentModal .close-btn");
        if (closeAddModalButton) {
            closeAddModalButton.addEventListener("click", () => {
                document.getElementById("addContentModal").style.display = "none";
            });
        }
    });
    export { loadLessons, loadFilterOptions, loadLessonsAndWords };
