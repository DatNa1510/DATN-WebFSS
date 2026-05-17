import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';

/* ─── Config theo type ────────────────────────────── */
const CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: '#ffffff',
    border: '#e2e8f0',
    iconColor: '#10b981',
    progress: '#10b981',
    label: 'Thành công',
    labelColor: '#059669',
  },
  error: {
    icon: XCircle,
    bg: '#ffffff',
    border: '#e2e8f0',
    iconColor: '#ef4444',
    progress: '#ef4444',
    label: 'Lỗi',
    labelColor: '#dc2626',
  },
  warning: {
    icon: AlertTriangle,
    bg: '#ffffff',
    border: '#e2e8f0',
    iconColor: '#f59e0b',
    progress: '#f59e0b',
    label: 'Cảnh báo',
    labelColor: '#d97706',
  },
  info: {
    icon: Info,
    bg: '#ffffff',
    border: '#e2e8f0',
    iconColor: '#3b82f6',
    progress: '#3b82f6',
    label: 'Thông báo',
    labelColor: '#2563eb',
  },
};

/* ─── Single Toast ─────────────────────────────────── */
function ToastItem({ id, message, type, duration }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);
  const cfg = CONFIG[type] || CONFIG.info;
  const Icon = cfg.icon;

  const startTimer = () => {
    const step = 100 / (duration / 50);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) {
          clearInterval(intervalRef.current);
          removeToast(id);
          return 0;
        }
        return p - step;
      });
    }, 50);
  };

  const stopTimer = () => clearInterval(intervalRef.current);

  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
      onClick={() => removeToast(id)}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        borderRadius: '4px',
        overflow: 'hidden',
        width: '360px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 18px' }}>

        {/* Icon */}
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <Icon size={22} style={{ color: cfg.iconColor }} strokeWidth={2.5} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: cfg.labelColor,
            marginBottom: '2px',
          }}>
            {cfg.label}
          </p>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#1e293b',
            lineHeight: '1.5',
            wordBreak: 'break-word',
          }}>
            {message}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={(e) => { e.stopPropagation(); removeToast(id); }}
          style={{
            flexShrink: 0,
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
            marginTop: '-2px',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={14} color="#64748b" />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: '#f1f5f9' }}>
        <div style={{
          height: '100%',
          background: cfg.progress,
          width: `${progress}%`,
          transition: 'width 0.05s linear',
        }} />
      </div>
    </motion.div>
  );
}

/* ─── Toast Container ──────────────────────────────── */
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '24px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem {...t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
