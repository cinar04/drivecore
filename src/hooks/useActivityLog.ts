import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, query,
  limit, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ActivityLog } from '../types';

export const logActivity = async (data: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      ...data,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error('Activity log error:', e);
  }
};

export const useActivityLog = (orgId: string | null | undefined, limitCount = 50) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    // orderBy kaldırıldı — bileşik index gerektiriyordu.
    // Sıralama client tarafında timestamp'e göre yapılıyor.
    const q = query(
      collection(db, 'activityLogs'),
      where('orgId', '==', orgId),
      limit(limitCount)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const data = snap.docs
          .map(d => ({ ...d.data(), id: d.id }) as ActivityLog)
          .sort((a, b) => {
            const aTime = (a.timestamp && 'toDate' in a.timestamp)
              ? a.timestamp.toDate().getTime()
              : new Date(a.timestamp as unknown as string).getTime() || 0;
            const bTime = (b.timestamp && 'toDate' in b.timestamp)
              ? b.timestamp.toDate().getTime()
              : new Date(b.timestamp as unknown as string).getTime() || 0;
            return bTime - aTime;
          });
        setLogs(data);
        setLoading(false);
      },
      err => {
        console.error('useActivityLog error:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [orgId, limitCount]);

  return { logs, loading };
};
