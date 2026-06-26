import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import type { DashboardPrefs, WidgetConfig, WidgetId, WidgetSize } from '../types';
import { getDefaultDashboardPrefs, reconcileDashboardPrefs } from '../lib/dashboardWidgets';

interface UseDashboardLayoutResult {
  widgets: WidgetConfig[];
  loading: boolean;
  /** true ise bu proje kendi bağımsız düzenine sahip (hesap default'undan ayrışmış) */
  isCustomized: boolean;
  setWidgets: (widgets: WidgetConfig[]) => void;
  toggleVisible: (id: WidgetId) => void;
  setSize: (id: WidgetId, size: WidgetSize) => void;
  reorder: (widgets: WidgetConfig[]) => void;
  save: () => Promise<void>;
  resetToAccountDefault: () => Promise<void>;
  saving: boolean;
}

/**
 * Dashboard düzeni iki seviyede tutulur:
 *  - admins/{uid}.dashboardPrefs         → hesap geneli varsayılan (Ayarlar > Görünüm'den değişir)
 *  - admins/{uid}/orgDashboardPrefs/{orgId} → o projeye özel kişisel override
 *
 * Bir org ilk açıldığında override yoksa hesap default'u kopyalanır ve
 * o andan sonra bağımsız olarak düzenlenebilir.
 */
export function useDashboardLayout(): UseDashboardLayoutResult {
  const { currentUser, adminData } = useAuth();
  const { currentOrg } = useOrg();

  const [widgets, setWidgetsState] = useState<WidgetConfig[]>(getDefaultDashboardPrefs().widgets);
  const [loading, setLoading] = useState(true);
  const [isCustomized, setIsCustomized] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentUser || !currentOrg) { setLoading(false); return; }
      setLoading(true);
      try {
        const orgPrefRef = doc(db, 'admins', currentUser.uid, 'orgDashboardPrefs', currentOrg.id);
        const orgSnap = await getDoc(orgPrefRef);

        if (orgSnap.exists()) {
          const prefs = reconcileDashboardPrefs(orgSnap.data() as DashboardPrefs);
          if (active) { setWidgetsState(prefs.widgets); setIsCustomized(true); }
        } else {
          // İlk açılış: hesap default'unu kopyala
          const accountDefault = reconcileDashboardPrefs(adminData?.dashboardPrefs);
          await setDoc(orgPrefRef, { widgets: accountDefault.widgets, updatedAt: serverTimestamp() });
          if (active) { setWidgetsState(accountDefault.widgets); setIsCustomized(false); }
        }
      } catch {
        if (active) setWidgetsState(getDefaultDashboardPrefs().widgets);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentOrg?.id]);

  const persist = useCallback(async (next: WidgetConfig[]) => {
    if (!currentUser || !currentOrg) return;
    setSaving(true);
    try {
      const orgPrefRef = doc(db, 'admins', currentUser.uid, 'orgDashboardPrefs', currentOrg.id);
      await setDoc(orgPrefRef, { widgets: next, updatedAt: serverTimestamp() });
      setIsCustomized(true);
      dirtyRef.current = false;
    } finally {
      setSaving(false);
    }
  }, [currentUser, currentOrg]);

  const setWidgets = useCallback((next: WidgetConfig[]) => {
    setWidgetsState(next);
    dirtyRef.current = true;
  }, []);

  const toggleVisible = useCallback((id: WidgetId) => {
    setWidgetsState(prev => {
      const next = prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
      dirtyRef.current = true;
      return next;
    });
  }, []);

  const setSize = useCallback((id: WidgetId, size: WidgetSize) => {
    setWidgetsState(prev => {
      const next = prev.map(w => w.id === id ? { ...w, size } : w);
      dirtyRef.current = true;
      return next;
    });
  }, []);

  const reorder = useCallback((next: WidgetConfig[]) => {
    setWidgetsState(next);
    dirtyRef.current = true;
  }, []);

  const save = useCallback(async () => {
    await persist(widgets);
  }, [persist, widgets]);

  const resetToAccountDefault = useCallback(async () => {
    const accountDefault = reconcileDashboardPrefs(adminData?.dashboardPrefs);
    setWidgetsState(accountDefault.widgets);
    await persist(accountDefault.widgets);
    setIsCustomized(false);
  }, [adminData, persist]);

  return {
    widgets, loading, isCustomized, saving,
    setWidgets, toggleVisible, setSize, reorder, save, resetToAccountDefault,
  };
}
