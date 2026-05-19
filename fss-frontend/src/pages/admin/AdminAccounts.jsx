import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, User, ChevronLeft, ChevronRight, Users, Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from '../../store/toastStore';

const API = 'http://localhost:8080';
const getToken = () => { try { return JSON.parse(localStorage.getItem('fss-auth'))?.state?.token || ''; } catch { return ''; } };

export default function AdminAccounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, locked: 0, admins: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmLock, setConfirmLock] = useState(null); // id of user to lock/unlock

  const fetchUsers = useCallback(async (p = 0, q = search, r = filterRole, s = filterStatus) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 10, search: q, role: r, status: s });
      const res = await fetch(`${API}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.currentPage || 0);
      setStats(data.stats || { total: 0, locked: 0, admins: 0 });
    } catch {
      toast.error('Không thể tải danh sách tài khoản!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(0, '', 'ALL', 'ALL'); }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { fetchUsers(0, search, filterRole, filterStatus); }, 500);
    return () => clearTimeout(t);
  }, [search, filterRole, filterStatus, fetchUsers]);

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.message);
      setUsers(prev => prev.map(u => u.id === id ? data.user : u));
      // Refresh stats quietly
      fetchUsers(page, search, filterRole, filterStatus);
    } catch {
      toast.error('Không thể cập nhật trạng thái tài khoản!');
    }
    setConfirmLock(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.5px' }}>
            Quản lý người dùng
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>
            Phân quyền, theo dõi trạng thái và lịch sử hoạt động của hệ thống
          </p>
        </div>

      </div>

      {/* ── FILTER BAR ── */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '16px 20px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Tìm tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', height: '42px',
              paddingLeft: '36px', paddingRight: '14px',
              background: '#F8F7FF', border: '1.5px solid rgba(124,58,237,0.1)',
              borderRadius: '10px', fontSize: '13px', color: '#374151',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(124,58,237,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '32px', background: 'rgba(0,0,0,0.07)', flexShrink: 0 }} />

        {/* Role tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'ALL', label: 'Tất cả', icon: '👥' },
            { id: 'ADMIN', label: 'Admin', icon: '🛡️' },
            { id: 'CUSTOMER', label: 'Khách hàng', icon: '👤' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setFilterRole(r.id)}
              style={{
                padding: '7px 14px', borderRadius: '9px',
                fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                border: 'none', fontFamily: 'inherit', transition: 'all 0.2s',
                background: filterRole === r.id ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : '#F1F0FE',
                color: filterRole === r.id ? 'white' : '#6B7280',
                boxShadow: filterRole === r.id ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
              }}
            >
              {r.icon} {r.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              appearance: 'none', padding: '9px 32px 9px 14px',
              background: '#F8F7FF', border: '1.5px solid rgba(124,58,237,0.1)',
              borderRadius: '10px', fontSize: '12.5px', fontWeight: 700,
              color: '#374151', outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7C3AED', fontSize: '10px' }}>▼</div>
        </div>

        <p style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {total} thành viên
        </p>
      </div>

      {/* ── USERS TABLE ── */}
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
                {['Người dùng', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 20px',
                    fontSize: '11px', fontWeight: 700, color: '#94A3B8',
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  {[250, 100, 100, 120, 100].map((w, j) => (
                    <td key={j} style={{ padding: '14px 20px' }}>
                      <div style={{ height: '16px', width: `${w}px`, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', borderRadius: '6px' }} />
                    </td>
                  ))}
                </tr>
              )) : users.map((u, idx) => (
                <motion.tr
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.15s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#FDFDFF';
                    e.currentTarget.querySelector('.user-action').style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.querySelector('.user-action').style.opacity = '0';
                  }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=7C3AED&color=fff`}
                          alt={u.fullName}
                          style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(124,58,237,0.1)' }}
                        />
                        <div style={{
                          position: 'absolute', bottom: '-2px', right: '-2px',
                          width: '11px', height: '11px', borderRadius: '50%',
                          background: u.isEnabled ? '#10B981' : '#EF4444',
                          border: '2px solid white',
                        }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B' }}>{u.fullName}</p>
                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {u.role === 'ADMIN' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '8px',
                        background: 'rgba(124,58,237,0.1)', color: '#6D28D9',
                        fontSize: '11.5px', fontWeight: 800,
                      }}>
                        <Shield size={11} strokeWidth={2.5} /> Admin
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '8px',
                        background: 'rgba(100,116,139,0.09)', color: '#475569',
                        fontSize: '11.5px', fontWeight: 700,
                      }}>
                        <User size={11} strokeWidth={2.5} /> Khách hàng
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '5px 12px', borderRadius: '8px',
                      background: u.isEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.09)',
                      color: u.isEnabled ? '#047857' : '#DC2626',
                      fontSize: '11.5px', fontWeight: 700,
                    }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: u.isEnabled ? '#10B981' : '#EF4444',
                      }} />
                      {u.isEnabled ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <p style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </td>
                  <td style={{ padding: '14px 20px', position: 'relative' }}>
                    <button
                      onClick={() => setConfirmLock(confirmLock === u.id ? null : u.id)}
                      className="user-action"
                      disabled={u.role === 'ADMIN'}
                      style={{
                        opacity: u.role === 'ADMIN' ? 0.3 : 0, transition: 'opacity 0.2s',
                        padding: '6px 14px', borderRadius: '8px',
                        background: u.isEnabled ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', 
                        border: 'none',
                        fontSize: '12.5px', fontWeight: 700, 
                        color: u.isEnabled ? '#EF4444' : '#10B981',
                        cursor: u.role === 'ADMIN' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {u.isEnabled ? 'Khóa' : 'Mở khóa'}
                    </button>
                    
                    {/* Confirm Dialog */}
                    <AnimatePresence>
                      {confirmLock === u.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          style={{
                            position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)',
                            marginRight: '12px', background: 'white', borderRadius: '12px',
                            padding: '16px', width: '240px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            border: '1px solid rgba(0,0,0,0.08)', zIndex: 10,
                          }}
                        >
                          <p style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, marginBottom: '12px', lineHeight: 1.4 }}>
                            Bạn có chắc muốn {u.isEnabled ? 'khóa' : 'mở khóa'} tài khoản <span style={{ color: '#7C3AED' }}>{u.email}</span>?
                          </p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setConfirmLock(null)} style={{ flex: 1, padding: '7px', borderRadius: '8px', background: '#F1F5F9', border: 'none', fontSize: '12px', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Hủy</button>
                            <button onClick={() => toggleStatus(u.id, u.isEnabled)} style={{ flex: 1, padding: '7px', borderRadius: '8px', background: u.isEnabled ? '#EF4444' : '#10B981', border: 'none', fontSize: '12px', fontWeight: 700, color: 'white', cursor: 'pointer' }}>Xác nhận</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {!loading && users.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Users size={48} style={{ color: '#E2E8F0', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 600 }}>Không tìm thấy tài khoản nào.</p>
            </div>
          )}
        </div>

        {users.length > 0 && (
          <div style={{
            padding: '14px 24px', borderTop: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA',
          }}>
            <p style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
              Hiển thị {users.length} trên {total} thành viên
            </p>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 0 ? 'not-allowed' : 'pointer', color: '#64748B', opacity: page === 0 ? 0.5 : 1 }}>
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
                let pNum = page;
                if (page === 0) pNum = i;
                else if (page === totalPages - 1) pNum = totalPages - 3 + i;
                else pNum = page - 1 + i;
                pNum = Math.max(0, Math.min(totalPages - 1, pNum));
                
                return (
                <button key={i} onClick={() => setPage(pNum)} style={{
                  width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  background: page === pNum ? 'linear-gradient(135deg,#7C3AED,#4F46E5)' : 'white',
                  color: page === pNum ? 'white' : '#475569',
                  boxShadow: page === pNum ? '0 2px 8px rgba(124,58,237,0.3)' : '0 0 0 1px rgba(0,0,0,0.09)',
                }}>{pNum + 1}</button>
              )})}
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', color: '#64748B', opacity: page >= totalPages - 1 ? 0.5 : 1 }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          {
            icon: <Users size={20} color="white" strokeWidth={2.5} />,
            gradient: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            glow: 'rgba(124,58,237,0.3)',
            lightBg: '#EDE9FE',
            value: stats.total.toLocaleString(),
            label: 'Tổng người dùng',
            change: 'Hệ thống',
            changeColor: '#10B981',
          },
          {
            icon: <Lock size={20} color="white" strokeWidth={2.5} />,
            gradient: 'linear-gradient(135deg, #EA580C, #C2410C)',
            glow: 'rgba(234,88,12,0.3)',
            lightBg: '#FFF7ED',
            value: stats.locked.toLocaleString(),
            label: 'Tài khoản đang bị khóa',
            change: 'Cần chú ý',
            changeColor: '#F59E0B',
          },
          {
            icon: <ShieldAlert size={20} color="white" strokeWidth={2.5} />,
            gradient: 'linear-gradient(135deg, #4F46E5, #3730A3)',
            glow: 'rgba(79,70,229,0.3)',
            lightBg: '#EEF2FF',
            value: stats.admins.toLocaleString(),
            label: 'Quản trị viên hệ thống',
            change: 'Bảo mật',
            changeColor: '#7C3AED',
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ y: -3, boxShadow: `0 12px 32px ${card.glow}` }}
            style={{
              background: 'white', borderRadius: '18px', padding: '22px 24px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              position: 'relative', overflow: 'hidden', transition: 'all 0.25s',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '80px', height: '80px',
              background: card.lightBg, borderRadius: '0 18px 0 80px',
              opacity: 0.5, pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '13px',
                background: card.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 14px ${card.glow}`,
              }}>
                {card.icon}
              </div>
              <span style={{
                fontSize: '12px', fontWeight: 700, color: card.changeColor,
                background: `${card.changeColor}15`, padding: '3px 8px', borderRadius: '8px',
              }}>
                {card.change}
              </span>
            </div>
            <p style={{ fontSize: '30px', fontWeight: 900, color: '#1E1B4B', lineHeight: 1, letterSpacing: '-1px', marginBottom: '6px', position: 'relative', zIndex: 1 }}>
              {card.value}
            </p>
            <p style={{ fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', position: 'relative', zIndex: 1 }}>
              {card.label}
            </p>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
