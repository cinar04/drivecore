import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trash2, Shield, Mail, Crown, Eye,
  Edit2, Copy, Check, AlertTriangle, Settings
} from 'lucide-react';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { PlanLimitBanner } from '../components/shared/PlanLimitBanner';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import type { OrgRole, OrgMember } from '../types';
import { timeAgo, formatDate } from '../utils';
import { useNavigate } from 'react-router-dom';
import { ImageUpload } from '../components/ui/ImageUpload';

const roleConfig: Record<OrgRole, { label: string; color: string; icon: React.ElementType; desc: string }> = {
  owner:  { label: 'Sahip',         color: 'bg-warning/20 text-warning border-warning/30',               icon: Crown,   desc: 'Tam yetki, kurumu silebilir' },
  admin:  { label: 'Yönetici',      color: 'bg-primary-600/20 text-primary-400 border-primary-500/30',   icon: Shield,  desc: 'Üye yönetimi, tüm CRUD' },
  staff:  { label: 'Personel',      color: 'bg-success/20 text-success border-success/30',               icon: Edit2,   desc: 'Sürücü ve araç düzenleme' },
  viewer: { label: 'Görüntüleyici', color: 'bg-white/10 text-white/55 border-white/15',                  icon: Eye,     desc: 'Yalnızca okuma' },
};

