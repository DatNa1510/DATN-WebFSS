import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, CheckCircle2, Clock, AlertTriangle,
  Building2, CreditCard, FileText, ExternalLink,
  Wifi, Loader2, Banknote
} from 'lucide-react';
import { formatPrice } from '../../data/mockData';
import { toast } from '../../store/toastStore';
import useAuthStore from '../../store/authStore';
import { API_BASE } from '../../config/api';

const PAYMENT_TIMEOUT = 15 * 60; // 15 phút = 900 giây
const POLL_INTERVAL   = 3000;    // poll mỗi 3 giây

// ── Countdown hook ──────────────────────────────────────────────────────────
function useCountdown(expiresAt) {
  const calc = useCallback(() => {
    if (!expiresAt) return PAYMENT_TIMEOUT;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  }, [expiresAt]);

  const [remaining, setRemaining] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  const mm  = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss  = String(remaining % 60).padStart(2, '0');
  const pct = expiresAt ? (remaining / PAYMENT_TIMEOUT) * 100 : 100;
  return { remaining, mm, ss, pct, expired: remaining === 0 };
}

function timerColor(pct) {
  if (pct > 50) return '#10b981';
  if (pct > 20) return '#f59e0b';
  return '#ef4444';
}

// ── Main component ──────────────────────────────────────────────────────────
export default function PaymentModal({ paymentData, onClose, onPaymentConfirmed, amount, orderCode, orderId }) {
  const { token } = useAuthStore();
  const { remaining, mm, ss, pct, expired } = useCountdown(paymentData?.expiresAt);

  // Payment states: 'waiting' | 'confirmed' | 'failed'
  const [payStatus, setPayStatus] = useState('waiting');
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef(null);

  // ── Auto-poll order status ─────────────────────────────────────────────
  const pollStatus = useCallback(async () => {
    if (!orderId || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const status = data?.status || data?.order?.status;
      if (status === 'CONFIRMED' || status === 'PAID') {
        clearInterval(pollRef.current);
        setPayStatus('confirmed');
        toast.success('Thanh toán thành công! Đơn hàng đã được xác nhận.');
        onPaymentConfirmed?.();
      } else if (status === 'CANCELLED') {
        setPayStatus('failed');
        clearInterval(pollRef.current);
      }
      setPollCount(c => c + 1);
    } catch {
      // ignore network errors during poll
    }
  }, [orderId, token]);

  useEffect(() => {
    if (payStatus !== 'waiting' || expired) {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(pollStatus, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [pollStatus, payStatus, expired]);

  // Cảnh báo 2 phút còn lại
  useEffect(() => {
    if (remaining === 120) toast.error('Còn 2 phút để hoàn tất thanh toán!');
  }, [remaining]);

  // Khi QR hết hạn → tự động gọi API huỷ đơn & hoàn kho
  useEffect(() => {
    if (expired && payStatus === 'waiting' && orderId && token) {
      fetch(`${API_BASE}/api/orders/${orderId}/expire`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        console.log('Order expired and stock restored for order', orderId);
      }).catch(() => {});
    }
  }, [expired, payStatus, orderId, token]);

  const qrCode      = paymentData?.qrCode;
  const accountNum  = paymentData?.accountNumber  || '246686868';
  const accountName = paymentData?.accountName    || 'NGUYEN NGOC DAT';
  const bankName    = paymentData?.bankName       || 'Ngân hàng TMCP Quân đội (MBBank)';
  const bankCode    = paymentData?.bankCode       || 'MB';
  const content     = paymentData?.transferContent || orderCode;

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const handleUserClose = async () => {
    toast.warning('Thanh toán chưa hoàn tất. Đơn hàng của bạn đã bị hủy.');
    if (orderId && token) {
      try {
        await fetch(`${API_BASE}/api/orders/${orderId}/expire`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to auto-expire order on modal close:', err);
      }
    }
    onClose();
  };

  const color = timerColor(pct);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="bg-white w-full max-w-[600px] shadow-2xl flex flex-col overflow-hidden rounded-sm border border-slate-100"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00168D]/10 text-[#00168D] rounded-sm flex items-center justify-center shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-800 uppercase tracking-wide">
                Chuyển khoản VietQR
              </h3>
              <p className="text-[12px] text-slate-400 font-medium">Quét mã QR qua ứng dụng ngân hàng</p>
            </div>
          </div>
          <button
            onClick={handleUserClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── EXPIRED BANNER ──────────────────────────────────────────── */}
        <AnimatePresence>
          {expired && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-3"
            >
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-red-700">Mã QR đã hết hạn!</p>
                <p className="text-[11px] text-red-500">Vui lòng đóng và tạo lại đơn hàng.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 space-y-6 bg-slate-50/50">

          {/* ── QR + TIMER SECTION ───────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-white p-6 rounded-sm border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            {/* QR Code */}
            <div className={`bg-white p-3.5 shadow-sm border border-slate-100 shrink-0 self-center rounded-sm transition-all duration-300 ${expired ? 'opacity-30 grayscale' : 'hover:shadow-md'}`}>
              {qrCode ? (
                <QRCodeSVG value={qrCode} size={190} level="H" />
              ) : (
                <div className="w-[190px] h-[190px] flex items-center justify-center text-slate-300 text-xs font-bold border-2 border-dashed border-slate-200 rounded-sm">No QR</div>
              )}
            </div>

            {/* Right: timer + status + link */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
              <div className="text-center w-full">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thời gian thanh toán</p>
                <div className="text-[36px] font-black tabular-nums tracking-tight leading-none text-slate-800" style={{ color: expired ? '#ef4444' : color }}>
                  {mm}:{ss}
                </div>
              </div>

              {/* Polling status */}
              <div className="flex items-center gap-2 px-5 py-3 bg-blue-50/50 text-[#00168D] rounded-sm border border-blue-100/50 shadow-sm w-full justify-center">
                <Loader2 size={16} className="animate-spin text-[#00168D]" />
                <span className="text-[13px] font-bold">Đang chờ thanh toán...</span>
              </div>

              {/* PayOS link */}
              {paymentData?.paymentUrl && (
                <a
                  href={paymentData.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[13px] font-bold text-white bg-[#00168D] hover:bg-blue-800 transition-all duration-300 px-4 py-3 rounded-sm shadow-sm hover:shadow-md w-full justify-center"
                >
                  <ExternalLink size={14} />
                  Mở trang PayOS
                </a>
              )}
            </div>
          </div>

          {/* ── BANK INFO TABLE ──────────────────────────────────────── */}
          <div className="bg-white border border-slate-100 rounded-sm overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <InfoRow
              icon={<Building2 size={16} className="text-slate-400" />}
              label="Ngân hàng"
              value={bankName}
              badge={bankCode}
            />
            <InfoRow
              icon={<CreditCard size={16} className="text-slate-400" />}
              label="Số tài khoản"
              value={accountNum}
              copyable
              onCopy={() => copy(accountNum, 'số tài khoản')}
            />
            <InfoRow
              icon={<FileText size={16} className="text-[#00168D]" />}
              label="Nội dung CK"
              value={content}
              copyable
              highlight
              onCopy={() => copy(content, 'nội dung chuyển khoản')}
            />
            <InfoRow
              icon={<Banknote size={16} className="text-emerald-500" />}
              label="Số tiền"
              value={formatPrice(amount)}
              copyable
              onCopy={() => copy(String(amount), 'số tiền')}
              valueClass="text-blue-700 text-[17px] font-bold tabular-nums"
            />
          </div>

          {/* ── AUTO-DETECT NOTICE ───────────────────────────────────── */}
          <div className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-sm shadow-sm">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-amber-900 leading-relaxed font-medium">
              Hệ thống <strong>tự động xác nhận</strong> sau khi nhận được chuyển khoản.
              Vui lòng nhập <strong className="text-amber-900 font-bold">đúng nội dung</strong> chuyển khoản để đơn hàng được duyệt tự động.
            </p>
          </div>

          {/* ── CLOSE BUTTON ────────────────────────────────────────── */}
          <button
            onClick={handleUserClose}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-sm shadow-sm flex items-center justify-center gap-2"
          >
            Đóng & kiểm tra sau
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── InfoRow sub-component ──────────────────────────────────────────────── */
function InfoRow({ icon, label, value, badge, copyable, highlight, valueClass, onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!copyable || !onCopy) return;
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`flex items-center justify-between px-5 py-4 gap-4 transition-all duration-300 border-b border-slate-100 last:border-0
        ${highlight ? 'bg-blue-50/30 border-l-4 border-l-[#00168D]' : 'border-l-4 border-l-transparent'}
        ${copyable ? 'cursor-pointer hover:bg-slate-50 group' : ''}`}
      onClick={handleCopy}
    >
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-slate-400 group-hover:text-[#00168D] transition-colors">{icon}</span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        {badge && (
          <span className="px-2 py-0.5 bg-blue-50 text-[#00168D] text-[11px] font-bold rounded-sm tracking-wider shrink-0 border border-blue-100">
            {badge}
          </span>
        )}
        <span className={valueClass || `text-sm font-bold text-slate-700 truncate ${highlight ? 'text-[#00168D]' : ''}`}>
          {value}
        </span>
        {copyable && (
          copied
            ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            : <Copy size={16} className="text-slate-300 group-hover:text-[#00168D] shrink-0 transition-colors" />
        )}
      </div>
    </div>
  );
}
