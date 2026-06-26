import { useState, useCallback } from 'react';

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
  url: string | null;
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export const useFileUpload = () => {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    uploading: false,
    error: null,
    url: null,
  });

  const uploadFile = useCallback(async (
    file: File,
    folder: string = 'drivecore'
  ): Promise<string> => {
    // Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const err = 'Dosya boyutu 5MB\'dan küçük olmalıdır';
      setState(prev => ({ ...prev, error: err }));
      throw new Error(err);
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      const err = 'Sadece JPEG, PNG, WebP veya GIF yüklenebilir';
      setState(prev => ({ ...prev, error: err }));
      throw new Error(err);
    }

    setState({ progress: 0, uploading: true, error: null, url: null });

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', folder);
      formData.append('quality', 'auto');
      formData.append('fetch_format', 'auto');

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setState(prev => ({ ...prev, progress }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            const url: string = data.secure_url;
            setState({ progress: 100, uploading: false, error: null, url });
            resolve(url);
          } catch {
            const err = 'Yanıt işlenemedi';
            setState(prev => ({ ...prev, error: err, uploading: false }));
            reject(new Error(err));
          }
        } else {
          let err = 'Yükleme başarısız';
          try {
            const errData = JSON.parse(xhr.responseText);
            err = errData.error?.message || err;
          } catch { /* ignore */ }
          setState(prev => ({ ...prev, error: err, uploading: false }));
          reject(new Error(err));
        }
      });

      xhr.addEventListener('error', () => {
        const err = 'Ağ hatası oluştu';
        setState(prev => ({ ...prev, error: err, uploading: false }));
        reject(new Error(err));
      });

      xhr.addEventListener('abort', () => {
        const err = 'Yükleme iptal edildi';
        setState(prev => ({ ...prev, error: err, uploading: false }));
        reject(new Error(err));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  }, []);

  // Cloudinary'de silme için signed request gerekir,
  // bu yüzden sadece state'i temizliyoruz
  const deleteFile = useCallback(async (_url: string) => {
    console.info('Cloudinary silme işlemi backend üzerinden yapılmalıdır.');
  }, []);

  const reset = useCallback(() => {
    setState({ progress: 0, uploading: false, error: null, url: null });
  }, []);

  return { ...state, uploadFile, deleteFile, reset };
};
