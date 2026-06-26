import { useEffect, useState } from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle, X } from 'lucide-react';

type UpdateState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'downloading'; percent: number; transferred: string; total: string; speed: string }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string };

// Electron ortamında değilsek hiç render etme
const api = (window as any).electronAPI;

export function UpdateNotification() {
  const [update, setUpdate] = useState<UpdateState>({ status: 'idle' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!api) return;

    api.onUpdateChecking(() => setUpdate({ status: 'checking' }));

    api.onUpdateAvailable((d: any) => {
      setUpdate({ status: 'available', version: d.version });
      setDismissed(false);
    });

    api.onUpdateNotAvailable(() => setUpdate({ status: 'idle' }));

    api.onUpdateProgress((d: any) => {
      setUpdate({
        status: 'downloading',
        percent: d.percent,
        transferred: d.transferred,
        total: d.total,
        speed: d.speed,
      });
    });

    api.onUpdateDownloaded((d: any) => {
      setUpdate({ status: 'downloaded', version: d.version });
      setDismissed(false);
    });

    api.onUpdateError((d: any) => setUpdate({ status: 'error', message: d.message }));

    return () => api.removeUpdateListeners?.();
  }, []);

  // Gösterilecek bir şey yoksa boş dön
  if (
    !api ||
    dismissed ||
    update.status === 'idle' ||
    update.status === 'checking'
  ) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl shadow-2xl border border-white/10 overflow-hidden">
      <div className="bg-slate-800 p-4">
        {/* Güncelleme mevcut */}
        {update.status === 'available' && (
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Güncelleme Mevcut</p>
              <p className="text-xs text-slate-400 mt-0.5">v{update.version} indiriliyor...</p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* İndirme devam ediyor */}
        {update.status === 'downloading' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-blue-400 animate-bounce" />
              <p className="text-sm font-medium text-white">İndiriliyor... %{update.percent}</p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${update.percent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {update.transferred} / {update.total} · {update.speed}
            </p>
          </div>
        )}

        {/* İndirme tamamlandı */}
        {update.status === 'downloaded' && (
          <div>
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">v{update.version} Hazır</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Güncellemeyi uygulamak için yeniden başlat.
                </p>
              </div>
              <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-300 ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => api.installUpdate()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Şimdi Yeniden Başlat
            </button>
          </div>
        )}

        {/* Hata */}
        {update.status === 'error' && (
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Güncelleme Hatası</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{update.message}</p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
