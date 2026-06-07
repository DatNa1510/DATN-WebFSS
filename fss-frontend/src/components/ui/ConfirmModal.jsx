import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Xác nhận', cancelText = 'Hủy bỏ', isDanger = false }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            style={{
              position: 'relative', width: '100%', maxWidth: '380px',
              background: '#FFFFFF', borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden', zIndex: 1000, padding: '32px 24px 24px'
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: '#9CA3AF', padding: '6px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#4B5563'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              <X size={16} />
            </button>

            {/* Icon & Content (Centered) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: isDanger ? '#FEE2E2' : '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <AlertTriangle size={24} color={isDanger ? '#DC2626' : '#2563EB'} />
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                {title || 'Xác nhận hành động'}
              </h3>
              
              <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6 }}>
                {message}
              </p>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 16px', borderRadius: '10px', border: '1px solid #E5E7EB',
                  background: '#FFFFFF', color: '#374151', fontSize: '13.5px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                style={{
                  padding: '10px 16px', borderRadius: '10px', border: 'none',
                  background: isDanger ? '#DC2626' : '#2563EB', color: '#FFFFFF',
                  fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', textAlign: 'center'
                }}
                onMouseEnter={e => e.currentTarget.style.background = isDanger ? '#B91C1C' : '#1D4ED8'}
                onMouseLeave={e => e.currentTarget.style.background = isDanger ? '#DC2626' : '#2563EB'}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
