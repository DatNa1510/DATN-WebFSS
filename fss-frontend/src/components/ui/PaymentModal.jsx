import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, CheckCircle2, Clock, AlertTriangle,
  Building2, CreditCard, FileText, ExternalLink,
  Wifi, Loader2
} from 'lucide-react';
import { formatPrice } from '../../data/mockData';
import { toast } from '../../store/toastStore';
import useAuthStore from '../../store/authStore';

const PAYMENT_TIMEOUT = 5 * 60; // 5 phút = 300 giây
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
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
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
      fetch(`http://localhost:8080/api/orders/${orderId}/expire`, {
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

  const handleUserClose = () => {
    toast.warning('Thanh toán chưa hoàn tất. Đơn hàng của bạn chưa được thanh toán thành công!');
    onClose();
  };

  const color  = timerColor(pct);
  const radius = 30;
  const circ   = 2 * Math.PI * radius;
  const dash   = (pct / 100) * circ;

  // ── PAYMENT WAITING / EXPIRED SCREEN ──────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="bg-white w-full max-w-[460px] shadow-2xl flex flex-col overflow-hidden"
        style={{ borderRadius: 6, maxHeight: '96vh', overflowY: 'auto' }}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#00168D]/10 flex items-center justify-center">
              <CreditCard size={16} className="text-[#00168D]" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-gray-900 tracking-tight leading-none">
                Chuyển khoản ngân hàng
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Quét mã QR qua app ngân hàng</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Polling indicator */}
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              <span>Đang chờ</span>
            </div>
            <button
              onClick={handleUserClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors rounded-full"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── EXPIRED BANNER ──────────────────────────────────────────── */}
        <AnimatePresence>
          {expired && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center gap-3"
            >
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-red-700">Mã QR đã hết hạn!</p>
                <p className="text-[11px] text-red-500">Vui lòng đóng và tạo lại đơn hàng.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-5 space-y-4">

          {/* ── QR + TIMER SECTION ───────────────────────────────────── */}
          <div className="flex gap-4 items-stretch bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-100 p-4 rounded-sm">
            {/* QR Code */}
            <div className={`bg-white p-2 shadow-sm border shrink-0 self-center ${expired ? 'border-red-200 opacity-30 grayscale' : 'border-gray-100'}`}>
              {qrCode ? (
                <QRCodeSVG value={qrCode} size={140} level="H" />
              ) : (
                <div className="w-[140px] h-[140px] flex items-center justify-center text-gray-300 text-xs">No QR</div>
              )}
            </div>

            {/* Right: timer + status + link */}
            <div className="flex-1 flex flex-col items-center justify-between gap-3 py-1">
              {/* Circular countdown */}
              <div className="relative">
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r={radius} stroke="#e5e7eb" strokeWidth="5" fill="none" />
                  <circle
                    cx="40" cy="40" r={radius}
                    stroke={expired ? '#ef4444' : color}
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s linear, stroke 1s' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Clock size={12} style={{ color: expired ? '#ef4444' : color }} />
                  <span className="text-[16px] font-black tabular-nums leading-none mt-0.5" style={{ color: expired ? '#ef4444' : color }}>
                    {mm}:{ss}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-gray-400 leading-snug">
                  {expired ? 'Đã hết hạn' : <>QR hết hạn sau <span className="font-bold text-gray-600">{mm}:{ss}</span></>}
                </p>
              </div>

              {/* Polling status */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-full border border-gray-100 shadow-sm">
                <Wifi size={10} className="text-emerald-500" />
                <span className="text-[10px] text-gray-500 font-medium">Tự động xác nhận</span>
              </div>

              {/* PayOS link */}
              {paymentData?.paymentUrl && (
                <a
                  href={paymentData.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-[#00168D] hover:underline"
                >
                  <ExternalLink size={11} />
                  Mở trang PayOS
                </a>
              )}
            </div>
          </div>

          {/* ── BANK INFO TABLE ──────────────────────────────────────── */}
          <div className="border border-gray-100 divide-y divide-gray-100 rounded-sm overflow-hidden">
            <InfoRow
              icon={<Building2 size={13} className="text-[#00168D]" />}
              label="Ngân hàng"
              value={bankName}
              badge={bankCode}
            />
            <InfoRow
              icon={<CreditCard size={13} className="text-[#00168D]" />}
              label="Số tài khoản"
              value={accountNum}
              copyable
              onCopy={() => copy(accountNum, 'số tài khoản')}
            />
            <InfoRow
              icon={<FileText size={13} className="text-[#00168D]" />}
              label="Nội dung CK"
              value={content}
              copyable
              highlight
              onCopy={() => copy(content, 'nội dung chuyển khoản')}
            />
            <InfoRow
              icon={<CreditCard size={13} className="text-emerald-600" />}
              label="Số tiền"
              value={formatPrice(amount)}
              copyable
              onCopy={() => copy(String(amount), 'số tiền')}
              valueClass="text-blue-700 text-[14px] font-black tabular-nums"
            />
          </div>

          {/* ── AUTO-DETECT NOTICE ───────────────────────────────────── */}
          <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-sm">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Wifi size={14} className="text-blue-500 shrink-0 mt-0.5" />
            </motion.div>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Hệ thống <strong>tự động xác nhận</strong> sau khi nhận được chuyển khoản.
              Vui lòng nhập <strong>đúng nội dung</strong> "{content}" và giữ trang này mở.
            </p>
          </div>

          {/* ── WAITING INDICATOR ───────────────────────────────────── */}
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 size={14} className="animate-spin text-gray-400" />
            <span className="text-[12px] text-gray-400">
              Đang chờ thanh toán
              {pollCount > 0 && <span className="text-gray-300"> · đã kiểm tra {pollCount} lần</span>}
            </span>
          </div>

          {/* ── CLOSE BUTTON ────────────────────────────────────────── */}
          <button
            onClick={handleUserClose}
            className="w-full py-2.5 border border-gray-200 text-gray-500 text-[13px] font-medium hover:bg-gray-50 transition-colors rounded-sm"
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
      className={`flex items-center justify-between px-3 py-2.5 gap-3 transition-colors
        ${highlight ? 'bg-blue-50/50' : ''}
        ${copyable ? 'cursor-pointer hover:bg-gray-50 group' : ''}`}
      onClick={handleCopy}
    >
      <div className="flex items-center gap-2 shrink-0">
        <span>{icon}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        {badge && (
          <span className="px-1.5 py-0.5 bg-[#00168D] text-white text-[10px] font-black rounded tracking-wider shrink-0">
            {badge}
          </span>
        )}
        <span className={valueClass || `text-[13px] font-bold text-gray-900 truncate ${highlight ? 'text-[#00168D]' : ''}`}>
          {value}
        </span>
        {copyable && (
          copied
            ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
            : <Copy size={12} className="text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" />
        )}
      </div>
    </div>
  );
}
