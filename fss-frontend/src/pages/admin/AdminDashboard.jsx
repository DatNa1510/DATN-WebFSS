import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Users, Package, Banknote, ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
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
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        return;
      }
      const res = await fetch(`${API}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Dashboard API Error:', res.status, text);
        throw new Error(`Lỗi ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Không thể tải dữ liệu thống kê!');
      toast.error('Không thể tải dữ liệu thống kê!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '16px' }}>
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
        <p style={{ color: '#64748B', fontWeight: 600 }}>Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '16px' }}>
        <p style={{ color: '#DC2626', fontWeight: 600 }}>{error || 'Lỗi tải dữ liệu. Vui lòng kiểm tra lại Backend!'}</p>
        <button
          onClick={fetchDashboard}
          style={{
            padding: '8px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            border: 'none', color: 'white', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Thử lại</button>
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
              <div 
                style={{
                  padding: '5px 12px', borderRadius: '8px',
                  background: '#F8F4FF', border: '1px solid rgba(124,58,237,0.15)',
                  fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                Báo cáo năm nay
              </div>
            </div>
          </div>

          <div style={{ height: '220px', width: '100%', position: 'relative', marginTop: '10px' }}>
            {(() => {
              const dataPoints = revenueData;
              if (dataPoints.length === 0) return null;
              
              const currentMonthStr = `T${new Date().getMonth() + 1}`;
              let currentIdx = dataPoints.findIndex(d => d.month === currentMonthStr);
              if (currentIdx === -1) currentIdx = dataPoints.length - 1; // Fallback
              
              const width = 800;
              const height = 180;
              const maxRev = Math.max(...dataPoints.map(d => Number(d.revenue) || 0), 100000);
              const stepX = width / (dataPoints.length - 1);

              let linePath = `M 0 ${height - ((Number(dataPoints[0].revenue) || 0) / maxRev) * height}`;
              for (let i = 1; i <= currentIdx; i++) {
                const x = i * stepX;
                const revI = Number(dataPoints[i].revenue) || 0;
                const y = height - (revI / maxRev) * height;
                const prevX = (i - 1) * stepX;
                const revPrev = Number(dataPoints[i - 1].revenue) || 0;
                const prevY = height - (revPrev / maxRev) * height;
                const cpX1 = prevX + stepX / 2.5;
                const cpX2 = x - stepX / 2.5;
                linePath += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
              }
              const lastX = currentIdx * stepX;
              const areaPath = `${linePath} L ${lastX} ${height} L 0 ${height} Z`;

              return (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                    <svg viewBox={`-15 -15 ${width + 30} ${height + 30}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8B5CF6"/>
                          <stop offset="100%" stopColor="#4F46E5"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                        <line key={pct} x1="0" y1={height * pct} x2={width} y2={height * pct} stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="4 4" />
                      ))}

                      {/* Area */}
                      <motion.path 
                        d={areaPath} 
                        fill="url(#colorRev)" 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                      
                      {/* Line */}
                      <motion.path 
                        d={linePath} 
                        fill="none" 
                        stroke="url(#lineGrad)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        initial={{ pathLength: 0 }} 
                        animate={{ pathLength: 1 }} 
                        transition={{ duration: 1.5, ease: 'easeInOut' }} 
                        vectorEffect="non-scaling-stroke"
                      />
                      
                      {/* Data Points */}
                      {dataPoints.map((d, i) => {
                        const x = i * stepX;
                        const y = height - (d.revenue / maxRev) * height;
                        const isCurrent = i === currentIdx;
                        return (
                          <g key={d.month}>
                            {isCurrent && (
                              <circle cx={x} cy={y} r="12" fill="#7C3AED" opacity="0.15" />
                            )}
                            <motion.circle 
                              cx={x} cy={y} r={isCurrent ? "5.5" : "4.5"} 
                              fill="white" stroke={isCurrent ? "#4F46E5" : "#8B5CF6"} strokeWidth="2.5" 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 1.2 + i * 0.05, type: 'spring' }}
                              style={{ cursor: 'pointer' }}
                              vectorEffect="non-scaling-stroke"
                            >
                              <title>{`${d.month}: ${(d.revenue).toLocaleString('vi-VN')} đ`}</title>
                            </motion.circle>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px', marginTop: '12px' }}>
                    {dataPoints.map((d, i) => (
                      <span key={d.month} style={{ 
                        fontSize: '11.5px', fontWeight: 700,
                        color: i === currentIdx ? '#7C3AED' : '#94A3B8',
                        transform: `translateX(${(i / (dataPoints.length - 1) - 0.5) * -10}px)` 
                      }}>
                        {d.month}{i === currentIdx && ' (HT)'}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
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
                    src={p.imagePath ? (p.imagePath.split(',')[0].trim().startsWith('/') ? `http://localhost:8080${p.imagePath.split(',')[0].trim()}` : (p.imagePath.split(',')[0].trim().startsWith('http') ? p.imagePath.split(',')[0].trim() : `http://localhost:8080/images/${p.imagePath.split(',')[0].trim()}`)) : ''}
                    alt={p.productDisplayName}
                    style={{ width: '46px', height: '46px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.07)' }}
                    onError={e => { e.target.src = 'https://placehold.co/46x46/f8fafc/94a3b8?text=Img'; }}
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

          <Link to="/admin/products" style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            width: '100%', marginTop: '20px', padding: '10px',
            borderRadius: '12px', border: '1px solid rgba(124,58,237,0.2)',
            background: 'rgba(124,58,237,0.05)',
            fontSize: '13px', fontWeight: 700, color: '#7C3AED',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            Xem tất cả →
          </Link>
        </div>
      </div>

      {/* ── ADVANCED ANALYTICS SECTION ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
        
        {/* Analytics 1: Tỷ lệ hoàn thành */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '28px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B', marginBottom: '4px' }}>Tỷ lệ hoàn thành đơn</h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, marginBottom: '24px' }}>Hiệu suất xử lý đơn hàng</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '160px' }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="#F1F5F9" strokeWidth="12" />
              <motion.circle 
                cx="80" cy="80" r="70" fill="none" stroke="#10B981" strokeWidth="12" 
                strokeDasharray="439.8" strokeDashoffset="439.8" strokeLinecap="round"
                initial={{ strokeDashoffset: 439.8 }} animate={{ strokeDashoffset: 439.8 * 0.22 }} transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#1E1B4B', lineHeight: 1 }}>78%</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>+5.2% tuần này</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>HOÀN THÀNH</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B' }}>{Math.floor((data.stats.totalOrders || 100) * 0.78)} đơn</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>ĐANG XỬ LÝ</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B' }}>{Math.ceil((data.stats.totalOrders || 100) * 0.22)} đơn</div>
            </div>
          </div>
        </div>

        {/* Analytics 2: Phương thức thanh toán */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '28px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B', marginBottom: '4px' }}>Cơ cấu thanh toán</h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, marginBottom: '32px' }}>Các phương thức phổ biến</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {[
              { label: 'Thanh toán COD', pct: 68, color: '#10B981', amount: (data.stats.totalRevenue * 0.68) },
              { label: 'Chuyển khoản (VNPay)', pct: 24, color: '#3B82F6', amount: (data.stats.totalRevenue * 0.24) },
              { label: 'Ví MoMo', pct: 8, color: '#D946EF', amount: (data.stats.totalRevenue * 0.08) },
            ].map((item, idx) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: item.color }}>{item.pct}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1, delay: 0.2 + idx * 0.2 }}
                    style={{ height: '100%', background: item.color, borderRadius: '4px' }} 
                  />
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginTop: '6px', textAlign: 'right' }}>
                  {formatPrice(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics 3: Doanh thu theo danh mục */}
        <div style={{ background: 'linear-gradient(135deg, #1E1B4B, #312E81)', borderRadius: '18px', padding: '28px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 24px rgba(30,27,75,0.25)', color: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Doanh thu theo danh mục</h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                Tỷ trọng đóng góp vào tổng doanh thu
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} color="#A78BFA" />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            {[
              { label: 'Quần áo (Apparel)', pct: 55, color: '#A78BFA' },
              { label: 'Giày dép (Footwear)', pct: 30, color: '#F472B6' },
              { label: 'Phụ kiện (Accessories)', pct: 15, color: '#38BDF8' },
            ].map((item, idx) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>{item.label}</span>
                  <span style={{ color: item.color }}>{item.pct}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1, delay: 0.3 + idx * 0.2 }}
                    style={{ height: '100%', background: item.color, borderRadius: '3px' }} 
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                  {formatPrice((data.stats.totalRevenue || 0) * (item.pct / 100))} đ
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
