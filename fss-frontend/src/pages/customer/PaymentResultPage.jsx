import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import { formatPrice } from '../../data/mockData';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, failed
  
  const resultCode = searchParams.get('resultCode');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const message = searchParams.get('message');

  // PayOS uses `code` instead of `resultCode`, and `orderCode` instead of `orderId`
  const payosCode = searchParams.get('code');
  const payosCancel = searchParams.get('cancel');
  const payosOrderId = searchParams.get('orderCode');

  useEffect(() => {
    const handlePaymentResult = async () => {
      let isSuccess = false;
      let targetOrderId = null;

      // Check MoMo
      if (resultCode !== null) {
        isSuccess = (resultCode === '0' || resultCode === '9000');
        targetOrderId = orderId ? orderId.split('_')[0] : null;
      } 
      // Check PayOS
      else if (payosCode !== null || payosCancel === 'true') {
        isSuccess = (payosCancel !== 'true' && payosCode === '00');
        targetOrderId = payosOrderId;
      }

      if (targetOrderId) {
        if (isSuccess) {
          setStatus('success');
        } else {
          setStatus('failed');
          // If payment failed/cancelled, notify backend to expire/cancel the order
          try {
            const authStorage = JSON.parse(localStorage.getItem('fss-auth'));
            const token = authStorage?.state?.token;
            if (token) {
              const res = await fetch(`http://localhost:8080/api/orders/${targetOrderId}/expire`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (res.ok) {
                import('../../store/toastStore').then(m => m.toast.info('Đơn hàng đã được hủy tự động do thanh toán không thành công.'));
              }
            }
          } catch (err) {
            console.error('Failed to notify backend about failed payment:', err);
          }
        }
      } else {
        // No valid params, might be direct access
        navigate('/');
      }
    };

    handlePaymentResult();
  }, [resultCode, payosCode, payosCancel, orderId, payosOrderId, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ type: 'spring', bounce: 0.4 }}
        className="max-w-lg w-full p-8 text-center"
      >
        <motion.div 
          initial={{ scale: 0, opacity: 0, rotate: -45 }} 
          animate={{ scale: 1, opacity: 1, rotate: 0 }} 
          transition={{ delay: 0.2, type: 'spring', bounce: 0.6, duration: 0.6 }}
          className="w-20 h-20 inline-flex items-center justify-center mb-6"
        >
          {isSuccess ? (
            <CheckCircle2 size={72} className="text-green-500 drop-shadow-sm" />
          ) : (
            <XCircle size={72} className="text-red-500 drop-shadow-sm" />
          )}
        </motion.div>

        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán không thành công'}
        </h2>
        
        <p className="text-gray-500 text-base mb-8">
          {isSuccess 
            ? 'Cảm ơn bạn đã mua sắm tại FSS. Đơn hàng của bạn đang được xử lý.' 
            : (resultCode === '1006' || payosCancel === 'true'
                ? 'Bạn đã hủy quá trình thanh toán. Đơn hàng này sẽ bị hủy tự động để hoàn lại kho hàng.' 
                : (message || 'Có lỗi xảy ra trong quá trình thanh toán hoặc giao dịch bị từ chối. Vui lòng kiểm tra lại ví MoMo của bạn.'))}
        </p>

        <div className="bg-gray-50 border border-gray-100 p-5 text-left mb-8 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mã đơn hàng</span>
            <span className="font-mono font-bold text-gray-900">{orderId || payosOrderId || 'N/A'}</span>
          </div>
          {amount && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tổng tiền</span>
              <span className="text-lg font-black text-blue-700 tabular-nums">{formatPrice(parseInt(amount))}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Link 
            to="/profile" 
            state={{ tab: 'orders' }} 
            className="w-full py-4 bg-[#00168D] text-white font-bold text-[14px] hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
          >
            XEM ĐƠN HÀNG CỦA TÔI
            <ChevronRight size={18} />
          </Link>
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold text-[14px] hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            VỀ TRANG CHỦ
          </button>
        </div>
      </motion.div>
    </div>
  );
}
