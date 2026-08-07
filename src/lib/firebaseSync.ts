import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export function subscribeLiveSync(onUpdate: () => void) {
  try {
    const syncDocRef = doc(db, 'gym', 'sync');
    const unsubscribe = onSnapshot(
      syncDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate();
        }
      },
      (error) => {
        console.warn('Firestore live sync listener fallback:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore live sync subscribe error:', err);
    return () => {};
  }
}

export async function broadcastLiveSync() {
  try {
    const syncDocRef = doc(db, 'gym', 'sync');
    await setDoc(syncDocRef, { updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('Firestore broadcastLiveSync error:', err);
  }
}
