import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Plus, Edit2, Trash2, Tag, Percent, Banknote, Calendar, Zap, AlertCircle, History, Search, X } from 'lucide-react';
import { toast } from '../../store/toastStore';
import { formatPrice } from '../../data/mockData';
import AdminLogsDrawer from '../../components/admin/AdminLogsDrawer';

const API = 'http://localhost:8080';
const getToken = () => { try { return JSON.parse(localStorage.getItem('fss-auth'))?.state?.token || ''; } catch { return ''; } };

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  
  // Form State
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa Voucher này?')) return;
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.5px' }}>
            Quản lý Voucher
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>
            Tạo và quản lý các mã giảm giá cho khách hàng
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
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
          <button
            onClick={fetchVouchers} disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px',
              background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700, fontFamily: 'inherit'
            }}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Làm mới
          </button>
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: 'white', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(124,58,237,0.35)'
            }}>
            <Plus size={15} />
            Tạo Voucher mới
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '12px 16px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Tìm mã Voucher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: '40px',
              paddingLeft: '36px', paddingRight: search ? '36px' : '14px',
              background: '#F8F7FF', border: '1.5px solid rgba(124,58,237,0.1)',
              borderRadius: '10px', fontSize: '13px', color: '#374151',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(124,58,237,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {filtered.length} / {vouchers.length} voucher
        </p>
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: 'white', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '13px 24px', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 100px', gap: '16px' }}>
          {['Mã Voucher', 'Loại giảm giá', 'Đơn tối thiểu', 'Hạn sử dụng', 'Lượt dùng', 'Thao tác'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '20px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: '60px', background: 'linear-gradient(90deg,#f8fafc 25%,#f1f5f9 50%,#f8fafc 75%)', borderRadius: '8px', marginBottom: '8px' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Tag size={48} style={{ color: '#E2E8F0', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 600 }}>
              {search ? `Không tìm thấy voucher "${search}"` : 'Chưa có mã giảm giá nào.'}
            </p>
          </div>
        ) : (
          filtered.map((v) => {
            const isExpired = new Date(v.expiryDate) < new Date();
            const isMaxUsed = v.usedCount >= v.usageLimit;
            const statusColor = !v.isActive ? '#64748B' : (isExpired || isMaxUsed) ? '#EF4444' : '#10B981';

            return (
              <div key={v.id} style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 100px', gap: '16px',
                padding: '16px 24px', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.04)',
                background: (!v.isActive || isExpired || isMaxUsed) ? '#F8FAFC' : 'white'
              }}>
                {/* Code & Status */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', background: '#F1F5F9', padding: '4px 10px', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                      {v.code}
                    </span>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}80` }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', fontWeight: 600 }}>
                    {!v.isActive ? 'Đã vô hiệu hóa' : isExpired ? 'Đã hết hạn' : isMaxUsed ? 'Hết lượt dùng' : 'Đang hoạt động'}
                  </p>
                </div>

                {/* Value */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7C3AED', fontWeight: 800, fontSize: '14px' }}>
                    {v.type === 'PERCENT' ? <Percent size={14} /> : <Banknote size={14} />}
                    {v.type === 'PERCENT' ? `${v.value * 100}%` : formatPrice(v.value)}
                  </div>
                  {v.type === 'PERCENT' && v.maxDiscount > 0 && (
                    <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>
                      Tối đa {formatPrice(v.maxDiscount)}
                    </p>
                  )}
                </div>

                {/* Min Order */}
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {v.minOrder > 0 ? formatPrice(v.minOrder) : 'Mọi đơn hàng'}
                </div>

                {/* Expiry */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isExpired ? '#EF4444' : '#475569', fontSize: '13px', fontWeight: 600 }}>
                  <Calendar size={14} />
                  {new Date(v.expiryDate).toLocaleDateString('vi-VN')}
                </div>

                {/* Usage */}
                <div>
                  <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', width: '100px', marginBottom: '4px' }}>
                    <div style={{ height: '100%', background: isMaxUsed ? '#EF4444' : '#10B981', width: `${Math.min(100, (v.usedCount / v.usageLimit) * 100)}%` }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{v.usedCount} / {v.usageLimit}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleOpenModal(v)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(v.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={14} />
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setModalOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', width: '500px', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E1B4B', marginBottom: '24px' }}>
                {editingVoucher ? 'Cập nhật Voucher' : 'Tạo mới Voucher'}
              </h2>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>MÃ VOUCHER *</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="VD: SUMMER24" required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, outline: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>LOẠI GIẢM GIÁ</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, outline: 'none', background: 'white' }}>
                      <option value="PERCENT">Theo phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>GIÁ TRỊ GIẢM *</label>
                    <input type="number" step={formData.type === 'PERCENT' ? "0.01" : "1000"} value={formData.value} onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}
                      placeholder={formData.type === 'PERCENT' ? "0.1 (tương đương 10%)" : "50000"} required
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>ĐƠN TỐI THIỂU (VNĐ)</label>
                    <input type="number" value={formData.minOrder} onChange={e => setFormData({...formData, minOrder: parseFloat(e.target.value)})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>GIẢM TỐI ĐA (VNĐ)</label>
                    <input type="number" value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: parseFloat(e.target.value)})}
                      disabled={formData.type === 'FIXED'}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, outline: 'none', background: formData.type === 'FIXED' ? '#F1F5F9' : 'white' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>HẠN SỬ DỤNG *</label>
                    <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} required
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>GIỚI HẠN SỐ LƯỢNG</label>
                    <input type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: parseInt(e.target.value)})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 600, outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="isActive" style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                    Kích hoạt Voucher (Cho phép sử dụng)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
                  <button type="button" onClick={() => setModalOpen(false)}
                    style={{ padding: '12px 24px', borderRadius: '12px', background: '#F1F5F9', color: '#475569', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Hủy bỏ
                  </button>
                  <button type="submit"
                    style={{ padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
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
    </div>
  );
}
