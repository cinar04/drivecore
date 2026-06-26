import type { Driver } from '../types';
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Star, Eye, Edit2, Trash2, Download } from 'lucide-react';
import { useDrivers } from '../hooks/useDrivers';
import { usePlan } from '../hooks/usePlan';
import { PlanLimitBanner } from '../components/shared/PlanLimitBanner';
import { useOrg } from '../context/OrgContext';
import { SearchBar, SelectFilter } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { DriverForm } from '../components/drivers/DriverForm';
import type { DriverFormData } from '../components/drivers/DriverForm';
import { TableRowSkeleton } from '../components/ui/LoadingSkeleton';
import { formatDate, getStatusColor, getStatusLabel, getLicenseTypeColor, exportToCSV, isLicenseExpiringSoon } from '../utils';


const licenseTypeOptions = [
  { value: 'A', label: 'A Sınıfı' },
  { value: 'B', label: 'B Sınıfı' },
  { value: 'C', label: 'C Sınıfı' },
  { value: 'D', label: 'D Sınıfı' },
  { value: 'E', label: 'E Sınıfı' },
];

const statusOptions = [
  { value: 'active', label: 'Aktif' },
  { value: 'suspended', label: 'Askıda' },
  { value: 'expired', label: 'Süresi Doldu' },
];

const sortOptions = [
  { value: 'fullName', label: 'Ada Göre' },
  { value: 'overallRating', label: 'Puana Göre' },
  { value: 'expiryDate', label: 'Son Tarihe Göre' },
  { value: 'createdAt', label: 'Eklenme Tarihine Göre' },
];

