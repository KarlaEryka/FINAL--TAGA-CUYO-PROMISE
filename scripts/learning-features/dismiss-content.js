// dismissContent.js

import { db } from "./firebase.js";
import { getDoc, doc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

window.dismissContent = async function(docId) {
    const docRef = doc(db, 'activities', docId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
        console.error("No such document! Unable to dismiss.");
        return;
    }

    const data = docSnapshot.data();

    await updateDoc(docRef, {
        isApprove: false,
        dismissed: true
    });

    await addDoc(collection(db, 'history'), {
        action: 'Dismissed content',
        addedBy: data.addedBy,
        documentId: docId,
        contentDetails: `Word: ${data.word} - Translated: ${data.translated}`,
        adminAction: 'Dismissed',
        timestamp: new Date(),
    });

    console.log(`Dismissed content: ${data.word}`);
    loadHistory();
};
