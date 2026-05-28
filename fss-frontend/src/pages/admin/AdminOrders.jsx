import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Eye, Package, ChevronLeft, ChevronRight, X, History, AlertTriangle } from 'lucide-react';
import { toast } from '../../store/toastStore';
import AdminLogsDrawer from '../../components/admin/AdminLogsDrawer';

const API = 'http://localhost:8080';
const getToken = () => { try { return JSON.parse(localStorage.getItem('fss-auth'))?.state?.token || ''; } catch { return ''; } };
const fmt = (n) => n?.toLocaleString('vi-VN') ?? '0';

const statusOptions = ['all', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

const statusConfig = {
  all:       { label: 'Tất cả',        dot: null },
  PENDING:   { label: 'Chờ xác nhận',  bg: 'rgba(100,116,139,0.08)', color: '#475569', dot: '#94A3B8' },
  CONFIRMED: { label: 'Đã xác nhận',   bg: 'rgba(124,58,237,0.09)', color: '#6D28D9', dot: '#7C3AED' },
  SHIPPING:  { label: 'Đang giao',     bg: 'rgba(14,165,233,0.09)', color: '#0284C7', dot: '#0EA5E9' },
  DELIVERED: { label: 'Đã giao',       bg: 'rgba(16,185,129,0.09)', color: '#047857', dot: '#10B981' },
  CANCELLED: { label: 'Đã hủy',        bg: 'rgba(239,68,68,0.09)',  color: '#DC2626', dot: '#EF4444' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailOrder, setDetailOrder] = useState(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cancel reason modal state
  const [cancelModal, setCancelModal] = useState(null); // { orderId: number }
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/orders/admin/all`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error('Không thể tải danh sách đơn hàng!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => { setCurrentPage(1); }, [search, filterStatus]);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = String(o.orderCode || o.id || '').toLowerCase().includes(q)
      || String(o.recipientName || '').toLowerCase().includes(q)
      || String(o.userName || '').toLowerCase().includes(q)
      || String(o.userEmail || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id, newStatus, cancelReason = '') => {
    try {
      const res = await fetch(`${API}/api/orders/admin/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus, cancelReason }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Cập nhật thất bại');
      }
      const data = await res.json();
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...data.order } : o));
      toast.success('Cập nhật trạng thái thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại!');
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    if (newStatus === 'CANCELLED') {
      setCancelModal({ orderId });
      setCancelReason('');
    } else {
      updateStatus(orderId, newStatus);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal || !cancelReason.trim()) return;
    await updateStatus(cancelModal.orderId, 'CANCELLED', cancelReason.trim());
    setCancelModal(null);
    setCancelReason('');
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedOrders = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const counts = statusOptions.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  // Compute real stats from `orders` array
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalThisMonth = thisMonthOrders.length;
  const revenueThisMonth = thisMonthOrders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cancelledThisMonth = thisMonthOrders.filter(o => o.status === 'CANCELLED').length;
  const completedThisMonth = thisMonthOrders.filter(o => o.status === 'DELIVERED').length;
  const completionRate = totalThisMonth === 0 ? '0.0' : ((completedThisMonth / totalThisMonth) * 100).toFixed(1);

  const formatCompact = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return fmt(num);
  };

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const confirmedCount = orders.filter(o => o.status === 'CONFIRMED').length;
  const shippingCount = orders.filter(o => o.status === 'SHIPPING').length;
  const activeOrdersCount = Math.max(1, pendingCount + confirmedCount + shippingCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.5px' }}>
            Quản lý Đơn hàng
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>
            Theo dõi và quản lý các giao dịch khách hàng trong hệ thống
          </p>
        </div>
        <button
          onClick={() => setIsLogsOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 16px', borderRadius: '10px',
            background: 'white', border: '1px solid rgba(0,0,0,0.09)',
            fontSize: '13px', fontWeight: 700, color: '#475569',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
          }}
        >
          <History size={15} strokeWidth={2.5} /> Lịch sử
        </button>
      </div>

      {/* ── STATUS FILTER TABS + SEARCH ── */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '14px 16px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {statusOptions.map((s) => {
            const isActive = filterStatus === s;
            const cfg = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '8px 14px', borderRadius: '10px',
                  fontSize: '12.5px', fontWeight: 700,
                  cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  background: isActive ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : '#F8F7FF',
                  color: isActive ? 'white' : '#6B7280',
                  boxShadow: isActive ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {s !== 'all' && (
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: isActive ? 'rgba(255,255,255,0.7)' : cfg.dot,
                  }} />
                )}
                {cfg.label}
                {counts[s] > 0 && (
                  <span style={{
                    fontSize: '10px', fontWeight: 800,
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(124,58,237,0.1)',
                    color: isActive ? 'white' : '#7C3AED',
                    padding: '1px 6px', borderRadius: '20px', minWidth: '20px', textAlign: 'center',
                  }}>
                    {counts[s]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Tìm mã đơn, tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              height: '40px', paddingLeft: '36px', paddingRight: '14px', width: '240px',
              background: '#F8F7FF', border: '1.5px solid rgba(124,58,237,0.1)',
              borderRadius: '10px', fontSize: '13px', color: '#374151',
              outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(124,58,237,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* ── ORDERS TABLE ── */}
      <div style={{
        background: 'white', borderRadius: '18px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 140px)', minHeight: '650px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                {['Mã đơn / Khách hàng', 'Số điện thoại', 'Địa chỉ giao hàng', 'Tổng tiền', 'Trạng thái'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '13px 20px',
                    fontSize: '11px', fontWeight: 700, color: '#94A3B8',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: '#FAFAFA', // Đảm bảo background không bị trong suốt khi cuộn
                    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.05)' // Thay borderBottom bằng boxShadow để dính cùng sticky
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{
                          width: '40px', height: '40px',
                          border: '4px solid rgba(124,58,237,0.1)',
                          borderTopColor: '#7C3AED',
                          borderRadius: '50%',
                        }}
                      />
                      <p style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600 }}>Đang tải danh sách đơn hàng...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, idx) => {
                  const cfg = statusConfig[order.status] || statusConfig.PENDING;
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.4) }} // Limit delay to avoid long wait
                      style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FDFDFF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 800, color: '#7C3AED' }}>#{order.orderCode || order.id}</p>
                        <p style={{ fontSize: '13px', color: '#374151', fontWeight: 600, marginTop: '2px' }}>{order.recipientName || order.userName}</p>
                        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>{order.userEmail}</p>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                          {order.recipientPhone}
                        </p>
                      </td>
                      <td style={{ padding: '16px 20px', maxWidth: '200px' }}>
                        <p style={{ fontSize: '12.5px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.shippingAddress}>
                          {order.shippingAddress}
                        </p>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B' }}>₫{fmt(order.totalAmount)}</p>
                        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          {order.paymentMethodLabel || order.paymentMethod}
                        </p>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ position: 'relative' }}>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                              style={{
                                appearance: 'none',
                                padding: '6px 28px 6px 10px',
                                fontSize: '12px', fontWeight: 700,
                                borderRadius: '8px',
                                cursor: (order.status === 'CANCELLED' || order.status === 'DELIVERED') ? 'not-allowed' : 'pointer',
                                border: `1.5px solid ${cfg.dot}30`,
                                background: cfg.bg, color: cfg.color,
                                outline: 'none', fontFamily: 'inherit',
                                transition: 'all 0.2s',
                                opacity: (order.status === 'CANCELLED' || order.status === 'DELIVERED') ? 0.7 : 1,
                              }}
                            >
                              {statusOptions.filter(s => s !== 'all').map((s) => (
                                <option key={s} value={s}>{statusConfig[s]?.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} style={{
                              position: 'absolute', right: '8px', top: '50%',
                              transform: 'translateY(-50%)', pointerEvents: 'none',
                              color: cfg.color, opacity: 0.7,
                            }} />
                          </div>
                          <button 
                            onClick={() => setDetailOrder(order)}
                            style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'white', border: '1px solid rgba(0,0,0,0.09)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: '#64748B', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F8F4FF'; e.currentTarget.style.color = '#7C3AED'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748B'; }}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '70px 20px' }}>
              <Package size={48} style={{ color: '#E2E8F0', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 600 }}>Không tìm thấy đơn hàng nào.</p>
              <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '4px' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div style={{
            padding: '14px 24px', borderTop: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA',
          }}>
            <p style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} / {filtered.length} đơn hàng
            </p>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#64748B', opacity: currentPage === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                // Chỉ hiển thị 5 trang xung quanh trang hiện tại hoặc trang đầu/cuối
                if (n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1)) {
                  return (
                    <button key={n} onClick={() => setCurrentPage(n)} style={{
                      width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                      background: n === currentPage ? 'linear-gradient(135deg,#7C3AED,#4F46E5)' : 'white',
                      color: n === currentPage ? 'white' : '#475569',
                      boxShadow: n === currentPage ? '0 2px 8px rgba(124,58,237,0.3)' : '0 0 0 1px rgba(0,0,0,0.09)',
                    }}>{n}</button>
                  );
                } else if (n === currentPage - 2 || n === currentPage + 2) {
                  return <span key={n} style={{ display: 'flex', alignItems: 'end', padding: '0 4px', color: '#94A3B8' }}>...</span>;
                }
                return null;
              })}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: '#64748B', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── STATS BOTTOM ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

        {/* Dark stats card */}
        <div style={{
          background: 'linear-gradient(135deg, #0F0F23 0%, #1A1040 100%)',
          borderRadius: '18px', padding: '30px 32px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-30px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(124,58,237,0.3), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '40px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(79,70,229,0.2), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Thống kê hiện nay
            </p>
            <p style={{ fontSize: '36px', fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '24px' }}>
              {fmt(totalThisMonth)} <span style={{ fontSize: '22px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Đơn hàng</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { label: 'Doanh thu (Đã giao)', value: `${formatCompact(revenueThisMonth)} ₫`, color: '#A78BFA' },
                { label: 'Tỉ lệ hoàn thành', value: `${completionRate}%`, color: '#34D399' },
                { label: 'Đơn hủy/trả', value: fmt(cancelledThisMonth), color: '#F87171' },
              ].map(stat => (
                <div key={stat.label}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '6px' }}>{stat.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operation card */}
        <div style={{
          background: 'white', borderRadius: '18px', padding: '26px',
          border: '1px solid rgba(124,58,237,0.1)',
          boxShadow: '0 2px 12px rgba(124,58,237,0.06)',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#7C3AED', marginBottom: '4px' }}>
            Vận hành hiện nay
          </h3>
          <p style={{ fontSize: '12px', color: 'rgba(124,58,237,0.6)', marginBottom: '24px', fontWeight: 500 }}>
            Nhân viên kho đang xử lý tích cực
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { label: 'Chờ xác nhận', current: pendingCount, total: activeOrdersCount, pct: (pendingCount / activeOrdersCount) * 100 },
              { label: 'Đã xác nhận', current: confirmedCount, total: activeOrdersCount, pct: (confirmedCount / activeOrdersCount) * 100 },
              { label: 'Đang giao hàng', current: shippingCount, total: activeOrdersCount, pct: (shippingCount / activeOrdersCount) * 100 },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#374151' }}>{item.label}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#7C3AED' }}>{item.current}/{item.total}</span>
                </div>
                <div style={{ height: '6px', background: '#EDE9FE', borderRadius: '6px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #7C3AED, #4F46E5)', borderRadius: '6px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ORDER DETAIL MODAL ── */}
      <AnimatePresence>
        {detailOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,15,35,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={e => e.target === e.currentTarget && setDetailOrder(null)}>
            <motion.div initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '540px', padding: '28px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1E1B4B' }}>ĐƠN #{detailOrder.orderCode}</h2>
                  <p style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '3px' }}>{detailOrder.userEmail} &bull; {new Date(detailOrder.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <button onClick={() => setDetailOrder(null)} style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}><X size={16}/></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(detailOrder.items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '10px', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                      <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Size {item.size} &times; {item.quantity}</p>
                    </div>
                    <p style={{ fontSize: '13.5px', fontWeight: 800, color: '#7C3AED', whiteSpace: 'nowrap' }}>₫{fmt(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}><span>Tạm tính</span><span>₫{fmt(detailOrder.subtotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}><span>Phí ship</span><span>₫{fmt(detailOrder.shippingFee)}</span></div>
                {detailOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10B981', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Giảm giá</span>
                      {detailOrder.voucherCode && (
                        <span style={{ padding: '2px 6px', background: 'rgba(16,185,129,0.1)', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>{detailOrder.voucherCode}</span>
                      )}
                    </div>
                    <span>-₫{fmt(detailOrder.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, color: '#1E1B4B', marginTop: '4px' }}><span>Tổng cộng</span><span>₫{fmt(detailOrder.totalAmount)}</span></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminLogsDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        targetType="ORDER"
        title="Lịch sử Quản lý Đơn hàng"
      />

      {/* ── CANCEL REASON MODAL ── */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,15,35,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={e => e.target === e.currentTarget && setCancelModal(null)}>
            <motion.div initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '460px', padding: '32px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={28} style={{ color: '#EF4444' }} />
                </div>
              </div>
              
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E1B4B', textAlign: 'center', marginBottom: '6px' }}>
                Hủy đơn hàng #{orders.find(o => o.id === cancelModal.orderId)?.orderCode || cancelModal.orderId}
              </h2>
              <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', marginBottom: '20px', lineHeight: 1.6 }}>
                Vui lòng nhập lý do hủy đơn để khách hàng hiểu rõ. Hệ thống sẽ tự động tạo mã ưu đãi bù đắp (giảm 10%, tối đa 100K) cho khách hàng.
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Lý do hủy đơn hàng *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn hàng..."
                  style={{
                    width: '100%', height: '100px', padding: '12px 14px',
                    border: '1.5px solid rgba(124,58,237,0.15)', borderRadius: '12px',
                    background: '#FAFAFA', fontSize: '13.5px', color: '#374151',
                    resize: 'none', outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.15)'}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', marginBottom: '20px', border: '1px solid rgba(16,185,129,0.12)' }}>
                <span style={{ fontSize: '16px' }}>🎁</span>
                <p style={{ fontSize: '12px', color: '#047857', fontWeight: 600, lineHeight: 1.5 }}>
                  Khách hàng sẽ được tặng mã Voucher giảm 10% (tối đa 100.000đ) cho đơn hàng tiếp theo.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => { setCancelModal(null); setCancelReason(''); }}
                  style={{
                    padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                    background: '#F1F5F9', border: 'none', cursor: 'pointer',
                    color: '#64748B', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                >
                  Quay lại
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={!cancelReason.trim()}
                  style={{
                    padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                    background: cancelReason.trim() ? 'linear-gradient(135deg, #DC2626, #EF4444)' : '#E2E8F0',
                    border: 'none', cursor: cancelReason.trim() ? 'pointer' : 'not-allowed',
                    color: 'white', fontFamily: 'inherit', transition: 'all 0.2s',
                    boxShadow: cancelReason.trim() ? '0 4px 14px rgba(239,68,68,0.3)' : 'none',
                  }}
                >
                  Xác nhận hủy đơn
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
