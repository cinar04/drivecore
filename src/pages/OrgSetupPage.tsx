import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Link as LinkIcon, Zap, ArrowRight, Users, Check, LogOut } from 'lucide-react';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ui/LoadingSkeleton';
import { ImageUpload } from '../components/ui/ImageUpload';

type Mode = 'choose' | 'create' | 'join';

export const OrgSetupPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('choose');
  const [orgName, setOrgName] = useState('');
  const [orgLogo, setOrgLogo] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [loading, setLoading] = useState(false);

  const { createOrg, acceptInvite, switchOrg, userOrgs } = useOrg();
  const { logout } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hasOrgs = userOrgs.length > 0;

  // URL'den token varsa direkt join moduna geç
  React.useEffect(() => {
    const token = searchParams.get('token');
    if (token) { setInviteToken(token); setMode('join'); }
  }, [searchParams]);

  const handleCreate = async () => {
    if (!orgName.trim()) { showError('Hata', 'Kurum adı girin'); return; }
    setLoading(true);
    try {
      await createOrg(orgName.trim(), orgLogo);
      navigate('/dashboard');
    } catch (e: unknown) {
      showError('Hata', e instanceof Error ? e.message : 'Oluşturulamadı');
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!inviteToken.trim()) { showError('Hata', 'Davet kodu girin'); return; }
    setLoading(true);
    try {
      await acceptInvite(inviteToken.trim());
      navigate('/dashboard');
    } catch (e: unknown) {
      showError('Geçersiz Davet', e instanceof Error ? e.message : 'Davet bulunamadı');
    } finally { setLoading(false); }
  };

  const handleSelectOrg = async (orgId: string) => {
    await switchOrg(orgId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4"
            style={{ boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}
          >
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
            DriveCore
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {hasOrgs ? 'Kurumunuzu seçin veya yeni bir işlem yapın' : 'Başlamak için bir kurum oluşturun ya da katılın'}
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ─── CHOOSE mode ─── */}
          {mode === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="space-y-4"
            >
              {/* Mevcut kurumlar */}
              {hasOrgs && (
                <div className="glass-card border border-white/15 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
                    <Building2 size={14} className="text-white/40" />
                    <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Üye Olduğunuz Kurumlar
                    </span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {userOrgs.map(org => (
                      <motion.button
                        key={org.id}
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                        onClick={() => handleSelectOrg(org.id)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors group"
                      >
                        <div className="w-11 h-11 rounded-xl bg-primary-600/20 border border-primary-500/25 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {org.logo ? (
                            <img src={org.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-bold text-primary-400">
                              {org.name[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{org.name}</p>
                          <p className="text-xs text-white/35 mt-0.5">
                            {org.plan === 'free' ? 'Ücretsiz Plan' : org.plan === 'pro' ? 'Pro Plan' : 'Kurumsal Plan'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Giriş Yap
                          </span>
                          <ArrowRight size={15} className="text-white/20 group-hover:text-primary-400 transition-colors" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Yeni işlem seçenekleri */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('create')}
                  className="glass-card border border-white/15 p-5 text-left hover:border-primary-500/40 hover:bg-primary-600/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center mb-3 group-hover:bg-primary-600/30 transition-colors">
                    <Plus size={20} className="text-primary-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">Kurum Oluştur</p>
                  <p className="text-xs text-white/35 mt-0.5">Yeni kurum aç</p>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('join')}
                  className="glass-card border border-white/15 p-5 text-left hover:border-secondary-500/40 hover:bg-secondary-500/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary-500/20 border border-secondary-500/30 flex items-center justify-center mb-3 group-hover:bg-secondary-500/30 transition-colors">
                    <LinkIcon size={20} className="text-secondary-500" />
                  </div>
                  <p className="text-sm font-semibold text-white">Daveti Kullan</p>
                  <p className="text-xs text-white/35 mt-0.5">Koda katıl</p>
                </motion.button>
              </div>

              {/* Çıkış */}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                <LogOut size={13} />
                Farklı hesapla giriş yap
              </button>
            </motion.div>
          )}

          {/* ─── CREATE mode ─── */}
          {mode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card border border-white/15 p-8 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                  <Building2 size={17} className="text-primary-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Kurum Oluştur</h2>
                  <p className="text-xs text-white/35">Siz otomatik olarak sahip (owner) olursunuz</p>
                </div>
              </div>

              <ImageUpload
                value={orgLogo}
                onChange={setOrgLogo}
                imageType="profile"
                label="Kurum Logosu"
                shape="circle"
                size="md"
                placeholder="Logo yükle"
              />

              <div>
                <label className="label">Kurum Adı *</label>
                <input
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="input-field"
                  placeholder="Örn: Acme Lojistik A.Ş."
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setMode('choose')} className="btn-secondary flex-1 justify-center">
                  ← Geri
                </button>
                <button onClick={handleCreate} disabled={loading || !orgName.trim()} className="btn-primary flex-1 justify-center">
                  {loading ? <LoadingSpinner size={16} /> : <Check size={15} />}
                  Oluştur
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── JOIN mode ─── */}
          {mode === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card border border-white/15 p-8 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary-500/20 border border-secondary-500/30 flex items-center justify-center">
                  <Users size={17} className="text-secondary-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Daveti Kullan</h2>
                  <p className="text-xs text-white/35">Davet linkinizden gelen kodu girin</p>
                </div>
              </div>

              <div>
                <label className="label">Davet Kodu *</label>
                <input
                  value={inviteToken}
                  onChange={e => setInviteToken(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  className="input-field font-mono tracking-wider"
                  placeholder="Davet kodunuzu yapıştırın"
                  autoFocus
                />
                <p className="text-xs text-white/25 mt-1.5">
                  Davet linki: <span className="font-mono">/org/join?token=...</span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setMode('choose')} className="btn-secondary flex-1 justify-center">
                  ← Geri
                </button>
                <button onClick={handleJoin} disabled={loading || !inviteToken.trim()} className="btn-primary flex-1 justify-center">
                  {loading ? <LoadingSpinner size={16} /> : <LinkIcon size={15} />}
                  Katıl
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};
