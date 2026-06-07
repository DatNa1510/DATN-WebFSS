import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, ArrowUpRight, ArrowDownRight, Banknote, ShoppingBag, CheckCircle, Package, Flame, RefreshCw, FileText, Table as TableIcon } from 'lucide-react';
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

const STATUS_COLORS = {
  PENDING: J.gray,
  CONFIRMED: J.blue,
  SHIPPING: '#E67E22',
  DELIVERED: J.green,
  CANCELLED: '#E74C3C'
};

const STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ'
};

const getPaymentColor = (method) => {
  const name = method?.toLowerCase() || '';
  if (name.includes('momo')) return '#D82D8B'; // MoMo pink
  if (name.includes('payos')) return '#00B156'; // PayOS green
  return '#7F8C8D'; // Grey for COD / other
};

const statusStyle = {
  DELIVERED: { bg: '#E9F7EF', color: J.green },
  SHIPPING:  { bg: '#FDF2E9', color: '#E67E22' },
  CONFIRMED: { bg: '#EAF2F8', color: J.blue },
  PENDING:   { bg: '#F5F5F5', color: J.gray },
  CANCELLED: { bg: J.redLight, color: J.red },
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
          style={{ width: '32px', height: '32px', border: `2px solid ${J.lightGray}`, borderTopColor: J.red, borderRadius: '50%' }} />
        <p style={{ color: J.gray, fontWeight: 500, fontSize: '13px' }}>Đang tải dữ liệu báo cáo...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', gap: '16px' }}>
        <p style={{ color: J.red, fontWeight: 600 }}>{error}</p>
        <button onClick={() => fetchDashboard(year)} style={{ padding: '8px 20px', borderRadius: '4px', background: J.red, border: 'none', color: J.white, fontWeight: 500, cursor: 'pointer' }}>Thử lại</button>
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
    { 
      label: 'Tổng doanh thu (Năm)', 
      value: formatPrice(stats.totalRevenue || 0), 
      icon: Banknote, 
      borderColor: '#1E3BC3', 
      bg: '#F4F6FF', 
      iconBg: '#E8EEFF', 
      iconColor: '#1E3BC3' 
    },
    { 
      label: 'Doanh thu tháng này', 
      value: formatPrice(stats.revenueThisMonth || 0), 
      icon: Banknote, 
      borderColor: '#DC2626', 
      bg: '#FFF5F5', 
      iconBg: '#FEE2E2', 
      iconColor: '#DC2626', 
      sub: `${isRevenueUp ? '+' : ''}${revenueGrowth}% so với tháng trước`, 
      up: isRevenueUp 
    },
    { 
      label: 'Giá trị đơn TB (AOV)', 
      value: formatPrice(stats.avgOrderValue || 0), 
      icon: Banknote, 
      borderColor: '#7C3AED', 
      bg: '#F5F3FF', 
      iconBg: '#EDE9FE', 
      iconColor: '#7C3AED' 
    },
    { 
      label: 'Tổng đơn hàng', 
      value: (stats.totalOrders || 0).toLocaleString(), 
      icon: ShoppingBag, 
      borderColor: '#0284C7', 
      bg: '#F0F9FF', 
      iconBg: '#E0F2FE', 
      iconColor: '#0284C7' 
    },
    { 
      label: 'Đơn thành công', 
      value: (stats.deliveredOrders || 0).toLocaleString(), 
      icon: CheckCircle, 
      borderColor: '#16A34A', 
      bg: '#F0FDF4', 
      iconBg: '#DCFCE7', 
      iconColor: '#16A34A' 
    },
    { 
      label: 'Đơn chờ xử lý', 
      value: (stats.pendingOrders || 0).toLocaleString(), 
      icon: Package, 
      borderColor: '#D97706', 
      bg: '#FFFBEB', 
      iconBg: '#FEF3C7', 
      iconColor: '#D97706' 
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: J.white, padding: '16px 24px', borderRadius: '4px', border: `1px solid ${J.lightGray}` }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: J.black, letterSpacing: '0.02em' }}>Báo cáo thống kê</h1>
          <p style={{ fontSize: '12px', color: J.gray, marginTop: '4px' }}>Phân tích số liệu kinh doanh thực tế từ hệ thống</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleManualRefresh}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '4px', background: J.white, border: `1px solid ${J.lightGray}`, color: J.gray, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = J.red; e.currentTarget.style.borderColor = J.red; }}
            onMouseLeave={e => { e.currentTarget.style.color = J.gray; e.currentTarget.style.borderColor = J.lightGray; }}
            title="Làm mới dữ liệu"
          >
            <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: 'linear' }}>
              <RefreshCw size={14} />
            </motion.div>
          </button>
          
          <div style={{ position: 'relative' }}>
            <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: J.gray }} />
            <select 
              value={year} onChange={e => setYear(Number(e.target.value))}
              style={{ padding: '8px 12px 8px 32px', borderRadius: '4px', border: `1px solid ${J.lightGray}`, outline: 'none', fontWeight: 500, fontSize: '13px', color: J.black, cursor: 'pointer', appearance: 'none', background: '#FAFAFA' }}
            >
              {Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 1) }, (_, i) => 2026 + i).map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '4px', background: J.red, color: J.white, border: 'none', fontWeight: 500, fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#152e9c'}
            onMouseLeave={e => e.currentTarget.style.background = J.red}
          >
            <Download size={14} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {kpiCards.map((card, i) => (
          <div 
            key={i} 
            style={{ 
              background: card.bg, 
              padding: '20px 24px', 
              borderRadius: '8px', 
              border: `1px solid ${card.iconBg}`,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>
                  {card.label}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 700, color: J.black, lineHeight: 1.2 }}>
                  {card.value}
                </p>
              </div>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: card.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <card.icon size={18} color={card.iconColor} />
              </div>
            </div>
            {card.sub && (
              <p style={{ 
                display: 'flex', alignItems: 'center', gap: '4px', 
                fontSize: '11px', fontWeight: 600, 
                color: card.up ? J.green : J.red, marginTop: '12px' 
              }}>
                {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {card.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        
        {/* Line Chart: Doanh thu theo tháng */}
        <div style={{ background: J.white, padding: '24px', borderRadius: '4px', border: `1px solid ${J.lightGray}` }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: J.black, marginBottom: '24px', letterSpacing: '0.04em' }}>DOANH THU THEO THÁNG ({year})</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={J.lightGray} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: J.gray }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: J.gray }} tickFormatter={val => `${val / 1000000}M`} />
                <RechartsTooltip formatter={(value) => [formatPrice(value), 'Doanh thu']} contentStyle={{ borderRadius: '0px', border: `1px solid ${J.lightGray}`, boxShadow: 'none' }} />
                <Line type="monotone" dataKey="revenue" stroke={J.red} strokeWidth={2} dot={{ r: 3, fill: J.white, strokeWidth: 2, stroke: J.red }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Trạng thái đơn hàng */}
        <div style={{ background: J.white, padding: '24px', borderRadius: '4px', border: `1px solid ${J.lightGray}`, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: J.black, marginBottom: '16px', letterSpacing: '0.04em' }}>TRẠNG THÁI ĐƠN HÀNG</h3>
          <div style={{ flex: 1, minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                  {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [value, 'Số lượng']} contentStyle={{ borderRadius: '0px', border: `1px solid ${J.lightGray}`, boxShadow: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {donutData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.color }} />
                  <span style={{ color: J.gray, fontWeight: 500 }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: J.black }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Bar Chart: Doanh thu theo danh mục */}
        <div style={{ background: J.white, padding: '24px', borderRadius: '4px', border: `1px solid ${J.lightGray}` }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: J.black, marginBottom: '24px', letterSpacing: '0.04em' }}>DOANH THU THEO DANH MỤC</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRevenue} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={J.lightGray} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: J.gray }} tickFormatter={val => `${val / 1000000}M`} />
                <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: J.black, fontWeight: 500 }} width={80} />
                <RechartsTooltip formatter={(value) => [formatPrice(value), 'Doanh thu']} cursor={{ fill: '#FAFAFA' }} contentStyle={{ borderRadius: '0px', border: `1px solid ${J.lightGray}`, boxShadow: 'none' }} />
                <Bar dataKey="revenue" fill="#1E3BC3" radius={[0, 2, 2, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Doanh thu theo phương thức thanh toán */}
        <div style={{ background: J.white, padding: '24px', borderRadius: '4px', border: `1px solid ${J.lightGray}` }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: J.black, marginBottom: '24px', letterSpacing: '0.04em' }}>DOANH THU THEO PTTT</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={J.lightGray} />
                <XAxis dataKey="method" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: J.gray }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: J.gray }} tickFormatter={val => `${val / 1000000}M`} />
                <RechartsTooltip formatter={(value) => [formatPrice(value), 'Doanh thu']} cursor={{ fill: '#FAFAFA' }} contentStyle={{ borderRadius: '0px', border: `1px solid ${J.lightGray}`, boxShadow: 'none' }} />
                <Bar dataKey="revenue" radius={[2, 2, 0, 0]} barSize={32}>
                  {paymentMethodStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPaymentColor(entry.method)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── ROW 3: RECENT ORDERS & TOP PRODUCTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
        
        {/* RECENT ORDERS TABLE */}
        <div style={{ background: J.white, borderRadius: '4px', padding: '24px', border: `1px solid ${J.lightGray}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: J.black, letterSpacing: '0.04em' }}>ĐƠN HÀNG GẦN ĐÂY</h2>
            <Link to="/admin/orders" style={{ fontSize: '12px', fontWeight: 500, color: J.red, textDecoration: 'none' }}>Xem tất cả →</Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${J.lightGray}` }}>
                    {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: J.gray, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em', background: '#FAFAFA' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => {
                    const st = statusStyle[order.status] || statusStyle.PENDING;
                    return (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${J.lightGray}`, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: J.black }}>{order.orderCode}</td>
                        <td style={{ padding: '10px 12px', color: J.gray }}>{order.userName || order.userEmail}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: J.black }}>{formatPrice(order.totalAmount)}</td>
                        <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '10px', fontWeight: 600, background: st.bg, color: st.color }}>{order.statusLabel}</span></td>
                        <td style={{ padding: '10px 12px', color: '#999', fontSize: '11px' }}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: J.gray, fontSize: '13px', fontWeight: 500 }}>Chưa có đơn hàng nào.</div>
          )}
        </div>

        {/* TOP PRODUCTS */}
        <div style={{ background: J.white, borderRadius: '4px', padding: '24px', border: `1px solid ${J.lightGray}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: J.black, letterSpacing: '0.04em' }}>SẢN PHẨM BÁN CHẠY</h2>
            <Flame size={15} style={{ color: '#E74C3C' }} fill="#E74C3C" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {topProducts && topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: i < topProducts.length -1 ? `1px dashed ${J.lightGray}` : 'none' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={p.imagePath ? (p.imagePath.split(',')[0].trim().startsWith('/') ? `http://localhost:8080${p.imagePath.split(',')[0].trim()}` : (p.imagePath.split(',')[0].trim().startsWith('http') ? p.imagePath.split(',')[0].trim() : `http://localhost:8080/images/${p.imagePath.split(',')[0].trim()}`)) : ''}
                    alt={p.productDisplayName}
                    style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', border: `1px solid ${J.lightGray}` }}
                    onError={e => { e.target.src = 'https://placehold.co/40x40/fafaf8/6b6b6b?text=Img'; }}
                  />
                  {i === 0 && (
                    <div style={{
                      position: 'absolute', top: '-4px', right: '-4px',
                      width: '14px', height: '14px', borderRadius: '2px',
                      background: J.red, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '8px', fontWeight: 600, color: J.white,
                    }}>1</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: J.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.productDisplayName}
                  </p>
                  <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px' }}>
                    {formatPrice(p.price)} · <span style={{ color: J.red, fontWeight: 500 }}>{p.sold} đã bán</span>
                  </p>
                </div>
              </div>
            )) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: J.gray, fontSize: '12px', fontWeight: 500 }}>Chưa có sản phẩm.</div>
            )}
          </div>

          <Link to="/admin/products" style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            width: '100%', marginTop: '16px', padding: '8px',
            borderRadius: '4px', border: `1px solid ${J.lightGray}`,
            background: '#FAFAFA', fontSize: '12px', fontWeight: 500, color: J.black,
            transition: 'all 0.2s',
          }} onMouseEnter={e => e.target.style.background = J.white} onMouseLeave={e => e.target.style.background = '#FAFAFA'}>
            Xem tất cả kho hàng →
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
              padding: '6px 12px', borderRadius: '4px',
              background: viewMode === 'table' ? J.red : J.white,
              color: viewMode === 'table' ? J.white : J.gray,
              border: `1px solid ${viewMode === 'table' ? J.red : J.lightGray}`,
              fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <TableIcon size={12} /> Dạng bảng
          </button>
          <button
            onClick={() => setViewMode('raw')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '4px',
              background: viewMode === 'raw' ? J.red : J.white,
              color: viewMode === 'raw' ? J.white : J.gray,
              border: `1px solid ${viewMode === 'raw' ? J.red : J.lightGray}`,
              fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <FileText size={12} /> Dạng thô
          </button>
        </div>

        {viewMode === 'raw' ? (
          <pre style={{
            fontFamily: "'Space Mono', 'Courier New', monospace",
            fontSize: '11px', color: J.black, background: '#FAFAFA',
            border: `1px solid ${J.lightGray}`, padding: '16px',
            borderRadius: '4px', whiteSpace: 'pre', overflow: 'auto',
            maxHeight: '380px', lineHeight: 1.6
          }}>
            {previewCsv}
          </pre>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {previewCsv && parseSections(previewCsv).map((sec, sIdx) => {
              if (sec.type === 'title') {
                return (
                  <h2 key={sIdx} style={{ fontSize: '15px', fontWeight: 600, color: J.black, textAlign: 'center', margin: '8px 0', letterSpacing: '0.04em' }}>
                    {sec.value}
                  </h2>
                );
              }
              return (
               <div key={sIdx} style={{ background: J.white, borderRadius: '4px', padding: '16px', border: `1px solid ${J.lightGray}` }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 600, color: J.red, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.02em' }}>
                    <span style={{ display: 'inline-block', width: '4px', height: '12px', background: J.red }} />
                    {sec.title}
                  </h4>
                  {sec.rows.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${J.lightGray}` }}>
                            {sec.headers.map((h, hIdx) => (
                              <th key={hIdx} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: J.gray, fontSize: '10px', textTransform: 'uppercase', background: '#FAFAFA' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sec.rows.map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: `1px solid ${J.lightGray}` }}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} style={{ padding: '8px 12px', color: J.black, fontWeight: cIdx === 0 ? 500 : 400 }}>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: `1px solid ${J.lightGray}`, paddingTop: '16px' }}>
          <button
            onClick={() => setPreviewCsv(null)}
            style={{
              padding: '8px 16px', borderRadius: '4px', background: J.white, color: J.gray,
              border: `1px solid ${J.lightGray}`, fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = J.white; }}
          >
            Đóng
          </button>
          <button
            onClick={triggerDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '4px', background: J.red, color: J.white,
              border: 'none', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#152e9c'; }}
            onMouseLeave={e => { e.currentTarget.style.background = J.red; }}
          >
            <Download size={14} /> Tải xuống (.csv)
          </button>
        </div>
      </Modal>
    </div>
  );
}
