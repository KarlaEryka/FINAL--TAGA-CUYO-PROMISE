import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc, addDoc,getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqr7jav_7l0Y7gIhfTklJXnHPzjAYV8f4",
    authDomain: "taga-cuyo-app.firebaseapp.com",
    projectId: "taga-cuyo-app",
    storageBucket: "taga-cuyo-app.firebasestorage.app",
    messagingSenderId: "908851804845",
    appId: "1:908851804845:web:dff839dc552a573a23a424",
    measurementId: "G-NVSY2HPNX4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const storage = getStorage(app); // Initialize Firebase Storage

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
// Show modal when Add Content button is clicked
document.getElementById('addContentButton').addEventListener('click', () => {
    document.getElementById('addContentModal').style.display = 'block';
});

// Close modal when close button is clicked
document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('addContentModal').style.display = 'none';
});

// Load categories for the category dropdown and set up change event to load subcategories
async function loadCategories() {
    try {
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const categorySelect = document.getElementById("categorySelect");
        const filterCategory = document.getElementById("filterCategory");

        // Clear existing options before populating new ones
        categorySelect.innerHTML = '<option value="" disabled selected>Select a Category</option>';
        filterCategory.innerHTML = '<option value="">Select Subcategory</option>';

        // Populate the categories dynamically for both dropdowns
        categoriesSnapshot.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.data().category_name || doc.id;
            categorySelect.appendChild(option);

            // Populate filter category dropdown
            const filterOption = document.createElement("option");
            filterOption.value = doc.id;
            filterOption.textContent = doc.data().category_name || doc.id;
            filterCategory.appendChild(filterOption);
        });

        // Load subcategories when a category is selected
        categorySelect.addEventListener("change", () => {
            const selectedCategory = categorySelect.value;
            loadSubcategories(selectedCategory);
        });

        // Listen for filter category change
        filterCategory.addEventListener("change", () => {
            const selectedCategory = filterCategory.value;
            loadCategoriesAndWords(selectedCategory); // Filter words based on selected category
        });

    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// Load subcategories based on the selected category
async function loadSubcategories(categoryId) {
    const subcategorySelect = document.getElementById("subcategorySelect");

    // Clear existing options
    subcategorySelect.innerHTML = '<option value="" disabled selected>Select a subcategory</option>';

    try {
        const subcategoriesSnapshot = await getDocs(collection(db, "categories", categoryId, "subcategories"));

        subcategoriesSnapshot.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.data().subcategory_name || doc.id;
            subcategorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading subcategories:", error);
    }
}

