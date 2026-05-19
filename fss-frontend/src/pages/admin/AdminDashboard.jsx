import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Users, Package, Banknote, ArrowUpRight, ArrowDownRight, Download, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../data/mockData';
import { toast } from '../../store/toastStore';

const API = 'http://localhost:8080';
const getToken = () => { try { return JSON.parse(localStorage.getItem('fss-auth'))?.state?.token || ''; } catch { return ''; } };

const statusStyle = {
  DELIVERED: { bg: 'rgba(16,185,129,0.1)', color: '#059669', dot: '#10B981' },
  SHIPPING:  { bg: 'rgba(14,165,233,0.1)', color: '#0284C7', dot: '#0EA5E9' },
  CONFIRMED: { bg: 'rgba(124,58,237,0.1)', color: '#6D28D9', dot: '#7C3AED' },
  PENDING:   { bg: 'rgba(100,116,139,0.1)', color: '#475569', dot: '#94A3B8' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#DC2626', dot: '#EF4444' },
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
      } catch (err) {
        toast.error('Không thể tải dữ liệu thống kê!');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <p style={{ color: '#64748B', fontWeight: 600 }}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <p style={{ color: '#DC2626', fontWeight: 600 }}>Lỗi tải dữ liệu. Vui lòng kiểm tra lại Backend!</p>
      </div>
    );
  }

  const { stats, revenueData, topProducts, recentOrders } = data;

  const statCards = [
    {
      label: 'Tổng đơn hàng',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      change: '+0.0%',
      up: true,
      gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
      glow: 'rgba(124,58,237,0.35)',
      lightBg: 'rgba(124,58,237,0.08)',
      textColor: '#7C3AED',
    },
    {
      label: 'Khách hàng',
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      change: '+0.0%',
      up: true,
      gradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
      glow: 'rgba(14,165,233,0.35)',
      lightBg: 'rgba(14,165,233,0.08)',
      textColor: '#0EA5E9',
    },
    {
      label: 'Sản phẩm',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      change: '+0.0%',
      up: true,
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
      glow: 'rgba(245,158,11,0.35)',
      lightBg: 'rgba(245,158,11,0.08)',
      textColor: '#D97706',
    },
    {
      label: 'Doanh thu',
      value: formatPrice(stats.totalRevenue),
      icon: Banknote,
      change: '+0.0%',
      up: true,
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      glow: 'rgba(16,185,129,0.35)',
      lightBg: 'rgba(16,185,129,0.08)',
      textColor: '#10B981',
    },
  ];

  const maxRevenue = Math.max(...revenueData.map((r) => r.revenue), 1000000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Tổng quan quản trị
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>
            Chào mừng trở lại! Đây là hiệu suất kinh doanh hôm nay.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 18px', borderRadius: '10px',
            background: 'white', border: '1px solid rgba(0,0,0,0.1)',
            fontSize: '13px', fontWeight: 600, color: '#374151',
            cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            fontFamily: 'inherit', transition: 'all 0.2s',
          }}>
            <Download size={15} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {statCards.map(({ label, value, icon: Icon, change, up, gradient, glow, lightBg, textColor }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'white',
              borderRadius: '18px',
              padding: '24px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              transition: 'all 0.25s ease',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden',
            }}
            whileHover={{ y: -3, boxShadow: `0 12px 32px ${glow}` }}
          >
            {/* Subtle bg tint */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: lightBg, borderRadius: '0 18px 0 80px', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '13px',
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 14px ${glow}`,
              }}>
                <Icon size={22} color="white" strokeWidth={2.5} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '4px 8px', borderRadius: '8px',
                background: up ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                fontSize: '12px', fontWeight: 700,
                color: up ? '#059669' : '#DC2626',
              }}>
                {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {change}
              </div>
            </div>

            <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
              {label}
            </p>
            <p style={{ fontSize: '30px', fontWeight: 900, color: '#1E1B4B', lineHeight: 1, letterSpacing: '-1px' }}>
              {value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── CHARTS + TOP PRODUCTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

        {/* Revenue Chart */}
        <div style={{
          background: 'white', borderRadius: '18px', padding: '28px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B', marginBottom: '4px' }}>
                Doanh thu 2026
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                Phân tích tăng trưởng theo tháng
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }} />
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Tháng hiện tại</span>
              </div>
              <div style={{
                padding: '5px 12px', borderRadius: '8px',
                background: '#F8F4FF', border: '1px solid rgba(124,58,237,0.15)',
                fontSize: '12px', fontWeight: 600, color: '#7C3AED', cursor: 'pointer',
              }}>
                T5 - T12 ▾
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '200px' }}>
            {revenueData.slice(-8).map((d, index, array) => {
              const heightPct = (d.revenue / maxRevenue) * 100;
              const isCurrent = index === array.length - 3;
              return (
                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct * 1.9}px` }}
                      transition={{ delay: 0.2 + index * 0.05, duration: 0.7, ease: 'easeOut' }}
                      style={{
                        width: '100%', maxWidth: '44px',
                        background: isCurrent
                          ? 'linear-gradient(180deg, #7C3AED, #4F46E5)'
                          : 'linear-gradient(180deg, #DDD6FE, #C4B5FD)',
                        borderRadius: '8px 8px 4px 4px',
                        boxShadow: isCurrent ? '0 4px 16px rgba(124,58,237,0.4)' : 'none',
                        cursor: 'pointer',
                        transition: 'filter 0.2s',
                        position: 'relative',
                      }}
                      whileHover={{ filter: 'brightness(1.1)' }}
                      title={`${d.month}: ${(d.revenue / 1e6).toFixed(1)}M ₫`}
                    />
                  </div>
                  <span style={{
                    fontSize: '11.5px', fontWeight: 700,
                    color: isCurrent ? '#7C3AED' : '#94A3B8',
                  }}>
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div style={{
          background: 'white', borderRadius: '18px', padding: '24px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B' }}>
              🔥 Bán chạy nhất
            </h2>
            <Star size={16} style={{ color: '#F59E0B' }} fill="#F59E0B" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topProducts.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={p.imagePath ? `${API}/images/${p.imagePath.split(',')[0]}` : ''} alt={p.productDisplayName}
                    style={{ width: '46px', height: '46px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.07)' }}
                  />
                  {i === 0 && (
                    <div style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', fontWeight: 800, color: 'white',
                      border: '2px solid white',
                    }}>1</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.productDisplayName}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {formatPrice(p.price)} · <span style={{ color: '#7C3AED', fontWeight: 600 }}>{p.sold} đã bán</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button style={{
            width: '100%', marginTop: '20px', padding: '10px',
            borderRadius: '12px', border: '1px solid rgba(124,58,237,0.2)',
            background: 'rgba(124,58,237,0.05)',
            fontSize: '13px', fontWeight: 700, color: '#7C3AED',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
          }}>
            Xem tất cả →
          </button>
        </div>
      </div>

      {/* ── RECENT ORDERS TABLE ── */}
      <div style={{
        background: 'white', borderRadius: '18px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '22px 28px',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B' }}>Đơn hàng gần đây</h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', fontWeight: 500 }}>5 đơn hàng mới nhất</p>
          </div>
          <Link to="/admin/orders" style={{
            fontSize: '13px', fontWeight: 700, color: '#7C3AED', textDecoration: 'none',
            padding: '7px 14px', borderRadius: '8px', background: 'rgba(124,58,237,0.08)',
            transition: 'all 0.2s',
          }}>
            Xem tất cả →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Khách hàng', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', 'Hành động'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '13px 20px',
                    fontSize: '11px', fontWeight: 700, color: '#94A3B8',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, idx) => {
                const s = statusStyle[order.status] || statusStyle.PENDING;
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.06 }}
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFF'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 800, color: '#7C3AED',
                          flexShrink: 0,
                        }}>
                          {(order.userName || order.recipientName).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B' }}>{order.userName || order.recipientName}</p>
                          <p style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '1px' }}>{order.orderCode}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                      {order.items.length < 10 ? `0${order.items.length}` : order.items.length} sản phẩm
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>{formatPrice(order.totalAmount)}</p>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '8px',
                        background: s.bg, fontSize: '11.5px', fontWeight: 700, color: s.color,
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                        {order.statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button style={{
                        fontSize: '12px', fontWeight: 700, color: '#7C3AED',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'opacity 0.2s',
                      }}>
                        Chi tiết
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
