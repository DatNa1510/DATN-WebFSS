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

  const color  = timerColor(pct);
  const radius = 40;
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
        className="bg-white w-full max-w-[650px] shadow-2xl flex flex-col overflow-hidden"
        style={{ borderRadius: 4, maxHeight: '96vh', overflowY: 'auto' }}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="flex items-stretch justify-between border-b-2 border-slate-100 bg-white">
          <div className="flex items-stretch flex-1 min-w-0">
            {/* Solid blue full-bleed left block */}
            <div className="w-12 bg-[#00168D] flex items-center justify-center shrink-0 rounded-tl-[4px]">
              <CreditCard size={20} className="text-white" />
            </div>
            {/* Header text */}
            <div className="flex flex-col justify-center px-6 py-5">
              <h3 className="text-[20px] font-bold text-[#00168D] uppercase leading-relaxed pt-3 mb-1">
                Chuyển khoản VietQR
              </h3>
              <p className="text-[13px] text-slate-500 font-medium">Quét mã QR qua ứng dụng ngân hàng</p>
            </div>
          </div>
          <div className="flex items-center pr-6">
            <button
              onClick={handleUserClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors rounded-sm"
            >
              <X size={20} />
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

        <div className="p-6 space-y-6 bg-slate-50/50">

          {/* ── QR + TIMER SECTION ───────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6 bg-white border-2 border-slate-200 p-6 rounded-sm shadow-sm">
            {/* QR Code */}
            <div className={`bg-white p-3 shadow-md border-2 shrink-0 self-center rounded-sm ${expired ? 'border-red-200 opacity-30 grayscale' : 'border-[#00168D]/20'}`}>
              {qrCode ? (
                <QRCodeSVG value={qrCode} size={220} level="H" />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center text-slate-300 text-xs font-bold border-2 border-dashed border-slate-200">No QR</div>
              )}
            </div>

            {/* Right: timer + status + link */}
            <div className="flex-1 flex flex-col items-center justify-center gap-5 w-full">
              <div className="text-center">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2">Thời gian thanh toán</p>
                <div className="text-[40px] font-black tabular-nums tracking-tight leading-none drop-shadow-sm" style={{ color: expired ? '#ef4444' : color }}>
                  {mm}:{ss}
                </div>
              </div>

              {/* Polling status */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 rounded-sm border-2 border-blue-100 shadow-sm w-full justify-center">
                <Loader2 size={18} className="animate-spin text-blue-600" />
                <span className="text-[14px] font-bold">Đang chờ thanh toán...</span>
              </div>

              {/* PayOS link */}
              {paymentData?.paymentUrl && (
                <a
                  href={paymentData.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[13px] font-bold text-[#00168D] hover:text-blue-600 transition-colors bg-slate-50 px-4 py-2 rounded-sm border border-slate-200 hover:border-[#00168D]/30 w-full justify-center"
                >
                  <ExternalLink size={14} />
                  Mở trang PayOS
                </a>
              )}
            </div>
          </div>

          {/* ── BANK INFO TABLE ──────────────────────────────────────── */}
          <div className="bg-white border-2 border-slate-200 rounded-sm overflow-hidden shadow-sm">
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
              valueClass="text-blue-700 text-[18px] font-black tabular-nums"
            />
          </div>

          {/* ── AUTO-DETECT NOTICE ───────────────────────────────────── */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-sm shadow-sm">
            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-900 leading-relaxed font-medium">
              Hệ thống <strong>tự động xác nhận</strong> sau khi nhận được chuyển khoản.
              Vui lòng nhập <strong className="text-amber-900 font-black">đúng nội dung</strong> chuyển khoản để đơn hàng được duyệt tự động.
            </p>
          </div>

          {/* ── CLOSE BUTTON ────────────────────────────────────────── */}
          <button
            onClick={handleUserClose}
            className="w-full py-4 bg-white border-2 border-slate-300 text-slate-600 text-[14px] font-bold uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-colors rounded-sm shadow-sm"
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
      className={`flex items-center justify-between px-5 py-4 gap-4 transition-colors border-b border-slate-200 last:border-0
        ${highlight ? 'bg-blue-50/60' : 'bg-transparent'}
        ${copyable ? 'cursor-pointer hover:bg-slate-100 group' : ''}`}
      onClick={handleCopy}
    >
      <div className="flex items-center gap-3 shrink-0">
        <span>{icon}</span>
        <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        {badge && (
          <span className="px-2 py-1 bg-[#00168D] text-white text-[11px] font-black rounded-[2px] tracking-wider shrink-0">
            {badge}
          </span>
        )}
        <span className={valueClass || `text-[15px] font-bold text-slate-800 truncate ${highlight ? 'text-[#00168D]' : ''}`}>
          {value}
        </span>
        {copyable && (
          copied
            ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            : <Copy size={16} className="text-slate-300 group-hover:text-blue-600 shrink-0 transition-colors" />
        )}
      </div>
    </div>
  );
}
