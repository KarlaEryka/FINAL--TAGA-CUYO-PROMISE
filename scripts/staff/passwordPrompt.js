// scripts/staff/passwordPrompt.js
// Show password prompt modal
export function showPasswordPrompt() {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById("passwordPromptModal");
        const adminPasswordInput = document.getElementById("adminPasswordInput");
        const confirmPasswordBtn = document.getElementById("confirmPasswordBtn");
        const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");

        modal.style.display = "block"; // Show the modal

        confirmPasswordBtn.onclick = () => {
            const password = adminPasswordInput.value.trim();
            if (password) {
                modal.style.display = "none";
                resolve(password);
            } else {
                alert("Please enter your password.");
            }
        };

        cancelPasswordBtn.onclick = () => {
            modal.style.display = "none";
            reject("Password input canceled.");
        };
    });
}