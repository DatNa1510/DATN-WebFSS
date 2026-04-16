import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã xác thực hợp lệ.');
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const verifyToken = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/auth/verify?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Xác thực tài khoản thành công!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Token không hợp lệ hoặc đã hết hạn.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    };

    // Tạo một timeout nhỏ để UI không chớp tắt nếu API phản hồi quá nhanh
    setTimeout(verifyToken, 1000);
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded-xl shadow-xl shadow-slate-200/50 max-w-md w-full text-center border border-slate-100"
      >
        <div className="mb-6 flex justify-center">
          {status === 'loading' && (
            <div className="relative">
               <Loader2 className="w-20 h-20 text-primary animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
               </div>
            </div>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <XCircle className="w-24 h-24 text-rose-500 mx-auto" />
            </motion.div>
          )}
        </div>

        <h2 className={`text-2xl font-black uppercase mb-4 ${
          status === 'error' ? 'text-rose-500' : 
          status === 'success' ? 'text-green-600' : 'text-slate-800'
        }`}>
          {status === 'loading' ? 'ĐANG XÁC THỰC...' : 
           status === 'success' ? 'XÁC THỰC THÀNH CÔNG!' : 'XÁC THỰC THẤT BẠI'}
        </h2>

        <p className="text-slate-500 mb-10 text-sm leading-relaxed">
          {status === 'loading' 
            ? 'Vui lòng đợi giây lát, hệ thống đang kiểm tra thông tin của bạn. Không đóng trang này.' 
            : message}
        </p>

        {status !== 'loading' && (
          <Link
            to={status === 'success' ? "/login" : "/register"}
            className={`w-full py-3.5 flex items-center justify-center gap-2 text-[13px] font-black uppercase tracking-[0.2em] rounded-none transition-all shadow-lg ${
              status === 'success' 
                ? 'bg-primary text-white hover:bg-secondary shadow-primary/20' 
                : 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-800/20'
            }`}
          >
            {status === 'success' ? 'Tiến hành Đăng nhập' : 'Quay lại trang Đăng ký'}
          </Link>
        )}
      </motion.div>
    </div>
  );
}
