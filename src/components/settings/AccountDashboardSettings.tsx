import React, { useState, useEffect } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GripVertical, Eye, EyeOff, Save, LayoutGrid } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { WIDGET_REGISTRY, getDefaultDashboardPrefs, reconcileDashboardPrefs } from '../../lib/dashboardWidgets';
import type { WidgetConfig, WidgetSize, DashboardPrefs } from '../../types';

const SIZE_LABEL: Record<WidgetSize, string> = { small: 'Küçük', medium: 'Orta', large: 'Geniş' };

const Row: React.FC<{
  widget: WidgetConfig;
  onToggle: () => void;
  onSizeChange: (size: WidgetSize) => void;
}> = ({ widget, onToggle, onSizeChange }) => {
  const meta = WIDGET_REGISTRY[widget.id];
  const dragControls = useDragControls();
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <Reorder.Item
      value={widget}
      id={widget.id}
      dragListener={false}
      dragControls={dragControls}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        widget.visible ? 'bg-white/5 border-white/8' : 'bg-white/[0.02] border-white/5 opacity-50'
      }`}
    >
      <button onPointerDown={(e) => dragControls.start(e)} className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60 touch-none" aria-label="Sürükle">
        <GripVertical size={16} />
      </button>
      <div className="w-8 h-8 rounded-lg bg-primary-600/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-primary-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{meta.label}</p>
        <p className="text-xs text-white/35 truncate">{meta.description}</p>
      </div>
      {meta.allowedSizes.length > 1 && widget.visible && (
        <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-lg p-1 flex-shrink-0">
          {meta.allowedSizes.map(size => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                widget.size === size ? 'bg-primary-600 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {SIZE_LABEL[size]}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onToggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
          widget.visible ? 'text-success hover:bg-success/10' : 'text-white/25 hover:bg-white/5'
        }`}
        aria-label={widget.visible ? 'Gizle' : 'Göster'}
      >
        {widget.visible ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
    </Reorder.Item>
  );
};

export const AccountDashboardSettings: React.FC = () => {
  const { currentUser, adminData } = useAuth();
  const { success, error: showError } = useToast();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(getDefaultDashboardPrefs().widgets);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentUser) { setLoading(false); return; }
      try {
        if (adminData?.dashboardPrefs) {
          if (active) setWidgets(reconcileDashboardPrefs(adminData.dashboardPrefs).widgets);
        } else {
          const snap = await getDoc(doc(db, 'admins', currentUser.uid));
          const prefs = (snap.exists() ? snap.data().dashboardPrefs : undefined) as DashboardPrefs | undefined;
          if (active) setWidgets(reconcileDashboardPrefs(prefs).widgets);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [currentUser, adminData]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'admins', currentUser.uid), {
        dashboardPrefs: { widgets, updatedAt: serverTimestamp() },
      }, { merge: true });
      success('Kaydedildi', 'Hesap geneli pano düzeni güncellendi. Yeni projeler bu düzenle başlayacak.');
    } catch {
      showError('Hata', 'Pano düzeni kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-40 skeleton rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-white/8">
        <LayoutGrid size={18} className="text-primary-400" />
        <div>
          <h2 className="text-base font-semibold text-white">Pano Varsayılanı</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Yeni açtığın her proje bu düzenle başlar. Mevcut projelerin kendi özel düzenini etkilemez —
            bir projenin panosunu hesap varsayılanına döndürmek için o projenin "Panoyu Düzenle" panelini kullan.
          </p>
        </div>
      </div>

      <Reorder.Group axis="y" values={widgets} onReorder={setWidgets} className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {widgets.map(w => (
          <Row
            key={w.id}
            widget={w}
            onToggle={() => setWidgets(prev => prev.map(x => x.id === w.id ? { ...x, visible: !x.visible } : x))}
            onSizeChange={(size) => setWidgets(prev => prev.map(x => x.id === w.id ? { ...x, size } : x))}
          />
        ))}
      </Reorder.Group>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          <Save size={15} /> Varsayılanı Kaydet
        </button>
      </div>
    </div>
  );
};
