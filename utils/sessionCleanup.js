import { db } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

export const cleanupStaleSessions = async () => {
  const sessionsRef = collection(db, 'userSessions');
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - 24);
  
  const staleSessionsQuery = query(
    sessionsRef,
    where('lastActive', '<', cutoffTime)
  );

  try {
    const snapshot = await getDocs(staleSessionsQuery);
    
    // Batch delete to reduce writes
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (snapshot.docs.length > 0) {
      await batch.commit();
      console.log(`Cleaned up ${snapshot.docs.length} stale sessions`);
    }
  } catch (error) {
    console.error('Session cleanup failed:', error);
  }
}; 