// Fetch categories, subcategories, and words, and display in the table
async function loadCategoriesAndWords(filterCategoryId = "") {
try {
const categoriesSnapshot = await getDocs(collection(db, "categories"));

const categoriesTableBody = document.getElementById("categoriesTableBody");
categoriesTableBody.innerHTML = "";

categoriesSnapshot.forEach(async (categoryDoc) => {
    if (filterCategoryId === "" || categoryDoc.id === filterCategoryId) {
        const categoryName = categoryDoc.data().category_name || categoryDoc.id;
        const subcategoriesSnapshot = await getDocs(collection(db, "categories", categoryDoc.id, "subcategories"));
        
        subcategoriesSnapshot.forEach(async (subcategoryDoc) => {
            const subcategoryName = subcategoryDoc.data().subcategory_name || subcategoryDoc.id;
            const wordsSnapshot = await getDocs(collection(db, "categories", categoryDoc.id, "subcategories", subcategoryDoc.id, "words"));

            wordsSnapshot.forEach((wordDoc) => {
                const wordData = wordDoc.data();
                const word = wordData.word;
                const translated = wordData.translated;
                const options = Array.isArray(wordData.options) ? wordData.options.join(", ") : "";
                const image_path = wordData.image_path || '';

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</td>
                    <td>${subcategoryName.charAt(0).toUpperCase() + subcategoryName.slice(1)}</td>
                    <td>${word}</td>
                    <td>${translated}</td>
                    <td>${options}</td>
                    <td>
                        <img src="${image_path}" alt="Uploaded Image" style="width:50px; height:50px;" />
                    </td>
                    <td>
                        <button class="btn btn-edit" style="background-color: rgb(223, 223, 2); color: white; border:none; padding: 10px 5px;" data-id="${wordDoc.id}" data-category="${categoryDoc.id}" data-subcategory="${subcategoryDoc.id}">Edit</button>

                        <button class="btn btn-delete delete" style="background-color: #f44336; color: white; border:none; padding: 10px 10px;" data-id="${wordDoc.id}">Delete</button>
                    </td>
                `;

                categoriesTableBody.appendChild(row);
                const editButton = row.querySelector(".btn-edit");
                editButton.addEventListener("click", (event) => handleEdit(event));

                // Now attach the event listener for the delete button
                const deleteButton = row.querySelector(".btn-delete");
                deleteButton.addEventListener("click", (event) => deleteContent(event, categoryDoc.id, subcategoryDoc.id));
            });
        });
    }
});
} catch (error) {
console.error("Error loading categories and words:", error);
}
}

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

    // Delete the word document from Firestore
    await deleteDoc(doc(db, "categories", categoryId, "subcategories", subcategoryId, "words", wordId));

    // Log the deletion activity
   // await logActivity("Deleted word", currentUserEmail, { wordId, categoryId, subcategoryId });

    // Reload the categories and words table after deletion
    loadCategoriesAndWords();  // This will refresh the table
    alert("Word deleted successfully!");
} catch (error) {
    console.error("Error deleting content:", error);
    alert("An error occurred while deleting the word.");
}
}
}

async function logActivity(action, userEmail, details) {
try {
// Create a log document in Firestore (or log it elsewhere)
await addDoc(collection(db, "history"), {
    action,
    userEmail,
    details,
    timestamp: new Date()
});
} catch (error) {
console.error("Error logging activity:", error);
}
}

async function handleEdit(event) {
const editButton = event.target.closest('.btn-edit');

// Fetch IDs from the button's dataset
const wordId = editButton.dataset.id;
const categoryId = editButton.dataset.category;
const subcategoryId = editButton.dataset.subcategory;

if (!wordId || !categoryId || !subcategoryId) {
console.error("Error: Missing IDs", { wordId, categoryId, subcategoryId });
alert("Unable to edit: missing category, subcategory, or word ID.");
return;
}

// Access the editable cells
const row = editButton.closest('tr');
const wordCell = row.querySelector('td:nth-child(3)');
const translatedCell = row.querySelector('td:nth-child(4)');
const optionsCell = row.querySelector('td:nth-child(5)');

// Toggle between edit and save mode
if (editButton.textContent.trim() === "Edit") {
// Make cells editable
wordCell.contentEditable = "true";
translatedCell.contentEditable = "true";
optionsCell.contentEditable = "true";
wordCell.focus();
editButton.textContent = "Save";
} else {
// Save the updated data
const updatedWord = wordCell.textContent.trim();
const updatedTranslated = translatedCell.textContent.trim();
const updatedOptions = optionsCell.textContent.trim().split(",").map(opt => opt.trim());

try {
await updateDoc(doc(db, "categories", categoryId, "subcategories", subcategoryId, "words", wordId), {
    word: updatedWord,
    translated: updatedTranslated,
    options: updatedOptions,
});

alert("Word updated successfully!");
editButton.textContent = "Edit";
loadCategoriesAndWords(); // Refresh the table
} catch (error) {
console.error("Error updating word:", error);
alert("An error occurred while updating the word.");
}
}
}


// Form submission handler
document.getElementById('addContentForm').addEventListener('submit', async (event) => {
event.preventDefault(); // Prevent form from refreshing the page

const category = document.getElementById('categorySelect').value;
const subcategory = document.getElementById('subcategorySelect').value;
const word = document.getElementById('word').value;
const translated = document.getElementById('translated').value;
const options = document.getElementById('options').value.split(',');

let image_path = '';

// Handle image upload if an image is selected
const file = document.getElementById('imageUpload').files[0];
if (file) {
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    image_path = await getDownloadURL(storageRef);
}

try {
    // Add the word data to Firestore
    await addDoc(collection(db, 'categories', category, 'subcategories', subcategory, 'words'), {
        word,
        translated,
        options,
        image_path,
    });

    alert('Content added successfully!');
    document.getElementById('addContentModal').style.display = 'none';
    document.getElementById('addContentForm').reset();
    loadCategoriesAndWords(category, subcategory); // Refresh the displayed content
} catch (error) {
    console.error("Error adding content:", error);
    alert('Failed to add content.');
}
});
// Initialize by loading categories and words
loadCategories();
loadCategoriesAndWords(); // Load all words initially