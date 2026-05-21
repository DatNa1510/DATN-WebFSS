import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Search, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../../data/mockData';

// Mock data for vouchers
const VOUCHERS = [
  {
    id: 'v1',
    code: 'FSSWELCOME',
    title: 'Giảm 10%',
    desc: 'Cho đơn hàng đầu tiên',
    minOrder: 0,
    maxDiscount: 50000,
    exp: '31/12/2026',
    type: 'percent',
    value: 0.1
  },
  {
    id: 'v2',
    code: 'FREESHIP50',
    title: 'Giảm 35.000đ',
    desc: 'Phí vận chuyển cho đơn từ 500.000đ',
    minOrder: 500000,
    maxDiscount: 35000,
    exp: '30/06/2026',
    type: 'fixed',
    value: 35000
  },
  {
    id: 'v3',
    code: 'SUMMER24',
    title: 'Giảm 100.000đ',
    desc: 'Áp dụng cho đơn hàng từ 1.500.000đ',
    minOrder: 1500000,
    maxDiscount: 100000,
    exp: '15/05/2026',
    type: 'fixed',
    value: 100000
  },
  {
    id: 'v4',
    code: 'FSSVIP',
    title: 'Giảm 20%',
    desc: 'Ưu đãi đặc quyền cho khách hàng VIP',
    minOrder: 2000000,
    maxDiscount: 500000,
    exp: '31/12/2026',
    type: 'percent',
    value: 0.2
  },
  {
    id: 'v5',
    code: 'TET2026',
    title: 'Giảm 50.000đ',
    desc: 'Mừng năm mới, áp dụng mọi đơn hàng',
    minOrder: 0,
    maxDiscount: 50000,
    exp: '15/02/2026',
    type: 'fixed',
    value: 50000
  }
];

export default function VoucherModal({ isOpen, onClose, onSelect, currentSubtotal, selectedVoucher }) {
  const [inputCode, setInputCode] = useState('');

  if (!isOpen) return null;

  const validVouchers = VOUCHERS.filter(v => currentSubtotal >= v.minOrder);
  const invalidVouchers = VOUCHERS.filter(v => currentSubtotal < v.minOrder);

  const handleApplyInput = () => {
    const found = VOUCHERS.find(v => v.code === inputCode.toUpperCase());
    if (found) {
      if (currentSubtotal >= found.minOrder) {
        onSelect(found);
        onClose();
      } else {
        alert(`Đơn hàng chưa đạt tối thiểu ${formatPrice(found.minOrder)} để áp dụng mã này.`);
      }
    } else {
      alert('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  const VoucherCard = ({ voucher, isValid }) => {
    const isSelected = selectedVoucher?.id === voucher.id;

    return (
      <div 
        onClick={() => isValid && onSelect(voucher)}
        className={`relative flex items-stretch border-2 transition-all duration-300 rounded-none cursor-pointer overflow-hidden
          ${isSelected ? 'border-blue-700 bg-blue-50/50 shadow-md shadow-blue-900/10' : isValid ? 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-900/5' : 'border-slate-100 bg-slate-50 opacity-60'}
        `}
      >
        {/* Left Side: Value */}
        <div className={`w-28 shrink-0 flex flex-col items-center justify-center p-3 border-r-2 border-dashed
          ${isSelected ? 'border-blue-700 bg-[#00168D]' : isValid ? 'border-blue-200 bg-[#00168D]' : 'border-slate-200 bg-slate-400'}
        `}>
          <span className={`text-[16px] font-black text-center leading-tight ${isValid ? 'text-white' : 'text-slate-400'}`}>
            {voucher.title}
          </span>
        </div>

        {/* Right Side: Details */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-1">
            <span className={`text-[15px] font-black ${isValid ? 'text-slate-900' : 'text-slate-500'}`}>
              Mã: {voucher.code}
            </span>
            {isSelected && (
              <CheckCircle2 size={22} className="text-blue-700 shrink-0" />
            )}
          </div>
          <p className="text-[13px] text-slate-500 leading-snug mb-3">{voucher.desc}</p>
          
          <div className="flex items-center justify-between mt-auto">
            {!isValid ? (
              <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-[2px] uppercase tracking-widest border border-red-100">
                Mua thêm {formatPrice(voucher.minOrder - currentSubtotal)}
              </span>
            ) : (
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-[2px] uppercase tracking-widest border border-blue-100">
                Đủ điều kiện
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">HSD: {voucher.exp}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-[2px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-[#00168D] border-b border-gray-100">
            <h3 className="text-[18px] font-bold text-white">Chọn mã giảm giá</h3>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-[2px] transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex-1 overflow-y-auto bg-gray-50/50">
            
            {/* Manual Input */}
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 flex items-center pointer-events-none" style={{ left: '16px' }}>
                  <Tag size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Mã voucher..."
                  className="w-full border border-gray-200 pr-4 py-3 text-[14px] rounded-[2px] placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all font-medium uppercase"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
              <button 
                onClick={handleApplyInput}
                disabled={!inputCode.trim()}
                className="px-6 py-3 bg-[#00168D] text-white text-[14px] font-bold rounded-[2px] hover:bg-blue-800 transition-all disabled:bg-gray-200 disabled:text-gray-400"
              >
                Áp dụng
              </button>
            </div>

            {/* Valid Vouchers */}
            {validVouchers.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide mb-3">Mã đủ điều kiện</h4>
                <div className="space-y-3">
                  {validVouchers.map(v => (
                    <VoucherCard key={v.id} voucher={v} isValid={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Invalid Vouchers */}
            {invalidVouchers.length > 0 && (
              <div>
                <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-3">Chưa đủ điều kiện</h4>
                <div className="space-y-3">
                  {invalidVouchers.map(v => (
                    <VoucherCard key={v.id} voucher={v} isValid={false} />
                  ))}
                </div>
              </div>
            )}

          </div>
          
          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-white">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-[#00168D] text-white text-[14px] font-bold uppercase tracking-widest rounded-[2px] hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
              >
                Xác nhận
              </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
