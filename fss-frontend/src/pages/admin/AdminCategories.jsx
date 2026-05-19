import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, ChevronRight, Tag, Layers, BarChart2 } from 'lucide-react';
import { toast } from '../../store/toastStore';

const API = 'http://localhost:8080';
const getToken = () => { try { return JSON.parse(localStorage.getItem('fss-auth'))?.state?.token || ''; } catch { return ''; } };

const MASTER_COLORS = {
  'Apparel':        { gradient: 'linear-gradient(135deg,#7C3AED,#4F46E5)', light: '#EDE9FE', dot: '#7C3AED' },
  'Accessories':    { gradient: 'linear-gradient(135deg,#0EA5E9,#2563EB)', light: '#DBEAFE', dot: '#0EA5E9' },
  'Footwear':       { gradient: 'linear-gradient(135deg,#F59E0B,#D97706)', light: '#FEF3C7', dot: '#F59E0B' },
  'Personal Care':  { gradient: 'linear-gradient(135deg,#10B981,#059669)', light: '#D1FAE5', dot: '#10B981' },
  'Sporting Goods': { gradient: 'linear-gradient(135deg,#EF4444,#DC2626)', light: '#FEE2E2', dot: '#EF4444' },
  'Home':           { gradient: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', light: '#EDE9FE', dot: '#8B5CF6' },
  'Free Items':     { gradient: 'linear-gradient(135deg,#64748B,#475569)', light: '#F1F5F9', dot: '#64748B' },
};

export default function AdminCategories() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});   // { masterCategory: { total, subCategories: { sub: count } } }
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState({});

  const fetchAndBuild = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products?limit=2000&page=0`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items = data.items || [];
      setTotal(items.length);

      // Group by masterCategory → subCategory
      const grouped = {};
      for (const p of items) {
        const master = p.masterCategory || 'Khác';
        const sub    = p.subCategory    || 'Khác';
        if (!grouped[master]) grouped[master] = { total: 0, subCategories: {} };
        grouped[master].total += 1;
        grouped[master].subCategories[sub] = (grouped[master].subCategories[sub] || 0) + 1;
      }
      setStats(grouped);
    } catch {
      toast.error('Không thể tải dữ liệu danh mục!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAndBuild(); }, [fetchAndBuild]);

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const sortedMasters = Object.entries(stats).sort(([, a], [, b]) => b.total - a.total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.5px' }}>
            Quản lý Danh mục
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>
            Thống kê phân bố sản phẩm theo danh mục trong hệ thống
          </p>
        </div>
        <button
          onClick={fetchAndBuild}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
            color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
            opacity: loading ? 0.7 : 1,
          }}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Tổng sản phẩm', value: total.toLocaleString(), icon: '📦', color: '#7C3AED' },
          { label: 'Danh mục cha', value: sortedMasters.length, icon: '📂', color: '#0EA5E9' },
          { label: 'Danh mục con', value: Object.values(stats).reduce((s, v) => s + Object.keys(v.subCategories).length, 0), icon: '🏷️', color: '#F59E0B' },
          { label: 'Nhiều nhất', value: sortedMasters[0]?.[0] || '—', icon: '🏆', color: '#10B981' },
        ].map((card, i) => (
          <motion.div key={card.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: 'white', borderRadius: '16px', padding: '20px 22px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{card.label}</p>
              <span style={{ fontSize: '20px' }}>{card.icon}</span>
            </div>
            <p style={{ fontSize: card.label === 'Nhiều nhất' ? '16px' : '26px', fontWeight: 900, color: '#1E1B4B', lineHeight: 1, letterSpacing: '-0.5px' }}>
              {loading ? '—' : card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── BAR CHART ── */}
      <div style={{ background: 'white', borderRadius: '18px', padding: '24px 28px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <BarChart2 size={18} style={{ color: '#7C3AED' }} strokeWidth={2.5} />
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B' }}>Phân bố sản phẩm theo danh mục cha</h2>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[80, 60, 45, 30, 20].map((w, i) => (
              <div key={i} style={{ height: '14px', width: `${w}%`, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', borderRadius: '8px' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sortedMasters.map(([master, val]) => {
              const pct = total > 0 ? (val.total / total) * 100 : 0;
              const clr = MASTER_COLORS[master] || MASTER_COLORS['Free Items'];
              return (
                <div key={master}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#374151' }}>{master}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#7C3AED' }}>{val.total.toLocaleString()} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '10px', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                      style={{ height: '100%', background: clr.gradient, borderRadius: '8px' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ACCORDION TABLE ── */}
      <div style={{ background: 'white', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '13px 24px', display: 'grid', gridTemplateColumns: '1fr 160px 120px 140px 80px' }}>
          {['Tên danh mục', 'Danh mục cha', 'Số sản phẩm', '% Tổng kho', 'Thao tác'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '20px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: '52px', background: 'linear-gradient(90deg,#f8fafc 25%,#f1f5f9 50%,#f8fafc 75%)', borderRadius: '8px', marginBottom: '8px' }} />
            ))}
          </div>
        ) : sortedMasters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Layers size={48} style={{ color: '#E2E8F0', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 600 }}>Không có dữ liệu danh mục.</p>
          </div>
        ) : (
          sortedMasters.map(([master, val], idx) => {
            const clr = MASTER_COLORS[master] || MASTER_COLORS['Free Items'];
            const pct = total > 0 ? (val.total / total) * 100 : 0;
            const isOpen = expanded[master];
            const sortedSubs = Object.entries(val.subCategories).sort(([, a], [, b]) => b - a);

            return (
              <div key={master} style={{ borderBottom: idx < sortedMasters.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                {/* Master row */}
                <div
                  onClick={() => toggle(master)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 160px 120px 140px 80px',
                    padding: '14px 24px', cursor: 'pointer', alignItems: 'center',
                    transition: 'background 0.15s',
                    background: isOpen ? 'rgba(124,58,237,0.03)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#FDFDFF'; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Name col */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight size={15} style={{ color: '#7C3AED' }} strokeWidth={2.5} />
                    </motion.div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: clr.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${clr.dot}40` }}>
                      <Layers size={15} color="white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p style={{ fontSize: '13.5px', fontWeight: 800, color: '#1E293B' }}>{master}</p>
                      <p style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '1px' }}>{sortedSubs.length} danh mục con</p>
                    </div>
                  </div>
                  {/* Master col */}
                  <span style={{ fontSize: '12px', fontWeight: 700, background: clr.light, color: clr.dot, padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>
                    Master
                  </span>
                  {/* Count col */}
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>{val.total.toLocaleString()}</span>
                  {/* Pct col */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: clr.gradient, borderRadius: '6px' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', minWidth: '36px' }}>{pct.toFixed(1)}%</span>
                  </div>
                  {/* Action col */}
                  <button
                    onClick={e => { e.stopPropagation(); toggle(master); }}
                    style={{ padding: '5px 12px', borderRadius: '8px', background: isOpen ? 'rgba(124,58,237,0.08)' : '#F8FAFC', border: '1px solid rgba(0,0,0,0.07)', fontSize: '12px', fontWeight: 700, color: isOpen ? '#7C3AED' : '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {isOpen ? 'Thu gọn' : 'Chi tiết'}
                  </button>
                </div>

                {/* Sub-category rows */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden', background: 'rgba(124,58,237,0.015)', borderTop: '1px dashed rgba(124,58,237,0.08)' }}
                    >
                      {sortedSubs.map(([sub, cnt]) => {
                        const subPct = val.total > 0 ? (cnt / val.total) * 100 : 0;
                        return (
                          <div key={sub}
                            style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 140px 80px', padding: '11px 24px 11px 56px', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)', transition: 'background 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            {/* Sub name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Tag size={13} style={{ color: clr.dot, flexShrink: 0 }} strokeWidth={2.5} />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{sub}</span>
                            </div>
                            {/* Master badge */}
                            <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>{master}</span>
                            {/* Count */}
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#475569' }}>{cnt.toLocaleString()}</span>
                            {/* Pct bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '5px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${subPct}%`, background: clr.gradient, borderRadius: '6px' }} />
                              </div>
                              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', minWidth: '36px' }}>{subPct.toFixed(1)}%</span>
                            </div>
                            {/* Empty action */}
                            <span />
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
