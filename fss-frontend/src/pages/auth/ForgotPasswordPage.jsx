import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { API_BASE } from '../../config/api';

export default function ForgotPasswordPage() {
  const { isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng kiểm tra lại mạng của bạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative bg-white">
      {/* Back to Home Button */}
      <Link
        to={isAuthenticated ? "/profile" : "/login"}
        className="absolute top-10 left-10 z-50 flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.3em] text-primary hover:opacity-100 transition-all group lg:text-white"
      >
        <div className="w-8 h-8 rounded-full border border-slate-100 lg:border-white/20 flex items-center justify-center group-hover:bg-slate-50 lg:group-hover:bg-white/10 transition-colors">
          <span className="text-lg">←</span>
        </div>
        {isAuthenticated ? "VỀ HỒ SƠ" : "VỀ ĐĂNG NHẬP"}
      </Link>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#00168D] via-[#1E3B87] to-[#475569] relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: '50%', left: '50%' }}
            animate={{ x: '-50%', y: '-50%', scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}

        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="w-28 h-28 flex items-center justify-center mb-6 transition-all duration-500">
            <img src="/logo.png" alt="FSS" className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-5xl font-bold font-display mb-4 leading-tight">Fashion<br />Shopping Sense</h1>
          <p className="text-white/70 text-lg max-w-sm mx-auto leading-relaxed">
            Nền tảng mua sắm thời trang thông minh.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm relative"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center w-full"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <h2 className="text-[24px] text-headline leading-tight mb-2 uppercase">ĐÃ GỬI EMAIL</h2>
                <p className="text-[15px] text-muted-foreground font-medium mb-8 w-full">
                  Một email khôi phục mật khẩu đã được gửi đến hộp thư của bạn. Vui lòng kiểm tra email.
                </p>
                <Link
                  to={isAuthenticated ? "/profile" : "/login"}
                  className="w-full py-3.5 bg-primary text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-none hover:bg-secondary transition-all shadow-xl shadow-primary/20 flex items-center justify-center"
                >
                  {isAuthenticated ? "QUAY LẠI HỒ SƠ" : "QUAY LẠI ĐĂNG NHẬP"}
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-12">
                  <h2 className="text-[24px] text-headline leading-tight mb-2 uppercase">KHÔI PHỤC MẬT KHẨU</h2>
                  <p className="text-[15px] text-muted-foreground font-medium">
                    Nhập email của bạn để nhận liên kết thiết lập lại mật khẩu.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 w-full">
                  {/* Email */}
                  <div className="group mt-12">
                    <label
                      htmlFor="email"
                      className="text-label opacity-60 group-focus-within:opacity-100 transition-opacity block mb-0.5"
                    >
                      ĐỊA CHỈ EMAIL
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="Nhập email của bạn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-b-2 border-slate-100 bg-transparent pt-1 pb-3 text-[15px] font-medium focus:outline-none focus:border-primary transition-all placeholder:text-slate-200 rounded-sm"
                    />
                  </div>

                  {error && (
                    <p className="text-[13px] font-bold text-rose-500 bg-rose-50 p-3 rounded-sm border-l-2 border-rose-500 mt-6">{error}</p>
                  )}

                  <div className="mt-10">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-primary text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-none hover:bg-secondary transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> ĐANG XỬ LÝ...</>
                      ) : (
                        <>GỬI YÊU CẦU <ArrowRight size={16} /></>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
