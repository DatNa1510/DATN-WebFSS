import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Package, MapPin, CreditCard, Truck, Calendar, 
  Box, Phone, User, Clock, AlertCircle, ShoppingBag,
  ShieldCheck, Map, Receipt, CheckCircle2
} from 'lucide-react';
import { formatPrice } from '../../data/mockData';

const statusConfig = {
    PENDING: { label: 'Chờ xác nhận', color: '#2563eb', bg: 'bg-blue-50', dot: 'bg-blue-500' },
    CONFIRMED: { label: 'Đã xác nhận', color: '#059669', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    SHIPPING: { label: 'Đang giao', color: '#d97706', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    DELIVERED: { label: 'Đã hoàn thành', color: '#059669', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    CANCELLED: { label: 'Đã huỷ', color: '#dc2626', bg: 'bg-red-50', dot: 'bg-red-500' },
};

export default function OrderDetailModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const cfg = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop mờ ảo */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content - Bento Style */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-[#F8FAFC] overflow-hidden sm:rounded-sm flex flex-col shadow-2xl"
          >
            {/* ── TOP NAV ── */}
            <nav className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Package className="text-blue-600" size={20} />
                </div>
                <div>
                  <h1 className="text-[16px] font-bold text-slate-900 leading-tight">Chi tiết đơn hàng</h1>
                  <span className="text-[13px] font-bold text-blue-600 tracking-wide">{order.orderCode}</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={22} />
              </button>
            </nav>

            {/* ── SCROLLABLE CONTENT ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10 pb-28">
              
              {/* Status & Date Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-sm p-5 border-2 border-slate-200 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">TRẠNG THÁI</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${cfg.dot} animate-pulse`} />
                    <span className="text-[14px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
                <div className="bg-white rounded-sm p-5 border-2 border-slate-200 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">NGÀY ĐẶT</p>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-[14px] font-bold">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>

              {/* Product List Card */}
              <div className="bg-white rounded-sm p-5 border-2 border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <ShoppingBag size={16} className="text-slate-400" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">DANH SÁCH SẢN PHẨM</p>
                </div>
                <div className="space-y-6">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="flex gap-4 items-start group">
                      <div className="w-20 h-20 bg-slate-50 rounded-sm overflow-hidden border-2 border-slate-100 shrink-0">
                        <img src={item.productImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 flex justify-between">
                        <div>
                          <h3 className="text-[14px] font-bold text-slate-800 line-clamp-1">{item.productName}</h3>
                          <p className="text-[12px] text-slate-400 mt-1 font-medium">Size: {item.size} · SL: {item.quantity}</p>
                          <p className="text-blue-600 font-bold mt-1 text-[13px]">{formatPrice(item.unitPrice)}</p>
                        </div>
                        <p className="text-[14px] font-bold text-slate-800">{formatPrice(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Shipping */}
                <div className="bg-white rounded-sm p-5 border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={16} className="text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">THÔNG TIN GIAO HÀNG</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User size={15} className="text-slate-300" />
                      <span className="text-[13px] font-bold text-slate-700">{order.recipientName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={15} className="text-slate-300" />
                      <span className="text-[13px] font-medium text-slate-600">{order.recipientPhone}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Map size={15} className="text-slate-300 mt-0.5" />
                      <span className="text-[13px] text-slate-500 leading-relaxed font-medium">{order.shippingAddress}</span>
                    </div>
                  </div>
                </div>
                {/* Payment */}
                <div className="bg-white rounded-sm p-5 border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard size={16} className="text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">THANH TOÁN</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-slate-400 font-medium">Phương thức</span>
                      <span className="font-bold text-slate-700 uppercase">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-slate-400 font-medium">Vận chuyển</span>
                      <span className="font-bold text-slate-700">Giao hàng nhanh</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-white rounded-sm p-5 border-2 border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-slate-400 font-medium">Tạm tính</span>
                  <span className="font-bold text-slate-700">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-slate-400 font-medium">Phí vận chuyển</span>
                  <span className="font-bold text-slate-700">{formatPrice(order.shippingFee)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-[14px] pb-3 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Giảm giá</span>
                    <span className="font-bold text-emerald-600">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[16px] font-bold text-slate-800">Tổng thanh toán</span>
                  <span className="text-[22px] font-black text-blue-600 tracking-tight">{formatPrice(order.totalAmount)}</span>
                </div>

                {((order.paymentMethod === 'vietqr' || order.paymentMethod === 'momo' || order.paymentMethod === 'banking') && order.status !== 'PENDING' && order.status !== 'CANCELLED') && (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[13px] bg-emerald-50 px-2 py-1 rounded-sm w-fit">
                    <CheckCircle2 size={14} /> Đã thanh toán thành công
                  </div>
                )}

                <div className="flex items-center gap-2 text-slate-400 pt-2">
                  <Clock size={14} />
                  <span className="text-[12px] font-medium">Cập nhật lúc: {new Date(order.updatedAt || order.createdAt).toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>

            </div>

            {/* ── BOTTOM ACTION BAR ── */}
            <div className="fixed bottom-0 left-0 sm:relative w-full bg-white border-t-2 border-slate-200 p-4 shrink-0">
              <button 
                onClick={onClose}
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-sm shadow-lg hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 uppercase tracking-widest text-[13px]"
              >
                ĐÓNG
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
