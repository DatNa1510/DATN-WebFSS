import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Eye, Download, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { orders as initialOrders, formatPrice, orderStatusMap } from '../../data/mockData';

const statusOptions = ['all', 'pending', 'confirmed', 'packing', 'shipping', 'delivered', 'cancelled'];

const statusConfig = {
  all:       { label: 'Tất cả',        bg: 'transparent',            color: '#475569', active: '#7C3AED', activeBg: 'linear-gradient(135deg,#7C3AED,#4F46E5)' },
  pending:   { label: 'Chờ xác nhận',  bg: 'rgba(100,116,139,0.08)', color: '#475569', dot: '#94A3B8' },
  confirmed: { label: 'Đã xác nhận',   bg: 'rgba(124,58,237,0.09)', color: '#6D28D9', dot: '#7C3AED' },
  packing:   { label: 'Đang đóng gói', bg: 'rgba(245,158,11,0.09)', color: '#B45309', dot: '#F59E0B' },
  shipping:  { label: 'Đang giao',     bg: 'rgba(14,165,233,0.09)', color: '#0284C7', dot: '#0EA5E9' },
  delivered: { label: 'Đã giao',       bg: 'rgba(16,185,129,0.09)', color: '#047857', dot: '#10B981' },
  cancelled: { label: 'Đã hủy',        bg: 'rgba(239,68,68,0.09)',  color: '#DC2626', dot: '#EF4444' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = (id, newStatus) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
  };

  const counts = statusOptions.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {});

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
        <button style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '9px 18px', borderRadius: '10px',
          background: 'white', border: '1px solid rgba(0,0,0,0.1)',
          fontSize: '13px', fontWeight: 600, color: '#374151',
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <Download size={15} /> Xuất báo cáo
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                {['Mã đơn / Khách hàng', 'Số điện thoại', 'Địa chỉ giao hàng', 'Tổng tiền', 'Trạng thái'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '13px 20px',
                    fontSize: '11px', fontWeight: 700, color: '#94A3B8',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((order, idx) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <motion.tr
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ delay: idx * 0.04 }}
                      style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FDFDFF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 800, color: '#7C3AED' }}>#{order.id}</p>
                        <p style={{ fontSize: '13px', color: '#374151', fontWeight: 600, marginTop: '2px' }}>{order.customer.name}</p>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                          {order.customer.phone}
                        </p>
                      </td>
                      <td style={{ padding: '16px 20px', maxWidth: '200px' }}>
                        <p style={{ fontSize: '12.5px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.address}>
                          {order.address}
                        </p>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B' }}>{formatPrice(order.total)}</p>
                        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          {order.paymentMethod}
                        </p>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ position: 'relative' }}>
                            <select
                              value={order.status}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                              style={{
                                appearance: 'none',
                                padding: '6px 28px 6px 10px',
                                fontSize: '12px', fontWeight: 700,
                                borderRadius: '8px', cursor: 'pointer',
                                border: `1.5px solid ${cfg.dot}30`,
                                background: cfg.bg, color: cfg.color,
                                outline: 'none', fontFamily: 'inherit',
                                transition: 'all 0.2s',
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
                          <button style={{
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
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && (
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
              Hiển thị {filtered.length} đơn hàng
            </p>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                <ChevronLeft size={15} />
              </button>
              {[1, 2, 3].map(n => (
                <button key={n} style={{
                  width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  background: n === 1 ? 'linear-gradient(135deg,#7C3AED,#4F46E5)' : 'white',
                  color: n === 1 ? 'white' : '#475569',
                  boxShadow: n === 1 ? '0 2px 8px rgba(124,58,237,0.3)' : '0 0 0 1px rgba(0,0,0,0.09)',
                }}>{n}</button>
              ))}
              <button style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
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
              Thống kê tháng này
            </p>
            <p style={{ fontSize: '36px', fontWeight: 900, color: 'white', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '24px' }}>
              1,240 <span style={{ fontSize: '22px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Đơn hàng</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { label: 'Doanh thu dự kiến', value: '124.5M ₫', color: '#A78BFA' },
                { label: 'Tỉ lệ hoàn thành', value: '94.2%', color: '#34D399' },
                { label: 'Đơn hủy/trả', value: '12', color: '#F87171' },
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
            Vận hành hôm nay
          </h3>
          <p style={{ fontSize: '12px', color: 'rgba(124,58,237,0.6)', marginBottom: '24px', fontWeight: 500 }}>
            Nhân viên kho đang xử lý tích cực
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { label: 'Đã lấy hàng', current: 45, total: 60, pct: 75 },
              { label: 'Bàn giao bưu tá', current: 28, total: 60, pct: 45 },
              { label: 'Đang vận chuyển', current: 18, total: 30, pct: 60 },
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

    </div>
  );
}
