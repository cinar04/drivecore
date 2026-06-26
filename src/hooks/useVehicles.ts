import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Vehicle } from '../types';
import { calculateOverallRating } from '../utils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { logActivity } from './useActivityLog';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();
  const { currentUser } = useAuth();
  const { currentOrg, canDo } = useOrg();

  useEffect(() => {
    if (!currentOrg) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    // orderBy kaldırıldı — Firestore bileşik index gerektiriyordu.
    // Sıralama client tarafında yapılıyor.
    const q = query(
      collection(db, 'vehicles'),
      where('orgId', '==', currentOrg.id)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const data = snap.docs
          .map(d => ({ ...d.data(), id: d.id }) as Vehicle)
          .sort((a, b) => {
            const aTime = (a.createdAt && 'toDate' in a.createdAt)
              ? a.createdAt.toDate().getTime()
              : new Date(a.createdAt as unknown as string).getTime() || 0;
            const bTime = (b.createdAt && 'toDate' in b.createdAt)
              ? b.createdAt.toDate().getTime()
              : new Date(b.createdAt as unknown as string).getTime() || 0;
            return bTime - aTime;
          });
        setVehicles(data);
        setLoading(false);
      },
      err => {
        console.error('useVehicles snapshot error:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [currentOrg]);

  const addVehicle = useCallback(async (
    data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'overallPerformance' | 'orgId'>
  ) => {
    if (!canDo('crud') || !currentOrg || !currentUser) {
      showError('Yetki Yok', 'Bu işlemi yapmaya yetkiniz yok');
      return;
    }
    const overallPerformance = calculateOverallRating(data.performanceRatings as unknown as Record<string, number>);
    const ref = await addDoc(collection(db, 'vehicles'), {
      ...data,
      orgId: currentOrg.id,
      overallPerformance,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logActivity({
      action: 'Araç Eklendi',
      description: `${data.vehicleName} (${data.plate}) eklendi`,
      performedBy: currentUser.email || '',
      entityType: 'vehicle',
      entityId: ref.id,
      orgId: currentOrg.id,
    });
    success('Araç Eklendi', `${data.vehicleName} başarıyla eklendi`);
    return ref.id;
  }, [canDo, currentOrg, currentUser, success, showError]);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle>) => {
    if (!canDo('crud') || !currentOrg || !currentUser) {
      showError('Yetki Yok', 'Bu işlemi yapmaya yetkiniz yok');
      return;
    }
    if (data.performanceRatings) {
      data.overallPerformance = calculateOverallRating(data.performanceRatings as unknown as Record<string, number>);
    }
    await updateDoc(doc(db, 'vehicles', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    await logActivity({
      action: 'Araç Güncellendi',
      description: 'Araç bilgileri güncellendi',
      performedBy: currentUser.email || '',
      entityType: 'vehicle',
      entityId: id,
      orgId: currentOrg.id,
    });
    success('Güncellendi', 'Araç bilgileri kaydedildi');
  }, [canDo, currentOrg, currentUser, success, showError]);

  const deleteVehicle = useCallback(async (id: string) => {
    if (!canDo('crud') || !currentOrg || !currentUser) {
      showError('Yetki Yok', 'Bu işlemi yapmaya yetkiniz yok');
      return;
    }
    const snap = await getDoc(doc(db, 'vehicles', id));
    const name = snap.data()?.vehicleName || 'Araç';
    await deleteDoc(doc(db, 'vehicles', id));
    await logActivity({
      action: 'Araç Silindi',
      description: `${name} silindi`,
      performedBy: currentUser.email || '',
      entityType: 'vehicle',
      entityId: id,
      orgId: currentOrg.id,
    });
    success('Silindi', 'Araç başarıyla silindi');
  }, [canDo, currentOrg, currentUser, success, showError]);

  const getVehicle = useCallback(async (id: string): Promise<Vehicle | null> => {
    try {
      const snap = await getDoc(doc(db, 'vehicles', id));
      return snap.exists() ? { ...snap.data(), id: snap.id } as Vehicle : null;
    } catch {
      return null;
    }
  }, []);

  return { vehicles, loading, addVehicle, updateVehicle, deleteVehicle, getVehicle };
};
