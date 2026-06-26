import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  query, serverTimestamp, writeBatch, getDocs, where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Notification } from '../types';
import { useOrg } from '../context/OrgContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrg } = useOrg();
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!currentOrg) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // orderBy kaldırıldı — bileşik index gerektiriyordu.
    const q = query(
      collection(db, 'notifications'),
      where('orgId', '==', currentOrg.id)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const data = snap.docs
          .map(d => ({ ...d.data(), id: d.id }) as Notification)
          .sort((a, b) => {
            const aTime = (a.createdAt && 'toDate' in a.createdAt)
              ? a.createdAt.toDate().getTime()
              : new Date(a.createdAt as unknown as string).getTime() || 0;
            const bTime = (b.createdAt && 'toDate' in b.createdAt)
              ? b.createdAt.toDate().getTime()
              : new Date(b.createdAt as unknown as string).getTime() || 0;
            return bTime - aTime;
          });
        setNotifications(data);
        setLoading(false);
      },
      err => {
        console.error('useNotifications error:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [currentOrg]);

  const addNotification = useCallback(async (
    notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'orgId'>
  ) => {
    if (!currentOrg) return;
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      orgId: currentOrg.id,
      read: false,
      createdAt: serverTimestamp(),
    });
  }, [currentOrg]);

  const markAsRead = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!currentOrg) return;
    const batch = writeBatch(db);
    const q = query(
      collection(db, 'notifications'),
      where('orgId', '==', currentOrg.id)
    );
    const snap = await getDocs(q);
    snap.docs.forEach(d => {
      if (!d.data().read) batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }, [currentOrg]);

  return { notifications, loading, unreadCount, addNotification, markAsRead, markAllAsRead };
};
