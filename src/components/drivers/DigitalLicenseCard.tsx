import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import type { Driver } from '../../types';
import { formatDate, getLicenseTypeColor } from '../../utils';
import { ShieldCheck, Zap } from 'lucide-react';

interface DigitalLicenseCardProps {
  driver: Driver;
  printRef?: React.RefObject<HTMLDivElement>;
}

export const DigitalLicenseCard: React.FC<DigitalLicenseCardProps> = ({ driver, printRef }) => {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const profileUrl = `${window.location.origin}/drivers/${driver.uid}`;

  useEffect(() => {
    if (qrRef.current) {
      QRCode.toCanvas(qrRef.current, profileUrl, {
        width: 80,
        margin: 1,
        color: { dark: '#ffffff', light: '#00000000' },
      });
    }
  }, [profileUrl]);

  const isExpired = new Date(driver.expiryDate) < new Date();
  const statusColor = driver.status === 'active' && !isExpired
    ? '#10B981'
    : driver.status === 'suspended'
    ? '#F59E0B'
    : '#EF4444';

  return (
    <motion.div
      ref={printRef as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        border: '1px solid rgba(37, 99, 235, 0.4)',
        boxShadow: '0 0 40px rgba(37, 99, 235, 0.2), 0 20px 60px rgba(0,0,0,0.5)',
        aspectRatio: '1.586 / 1',
      }}
    >
      {/* Glowing orbs */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-500/15 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

      {/* Decorative lines */}
      <div className="absolute inset-0 opacity-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-white"
            style={{ top: `${i * 14 + 5}%`, left: '0', right: '0' }}
          />
        ))}
      </div>

      <div className="relative p-5 h-full flex flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-primary-400 tracking-widest uppercase">DriveCore</p>
              <p className="text-[8px] text-white/30 tracking-wider">Sürücü Belgesi</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-[9px] font-semibold" style={{ color: statusColor }}>
              {driver.status === 'active' && !isExpired ? 'AKTİF' : driver.status === 'suspended' ? 'ASKIDA' : 'GEÇERSİZ'}
            </span>
          </div>
        </div>

        {/* Middle row - main info */}
        <div className="flex items-center gap-4">
          {/* Photo */}
          <div
            className="w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0"
            style={{ borderColor: 'rgba(37, 99, 235, 0.5)' }}
          >
            {driver.profilePhoto ? (
              <img src={driver.profilePhoto} alt={driver.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-600/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-400">{driver.fullName[0]}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-wider">Ad Soyad</p>
              <p className="text-sm font-bold text-white leading-tight truncate">{driver.fullName}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div>
                <p className="text-[8px] text-white/30 uppercase tracking-wider">Ehliyet No</p>
                <p className="text-[10px] font-mono font-semibold text-white/80">{driver.licenseNumber}</p>
              </div>
              <div>
                <p className="text-[8px] text-white/30 uppercase tracking-wider">Sınıf</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getLicenseTypeColor(driver.licenseType)}`}>
                  {driver.licenseType}
                </span>
              </div>
              <div>
                <p className="text-[8px] text-white/30 uppercase tracking-wider">Veriliş</p>
                <p className="text-[10px] text-white/70">{formatDate(driver.issueDate)}</p>
              </div>
              <div>
                <p className="text-[8px] text-white/30 uppercase tracking-wider">Son Tarih</p>
                <p className="text-[10px] text-white/70">{formatDate(driver.expiryDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              <ShieldCheck size={10} className="text-primary-400" />
              <p className="text-[8px] text-white/30">Doğrulanmış Dijital Belge</p>
            </div>
            <p className="text-[8px] font-mono text-white/20 tracking-widest">
              {driver.uid.slice(0, 16).toUpperCase()}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex-shrink-0 p-1 rounded-lg bg-black/40 border border-white/10">
            <canvas ref={qrRef} width={60} height={60} style={{ display: 'block' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
