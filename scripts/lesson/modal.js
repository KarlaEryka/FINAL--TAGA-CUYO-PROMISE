document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");

    // Add event listener for the "Add Content" button
    const addContentButton = document.getElementById('addContentButton');
    if (addContentButton) {
        addContentButton.addEventListener('click', openAddContentModal);
    } else {
        console.error("Element with ID 'addContentButton' not found.");
    }

    // Add event listeners for close buttons
    const closeButtons = document.querySelectorAll('.close-btn');
    if (closeButtons.length > 0) {
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.closest('#addContentModal')) {
                    closeAddContentModal();
                } else if (btn.closest('#editContentModal')) {
                    closeEditContentModal();
                }
            });
        });
    } else {
        console.error("No elements with class 'close-btn' found.");
    }
});

// Modal Handling Functions
function openAddContentModal() {
    const addContentModal = document.getElementById('addContentModal');
    if (addContentModal) {
        addContentModal.style.display = 'block';
    } else {
        console.error("Element with ID 'addContentModal' not found.");
    }
}

function closeAddContentModal() {
    const addContentModal = document.getElementById('addContentModal');
    if (addContentModal) {
        addContentModal.style.display = 'none';
    } else {
        console.error("Element with ID 'addContentModal' not found.");
    }
}

function openEditContentModal() {
    const editContentModal = document.getElementById('editContentModal');
    if (editContentModal) {
        editContentModal.style.display = 'block';
    } else {
        console.error("Element with ID 'editContentModal' not found.");
    }
}

function closeEditContentModal() {
    const editContentModal = document.getElementById('editContentModal');
    if (editContentModal) {
        editContentModal.style.display = 'none';
    } else {
        console.error("Element with ID 'editContentModal' not found.");
    }
}

export { openAddContentModal, closeAddContentModal, openEditContentModal, closeEditContentModal };