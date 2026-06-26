import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Driver } from '../../types';
import { StarRating } from '../ui/StarRating';
import { ImageUpload } from '../ui/ImageUpload';
import { LoadingSpinner } from '../ui/LoadingSkeleton';

const schema = z.object({
  fullName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli e-posta girin'),
  phone: z.string().min(10, 'Telefon numarası girin'),
  address: z.string().min(5, 'Adres girin'),
  birthDate: z.string().min(1, 'Doğum tarihi girin'),
  licenseNumber: z.string().min(5, 'Ehliyet numarası girin'),
  licenseType: z.enum(['A', 'B', 'C', 'D', 'E']),
  issueDate: z.string().min(1, 'Veriliş tarihi girin'),
  expiryDate: z.string().min(1, 'Son kullanma tarihi girin'),
  status: z.enum(['active', 'suspended', 'expired']),
  profilePhoto: z.string().optional(),
  driverRatings: z.object({
    safeDriving: z.number().min(0).max(5),
    trafficCompliance: z.number().min(0).max(5),
    parkingSkill: z.number().min(0).max(5),
    nightDriving: z.number().min(0).max(5),
    longDistanceDriving: z.number().min(0).max(5),
  }),
});

export type DriverFormData = z.infer<typeof schema>;

interface DriverFormProps {
  defaultValues?: Partial<Driver>;
  onSubmit: (data: DriverFormData) => Promise<void>;
  onCancel: () => void;
}

export const DriverForm: React.FC<DriverFormProps> = ({ defaultValues, onSubmit, onCancel }) => {
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<DriverFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: defaultValues?.fullName || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      address: defaultValues?.address || '',
      birthDate: defaultValues?.birthDate || '',
      licenseNumber: defaultValues?.licenseNumber || '',
      licenseType: defaultValues?.licenseType || 'B',
      issueDate: defaultValues?.issueDate || '',
      expiryDate: defaultValues?.expiryDate || '',
      status: defaultValues?.status || 'active',
      profilePhoto: defaultValues?.profilePhoto || '',
      driverRatings: defaultValues?.driverRatings || {
        safeDriving: 3,
        trafficCompliance: 3,
        parkingSkill: 3,
        nightDriving: 3,
        longDistanceDriving: 3,
      },
    },
  });

  const ratingFields = [
    { name: 'driverRatings.safeDriving' as const, label: 'Güvenli Sürüş' },
    { name: 'driverRatings.trafficCompliance' as const, label: 'Trafik Uyumu' },
    { name: 'driverRatings.parkingSkill' as const, label: 'Park Becerisi' },
    { name: 'driverRatings.nightDriving' as const, label: 'Gece Sürüşü' },
    { name: 'driverRatings.longDistanceDriving' as const, label: 'Uzun Mesafe' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Photo */}
      <Controller
        name="profilePhoto"
        control={control}
        render={({ field }) => (
          <ImageUpload
            value={field.value}
            onChange={field.onChange}
            imageType="profile"
            label="Profil Fotoğrafı"
            shape="circle"
            size="lg"
            placeholder="Fotoğraf yükle"
          />
        )}
      />

      {/* Personal Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Kişisel Bilgiler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ad Soyad *</label>
            <input {...register('fullName')} className="input-field" placeholder="Ad Soyad" />
            {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="label">E-posta *</label>
            <input {...register('email')} type="email" className="input-field" placeholder="ornek@email.com" />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Telefon *</label>
            <input {...register('phone')} className="input-field" placeholder="+90 5xx xxx xx xx" />
            {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="label">Doğum Tarihi *</label>
            <input {...register('birthDate')} type="date" className="input-field" />
            {errors.birthDate && <p className="text-xs text-danger mt-1">{errors.birthDate.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Adres *</label>
            <textarea {...register('address')} className="input-field resize-none" rows={2} placeholder="Adres" />
            {errors.address && <p className="text-xs text-danger mt-1">{errors.address.message}</p>}
          </div>
        </div>
      </div>

      {/* License Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Ehliyet Bilgileri</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ehliyet Numarası *</label>
            <input {...register('licenseNumber')} className="input-field" placeholder="E-12345678" />
            {errors.licenseNumber && <p className="text-xs text-danger mt-1">{errors.licenseNumber.message}</p>}
          </div>
          <div>
            <label className="label">Ehliyet Sınıfı *</label>
            <select {...register('licenseType')} className="input-field">
              {['A', 'B', 'C', 'D', 'E'].map(t => (
                <option key={t} value={t} className="bg-bg">{t} Sınıfı</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Veriliş Tarihi *</label>
            <input {...register('issueDate')} type="date" className="input-field" />
            {errors.issueDate && <p className="text-xs text-danger mt-1">{errors.issueDate.message}</p>}
          </div>
          <div>
            <label className="label">Son Kullanma Tarihi *</label>
            <input {...register('expiryDate')} type="date" className="input-field" />
            {errors.expiryDate && <p className="text-xs text-danger mt-1">{errors.expiryDate.message}</p>}
          </div>
          <div>
            <label className="label">Durum</label>
            <select {...register('status')} className="input-field">
              <option value="active" className="bg-bg">Aktif</option>
              <option value="suspended" className="bg-bg">Askıya Alındı</option>
              <option value="expired" className="bg-bg">Süresi Doldu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ratings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Sürücü Puanları</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ratingFields.map(({ name, label }) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8">
                  <span className="text-sm text-white/70">{label}</span>
                  <StarRating
                    value={field.value}
                    onChange={field.onChange}
                    size="sm"
                  />
                </div>
              )}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-white/8">
        <button type="button" onClick={onCancel} className="btn-secondary">
          İptal
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting && <LoadingSpinner size={16} />}
          {defaultValues ? 'Güncelle' : 'Ekle'}
        </button>
      </div>
    </form>
  );
};