export const OrgMembersPage: React.FC = () => {
  const {
    currentOrg, members, invites,
    inviteMember, updateMemberRole, removeMember,
    deleteOrg, updateOrg,
    canDo,
  } = useOrg();
  const { currentUser } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('staff');
  const [inviteLoading, setInviteLoading] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const [showDeleteOrg, setShowDeleteOrg] = useState(false);
  const [deleteOrgLoading, setDeleteOrgLoading] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const [showEditOrg, setShowEditOrg] = useState(false);
  const [editName, setEditName] = useState(currentOrg?.name || '');
  const [editLogo, setEditLogo] = useState(currentOrg?.logo || '');
  const [editLoading, setEditLoading] = useState(false);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const canManage = canDo('manage_members');
  const { usage } = usePlan();
  const memberLimitReached = usage.members.reached;
  const canDeleteOrg = canDo('delete_org');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      await inviteMember(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setShowInvite(false);
    } finally { setInviteLoading(false); }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try { await removeMember(removeTarget.uid); }
    finally { setRemoveLoading(false); setRemoveTarget(null); }
  };

  const handleDeleteOrg = async () => {
    if (deleteConfirmName !== currentOrg?.name) return;
    setDeleteOrgLoading(true);
    try {
      await deleteOrg();
      navigate('/org/setup');
    } finally { setDeleteOrgLoading(false); setShowDeleteOrg(false); }
  };

  const handleEditOrg = async () => {
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      await updateOrg({ name: editName.trim(), logo: editLogo });
      setShowEditOrg(false);
    } finally { setEditLoading(false); }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/org/join?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    success('Kopyalandı', 'Davet linki panoya kopyalandı');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (!currentOrg) return null;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Üye Yönetimi</h1>
          <p className="text-sm text-white/40 mt-1">
            {currentOrg.name} · {members.length} üye
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button onClick={() => setShowEditOrg(true)} className="btn-secondary text-sm">
              <Settings size={14} /> Kurum Ayarları
            </button>
          )}
          {canManage && (
            <button
              onClick={() => !memberLimitReached && setShowInvite(true)}
              disabled={memberLimitReached}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={memberLimitReached ? 'Üye limitine ulaşıldı' : ''}
            >
              <Plus size={15} /> Üye Davet Et
            </button>
          )}
        </div>
      </div>

      <PlanLimitBanner type="members" />

      {/* Kurum bilgi kartı */}
      <div className="glass-card p-5 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
          {currentOrg.logo ? (
            <img src={currentOrg.logo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-primary-400">{currentOrg.name[0]}</span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-white">{currentOrg.name}</p>
          <p className="text-xs text-white/35 mt-0.5">
            {currentOrg.plan === 'free' ? 'Ücretsiz Plan' : currentOrg.plan === 'pro' ? 'Pro Plan' : 'Kurumsal Plan'}
            {' · '}Oluşturulma: {formatDate(currentOrg.createdAt)}
          </p>
        </div>
        {canDeleteOrg && (
          <button
            onClick={() => setShowDeleteOrg(true)}
            className="btn-danger text-xs py-2"
          >
            <Trash2 size={13} /> Kurumu Sil
          </button>
        )}
      </div>

      {/* Members */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
          <Users size={14} className="text-white/40" />
          <span className="text-sm font-semibold text-white/60">Aktif Üyeler</span>
          <span className="ml-auto badge badge-primary">{members.length}</span>
        </div>
        <div className="divide-y divide-white/5">
          {members.length === 0 ? (
            <EmptyState icon={Users} title="Henüz üye yok" />
          ) : (
            members.map(member => {
              const cfg = roleConfig[member.role];
              const Icon = cfg.icon;
              const isMe = member.uid === currentUser?.uid;
              const isOwner = member.role === 'owner';

              return (
                <motion.div
                  key={member.uid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/4 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary-600/20 border border-primary-500/25 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.profilePhoto ? (
                      <img src={member.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary-400">
                        {(member.fullName || member.email)[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white truncate">
                        {member.fullName || member.email}
                      </p>
                      {isMe && (
                        <span className="text-[10px] text-white/30 font-normal">(ben)</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 truncate">{member.email}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">Katılım: {timeAgo(member.joinedAt)}</p>
                  </div>

                  {/* Role badge */}
                  <span className={`badge border flex items-center gap-1.5 flex-shrink-0 ${cfg.color}`}>
                    <Icon size={10} />
                    {cfg.label}
                  </span>

                  {/* Actions */}
                  {canManage && !isOwner && !isMe && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <select
                        value={member.role}
                        onChange={e => updateMemberRole(member.uid, e.target.value as OrgRole)}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500/40 transition-all"
                      >
                        {(['admin', 'staff', 'viewer'] as OrgRole[]).map(r => (
                          <option key={r} value={r} className="bg-[#0F172A]">
                            {roleConfig[r].label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setRemoveTarget(member)}
                        className="p-1.5 rounded-lg text-white/25 hover:text-danger hover:bg-danger/10 transition-all"
                        title="Üyeyi çıkar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
            <Mail size={14} className="text-warning/60" />
            <span className="text-sm font-semibold text-white/60">Bekleyen Davetler</span>
            <span className="ml-auto badge badge-warning">{invites.length}</span>
          </div>
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {invites.map(invite => (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{invite.email}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      <span className={`inline-flex items-center gap-1 ${roleConfig[invite.role].color} badge border text-[10px] mr-1`}>
                        {roleConfig[invite.role].label}
                      </span>
                      {invite.invitedBy} tarafından
                    </p>
                  </div>
                  <button
                    onClick={() => copyInviteLink(invite.token)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/55 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                  >
                    {copiedToken === invite.token ? (
                      <><Check size={12} className="text-success" /> Kopyalandı</>
                    ) : (
                      <><Copy size={12} /> Linki Kopyala</>
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Rol açıklamaları */}
      <div className="glass-card p-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Rol Yetkileri</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.entries(roleConfig) as [OrgRole, typeof roleConfig[OrgRole]][]).map(([role, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={role} className={`flex items-start gap-2.5 p-3 rounded-xl border ${cfg.color} bg-opacity-10`}>
                <Icon size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold">{cfg.label}</p>
                  <p className="text-[11px] opacity-70 mt-0.5">{cfg.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Invite Modal ─── */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Üye Davet Et" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">E-posta Adresi *</label>
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              type="email"
              className="input-field"
              placeholder="ornek@email.com"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Rol</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as OrgRole)}
              className="input-field"
            >
              {(['admin', 'staff', 'viewer'] as OrgRole[]).map(r => (
                <option key={r} value={r} className="bg-[#0F172A]">
                  {roleConfig[r].label} — {roleConfig[r].desc}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowInvite(false)} className="btn-secondary">İptal</button>
            <button
              onClick={handleInvite}
              disabled={inviteLoading || !inviteEmail.trim()}
              className="btn-primary"
            >
              {inviteLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Mail size={14} /> Davet Gönder
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Edit Org Modal ─── */}
      <Modal isOpen={showEditOrg} onClose={() => setShowEditOrg(false)} title="Kurum Ayarları" size="sm">
        <div className="space-y-4">
          <ImageUpload
            value={editLogo}
            onChange={setEditLogo}
            imageType="profile"
            label="Kurum Logosu"
            shape="circle"
            size="md"
          />
          <div>
            <label className="label">Kurum Adı</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="input-field"
              placeholder="Kurum adı"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowEditOrg(false)} className="btn-secondary">İptal</button>
            <button
              onClick={handleEditOrg}
              disabled={editLoading || !editName.trim()}
              className="btn-primary"
            >
              {editLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Kaydet
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Remove Member Confirm ─── */}
      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Üyeyi Çıkar"
        message={`"${removeTarget?.fullName || removeTarget?.email}" adlı üyeyi kurumdan çıkarmak istediğinize emin misiniz?`}
        confirmLabel="Çıkar"
        type="danger"
        loading={removeLoading}
      />

      {/* ─── Delete Org Modal ─── */}
      <Modal isOpen={showDeleteOrg} onClose={() => { setShowDeleteOrg(false); setDeleteConfirmName(''); }} title="Kurumu Sil" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30">
            <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-danger">Bu işlem geri alınamaz!</p>
              <p className="text-xs text-white/60 mt-1">
                Kurumu sildiğinizde tüm üyelikler, davetler ve ayarlar kalıcı olarak silinir.
                Sürücü ve araç verileri Firestore'da kalır ancak kuruma erişilemez hale gelir.
              </p>
            </div>
          </div>

          <div>
            <label className="label">
              Onaylamak için kurum adını yazın:
              <span className="text-white font-semibold ml-1">"{currentOrg.name}"</span>
            </label>
            <input
              value={deleteConfirmName}
              onChange={e => setDeleteConfirmName(e.target.value)}
              className="input-field"
              placeholder={currentOrg.name}
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setShowDeleteOrg(false); setDeleteConfirmName(''); }} className="btn-secondary">
              İptal
            </button>
            <button
              onClick={handleDeleteOrg}
              disabled={deleteOrgLoading || deleteConfirmName !== currentOrg.name}
              className="px-4 py-2 rounded-xl bg-danger hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center gap-2 transition-colors"
            >
              {deleteOrgLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Trash2 size={14} /> Kurumu Kalıcı Sil
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
