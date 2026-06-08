import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, FileText, CheckCircle2, AlertCircle, Edit, Trash2, Lock, Unlock, Package, ShoppingCart } from 'lucide-react';
import { toast } from '../../store/toastStore';
import { API_BASE } from '../../config/api';

const API = API_BASE;
const getToken = () => { try { return JSON.parse(localStorage.getItem('fss-auth'))?.state?.token || ''; } catch { return ''; } };

const ActionIcon = ({ action }) => {
  switch (action) {
    case 'CREATE': return <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '6px', borderRadius: '8px' }}><Plus size={16} /></div>;
    case 'UPDATE': return <div style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '6px', borderRadius: '8px' }}><Edit size={16} /></div>;
    case 'DELETE': return <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '6px', borderRadius: '8px' }}><Trash2 size={16} /></div>;
    case 'STATUS_CHANGE': return <div style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', padding: '6px', borderRadius: '8px' }}><CheckCircle2 size={16} /></div>;
    case 'LOCK': return <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '6px', borderRadius: '8px' }}><Lock size={16} /></div>;
    case 'UNLOCK': return <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '6px', borderRadius: '8px' }}><Unlock size={16} /></div>;
    default: return <div style={{ background: 'rgba(148,163,184,0.1)', color: '#94A3B8', padding: '6px', borderRadius: '8px' }}><FileText size={16} /></div>;
  }
};

// Helper for importing Plus since it might be needed above
import { Plus } from 'lucide-react';

export default function AdminLogsDrawer({ isOpen, onClose, targetType, title }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (pageNum = 0, reset = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/logs?targetType=${targetType}&page=${pageNum}&size=15`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setLogs(prev => reset ? data.items : [...prev, ...data.items]);
      setHasMore(pageNum < data.totalPages - 1);
      setPage(pageNum);
    } catch (e) {
      toast.error('Không thể tải lịch sử hoạt động');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs(0, true);
    }
  }, [isOpen, targetType]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)',
              zIndex: 998
            }}
          />
          <motion.div
            initial={{ x: '100%', boxShadow: '-20px 0 40px rgba(0,0,0,0)' }}
            animate={{ x: 0, boxShadow: '-20px 0 40px rgba(0,0,0,0.1)' }}
            exit={{ x: '100%', boxShadow: '-20px 0 40px rgba(0,0,0,0)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '450px', background: 'white', zIndex: 999,
              display: 'flex', flexDirection: 'column',
              borderLeft: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px', borderBottom: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(248, 250, 252, 0.5)'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                  {title}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                  Lịch sử các thao tác của quản trị viên
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                  background: 'white', color: '#64748B', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {logs.length === 0 && !loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#94A3B8' }}>
                  <Clock size={40} strokeWidth={1.5} style={{ opacity: 0.5, marginBottom: '16px' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>Chưa có lịch sử hoạt động nào.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                  {/* Vertical Line */}
                  <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', background: '#F1F5F9', zIndex: 0 }} />

                  {logs.map((log, idx) => (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}
                    >
                      <div style={{ 
                        background: 'white', borderRadius: '10px', padding: '4px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                      }}>
                        <ActionIcon action={log.action} />
                      </div>
                      
                      <div style={{ flex: 1, paddingTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B', lineHeight: 1.3 }}>
                            {log.targetName || `#${log.targetId}`}
                          </p>
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        
                        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '8px' }}>
                          {log.detail}
                        </p>
                        
                        {log.notes && (
                          <div style={{ background: '#FFF7ED', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #F97316', marginBottom: '10px' }}>
                            <p style={{ fontSize: '12px', color: '#C2410C', fontWeight: 600, display: 'flex', gap: '4px' }}>
                              <span style={{ display: 'inline-block', minWidth: '45px' }}>Lý do:</span>
                              <span style={{ fontWeight: 500, color: '#9A3412', fontStyle: 'italic' }}>{log.notes}</span>
                            </p>
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={12} color="#94A3B8" />
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                            {log.adminEmail}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {hasMore && (
                    <button
                      onClick={() => fetchLogs(page + 1)}
                      disabled={loading}
                      style={{
                        padding: '12px', background: '#F8FAFC', border: '1px dashed #CBD5E1',
                        borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#64748B',
                        cursor: 'pointer', transition: 'all 0.2s', alignSelf: 'center', marginTop: '10px'
                      }}
                    >
                      {loading ? 'Đang tải...' : 'Tải thêm'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
