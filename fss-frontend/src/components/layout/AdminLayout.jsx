import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  LogOut, Bell, X, BarChart2, Activity
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import ToastContainer from '../ui/ToastContainer';

// ── Design Tokens (Flat Japanese) ──────────────────────────────────────────
const J = {
  bg:       '#FAFAF8',       // off-white washi paper
  sidebar:  '#FFFFFF',       // pure white sidebar
  black:    '#1A1A1A',       // soft black
  gray:     '#6B6B6B',       // medium gray
  lightGray:'#E8E8E4',       // border gray
  red:      '#1e3bc3',       // Softer Shop theme blue
  redLight: '#E8EEFF',       // Soft blue tint
  white:    '#FFFFFF',
  font:     "'Noto Sans JP', 'Plus Jakarta Sans', system-ui, sans-serif",
  mono:     "'Space Mono', 'Courier New', monospace",
};

const adminNavItems = [
  { icon: BarChart2,    label: 'Dashboard',  labelVi: 'Báo cáo',   path: '/admin',          sub: 'Dashboard' },
  { icon: Package,      label: 'Products',   labelVi: 'Sản phẩm',  path: '/admin/products', sub: 'Kho hàng'  },
  { icon: ShoppingCart, label: 'Orders',     labelVi: 'Đơn hàng',  path: '/admin/orders',   sub: 'Giao dịch' },
  { icon: Users,        label: 'Accounts',   labelVi: 'Tài khoản', path: '/admin/accounts', sub: 'Người dùng'},
];

