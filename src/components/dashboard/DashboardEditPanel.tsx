import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Eye, EyeOff, RotateCcw, Check, X } from 'lucide-react';
import type { WidgetConfig, WidgetSize } from '../../types';
import { WIDGET_REGISTRY } from '../../lib/dashboardWidgets';

const SIZE_LABEL: Record<WidgetSize, string> = { small: 'Küçük', medium: 'Orta', large: 'Geniş' };

interface RowProps {
  widget: WidgetConfig;
  onToggle: () => void;
  onSizeChange: (size: WidgetSize) => void;
}

const WidgetRow: React.FC<RowProps> = ({ widget, onToggle, onSizeChange }) => {
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
      <button
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60 touch-none"
        aria-label="Sürükle"
      >
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

interface PanelProps {
  widgets: WidgetConfig[];
  onReorder: (widgets: WidgetConfig[]) => void;
  onToggle: (id: WidgetConfig['id']) => void;
  onSizeChange: (id: WidgetConfig['id'], size: WidgetSize) => void;
  onSave: () => void;
  onCancel: () => void;
  onResetToAccountDefault: () => void;
  saving: boolean;
}

export const DashboardEditPanel: React.FC<PanelProps> = ({
  widgets, onReorder, onToggle, onSizeChange, onSave, onCancel, onResetToAccountDefault, saving,
}) => {
  return (
    <div className="glass-card p-5 border-primary-500/20 bg-primary-600/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Panoyu Düzenle</h3>
          <p className="text-xs text-white/40 mt-0.5">Sürükleyerek sırala, boyutunu seç, göz ikonuyla aç/kapat — sadece bu projede geçerli</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="btn-secondary !px-3 !py-1.5 text-xs">
            <X size={13} /> Vazgeç
          </button>
          <button onClick={onSave} disabled={saving} className="btn-primary !px-3 !py-1.5 text-xs">
            <Check size={13} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      <Reorder.Group axis="y" values={widgets} onReorder={onReorder} className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {widgets.map(w => (
          <WidgetRow
            key={w.id}
            widget={w}
            onToggle={() => onToggle(w.id)}
            onSizeChange={(size) => onSizeChange(w.id, size)}
          />
        ))}
      </Reorder.Group>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
        <p className="text-[11px] text-white/30">Hesap genelindeki varsayılanı Ayarlar &gt; Görünüm'den değiştirebilirsin</p>
        <button onClick={onResetToAccountDefault} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
          <RotateCcw size={12} /> Hesap varsayılanına dön
        </button>
      </div>
    </div>
  );
};
