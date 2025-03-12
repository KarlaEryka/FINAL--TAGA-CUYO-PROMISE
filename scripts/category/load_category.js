
    import { db, collection, getDocs, addDoc, doc, updateDoc, getDoc, storage, ref, uploadBytes, getDownloadURL, auth } from "./firebaseConfig.js";
    import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

    // Now you can use Firestore, Storage, and Auth in this file
    console.log("Firebase initialized successfully.");


    // Load categories and update category dropdown
    async function loadCategories() {
        try {
            const categoriesSnapshot = await getDocs(collection(db, "categories"));
            const filterCategory = document.getElementById("filterCategory");
            const filterSubcategory = document.getElementById("filterSubcategory");

            // Reset category and subcategory dropdowns
            filterCategory.innerHTML = '<option value="">Select Category</option>';
            filterSubcategory.innerHTML = '<option value="">Select Subcategory</option>';
            filterSubcategory.disabled = true;

            categoriesSnapshot.forEach((doc) => {
                const categoryName = doc.data().category_name || doc.id;
                const capitalizedCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

                const filterOption = document.createElement("option");
                filterOption.value = doc.id;
                filterOption.textContent = capitalizedCategory;
                filterCategory.appendChild(filterOption);
            });

            // Event listener for category selection
            filterCategory.addEventListener("change", async () => {
                const selectedCategory = filterCategory.value;
                filterSubcategory.innerHTML = '<option value="">All Subcategories</option>';
                filterSubcategory.disabled = true;

                if (selectedCategory) {
                    await loadSubcategories(selectedCategory);
                    filterSubcategory.disabled = false;
                }

                loadWords(selectedCategory, ""); // Load words for selected category only
            });

            // Event listener for subcategory selection
            filterSubcategory.addEventListener("change", () => {
                const selectedCategory = filterCategory.value;
                const selectedSubcategory = filterSubcategory.value;
                loadWords(selectedCategory, selectedSubcategory);
            });

        } catch (error) {
            console.error("Error loading categories:", error);
        }
    }

    // Load subcategories when a category is selected
    async function loadSubcategories(categoryId) {
        try {
            const filterSubcategory = document.getElementById("filterSubcategory");
            const subcategoriesSnapshot = await getDocs(collection(db, "categories", categoryId, "subcategories"));

            if (subcategoriesSnapshot.empty) return; // If no subcategories, stop execution

            subcategoriesSnapshot.forEach((doc) => {
                const subcategoryName = doc.data().subcategory_name || doc.id;
                const capitalizedSubcategory = subcategoryName.charAt(0).toUpperCase() + subcategoryName.slice(1);

                const subcategoryOption = document.createElement("option");
                subcategoryOption.value = doc.id;
                subcategoryOption.textContent = capitalizedSubcategory;
                filterSubcategory.appendChild(subcategoryOption);
            });
        } catch (error) {
            console.error("Error loading subcategories:", error);
        }
    }

    // Load words based on category & subcategory selection
    async function loadWords(filterCategoryId = "", filterSubcategoryId = "") {
        try {
            const categoriesTableBody = document.getElementById("categoriesTableBody");
            categoriesTableBody.innerHTML = ""; // Clear table before updating

            if (!filterCategoryId) return; // Stop if no category is selected

            let wordsQuery;
            if (filterSubcategoryId) {
                wordsQuery = collection(db, "categories", filterCategoryId, "subcategories", filterSubcategoryId, "words");
            } else {
                wordsQuery = collection(db, "categories", filterCategoryId, "words");
            }

            const wordsSnapshot = await getDocs(wordsQuery);

            wordsSnapshot.forEach(async (wordDoc) => {
                const wordData = wordDoc.data();
                const word = wordData.word;
                const translated = wordData.translated;
                const options = Array.isArray(wordData.options) ? wordData.options.join(", ") : "";
                let image_path = "";

                if (wordData.image_path) {
                    try {
                        const imageRef = ref(storage, wordData.image_path);
                        image_path = await getDownloadURL(imageRef);
                    } catch (error) {
                        console.error("Error fetching image URL:", error);
                    }
                }

                // Create table row
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${word}</td>
                    <td>${translated}</td>
                    <td>${options}</td>
                    <td>
                        <img src="${image_path}" alt="Uploaded Image" style="width:150px; height:100px;" />
                    </td>
                    <td>
                        <button class="btn btn-edit" style="background-color: rgb(223, 223, 2); color: white; border:none; padding: 10px 5px;" 
                            data-id="${wordDoc.id}" data-category="${filterCategoryId}" data-subcategory="${filterSubcategoryId}">Edit</button>

                        <button class="btn btn-delete delete" style="background-color: #f44336; color: white; border:none; padding: 10px 10px;" 
                            data-id="${wordDoc.id}">Delete</button>
                    </td>
                `;

                categoriesTableBody.appendChild(row);

                // Attach event listeners for edit & delete
                row.querySelector(".btn-edit").addEventListener("click", (event) => handleEdit(event));
                row.querySelector(".btn-delete").addEventListener("click", (event) => deleteContent(event, filterCategoryId, filterSubcategoryId));
            });
        } catch (error) {
            console.error("Error loading words:", error);
        }
    }

    // Initialize filters when the page loads
    document.addEventListener("DOMContentLoaded", () => {
        loadCategories();
        
    });
export { loadWords,loadCategories,loadSubcategories };

    import { handleEdit } from "./edit_category.js";
    import { deleteContent } from "./delete_content.js";   