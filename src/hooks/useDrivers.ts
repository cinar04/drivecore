import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Driver } from '../types';
import { calculateOverallRating } from '../utils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { logActivity } from './useActivityLog';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();
  const { currentUser } = useAuth();
  const { currentOrg, canDo } = useOrg();

  useEffect(() => {
    if (!currentOrg) {
      setDrivers([]);
      setLoading(false);
      return;
    }

    // orderBy kaldırıldı — Firestore bileşik index gerektiriyordu.
    // Sıralama client tarafında yapılıyor.
    const q = query(
      collection(db, 'drivers'),
      where('orgId', '==', currentOrg.id)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const data = snap.docs
          .map(d => ({ ...d.data(), uid: d.id }) as Driver)
          .sort((a, b) => {
            const aTime = (a.createdAt && 'toDate' in a.createdAt)
              ? a.createdAt.toDate().getTime()
              : new Date(a.createdAt as unknown as string).getTime() || 0;
            const bTime = (b.createdAt && 'toDate' in b.createdAt)
              ? b.createdAt.toDate().getTime()
              : new Date(b.createdAt as unknown as string).getTime() || 0;
            return bTime - aTime;
          });
        setDrivers(data);
        setLoading(false);
      },
      err => {
        console.error('useDrivers snapshot error:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [currentOrg]);

  const addDriver = useCallback(async (
    data: Omit<Driver, 'uid' | 'createdAt' | 'updatedAt' | 'overallRating' | 'activityHistory' | 'orgId'>
  ) => {
    if (!canDo('crud') || !currentOrg || !currentUser) {
      showError('Yetki Yok', 'Bu işlemi yapmaya yetkiniz yok');
      return;
    }
    const overallRating = calculateOverallRating(data.driverRatings as unknown as Record<string, number>);
    const ref = await addDoc(collection(db, 'drivers'), {
      ...data,
      orgId: currentOrg.id,
      overallRating,
      assignedVehicles: [],
      activityHistory: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logActivity({
      action: 'Sürücü Oluşturuldu',
      description: `${data.fullName} eklendi`,
      performedBy: currentUser.email || '',
      entityType: 'driver',
      entityId: ref.id,
      orgId: currentOrg.id,
    });
    success('Sürücü Eklendi', `${data.fullName} başarıyla eklendi`);
    return ref.id;
  }, [canDo, currentOrg, currentUser, success, showError]);

  const updateDriver = useCallback(async (id: string, data: Partial<Driver>) => {
    if (!canDo('crud') || !currentOrg || !currentUser) {
      showError('Yetki Yok', 'Bu işlemi yapmaya yetkiniz yok');
      return;
    }
    if (data.driverRatings) {
      data.overallRating = calculateOverallRating(data.driverRatings as unknown as Record<string, number>);
    }
    await updateDoc(doc(db, 'drivers', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    await logActivity({
      action: 'Sürücü Güncellendi',
      description: 'Sürücü bilgileri güncellendi',
      performedBy: currentUser.email || '',
      entityType: 'driver',
      entityId: id,
      orgId: currentOrg.id,
    });
    success('Güncellendi', 'Sürücü bilgileri kaydedildi');
  }, [canDo, currentOrg, currentUser, success, showError]);

  const deleteDriver = useCallback(async (id: string) => {
    if (!canDo('crud') || !currentOrg || !currentUser) {
      showError('Yetki Yok', 'Bu işlemi yapmaya yetkiniz yok');
      return;
    }
    const snap = await getDoc(doc(db, 'drivers', id));
    const name = snap.data()?.fullName || 'Sürücü';
    await deleteDoc(doc(db, 'drivers', id));
    await logActivity({
      action: 'Sürücü Silindi',
      description: `${name} silindi`,
      performedBy: currentUser.email || '',
      entityType: 'driver',
      entityId: id,
      orgId: currentOrg.id,
    });
    success('Silindi', 'Sürücü başarıyla silindi');
  }, [canDo, currentOrg, currentUser, success, showError]);

  const getDriver = useCallback(async (id: string): Promise<Driver | null> => {
    try {
      const snap = await getDoc(doc(db, 'drivers', id));
      return snap.exists() ? { ...snap.data(), uid: snap.id } as Driver : null;
    } catch {
      return null;
    }
  }, []);

  return { drivers, loading, addDriver, updateDriver, deleteDriver, getDriver };
};
