import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, User, ChevronLeft, ChevronRight, Users, Lock, Trash2, History, RotateCcw } from 'lucide-react';
import { toast } from '../../store/toastStore';
import AdminLogsDrawer from '../../components/admin/AdminLogsDrawer';

import { API_BASE } from '../../config/api';
const API = API_BASE;
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
  const [confirmLock, setConfirmLock] = useState(null);
  const [lockReason, setLockReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(null);
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
  useEffect(() => { setPage(0); }, [search, filterRole, filterStatus]);

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
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: J.black, letterSpacing: '0.02em' }}>
            Quản lý người dùng
          </h1>
          <p style={{ fontSize: '12px', color: J.gray, marginTop: '4px' }}>
            Theo dõi trạng thái, khóa và xóa tài khoản thành viên
          </p>
        </div>
        <button
          onClick={() => setIsLogsOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '4px',
            background: J.white, border: `1px solid ${J.lightGray}`,
            fontSize: '12px', fontWeight: 500, color: J.black,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.black; }}
        >
          <History size={14} /> Lịch sử hoạt động
        </button>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{
        background: J.white, borderRadius: '4px', padding: '12px 16px',
        border: `1px solid ${J.lightGray}`,
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: J.gray }} />
          <input
            type="text"
            placeholder="Tìm tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', height: '36px',
              paddingLeft: '34px', paddingRight: '14px',
              background: '#FAFAFA', border: `1px solid ${J.lightGray}`,
              borderRadius: '4px', fontSize: '12px', color: J.black,
              outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = J.red; e.target.style.background = J.white; }}
            onBlur={e => { e.target.style.borderColor = J.lightGray; e.target.style.background = '#FAFAFA'; }}
          />
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: J.lightGray, flexShrink: 0 }} />

        {/* Role tabs */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'ADMIN', label: 'Quản trị' },
            { id: 'CUSTOMER', label: 'Khách hàng' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setFilterRole(r.id)}
              style={{
                padding: '8px 0', border: 'none', background: 'transparent',
                borderBottom: filterRole === r.id ? `2px solid ${J.red}` : '2px solid transparent',
                fontSize: '12px', fontWeight: filterRole === r.id ? 600 : 400,
                color: filterRole === r.id ? J.black : J.gray, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              appearance: 'none', padding: '6px 28px 6px 12px',
              background: '#FAFAFA', border: `1px solid ${J.lightGray}`,
              borderRadius: '4px', fontSize: '12px', fontWeight: 500,
              color: J.black, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
            <option value="DELETED">Đã xóa</option>
          </select>
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: J.gray, fontSize: '9px' }}>▼</div>
        </div>

        <p style={{ fontSize: '12px', color: J.gray, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {total} thành viên
        </p>
      </div>

      {/* ── USERS TABLE ── */}
      <div style={{
        background: J.white, borderRadius: '4px',
        border: `1px solid ${J.lightGray}`,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 180px)', minHeight: '600px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#F5F5F5', borderBottom: `1px solid ${J.lightGray}` }}>
                {['Người dùng', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px',
                    fontSize: '11px', fontWeight: 600, color: J.gray,
                    letterSpacing: '0.04em', background: '#F5F5F5',
                    boxShadow: `inset 0 -1px 0 ${J.lightGray}`
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{ width: '24px', height: '24px', border: `2px solid ${J.lightGray}`, borderTopColor: J.red, borderRadius: '50%' }} />
                      <p style={{ fontSize: '12px', color: J.gray }}>Đang tải danh sách thành viên...</p>
                    </div>
                  </td>
                </tr>
              ) : users.map((u, idx) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                  style={{ borderBottom: `1px solid ${J.lightGray}`, transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={u.avatarUrl ? (u.avatarUrl.includes('ui-avatars.com') ? u.avatarUrl.replace(/background=[a-zA-Z0-9]+/g, 'background=4a6cff') : (u.avatarUrl.startsWith('http') ? u.avatarUrl : `${API}/images/${u.avatarUrl}`)) : '/default-customer.jpg'}
                          alt={u.fullName}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${J.lightGray}` }}
                          onError={e => { e.target.src = '/default-customer.jpg'; }}
                        />
                        <div style={{
                          position: 'absolute', bottom: '0px', right: '0px',
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: u.isDeleted ? J.gray : (u.isEnabled ? J.green : '#E74C3C'),
                          border: '1.5px solid white',
                        }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: J.black }}>{u.fullName}</p>
                        <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.role === 'ADMIN' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '2px',
                        background: J.redLight, color: J.red,
                        fontSize: '11px', fontWeight: 500, border: `1px solid ${J.red}40`
                      }}>
                        <Shield size={10} /> Quản trị
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '2px',
                        background: '#FAFAFA', color: J.gray,
                        fontSize: '11px', fontWeight: 400, border: `1px solid ${J.lightGray}`
                      }}>
                        <User size={10} /> Khách hàng
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 8px', borderRadius: '2px',
                      background: u.isDeleted ? '#F5F5F5' : (u.isEnabled ? '#E9F7EF' : '#FDEDEC'),
                      color: u.isDeleted ? J.gray : (u.isEnabled ? J.green : '#E74C3C'),
                      fontSize: '11px', fontWeight: 500,
                    }}>
                      {u.isDeleted ? 'Đã xóa' : (u.isEnabled ? 'Hoạt động' : 'Đã khóa')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontSize: '12px', color: J.gray }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!u.isDeleted && u.role !== 'ADMIN' && (
                        <button
                          onClick={() => { setConfirmLock(confirmLock === u.id ? null : u.id); setConfirmDelete(null); setLockReason(''); }}
                          style={{
                            padding: '4px 10px', borderRadius: '4px',
                            background: J.white, border: `1px solid ${J.lightGray}`,
                            fontSize: '11px', fontWeight: 500,
                            color: u.isEnabled ? '#E74C3C' : J.green,
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = u.isEnabled ? '#E74C3C' : J.green; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; }}
                        >
                          {u.isEnabled ? 'Khóa' : 'Mở khóa'}
                        </button>
                      )}
                      {!u.isDeleted && u.role !== 'ADMIN' && (
                        <button
                          onClick={() => { setConfirmDelete(confirmDelete === u.id ? null : u.id); setConfirmLock(null); setDeleteReason(''); }}
                          style={{
                            padding: '4px 10px', borderRadius: '4px',
                            background: J.white, border: `1px solid ${J.lightGray}`,
                            fontSize: '11px', fontWeight: 500,
                            color: J.gray, cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E74C3C'; e.currentTarget.style.color = '#E74C3C'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.gray; }}
                        >
                          Xóa
                        </button>
                      )}
                      {u.isDeleted && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {(u.restoreCount || 0) < 2 ? (
                            <button
                              onClick={() => { setConfirmRestore(confirmRestore === u.id ? null : u.id); setConfirmLock(null); setConfirmDelete(null); }}
                              style={{
                                padding: '4px 10px', borderRadius: '4px',
                                background: J.white, border: `1px solid ${J.lightGray}`,
                                fontSize: '11px', fontWeight: 500,
                                color: J.green, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = J.green; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; }}
                            >
                              <RotateCcw size={10} /> Khôi phục ({u.restoreCount || 0}/2)
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>Hết lượt khôi phục</span>
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
              <Users size={32} style={{ color: '#CCCCCC', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: J.gray, fontWeight: 500 }}>Không tìm thấy tài khoản nào.</p>
            </div>
          )}
        </div>

        {users.length > 0 && (
          <div style={{
            padding: '12px 16px', borderTop: `1px solid ${J.lightGray}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA',
          }}>
            <p style={{ fontSize: '11px', color: J.gray }}>
              Hiển thị {users.length} trên {total} thành viên
            </p>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} style={{ width: '28px', height: '28px', borderRadius: '4px', background: J.white, border: `1px solid ${J.lightGray}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 0 ? 'not-allowed' : 'pointer', color: J.gray, opacity: page === 0 ? 0.5 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
                let pNum = page;
                if (page === 0) pNum = i;
                else if (page === totalPages - 1) pNum = totalPages - 3 + i;
                else pNum = page - 1 + i;
                pNum = Math.max(0, Math.min(totalPages - 1, pNum));
                
                return (
                  <button key={i} onClick={() => setPage(pNum)} style={{
                    width: '28px', height: '28px', borderRadius: '4px', fontSize: '12px', fontWeight: page === pNum ? 600 : 400,
                    cursor: 'pointer', border: `1px solid ${page === pNum ? J.red : J.lightGray}`,
                    background: page === pNum ? J.redLight : J.white,
                    color: page === pNum ? J.red : J.gray,
                  }}>{pNum + 1}</button>
                )
              })}
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} style={{ width: '28px', height: '28px', borderRadius: '4px', background: J.white, border: `1px solid ${J.lightGray}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', color: J.gray, opacity: page >= totalPages - 1 ? 0.5 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          {
            icon: <Users size={16} color={J.black} />,
            value: stats.total.toLocaleString(),
            label: 'Tổng người dùng',
            change: 'Hệ thống',
            color: J.black,
          },
          {
            icon: <Lock size={16} color={J.red} />,
            value: stats.locked.toLocaleString(),
            label: 'Tài khoản bị khóa',
            change: 'Cần chú ý',
            color: J.red,
          },
          {
            icon: <Trash2 size={16} color={J.gray} />,
            value: (stats.deleted || 0).toLocaleString(),
            label: 'Tài khoản đã xoá',
            change: 'Đã xóa',
            color: J.gray,
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: J.white, borderRadius: '4px', padding: '20px',
              border: `1px solid ${J.lightGray}`, transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {card.icon}
                <span style={{ fontSize: '11px', fontWeight: 600, color: J.gray, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.label}
                </span>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 500, color: card.color,
                background: `${card.color}12`, padding: '2px 6px', borderRadius: '2px',
              }}>
                {card.change}
              </span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 600, color: J.black, lineHeight: 1 }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── MODAL KHÓA TÀI KHOẢN ── */}
      <AnimatePresence>
        {confirmLock && (() => {
          const u = users.find(x => x.id === confirmLock);
          if (!u) return null;
          return (
            <motion.div
              key="lock-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setConfirmLock(null); setLockReason(''); }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ background: J.white, borderRadius: '4px', padding: '32px', width: '400px', maxWidth: '90vw', border: `1px solid ${J.lightGray}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Lock size={16} color={u.isEnabled ? '#DC2626' : J.green} />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: J.black }}>
                      {u.isEnabled ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    </h3>
                    <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px' }}>{u.email}</p>
                  </div>
                </div>

                {u.isEnabled ? (
                  <>
                    <p style={{ fontSize: '12px', color: J.gray, marginBottom: '12px', lineHeight: 1.5 }}>
                      Vui lòng nhập lý do khóa tài khoản. Lý do này sẽ hiển thị khi họ đăng nhập.
                    </p>
                    <textarea
                      value={lockReason}
                      onChange={e => setLockReason(e.target.value)}
                      placeholder="Nhập lý do khóa..."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '4px',
                        border: `1px solid ${J.lightGray}`, background: '#FAFAFA',
                        fontSize: '12px', color: J.black, outline: 'none',
                        fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = '#DC2626'}
                      onBlur={e => e.target.style.borderColor = J.lightGray}
                    />
                  </>
                ) : (
                  <p style={{ fontSize: '12px', color: J.gray, marginBottom: '12px', lineHeight: 1.5 }}>
                    Bạn có chắc muốn mở khóa tài khoản <strong style={{ color: J.black }}>{u.fullName}</strong>?
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '24px' }}>
                  <button
                    onClick={() => { setConfirmLock(null); setLockReason(''); }}
                    style={{
                      padding: '10px', borderRadius: '4px', background: J.white, border: `1px solid ${J.lightGray}`,
                      fontSize: '12px', fontWeight: 500, color: J.gray, cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                    onMouseLeave={e => e.currentTarget.style.background = J.white}
                  >Hủy</button>
                  <button
                    onClick={() => toggleStatus(u.id, u.isEnabled)}
                    style={{
                      padding: '10px', borderRadius: '4px', background: u.isEnabled ? '#DC2626' : J.green, border: 'none',
                      fontSize: '12px', fontWeight: 500, color: 'white', cursor: 'pointer',
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
              key="delete-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setConfirmDelete(null); setDeleteReason(''); }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ background: J.white, borderRadius: '4px', padding: '32px', width: '400px', maxWidth: '90vw', border: `1px solid ${J.lightGray}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Trash2 size={16} color="#DC2626" />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: J.black }}>Xóa tài khoản</h3>
                    <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px' }}>{u.email}</p>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: J.gray, marginBottom: '12px', lineHeight: 1.5 }}>
                  Hành động này sẽ vô hiệu hóa tài khoản <strong style={{ color: J.black }}>{u.fullName}</strong>. Vui lòng nhập lý do xóa.
                </p>
                <textarea
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do xóa..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '4px',
                    border: `1px solid ${J.lightGray}`, background: '#FAFAFA',
                    fontSize: '12px', color: J.black, outline: 'none',
                    fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#DC2626'}
                  onBlur={e => e.target.style.borderColor = J.lightGray}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '24px' }}>
                  <button
                    onClick={() => { setConfirmDelete(null); setDeleteReason(''); }}
                    style={{
                      padding: '10px', borderRadius: '4px', background: J.white, border: `1px solid ${J.lightGray}`,
                      fontSize: '12px', fontWeight: 500, color: J.gray, cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                    onMouseLeave={e => e.currentTarget.style.background = J.white}
                  >Hủy</button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    style={{
                      padding: '10px', borderRadius: '4px', background: '#DC2626', border: 'none',
                      fontSize: '12px', fontWeight: 500, color: 'white', cursor: 'pointer',
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
              key="restore-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmRestore(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ background: J.white, borderRadius: '4px', padding: '32px', width: '400px', maxWidth: '90vw', border: `1px solid ${J.lightGray}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <RotateCcw size={16} color={J.green} />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: J.black }}>Khôi phục tài khoản</h3>
                    <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px' }}>{u.email}</p>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: J.gray, marginBottom: '12px', lineHeight: 1.5 }}>
                  Bạn có chắc muốn khôi phục tài khoản <strong style={{ color: J.black }}>{u.fullName}</strong>?
                </p>

                <div style={{ background: '#FFF7ED', padding: '10px', borderRadius: '4px', borderLeft: `3px solid ${J.red}`, marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', color: J.black, fontWeight: 500 }}>
                    Lưu ý: Tài khoản này đã sử dụng {u.restoreCount || 0}/2 lượt khôi phục.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '24px' }}>
                  <button
                    onClick={() => setConfirmRestore(null)}
                    style={{
                      padding: '10px', borderRadius: '4px', background: J.white, border: `1px solid ${J.lightGray}`,
                      fontSize: '12px', fontWeight: 500, color: J.gray, cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F5F5'}
                    onMouseLeave={e => e.currentTarget.style.background = J.white}
                  >Hủy</button>
                  <button
                    onClick={() => restoreUser(u.id)}
                    style={{
                      padding: '10px', borderRadius: '4px', background: J.green, border: 'none',
                      fontSize: '12px', fontWeight: 500, color: 'white', cursor: 'pointer',
                    }}
                  >Khôi phục</button>
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
