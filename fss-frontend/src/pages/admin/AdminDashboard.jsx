import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, ArrowUpRight, ArrowDownRight, Banknote, ShoppingBag, CheckCircle, Package, Star, RefreshCw, FileText, Table as TableIcon } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../data/mockData';
import { toast } from '../../store/toastStore';
import Modal from '../../components/ui/Modal';

const API = 'http://localhost:8080';
const getToken = () => { try { return JSON.parse(localStorage.getItem('fss-auth'))?.state?.token || ''; } catch { return ''; } };

const STATUS_COLORS = {
  PENDING: '#94A3B8',
  CONFIRMED: '#7C3AED',
  SHIPPING: '#0EA5E9',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444'
};

const STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ'
};

const PAYMENT_COLORS = ['#10B981', '#3B82F6', '#D946EF', '#F59E0B'];

const statusStyle = {
  DELIVERED: { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  SHIPPING:  { bg: 'rgba(14,165,233,0.1)', color: '#0284C7' },
  CONFIRMED: { bg: 'rgba(124,58,237,0.1)', color: '#6D28D9' },
  PENDING:   { bg: 'rgba(100,116,139,0.1)', color: '#475569' },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#DC2626' },
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewCsv, setPreviewCsv] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'raw'

  const fetchDashboard = async (selectedYear, showLoader = true) => {
    if (showLoader) setLoading(true);
    if (showLoader) setError(null);
    try {
      const token = getToken();
      if (!token) {
        if (showLoader) setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        return;
      }
      const res = await fetch(`${API}/api/admin/dashboard?year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Lỗi ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      if (showLoader) setError(err.message || 'Không thể tải dữ liệu báo cáo!');
      else toast.error('Lỗi khi làm mới dữ liệu báo cáo ngầm!');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDashboard(year); 
    const interval = setInterval(() => {
      fetchDashboard(year, false);
    }, 30000);
    return () => clearInterval(interval);
  }, [year]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboard(year, false);
    setIsRefreshing(false);
    toast.success('Đã làm mới dữ liệu!');
  };

  const handleExport = () => {
    if (!data) return;
    
    // Hàm định dạng số để Excel không bị lỗi khoa học (VD: 7.73E+08)
    const fmtVND = (num) => `"${(num || 0).toLocaleString('vi-VN')} ₫"`;
    const fmtNum = (num) => `"${(num || 0).toLocaleString('vi-VN')}"`;
    const catMap = { 'Accessories': 'Phụ kiện', 'Apparel': 'Quần áo', 'Footwear': 'Giày dép' };

    let csvContent = "";
    csvContent += `"BÁO CÁO THỐNG KÊ DOANH THU NĂM ${year}"\r\n\r\n`;
    
    csvContent += "1. TỔNG QUAN\r\n";
    csvContent += "Chỉ số,Giá trị\r\n";
    csvContent += `Tổng doanh thu,${fmtVND(data.stats?.totalRevenue)}\r\n`;
    csvContent += `Tổng đơn hàng,${fmtNum(data.stats?.totalOrders)}\r\n`;
    csvContent += `Đơn thành công,${fmtNum(data.stats?.deliveredOrders)}\r\n`;
    csvContent += `Giá trị đơn TB (AOV),${fmtVND(data.stats?.avgOrderValue)}\r\n\r\n`;

    csvContent += "2. DOANH THU THEO THÁNG\r\n";
    csvContent += "Tháng,Doanh thu\r\n";
    (data.revenueData || []).forEach(r => {
      csvContent += `"${r.month}",${fmtVND(r.revenue)}\r\n`;
    });
    
    csvContent += "\r\n3. DOANH THU THEO DANH MỤC\r\n";
    csvContent += "Danh mục,Doanh thu,Số lượng bán\r\n";
    (data.categoryRevenue || []).forEach(c => {
      const catName = catMap[c.category] || c.category;
      csvContent += `"${catName}",${fmtVND(c.revenue)},${fmtNum(c.quantity)}\r\n`;
    });

    setPreviewCsv(csvContent);
  };

  const triggerDownload = () => {
    if (!previewCsv) return;
    const fullContent = "data:text/csv;charset=utf-8,\uFEFF" + previewCsv;
    const encodedUri = encodeURI(fullContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bao-cao-doanh-thu-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setPreviewCsv(null);
    toast.success('Đã tải xuống báo cáo CSV thành công!');
  };

  const parseSections = (csvText) => {
    const sections = [];
    let currentSection = null;
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");

    lines.forEach((line, idx) => {
      if (idx === 0) {
        sections.push({ type: 'title', value: line.replace(/^"|"$/g, '') });
        return;
      }
      if (line.match(/^[1-3]\.\s+/)) {
        currentSection = { type: 'section', title: line, headers: [], rows: [] };
        sections.push(currentSection);
        return;
      }
      
      const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
      
      if (currentSection) {
        if (currentSection.headers.length === 0 && (line.includes('Chỉ số') || line.includes('Tháng') || line.includes('Danh mục'))) {
          currentSection.headers = cells;
        } else {
          currentSection.rows.push(cells);
        }
      }
    });
    return sections;
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '16px' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: '40px', height: '40px', border: '4px solid rgba(124,58,237,0.1)', borderTopColor: '#7C3AED', borderRadius: '50%' }} />
        <p style={{ color: '#64748B', fontWeight: 600 }}>Đang tải dữ liệu báo cáo...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '16px' }}>
        <p style={{ color: '#DC2626', fontWeight: 600 }}>{error}</p>
        <button onClick={() => fetchDashboard(year)} style={{ padding: '8px 20px', borderRadius: '10px', background: '#7C3AED', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Thử lại</button>
      </div>
    );
  }

  const stats = data?.stats || {};
  const revenueData = data?.revenueData || [];
  const orderStatusStats = data?.orderStatusStats || {};
  const paymentMethodStats = data?.paymentMethodStats || [];
  const categoryRevenue = (data?.categoryRevenue || []).map(item => ({
    ...item,
    category: {
      'Accessories': 'Phụ kiện',
      'Apparel': 'Quần áo',
      'Footwear': 'Giày dép'
    }[item.category] || item.category
  }));
  const recentOrders = data?.recentOrders || [];
  const topProducts = data?.topProducts || [];

  // Chart data formatting
  const donutData = Object.entries(orderStatusStats).map(([key, value]) => ({
    name: STATUS_LABELS[key.toUpperCase()] || key,
    value: value,
    color: STATUS_COLORS[key.toUpperCase()] || '#CBD5E1'
  })).filter(d => d.value > 0);

  const revenueGrowth = stats.revenueLastMonth && stats.revenueLastMonth > 0
    ? (((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100).toFixed(1)
    : '0.0';
  const isRevenueUp = parseFloat(revenueGrowth) >= 0;

  const kpiCards = [
    { label: 'Tổng doanh thu (Năm)', value: formatPrice(stats.totalRevenue || 0), icon: Banknote, color: '#10B981' },
    { label: 'Doanh thu tháng này', value: formatPrice(stats.revenueThisMonth || 0), icon: Banknote, color: '#7C3AED', sub: `${isRevenueUp ? '+' : ''}${revenueGrowth}% so với tháng trước`, up: isRevenueUp },
    { label: 'Giá trị đơn TB (AOV)', value: formatPrice(stats.avgOrderValue || 0), icon: Banknote, color: '#F59E0B' },
    { label: 'Tổng đơn hàng', value: (stats.totalOrders || 0).toLocaleString(), icon: ShoppingBag, color: '#3B82F6' },
    { label: 'Đơn thành công', value: (stats.deliveredOrders || 0).toLocaleString(), icon: CheckCircle, color: '#10B981' },
    { label: 'Đơn chờ xử lý', value: (stats.pendingOrders || 0).toLocaleString(), icon: Package, color: '#64748B' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '20px 28px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B' }}>Báo cáo thống kê</h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Phân tích số liệu kinh doanh thực tế từ hệ thống</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleManualRefresh}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: 'white', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.borderColor = '#7C3AED'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            title="Làm mới dữ liệu"
          >
            <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: 'linear' }}>
              <RefreshCw size={16} />
            </motion.div>
          </button>
          
          <div style={{ position: 'relative' }}>
            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <select 
              value={year} onChange={e => setYear(Number(e.target.value))}
              style={{ padding: '10px 16px 10px 36px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600, color: '#1E1B4B', cursor: 'pointer', appearance: 'none', background: '#F8FAFC' }}
            >
              {Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 1) }, (_, i) => 2026 + i).map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: '#1E1B4B', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
          >
            <Download size={16} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {kpiCards.map((card, i) => (
          <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={20} color={card.color} />
              </div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>{card.label}</p>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B' }}>{card.value}</p>
            {card.sub && (
              <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: card.up ? '#10B981' : '#EF4444', marginTop: '8px' }}>
                {card.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {card.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Line Chart: Doanh thu theo tháng */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B', marginBottom: '24px' }}>Doanh thu theo tháng ({year})</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={val => `${val / 1000000}M`} />
                <RechartsTooltip formatter={(value) => [formatPrice(value), 'Doanh thu']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4, fill: '#7C3AED', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Trạng thái đơn hàng */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B', marginBottom: '16px' }}>Trạng thái đơn hàng</h3>
          <div style={{ flex: 1, minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [value, 'Số lượng']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {donutData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                  <span style={{ color: '#475569', fontWeight: 600 }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 800, color: '#1E1B4B' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Bar Chart: Doanh thu theo danh mục */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B', marginBottom: '24px' }}>Doanh thu theo danh mục</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRevenue} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={val => `${val / 1000000}M`} />
                <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1E1B4B', fontWeight: 600 }} width={80} />
                <RechartsTooltip formatter={(value) => [formatPrice(value), 'Doanh thu']} cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Doanh thu theo phương thức thanh toán */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B', marginBottom: '24px' }}>Doanh thu theo phương thức TT</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="method" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={val => `${val / 1000000}M`} />
                <RechartsTooltip formatter={(value) => [formatPrice(value), 'Doanh thu']} cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40}>
                  {paymentMethodStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── ROW 3: RECENT ORDERS & TOP PRODUCTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        
        {/* RECENT ORDERS TABLE */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '28px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B' }}>Đơn hàng gần đây</h2>
            <Link to="/admin/orders" style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', textDecoration: 'none', padding: '6px 14px', borderRadius: '8px', background: 'rgba(124,58,237,0.06)' }}>Xem tất cả →</Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                    {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#94A3B8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => {
                    const st = statusStyle[order.status] || statusStyle.PENDING;
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFE'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#1E1B4B' }}>{order.orderCode}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{order.userName || order.userEmail}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#1E1B4B' }}>{formatPrice(order.totalAmount)}</td>
                        <td style={{ padding: '12px' }}><span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: st.bg, color: st.color }}>{order.statusLabel}</span></td>
                        <td style={{ padding: '12px', color: '#94A3B8', fontSize: '12px' }}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '14px', fontWeight: 600 }}>Chưa có đơn hàng nào.</div>
          )}
        </div>

        {/* TOP PRODUCTS */}
        <div style={{ background: 'white', borderRadius: '18px', padding: '28px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B' }}>🔥 Bán chạy nhất</h2>
            <Star size={16} style={{ color: '#F59E0B' }} fill="#F59E0B" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {topProducts && topProducts.length > 0 ? topProducts.map((p, i) => (
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
                      fontSize: '9px', fontWeight: 800, color: 'white', border: '2px solid white',
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
            )) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>Chưa có sản phẩm.</div>
            )}
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

      {/* MODAL XEM TRƯỚC CSV */}
      <Modal isOpen={!!previewCsv} onClose={() => setPreviewCsv(null)} title="Xem trước dữ liệu báo cáo" size="lg">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              background: viewMode === 'table' ? '#7C3AED' : 'white',
              color: viewMode === 'table' ? 'white' : '#64748B',
              border: '1px solid ' + (viewMode === 'table' ? '#7C3AED' : '#E2E8F0'),
              fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <TableIcon size={14} /> Dạng bảng
          </button>
          <button
            onClick={() => setViewMode('raw')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              background: viewMode === 'raw' ? '#7C3AED' : 'white',
              color: viewMode === 'raw' ? 'white' : '#64748B',
              border: '1px solid ' + (viewMode === 'raw' ? '#7C3AED' : '#E2E8F0'),
              fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <FileText size={14} /> Dạng thô
          </button>
        </div>

        {viewMode === 'raw' ? (
          <pre style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '12.5px',
            color: '#334155',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '16px',
            borderRadius: '12px',
            whiteSpace: 'pre',
            overflow: 'auto',
            maxHeight: '380px',
            lineHeight: 1.5
          }}>
            {previewCsv}
          </pre>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {previewCsv && parseSections(previewCsv).map((sec, sIdx) => {
              if (sec.type === 'title') {
                return (
                  <h2 key={sIdx} style={{ fontSize: '18px', fontWeight: 800, color: '#1E1B4B', textAlign: 'center', margin: '10px 0' }}>
                    {sec.value}
                  </h2>
                );
              }
              return (
                <div key={sIdx} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#7C3AED', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '14px', background: '#7C3AED', borderRadius: '3px' }} />
                    {sec.title}
                  </h4>
                  {sec.rows.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                            {sec.headers.map((h, hIdx) => (
                              <th key={hIdx} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748B', fontSize: '11px', textTransform: 'uppercase' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sec.rows.map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} style={{ padding: '10px 12px', color: '#1E293B', fontWeight: cIdx === 0 ? 600 : 700 }}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
          <button
            onClick={() => setPreviewCsv(null)}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              background: 'white', color: '#64748B',
              border: '1px solid #E2E8F0', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
          >
            Đóng
          </button>
          <button
            onClick={triggerDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px',
              background: '#1E1B4B', color: 'white',
              border: 'none', fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#111827'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1E1B4B'; }}
          >
            <Download size={16} /> Tải xuống (.csv)
          </button>
        </div>
      </Modal>
    </div>
  );
}