export default function AdminLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const notificationItems = Array.isArray(notifications) ? notifications : (notifications?.items || []);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => {
      clearInterval(iv);
      import('../../store/toastStore').then(m => m.toast.clearAll());
    };
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentPage = adminNavItems.find(item =>
    item.path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(item.path)
  );

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: J.bg,
      fontFamily: J.font,
      zoom: 0.92,
    }}>
      <ToastContainer />

      {/* ════════════════════════════════════
          SIDEBAR – Flat Japanese
      ════════════════════════════════════ */}
      <aside style={{
        width: '240px',
        background: J.sidebar,
        position: 'fixed', top: 0, bottom: 0, left: 0,
        display: 'flex', flexDirection: 'column',
        zIndex: 50,
        borderRight: `1px solid ${J.lightGray}`,
      }}>

        {/* LOGO */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #152e9c',
          background: J.red, // Shop theme blue
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{
              width: '38px', height: '38px',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src="/logo.png" alt="FSS" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px', color: '#FFFFFF', lineHeight: 1.3, letterSpacing: '0.01em' }}>
                Fashion<br />Shopping Sense
              </p>
            </div>
          </Link>
        </div>

        {/* NAV LABEL */}
        <div style={{ padding: '24px 24px 10px' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: J.gray, letterSpacing: '0.12em' }}>
            DANH MỤC
          </span>
        </div>

        {/* NAV ITEMS */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto' }}>
          {adminNavItems.map(({ icon: Icon, label, labelVi, path, sub }) => {
            const isActive = path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                id={`admin-nav-${labelVi.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px',
                  textDecoration: 'none',
                  background: isActive ? J.redLight : 'transparent',
                  borderLeft: isActive ? `3px solid ${J.red}` : '3px solid transparent',
                  transition: 'all 0.2s',
                  marginLeft: isActive ? '-3px' : '0',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F5F5F3'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ color: isActive ? J.red : J.gray, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '13px', fontWeight: isActive ? 600 : 400,
                    color: isActive ? J.black : J.gray,
                    lineHeight: 1.2,
                  }}>{labelVi}</p>
                  <p style={{ fontSize: '10px', color: isActive ? J.red : '#AAAAAA', marginTop: '1px', letterSpacing: '0.03em' }}>
                    {label}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* DIVIDER */}
        <div style={{ height: '1px', background: J.lightGray, margin: '0 24px' }} />

        {/* LOGOUT */}
        <div style={{ padding: '12px 12px 16px' }}>
          <button
            onClick={handleLogout}
            id="admin-logout-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px', width: '100%',
              background: 'transparent',
              border: `1px solid transparent`,
              cursor: 'pointer', color: J.gray,
              transition: 'all 0.2s', fontFamily: J.font,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = J.redLight;
              e.currentTarget.style.borderColor = '#F0C0BB';
              e.currentTarget.style.color = J.red;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = J.gray;
            }}
          >
            <LogOut size={15} strokeWidth={1.5} />
            <span style={{ fontSize: '13px', fontWeight: 400 }}>Đăng xuất</span>
          </button>
        </div>

        {/* ADMIN PROFILE */}
        <div style={{ padding: '0 16px 28px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px',
            background: J.bg,
            border: `1px solid ${J.lightGray}`,
          }}>
            <img
              src={user?.avatar ? (user.avatar.includes('ui-avatars.com') ? user.avatar.replace(/background=[a-zA-Z0-9]+/g, 'background=4a6cff') : (user.avatar.startsWith('http') ? user.avatar : `http://localhost:8080/images/${user.avatar}`)) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=4a6cff&color=fff&bold=true`}
              alt={user?.name}
              style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%', border: `1px solid ${J.lightGray}`, flexShrink: 0 }}
              onError={e => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=4a6cff&color=fff&bold=true`;
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: J.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Admin User'}
              </p>
              <p style={{ fontSize: '10px', color: J.red, fontWeight: 400, letterSpacing: '0.03em', marginTop: '2px' }}>
                QUẢN TRỊ VIÊN
              </p>
            </div>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════ */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>

        {/* TOP HEADER – Japanese Minimal */}
        <header style={{
          height: '72px',
          background: J.white,
          borderBottom: `1px solid ${J.lightGray}`,
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center',
          padding: '0 36px', gap: '16px',
        }}>

          {/* Page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
            {/* Red accent line */}
            <div style={{ width: '3px', height: '28px', background: J.red, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: J.black, lineHeight: 1.2 }}>
                {currentPage?.labelVi || 'Admin'}
              </p>
              <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px', letterSpacing: '0.03em' }}>
                {currentPage?.label || ''} · {currentPage?.sub || 'Quản trị hệ thống'}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/"
              style={{
                fontSize: '12px', fontWeight: 500,
                color: J.gray, textDecoration: 'none',
                padding: '8px 16px',
                border: `1px solid ${J.lightGray}`,
                background: J.white,
                transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.gray; }}
            >
              ← Trang chủ
            </Link>

            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  position: 'relative', width: '40px', height: '40px',
                  background: J.white, border: `1px solid ${J.lightGray}`,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: J.gray, transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.gray; }}
              >
                <Bell size={17} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-3px', right: '-3px',
                    width: '14px', height: '14px',
                    background: J.red, borderRadius: '50%',
                    border: `2px solid ${J.white}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '8px', fontWeight: 700, color: J.white,
                  }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      width: '320px',
                      background: J.white,
                      border: `1px solid ${J.lightGray}`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      zIndex: 50,
                    }}
                  >
                    {/* Header */}
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${J.lightGray}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: J.black }}>Thông báo</p>
                        <p style={{ margin: 0, fontSize: '11px', color: J.gray, marginTop: '2px' }}>{unreadCount} chưa đọc</p>
                      </div>
                      <button
                        onClick={() => setNotifOpen(false)}
                        style={{ width: '26px', height: '26px', background: 'transparent', border: `1px solid ${J.lightGray}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: J.gray }}
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notificationItems.length === 0 ? (
                        <div style={{ padding: '32px 18px', textAlign: 'center', color: '#BBBBBB', fontSize: '13px' }}>
                          Không có thông báo mới
                        </div>
                      ) : notificationItems.slice(0, 6).map(n => (
                        <button
                          key={n.id}
                          onClick={() => { if (!n.read) markAsRead(n.id); }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '12px 18px',
                            background: n.read ? J.white : J.redLight,
                            border: 'none', borderBottom: `1px solid ${J.lightGray}`,
                            cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px',
                            fontFamily: J.font, transition: 'background 0.15s',
                          }}
                        >
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: n.read ? J.lightGray : J.red, marginTop: '5px', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: J.black }}>{n.title}</p>
                            <p style={{ margin: '3px 0 0', fontSize: '11px', color: J.gray, lineHeight: 1.5 }}>{n.message}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={markAllAsRead}
                      style={{
                        width: '100%', padding: '11px 18px',
                        background: J.bg, border: 'none', borderTop: `1px solid ${J.lightGray}`,
                        fontWeight: 500, fontSize: '12px', letterSpacing: '0.02em',
                        color: J.gray, cursor: 'pointer', fontFamily: J.font,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = J.red}
                      onMouseLeave={e => e.currentTarget.style.color = J.gray}
                    >
                      Đánh dấu đã đọc tất cả
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          style={{ flex: 1, padding: '36px', overflowX: 'hidden' }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
