import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Vehicle } from '../../types';
import { StarRating } from '../ui/StarRating';
import { ImageUpload } from '../ui/ImageUpload';
import { LoadingSpinner } from '../ui/LoadingSkeleton';
import { useDrivers } from '../../hooks/useDrivers';

const schema = z.object({
  vehicleName: z.string().min(2, 'Araç adı girin'),
  brand: z.string().min(1, 'Marka girin'),
  model: z.string().min(1, 'Model girin'),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  plate: z.string().min(5, 'Plaka girin'),
  color: z.string().min(1, 'Renk girin'),
  fuelType: z.enum(['Benzin', 'Dizel', 'Elektrik', 'Hibrit', 'LPG']),
  transmission: z.enum(['Manuel', 'Otomatik', 'Yarı Otomatik']),
  horsepower: z.coerce.number().min(1, 'Beygir gücü girin'),
  engineSize: z.string().min(1, 'Motor hacmi girin'),
  topSpeed: z.coerce.number().min(1, 'Maksimum hız girin'),
  mileage: z.coerce.number().min(0, 'Kilometre girin'),
  vinNumber: z.string().min(5, 'VIN numarası girin'),
  vehicleImage: z.string().optional(),
  ownerId: z.string().optional(),
  performanceRatings: z.object({
    speed: z.number().min(0).max(5),
    comfort: z.number().min(0).max(5),
    handling: z.number().min(0).max(5),
    fuelEconomy: z.number().min(0).max(5),
    safety: z.number().min(0).max(5),
    durability: z.number().min(0).max(5),
    braking: z.number().min(0).max(5),
    technology: z.number().min(0).max(5),
  }),
});

export type VehicleFormData = z.infer<typeof schema>;

