import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, ShoppingBag, Package, MapPin, CreditCard, Clock, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../../config/api';
import useAuthStore from '../../store/authStore';
import { formatPrice } from '../../data/mockData';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
        });
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to fetch order', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <Package size={64} className="text-slate-200 mb-4" />
      <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy đơn hàng</h2>
      <Link to="/" className="text-primary font-bold hover:underline">Quay lại trang chủ</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full mx-auto">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="bg-white border-2 border-slate-200 p-8 sm:p-12 shadow-xl rounded-sm"
        >
          {/* Success Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
              className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle2 size={32} className="text-emerald-500" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">Đặt hàng thành công!</h1>
            <p className="text-slate-400 font-medium">Hệ thống đã nhận được đơn hàng của bạn.</p>
          </div>

          {/* Order Brief Box */}
          <div className="bg-slate-50 border-2 border-slate-200 p-6 mb-10 space-y-4 rounded-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mã đơn hàng</span>
              <span className="text-[14px] font-mono font-black text-blue-600">{order.orderCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tổng thanh toán</span>
              <span className="text-[20px] font-black text-slate-900 tabular-nums">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Info Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <MapPin size={12} /> Người nhận
              </p>
              <p className="text-[14px] font-bold text-slate-800">{order.recipientName}</p>
              <p className="text-[13px] text-slate-500">{order.recipientPhone}</p>
              <p className="text-[13px] text-slate-500 leading-snug line-clamp-2">{order.shippingAddress}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CreditCard size={12} /> Thanh toán
              </p>
              <p className="text-[14px] font-bold text-slate-800 uppercase">{order.paymentMethod}</p>
              <p className="text-[13px] text-slate-500">Giao hàng nhanh (GHN)</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link 
              to="/profile" 
              state={{ tab: 'orders' }}
              className="w-full bg-slate-900 text-white font-black py-4 flex items-center justify-center gap-2 hover:bg-blue-600 transition-all rounded-sm uppercase tracking-widest text-[13px]"
            >
              Xem danh sách đơn hàng <ChevronRight size={18} />
            </Link>
            <button 
              onClick={() => navigate('/products')}
              className="w-full border-2 border-slate-200 text-slate-500 font-bold py-4 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all rounded-sm uppercase tracking-widest text-[13px]"
            >
              <ArrowLeft size={18} /> Tiếp tục mua sắm
            </button>
          </div>
        </motion.div>

        {/* Support Link */}
        <p className="text-center mt-8 text-[13px] text-slate-400 font-medium">
          Cần hỗ trợ? Gọi ngay <span className="text-blue-600 font-bold">0858317285</span>
        </p>
      </div>
    </div>
  );
}
