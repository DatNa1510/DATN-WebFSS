import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../../data/mockData';
import { toast } from '../../store/toastStore';
import { useNavigate } from 'react-router-dom';

export default function PaymentModal({ qrCode, onClose, amount, orderCode }) {
  const navigate = useNavigate();

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào bộ nhớ tạm');
  };

  const handleDone = () => {
    onClose();
    navigate('/profile', { state: { tab: 'orders' } });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-md overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Thanh toán đơn hàng</h3>
              <p className="text-sm text-gray-500 mt-0.5">Quét mã QR qua ứng dụng ngân hàng</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="bg-[#00168D]/5 border-2 border-[#00168D]/10 p-6 flex flex-col items-center justify-center mb-6 relative">
              <div className="bg-white p-3 shadow-sm border border-gray-100 mb-4">
                <QRCodeSVG value={qrCode} size={200} level="H" />
              </div>
              <p className="text-sm font-medium text-[#00168D] text-center">
                Mã QR sẽ tự động cập nhật trạng thái khi bạn thanh toán thành công
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 group hover:border-gray-300 transition-colors cursor-pointer" onClick={() => handleCopy(orderCode)}>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mã đơn hàng / Nội dung</p>
                  <p className="font-mono font-bold text-gray-900">{orderCode}</p>
                </div>
                <Copy size={16} className="text-gray-400 group-hover:text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 group hover:border-gray-300 transition-colors cursor-pointer" onClick={() => handleCopy(amount.toString())}>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Số tiền thanh toán</p>
                  <p className="font-bold text-blue-700 tabular-nums text-lg">{formatPrice(amount)}</p>
                </div>
                <Copy size={16} className="text-gray-400 group-hover:text-blue-600" />
              </div>
            </div>

            <button
              onClick={handleDone}
              className="w-full mt-6 py-3.5 bg-[#00168D] text-white font-bold text-[15px] hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              TÔI ĐÃ THANH TOÁN
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
