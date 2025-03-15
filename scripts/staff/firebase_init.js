import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";

// ✅ Ensure only one Firebase app instance exists
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Ensure database is only initialized once
let database;
try {
    database = getDatabase(app);  // No need to specify the database URL unless necessary
} catch (error) {
    console.error("Database already initialized:", error.message);
}

const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, database, firestore,getApps,initializeApp };
