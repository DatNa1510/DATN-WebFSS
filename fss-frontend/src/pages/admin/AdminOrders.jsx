import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, Eye, Package, ChevronLeft, ChevronRight, X, History, AlertTriangle, Tag } from 'lucide-react';
import { toast } from '../../store/toastStore';
import AdminLogsDrawer from '../../components/admin/AdminLogsDrawer';

const API = 'https://datn-webfss.onrender.com';
const getToken = () => { try { return JSON.parse(localStorage.getItem('fss-auth'))?.state?.token || ''; } catch { return ''; } };
const fmt = (n) => n?.toLocaleString('vi-VN') ?? '0';
const parseDate = (dVal) => {
  if (!dVal) return null;
  if (Array.isArray(dVal)) {
    return new Date(dVal[0], dVal[1] - 1, dVal[2], dVal[3] || 0, dVal[4] || 0, dVal[5] || 0);
  }
  const d = new Date(dVal);
  return isNaN(d.getTime()) ? null : d;
};

const J = {
  black: '#1A1A1A',
  gray: '#6B6B6B',
  lightGray: '#E8E8E4',
  red: '#1e3bc3', // Softer Shop theme blue
  redLight: '#E8EEFF', // Soft blue
  white: '#FFFFFF',
  green: '#27AE60',
  blue: '#2980B9',
};

