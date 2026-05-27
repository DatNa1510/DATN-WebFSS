import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Filter, ArrowUpRight, ArrowDownRight, Banknote, ShoppingBag, CheckCircle, Package } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { formatPrice } from '../../data/mockData';
import { toast } from '../../store/toastStore';

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

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchDashboard = async (selectedYear) => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        return;
      }
      const res = await fetch(`${API}/api/admin/dashboard?year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Lỗi ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu báo cáo!');
      toast.error('Không thể tải dữ liệu báo cáo!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(year); }, [year]);

  const handleExport = () => {
    // Để giữ cho mã nhẹ nhàng và không phụ thuộc quá nhiều vào thư viện ngoài, 
    // export có thể được thực hiện bằng cách tạo CSV trực tiếp
    if (!data) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "BÁO CÁO THỐNG KÊ DOANH THU NĂM " + year + "\r\n\r\n";
    
    csvContent += "1. TỔNG QUAN\r\n";
    csvContent += `Tổng doanh thu,${data.stats.totalRevenue}\r\n`;
    csvContent += `Tổng đơn hàng,${data.stats.totalOrders}\r\n`;
    csvContent += `Đơn thành công,${data.stats.deliveredOrders}\r\n`;
    csvContent += `Giá trị đơn TB,${data.stats.avgOrderValue}\r\n\r\n`;

    csvContent += "2. DOANH THU THEO THÁNG\r\n";
    csvContent += "Tháng,Doanh thu\r\n";
    data.revenueData.forEach(r => {
      csvContent += `${r.month},${r.revenue}\r\n`;
    });
    
    csvContent += "\r\n3. DOANH THU THEO DANH MỤC\r\n";
    csvContent += "Danh mục,Doanh thu,Số lượng bán\r\n";
    data.categoryRevenue.forEach(c => {
      csvContent += `${c.category},${c.revenue},${c.quantity}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bao-cao-doanh-thu-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Đã xuất báo cáo CSV thành công!');
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
  const categoryRevenue = data?.categoryRevenue || [];

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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1E1B4B' }}>Báo cáo chi tiết</h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Phân tích số liệu kinh doanh thực tế từ hệ thống</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <select 
              value={year} onChange={e => setYear(Number(e.target.value))}
              style={{ padding: '10px 16px 10px 36px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600, color: '#1E1B4B', cursor: 'pointer', appearance: 'none', background: '#F8FAFC' }}
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>Năm {y}</option>)}
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
    </div>
  );
}
