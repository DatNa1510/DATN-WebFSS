import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle2, Check } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const strengthColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500'];
const strengthLabels = ['', 'Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  return Math.min(score, 5);
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const navigate = useNavigate();
  const { register, authError, clearError } = useAuthStore();

  // Đảm bảo xóa trắng form ngay khi vào trang, kể cả khi trình duyệt cố điền
  useEffect(() => {
    setFormData({ name: '', email: '', phone: '', password: '', confirm: '' });
  }, []);

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    clearError();
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      return;
    }
    if (!agreed) return;
    setLoading(true);
    // Gọi API thực tế
    const result = await register(formData.name, formData.email, formData.password, formData.phone);
    setLoading(false);
    if (result.success) {
      setRegisterSuccess(true);
    }
  };

  const passwordMismatch = formData.confirm && formData.password !== formData.confirm;

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
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#00168D] via-[#1E3B87] to-[#475569] flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          {[80, 160, 240, 320].map((s, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 rounded-full border border-white/10"
              style={{ width: s, height: s }}
              animate={{ x: '-50%', y: '-50%', rotate: 360 }}
              transition={{ duration: 20 + i * 5, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="w-24 h-24 flex items-center justify-center mb-4 transition-all duration-500">
            <img src="/logo.png" alt="FSS" className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-4xl font-bold font-display mb-3 leading-tight">Tham gia FSS<br />ngay hôm nay!</h1>
          <p className="text-white/70 max-w-xs mx-auto text-sm leading-relaxed">
            Khám phá hàng nghìn sản phẩm thời trang và trải nghiệm AI tìm kiếm độc đáo.
          </p>
        </div>
      </div>

      {/* Right panel — form or success message */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {registerSuccess ? (
             <div className="text-center py-10 flex flex-col items-center">
               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Mail size={40} />
               </div>
               <h2 className="text-[24px] text-headline leading-tight mb-4 uppercase">KIỂM TRA HỘP THƯ</h2>
               <p className="text-[15px] text-muted-foreground font-medium mb-8 leading-relaxed">
                 Chúng tôi đã gửi một email xác nhận đến địa chỉ <strong>{formData.email}</strong>. Vui lòng kiểm tra hộp thư đến (và mục Spam) để kích hoạt tài khoản của bạn trước khi đăng nhập.
               </p>
               <Link
                 to="/login"
                 className="inline-block px-8 py-3.5 bg-primary text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-none hover:bg-secondary transition-all shadow-xl shadow-primary/20"
               >
                 ĐI ĐẾN TRANG ĐĂNG NHẬP
               </Link>
             </div>
          ) : (
            <>
              <div className="mb-12">
                <h2 className="text-[24px] text-headline leading-tight mb-2 uppercase">TẠO TÀI KHOẢN</h2>
                <p className="text-[15px] text-muted-foreground font-medium">Trở thành thành viên của gia đình FSS ngay hôm nay.</p>
              </div>

              <form id="register-form" onSubmit={handleSubmit} className="relative z-10 w-full">
                {/* Full name */}
                <div className="group first:pt-0">
                  <label htmlFor="reg-name" className="text-label opacity-60 group-focus-within:opacity-100 transition-opacity block mb-0.5">HỌ VÀ TÊN</label>
                  <input
                    id="reg-name"
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Nhập họ và tên của bạn"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border-b-2 border-slate-100 bg-transparent pt-1 pb-3 text-[15px] font-medium focus:outline-none focus:border-primary transition-all placeholder:text-slate-200 rounded-sm"
                  />
                </div>

                {/* Email */}
                <div className="group mt-12">
                  <label htmlFor="reg-email" className="text-label opacity-60 group-focus-within:opacity-100 transition-opacity block mb-0.5">EMAIL</label>
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="Nhập email của bạn"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border-b-2 border-slate-100 bg-transparent pt-1 pb-3 text-[15px] font-medium focus:outline-none focus:border-primary transition-all placeholder:text-slate-200 rounded-sm"
                  />
                </div>

                {/* Phone */}
                <div className="group mt-12">
                  <label htmlFor="reg-phone" className="text-label opacity-60 group-focus-within:opacity-100 transition-opacity block mb-0.5">SỐ ĐIỆN THOẠI</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="Nhập sđt của bạn"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border-b-2 border-slate-100 bg-transparent pt-1 pb-3 text-[15px] font-medium focus:outline-none focus:border-primary transition-all placeholder:text-slate-200 rounded-sm"
                  />
                </div>

                {/* Password */}
                <div className="group mt-12">
                  <label htmlFor="reg-password" className="text-label opacity-60 group-focus-within:opacity-100 transition-opacity block mb-0.5">MẬT KHẨU</label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      autoComplete="new-password"
                      placeholder="Nhập mật khẩu của bạn"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full border-b-2 border-slate-100 bg-transparent pt-1 pb-3 text-[15px] font-medium focus:outline-none focus:border-primary transition-all placeholder:text-slate-200 rounded-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-4 space-y-1">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div key={s} className={`h-0.5 flex-1 rounded-full transition-all ${s <= strength ? strengthColors[strength] : 'bg-slate-100'}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="group mt-12">
                  <label htmlFor="reg-confirm" className="text-label opacity-60 group-focus-within:opacity-100 transition-opacity block mb-0.5">XÁC NHẬN MẬT KHẨU</label>
                  <div className="relative">
                    <input
                      id="reg-confirm"
                      type="password"
                      name="confirm"
                      required
                      autoComplete="new-password"
                      placeholder="Nhập xác nhận mật khẩu của bạn"
                      value={formData.confirm}
                      onChange={handleChange}
                      className={`w-full border-b border-secondary/10 bg-transparent pt-2 pb-3 text-[15px] font-medium focus:outline-none transition-all placeholder:text-slate-200 rounded-none ${passwordMismatch ? 'border-rose-500' : 'border-slate-100 focus:border-primary'
                        }`}
                    />
                  </div>
                  {passwordMismatch && (
                    <p className="text-[13px] font-bold text-rose-500 mt-2 uppercase">MẬT KHẨU KHÔNG KHỚP</p>
                  )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-4 cursor-pointer group mt-8">
                  <div className="relative mt-0.5">
                    <input
                      id="reg-terms"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 rounded-sm border-2 border-slate-200 appearance-none checked:bg-primary checked:border-primary transition-all cursor-pointer"
                    />
                    {agreed && <Check size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none" />}
                  </div>
                  <span className="text-[14px] text-muted-foreground leading-relaxed font-medium">
                    Tôi đồng ý với{' '}
                    <Link to="/terms" className="text-primary font-black hover:underline underline-offset-4 decoration-1">Điều khoản sử dụng</Link>
                    {' '}và{' '}
                    <Link to="/privacy" className="text-primary font-black hover:underline underline-offset-4 decoration-1">Chính sách bảo mật</Link>
                    {' '}của FSS.
                  </span>
                </label>

                {authError && (
                  <p className="text-[13px] font-bold text-rose-500 bg-rose-50 p-3 mt-8 rounded-sm border-l-2 border-rose-500">{authError}</p>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  id="register-submit-btn"
                  type="submit"
                  disabled={loading || !agreed || passwordMismatch}
                  className="w-full py-3.5 bg-primary text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-none hover:bg-secondary transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 mt-10 disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none"
                >
                  {loading ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> ĐANG XỬ LÝ...</>
                  ) : 'ĐĂNG KÝ'}
                </motion.button>
              </form>

              <p className="mt-12 text-center text-[14px] font-medium text-muted-foreground tracking-tight pb-10">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-primary font-black hover:underline underline-offset-4 decoration-1">Đăng nhập ngay</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
