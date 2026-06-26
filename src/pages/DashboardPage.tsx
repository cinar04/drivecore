import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import { useDrivers } from '../hooks/useDrivers';
import { useVehicles } from '../hooks/useVehicles';
import { useActivityLog } from '../hooks/useActivityLog';
import { useOrg } from '../context/OrgContext';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import { WIDGET_REGISTRY } from '../lib/dashboardWidgets';
import { widgetSpanClass } from '../components/dashboard/gridUtils';
import { DashboardEditPanel } from '../components/dashboard/DashboardEditPanel';
import {
  OrgBannerWidget, PlanUsageWidget, StatCardWidget, STAT_PRESETS,
  GrowthChartWidget, LicenseTypeChartWidget, TopDriversWidget, RecentActivityWidget,
  useStatValues,
} from '../components/dashboard/widgets';
import type { WidgetConfig, WidgetId, WidgetSize } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export const DashboardPage: React.FC = () => {
  const { currentOrg } = useOrg();
  const { drivers, loading: driversLoading } = useDrivers();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { logs, loading: logsLoading } = useActivityLog(currentOrg?.id, 10);
  const statValues = useStatValues(drivers, vehicles);

  const {
    widgets, loading: layoutLoading, isCustomized,
    setWidgets, save, resetToAccountDefault, saving,
  } = useDashboardLayout();

  const [editMode, setEditMode] = useState(false);
  const [draftWidgets, setDraftWidgets] = useState<WidgetConfig[]>(widgets);

  const loading = driversLoading || vehiclesLoading || layoutLoading;

  const enterEditMode = () => {
    setDraftWidgets(widgets);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraftWidgets(widgets);
    setEditMode(false);
  };

  const saveEdit = async () => {
    setWidgets(draftWidgets);
    await save();
    setEditMode(false);
  };

  const handleResetToAccountDefault = async () => {
    await resetToAccountDefault();
    setEditMode(false);
  };

  const renderWidget = (id: WidgetId, size: WidgetSize) => {
    switch (id) {
      case 'orgBanner':
        return <OrgBannerWidget org={currentOrg} />;
      case 'planUsage':
        return <PlanUsageWidget />;
      case 'growthChart':
        return <GrowthChartWidget drivers={drivers} vehicles={vehicles} />;
      case 'licenseTypeChart':
        return <LicenseTypeChartWidget drivers={drivers} />;
      case 'topDrivers':
        return <TopDriversWidget drivers={drivers} />;
      case 'recentActivity':
        return <RecentActivityWidget logs={logs} loading={logsLoading} />;
      default: {
        const preset = STAT_PRESETS[id];
        if (!preset) return null;
        return (
          <StatCardWidget
            {...preset}
            value={statValues[id as keyof typeof statValues] ?? 0}
            compact={size === 'small'}
          />
        );
      }
    }
  };

  const activeWidgets = editMode ? draftWidgets : widgets;
  const visibleWidgets = activeWidgets.filter(w => w.visible);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Gösterge Paneli</h1>
          {isCustomized && (
            <p className="text-xs text-white/30 mt-0.5">Bu proje için özelleştirilmiş düzen</p>
          )}
        </div>
        {!editMode && (
          <button onClick={enterEditMode} className="btn-secondary !px-3 !py-2 text-sm">
            <Settings2 size={15} /> Panoyu Düzenle
          </button>
        )}
      </div>

      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <DashboardEditPanel
              widgets={draftWidgets}
              onReorder={setDraftWidgets}
              onToggle={(id) => setDraftWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w))}
              onSizeChange={(id, size) => setDraftWidgets(prev => prev.map(w => w.id === id ? { ...w, size } : w))}
              onSave={saveEdit}
              onCancel={cancelEdit}
              onResetToAccountDefault={handleResetToAccountDefault}
              saving={saving}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-12 gap-4 items-stretch"
        >
          {visibleWidgets.map(w => {
            const meta = WIDGET_REGISTRY[w.id];
            if (!meta) return null;
            return (
              <div key={w.id} className={widgetSpanClass(w.size)}>
                {renderWidget(w.id, w.size)}
              </div>
            );
          })}
          {visibleWidgets.length === 0 && (
            <div className="col-span-2 sm:col-span-6 lg:col-span-12 text-center text-white/30 text-sm py-16">
              Tüm widget'lar gizli. "Panoyu Düzenle"den geri açabilirsin.
            </div>
          )}
        </motion.div>
      )}

      {!editMode && !loading && (
        <button onClick={enterEditMode} className="sm:hidden w-full btn-secondary justify-center">
          <Settings2 size={15} /> Panoyu Düzenle
        </button>
      )}
    </div>
  );
};
