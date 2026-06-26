import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Zap, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ui/LoadingSkeleton';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
});

type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [sent, setSent] = React.useState(false);
  const { resetPassword } = useAuth();
  const { error: showError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch {
      showError('Hata', 'Şifre sıfırlama e-postası gönderilemedi');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 glow-primary mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">DriveCore</h1>
        </div>

        <div className="glass-card border border-white/15 p-8">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-success/20 border border-success/30 flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-success" />
              </div>
              <h2 className="text-xl font-bold text-white">E-posta Gönderildi</h2>
              <p className="text-white/50 text-sm">
                Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.
              </p>
              <Link to="/login" className="btn-primary w-full justify-center mt-4 block text-center py-3">
                Giriş Sayfasına Dön
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Şifremi Unuttum</h2>
                <p className="text-white/40 text-sm">E-posta adresinizi girin, sıfırlama bağlantısı gönderelim</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">E-posta</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input {...register('email')} type="email" placeholder="ornek@email.com" className="input-field pl-9" />
                  </div>
                  {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting && <LoadingSpinner size={18} />}
                  Sıfırlama Bağlantısı Gönder
                </button>
              </form>

              <Link to="/login" className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                <ArrowLeft size={14} />
                Geri Dön
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
