import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  LogOut, ChevronRight, Bell, Search,
  Zap, TrendingUp, Activity
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', desc: 'Tổng quan hệ thống' },
  { icon: Package, label: 'Sản phẩm', path: '/admin/products', desc: 'Quản lý kho hàng' },
  { icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/orders', desc: 'Theo dõi giao dịch' },
  { icon: Users, label: 'Tài khoản', path: '/admin/accounts', desc: 'Phân quyền người dùng' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPage = adminNavItems.find(item =>
    item.path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(item.path)
  );

  return (
    <div style={{ display: 'flex', minHeight: '125vh', background: '#F8F9FF', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", zoom: 0.8 }}>

      {/* ═══════════════════════════════════
          DARK SIDEBAR (Lightened)
      ═══════════════════════════════════ */}
      <aside style={{
        width: '260px',
        background: 'linear-gradient(180deg, #1A1A3D 0%, #241C52 60%, #1B1645 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '125vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>

        {/* Decorative glow blobs */}
        <div style={{
          position: 'absolute', top: '-60px', left: '-60px',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '80px', right: '-40px',
          width: '160px', height: '160px',
          background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ── LOGO ── */}
        <div style={{ padding: '28px 24px 20px', position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{
              width: '44px', height: '44px',
              background: '#FFFFFF',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              flexShrink: 0,
              padding: '6px',
            }}>
              <img src="/logo.png" alt="Fashion Shopping Sense" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '14px', color: '#FFFFFF', letterSpacing: '-0.2px', lineHeight: 1.3 }}>
                Fashion<br />Shopping Sense
              </p>
            </div>
          </Link>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '20px 0 0' }} />
        </div>

        {/* ── NAV LABEL ── */}
        <div style={{ padding: '0 24px 8px', position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '9.5px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Điều hướng
          </span>
        </div>

        {/* ── NAV ITEMS ── */}
        <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: '3px', position: 'relative', zIndex: 1, overflowY: 'auto' }}>
          {adminNavItems.map(({ icon: Icon, label, path, desc }) => {
            const isActive = path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(path);

            return (
              <Link
                key={path}
                to={path}
                id={`admin-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(79,70,229,0.25))'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(124,58,237,0.3)'
                    : '1px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '1px solid transparent';
                  }
                }}
              >
                {/* Active left bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bar"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '24px',
                      background: 'linear-gradient(180deg, #A78BFA, #818CF8)',
                      borderRadius: '0 3px 3px 0',
                      boxShadow: '0 0 12px rgba(167,139,250,0.6)',
                    }}
                  />
                )}

                {/* Icon bg */}
                <div style={{
                  width: '34px', height: '34px',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(129,140,248,0.2))'
                    : 'rgba(255,255,255,0.06)',
                  transition: 'all 0.2s ease',
                }}>
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ color: isActive ? '#C4B5FD' : 'rgba(255,255,255,0.45)' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '13.5px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                    lineHeight: 1.2,
                    letterSpacing: '-0.1px',
                  }}>
                    {label}
                  </p>
                </div>

                {isActive && (
                  <ChevronRight size={14} style={{ color: 'rgba(196,181,253,0.6)', flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── DIVIDER ── */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '8px 24px' }} />

        {/* ── LOGOUT ── */}
        <div style={{ padding: '8px 12px 12px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <button
            onClick={handleLogout}
            id="admin-logout-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px', borderRadius: '12px',
              background: 'transparent', border: '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s',
              color: 'rgba(255,255,255,0.45)', width: '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
              e.currentTarget.style.color = '#FCA5A5';
              e.currentTarget.style.border = '1px solid rgba(239,68,68,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.border = '1px solid transparent';
            }}
          >
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={17} strokeWidth={2} />
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Đăng xuất</span>
          </button>
        </div>

        {/* ── ADMIN PROFILE (bottom) ── */}
        <div style={{ padding: '12px 16px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=7C3AED&color=fff&bold=true`}
              alt={user?.name}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167,139,250,0.4)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Admin User'}
              </p>
              <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.38)', marginTop: '2px', fontWeight: 500 }}>
                Quản trị viên
              </p>
            </div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px rgba(52,211,153,0.6)', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════ */}
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '125vh', minWidth: 0 }}>

        {/* ── TOP HEADER (Glassmorphism) ── */}
        <header style={{
          height: '92px',
          background: 'rgba(248, 249, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(124,58,237,0.08)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center',
          padding: '0 32px',
          gap: '16px',
        }}>

          {/* Page title breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.08))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={18} style={{ color: '#7C3AED' }} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: '17px', fontWeight: 700, color: '#1E1B4B', lineHeight: 1.2 }}>
                {currentPage?.label || 'Admin'}
              </p>
              <p style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
                {currentPage?.desc || 'Quản trị hệ thống'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              style={{
                width: '100%', height: '40px',
                background: 'white',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '10px',
                paddingLeft: '38px', paddingRight: '16px',
                fontSize: '13px', color: '#374151',
                outline: 'none',
                fontFamily: 'inherit',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(124,58,237,0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(0,0,0,0.08)';
                e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
              }}
            />
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/"
              style={{
                fontSize: '14.5px', fontWeight: 600,
                color: '#7C3AED', textDecoration: 'none',
                padding: '11px 24px', borderRadius: '12px',
                background: 'rgba(124,58,237,0.08)',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(124,58,237,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(124,58,237,0.15)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ← Trang chủ
            </Link>

            {/* Notification bell */}
            <button style={{
              position: 'relative', width: '52px', height: '52px',
              borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)',
              background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              color: '#64748B', transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#F8F4FF';
                e.currentTarget.style.color = '#7C3AED';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Bell size={22} strokeWidth={2} />
              <span style={{
                position: 'absolute', top: '14px', right: '14px',
                width: '10px', height: '10px',
                background: '#EF4444', borderRadius: '50%',
                border: '2px solid white',
              }} />
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: 1, padding: '32px', overflowX: 'hidden' }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
