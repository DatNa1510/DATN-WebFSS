import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-md';
  const maxWidth = {
    sm: '380px',
    md: '448px',
    lg: '672px',
    xl: '896px',
  }[size] || '448px';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative w-full ${sizeClass} bg-white rounded-2xl shadow-elevation overflow-hidden`}
            style={{
              position: 'relative', width: '100%', maxWidth: maxWidth,
              background: '#FFFFFF', borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden'
            }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface-secondary" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 24px', borderBottom: '1px solid #E8E8E4',
                background: '#FAFAFA'
              }}>
                <h2 className="font-bold font-display text-lg text-foreground" style={{
                  margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1A1A'
                }}>{title}</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white text-muted-foreground transition-colors"
                  style={{
                    padding: '6px', borderRadius: '8px', border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6B6B6B'
                  }}
                  aria-label="Close modal"
                >
                  <X size={18} strokeWidth={2.5} />
                </motion.button>
              </div>
            )}
            <div className="p-6 max-h-[80vh] overflow-y-auto" style={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
