// // scripts/staff/resetPassword.js
// import { auth } from "./firebaseConfig.js";
// import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// // Reset user password
// export async function resetPassword(email) {
//     try {
//         await sendPasswordResetEmail(auth, email);
//         alert("Password reset email sent successfully.");
//     } catch (error) {
//         console.error("Error sending reset email:", error);
//         alert("Failed to send password reset email. Please try again.");
//     }
// }