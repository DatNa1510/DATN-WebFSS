import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';

/* ─── Config theo type ────────────────────────────── */
const CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'linear-gradient(135deg, rgba(2,62,47,0.97), rgba(4,120,87,0.93))',
    border: 'rgba(52,211,153,0.5)',
    iconColor: '#6ee7b7',
    progress: '#34d399',
    glow: 'rgba(16,185,129,0.35)',
    label: 'Thành công',
    labelColor: '#6ee7b7',
  },
  error: {
    icon: XCircle,
    bg: 'linear-gradient(135deg, rgba(100,20,20,0.97), rgba(160,20,20,0.93))',
    border: 'rgba(252,165,165,0.5)',
    iconColor: '#fca5a5',
    progress: '#ef4444',
    glow: 'rgba(239,68,68,0.35)',
    label: 'Lỗi',
    labelColor: '#fca5a5',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'linear-gradient(135deg, rgba(100,45,5,0.97), rgba(160,70,5,0.93))',
    border: 'rgba(252,211,77,0.5)',
    iconColor: '#fcd34d',
    progress: '#f59e0b',
    glow: 'rgba(245,158,11,0.35)',
    label: 'Cảnh báo',
    labelColor: '#fcd34d',
  },
  info: {
    icon: Info,
    bg: 'linear-gradient(135deg, rgba(10,15,60,0.97), rgba(0,22,141,0.93))',
    border: 'rgba(147,197,253,0.5)',
    iconColor: '#93c5fd',
    progress: '#3b82f6',
    glow: 'rgba(59,130,246,0.35)',
    label: 'Thông báo',
    labelColor: '#93c5fd',
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
      initial={{ opacity: 0, x: 80, scale: 0.88 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
      onClick={() => removeToast(id)}
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        boxShadow: `0 12px 48px ${cfg.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '14px',
        overflow: 'hidden',
        width: '380px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Top glow line */}
      <div style={{
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${cfg.iconColor}, transparent)`,
        opacity: 0.7,
      }} />

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 18px 14px' }}>

        {/* Icon container with glow */}
        <div style={{ position: 'relative', flexShrink: 0, marginTop: '1px' }}>
          <div style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            background: cfg.iconColor,
            filter: 'blur(10px)',
            opacity: 0.4,
          }} />
          <Icon size={26} style={{ color: cfg.iconColor, position: 'relative' }} strokeWidth={2.2} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: cfg.labelColor,
            marginBottom: '4px',
            opacity: 0.85,
          }}>
            {cfg.label}
          </p>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.95)',
            lineHeight: '1.45',
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
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
            marginTop: '1px',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <X size={13} color="rgba(255,255,255,0.8)" />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', margin: '0 18px 14px' , borderRadius: '999px' }}>
        <div style={{
          height: '100%',
          borderRadius: '999px',
          background: `linear-gradient(90deg, ${cfg.progress}, ${cfg.iconColor})`,
          width: `${progress}%`,
          transition: 'width 0.05s linear',
          boxShadow: `0 0 6px ${cfg.progress}80`,
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
