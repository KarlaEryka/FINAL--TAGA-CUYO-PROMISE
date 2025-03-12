import { db, collection, getDocs, addDoc, doc, updateDoc, getDoc, storage, ref, uploadBytes, getDownloadURL, auth } from "./firebaseConfig.js";
import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

async function uploadImageAndGetURL(file, categoryName, subcategoryName) {
    if (!file) {
        console.error("No file selected for upload.");
        return "";
    }

    if (!categoryName || !subcategoryName) {
        console.error("Category or subcategory is missing.");
        return "";
    }

    // Generate the folder path dynamically
    const storageRef = ref(storage, `category_images/${categoryName}/${subcategoryName}/${file.name}`);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        console.log("File uploaded successfully!");
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Upload failed:", error);
        return "";
    }
}



document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing addContent.js...");

    const categorySelect = document.getElementById('categorySelect');
    const subcategorySelect = document.getElementById('subcategorySelect');

    if (!categorySelect || !subcategorySelect) {
        console.error("Dropdown elements not found!");
        return;
    }

    categorySelect.addEventListener('change', async () => {
        console.log('Category changed:', categorySelect.value);
        await loadSubcategories(categorySelect.value);
    });

    subcategorySelect.addEventListener('change', () => {
        console.log('Subcategory selected:', subcategorySelect.value);
    });

    loadCategories();
});

async function loadCategories() {
    const categorySelect = document.getElementById('categorySelect');
    categorySelect.innerHTML = '<option value="">Select a Category</option>';

    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.category_name) { // Ensure category_name exists in Firestore
                let option = document.createElement('option');
                option.value = data.category_name; // Use category_name instead of doc.id
                option.textContent = data.category_name;
                categorySelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

async function loadSubcategories(categoryName) {
    const subcategorySelect = document.getElementById('subcategorySelect');
    subcategorySelect.innerHTML = '<option value="">Select a Subcategory</option>';

    if (!categoryName) return;

    try {
        const categoryQuerySnapshot = await getDocs(collection(db, "categories"));
        let categoryDocId = null;

        categoryQuerySnapshot.forEach((docSnap) => {
            if (docSnap.data().category_name === categoryName) {
                categoryDocId = docSnap.id; // Get the actual Firestore document ID
            }
        });

        if (!categoryDocId) {
            console.error("Category not found!");
            return;
        }

        const subcategoriesSnapshot = await getDocs(collection(db, `categories/${categoryDocId}/subcategories`));
        subcategoriesSnapshot.forEach((subDoc) => {
            const data = subDoc.data();
            if (data && data.subcategory_name) { // Ensure subcategory_name exists
                let option = document.createElement('option');
                option.value = data.subcategory_name; // Use subcategory_name
                option.textContent = data.subcategory_name;
                subcategorySelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error fetching subcategories:", error);
    }
}
//ADD CONTENT
document.getElementById('addContentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const categoryName = document.getElementById('categorySelect').value;
    const subcategoryName = document.getElementById('subcategorySelect').value;
    const word = document.getElementById('word').value;
    const translated = document.getElementById('translated').value;
    const options = [
        document.getElementById('option1').value,
        document.getElementById('option2').value,
        document.getElementById('option3').value
    ].filter(opt => opt.trim() !== '');

    const file = document.getElementById("imageUpload").files[0];
    const image_path = await uploadImageAndGetURL(file, categoryName, subcategoryName);


    if (!categoryName || !subcategoryName || !word || !translated) {
        alert("Please fill out all required fields.");
        return;
    }

    try {
        const categoryQuerySnapshot = await getDocs(collection(db, "categories"));
        let categoryDocId = null;
        categoryQuerySnapshot.forEach((docSnap) => {
            if (docSnap.data().category_name === categoryName) {
                categoryDocId = docSnap.id;
            }
        });

        if (!categoryDocId) {
            console.error("Category not found!");
            return;
        }

        const subcategoryQuerySnapshot = await getDocs(collection(db, `categories/${categoryDocId}/subcategories`));
        let subcategoryDocId = null;
        subcategoryQuerySnapshot.forEach((subDoc) => {
            if (subDoc.data().subcategory_name === subcategoryName) {
                subcategoryDocId = subDoc.id;
            }
        });

        if (!subcategoryDocId) {
            console.error("Subcategory not found!");
            return;
        }

        await addDoc(collection(db, `categories/${categoryDocId}/subcategories/${subcategoryDocId}/words`), {
            word,
            translated,
            options,
            image_path,
        });

        alert("Content added successfully!");
        document.getElementById('addContentModal').style.display = 'none';
        document.getElementById('addContentForm').reset();
    } catch (error) {
        console.error("Error adding content:", error);
        alert("Failed to add content.");
    }
});


// Show modal when Add Content button is clicked
document.getElementById('addContentButton').addEventListener('click', () => {
    document.getElementById('addContentModal').style.display = 'block';
});

// Close modal when close button is clicked
document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('addContentModal').style.display = 'none';
});
// Function to restrict input to letters only
function restrictToLetters(event) {
    event.target.value = event.target.value.replace(/[^A-Za-z\s]/g, ''); // Removes numbers & special characters
}

// Apply restriction to input fields
document.getElementById('word').addEventListener('input', restrictToLetters);
document.getElementById('translated').addEventListener('input', restrictToLetters);
document.getElementById('option1').addEventListener('input', restrictToLetters);
document.getElementById('option2').addEventListener('input', restrictToLetters);
document.getElementById('option3').addEventListener('input', restrictToLetters);

// Prevent form submission if inputs contain invalid characters
document.getElementById('addContentForm').addEventListener('submit', (event) => {
    const word = document.getElementById('word').value;
    const translated = document.getElementById('translated').value;
    const option1 = document.getElementById('option1').value;
    const option2 = document.getElementById('option2').value;
    const option3 = document.getElementById('option3').value;

    const letterOnlyPattern = /^[A-Za-z\s]+$/;

    if (!letterOnlyPattern.test(word) || !letterOnlyPattern.test(translated) ||
        (option1 && !letterOnlyPattern.test(option1)) ||
        (option2 && !letterOnlyPattern.test(option2)) ||
        (option3 && !letterOnlyPattern.test(option3))) {
        alert("Only letters are allowed in the Word, Translated, and Option fields.");
        event.preventDefault(); // Stop form submission
    }
});
