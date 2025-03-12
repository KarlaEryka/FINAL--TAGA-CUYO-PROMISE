// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

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
export { app, db, auth };
