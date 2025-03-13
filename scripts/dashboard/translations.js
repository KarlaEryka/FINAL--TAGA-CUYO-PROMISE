import { collection, query, orderBy, limit, getDocs,getDoc,doc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { db,getAuth,app } from './firebase-config.js'; // Import db from firebase-config.js\
import { onAuthStateChanged } from './dashboard.js';
// Initialize Firebase Auth
const auth = getAuth(app); 
function enforceAccessControl(user) {
    if (!user) {
        // Redirect to login or show an access denied message
        window.location.href = "login.html"; 
    } else {
        console.log("User is logged in:", user);
    }
}

// Now, it can be used in the onAuthStateChanged function
onAuthStateChanged(auth, (user) => {
    enforceAccessControl(user);
});
async function updateTranslations() {
    const translationsList = document.getElementById('translated-phrases-list');
    translationsList.innerHTML = ''; // Clear the list before updating

    // Create the table header
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Output Language</th>
        <th style="text-align:center">Sentence</th>
        <th>Source Language</th>
        <th>Target Language</th>
    `;
    table.appendChild(headerRow);

    try {
        // Create a reference to the 'translations' collection
        const translationsRef = collection(db, 'translations');

        // Create a query to order by timestamp and limit to 15
        const q = query(translationsRef, orderBy('timestamp', 'desc'), limit(15));

        // Get the documents using getDocs() on the query
        const translationSnapshot = await getDocs(q);

        if (translationSnapshot.empty) {
            translationsList.innerHTML = '<p>No translations available.</p>';
            return;
        }

        // Create table rows for each translation
        translationSnapshot.forEach((doc) => {
            const data = doc.data();
            const outputSentence = data.output_sentence;
            const sentence = data.sentence;
            const sourceLanguage = data.source_language;
            const targetLanguage = data.target_language;

            // Create a row for each translation
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${outputSentence}</td>
                <td>"${sentence}"</td>
                <td>${sourceLanguage}</td>
                <td>${targetLanguage}</td>
            `;
            table.appendChild(row);
        });

        translationsList.appendChild(table);

    } catch (error) {
        console.error('Error fetching translations:', error.message);
        translationsList.innerHTML = `<p>Error: ${error.message}. Please contact support.</p>`;
    }
}

// Call updateTranslations when the page is loaded
document.addEventListener('DOMContentLoaded', updateTranslations);
