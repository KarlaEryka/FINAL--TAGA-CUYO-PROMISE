// Firebase App (compat version)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
// Firebase Authentication SDK
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
// Firebase Firestore SDK (compat version)
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqr7jav_7l0Y7gIhfTklJXnHPzjAYV8f4",
    authDomain: "taga-cuyo-app.firebaseapp.com",
    databaseURL: "https://taga-cuyo-app-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "taga-cuyo-app",
    storageBucket: "taga-cuyo-app.firebasestorage.app",
    messagingSenderId: "908851804845",
    appId: "1:908851804845:web:dff839dc552a573a23a424",
    measurementId: "G-NVSY2HPNX4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// Exporting the db to use in other files
export { db,initializeApp,firebaseConfig,app,getAuth,auth
 };