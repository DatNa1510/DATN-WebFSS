import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { DEFAULT_AVATARS } from '../../store/authStore';

export default function LoginPage() {
  const [formData, setFormData] = useState({ fss_identity: '', fss_secret: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, authError, clearError } = useAuthStore();
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
    // Giả lập delay API call
    await new Promise((r) => setTimeout(r, 800));
    const result = login(formData.fss_identity, formData.fss_secret);
    setLoading(false);
    if (result.success) {
      navigate(result.role === 'admin' ? '/admin' : '/');
    }
  };



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
              <p className="text-[13px] font-bold text-rose-500 bg-rose-50 p-3 rounded-sm border-l-2 border-rose-500">{authError}</p>
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
          </form>
        </motion.div>
      </div>
    </div>
  );
}
