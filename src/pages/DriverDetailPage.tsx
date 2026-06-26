import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Car, Mail, Phone, MapPin, Calendar,
  Shield, Edit2, Trash2, CreditCard, Printer
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useDrivers } from '../hooks/useDrivers';
import { useVehicles } from '../hooks/useVehicles';
import { useOrg } from '../context/OrgContext';
import type { Driver } from '../types';
import { StarRating } from '../components/ui/StarRating';
import { DigitalLicenseCard } from '../components/drivers/DigitalLicenseCard';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { DriverForm } from '../components/drivers/DriverForm';
import type { DriverFormData } from '../components/drivers/DriverForm';
import { PageLoader } from '../components/ui/LoadingSkeleton';
import { formatDate, getStatusColor, getStatusLabel, getLicenseTypeColor, isLicenseExpiringSoon } from '../utils';

const ratingLabels: Record<string, string> = {
  safeDriving: 'Güvenli Sürüş',
  trafficCompliance: 'Trafik Uyumu',
  parkingSkill: 'Park Becerisi',
  nightDriving: 'Gece Sürüşü',
  longDistanceDriving: 'Uzun Mesafe',
};

export const DriverDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDriver, updateDriver, deleteDriver } = useDrivers();
  const { vehicles } = useVehicles();
  const { canDo } = useOrg();
  const isAdmin = canDo('crud');

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = useReactToPrint({ contentRef: printRef });

  useEffect(() => {
    if (!id) return;
    getDriver(id).then(d => {
      setDriver(d);
      setLoading(false);
    });
  }, [id, getDriver]);

  const assignedVehicles = vehicles.filter(v =>
    driver?.assignedVehicles?.includes(v.id) || v.ownerId === driver?.uid
  );

  const handleEdit = async (data: DriverFormData) => {
    if (!id) return;
    await updateDriver(id, { ...data, profilePhoto: data.profilePhoto || '' });
    const updated = await getDriver(id);
    setDriver(updated);
    setShowEdit(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await deleteDriver(id);
      navigate('/drivers');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!driver) return (
    <div className="text-center py-20 text-white/40">Sürücü bulunamadı</div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl"
    >
      {/* Back & actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Sürücüler</span>
        </button>
        <div className="flex gap-2">
          <button onClick={() => setShowLicense(true)} className="btn-secondary text-sm">
            <CreditCard size={15} /> Dijital Ehliyet
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">
                <Edit2 size={15} /> Düzenle
              </button>
              <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">
                <Trash2 size={15} /> Sil
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary-500/40 flex-shrink-0">
            {driver.profilePhoto ? (
              <img src={driver.profilePhoto} alt={driver.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-600/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-400">{driver.fullName[0]}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{driver.fullName}</h1>
              <span className={getStatusColor(driver.status)}>{getStatusLabel(driver.status)}</span>
              <span className={`badge border ${getLicenseTypeColor(driver.licenseType)}`}>
                {driver.licenseType} Sınıfı
              </span>
              {isLicenseExpiringSoon(driver.expiryDate) && (
                <span className="badge badge-warning">⚠ Yakın Süre Dolumu</span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span className="flex items-center gap-1.5 text-sm text-white/50">
                <Mail size={13} /> {driver.email}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-white/50">
                <Phone size={13} /> {driver.phone}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-white/50">
                <MapPin size={13} /> {driver.address}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-warning fill-warning" />
                <span className="text-lg font-bold text-white">{(driver.overallRating || 0).toFixed(1)}</span>
                <span className="text-white/30 text-sm">/5.0</span>
              </div>
              <StarRating value={driver.overallRating || 0} readonly size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* License info */}
          <div className="glass-card p-5">
            <h3 className="section-title flex items-center gap-2">
              <Shield size={16} className="text-primary-400" /> Ehliyet Bilgileri
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Ehliyet Numarası', value: driver.licenseNumber, mono: true },
                { label: 'Sınıf', value: `${driver.licenseType} Sınıfı` },
                { label: 'Veriliş Tarihi', value: formatDate(driver.issueDate) },
                { label: 'Son Kullanma', value: formatDate(driver.expiryDate) },
                { label: 'Doğum Tarihi', value: formatDate(driver.birthDate) },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs text-white/40">{label}</span>
                  <span className={`text-xs font-medium text-white ${mono ? 'font-mono' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ratings breakdown */}
          <div className="glass-card p-5">
            <h3 className="section-title flex items-center gap-2">
              <Star size={16} className="text-warning" /> Puanlar
            </h3>
            <div className="space-y-3">
              {Object.entries(driver.driverRatings || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-white/50 flex-1">{ratingLabels[key] || key}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full transition-all duration-500"
                        style={{ width: `${(value / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-white w-6 text-right">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Assigned vehicles */}
          <div className="glass-card p-5">
            <h3 className="section-title flex items-center gap-2">
              <Car size={16} className="text-secondary-500" /> Atanmış Araçlar
              <span className="ml-auto badge badge-secondary">{assignedVehicles.length}</span>
            </h3>
            {assignedVehicles.length === 0 ? (
              <div className="text-center py-8 text-white/20 text-sm">Atanmış araç yok</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assignedVehicles.map(vehicle => (
                  <Link key={vehicle.id} to={`/vehicles/${vehicle.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 transition-all">
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        {vehicle.vehicleImage ? (
                          <img src={vehicle.vehicleImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car size={18} className="text-white/20" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{vehicle.vehicleName}</p>
                        <p className="text-xs text-white/40">{vehicle.plate} · {vehicle.year}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={10} className="text-warning fill-warning" />
                          <span className="text-[10px] text-white/50">{(vehicle.overallPerformance || 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity history */}
          <div className="glass-card p-5">
            <h3 className="section-title flex items-center gap-2">
              <Calendar size={16} className="text-success" /> Aktivite Geçmişi
            </h3>
            {(!driver.activityHistory || driver.activityHistory.length === 0) ? (
              <div className="text-center py-8 text-white/20 text-sm">Aktivite yok</div>
            ) : (
              <div className="space-y-2">
                {driver.activityHistory.map((log, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white">{log.action}</p>
                      <p className="text-xs text-white/30">{log.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Sürücü Düzenle" size="xl">
        <DriverForm defaultValues={driver} onSubmit={handleEdit} onCancel={() => setShowEdit(false)} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Sürücüyü Sil"
        message={`"${driver.fullName}" adlı sürücüyü silmek istediğinize emin misiniz?`}
        confirmLabel="Sil"
        type="danger"
        loading={deleteLoading}
      />

      {/* Digital License Modal */}
      <Modal isOpen={showLicense} onClose={() => setShowLicense(false)} title="Dijital Ehliyet" size="sm">
        <div className="space-y-4">
          <DigitalLicenseCard driver={driver} printRef={printRef as React.RefObject<HTMLDivElement>} />
          <button onClick={handlePrint} className="btn-secondary w-full justify-center">
            <Printer size={15} /> Yazdır / İndir
          </button>
        </div>
      </Modal>
    </motion.div>
  );
};
