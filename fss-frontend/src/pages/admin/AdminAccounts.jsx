import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, User, ChevronLeft, ChevronRight, Users, Lock, ShieldAlert, Filter } from 'lucide-react';
import { users as initialUsers } from '../../data/mockData';

export default function AdminAccounts() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

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
            { id: 'all', label: 'Tất cả', icon: '👥' },
            { id: 'admin', label: 'Admin', icon: '🛡️' },
            { id: 'customer', label: 'Khách hàng', icon: '👤' },
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
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="banned">Đã khóa</option>
          </select>
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7C3AED', fontSize: '10px' }}>▼</div>
        </div>

        <p style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {filtered.length} thành viên
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
              {filtered.map((u, idx) => (
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
                          src={u.avatar}
                          alt={u.name}
                          style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(124,58,237,0.1)' }}
                        />
                        <div style={{
                          position: 'absolute', bottom: '-2px', right: '-2px',
                          width: '11px', height: '11px', borderRadius: '50%',
                          background: u.status === 'active' ? '#10B981' : '#94A3B8',
                          border: '2px solid white',
                        }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B' }}>{u.name}</p>
                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {u.role === 'admin' ? (
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
                      background: u.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.09)',
                      color: u.status === 'active' ? '#047857' : '#DC2626',
                      fontSize: '11.5px', fontWeight: 700,
                    }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: u.status === 'active' ? '#10B981' : '#EF4444',
                      }} />
                      {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <p style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      className="user-action"
                      style={{
                        opacity: 0, transition: 'opacity 0.2s',
                        padding: '6px 14px', borderRadius: '8px',
                        background: 'rgba(124,58,237,0.08)', border: 'none',
                        fontSize: '12.5px', fontWeight: 700, color: '#7C3AED',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Chỉnh sửa
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Users size={48} style={{ color: '#E2E8F0', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 600 }}>Không tìm thấy tài khoản nào.</p>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div style={{
            padding: '14px 24px', borderTop: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA',
          }}>
            <p style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
              Hiển thị 1–{Math.min(filtered.length, 10)} trên {filtered.length} thành viên
            </p>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                <ChevronLeft size={15} />
              </button>
              {[1, 2, 3].map(n => (
                <button key={n} style={{
                  width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  background: n === 1 ? 'linear-gradient(135deg,#7C3AED,#4F46E5)' : 'white',
                  color: n === 1 ? 'white' : '#475569',
                  boxShadow: n === 1 ? '0 2px 8px rgba(124,58,237,0.3)' : '0 0 0 1px rgba(0,0,0,0.09)',
                }}>{n}</button>
              ))}
              <button style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
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
            value: '2,482',
            label: 'Người dùng mới tháng này',
            change: '+12%',
            changeColor: '#10B981',
          },
          {
            icon: <Lock size={20} color="white" strokeWidth={2.5} />,
            gradient: 'linear-gradient(135deg, #EA580C, #C2410C)',
            glow: 'rgba(234,88,12,0.3)',
            lightBg: '#FFF7ED',
            value: '14',
            label: 'Tài khoản đang bị khóa',
            change: '0%',
            changeColor: '#94A3B8',
          },
          {
            icon: <ShieldAlert size={20} color="white" strokeWidth={2.5} />,
            gradient: 'linear-gradient(135deg, #4F46E5, #3730A3)',
            glow: 'rgba(79,70,229,0.3)',
            lightBg: '#EEF2FF',
            value: '08',
            label: 'Quản trị viên hệ thống',
            change: 'Fixed',
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
