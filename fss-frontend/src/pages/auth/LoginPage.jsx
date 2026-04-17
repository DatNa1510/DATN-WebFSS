import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import useAuthStore from '../../store/authStore';
import { DEFAULT_AVATARS } from '../../store/authStore';

export default function LoginPage() {
  const [formData, setFormData] = useState({ fss_identity: '', fss_secret: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login, googleLogin, resendVerification, authError, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Đảm bảo xóa trắng form ngay khi vào trang, kể cả khi trình duyệt cố điền
  useEffect(() => {
    const timer = setTimeout(() => {
      setFormData({ fss_identity: '', fss_secret: '' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    clearError();
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Gọi API thực tế thông qua Zustand store
    const result = await login(formData.fss_identity, formData.fss_secret);
    setLoading(false);
    if (result.success) {
      navigate(result.role === 'admin' ? '/admin' : '/');
    }
  };

  const handleResend = async () => {
    if (!formData.fss_identity) return;
    setResendLoading(true);
    const result = await resendVerification(formData.fss_identity);
    setResendLoading(false);
    if (result.success) {
      alert("Đã gửi lại email xác thực thành công. Vui lòng kiểm tra hòm thư.");
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      // Gửi access_token lên Backend
      const result = await googleLogin(tokenResponse.access_token);
      setLoading(false);
      if (result.success) {
        navigate(result.role === 'admin' ? '/admin' : '/');
      }
    },
    onError: () => {
      clearError();
      setLoading(false);
      alert('Đăng nhập Google thất bại');
    }
  });

  const needsVerification = authError?.toLowerCase().includes("xác thực email") || authError?.toLowerCase().includes("vui lòng xác thực");

  return (
    <div className="min-h-screen flex relative bg-white">
      {/* Back to Home Button - Minimalist */}
      <Link
        to="/"
        className="absolute top-10 left-10 z-50 flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.3em] text-primary hover:opacity-100 transition-all group lg:text-white"
      >
        <div className="w-8 h-8 rounded-full border border-slate-100 lg:border-white/20 flex items-center justify-center group-hover:bg-slate-50 lg:group-hover:bg-white/10 transition-colors">
          <span className="text-lg">←</span>
        </div>
        QUAY LẠI
      </Link>

      {/* Left panel — decorative (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#00168D] via-[#1E3B87] to-[#475569] relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        {/* Animated circles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${(i + 1) * 120}px`,
              height: `${(i + 1) * 120}px`,
              top: '50%',
              left: '50%',
            }}
            animate={{ x: '-50%', y: '-50%', scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}

        {/* Logo + Content */}
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="w-28 h-28 flex items-center justify-center mb-6 transition-all duration-500">
            <img src="/logo.png" alt="FSS" className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-5xl font-bold font-display mb-4 leading-tight">Fashion<br />Shopping Sense</h1>
          <p className="text-white/70 text-lg max-w-sm mx-auto leading-relaxed">
            Nền tảng mua sắm thời trang thông minh, tích hợp AI tìm kiếm sản phẩm tương đồng.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <div className="mb-12">
            <h2 className="text-[24px] text-headline leading-tight mb-2 uppercase">ĐĂNG NHẬP</h2>
            <p className="text-[15px] text-muted-foreground font-medium">Chào mừng bạn trở lại với gia đình FSS.</p>
          </div>

          <form id="login-form" onSubmit={handleSubmit} className="relative z-10 w-full">
            {/* Decoy inputs to trap browser auto-fill */}
            <div style={{ position: 'absolute', opacity: 0, height: 0, overflow: 'hidden', zIndex: -1 }}>
              <input type="text" name="email" tabIndex="-1" />
              <input type="password" name="password" tabIndex="-1" />
            </div>

            {/* Email */}
            <div className="group mt-12 first:mt-0">
              <label
                htmlFor="fss_identity"
                className="text-label opacity-60 group-focus-within:opacity-100 transition-opacity block mb-0.5"
              >
                EMAIL
              </label>
              <input
                id="fss_identity"
                type="text"
                name="fss_identity"
                required
                autoComplete="new-password"
                placeholder="Nhập email của bạn"
                value={formData.fss_identity}
                onChange={handleChange}
                className="w-full border-b-2 border-slate-100 bg-transparent pt-1 pb-3 text-[15px] font-medium focus:outline-none focus:border-primary transition-all placeholder:text-slate-200 rounded-sm"
              />
            </div>

            {/* Password */}
            <div className="group mt-14">
              <div className="flex items-center justify-between font-bold text-primary mb-0.5">
                <label
                  htmlFor="fss_secret"
                  className="text-label opacity-60 group-focus-within:opacity-100 transition-opacity block"
                >
                  MẬT KHẨU
                </label>
                <Link to="/forgot-password" size="sm" className="text-[12px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors">QUÊN MẬT KHẨU?</Link>
              </div>
              <div className="relative">
                <input
                  id="fss_secret"
                  type={showPassword ? 'text' : 'password'}
                  name="fss_secret"
                  required
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu của bạn"
                  value={formData.fss_secret}
                  onChange={handleChange}
                  className="w-full border-b-2 border-slate-100 bg-transparent pt-1 pb-3 pr-10 text-[15px] font-medium focus:outline-none focus:border-primary transition-all placeholder:text-slate-200 rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors z-10"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="mt-8">
                <p className="text-[13px] font-bold text-rose-500 bg-rose-50 p-3 rounded-sm border-l-2 border-rose-500">{authError}</p>
                {needsVerification && (
                  <button 
                    type="button" 
                    onClick={handleResend}
                    disabled={resendLoading || !formData.fss_identity}
                    className="mt-3 text-[12px] font-bold text-primary uppercase hover:underline disabled:opacity-50"
                  >
                    {resendLoading ? 'Đang gửi...' : 'GỬI LẠI EMAIL XÁC THỰC'}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-10">
              <motion.button
                whileTap={{ scale: 0.98 }}
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="flex-[1.2] py-3.5 bg-primary text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-none hover:bg-secondary transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> ĐANG XỬ LÝ...</>
                ) : 'ĐĂNG NHẬP'}
              </motion.button>

              <Link
                to="/register"
                className="flex-1 py-3.5 border border-primary/20 text-primary text-[13px] font-black uppercase tracking-[0.2em] rounded-none hover:border-primary transition-all flex items-center justify-center"
              >
                ĐĂNG KÝ
              </Link>
            </div>

            {/* Bấm vào đây để đăng nhập bằng Google */}
            <div className="relative mt-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[11px] font-bold tracking-widest uppercase">
                <span className="px-4 bg-white text-muted-foreground/50">HOẶC TIẾP TỤC VỚI</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-none text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Google
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
