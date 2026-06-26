import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';
import { useFileUpload } from '../../hooks/useFileUpload';
import { CLOUDINARY_CONFIG, getProfileImageUrl, getVehicleImageUrl } from '../../lib/cloudinary';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  shape?: 'circle' | 'square';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  imageType?: 'profile' | 'vehicle' | 'default';
}

const shapeSizes = {
  circle: {
    sm: 'w-16 h-16 rounded-full',
    md: 'w-24 h-24 rounded-full',
    lg: 'w-32 h-32 rounded-full',
  },
  square: {
    sm: 'w-24 h-20 rounded-xl',
    md: 'w-44 h-36 rounded-xl',
    lg: 'w-full h-52 rounded-xl',
  },
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder,
  label,
  shape = 'square',
  size = 'md',
  placeholder = 'Görsel yükle',
  imageType = 'default',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetFolder = folder ||
    (imageType === 'profile' ? CLOUDINARY_CONFIG.folders.profilePhotos :
     imageType === 'vehicle' ? CLOUDINARY_CONFIG.folders.vehicleImages :
     'drivecore/general');

  const { uploadFile, progress, uploading, error } = useFileUpload();

  const getOptimizedUrl = (url: string) => {
    if (imageType === 'profile') return getProfileImageUrl(url, 300);
    if (imageType === 'vehicle') return getVehicleImageUrl(url, 800);
    return url;
  };

  const handleFile = useCallback(async (file: File) => {
    // Anlık önizleme
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploadSuccess(false);

    try {
      const url = await uploadFile(file, targetFolder);
      const optimized = getOptimizedUrl(url);
      setPreview(optimized);
      onChange(url); // Orijinal URL'i kaydet
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2500);
    } catch {
      setPreview(value || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadFile, targetFolder, onChange, value]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFile]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    setUploadSuccess(false);
    onChange('');
  }, [onChange]);

  const sizeClass = shapeSizes[shape][size];

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="label">{label}</label>}

      <div className="relative w-fit">
        <label
          className={cn(
            'relative cursor-pointer flex items-center justify-center overflow-hidden group',
            'border-2 border-dashed transition-all duration-200',
            dragOver
              ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
              : preview
              ? 'border-white/20 hover:border-white/40'
              : 'border-white/15 hover:border-primary-500/60 bg-white/5 hover:bg-white/8',
            sizeClass
          )}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {preview ? (
              <motion.img
                key="preview"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={preview}
                alt="Önizleme"
                className="w-full h-full object-cover"
              />
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 text-white/30 p-4 text-center"
              >
                <motion.div
                  animate={dragOver ? { scale: 1.2, color: '#2563EB' } : { scale: 1 }}
                >
                  {dragOver ? <Upload size={22} className="text-primary-500" /> : <ImageIcon size={22} />}
                </motion.div>
                <div>
                  <p className="text-xs font-medium">{placeholder}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">veya sürükle bırak</p>
                  <p className="text-[10px] text-white/15 mt-0.5">JPEG, PNG, WebP · maks 5MB</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover overlay when image exists */}
          {preview && !uploading && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
              <Upload size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          {/* Upload progress overlay */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4"
              >
                {/* Circular progress */}
                <div className="relative w-12 h-12">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                    <circle
                      cx="22" cy="22" r="18" fill="none"
                      stroke="#2563EB" strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {Math.round(progress)}%
                  </span>
                </div>
                <p className="text-xs text-white/70 text-center">
                  {progress < 100 ? 'Yükleniyor...' : 'İşleniyor...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success overlay */}
          <AnimatePresence>
            {uploadSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-success/30 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <CheckCircle size={32} className="text-success" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </label>

        {/* Remove button */}
        <AnimatePresence>
          {preview && !uploading && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-danger border-2 border-bg flex items-center justify-center hover:bg-red-600 transition-colors z-10 shadow-lg"
            >
              <X size={10} className="text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Cloudinary badge */}
      {!error && (
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 5C14 5 5 14 5 25s9 20 20 20 20-9 20-20S36 5 25 5z" fill="#3448C5" opacity="0.7"/>
          </svg>
          <p className="text-[10px] text-white/25">Cloudinary CDN üzerinden yükleniyor</p>
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5"
          >
            <AlertCircle size={12} className="text-danger flex-shrink-0" />
            <p className="text-xs text-danger">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
