import { db } from '@/firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

export const SessionManager = {
  // Store session information
  async createSession(email) {
    try {
      const sessionData = {
        email,
        lastActive: Date.now(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      };
      await setDoc(doc(db, 'userSessions', email), sessionData);
      return true;
    } catch (error) {
      console.error('Error creating session:', error);
      return false;
    }
  },

  // Check if user has another active session
  async checkExistingSession(email) {
    try {
      // Clean up stale sessions first
      await this.cleanupStaleSessions();
      
      const sessionDoc = await getDoc(doc(db, 'userSessions', email));
      if (!sessionDoc.exists()) return false;
      
      // Check if session is still valid (not older than 30 minutes)
      const sessionData = sessionDoc.data();
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      
      if (sessionData.lastActive < thirtyMinutesAgo) {
        // Session is stale, delete it
        await this.endSession(email);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  },

  // Update last active timestamp
  async updateLastActive(email) {
    try {
      await setDoc(doc(db, 'userSessions', email), {
        lastActive: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  },

  // End session
  async endSession(email) {
    try {
      await deleteDoc(doc(db, 'userSessions', email));
    } catch (error) {
      console.error('Error ending session:', error);
    }
  },

  // Add session cleanup for stale sessions (older than 30 minutes)
  async cleanupStaleSessions() {
    try {
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      const sessionsRef = collection(db, 'userSessions');
      const staleSessionsQuery = query(
        sessionsRef,
        where('lastActive', '<', thirtyMinutesAgo)
      );
      
      const snapshot = await getDocs(staleSessionsQuery);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up stale sessions:', error);
    }
  }
}; 