export const DriversPage: React.FC = () => {
  const { drivers, loading, addDriver, updateDriver, deleteDriver } = useDrivers();
  const { canDo } = useOrg();
  const isAdmin = canDo('crud');
  const { usage } = usePlan();
  const driverLimitReached = usage.drivers.reached;

  const [search, setSearch] = useState('');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filtered = useMemo(() => {
    let result = [...drivers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.fullName.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q) ||
        d.phone.includes(q)
      );
    }
    if (licenseTypeFilter) result = result.filter(d => d.licenseType === licenseTypeFilter);
    if (statusFilter) result = result.filter(d => d.status === statusFilter);

    result.sort((a, b) => {
      if (sortBy === 'fullName') return a.fullName.localeCompare(b.fullName, 'tr');
      if (sortBy === 'overallRating') return (b.overallRating || 0) - (a.overallRating || 0);
      return 0;
    });

    return result;
  }, [drivers, search, licenseTypeFilter, statusFilter, sortBy]);

  const handleAdd = async (data: DriverFormData) => {
    await addDriver({
      ...data,
      profilePhoto: data.profilePhoto || '',
      assignedVehicles: [],
    });
    setShowAddModal(false);
  };

  const handleEdit = async (data: DriverFormData) => {
    if (!editDriver) return;
    await updateDriver(editDriver.uid, { ...data, profilePhoto: data.profilePhoto || '' });
    setEditDriver(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteDriver(deleteId);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map(d => ({
        'Ad Soyad': d.fullName,
        'E-posta': d.email,
        'Telefon': d.phone,
        'Ehliyet No': d.licenseNumber,
        'Sınıf': d.licenseType,
        'Durum': getStatusLabel(d.status),
        'Veriliş': formatDate(d.issueDate),
        'Son Tarih': formatDate(d.expiryDate),
        'Puan': d.overallRating?.toFixed(1) || '0',
      })),
      'suruculer'
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sürücü Yönetimi</h1>
          <p className="text-sm text-white/40 mt-1">{filtered.length} sürücü listeleniyor</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm">
            <Download size={15} />
            Dışa Aktar
          </button>
          {isAdmin && (
            <button
              onClick={() => !driverLimitReached && setShowAddModal(true)}
              disabled={driverLimitReached}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={driverLimitReached ? 'Plan limitine ulaşıldı' : ''}
            >
              <Plus size={15} />
              Sürücü Ekle
            </button>
          )}
        </div>
      </div>

      <PlanLimitBanner type="drivers" />

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Ad, e-posta veya ehliyet ara..."
          className="flex-1 min-w-48"
        />
        <SelectFilter
          value={licenseTypeFilter}
          onChange={setLicenseTypeFilter}
          options={licenseTypeOptions}
          placeholder="Tüm Sınıflar"
        />
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="Tüm Durumlar"
        />
        <SelectFilter
          value={sortBy}
          onChange={setSortBy}
          options={sortOptions}
          placeholder="Sırala"
        />
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['table', 'grid'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === mode ? 'bg-primary-600 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              {mode === 'table' ? 'Tablo' : 'Kart'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['Sürücü', 'İletişim', 'Ehliyet', 'Son Tarih', 'Puan', 'Durum', 'İşlemler'].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Users}
                        title="Sürücü bulunamadı"
                        description="Arama veya filtre kriterlerinizi değiştirin"
                        action={isAdmin ? { label: 'Sürücü Ekle', onClick: () => setShowAddModal(true) } : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map(driver => (
                    <motion.tr
                      key={driver.uid}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="table-row-hover"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {driver.profilePhoto ? (
                              <img src={driver.profilePhoto} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-primary-400">{driver.fullName[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{driver.fullName}</p>
                            <p className="text-xs text-white/30">{driver.address?.substring(0, 20)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/70">{driver.email}</p>
                        <p className="text-xs text-white/40">{driver.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-white/70">{driver.licenseNumber}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${getLicenseTypeColor(driver.licenseType)}`}>
                          {driver.licenseType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-xs ${isLicenseExpiringSoon(driver.expiryDate) ? 'text-warning' : 'text-white/60'}`}>
                          {formatDate(driver.expiryDate)}
                        </p>
                        {isLicenseExpiringSoon(driver.expiryDate) && (
                          <p className="text-[10px] text-warning/70">⚠ Yakın zamanda sona eriyor</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-warning fill-warning" />
                          <span className="text-sm font-semibold text-white">
                            {(driver.overallRating || 0).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={getStatusColor(driver.status)}>
                          {getStatusLabel(driver.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/drivers/${driver.uid}`}>
                            <button className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                              <Eye size={14} />
                            </button>
                          </Link>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditDriver(driver)}
                                className="p-1.5 rounded-lg text-white/30 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteId(driver.uid)}
                                className="p-1.5 rounded-lg text-white/30 hover:text-danger hover:bg-danger/10 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
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
                <div key={i} className="glass-card p-5 space-y-4">
                  <div className="flex gap-3">
                    <div className="skeleton w-14 h-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-28" />
                      <div className="skeleton h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full">
                <EmptyState icon={Users} title="Sürücü bulunamadı" />
              </div>
            ) : (
              filtered.map((driver) => (
                <motion.div
                  key={driver.uid}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-5 hover:border-white/15 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {driver.profilePhoto ? (
                        <img src={driver.profilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary-400">{driver.fullName[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{driver.fullName}</p>
                      <p className="text-xs text-white/40 truncate">{driver.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={11} className="text-warning fill-warning" />
                        <span className="text-xs font-medium text-white/70">{(driver.overallRating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <span className={getStatusColor(driver.status)}>{getStatusLabel(driver.status)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-[10px] text-white/30">Sınıf</p>
                      <p className="text-xs font-bold text-white">{driver.licenseType}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-[10px] text-white/30">Son Tarih</p>
                      <p className={`text-xs font-medium ${isLicenseExpiringSoon(driver.expiryDate) ? 'text-warning' : 'text-white'}`}>
                        {formatDate(driver.expiryDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/drivers/${driver.uid}`} className="flex-1">
                      <button className="w-full btn-secondary text-xs py-1.5 justify-center">
                        <Eye size={13} /> Görüntüle
                      </button>
                    </Link>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setEditDriver(driver)}
                          className="p-2 rounded-xl bg-primary-600/10 hover:bg-primary-600/20 text-primary-400 transition-all"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(driver.uid)}
                          className="p-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Sürücü Ekle" size="xl">
        <DriverForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editDriver} onClose={() => setEditDriver(null)} title="Sürücü Düzenle" size="xl">
        {editDriver && (
          <DriverForm defaultValues={editDriver} onSubmit={handleEdit} onCancel={() => setEditDriver(null)} />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Sürücüyü Sil"
        message="Bu sürücüyü silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
