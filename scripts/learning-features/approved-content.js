// approveContent.js

import { db } from "./firebase.js";
import { getDoc, doc, updateDoc, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

window.approveContent = async function(docId) {
    const docRef = doc(db, 'activities', docId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
        console.error("No such document! Unable to update.");
        return;
    }

    const data = docSnapshot.data();

    if (data.location === 'lesson' && data.lessonId) {
        const lessonDocRef = doc(db, 'lessons', data.lessonId);
        const lessonDocSnapshot = await getDoc(lessonDocRef);

        if (lessonDocSnapshot.exists()) {
            await addDoc(collection(lessonDocRef, 'words'), {
                word: data.word,
                translated: data.translated,
                options: data.options || [],
                addedBy: data.addedBy,
                timestamp: new Date(),
            });

            await updateDoc(lessonDocRef, {
                isApproved: true,
                lastUpdated: new Date(),
            });

            await updateDoc(docRef, { isApprove: true });

            console.log(`Approved content: ${data.word}`);
        }
    }

    // Log approval in history
    await addDoc(collection(db, 'history'), {
        action: 'Approved content',
        addedBy: data.addedBy,
        lessonId: data.lessonId,
        documentId: docId,
        contentDetails: `Word: ${data.word} - Translated: ${data.translated}`,
        adminAction: 'Approved',
        timestamp: new Date(),
    });

    loadHistory();
};
