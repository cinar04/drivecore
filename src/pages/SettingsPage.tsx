import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Bell, Palette, Shield, Save, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { useToast } from '../context/ToastContext';
import { ImageUpload } from '../components/ui/ImageUpload';
import { LoadingSpinner } from '../components/ui/LoadingSkeleton';
import { AccountDashboardSettings } from '../components/settings/AccountDashboardSettings';
import { db } from '../lib/firebase';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Ad en az 2 karakter'),
  email: z.string().email(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, 'Yeni şifre en az 6 karakter'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export const SettingsPage: React.FC = () => {
  const { adminData, currentUser } = useAuth();
  const { currentOrg, userRole } = useOrg();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance' | 'dashboard'>('profile');
  const [photoUrl, setPhotoUrl] = useState(adminData?.profilePhoto || '');
  const [showPw, setShowPw] = useState(false);
  const [notifications, setNotifications] = useState({
    newDriver: true,
    vehicleAssigned: true,
    licenseExpiring: true,
    updates: false,
  });

  const { register: regProfile, handleSubmit: handleProfile, formState: { isSubmitting: profSub } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: adminData?.fullName || '', email: adminData?.email || '' },
  });

  const { register: regPw, handleSubmit: handlePw, reset: resetPw, formState: { errors: pwErrors, isSubmitting: pwSub } } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSaveProfile = async (data: ProfileData) => {
    try {
      if (currentUser) {
        await updateDoc(doc(db, 'admins', currentUser.uid), {
          fullName: data.fullName,
          profilePhoto: photoUrl,
        });
      }
      success('Kaydedildi', 'Profil bilgileri güncellendi');
    } catch {
      showError('Hata', 'Profil güncellenemedi');
    }
  };

  const onChangePassword = async (data: PasswordData) => {
    try {
      if (!currentUser?.email) throw new Error('Kullanıcı bulunamadı');
      const credential = EmailAuthProvider.credential(currentUser.email, data.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, data.newPassword);
      success('Şifre Değiştirildi', 'Şifreniz başarıyla güncellendi');
      resetPw();
    } catch {
      showError('Hata', 'Mevcut şifre yanlış veya bir hata oluştu');
    }
  };

  const tabs = [
    { id: 'profile' as const, icon: User, label: 'Profil' },
    { id: 'security' as const, icon: Lock, label: 'Güvenlik' },
    { id: 'notifications' as const, icon: Bell, label: 'Bildirimler' },
    { id: 'appearance' as const, icon: Palette, label: 'Görünüm' },
    { id: 'dashboard' as const, icon: LayoutGrid, label: 'Pano' },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="page-title">Ayarlar</h1>
        <p className="text-sm text-white/40 mt-1">Hesap ve uygulama tercihlerinizi yönetin</p>
      </div>

      <div className="glass-card p-1.5 flex gap-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-white/40 hover:text-white'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'profile' && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/8">
              <User size={18} className="text-primary-400" />
              <h2 className="text-base font-semibold text-white">Profil Bilgileri</h2>
            </div>

            <ImageUpload
              value={photoUrl}
              onChange={setPhotoUrl}
              imageType="profile"
              label="Profil Fotoğrafı"
              shape="circle"
              size="md"
            />

            <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Ad Soyad</label>
                  <input {...regProfile('fullName')} className="input-field" placeholder="Ad Soyad" />
                </div>
                <div>
                  <label className="label">E-posta</label>
                  <input {...regProfile('email')} type="email" className="input-field" disabled />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                <Shield size={16} className="text-primary-400" />
                <div>
                  <p className="text-xs font-medium text-white">Rol: {userRole === 'owner' ? 'Sahip' : userRole === 'admin' ? 'Yönetici' : userRole === 'staff' ? 'Personel' : 'Görüntüleyici'} · {currentOrg?.name}</p>
                  <p className="text-xs text-white/40">Bu alan yönetici tarafından değiştirilebilir</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={profSub} className="btn-primary">
                  {profSub && <LoadingSpinner size={15} />}
                  <Save size={15} /> Kaydet
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/8">
              <Lock size={18} className="text-primary-400" />
              <h2 className="text-base font-semibold text-white">Güvenlik Ayarları</h2>
            </div>

            <form onSubmit={handlePw(onChangePassword)} className="space-y-4 max-w-md">
              <div>
                <label className="label">Mevcut Şifre</label>
                <div className="relative">
                  <input {...regPw('currentPassword')} type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Yeni Şifre</label>
                <input {...regPw('newPassword')} type={showPw ? 'text' : 'password'} className="input-field" placeholder="••••••••" />
                {pwErrors.newPassword && <p className="text-xs text-danger mt-1">{pwErrors.newPassword.message}</p>}
              </div>
              <div>
                <label className="label">Yeni Şifre Tekrar</label>
                <input {...regPw('confirmPassword')} type={showPw ? 'text' : 'password'} className="input-field" placeholder="••••••••" />
                {pwErrors.confirmPassword && <p className="text-xs text-danger mt-1">{pwErrors.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={pwSub} className="btn-primary">
                {pwSub && <LoadingSpinner size={15} />}
                <Lock size={15} /> Şifreyi Değiştir
              </button>
            </form>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/8">
              <Bell size={18} className="text-primary-400" />
              <h2 className="text-base font-semibold text-white">Bildirim Tercihleri</h2>
            </div>

            <div className="space-y-3">
              {[
                { key: 'newDriver' as const, label: 'Yeni Sürücü Eklendi', desc: 'Sisteme yeni sürücü eklendiğinde bildir' },
                { key: 'vehicleAssigned' as const, label: 'Araç Atandı', desc: 'Sürücüye araç atandığında bildir' },
                { key: 'licenseExpiring' as const, label: 'Ehliyet Sona Eriyor', desc: '30 gün içinde sona erecek ehliyetler için uyar' },
                { key: 'updates' as const, label: 'Sistem Güncellemeleri', desc: 'Platform güncellemeleri hakkında bildir' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/8">
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-white/40">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifications[key] ? 'bg-primary-600' : 'bg-white/15'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${notifications[key] ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={() => success('Kaydedildi', 'Bildirim tercihleri güncellendi')} className="btn-primary">
                <Save size={15} /> Tercihleri Kaydet
              </button>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/8">
              <Palette size={18} className="text-primary-400" />
              <h2 className="text-base font-semibold text-white">Görünüm</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label mb-3">Tema</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'dark', label: 'Koyu Mod', desc: 'Varsayılan dark tema' },
                    { id: 'light', label: 'Açık Mod', desc: 'Yakında geliyor' },
                  ].map(theme => (
                    <div
                      key={theme.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        theme.id === 'dark'
                          ? 'border-primary-500 bg-primary-600/10'
                          : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className={`w-full h-16 rounded-lg mb-3 ${theme.id === 'dark' ? 'bg-bg' : 'bg-slate-100'}`} />
                      <p className="text-sm font-medium text-white">{theme.label}</p>
                      <p className="text-xs text-white/40">{theme.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/8">
                <p className="text-sm font-medium text-white mb-1">Yazı Tipi</p>
                <p className="text-xs text-white/40">Inter — Tüm ekranlarda optimize edilmiş modern sans-serif yazı tipi</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="glass-card p-6">
            <AccountDashboardSettings />
          </div>
        )}
      </motion.div>
    </div>
  );
};
