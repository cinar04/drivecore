// Cloudinary yapılandırması
// Tüm upload işlemleri useFileUpload hook'u üzerinden yapılır

export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
  folders: {
    profilePhotos: 'drivecore/profiles',
    vehicleImages: 'drivecore/vehicles',
  },
};

/**
 * Cloudinary URL'ini optimize edilmiş versiyona dönüştürür
 * @param url - Orijinal Cloudinary URL'i
 * @param options - Dönüşüm seçenekleri
 */
export const getCloudinaryUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number | 'auto';
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'thumb' | 'scale' | 'fit';
    gravity?: 'face' | 'center' | 'auto';
  } = {}
): string => {
  if (!url || !url.includes('cloudinary.com')) return url;

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
  } = options;

  // URL'i parçalara ayır
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  // Dönüşüm parametrelerini oluştur
  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);

  return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
};

/**
 * Profil fotoğrafı için optimize URL döner
 */
export const getProfileImageUrl = (url: string, size = 200): string => {
  return getCloudinaryUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'auto',
  });
};

/**
 * Araç görseli için optimize URL döner
 */
export const getVehicleImageUrl = (url: string, width = 800): string => {
  return getCloudinaryUrl(url, {
    width,
    quality: 'auto',
    format: 'auto',
    crop: 'scale',
  });
};

/**
 * Thumbnail için optimize URL döner
 */
export const getThumbnailUrl = (url: string, size = 100): string => {
  return getCloudinaryUrl(url, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  });
};
