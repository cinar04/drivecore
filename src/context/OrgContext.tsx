import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, writeBatch,
  query, where, onSnapshot, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Organization, OrgMember, OrgInvite, OrgRole } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { logActivity } from '../hooks/useActivityLog';

interface OrgContextType {
  currentOrg: Organization | null;
  userOrgs: Organization[];
  members: OrgMember[];
  invites: OrgInvite[];
  loadingOrg: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  createOrg: (name: string, logo?: string) => Promise<string>;
  updateOrg: (data: Partial<Organization>) => Promise<void>;
  inviteMember: (email: string, role: OrgRole) => Promise<void>;
  updateMemberRole: (uid: string, role: OrgRole) => Promise<void>;
  removeMember: (uid: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<string>;
  deleteOrg: () => Promise<void>;
  canDo: (action: 'manage_members' | 'crud' | 'read' | 'delete_org') => boolean;
  userRole: OrgRole | null;
}

const OrgContext = createContext<OrgContextType | null>(null);

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
};

const ROLE_POWERS: Record<OrgRole, number> = {
  viewer: 1, staff: 2, admin: 3, owner: 4,
};

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, adminData } = useAuth();
  const { success, error: showError } = useToast();

  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [userOrgs, setUserOrgs] = useState<Organization[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Kullanıcının üye olduğu kurumları dinle
  useEffect(() => {
    if (!currentUser) { setLoadingOrg(false); return; }

    const q = query(
      collection(db, 'orgMembers'),
      where('uid', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const orgIds = snap.docs.map(d => d.data().orgId as string);
      if (orgIds.length === 0) {
        setUserOrgs([]);
        setCurrentOrg(null);
        setLoadingOrg(false);
        return;
      }
      const orgDocs = await Promise.all(orgIds.map(id => getDoc(doc(db, 'orgs', id))));
      const orgs = orgDocs
        .filter(d => d.exists())
        .map(d => ({ ...d.data(), id: d.id }) as Organization);
      setUserOrgs(orgs);

      // Kaydedilmiş veya ilk kurumu yükle
      const savedOrgId = adminData?.currentOrgId;
      const target = savedOrgId
        ? orgs.find(o => o.id === savedOrgId) || orgs[0]
        : orgs[0];
      if (target && target.id !== currentOrg?.id) {
        setCurrentOrg(target);
      }
      setLoadingOrg(false);
    });

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Aktif kurumun üyelerini dinle
  useEffect(() => {
    if (!currentOrg) return;
    const q = query(collection(db, 'orgMembers'), where('orgId', '==', currentOrg.id));
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({ ...d.data() }) as OrgMember));
    });
    return unsub;
  }, [currentOrg]);

  // Aktif kurumun davetlerini dinle
  useEffect(() => {
    if (!currentOrg) return;
    const q = query(
      collection(db, 'orgInvites'),
      where('orgId', '==', currentOrg.id),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, snap => {
      setInvites(snap.docs.map(d => ({ ...d.data(), id: d.id }) as OrgInvite));
    });
    return unsub;
  }, [currentOrg]);

  const userRole: OrgRole | null = currentUser
    ? (members.find(m => m.uid === currentUser.uid)?.role ?? null)
    : null;

  const canDo = useCallback((action: 'manage_members' | 'crud' | 'read' | 'delete_org'): boolean => {
    if (!userRole) return false;
    const power = ROLE_POWERS[userRole];
    switch (action) {
      case 'read':           return power >= 1;
      case 'crud':           return power >= 2;
      case 'manage_members': return power >= 3;
      case 'delete_org':     return power >= 4;
    }
  }, [userRole]);

  const switchOrg = useCallback(async (orgId: string) => {
    const org = userOrgs.find(o => o.id === orgId);
    if (!org) return;
    setCurrentOrg(org);
    if (currentUser) {
      await updateDoc(doc(db, 'admins', currentUser.uid), { currentOrgId: orgId });
    }
  }, [userOrgs, currentUser]);

  const createOrg = useCallback(async (name: string, logo = ''): Promise<string> => {
    if (!currentUser) throw new Error('Giriş yapılmadı');
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const orgRef = await addDoc(collection(db, 'orgs'), {
      name, slug, logo,
      ownerId: currentUser.uid,
      plan: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: { allowSelfJoin: false, maxMembers: 10 },
    });

    // Owner olarak ekle
    await setDoc(doc(db, 'orgMembers', `${orgRef.id}_${currentUser.uid}`), {
      uid: currentUser.uid,
      email: currentUser.email,
      fullName: adminData?.fullName || '',
      profilePhoto: adminData?.profilePhoto || '',
      role: 'owner' as OrgRole,
      orgId: orgRef.id,
      joinedAt: serverTimestamp(),
    });

    // admins dokümanını güncelle
    await updateDoc(doc(db, 'admins', currentUser.uid), {
      currentOrgId: orgRef.id,
    });

    await logActivity({
      action: 'Kurum Oluşturuldu',
      description: `"${name}" kurumu oluşturuldu`,
      performedBy: currentUser.email || '',
      entityType: 'org',
      entityId: orgRef.id,
      orgId: orgRef.id,
    });

    success('Kurum Oluşturuldu', `"${name}" başarıyla oluşturuldu`);
    return orgRef.id;
  }, [currentUser, adminData, success]);

  const updateOrg = useCallback(async (data: Partial<Organization>) => {
    if (!currentOrg || !canDo('manage_members')) return;
    await updateDoc(doc(db, 'orgs', currentOrg.id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    success('Güncellendi', 'Kurum bilgileri güncellendi');
  }, [currentOrg, canDo, success]);

  const inviteMember = useCallback(async (email: string, role: OrgRole) => {
    if (!currentOrg || !currentUser || !canDo('manage_members')) {
      showError('Yetki Yok', 'Bu işlem için yeterli yetkiniz yok');
      return;
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün

    await addDoc(collection(db, 'orgInvites'), {
      orgId: currentOrg.id,
      orgName: currentOrg.name,
      email,
      role,
      token,
      invitedBy: currentUser.email,
      status: 'pending',
      expiresAt,
      createdAt: serverTimestamp(),
    });

    await logActivity({
      action: 'Üye Davet Edildi',
      description: `${email} adresine ${role} rolüyle davet gönderildi`,
      performedBy: currentUser.email || '',
      entityType: 'org',
      entityId: currentOrg.id,
      orgId: currentOrg.id,
    });

    success('Davet Gönderildi', `${email} adresine davet gönderildi`);
  }, [currentOrg, currentUser, canDo, showError, success]);

  const updateMemberRole = useCallback(async (uid: string, role: OrgRole) => {
    if (!currentOrg || !canDo('manage_members')) return;
    const memberId = `${currentOrg.id}_${uid}`;
    await updateDoc(doc(db, 'orgMembers', memberId), { role });
    success('Rol Güncellendi', 'Üye rolü değiştirildi');
  }, [currentOrg, canDo, success]);

  const removeMember = useCallback(async (uid: string) => {
    if (!currentOrg || !canDo('manage_members')) return;
    const memberId = `${currentOrg.id}_${uid}`;
    await deleteDoc(doc(db, 'orgMembers', memberId));
    success('Çıkarıldı', 'Üye kurumdan çıkarıldı');
  }, [currentOrg, canDo, success]);

  const acceptInvite = useCallback(async (token: string): Promise<string> => {
    if (!currentUser) throw new Error('Giriş yapılmadı');

    const q = query(collection(db, 'orgInvites'), where('token', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Geçersiz veya süresi dolmuş davet');

    const inviteDoc = snap.docs[0];
    const invite = { ...inviteDoc.data(), id: inviteDoc.id } as OrgInvite;

    if (invite.status !== 'pending') throw new Error('Bu davet zaten kullanılmış');
    if (new Date(invite.expiresAt as unknown as string) < new Date()) {
      throw new Error('Davet süresi dolmuş');
    }

    // Üye olarak ekle
    await setDoc(doc(db, 'orgMembers', `${invite.orgId}_${currentUser.uid}`), {
      uid: currentUser.uid,
      email: currentUser.email,
      fullName: adminData?.fullName || '',
      profilePhoto: adminData?.profilePhoto || '',
      role: invite.role,
      orgId: invite.orgId,
      joinedAt: serverTimestamp(),
    });

    // Daveti kabul edildi olarak işaretle
    await updateDoc(inviteDoc.ref, { status: 'accepted' });

    // currentOrgId güncelle
    await updateDoc(doc(db, 'admins', currentUser.uid), {
      currentOrgId: invite.orgId,
    });

    success('Kuruma Katıldınız', `"${invite.orgName}" kurumuna katıldınız`);
    return invite.orgId;
  }, [currentUser, adminData, success]);

  const deleteOrg = useCallback(async () => {
    if (!currentOrg || !currentUser || !canDo('delete_org')) {
      showError('Yetki Yok', 'Kurumu yalnızca sahip silebilir');
      return;
    }

    // Tüm üyeleri sil
    const membersSnap = await getDocs(
      query(collection(db, 'orgMembers'), where('orgId', '==', currentOrg.id))
    );
    const batch1 = writeBatch(db);
    membersSnap.docs.forEach(d => batch1.delete(d.ref));
    await batch1.commit();

    // Tüm davetleri sil
    const invitesSnap = await getDocs(
      query(collection(db, 'orgInvites'), where('orgId', '==', currentOrg.id))
    );
    const batch2 = writeBatch(db);
    invitesSnap.docs.forEach(d => batch2.delete(d.ref));
    await batch2.commit();

    // Kurumu sil
    await deleteDoc(doc(db, 'orgs', currentOrg.id));

    // Kullanıcının currentOrgId'sini temizle
    await updateDoc(doc(db, 'admins', currentUser.uid), { currentOrgId: null });

    success('Kurum Silindi', `"${currentOrg.name}" başarıyla silindi`);
    setCurrentOrg(null);
  }, [currentOrg, currentUser, canDo, showError, success]);


  return (
    <OrgContext.Provider value={{
      currentOrg, userOrgs, members, invites, loadingOrg,
      switchOrg, createOrg, updateOrg,
      inviteMember, updateMemberRole, removeMember, acceptInvite, deleteOrg,
      canDo, userRole,
    }}>
      {children}
    </OrgContext.Provider>
  );
};
