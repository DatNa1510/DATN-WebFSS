import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, User, ChevronLeft, ChevronRight, Users, Lock, ShieldAlert, Loader2, Trash2, History, RotateCcw } from 'lucide-react';
import { toast } from '../../store/toastStore';
import AdminLogsDrawer from '../../components/admin/AdminLogsDrawer';

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
  const [lockReason, setLockReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // id of user to delete
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(null); // id of user to restore
  const [isLogsOpen, setIsLogsOpen] = useState(false);

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

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, filterRole, filterStatus]);

  // Debounced fetch
  useEffect(() => {
    const t = setTimeout(() => { fetchUsers(page, search, filterRole, filterStatus); }, 500);
    return () => clearTimeout(t);
  }, [page, search, filterRole, filterStatus, fetchUsers]);

  const toggleStatus = async (id, currentStatus) => {
    if (currentStatus && !lockReason.trim()) {
      toast.error('Vui lòng nhập lý do khóa tài khoản!');
      return;
    }
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ reason: lockReason })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi hệ thống');
      }
      const data = await res.json();
      toast.success(data.message);
      setUsers(prev => prev.map(u => u.id === id ? data.user : u));
      fetchUsers(page, search, filterRole, filterStatus);
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái tài khoản!');
    }
    setConfirmLock(null);
    setLockReason('');
  };

  const deleteUser = async (id) => {
    if (!deleteReason.trim()) {
      toast.error('Vui lòng nhập lý do xóa tài khoản!');
      return;
    }
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ reason: deleteReason })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.message);
      setUsers(prev => prev.map(u => u.id === id ? data.user : u));
      fetchUsers(page, search, filterRole, filterStatus);
    } catch {
      toast.error('Không thể xóa tài khoản!');
    }
    setConfirmDelete(null);
    setDeleteReason('');
  };

  const restoreUser = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khôi phục');
      toast.success(data.message);
      setUsers(prev => prev.map(u => u.id === id ? data.user : u));
      fetchUsers(page, search, filterRole, filterStatus);
    } catch (err) {
      toast.error(err.message || 'Không thể khôi phục tài khoản!');
    }
    setConfirmRestore(null);
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
            Theo dõi trạng thái, khóa và xóa tài khoản
          </p>
        </div>
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
            <option value="DELETED">Đã xóa</option>
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
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 140px)', minHeight: '650px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                {['Người dùng', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 20px',
                    fontSize: '11px', fontWeight: 700, color: '#94A3B8',
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    background: '#FAFAFA', // Đảm bảo background không bị trong suốt khi cuộn
                    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.05)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
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
                      <p style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600 }}>Đang tải danh sách thành viên...</p>
                    </div>
                  </td>
                </tr>
              ) : users.map((u, idx) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.4) }}
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
                          src={u.avatarUrl ? (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${API}/images/${u.avatarUrl}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=7C3AED&color=fff`}
                          alt={u.fullName}
                          style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(124,58,237,0.1)' }}
                          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=7C3AED&color=fff`; }}
                        />
                        <div style={{
                          position: 'absolute', bottom: '-2px', right: '-2px',
                          width: '11px', height: '11px', borderRadius: '50%',
                          background: u.isDeleted ? '#94A3B8' : (u.isEnabled ? '#10B981' : '#EF4444'),
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
                      background: u.isDeleted ? 'rgba(100,116,139,0.08)' : (u.isEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.09)'),
                      color: u.isDeleted ? '#64748B' : (u.isEnabled ? '#047857' : '#DC2626'),
                      fontSize: '11.5px', fontWeight: 700,
                    }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: u.isDeleted ? '#94A3B8' : (u.isEnabled ? '#10B981' : '#EF4444'),
                      }} />
                      {u.isDeleted ? 'Đã xóa' : (u.isEnabled ? 'Hoạt động' : 'Đã khóa')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <p style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div className="user-action" style={{ display: 'flex', gap: '6px', opacity: 1, transition: 'opacity 0.2s' }}>
                      {/* Nút Khóa / Mở khóa */}
                      {!u.isDeleted && u.role !== 'ADMIN' && (
                        <button
                          onClick={() => { setConfirmLock(confirmLock === u.id ? null : u.id); setConfirmDelete(null); setLockReason(''); }}
                          style={{
                            padding: '5px 12px', borderRadius: '8px',
                            background: u.isEnabled ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                            border: 'none', fontSize: '12px', fontWeight: 700,
                            color: u.isEnabled ? '#EF4444' : '#10B981',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {u.isEnabled ? 'Khóa' : 'Mở khóa'}
                        </button>
                      )}
                      {/* Nút Xóa */}
                      {!u.isDeleted && u.role !== 'ADMIN' && (
                        <button
                          onClick={() => { setConfirmDelete(confirmDelete === u.id ? null : u.id); setConfirmLock(null); setDeleteReason(''); }}
                          style={{
                            padding: '5px 10px', borderRadius: '8px',
                            background: 'rgba(100,116,139,0.06)',
                            border: 'none', fontSize: '12px', fontWeight: 700,
                            color: '#64748B', cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      )}
                      {u.isDeleted && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {(u.restoreCount || 0) < 2 ? (
                            <button
                              onClick={() => { setConfirmRestore(confirmRestore === u.id ? null : u.id); setConfirmLock(null); setConfirmDelete(null); }}
                              style={{
                                padding: '5px 12px', borderRadius: '8px',
                                background: 'rgba(16,185,129,0.08)',
                                border: 'none', fontSize: '12px', fontWeight: 700,
                                color: '#10B981', cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: '4px',
                              }}
                            >
                              <RotateCcw size={12} /> Khôi phục ({u.restoreCount || 0}/2)
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>Hết lượt khôi phục</span>
                          )}
                        </div>
                      )}
                    </div>
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
            icon: <Trash2 size={20} color="white" strokeWidth={2.5} />,
            gradient: 'linear-gradient(135deg, #DC2626, #991B1B)',
            glow: 'rgba(220,38,38,0.3)',
            lightBg: '#FEF2F2',
            value: (stats.deleted || 0).toLocaleString(),
            label: 'Tài khoản đã xoá',
            change: 'Đã xóa',
            changeColor: '#DC2626',
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

      {/* ── MODAL KHÓA TÀI KHOẢN ── */}
      <AnimatePresence>
        {confirmLock && (() => {
          const u = users.find(x => x.id === confirmLock);
          if (!u) return null;
          return (
            <motion.div
              key="lock-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setConfirmLock(null); setLockReason(''); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                backdropFilter: 'blur(4px)',
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'white', borderRadius: '20px', padding: '28px',
                  width: '420px', maxWidth: '90vw',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '14px',
                    background: u.isEnabled ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Lock size={20} color={u.isEnabled ? '#EF4444' : '#10B981'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B' }}>
                      {u.isEnabled ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{u.email}</p>
                  </div>
                </div>

                {u.isEnabled ? (
                  <>
                    <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', lineHeight: 1.5 }}>
                      Vui lòng nhập lý do khóa tài khoản. Lý do này sẽ được hiển thị cho người dùng khi họ cố gắng đăng nhập.
                    </p>
                    <textarea
                      value={lockReason}
                      onChange={e => setLockReason(e.target.value)}
                      placeholder="Nhập lý do khóa tài khoản..."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '10px',
                        border: '1.5px solid rgba(124,58,237,0.15)', background: '#F8F7FF',
                        fontSize: '13px', color: '#374151', outline: 'none',
                        fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.15)'}
                    />
                  </>
                ) : (
                  <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', lineHeight: 1.5 }}>
                    Bạn có chắc chắn muốn mở khóa tài khoản <strong style={{ color: '#7C3AED' }}>{u.fullName}</strong>?
                    Người dùng sẽ có thể đăng nhập trở lại bình thường.
                  </p>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => { setConfirmLock(null); setLockReason(''); }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: '#F1F5F9', border: 'none', fontSize: '13px',
                      fontWeight: 700, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >Hủy</button>
                  <button
                    onClick={() => toggleStatus(u.id, u.isEnabled)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: u.isEnabled ? '#EF4444' : '#10B981', border: 'none',
                      fontSize: '13px', fontWeight: 700, color: 'white',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >{u.isEnabled ? 'Xác nhận khóa' : 'Mở khóa ngay'}</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── MODAL XÓA TÀI KHOẢN ── */}
      <AnimatePresence>
        {confirmDelete && (() => {
          const u = users.find(x => x.id === confirmDelete);
          if (!u) return null;
          return (
            <motion.div
              key="delete-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setConfirmDelete(null); setDeleteReason(''); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                backdropFilter: 'blur(4px)',
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'white', borderRadius: '20px', padding: '28px',
                  width: '420px', maxWidth: '90vw',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '14px',
                    background: 'rgba(239,68,68,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trash2 size={20} color="#EF4444" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B' }}>Xóa tài khoản</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{u.email}</p>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', lineHeight: 1.5 }}>
                  Hành động này sẽ vô hiệu hóa tài khoản <strong style={{ color: '#DC2626' }}>{u.fullName}</strong>.
                  Vui lòng nhập lý do xóa. Lý do sẽ được hiển thị cho người dùng khi cố đăng nhập.
                </p>
                <textarea
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do xóa tài khoản..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1.5px solid rgba(239,68,68,0.15)', background: '#FFF5F5',
                    fontSize: '13px', color: '#374151', outline: 'none',
                    fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(239,68,68,0.15)'}
                />

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => { setConfirmDelete(null); setDeleteReason(''); }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: '#F1F5F9', border: 'none', fontSize: '13px',
                      fontWeight: 700, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >Hủy</button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: '#EF4444', border: 'none',
                      fontSize: '13px', fontWeight: 700, color: 'white',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >Xác nhận xóa</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── MODAL KHÔI PHỤC TÀI KHOẢN ── */}
      <AnimatePresence>
        {confirmRestore && (() => {
          const u = users.find(x => x.id === confirmRestore);
          if (!u) return null;
          return (
            <motion.div
              key="restore-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmRestore(null)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                backdropFilter: 'blur(4px)',
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'white', borderRadius: '20px', padding: '28px',
                  width: '420px', maxWidth: '90vw',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '14px',
                    background: 'rgba(16,185,129,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <RotateCcw size={20} color="#10B981" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E1B4B' }}>Khôi phục tài khoản</h3>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{u.email}</p>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn khôi phục tài khoản <strong style={{ color: '#10B981' }}>{u.fullName}</strong>?
                  Người dùng sẽ có thể đăng nhập trở lại bình thường.
                </p>

                <div style={{
                  background: '#FFF7ED', padding: '10px 14px', borderRadius: '10px',
                  borderLeft: '3px solid #F59E0B', marginBottom: '6px',
                }}>
                  <p style={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
                    ⚠️ Lưu ý: Tài khoản này đã sử dụng {u.restoreCount || 0}/2 lượt khôi phục.
                    {(u.restoreCount || 0) === 1 && ' Đây là lần khôi phục cuối cùng!'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => setConfirmRestore(null)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: '#F1F5F9', border: 'none', fontSize: '13px',
                      fontWeight: 700, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >Hủy</button>
                  <button
                    onClick={() => restoreUser(u.id)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: '#10B981', border: 'none',
                      fontSize: '13px', fontWeight: 700, color: 'white',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  ><RotateCcw size={14} /> Xác nhận khôi phục</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AdminLogsDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        targetType="ACCOUNT"
        title="Lịch sử Quản lý Tài khoản"
      />
    </div>
  );
}
