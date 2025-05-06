import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const auth = useAuth();

  const create = async ({ module, target, title, message, data }) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        module,
        target: target,
        title: title,
        message: message,
        data: data,
        isReadBy: [],
        isDeletedBy: [],
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser,
      });
    } catch (error) {
      console.error(error.message);
      toast.error('Error creating notifications: ' + error.message, { position: 'top-right' });
    }
  };

  const remove = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        isDeletedBy: arrayUnion(auth.uid),
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser,
      });
    } catch (error) {
      console.error(error.message);
      toast.error('Error removing notification: ' + error.message, { position: 'top-right' });
    }
  };

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        isReadBy: arrayUnion(auth.uid),
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser,
      });
    } catch (error) {
      console.error(error.message);
      toast.error('Error marking notification as read: ' + error.message, {
        position: 'top-right',
      });
    }
  };

  const markAsUnread = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        isReadBy: arrayRemove(auth.uid),
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser,
      });
    } catch (error) {
      console.error(error.message);
      toast.error('Error marking notification as unread: ' + error.message, {
        position: 'top-right',
      });
    }
  };

  const markAsAllRead = async (ids) => {
    try {
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, 'notifications', id), {
            isReadBy: arrayUnion(auth.uid),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser,
          })
        )
      );
    } catch (error) {
      console.error(error.message);
      toast.error('Error marking notification as read: ' + error.message, {
        position: 'top-right',
      });
    }
  };

  const markAsAllUnread = async (ids) => {
    try {
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, 'notifications', id), {
            isReadBy: arrayRemove(auth.uid),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser,
          })
        )
      );
    } catch (error) {
      console.error(error.message);
      toast.error('Error marking notification as unread: ' + error.message, {
        position: 'top-right',
      });
    }
  };

  return { create, remove, markAsRead, markAsUnread, markAsAllRead, markAsAllUnread };
};
