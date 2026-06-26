import type { Vehicle } from '../types';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, User, Gauge, Fuel, Settings2, Edit2, Trash2, Hash, Palette, Zap } from 'lucide-react';
import { useVehicles } from '../hooks/useVehicles';
import { useDrivers } from '../hooks/useDrivers';
import { useOrg } from '../context/OrgContext';

import { StarRating } from '../components/ui/StarRating';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import type { VehicleFormData } from '../components/vehicles/VehicleForm';
import { PageLoader } from '../components/ui/LoadingSkeleton';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip
} from 'recharts';

const perfLabels: Record<string, string> = {
  speed: 'Hız', comfort: 'Konfor', handling: 'Kullanım',
  fuelEconomy: 'Yakıt', safety: 'Güvenlik',
  durability: 'Dayanıklılık', braking: 'Fren', technology: 'Teknoloji',
};

export const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { drivers } = useDrivers();
  const { canDo } = useOrg();
  const isAdmin = canDo('crud');

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getVehicle(id).then(v => { setVehicle(v); setLoading(false); });
  }, [id, getVehicle]);

  const owner = vehicle ? drivers.find(d => d.uid === vehicle.ownerId) : null;

  const radarData = vehicle
    ? Object.entries(vehicle.performanceRatings || {}).map(([key, value]) => ({
        subject: perfLabels[key] || key,
        value: (value as number) * 20,
        fullMark: 100,
      }))
    : [];

  const handleEdit = async (data: VehicleFormData) => {
    if (!id) return;
    await updateVehicle(id, { ...data, vehicleImage: data.vehicleImage || '' });
    const updated = await getVehicle(id);
    setVehicle(updated);
    setShowEdit(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try { await deleteVehicle(id); navigate('/vehicles'); }
    finally { setDeleteLoading(false); }
  };

  if (loading) return <PageLoader />;
  if (!vehicle) return <div className="text-center py-20 text-white/40">Araç bulunamadı</div>;

  const specs = [
    { icon: Gauge, label: 'Beygir Gücü', value: `${vehicle.horsepower} HP` },
    { icon: Settings2, label: 'Motor', value: vehicle.engineSize },
    { icon: Zap, label: 'Maks. Hız', value: `${vehicle.topSpeed} km/h` },
    { icon: Fuel, label: 'Yakıt', value: vehicle.fuelType },
    { icon: Settings2, label: 'Vites', value: vehicle.transmission },
    { icon: Gauge, label: 'Kilometre', value: `${vehicle.mileage.toLocaleString('tr')} km` },
    { icon: Palette, label: 'Renk', value: vehicle.color },
    { icon: Hash, label: 'VIN', value: vehicle.vinNumber, mono: true },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm">Araçlar</span>
        </button>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm"><Edit2 size={15} />Düzenle</button>
            <button onClick={() => setShowDelete(true)} className="btn-danger text-sm"><Trash2 size={15} />Sil</button>
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="glass-card overflow-hidden">
        <div className="h-56 bg-white/5 relative">
          {vehicle.vehicleImage ? (
            <img src={vehicle.vehicleImage} alt={vehicle.vehicleName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Settings2 size={60} className="text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{vehicle.vehicleName}</h1>
                <p className="text-white/50">{vehicle.brand} {vehicle.model} · {vehicle.year}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white font-mono">{vehicle.plate}</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <Star size={14} className="text-warning fill-warning" />
                  <span className="text-white font-semibold">{(vehicle.overallPerformance || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-5">
          {/* Specs */}
          <div className="glass-card p-5">
            <h3 className="section-title">Teknik Özellikler</h3>
            <div className="space-y-3">
              {specs.map(({ icon: Icon, label, value, mono }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2 text-white/40">
                    <Icon size={13} />
                    <span className="text-xs">{label}</span>
                  </div>
                  <span className={`text-xs font-medium text-white ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div className="glass-card p-5">
            <h3 className="section-title flex items-center gap-2">
              <User size={15} className="text-primary-400" /> Araç Sahibi
            </h3>
            {owner ? (
              <Link to={`/drivers/${owner.uid}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-all border border-white/8">
                  <div className="w-10 h-10 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center overflow-hidden">
                    {owner.profilePhoto ? (
                      <img src={owner.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary-400">{owner.fullName[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{owner.fullName}</p>
                    <p className="text-xs text-white/40">{owner.licenseType} Sınıfı · ⭐ {(owner.overallRating || 0).toFixed(1)}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="text-center py-6 text-white/20 text-sm">Sahip atanmamış</div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-5">
          {/* Performance radar */}
          <div className="glass-card p-5">
            <h3 className="section-title flex items-center gap-2">
              <Star size={15} className="text-warning" /> Performans Analizi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <Radar
                    name="Performans"
                    dataKey="value"
                    stroke="#2563EB"
                    fill="#2563EB"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    formatter={(v) => [`${((v as number) / 20).toFixed(1)}/5`, 'Puan']}
                  />
                </RadarChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                {Object.entries(vehicle.performanceRatings || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-24 flex-shrink-0">{perfLabels[key] || key}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-700"
                        style={{ width: `${((value as number) / 5) * 100}%` }}
                      />
                    </div>
                    <StarRating value={value as number} readonly size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overall score card */}
          <div className="glass-card p-5 flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary-600/20 border-2 border-primary-500/40 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-3xl font-black text-white">{(vehicle.overallPerformance || 0).toFixed(1)}</span>
              <span className="text-[10px] text-white/40">/ 5.0</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Genel Performans Skoru</h3>
              <p className="text-sm text-white/40">8 farklı kategorinin ortalaması</p>
              <div className="mt-2"><StarRating value={vehicle.overallPerformance || 0} readonly size="md" showValue /></div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Araç Düzenle" size="xl">
        <VehicleForm defaultValues={vehicle} onSubmit={handleEdit} onCancel={() => setShowEdit(false)} />
      </Modal>
      <ConfirmModal
        isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Aracı Sil" message={`"${vehicle.vehicleName}" aracını silmek istediğinize emin misiniz?`}
        confirmLabel="Sil" type="danger" loading={deleteLoading}
      />
    </motion.div>
  );
};