interface VehicleFormProps {
  defaultValues?: Partial<Vehicle>;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  onCancel: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ defaultValues, onSubmit, onCancel }) => {
  const { drivers } = useDrivers();

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<VehicleFormData, unknown, VehicleFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      vehicleName: defaultValues?.vehicleName || '',
      brand: defaultValues?.brand || '',
      model: defaultValues?.model || '',
      year: defaultValues?.year || new Date().getFullYear(),
      plate: defaultValues?.plate || '',
      color: defaultValues?.color || '',
      fuelType: defaultValues?.fuelType || 'Benzin',
      transmission: defaultValues?.transmission || 'Manuel',
      horsepower: defaultValues?.horsepower || 0,
      engineSize: defaultValues?.engineSize || '',
      topSpeed: defaultValues?.topSpeed || 0,
      mileage: defaultValues?.mileage || 0,
      vinNumber: defaultValues?.vinNumber || '',
      vehicleImage: defaultValues?.vehicleImage || '',
      ownerId: defaultValues?.ownerId || '',
      performanceRatings: defaultValues?.performanceRatings || {
        speed: 3, comfort: 3, handling: 3, fuelEconomy: 3,
        safety: 3, durability: 3, braking: 3, technology: 3,
      },
    },
  });

  const perfFields = [
    { name: 'performanceRatings.speed' as const, label: 'Hız' },
    { name: 'performanceRatings.comfort' as const, label: 'Konfor' },
    { name: 'performanceRatings.handling' as const, label: 'Kullanım Kolaylığı' },
    { name: 'performanceRatings.fuelEconomy' as const, label: 'Yakıt Ekonomisi' },
    { name: 'performanceRatings.safety' as const, label: 'Güvenlik' },
    { name: 'performanceRatings.durability' as const, label: 'Dayanıklılık' },
    { name: 'performanceRatings.braking' as const, label: 'Fren Sistemi' },
    { name: 'performanceRatings.technology' as const, label: 'Teknoloji' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Vehicle Image */}
      <Controller
        name="vehicleImage"
        control={control}
        render={({ field }) => (
          <ImageUpload
            value={field.value}
            onChange={field.onChange}
            imageType="vehicle"
            label="Araç Fotoğrafı"
            shape="square"
            size="lg"
            placeholder="Araç fotoğrafı yükle"
          />
        )}
      />

      {/* Basic Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Temel Bilgiler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Araç Adı *</label>
            <input {...register('vehicleName')} className="input-field" placeholder="Örn: BMW 3 Serisi" />
            {errors.vehicleName && <p className="text-xs text-danger mt-1">{errors.vehicleName.message}</p>}
          </div>
          <div>
            <label className="label">Marka *</label>
            <input {...register('brand')} className="input-field" placeholder="Örn: BMW" />
            {errors.brand && <p className="text-xs text-danger mt-1">{errors.brand.message}</p>}
          </div>
          <div>
            <label className="label">Model *</label>
            <input {...register('model')} className="input-field" placeholder="Örn: 320i" />
            {errors.model && <p className="text-xs text-danger mt-1">{errors.model.message}</p>}
          </div>
          <div>
            <label className="label">Yıl *</label>
            <input {...register('year')} type="number" className="input-field" />
            {errors.year && <p className="text-xs text-danger mt-1">{errors.year.message}</p>}
          </div>
          <div>
            <label className="label">Plaka *</label>
            <input {...register('plate')} className="input-field uppercase" placeholder="34 ABC 1234" />
            {errors.plate && <p className="text-xs text-danger mt-1">{errors.plate.message}</p>}
          </div>
          <div>
            <label className="label">Renk *</label>
            <input {...register('color')} className="input-field" placeholder="Beyaz" />
            {errors.color && <p className="text-xs text-danger mt-1">{errors.color.message}</p>}
          </div>
          <div>
            <label className="label">Yakıt Türü</label>
            <select {...register('fuelType')} className="input-field">
              {['Benzin', 'Dizel', 'Elektrik', 'Hibrit', 'LPG'].map(f => (
                <option key={f} value={f} className="bg-bg">{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vites</label>
            <select {...register('transmission')} className="input-field">
              {['Manuel', 'Otomatik', 'Yarı Otomatik'].map(t => (
                <option key={t} value={t} className="bg-bg">{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Technical specs */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Teknik Özellikler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Beygir Gücü (HP) *</label>
            <input {...register('horsepower')} type="number" className="input-field" placeholder="184" />
            {errors.horsepower && <p className="text-xs text-danger mt-1">{errors.horsepower.message}</p>}
          </div>
          <div>
            <label className="label">Motor Hacmi *</label>
            <input {...register('engineSize')} className="input-field" placeholder="2.0L" />
            {errors.engineSize && <p className="text-xs text-danger mt-1">{errors.engineSize.message}</p>}
          </div>
          <div>
            <label className="label">Maks. Hız (km/h) *</label>
            <input {...register('topSpeed')} type="number" className="input-field" placeholder="240" />
            {errors.topSpeed && <p className="text-xs text-danger mt-1">{errors.topSpeed.message}</p>}
          </div>
          <div>
            <label className="label">Kilometre *</label>
            <input {...register('mileage')} type="number" className="input-field" placeholder="45000" />
            {errors.mileage && <p className="text-xs text-danger mt-1">{errors.mileage.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">VIN Numarası *</label>
            <input {...register('vinNumber')} className="input-field font-mono" placeholder="WBA3A5G59ENP26705" />
            {errors.vinNumber && <p className="text-xs text-danger mt-1">{errors.vinNumber.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Araç Sahibi (Sürücü)</label>
            <select {...register('ownerId')} className="input-field">
              <option value="" className="bg-bg">Atanmamış</option>
              {drivers.map(d => (
                <option key={d.uid} value={d.uid} className="bg-bg">{d.fullName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance Ratings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Performans Puanları</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {perfFields.map(({ name, label }) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8">
                  <span className="text-sm text-white/70">{label}</span>
                  <StarRating value={field.value} onChange={field.onChange} size="sm" />
                </div>
              )}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-white/8">
        <button type="button" onClick={onCancel} className="btn-secondary">İptal</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting && <LoadingSpinner size={16} />}
          {defaultValues ? 'Güncelle' : 'Ekle'}
        </button>
      </div>
    </form>
  );
};
