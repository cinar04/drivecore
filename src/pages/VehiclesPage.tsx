import type { Vehicle } from '../types';
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Car, Star, Eye, Edit2, Trash2, Download } from 'lucide-react';
import { useVehicles } from '../hooks/useVehicles';
import { usePlan } from '../hooks/usePlan';
import { PlanLimitBanner } from '../components/shared/PlanLimitBanner';
import { useDrivers } from '../hooks/useDrivers';
import { useOrg } from '../context/OrgContext';
import { SearchBar, SelectFilter } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import type { VehicleFormData } from '../components/vehicles/VehicleForm';
import { TableRowSkeleton } from '../components/ui/LoadingSkeleton';
import { exportToCSV } from '../utils';


const fuelOptions = [
  { value: 'Benzin', label: 'Benzin' },
  { value: 'Dizel', label: 'Dizel' },
  { value: 'Elektrik', label: 'Elektrik' },
  { value: 'Hibrit', label: 'Hibrit' },
  { value: 'LPG', label: 'LPG' },
];

const transmissionOptions = [
  { value: 'Manuel', label: 'Manuel' },
  { value: 'Otomatik', label: 'Otomatik' },
  { value: 'Yarı Otomatik', label: 'Yarı Otomatik' },
];

export const VehiclesPage: React.FC = () => {
  const { vehicles, loading, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { drivers } = useDrivers();
  const { canDo } = useOrg();
  const isAdmin = canDo('crud');
  const { usage } = usePlan();
  const vehicleLimitReached = usage.vehicles.reached;

  const [search, setSearch] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [transmissionFilter, setTransmissionFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  const getOwnerName = (ownerId: string) =>
    drivers.find(d => d.uid === ownerId)?.fullName || 'Atanmamış';

  const filtered = useMemo(() => {
    let result = [...vehicles];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v =>
        v.vehicleName.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q)
      );
    }
    if (fuelFilter) result = result.filter(v => v.fuelType === fuelFilter);
    if (transmissionFilter) result = result.filter(v => v.transmission === transmissionFilter);
    if (sortBy === 'vehicleName') result.sort((a, b) => a.vehicleName.localeCompare(b.vehicleName, 'tr'));
    if (sortBy === 'overallPerformance') result.sort((a, b) => (b.overallPerformance || 0) - (a.overallPerformance || 0));
    if (sortBy === 'year') result.sort((a, b) => b.year - a.year);
    if (sortBy === 'mileage') result.sort((a, b) => a.mileage - b.mileage);
    return result;
  }, [vehicles, search, fuelFilter, transmissionFilter, sortBy]);

  const handleAdd = async (data: VehicleFormData) => {
    await addVehicle({ ...data, vehicleImage: data.vehicleImage || '', ownerId: data.ownerId || '' });
    setShowAddModal(false);
  };

  const handleEdit = async (data: VehicleFormData) => {
    if (!editVehicle) return;
    await updateVehicle(editVehicle.id, { ...data, vehicleImage: data.vehicleImage || '' });
    setEditVehicle(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await deleteVehicle(deleteId); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map(v => ({
        'Araç Adı': v.vehicleName,
        'Marka': v.brand,
        'Model': v.model,
        'Yıl': v.year,
        'Plaka': v.plate,
        'Renk': v.color,
        'Yakıt': v.fuelType,
        'Vites': v.transmission,
        'Kilometre': v.mileage,
        'Performans': (v.overallPerformance || 0).toFixed(1),
        'Sahip': getOwnerName(v.ownerId),
      })),
      'araclar'
    );
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Araç Yönetimi</h1>
          <p className="text-sm text-white/40 mt-1">{filtered.length} araç listeleniyor</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm"><Download size={15} />Dışa Aktar</button>
          {isAdmin && (
            <button
              onClick={() => !vehicleLimitReached && setShowAddModal(true)}
              disabled={vehicleLimitReached}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={vehicleLimitReached ? 'Plan limitine ulaşıldı' : ''}
            ><Plus size={15} />Araç Ekle</button>
          )}
        </div>
      </div>

      <PlanLimitBanner type="vehicles" />

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Araç, marka veya plaka ara..." className="flex-1 min-w-48" />
        <SelectFilter value={fuelFilter} onChange={setFuelFilter} options={fuelOptions} placeholder="Tüm Yakıtlar" />
        <SelectFilter value={transmissionFilter} onChange={setTransmissionFilter} options={transmissionOptions} placeholder="Tüm Vitesler" />
        <SelectFilter
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: 'vehicleName', label: 'Ada Göre' },
            { value: 'overallPerformance', label: 'Performansa Göre' },
            { value: 'year', label: 'Yıla Göre' },
            { value: 'mileage', label: 'Kilometreye Göre' },
          ]}
          placeholder="Sırala"
        />
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['table', 'grid'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === mode ? 'bg-primary-600 text-white' : 'text-white/40 hover:text-white'}`}
            >
              {mode === 'table' ? 'Tablo' : 'Kart'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Araç', 'Plaka', 'Teknik', 'Performans', 'Sahip', 'İşlemler'].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6}>
                    <EmptyState icon={Car} title="Araç bulunamadı"
                      action={isAdmin ? { label: 'Araç Ekle', onClick: () => setShowAddModal(true) } : undefined} />
                  </td></tr>
                ) : (
                  filtered.map(v => (
                    <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="table-row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/8">
                            {v.vehicleImage ? (
                              <img src={v.vehicleImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car size={14} className="text-white/20" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{v.vehicleName}</p>
                            <p className="text-xs text-white/30">{v.brand} {v.model} · {v.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono font-semibold text-white/80">{v.plate}</p>
                        <p className="text-xs text-white/30">{v.color}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/70">{v.fuelType} · {v.transmission}</p>
                        <p className="text-xs text-white/40">{v.horsepower} HP · {v.mileage.toLocaleString('tr')} km</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-warning fill-warning" />
                          <span className="text-sm font-semibold text-white">{(v.overallPerformance || 0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/60">{getOwnerName(v.ownerId)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/vehicles/${v.id}`}>
                            <button className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"><Eye size={14} /></button>
                          </Link>
                          {isAdmin && (
                            <>
                              <button onClick={() => setEditVehicle(v)} className="p-1.5 rounded-lg text-white/30 hover:text-primary-400 hover:bg-primary-500/10 transition-all"><Edit2 size={14} /></button>
                              <button onClick={() => setDeleteId(v.id)} className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-danger/10 transition-all"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-card p-4 space-y-3">
                  <div className="skeleton w-full h-32 rounded-xl" />
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full"><EmptyState icon={Car} title="Araç bulunamadı" /></div>
            ) : (
              filtered.map(v => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card overflow-hidden hover:border-white/15 transition-all group"
                >
                  <div className="w-full h-36 bg-white/5 relative overflow-hidden">
                    {v.vehicleImage ? (
                      <img src={v.vehicleImage} alt={v.vehicleName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car size={40} className="text-white/10" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="badge bg-black/60 text-white/70 border-white/10 text-[10px]">{v.fuelType}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{v.vehicleName}</p>
                      <p className="text-xs text-white/40">{v.brand} {v.model} · {v.year}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono font-bold text-white/70">{v.plate}</p>
                      <div className="flex items-center gap-1">
                        <Star size={11} className="text-warning fill-warning" />
                        <span className="text-xs font-semibold text-white">{(v.overallPerformance || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/30">Güç</p>
                        <p className="text-white font-medium">{v.horsepower} HP</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/30">Kilometre</p>
                        <p className="text-white font-medium">{v.mileage.toLocaleString('tr')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/30 truncate">Sahip: {getOwnerName(v.ownerId)}</p>
                    <div className="flex gap-2">
                      <Link to={`/vehicles/${v.id}`} className="flex-1">
                        <button className="w-full btn-secondary text-xs py-1.5 justify-center"><Eye size={13} />Görüntüle</button>
                      </Link>
                      {isAdmin && (
                        <>
                          <button onClick={() => setEditVehicle(v)} className="p-2 rounded-xl bg-primary-600/10 hover:bg-primary-600/20 text-primary-400"><Edit2 size={13} /></button>
                          <button onClick={() => setDeleteId(v.id)} className="p-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger"><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Araç Ekle" size="xl">
        <VehicleForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editVehicle} onClose={() => setEditVehicle(null)} title="Araç Düzenle" size="xl">
        {editVehicle && <VehicleForm defaultValues={editVehicle} onSubmit={handleEdit} onCancel={() => setEditVehicle(null)} />}
      </Modal>
      <ConfirmModal
        isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Aracı Sil" message="Bu aracı silmek istediğinize emin misiniz?"
        confirmLabel="Sil" type="danger" loading={deleteLoading}
      />
    </div>
  );
};
