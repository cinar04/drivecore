import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Check, Settings } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';

export const OrgSwitcher: React.FC = () => {
  const { currentOrg, userOrgs, switchOrg, userRole } = useOrg();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!currentOrg) return null;

  const initial = currentOrg.name[0].toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15 transition-all"
      >
        <div className="w-7 h-7 rounded-lg bg-primary-600/30 border border-primary-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
          {currentOrg.logo ? (
            <img src={currentOrg.logo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-primary-400">{initial}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-white truncate">{currentOrg.name}</p>
          <p className="text-[10px] text-white/30 capitalize">
            {userRole === 'owner' ? 'Sahip' : userRole === 'admin' ? 'Yönetici' : userRole === 'staff' ? 'Personel' : 'Görüntüleyici'}
          </p>
        </div>
        <ChevronDown size={13} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-1.5 z-40 glass-card border border-white/15 shadow-glass overflow-hidden"
            >
              <div className="p-1.5 space-y-0.5 max-h-64 overflow-y-auto">
                {userOrgs.map(org => (
                  <button
                    key={org.id}
                    onClick={() => { switchOrg(org.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                      org.id === currentOrg.id ? 'bg-primary-600/15 border border-primary-500/20' : 'hover:bg-white/8'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {org.logo ? (
                        <img src={org.logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white/50">{org.name[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{org.name}</p>
                    </div>
                    {org.id === currentOrg.id && (
                      <Check size={13} className="text-primary-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-white/8 p-1.5 space-y-0.5">
                <button
                  onClick={() => { navigate('/org/members'); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/8 transition-all"
                >
                  <Settings size={13} /> Kurum Ayarları
                </button>
                <button
                  onClick={() => { navigate('/org/setup'); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/8 transition-all"
                >
                  <Plus size={13} /> Yeni Kurum / Katıl
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