const statusOptions = ['all', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

const statusConfig = {
  all:       { label: 'Tất cả',       color: J.gray },
  PENDING:   { label: 'Chờ xác nhận', color: J.gray,   bg: '#F5F5F5' },
  CONFIRMED: { label: 'Đã xác nhận',  color: J.blue,   bg: '#EAF2F8' },
  SHIPPING:  { label: 'Đang giao',    color: '#E67E22', bg: '#FDF2E9' },
  DELIVERED: { label: 'Đã giao',      color: J.green,  bg: '#E9F7EF' },
  CANCELLED: { label: 'Đã hủy',       color: '#E74C3C', bg: '#FDEDEC' },
  pending:   { label: 'Chờ xác nhận', color: J.gray,   bg: '#F5F5F5' },
  confirmed: { label: 'Đã xác nhận',  color: J.blue,   bg: '#EAF2F8' },
  shipping:  { label: 'Đang giao',    color: '#E67E22', bg: '#FDF2E9' },
  delivered: { label: 'Đã giao',      color: J.green,  bg: '#E9F7EF' },
  cancelled: { label: 'Đã hủy',       color: '#E74C3C', bg: '#FDEDEC' },
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

  const [cancelModal, setCancelModal] = useState(null);
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

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthOrders = orders.filter(o => {
    const d = parseDate(o.createdAt);
    return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
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
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: J.black, letterSpacing: '0.02em' }}>
            Quản lý Đơn hàng
          </h1>
          <p style={{ fontSize: '12px', color: J.gray, marginTop: '4px' }}>
            Theo dõi và quản lý các giao dịch khách hàng trong hệ thống
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/admin/vouchers"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '4px',
              background: J.white, border: `1px solid ${J.lightGray}`,
              fontSize: '12px', fontWeight: 500, color: J.black,
              textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.black; }}
          >
            <Tag size={14} /> Quản lý Voucher
          </Link>
          <button
            onClick={() => setIsLogsOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '4px',
              background: J.white, border: `1px solid ${J.lightGray}`,
              fontSize: '12px', fontWeight: 500, color: J.black,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.black; }}
          >
            <History size={14} /> Lịch sử hoạt động
          </button>
        </div>
      </div>

      {/* ── STATUS FILTER TABS + SEARCH ── */}
      <div style={{
        background: J.white, borderRadius: '4px', padding: '12px 16px',
        border: `1px solid ${J.lightGray}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {statusOptions.map((s) => {
            const isActive = filterStatus === s;
            const cfg = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '8px 0', border: 'none', background: 'transparent',
                  borderBottom: isActive ? `2px solid ${J.red}` : '2px solid transparent',
                  fontSize: '12px', fontWeight: isActive ? 600 : 400,
                  color: isActive ? J.black : J.gray, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {cfg.label}
                <span style={{
                  fontSize: '10px', fontWeight: 500,
                  background: isActive ? J.redLight : '#F5F5F5',
                  color: isActive ? J.red : J.gray,
                  padding: '2px 6px', borderRadius: '4px',
                }}>
                  {counts[s]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: J.gray }} />
          <input
            type="text"
            placeholder="Tìm mã đơn, tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              height: '36px', paddingLeft: '34px', paddingRight: '14px', width: '220px',
              background: '#FAFAFA', border: `1px solid ${J.lightGray}`,
              borderRadius: '4px', fontSize: '12px', color: J.black,
              outline: 'none', transition: 'all 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = J.red; e.target.style.background = J.white; }}
            onBlur={e => { e.target.style.borderColor = J.lightGray; e.target.style.background = '#FAFAFA'; }}
          />
        </div>
      </div>

      {/* ── ORDERS TABLE ── */}
      <div style={{
        background: J.white, borderRadius: '4px',
        border: `1px solid ${J.lightGray}`,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 180px)', minHeight: '600px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#F5F5F5', borderBottom: `1px solid ${J.lightGray}` }}>
                {['Mã đơn / Khách hàng', 'Số điện thoại', 'Địa chỉ giao hàng', 'Tổng tiền', 'Trạng thái'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px',
                    fontSize: '11px', fontWeight: 600, color: J.gray,
                    letterSpacing: '0.04em', background: '#F5F5F5',
                    boxShadow: `inset 0 -1px 0 ${J.lightGray}`
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{ width: '24px', height: '24px', border: `2px solid ${J.lightGray}`, borderTopColor: J.red, borderRadius: '50%' }} />
                      <p style={{ fontSize: '12px', color: J.gray }}>Đang tải danh sách đơn hàng...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, idx) => {
                  const cfg = statusConfig[order.status] || statusConfig.PENDING;
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                      style={{ borderBottom: `1px solid ${J.lightGray}`, transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: J.black }}>#{order.orderCode || order.id}</p>
                        <p style={{ fontSize: '12px', color: J.gray, marginTop: '2px' }}>{order.recipientName || order.userName}</p>
                        <p style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>{order.userEmail}</p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: '12px', color: J.black, fontFamily: 'monospace' }}>
                          {order.recipientPhone}
                        </p>
                      </td>
                      <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                        <p style={{ fontSize: '12px', color: J.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.shippingAddress}>
                          {order.shippingAddress}
                        </p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: J.black }}>₫{fmt(order.totalAmount)}</p>
                        <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px' }}>
                          {order.paymentMethodLabel || order.paymentMethod}
                        </p>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ position: 'relative' }}>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                              style={{
                                appearance: 'none', padding: '6px 24px 6px 10px',
                                fontSize: '11px', fontWeight: 500, borderRadius: '4px',
                                cursor: (order.status === 'CANCELLED' || order.status === 'DELIVERED') ? 'not-allowed' : 'pointer',
                                border: `1px solid ${cfg.color}40`,
                                background: cfg.bg, color: cfg.color,
                                outline: 'none', transition: 'all 0.2s',
                                opacity: (order.status === 'CANCELLED' || order.status === 'DELIVERED') ? 0.7 : 1,
                              }}
                            >
                              {statusOptions.filter(s => s !== 'all').map((s) => (
                                <option key={s} value={s}>{statusConfig[s]?.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={10} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: cfg.color, pointerEvents: 'none' }} />
                          </div>
                          <button 
                            onClick={() => setDetailOrder(order)}
                            style={{
                              width: '28px', height: '28px', borderRadius: '4px',
                              background: J.white, border: `1px solid ${J.lightGray}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: J.gray, transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.gray; }}
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
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Package size={32} style={{ color: '#CCCCCC', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: J.gray, fontWeight: 500 }}>Không tìm thấy đơn hàng nào.</p>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div style={{
            padding: '12px 16px', borderTop: `1px solid ${J.lightGray}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA',
          }}>
            <p style={{ fontSize: '11px', color: J.gray }}>
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} / {filtered.length} đơn hàng
            </p>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ width: '28px', height: '28px', borderRadius: '4px', background: J.white, border: `1px solid ${J.lightGray}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: J.gray, opacity: currentPage === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                if (n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1)) {
                  return (
                    <button key={n} onClick={() => setCurrentPage(n)} style={{
                      width: '28px', height: '28px', borderRadius: '4px', fontSize: '12px', fontWeight: n === currentPage ? 600 : 400,
                      cursor: 'pointer', border: `1px solid ${n === currentPage ? J.red : J.lightGray}`,
                      background: n === currentPage ? J.redLight : J.white,
                      color: n === currentPage ? J.red : J.gray,
                    }}>{n}</button>
                  );
                } else if (n === currentPage - 2 || n === currentPage + 2) {
                  return <span key={n} style={{ display: 'flex', alignItems: 'end', padding: '0 4px', color: '#999', fontSize: '10px' }}>...</span>;
                }
                return null;
              })}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ width: '28px', height: '28px', borderRadius: '4px', background: J.white, border: `1px solid ${J.lightGray}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: J.gray, opacity: currentPage === totalPages ? 0.5 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── STATS BOTTOM ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        <div style={{ background: J.white, borderRadius: '4px', padding: '24px', border: `1px solid ${J.lightGray}` }}>
          <p style={{ fontSize: '11px', color: J.gray, letterSpacing: '0.04em', marginBottom: '8px' }}>
            THỐNG KÊ HIỆN TẠI (THÁNG {currentMonth + 1})
          </p>
          <p style={{ fontSize: '28px', fontWeight: 600, color: J.black, marginBottom: '20px' }}>
            {fmt(totalThisMonth)} <span style={{ fontSize: '14px', fontWeight: 400, color: J.gray }}>đơn hàng</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', paddingTop: '20px', borderTop: `1px solid ${J.lightGray}` }}>
            {[
              { label: 'Doanh thu', value: `${formatCompact(revenueThisMonth)} ₫`, color: J.black },
              { label: 'Hoàn thành', value: `${completionRate}%`, color: J.green },
              { label: 'Hủy/Trả', value: fmt(cancelledThisMonth), color: J.red },
            ].map(stat => (
              <div key={stat.label}>
                <p style={{ fontSize: '11px', color: J.gray, marginBottom: '4px' }}>{stat.label}</p>
                <p style={{ fontSize: '16px', fontWeight: 600, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: J.white, borderRadius: '4px', padding: '24px', border: `1px solid ${J.lightGray}` }}>
          <p style={{ fontSize: '11px', color: J.gray, letterSpacing: '0.04em', marginBottom: '8px' }}>
            VẬN HÀNH HIỆN TẠI
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            {[
              { label: 'Chờ xác nhận', current: pendingCount, total: activeOrdersCount, pct: (pendingCount / activeOrdersCount) * 100, color: '#34495E' },
              { label: 'Đã xác nhận', current: confirmedCount, total: activeOrdersCount, pct: (confirmedCount / activeOrdersCount) * 100, color: J.blue },
              { label: 'Đang giao hàng', current: shippingCount, total: activeOrdersCount, pct: (shippingCount / activeOrdersCount) * 100, color: '#E67E22' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: J.gray }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: J.black }}>{item.current} / {item.total}</span>
                </div>
                <div style={{ height: '4px', background: '#F0F0F0', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ height: '100%', background: item.color, borderRadius: '2px' }}
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
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={e => e.target === e.currentTarget && setDetailOrder(null)}>
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
              style={{ background: J.white, borderRadius: '4px', width: '100%', maxWidth: '520px', padding: '32px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: J.black, letterSpacing: '0.02em' }}>ĐƠN HÀNG #{detailOrder.orderCode}</h2>
                  <p style={{ fontSize: '12px', color: J.gray, marginTop: '4px' }}>{detailOrder.userEmail} &bull; {parseDate(detailOrder.createdAt)?.toLocaleDateString('vi-VN') || '—'}</p>
                </div>
                <button onClick={() => setDetailOrder(null)} style={{ width: '28px', height: '28px', background: 'transparent', border: `1px solid ${J.lightGray}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: J.gray, borderRadius: '4px' }}><X size={14}/></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(detailOrder.items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: `1px solid ${J.lightGray}`, borderRadius: '4px', background: '#FAFAFA' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: J.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                      <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px' }}>Kích thước {item.size} &times; {item.quantity}</p>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: J.black, whiteSpace: 'nowrap' }}>₫{fmt(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px dashed ${J.lightGray}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: J.gray }}><span>Tạm tính</span><span>₫{fmt(detailOrder.subtotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: J.gray }}><span>Phí vận chuyển</span><span>₫{fmt(detailOrder.shippingFee)}</span></div>

                {detailOrder.voucherCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: J.red, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Mã giảm giá</span>
                      <span style={{ border: `1px solid ${J.red}`, padding: '2px 6px', fontSize: '10px', fontWeight: 600, borderRadius: '2px', background: J.redLight }}>{detailOrder.voucherCode}</span>
                    </div>
                    <span>-₫{fmt(detailOrder.discount ?? 0)}</span>
                  </div>
                )}
                {!detailOrder.voucherCode && detailOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: J.red }}>
                    <span>Giảm giá</span>
                    <span>-₫{fmt(detailOrder.discount)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 600, color: J.black, marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${J.lightGray}` }}><span>Tổng cộng</span><span>₫{fmt(detailOrder.totalAmount)}</span></div>
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
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={e => e.target === e.currentTarget && setCancelModal(null)}>
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
              style={{ background: J.white, borderRadius: '4px', width: '100%', maxWidth: '440px', padding: '32px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
              
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: J.black, marginBottom: '8px' }}>
                Hủy đơn hàng #{orders.find(o => o.id === cancelModal.orderId)?.orderCode || cancelModal.orderId}
              </h2>
              <p style={{ fontSize: '12px', color: J.gray, marginBottom: '20px', lineHeight: 1.5 }}>
                Vui lòng nhập lý do hủy đơn. Khách hàng sẽ nhận được mã ưu đãi bù đắp (giảm 10%, tối đa 100K).
              </p>
              
              <div style={{ marginBottom: '24px' }}>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn hàng..."
                  style={{
                    width: '100%', height: '100px', padding: '12px',
                    border: `1px solid ${J.lightGray}`, borderRadius: '4px',
                    background: '#FAFAFA', fontSize: '13px', color: J.black,
                    resize: 'none', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = J.red}
                  onBlur={e => e.target.style.borderColor = J.lightGray}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => { setCancelModal(null); setCancelReason(''); }}
                  style={{
                    padding: '10px', borderRadius: '4px', fontSize: '13px', fontWeight: 500,
                    background: J.white, border: `1px solid ${J.lightGray}`, cursor: 'pointer',
                    color: J.gray, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = J.white}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={!cancelReason.trim()}
                  style={{
                    padding: '10px', borderRadius: '4px', fontSize: '13px', fontWeight: 500,
                    background: cancelReason.trim() ? J.red : '#E0E0E0',
                    border: 'none', cursor: cancelReason.trim() ? 'pointer' : 'not-allowed',
                    color: cancelReason.trim() ? J.white : '#999', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if(cancelReason.trim()) e.currentTarget.style.background = '#A93226'; }}
                  onMouseLeave={e => { if(cancelReason.trim()) e.currentTarget.style.background = J.red; }}
                >
                  Xác nhận hủy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
