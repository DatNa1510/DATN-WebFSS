import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Check, AlertTriangle, TrendingUp, Star, ChevronLeft, ChevronRight, Filter, ArrowUpDown } from 'lucide-react';
import { products as initialProducts, categories, formatPrice } from '../../data/mockData';

const emptyForm = { name: '', price: '', originalPrice: '', category: 'ao-thun', description: '', stock: '' };

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: '#F8FAFF', border: '1.5px solid rgba(0,0,0,0.08)',
  borderRadius: '10px', fontSize: '13.5px', color: '#1E293B',
  outline: 'none', fontFamily: 'inherit',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: '#64748B', letterSpacing: '0.06em',
  textTransform: 'uppercase', marginBottom: '7px',
};

export default function AdminProducts() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      setProducts((prev) => prev.map((p) => p.id === editId ? { ...p, ...form, price: Number(form.price) } : p));
      setEditId(null);
    } else {
      setProducts((prev) => [{
        ...emptyForm, ...form,
        id: Date.now(), price: Number(form.price),
        originalPrice: Number(form.originalPrice) || Number(form.price),
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80'],
        sizes: ['S', 'M', 'L', 'XL'], colors: ['#00168d'], colorNames: ['Navy'],
        rating: 0, reviewCount: 0, sold: 0, tags: [], discount: 0, isNew: true,
        isBestSeller: false, stock: Number(form.stock) || 0,
      }, ...prev]);
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, price: p.price, originalPrice: p.originalPrice, category: p.category, description: p.description, stock: p.stock });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.5px' }}>
            Danh sách sản phẩm
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>
            Quản lý kho hàng và thông tin sản phẩm của bạn
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: '42px', paddingLeft: '38px', paddingRight: '16px',
                background: 'white', border: '1px solid rgba(0,0,0,0.09)',
                borderRadius: '10px', fontSize: '13px', color: '#374151',
                outline: 'none', fontFamily: 'inherit', width: '240px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            />
          </div>
          <button
            onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 20px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              fontSize: '13px', fontWeight: 700, color: 'white',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)', whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} strokeWidth={2.5} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Tổng sản phẩm', value: '1,248', sub: '+12% tháng này', subColor: '#10B981', icon: '📦' },
          { label: 'Sắp hết hàng', value: '24', sub: 'Cần nhập thêm', subColor: '#F59E0B', icon: '⚠️' },
          { label: 'Doanh thu SP', value: '420.5M ₫', sub: 'Hiệu suất cao', subColor: '#7C3AED', icon: '💰' },
          { label: 'Đánh giá TB', value: '4.8 ⭐', sub: 'Từ 850 lượt mua', subColor: '#64748B', icon: '🌟' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              background: 'white', borderRadius: '16px', padding: '20px 22px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                {card.label}
              </p>
              <span style={{ fontSize: '20px' }}>{card.icon}</span>
            </div>
            <p style={{ fontSize: '26px', fontWeight: 900, color: '#1E1B4B', lineHeight: 1, letterSpacing: '-0.5px', marginBottom: '8px' }}>
              {card.value}
            </p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: card.subColor }}>
              {card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── MODAL FORM ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px',
              background: 'rgba(15,15,35,0.6)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                background: 'white', borderRadius: '20px',
                width: '100%', maxWidth: '520px', padding: '32px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
                border: '1px solid rgba(124,58,237,0.1)',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                  <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.3px' }}>
                    {editId ? '✏️ Chỉnh sửa sản phẩm' : '➕ Thêm sản phẩm mới'}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '3px' }}>
                    {editId ? 'Cập nhật thông tin sản phẩm' : 'Điền thông tin sản phẩm mới'}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: '#F1F5F9', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748B',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Tên sản phẩm *</label>
                  <input
                    name="name" required value={form.name} onChange={handleChange}
                    placeholder="VD: Áo Polo Premium Navy"
                    style={{
                      ...inputStyle,
                      borderColor: focusedInput === 'name' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                      boxShadow: focusedInput === 'name' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                    }}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Giá bán (₫) *</label>
                    <input
                      name="price" type="number" required value={form.price} onChange={handleChange}
                      placeholder="325000"
                      style={{
                        ...inputStyle,
                        borderColor: focusedInput === 'price' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                        boxShadow: focusedInput === 'price' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                      }}
                      onFocus={() => setFocusedInput('price')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Giá gốc (₫)</label>
                    <input
                      name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange}
                      placeholder="450000"
                      style={{
                        ...inputStyle,
                        borderColor: focusedInput === 'originalPrice' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                        boxShadow: focusedInput === 'originalPrice' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                      }}
                      onFocus={() => setFocusedInput('originalPrice')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Danh mục</label>
                    <select
                      name="category" value={form.category} onChange={handleChange}
                      style={{
                        ...inputStyle, appearance: 'none', cursor: 'pointer',
                        borderColor: focusedInput === 'category' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                      }}
                      onFocus={() => setFocusedInput('category')}
                      onBlur={() => setFocusedInput(null)}
                    >
                      {categories.filter(c => c.id !== 'all').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tồn kho</label>
                    <input
                      name="stock" type="number" value={form.stock} onChange={handleChange}
                      placeholder="85"
                      style={{
                        ...inputStyle,
                        borderColor: focusedInput === 'stock' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                        boxShadow: focusedInput === 'stock' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                      }}
                      onFocus={() => setFocusedInput('stock')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1, padding: '13px',
                      background: '#F1F5F9', border: 'none',
                      borderRadius: '12px', fontSize: '13.5px', fontWeight: 700,
                      color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    id="save-product-btn"
                    style={{
                      flex: 2, padding: '13px',
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      border: 'none', borderRadius: '12px',
                      fontSize: '13.5px', fontWeight: 700, color: 'white',
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                    {editId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN TABLE ── */}
      <div style={{
        background: 'white', borderRadius: '18px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFAFA',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { icon: Filter, label: 'Lọc: Tất cả' },
              { icon: ArrowUpDown, label: 'Sắp xếp: Mới nhất' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px',
                background: 'white', border: '1px solid rgba(0,0,0,0.09)',
                fontSize: '12px', fontWeight: 600, color: '#475569',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500 }}>
            {filtered.length} sản phẩm
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                {['Sản phẩm', 'Giá', 'Tồn kho', 'Đã bán', 'Tags', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '13px 20px',
                    fontSize: '11px', fontWeight: 700, color: '#94A3B8',
                    letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stockColor = p.stock > 10 ? '#10B981' : p.stock > 0 ? '#F59E0B' : '#EF4444';
                const stockBg = p.stock > 10 ? 'rgba(16,185,129,0.1)' : p.stock > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
                const tagData = ['HOT', 'NEW', 'TRENDING', 'SALE', 'PREMIUM'];
                const displayTags = p.tags?.length > 0 ? p.tags.slice(0, 2) : tagData.sort(() => 0.5 - Math.random()).slice(0, 2);

                return (
                  <motion.tr
                    key={p.id}
                    layout
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#FDFDFF';
                      e.currentTarget.querySelector('.row-actions').style.opacity = '1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.querySelector('.row-actions').style.opacity = '0';
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth: '260px' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '12px',
                          overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)',
                          background: '#F8FAFC', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <img
                            src={p.images[0]} alt={p.name}
                            style={{ maxWidth: '42px', maxHeight: '42px', objectFit: 'contain' }}
                            onError={e => { e.target.src = 'https://placehold.co/42x42/f8fafc/94a3b8?text=Img'; }}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            {p.name}
                          </p>
                          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                            {categories.find(c => c.id === p.category)?.name || p.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap' }}>
                        ₫{p.price.toLocaleString()}
                      </p>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '8px',
                        background: stockBg, fontSize: '12.5px', fontWeight: 700, color: stockColor,
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: stockColor }} />
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                      {p.sold?.toLocaleString() || 120}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {displayTags.map((t) => (
                          <span key={t} style={{
                            fontSize: '10px', fontWeight: 700,
                            background: 'rgba(124,58,237,0.08)', color: '#7C3AED',
                            padding: '3px 8px', borderRadius: '6px',
                            letterSpacing: '0.04em',
                          }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div className="row-actions" style={{ display: 'flex', gap: '6px', opacity: 0, transition: 'opacity 0.2s' }}>
                        <button
                          onClick={() => handleEdit(p)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'white', border: '1px solid rgba(0,0,0,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#475569', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F8F4FF'; e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                        >
                          <Edit2 size={13} strokeWidth={2.5} />
                        </button>

                        {deleteConfirm === p.id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleDelete(p.id)}
                              style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: '#EF4444', border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'white',
                              }}
                            >
                              <Check size={13} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'white', border: '1px solid rgba(0,0,0,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#64748B',
                              }}
                            >
                              <X size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'white', border: '1px solid rgba(0,0,0,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: '#94A3B8', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FFF1F1'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                          >
                            <Trash2 size={13} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 500 }}>Không tìm thấy sản phẩm nào.</p>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA',
          }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 14px', borderRadius: '8px',
              background: 'white', border: '1px solid rgba(0,0,0,0.09)',
              fontSize: '12.5px', fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <ChevronLeft size={16} /> Trước
            </button>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3].map(n => (
                <button key={n} style={{
                  width: '34px', height: '34px', borderRadius: '8px',
                  background: n === 1 ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : 'white',
                  border: n === 1 ? 'none' : '1px solid rgba(0,0,0,0.09)',
                  fontSize: '13px', fontWeight: 700,
                  color: n === 1 ? 'white' : '#475569',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: n === 1 ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                }}>{n}</button>
              ))}
              <span style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px' }}>...</span>
              <button style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'white', border: '1px solid rgba(0,0,0,0.09)',
                fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
              }}>12</button>
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 14px', borderRadius: '8px',
              background: 'white', border: '1px solid rgba(0,0,0,0.09)',
              fontSize: '12.5px', fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Sau <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
