import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, User, Menu, X, Camera, ChevronDown,
  LogOut, Settings, Package, Bell, Check, Trash2, Clock
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useNotificationStore from '../../store/notificationStore';

const navLinks = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Sản phẩm', path: '/products' },
  { label: 'Tìm kiếm ảnh', path: '/visual-search' },
  { label: 'Blog', path: '/blog' },
  { label: 'Liên hệ', path: '/contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notiRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, openCart, fetchCart } = useCartStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const totalItems = items?.reduce((sum, i) => sum + i.qty, 0) || 0;

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchNotifications();
      // Polling notifications every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchCart, fetchNotifications]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notiRef.current && !notiRef.current.contains(e.target)) setNotiOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-soft border-border'
          : 'bg-white border-border'
          }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >

        <div className={`layout-page flex items-center justify-between gap-8 min-h-[72px] lg:min-h-[80px] ${scrolled ? 'py-2' : 'py-4'}`}>
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center shrink-0 group"
            id="header-logo"
            title="FSS — Trang chủ"
          >
            <div className="w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
              <img
                src="/logo.png"
                alt="FSS"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-10" id="main-nav">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-2 text-[13px] font-semibold tracking-[0.15em] uppercase transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                    }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Search Pill */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center bg-[#F1F5F9] rounded-xl px-4 py-3.5 w-80 hover:bg-[#E2E8F0] transition-colors focus-within:ring-2 ring-primary/10">
              <button type="submit" className="text-muted-foreground hover:text-primary mr-3">
                <Search size={16} />
              </button>
              <input
                type="text"
                placeholder="Nhập tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[13px] w-full text-foreground placeholder:text-muted-foreground font-medium pl-2"
              />
              <div className="w-px h-4 bg-[#E2E8F0] mx-3"></div>
              <Link to="/visual-search" className="text-muted-foreground hover:text-primary shrink-0" title="Tìm kiếm bằng hình ảnh">
                <Camera size={16} />
              </Link>
            </form>

            <div className="flex items-center gap-2">
              {/* Cart - chỉ hiện cho customer */}
              {(!isAuthenticated || user?.role !== 'admin') && (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={openCart}
                  className="relative flex items-center justify-center p-2 rounded-xl text-tertiary hover:text-primary hover:bg-[#F1F5F9] transition-colors"
                  title="Giỏ hàng"
                >
                  <ShoppingBag size={22} strokeWidth={1.5} />
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0 -right-1 bg-primary text-white text-[11px] font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 shadow-sm border-2 border-white"
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </motion.span>
                  )}
                </motion.button>
              )}

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative" ref={notiRef}>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setNotiOpen(!notiOpen)}
                    className="relative flex items-center justify-center p-2 rounded-xl text-tertiary hover:text-primary hover:bg-[#F1F5F9] transition-colors"
                    title="Thông báo"
                  >
                    <Bell size={22} strokeWidth={1.5} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {notiOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute right-0 top-full mt-3 w-96 bg-white shadow-2xl border border-slate-100 rounded-sm overflow-hidden z-50 flex flex-col"
                      >
                        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                          <h3 className="text-[13px] font-black text-primary uppercase tracking-wider">Thông báo</h3>
                          {unreadCount > 0 && (
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAllAsRead(); setNotiOpen(false); }} className="text-[11px] font-bold text-primary hover:underline">Đánh dấu đã đọc</button>
                          )}
                        </div>
                        <div className="max-h-[420px] overflow-y-auto custom-scrollbar pb-2">
                          {notifications.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                              <Bell size={32} strokeWidth={1} className="mb-2 opacity-20" />
                              <p className="text-[12px] font-medium">Bạn chưa có thông báo nào</p>
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => { markAsRead(n.id); setNotiOpen(false); }}
                                className={`p-4 border-b border-slate-50 cursor-pointer transition-colors flex gap-3 ${!n.read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50'}`}
                              >
                                <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[13px] leading-snug mb-1 ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{n.title}</p>
                                  <p className="text-[12px] text-slate-400 break-words mb-2">{n.message}</p>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-bold">
                                    <Clock size={12} />
                                    {new Date(n.createdAt).toLocaleString('vi-VN')}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* User Account */}
              <div className="relative" ref={userMenuRef}>
                {isAuthenticated ? (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="relative flex items-center justify-center p-2 rounded-xl text-tertiary hover:text-primary hover:bg-[#F1F5F9] transition-colors"
                    title="Tài khoản"
                  >
                    <User size={22} strokeWidth={1.5} />
                  </motion.button>
                ) : (
                  <Link to="/login" title="Đăng nhập" className="flex items-center justify-center">
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      className="relative flex items-center justify-center p-2 rounded-xl text-tertiary hover:text-primary hover:bg-[#F1F5F9] transition-colors"
                    >
                      <User size={22} strokeWidth={1.5} />
                    </motion.button>
                  </Link>
                )}

                <AnimatePresence>
                  {userMenuOpen && isAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="absolute right-0 top-full mt-3 w-80 bg-white shadow-2xl shadow-primary/10 border border-slate-200 py-0 z-50 overflow-hidden rounded-sm"
                    >
                      {/* Header section với gradient */}
                      <div className="px-6 py-5 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="relative w-10 h-10 shrink-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <span
                              className="w-10 h-10 rounded-full bg-primary text-white text-sm font-bold absolute inset-0 items-center justify-center hidden"
                            >
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-foreground">{user.name}</p>
                            <p className="text-[11px] text-muted-foreground font-medium leading-tight">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        {user.role === 'admin' ? (
                          <motion.div
                            whileHover={{ x: 4 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          >
                            <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[13px] font-semibold text-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-all">
                              <Settings size={18} className="text-primary" /> Quản trị viên
                            </Link>
                          </motion.div>
                        ) : (
                          <>
                            <motion.div
                              whileHover={{ x: 4 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                            >
                              <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-[13px] font-semibold text-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-all">
                                <User size={18} className="text-primary" /> Hồ sơ cá nhân
                              </Link>
                            </motion.div>
                          </>
                        )}
                        <div className="my-2 border-t border-slate-100"></div>
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        >
                          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-md transition-all">
                            <LogOut size={18} className="text-rose-600" /> Đăng xuất
                          </button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu toggle */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-full text-[#374151] hover:bg-slate-100 transition-colors"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile menu drop-down */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-border bg-white overflow-hidden shadow-xl"
            >
              <nav className="layout-page py-4 flex flex-col gap-2">
                <form onSubmit={handleSearch} className="flex items-center bg-slate-100 rounded-xl px-4 py-2 mb-2">
                  <Search size={16} className="text-muted-foreground mr-2" />
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full text-foreground"
                  />
                </form>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="px-4 py-3 text-sm font-bold tracking-wide uppercase text-[#374151] hover:text-primary hover:bg-surface-secondary rounded-xl transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer */}
      <div className="h-[104px] lg:h-[132px]" />
    </>
  );
}
