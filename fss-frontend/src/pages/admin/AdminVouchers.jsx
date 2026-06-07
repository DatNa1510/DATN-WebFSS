import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Plus, Edit2, Trash2, Tag, Percent, Banknote, Calendar, Search, X, History, ShoppingBag } from 'lucide-react';
import { toast } from '../../store/toastStore';
import { formatPrice } from '../../data/mockData';
import AdminLogsDrawer from '../../components/admin/AdminLogsDrawer';
import ConfirmModal from '../../components/ui/ConfirmModal';

const API = 'https://datn-webfss.onrender.com';
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

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 600,
  color: J.gray,
  marginBottom: '6px',
  letterSpacing: '0.05em',
};

const inputStyle = {
  width: '100%',
  height: '36px',
  padding: '0 12px',
  background: '#FAFAFA',
  border: `1px solid ${J.lightGray}`,
  borderRadius: '4px',
  fontSize: '12px',
  color: J.black,
  outline: 'none',
  boxSizing: 'border-box',
};

export default function AdminVouchers() {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '', type: 'PERCENT', value: 0, minOrder: 0, maxDiscount: 0, expiryDate: '', usageLimit: 100, isActive: true
  });

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/vouchers/admin`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVouchers(data || []);
    } catch {
      toast.error('Không thể tải danh sách Voucher!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const handleOpenModal = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code, type: voucher.type, value: voucher.value,
        minOrder: voucher.minOrder, maxDiscount: voucher.maxDiscount || 0,
        expiryDate: voucher.expiryDate, usageLimit: voucher.usageLimit, isActive: voucher.isActive
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        code: '', type: 'PERCENT', value: 0, minOrder: 0, maxDiscount: 0, 
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], 
        usageLimit: 100, isActive: true
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.code || formData.value <= 0 || !formData.expiryDate) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    try {
      const url = editingVoucher ? `${API}/api/vouchers/admin/${editingVoucher.id}` : `${API}/api/vouchers/admin`;
      const method = editingVoucher ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Có lỗi xảy ra');
      
      toast.success(editingVoucher ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
      setModalOpen(false);
      fetchVouchers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/vouchers/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error();
      toast.success('Xóa Voucher thành công!');
      fetchVouchers();
    } catch {
      toast.error('Không thể xóa Voucher này!');
    }
  };

  const filtered = vouchers.filter(v =>
    v.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: J.black, letterSpacing: '0.02em' }}>
            Quản lý Voucher
          </h1>
          <p style={{ fontSize: '12px', color: J.gray, marginTop: '4px' }}>
            Tạo và quản lý các mã giảm giá cho khách hàng
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/admin/orders')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '4px',
              background: J.white, border: `1px solid ${J.lightGray}`,
              fontSize: '12px', fontWeight: 500, color: J.black,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.black; }}
          >
            <ShoppingBag size={14} /> Đơn hàng
          </button>
          <button
            onClick={() => setIsLogsOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '4px',
              background: J.white, border: `1px solid ${J.lightGray}`,
              fontSize: '12px', fontWeight: 500, color: J.black,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.black; }}
          >
            <History size={14} /> Lịch sử
          </button>
          <button
            onClick={fetchVouchers} disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '4px',
              background: J.white, color: J.gray, border: `1px solid ${J.lightGray}`, cursor: 'pointer',
              fontSize: '12px', fontWeight: 500
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = J.red}
            onMouseLeave={e => e.currentTarget.style.borderColor = J.lightGray}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Làm mới
          </button>
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '4px',
              background: J.red, color: J.white, border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 500
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#152e9c'}
            onMouseLeave={e => e.currentTarget.style.background = J.red}
          >
            <Plus size={14} />
            Tạo Voucher mới
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{
        background: J.white, borderRadius: '4px', padding: '12px 16px',
        border: `1px solid ${J.lightGray}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: J.gray }} />
          <input
            type="text"
            placeholder="Tìm mã Voucher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: '36px',
              paddingLeft: '34px', paddingRight: search ? '34px' : '14px',
              background: '#FAFAFA', border: `1px solid ${J.lightGray}`,
              borderRadius: '4px', fontSize: '12px', color: J.black,
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = J.red; }}
            onBlur={e => { e.target.style.borderColor = J.lightGray; }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: J.gray, display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p style={{ fontSize: '12px', color: J.gray }}>
          {filtered.length} / {vouchers.length} voucher
        </p>
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: J.white, borderRadius: '4px', border: `1px solid ${J.lightGray}`, overflow: 'hidden' }}>
        <div style={{ background: '#F5F5F5', borderBottom: `1px solid ${J.lightGray}`, padding: '12px 24px', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr 100px', gap: '16px' }}>
          {['Mã Voucher', 'Loại giảm giá', 'Đơn tối thiểu', 'Hạn sử dụng', 'Lượt dùng', 'Thao tác'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: J.gray, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '20px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: '48px', borderBottom: `1px solid ${J.lightGray}`, display: 'flex', alignItems: 'center', color: J.gray, fontSize: '12px' }}>Đang tải...</div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Tag size={32} style={{ color: '#CCCCCC', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: J.gray, fontWeight: 500 }}>
              {search ? `Không tìm thấy voucher "${search}"` : 'Chưa có mã giảm giá nào.'}
            </p>
          </div>
        ) : (
          filtered.map((v) => {
            const isExpired = new Date(v.expiryDate) < new Date();
            const isMaxUsed = v.usedCount >= v.usageLimit;
            const statusColor = !v.isActive ? J.gray : (isExpired || isMaxUsed) ? '#E74C3C' : J.green;
            const statusBg = !v.isActive ? '#F5F5F5' : (isExpired || isMaxUsed) ? '#FDEDEC' : '#E9F7EF';

            return (
              <div key={v.id} style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr 100px', gap: '16px',
                padding: '12px 24px', alignItems: 'center', borderBottom: `1px solid ${J.lightGray}`,
                background: (!v.isActive || isExpired || isMaxUsed) ? '#FAFAF8' : 'white'
              }}>
                {/* Code & Status */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: J.black, background: '#FAFAFA', padding: '3px 8px', borderRadius: '2px', border: `1px dashed ${J.lightGray}` }}>
                      {v.code}
                    </span>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
                  </div>
                  <p style={{ fontSize: '10px', color: J.gray, marginTop: '4px' }}>
                    {!v.isActive ? 'Đã vô hiệu hóa' : isExpired ? 'Đã hết hạn' : isMaxUsed ? 'Hết lượt dùng' : 'Đang hoạt động'}
                  </p>
                </div>

                {/* Value */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: J.red, fontWeight: 600, fontSize: '13px' }}>
                    {v.type === 'PERCENT' ? `${v.value * 100}%` : formatPrice(v.value)}
                  </div>
                  {v.type === 'PERCENT' && v.maxDiscount > 0 && (
                    <p style={{ fontSize: '10px', color: J.gray, marginTop: '2px' }}>
                      Tối đa {formatPrice(v.maxDiscount)}
                    </p>
                  )}
                </div>

                {/* Min Order */}
                <div style={{ fontSize: '12px', color: J.black }}>
                  {v.minOrder > 0 ? formatPrice(v.minOrder) : 'Mọi đơn hàng'}
                </div>

                {/* Expiry */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isExpired ? '#E74C3C' : J.black, fontSize: '12px' }}>
                  <Calendar size={12} />
                  {new Date(v.expiryDate).toLocaleDateString('vi-VN')}
                </div>

                {/* Usage */}
                <div>
                  <div style={{ height: '4px', background: J.lightGray, borderRadius: '2px', overflow: 'hidden', width: '80px', marginBottom: '4px' }}>
                    <div style={{ height: '100%', background: isMaxUsed ? '#E74C3C' : J.green, width: `${Math.min(100, (v.usedCount / v.usageLimit) * 100)}%` }} />
                  </div>
                  <span style={{ fontSize: '10px', color: J.gray }}>{v.usedCount} / {v.usageLimit}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleOpenModal(v)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: `1px solid ${J.lightGray}`, background: 'white', color: J.gray, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.gray; }}
                  >
                    <Edit2 size={12} />
                  </button>
                   <button onClick={() => setConfirmDeleteId(v.id)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: `1px solid ${J.lightGray}`, background: 'white', color: J.gray, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.gray; }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setModalOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
              style={{ position: 'relative', width: '460px', background: J.white, borderRadius: '4px', padding: '32px', border: `1px solid ${J.lightGray}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
            >
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: J.black, marginBottom: '20px', letterSpacing: '0.02em' }}>
                {editingVoucher ? 'Cập nhật Voucher' : 'Tạo mới Voucher'}
              </h2>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div>
                  <label style={labelStyle}>MÃ VOUCHER *</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="Mã Voucher" required
                    style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>LOẠI GIẢM GIÁ</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', background: '#FAFAFA' }}>
                      <option value="PERCENT">Theo phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>GIÁ TRỊ GIẢM *</label>
                    <input type="number" step={formData.type === 'PERCENT' ? "0.01" : "1000"} value={formData.value} onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}
                      placeholder="Giá trị giảm" required
                      style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>ĐƠN TỐI THIỂU (VNĐ)</label>
                    <input type="number" value={formData.minOrder} onChange={e => setFormData({...formData, minOrder: parseFloat(e.target.value)})}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>GIẢM TỐI ĐA (VNĐ)</label>
                    <input type="number" value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: parseFloat(e.target.value)})}
                      disabled={formData.type === 'FIXED'}
                      style={{ ...inputStyle, background: formData.type === 'FIXED' ? '#EEEEEE' : '#FAFAFA' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>HẠN SỬ DỤNG *</label>
                    <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} required
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>GIỚI HẠN SỐ LƯỢNG</label>
                    <input type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: parseInt(e.target.value)})}
                      style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    style={{ cursor: 'pointer' }} />
                  <label htmlFor="isActive" style={{ fontSize: '12px', fontWeight: 500, color: J.black, cursor: 'pointer' }}>
                    Kích hoạt Voucher (Cho phép sử dụng)
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px', borderTop: `1px solid ${J.lightGray}`, paddingTop: '20px' }}>
                  <button type="button" onClick={() => setModalOpen(false)}
                    style={{ padding: '10px', borderRadius: '4px', background: J.white, color: J.gray, border: `1px solid ${J.lightGray}`, fontWeight: 500, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                    onMouseLeave={e => e.currentTarget.style.background = J.white}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit"
                    style={{ padding: '10px', borderRadius: '4px', background: J.red, color: 'white', border: 'none', fontWeight: 500, cursor: 'pointer' }}
                  >
                    {editingVoucher ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AdminLogsDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        targetType="VOUCHER"
        title="Lịch sử Quản lý Voucher"
      />

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => handleDelete(confirmDeleteId)}
        title="Xóa Voucher"
        message="Bạn có chắc chắn muốn xóa Voucher này? Hành động này không thể hoàn tác."
        isDanger={true}
        confirmText="Xóa"
      />
    </div>
  );
}
