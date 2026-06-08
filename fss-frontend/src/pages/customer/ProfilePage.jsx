import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, ChevronRight, ChevronDown, MapPin, Heart, User,
  Camera, Lock, Eye, EyeOff, ArrowUpRight,
  Shield, Clock, Plus, Check, X, Trash2,
  ShoppingBag, Box
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useOrderStore from '../../store/orderStore';
import useAddressStore from '../../store/addressStore';
import useWishlistStore from '../../store/wishlistStore';
import AddressModal from '../../components/ui/AddressModal';
import { formatPrice } from '../../data/mockData';
import { toast } from '../../store/toastStore';
import OrderDetailModal from '../../components/ui/OrderDetailModal';
import { API_BASE } from '../../config/api';

/* ─────────────────────────────────────────
   FLOATING LABEL FIELD
───────────────────────────────────────── */
function FloatingField({ label, value, editing = false, onChange, icon: Icon, type = 'text', options = [], className = '' }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value !== '' && value !== '—';

  return (
    <div className={`relative group ${className}`}>
      <div
        className="relative overflow-hidden rounded-xs transition-all duration-300"
        style={{
          background: focused
            ? 'rgba(255,255,255,0.95)'
            : 'rgba(255,255,255,0.7)',
          border: focused
            ? '2px solid rgba(0,22,141,0.35)'
            : '2px solid rgba(226,232,240,0.8)',
          boxShadow: focused
            ? '0 0 0 4px rgba(0,22,141,0.06), 0 4px 16px rgba(0,22,141,0.08)'
            : '0 2px 8px rgba(0,0,0,0.04)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-full transition-all duration-300"
          style={{
            background: focused
              ? 'linear-gradient(90deg, #00168d, #7c3aed)'
              : 'transparent',
          }}
        />

        <div className="px-4 pt-5 pb-3">
          <p
            className="text-[9px] font-black tracking-[0.22em] uppercase mb-1.5 transition-colors duration-200"
            style={{ color: focused ? '#00168d' : '#94a3b8' }}
          >
            {Icon && <Icon size={8} className="inline mr-1.5 opacity-70" />}
            {label}
          </p>
          {editing ? (
            type === 'select' ? (
              <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full bg-transparent text-[14px] font-semibold text-slate-800 outline-none leading-snug cursor-pointer"
              >
                <option value="">—</option>
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full bg-transparent text-[14px] font-semibold text-slate-800 outline-none leading-snug"
              />
            )
          ) : (
            <p className="text-[14px] font-semibold text-slate-700 leading-snug">
              {type === 'date' && value 
                ? new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                : (value || '—')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SIDEBAR NAV ICONS
───────────────────────────────────────── */
const sideMenuIcons = {
  profile: User,
  orders: Box,
  address: MapPin,
  wishlist: Heart,
};

const sideMenuColors = {
  profile: { from: '#00168d', to: '#3b82f6' },
  orders: { from: '#7c3aed', to: '#a78bfa' },
  address: { from: '#059669', to: '#34d399' },
  wishlist: { from: '#e11d48', to: '#fb7185' },
};

/* ─────────────────────────────────────────
   STATUS CHIP
───────────────────────────────────────── */
const statusConfig = {
  // Backend enums (uppercase)
  PENDING: { label: 'Chờ xác nhận', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  CONFIRMED: { label: 'Đã xác nhận', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  SHIPPING: { label: 'Đang giao', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  DELIVERED: { label: 'Đã giao', bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  CANCELLED: { label: 'Đã huỷ', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  // Legacy lowercase
  confirmed: { label: 'Đã xác nhận', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  delivered: { label: 'Đã giao', bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  processing: { label: 'Đang xử lý', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  pending: { label: 'Chờ xác nhận', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  shipping: { label: 'Đang giao', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  cancelled: { label: 'Đã huỷ', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};

function StatusChip({ status }) {
  const cfg = statusConfig[status] || { label: status, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-[11px] font-bold"
      style={{ background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.dot}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-xs" style={{ background: cfg.dot }} />
      {cfg.label || status}
    </span>
  );
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export default function ProfilePage() {
  const { user, updateProfile, updateAvatar, logout, isAuthenticated, auditLogs, fetchAuditLogs } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Đồng bộ sideTab với URL
  const sideTab = location.pathname.startsWith('/orders') ? 'orders' : 
                 location.pathname.startsWith('/wishlist') ? 'wishlist' :
                 location.pathname.startsWith('/address') ? 'address' : 'profile';

  const setSideTab = (id) => {
    if (id === 'profile') navigate('/profile');
    else navigate(`/${id}`);
  };

  const [mainTab, setMainTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    dob: '',
    gender: '',
    bio: '',
  });

  useEffect(() => {
    if (user?.name || user?.email) {
      setForm(f => ({
        ...f,
        name: user?.name || f.name,
        email: user?.email || f.email,
        phone: user?.phone || f.phone,
        dob: user?.dob || f.dob,
        gender: user?.gender || f.gender,
        bio: user?.bio || f.bio
      }));
    }
  }, [user?.name, user?.email, user?.phone, user?.dob, user?.gender, user?.bio]);

  const { orders, isLoading: ordersLoading, fetchOrders, cancelOrder } = useOrderStore();
  const { addresses, isLoading: addressLoading, fetchAddresses, deleteAddress } = useAddressStore();
  const { wishlist, fetchWishlist, toggleWishlist } = useWishlistStore();
  const fileInputRef = useRef(null);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [showProfileHistory, setShowProfileHistory] = useState(false);
  // Tải toàn bộ dữ liệu ngay khi vào trang để Sidebar có số liệu chính xác
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchAddresses();
      fetchWishlist();
      fetchAuditLogs();
    }
  }, [isAuthenticated, fetchOrders, fetchAddresses, fetchWishlist, fetchAuditLogs]);

  // Vẫn giữ logic fetch lại khi sideTab thay đổi để đảm bảo dữ liệu mới nhất (tùy chọn)
  useEffect(() => {
    if (isAuthenticated) {
      if (sideTab === 'orders') fetchOrders();
      if (sideTab === 'address') fetchAddresses();
      if (sideTab === 'wishlist') fetchWishlist();
    }
  }, [sideTab, isAuthenticated, fetchOrders, fetchAddresses, fetchWishlist]);

  // Tự động chuyển tab nếu được redirect từ trang khác qua state (như Checkout)
  useEffect(() => {
    if (location.state?.tab && location.state.tab !== sideTab) {
      setSideTab(location.state.tab);
    }
  }, [location.state]);



  const handleSave = async () => {
    // Validation
    if (!form.name || form.name.trim() === '') {
      toast.error('Họ và tên không được để trống');
      return;
    }
    if (form.phone && !/^\d{10,11}$/.test(form.phone)) {
      toast.error('Số điện thoại không hợp lệ (cần 10-11 số)');
      return;
    }

    // Kiểm tra xem có sự thay đổi nào so với dữ liệu hiện tại không
    if (
      form.name === user?.name &&
      (form.phone || '') === (user?.phone || '') &&
      (form.dob || '') === (user?.dob || '') &&
      (form.gender || '') === (user?.gender || '') &&
      (form.bio || '') === (user?.bio || '')
    ) {
      toast.info('Bạn chưa thay đổi thông tin nào.');
      setEditing(false);
      return;
    }

    const result = await updateProfile({
      name: form.name,
      phone: form.phone,
      dob: form.dob,
      gender: form.gender,
      bio: form.bio
    });
    if (result?.success) {
      toast.success('Cập nhật hồ sơ thành công!');
      setEditing(false);
    } else {
      toast.error(result?.error || 'Lỗi cập nhật');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh!'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File quá lớn (tối đa 5MB)!'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => updateAvatar(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sideMenuItems = [
    { id: 'profile', label: 'Hồ sơ của tôi', sub: 'Thông tin & bảo mật' },
    { id: 'orders', label: 'Đơn hàng', sub: orders.length > 0 ? `${orders.length} đơn hàng` : 'Chưa có đơn hàng' },
    { id: 'address', label: 'Sổ địa chỉ', sub: addresses.length > 0 ? `${addresses.length} địa chỉ` : 'Chưa có địa chỉ' },
    { id: 'wishlist', label: 'Yêu thích', sub: wishlist.length > 0 ? `${wishlist.length} sản phẩm` : 'Sản phẩm đã thích' },
  ];

  /* Stagger container variants */
  const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <>
      <div
        className="min-h-screen page-enter relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 40%, #f5f0ff 70%, #fff0f9 100%)',
        }}
      >
        {/* ── Decorative background orbs ── */}
        <div className="pointer-events-none select-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(0,22,141,0.12) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' }} />
        </div>

        <div className="layout-page pt-0 pb-10 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">

            <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">

              {/* ── Avatar Card ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-xs"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 8px 40px rgba(0,22,141,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
                }}
              >
                {/* Gradient header bg */}
                <div
                  className="absolute top-0 left-0 right-0 h-28 -z-0 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,22,141,0.08) 0%, rgba(124,58,237,0.06) 100%)',
                  }}
                />
                {/* Mesh dots */}
                <div className="absolute top-2 right-3 opacity-10">
                  {[...Array(3)].map((_, r) => (
                    <div key={r} className="flex gap-2 mb-2">
                      {[...Array(3)].map((_, c) => (
                        <div key={c} className="w-1 h-1 rounded-full bg-primary" />
                      ))}
                    </div>
                  ))}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

                <div className="flex flex-col items-center pt-8 pb-6 px-6 relative">
                  {/* Avatar */}
                  <div className="relative mb-14 group z-10">
                    {/* Sweeping Shimmer Border Container */}
                    <div
                      className="absolute -inset-[6px] rounded-xs overflow-hidden pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, #00168d, #7c3aed)',
                      }}
                    >
                      {/* Sweeping Light Sheen */}
                      <motion.div
                        className="absolute top-[-50%] bottom-[-50%] w-12 bg-gradient-to-r from-transparent via-white to-transparent"
                        style={{ transform: 'skewX(-25deg)' }}
                        animate={{
                          left: ['-50%', '150%'],
                        }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          repeatDelay: 2.4, // 4-second total cycle (1.6s sweep + 2.4s pause)
                          ease: 'easeInOut',
                        }}
                      />
                    </div>
                    {/* White backing border ring */}
                    <div className="absolute -inset-[3px] rounded-xs bg-white z-0" />
                    <div className="relative w-[88px] h-[88px] rounded-xs overflow-hidden border-2 border-white shadow-2xl z-10">
                      <img
                        src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/images/${user.avatar}`) : '/default-customer.jpg'}
                        alt={user?.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { 
                          if (!e.target.src.includes('default-customer.jpg')) {
                            e.target.src = '/default-customer.jpg';
                          } else {
                            e.target.style.display = 'none'; 
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="w-full h-full hidden items-center justify-center text-white text-3xl font-black"
                        style={{ background: 'linear-gradient(135deg, #00168d, #7c3aed)' }}>
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 -right-2 z-20 w-8 h-8 rounded-xs flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110"
                      style={{ background: 'linear-gradient(135deg, #00168d, #7c3aed)', border: '2px solid white' }}
                      title="Đổi ảnh đại diện"
                    >
                      <Camera size={14} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Name */}
                  <h2 className="text-[16px] font-black text-slate-800 tracking-tight mb-1 text-center relative z-20">
                    {user?.name}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium mb-3 relative z-20">{user?.email}</p>

                  {/* Member badge */}
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,22,141,0.08), rgba(124,58,237,0.06))',
                      border: '2px solid rgba(0,22,141,0.12)',
                    }}
                  >
                    <span className="text-[9px] font-black tracking-[0.18em] uppercase text-primary">
                      Thành viên từ 2026
                    </span>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-2 w-full mt-3">
                    {[
                      { label: 'Đơn hàng', value: orders.length, icon: ShoppingBag, color: 'text-primary' },
                      { label: 'Địa chỉ', value: addresses.length, icon: MapPin, color: 'text-rose-500 fill-rose-100' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center py-3 px-2 rounded-xs"
                        style={{
                          background: 'rgba(248,250,255,0.8)',
                          border: '2px solid rgba(226,232,240,0.6)',
                        }}
                      >
                        <Icon size={13} className={`${color} mb-1 ${label === 'Địa chỉ' ? 'opacity-100' : 'opacity-60'}`} />
                        <span className="text-[15px] font-black text-slate-800">{value}</span>
                        <span className="text-[9px] text-slate-400 font-semibold tracking-wide">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── Nav Card ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="overflow-hidden rounded-xs"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 8px 40px rgba(0,22,141,0.06), 0 1px 0 rgba(255,255,255,0.9) inset',
                }}
              >
                <nav className="p-3">
                  {sideMenuItems.map((item, idx) => {
                    const active = sideTab === item.id;
                    const Icon = sideMenuIcons[item.id];
                    const col = sideMenuColors[item.id];
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => setSideTab(item.id)}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 + 0.12 }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xs mb-1 last:mb-0 transition-all duration-200 group text-left relative"
                        style={{
                          background: active
                            ? `linear-gradient(135deg, ${col.from}12, ${col.to}08)`
                            : 'transparent',
                          border: active
                            ? `2px solid ${col.from}20`
                            : '2px solid transparent',
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-xs flex items-center justify-center shrink-0 transition-all duration-200"
                          style={{
                            background: active
                              ? `linear-gradient(135deg, ${col.from}, ${col.to})`
                              : 'rgba(241,245,249,0.8)',
                            boxShadow: active ? `0 4px 12px ${col.from}30` : 'none',
                          }}
                        >
                          <Icon
                            size={15}
                            strokeWidth={2.5}
                            style={{ color: active ? '#fff' : '#94a3b8' }}
                          />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13px] font-bold leading-none mb-0.5 transition-colors"
                            style={{ color: active ? col.from : '#475569' }}
                          >
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {item.sub}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight
                          size={13}
                          className="transition-transform group-hover:translate-x-0.5"
                          style={{ color: active ? col.from + '80' : '#cbd5e1' }}
                        />

                        {/* Active left bar */}
                        {active && (
                          <motion.div
                            layoutId="sidebar-bar"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-xs"
                            style={{ background: `linear-gradient(180deg, ${col.from}, ${col.to})` }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </nav>

                {/* Logout */}
                <div className="px-3 pb-3">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xs text-[11px] font-black tracking-[0.15em] uppercase transition-all duration-200 group"
                    style={{
                      background: 'rgba(254,242,242,0.6)',
                      border: '2px solid rgba(254,202,202,0.5)',
                      color: '#ef4444',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(254,226,226,0.8)';
                      e.currentTarget.style.borderColor = 'rgba(252,165,165,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(254,242,242,0.6)';
                      e.currentTarget.style.borderColor = 'rgba(254,202,202,0.5)';
                    }}
                  >
                    <LogOut size={13} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
                    Đăng xuất
                  </button>
                </div>
              </motion.div>
            </aside>

            {/* ══════════════════════════════
              MAIN PANEL
          ══════════════════════════════ */}
            <main className="flex-1 flex flex-col gap-5">

              {/* ── PROFILE PANEL ── */}
              <AnimatePresence mode="wait">
                {sideTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-xs"
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '2px solid rgba(255,255,255,0.9)',
                      boxShadow: '0 8px 40px rgba(0,22,141,0.07)',
                    }}
                  >
                    {/* Tab bar */}
                    <div className="flex items-center gap-2 px-6 pt-6 pb-0 border-b border-slate-100/80">
                      {[
                        { id: 'info', label: 'Hồ sơ', icon: User },
                        { id: 'security', label: 'Bảo mật', icon: Shield },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { setMainTab(t.id); setEditing(false); }}
                          className="relative flex items-center gap-2 px-4 pb-4 pt-1 text-[12px] font-bold tracking-wide transition-all"
                          style={{ color: mainTab === t.id ? '#00168d' : '#94a3b8' }}
                        >
                          <t.icon size={12} strokeWidth={2.5} />
                          {t.label}
                          {mainTab === t.id && (
                            <motion.div
                              layoutId="main-tab-bar"
                              className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-xs"
                              style={{ background: 'linear-gradient(90deg, #00168d, #7c3aed)' }}
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* ── INFO TAB ── */}
                    {mainTab === 'info' && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 md:p-8"
                      >
                        {/* Section header */}
                        <div className="flex items-start justify-between mb-7">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-1.5 h-10 rounded-xs shrink-0 mt-0.5"
                              style={{ background: 'linear-gradient(180deg, #00168d, #7c3aed)' }}
                            />
                            <div>
                              <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Thông tin cá nhân</h2>
                              <p className="text-[12px] text-slate-400 mt-0.5">Quản lý thông tin hồ sơ của bạn</p>
                            </div>
                          </div>
                          <AnimatePresence mode="wait">
                            {editing ? (
                              <motion.div
                                key="editing-actions"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2"
                              >
                                <button
                                  onClick={() => setEditing(false)}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-none text-[11px] font-bold text-slate-500 transition-all hover:bg-slate-100"
                                  style={{ border: '2px solid #e2e8f0' }}
                                >
                                  <X size={12} />
                                  Huỷ
                                </button>
                                <button
                                  onClick={handleSave}
                                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-none text-[11px] font-black text-white transition-all hover:-translate-y-0.5"
                                  style={{
                                    background: 'linear-gradient(135deg, #00168d, #7c3aed)',
                                    boxShadow: '0 4px 16px rgba(0,22,141,0.25)',
                                  }}
                                >
                                  <Check size={12} />
                                  Lưu thay đổi
                                </button>
                              </motion.div>
                            ) : (
                              <motion.button
                                key="edit-btn"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xs text-[11px] font-black text-white transition-all hover:-translate-y-0.5"
                                style={{
                                  background: 'linear-gradient(135deg, #00168d, #1e3b87)',
                                  boxShadow: '0 4px 16px rgba(0,22,141,0.20)',
                                }}
                              >
                                Chỉnh sửa
                                <ArrowUpRight size={12} strokeWidth={2.5} />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Fields grid */}
                        <motion.div
                          variants={staggerContainer}
                          initial="hidden"
                          animate="visible"
                          className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7"
                        >
                          {[
                            { label: 'HỌ VÀ TÊN', key: 'name', type: 'text' },
                            { label: 'ĐỊA CHỈ EMAIL', key: 'email', type: 'email' },
                            { label: 'SỐ ĐIỆN THOẠI', key: 'phone', type: 'tel' },
                            { label: 'NGÀY SINH', key: 'dob', type: 'date' },
                            { 
                              label: 'GIỚI TÍNH', 
                              key: 'gender', 
                              type: 'select',
                              options: [
                                { label: 'Nam', value: 'Nam' },
                                { label: 'Nữ', value: 'Nữ' }
                              ]
                            },
                          ].map(({ label, key, type, options }) => (
                            <motion.div key={key} variants={fadeUp}>
                              <FloatingField
                                label={label}
                                value={form[key]}
                                editing={editing && key !== 'email'} // Thường email không cho sửa trực tiếp ở đây
                                type={type}
                                options={options}
                                onChange={(v) => setForm(f => ({ ...f, [key]: v }))}
                              />
                            </motion.div>
                          ))}
                          <motion.div variants={fadeUp} className="md:col-span-2">
                            <FloatingField
                              label="TIỂU SỬ"
                              value={form.bio}
                              editing={editing}
                              onChange={(v) => setForm(f => ({ ...f, bio: v }))}
                            />
                          </motion.div>
                        </motion.div>



                        {/* Edit History Timeline */}
                        <div
                          className="rounded-xs overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(255,255,255,0.7))',
                            border: '2px solid rgba(226,232,240,0.6)',
                          }}
                        >
                          {/* Header */}
                          <div
                            onClick={() => setShowProfileHistory(!showProfileHistory)}
                            className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100/60 cursor-pointer select-none"
                            style={{ background: 'linear-gradient(90deg, rgba(0,22,141,0.04), transparent)' }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-7 h-7 rounded-xs flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, rgba(0,22,141,0.12), rgba(124,58,237,0.08))' }}
                              >
                                <Clock size={13} className="text-primary" />
                              </div>
                              <h3 className="text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase">
                                Lịch sử chỉnh sửa hồ sơ
                              </h3>
                            </div>
                            <ChevronDown
                              size={15}
                              className={`text-slate-400 transition-transform duration-300 ${
                                showProfileHistory ? 'rotate-180' : ''
                              }`}
                            />
                          </div>

                          {/* Timeline */}
                          <AnimatePresence initial={false}>
                            {showProfileHistory && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 py-4">
                                  <div className="relative space-y-0 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                    {auditLogs.filter(l => l.actionType === 'PROFILE').length > 0 && (
                                      <div className="absolute left-[7px] top-3 bottom-3 w-px"
                                        style={{ background: 'linear-gradient(180deg, #00168d50, #e2e8f0, transparent)' }} />
                                    )}
                                    {auditLogs.filter(l => l.actionType === 'PROFILE').length === 0 && (
                                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Clock size={24} className="mb-2 opacity-20" />
                                        <p className="text-sm font-medium">Chưa có dữ liệu lịch sử</p>
                                      </div>
                                    )}
                                    {auditLogs.filter(l => l.actionType === 'PROFILE').map((log, idx) => (
                                      <div key={log.id} className="flex items-start gap-4 py-3.5 group cursor-default">
                                        <div className="relative z-10 mt-1.5 shrink-0">
                                          <div
                                            className="w-3.5 h-3.5 rounded-full border-2 transition-all duration-300"
                                            style={idx === 0
                                              ? { background: '#00168d', borderColor: 'rgba(0,22,141,0.3)', boxShadow: '0 0 8px rgba(0,22,141,0.3)' }
                                              : { background: 'white', borderColor: '#cbd5e1' }
                                            }
                                          />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between -mt-0.5">
                                          <div>
                                            <p className="text-[13px] font-bold text-slate-700 group-hover:text-primary transition-colors">
                                              {log.actionTitle}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{log.actionDetail}</p>
                                          </div>
                                          <span className="text-[11px] font-semibold text-slate-400 ml-4 shrink-0 tabular-nums">
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}

                    {/* ── SECURITY TAB ── */}
                    {mainTab === 'security' && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 md:p-8"
                      >
                        <PasswordSection />
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── ORDERS PANEL ── */}
                {sideTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-xs"
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '2px solid rgba(255,255,255,0.9)',
                      boxShadow: '0 8px 40px rgba(0,22,141,0.07)',
                    }}
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex items-start gap-4 mb-8">
                        <div className="w-1 h-10 rounded-full shrink-0 mt-0.5"
                          style={{ background: 'linear-gradient(180deg, #7c3aed, #a78bfa)' }} />
                        <div>
                          <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Đơn hàng của tôi</h2>
                          <p className="text-[12px] text-slate-400 mt-0.5">Xem và quản lý các giao dịch mua sắm</p>
                        </div>
                      </div>

                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar"
                      >
                        {/* Loading */}
                        {ordersLoading && orders.length === 0 && (
                          <div className="flex justify-center py-12">
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                              <div className="w-8 h-8 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                              <p className="text-sm font-medium">Đang tải đơn hàng...</p>
                            </div>
                          </div>
                        )}

                        {/* Empty */}
                        {!ordersLoading && orders.length === 0 && (
                          <div className="text-center py-16 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(167,139,250,0.06))' }}>
                              <Box size={28} className="text-violet-400" />
                            </div>
                            <p className="text-[15px] font-bold text-slate-500 mb-1">Chưa có đơn hàng nào</p>
                            <p className="text-[12px] text-slate-400">Hãy mua sắm và quay lại đây nhé!</p>
                          </div>
                        )}

                        {/* Order cards */}
                        {orders.map((order) => (
                          <motion.div
                            key={order.id}
                            variants={fadeUp}
                            className="relative overflow-hidden rounded-xs group transition-all duration-300 hover:-translate-y-0.5"
                            style={{
                              background: 'rgba(255,255,255,0.9)',
                              border: '2px solid rgba(226,232,240,0.7)',
                              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,22,141,0.10)';
                              e.currentTarget.style.borderColor = 'rgba(0,22,141,0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                              e.currentTarget.style.borderColor = 'rgba(226,232,240,0.7)';
                            }}
                          >
                            {/* Gradient top strip */}
                            <div className="h-[3px]"
                              style={{ background: 'linear-gradient(90deg, #7c3aed40, #a78bfa30, transparent)' }} />

                            <div className="p-6">
                              {/* Order header */}
                              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-10 h-10 rounded-none flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(167,139,250,0.08))' }}
                                  >
                                    <Box size={16} className="text-violet-600" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase mb-0.5">Mã đơn hàng</p>
                                    <p className="text-[14px] font-black text-slate-800">{order.orderCode}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase mb-0.5">Ngày đặt</p>
                                    <p className="text-[12px] font-bold text-slate-600">
                                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}
                                    </p>
                                  </div>
                                  <StatusChip status={order.status?.toLowerCase()} />
                                </div>
                              </div>

                              {/* Items — hiển thị ảnh thật */}
                              <div className="space-y-3 mb-5">
                                {(order.items || []).map((item) => (
                                  <div key={item.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {item.productImage ? (
                                        <img
                                          src={item.productImage}
                                          alt={item.productName}
                                          className="w-14 h-16 rounded-xs object-cover shrink-0"
                                          style={{ border: '2px solid rgba(226,232,240,0.8)' }}
                                          onError={e => { e.target.style.display = 'none'; }}
                                        />
                                      ) : (
                                        <div className="w-14 h-16 rounded-xs shrink-0"
                                          style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: '2px solid rgba(226,232,240,0.8)' }} />
                                      )}
                                      <div>
                                        <p className="text-[13px] font-bold text-slate-800 line-clamp-1">{item.productName}</p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                          {item.size && `Size: ${item.size} · `}SL: {item.quantity}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-[13px] font-black text-slate-700">{formatPrice(item.subtotal)}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Footer */}
                              <div
                                className="flex items-center justify-between pt-4"
                                style={{ borderTop: '2px solid rgba(226,232,240,0.6)' }}
                              >
                                <div>
                                  <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase mb-1">Tổng giá trị</p>
                                  <p
                                    className="text-[19px] font-black tracking-tight"
                                    style={{ background: 'linear-gradient(90deg, #00168d, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                                  >
                                    {formatPrice(order.totalAmount)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Nút huỷ đơn - chỉ hiện khi PENDING */}
                                  {order.status === 'PENDING' && (
                                    <button
                                      onClick={() => setOrderToCancel(order)}
                                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xs text-[11px] font-bold text-red-600 transition-all hover:-translate-y-0.5"
                                      style={{ background: 'rgba(254,242,242,0.8)', border: '2px solid rgba(252,165,165,0.5)' }}
                                    >
                                      Huỷ đơn
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setIsDetailModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xs text-[11px] font-black text-slate-600 transition-all hover:-translate-y-0.5"
                                    style={{
                                      background: 'rgba(248,250,252,0.8)',
                                      border: '2px solid rgba(226,232,240,0.8)',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,22,141,0.06), rgba(124,58,237,0.04))';
                                      e.currentTarget.style.color = '#00168d';
                                      e.currentTarget.style.borderColor = 'rgba(0,22,141,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(248,250,252,0.8)';
                                      e.currentTarget.style.color = '#475569';
                                      e.currentTarget.style.borderColor = 'rgba(226,232,240,0.8)';
                                    }}
                                  >
                                    Chi tiết đơn hàng
                                    <ChevronRight size={13} strokeWidth={2.5} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* ── ADDRESS PANEL ── */}
                {sideTab === 'address' && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-xs"
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '2px solid rgba(255,255,255,0.9)',
                      boxShadow: '0 8px 40px rgba(0,22,141,0.07)',
                    }}
                  >
                    <div className="p-4 md:p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-1.5 h-10 rounded-none shrink-0 mt-0.5"
                          style={{ background: 'linear-gradient(180deg, #059669, #34d399)' }} />
                        <div>
                          <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Sổ địa chỉ</h2>
                          <p className="text-[12px] text-slate-400 mt-0.5">Quản lý các địa chỉ nhận hàng của bạn</p>
                        </div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-3 mb-3 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar"
                      >
                        {addressLoading ? (
                          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" /></div>
                        ) : (
                          addresses.map(addr => (
                            <div
                              key={addr.id}
                              className={`relative overflow-hidden rounded-xs p-3 group transition-all duration-300 hover:-translate-y-0.5 ${addr.isDefault ? 'border-emerald-200' : 'border-slate-200'}`}
                              style={{
                                background: addr.isDefault ? 'linear-gradient(135deg, rgba(5,150,105,0.04), rgba(255,255,255,0.95))' : 'rgba(255,255,255,0.95)',
                                borderWidth: '2px',
                                boxShadow: addr.isDefault ? '0 4px 20px rgba(5,150,105,0.08)' : 'none',
                                padding: '12px',
                              }}
                            >
                              {addr.isDefault && <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #059669, transparent)' }} />}
                              <div className="flex items-center gap-3 relative z-10" style={{ paddingLeft: '8px' }}>
                                <div
                                  className="rounded-xs flex items-center justify-center shrink-0 self-center"
                                  style={addr.isDefault 
                                    ? { background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 4px 12px rgba(5,150,105,0.3)', width: '36px', height: '36px' } 
                                    : { background: '#f1f5f9', width: '36px', height: '36px' }}
                                >
                                  <MapPin size={16} className={addr.isDefault ? 'text-white' : 'text-slate-400'} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2.5" style={{ marginBottom: '2px' }}>
                                    <h4 className="text-[14px] font-black text-slate-800">{addr.recipientName} - {addr.phone}</h4>
                                    {addr.isDefault && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider" style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '2px solid rgba(5,150,105,0.15)' }}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Mặc định
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[13.5px] text-slate-600 font-medium leading-tight">{addr.address}, {addr.district}, {addr.city}</p>
                                  <div className="flex items-center gap-3" style={{ marginTop: '4px' }}>
                                    <button onClick={() => { setAddressToEdit(addr); setIsAddressModalOpen(true); }} className="text-[11px] font-black uppercase tracking-wider transition-all" style={{ color: '#059669', borderBottom: '2px solid rgba(5,150,105,0.3)' }}>Chỉnh sửa</button>
                                    <button onClick={() => setAddressToDelete(addr)} className="text-[11px] font-black uppercase tracking-wider transition-all text-red-400" style={{ borderBottom: '2px solid rgba(239,68,68,0.25)' }}>Xoá</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}

                        <button
                          onClick={() => { setAddressToEdit(null); setIsAddressModalOpen(true); }}
                          className="w-full flex flex-col items-center justify-center gap-3 py-6 rounded-xs transition-all duration-300 group hover:-translate-y-0.5"
                          style={{ border: '2px dashed rgba(226,232,240,0.9)', background: 'rgba(248,250,252,0.5)', paddingTop: '24px', paddingBottom: '24px' }}
                        >
                          <div className="w-11 h-11 rounded-none flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{ background: 'rgba(0,22,141,0.06)', border: '2px solid rgba(0,22,141,0.12)' }}>
                            <Plus size={18} className="text-primary" />
                          </div>
                          <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Thêm địa chỉ mới</span>
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* ── WISHLIST PANEL ── */}
                {sideTab === 'wishlist' && (
                  <motion.div
                    key="wishlist"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden rounded-xs"
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '2px solid rgba(255,255,255,0.9)',
                      boxShadow: '0 8px 40px rgba(0,22,141,0.07)',
                    }}
                  >
                    {wishlist.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 px-10 text-center min-h-[450px]">
                        <div className="relative mb-8">
                          <div className="absolute inset-0 rounded-full blur-2xl opacity-40 scale-125"
                            style={{ background: 'radial-gradient(circle, #fb7185, transparent)' }} />
                          <div
                            className="relative w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                            style={{ background: 'linear-gradient(135deg, rgba(225,29,72,0.1), rgba(251,113,133,0.08))', border: '2px solid rgba(225,29,72,0.12)' }}
                          >
                            <Heart size={24} className="text-rose-400 fill-rose-300" strokeWidth={1.5} />
                          </div>
                        </div>
                        <p className="text-[11px] font-black tracking-[0.25em] text-slate-400 uppercase mb-3">Danh sách yêu thích</p>
                        <p className="text-[16px] text-slate-500 mb-8 max-w-xs leading-relaxed">Chưa có sản phẩm nào trong danh sách yêu thích của bạn.</p>
                      </div>
                    ) : (
                      <div className="p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-8">
                          <div className="w-1.5 h-10 rounded-none shrink-0 mt-0.5" style={{ background: 'linear-gradient(180deg, #e11d48, #fb7185)' }} />
                          <div>
                            <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Sản phẩm yêu thích</h2>
                            <p className="text-[12px] text-slate-400 mt-0.5">Các sản phẩm bạn đã lưu</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                          {wishlist.map(item => (
                            <div key={item.id} className="group relative bg-white border border-slate-200 p-3 flex flex-col gap-3 hover:border-rose-200 transition-all">
                              <button onClick={() => toggleWishlist(item.productId)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:scale-110 transition-all backdrop-blur-sm shadow-sm">
                                <Heart size={16} className="fill-rose-500" />
                              </button>
                              <Link to={`/products/${item.productId}`} className="block flex-1 flex flex-col gap-3">
                                <div className="aspect-[3/4] bg-slate-100 overflow-hidden relative">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  ) : (
                                    <div className="w-full h-full bg-slate-200" />
                                  )}
                                </div>
                                <div className="flex-1 flex flex-col justify-end">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{item.productCategory}</p>
                                  <h3 className="text-[13px] font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-primary transition-colors">{item.productName}</h3>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-black text-rose-600">{formatPrice(item.price)}</span>
                                    {item.originalPrice > item.price && (
                                      <span className="text-[11px] text-slate-400 line-through">{formatPrice(item.originalPrice)}</span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>



            </main>
          </div>
        </div>
      </div>
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addressToEdit={addressToEdit}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        order={selectedOrder}
      />

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setOrderToCancel(null); setCancelReason(''); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white p-10 rounded-xs max-w-md w-full text-center shadow-2xl flex flex-col items-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Huỷ đơn hàng?</h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                Bạn có chắc chắn muốn huỷ đơn hàng <span className="font-bold text-slate-700">{orderToCancel.orderCode}</span> không? Hành động này không thể hoàn tác.
              </p>
              <div className="w-full mb-6">
                <label className="block text-left text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-2">Lý do huỷ đơn *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn huỷ đơn hàng..."
                  className="w-full h-24 p-3 text-[13px] text-slate-700 resize-none outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  style={{ border: '2px solid rgba(226,232,240,0.8)', background: 'rgba(248,250,252,0.8)', borderRadius: '2px' }}
                />
                {cancelReason.trim().length === 0 && (
                  <p className="text-[11px] text-red-400 mt-1.5 text-left font-medium">Bạn cần nhập lý do để huỷ đơn hàng</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={() => { setOrderToCancel(null); setCancelReason(''); }} className="py-3 text-[12px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-slate-100">QUAY LẠI</button>
                <button 
                  onClick={async () => {
                    if (!cancelReason.trim()) return;
                    const res = await cancelOrder(orderToCancel.id, cancelReason.trim());
                    if (res.success) {
                        toast.success('Đã huỷ đơn hàng thành công');
                        setOrderToCancel(null);
                        setCancelReason('');
                    } else {
                        toast.error(res.error || 'Lỗi khi huỷ đơn hàng');
                    }
                  }}
                  disabled={!cancelReason.trim()}
                  className="py-3 text-[12px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    XÁC NHẬN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Address Confirmation Modal */}
      <AnimatePresence>
        {addressToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAddressToDelete(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white p-10 rounded-xs max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Xoá địa chỉ?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Bạn có chắc chắn muốn xoá địa chỉ tại <span className="font-bold text-slate-700">{addressToDelete.city}</span> không? Hành động này không thể hoàn tác.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={() => setAddressToDelete(null)} className="py-3 text-[12px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-slate-100">QUAY LẠI</button>
                <button 
                  onClick={async () => {
                    await deleteAddress(addressToDelete.id);
                    toast.success('Đã xoá địa chỉ thành công');
                    setAddressToDelete(null);
                  }}
                  className="py-3 text-[12px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                    XÁC NHẬN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────
   PASSWORD SECTION
───────────────────────────────────────── */
function PasswordSection() {
  const { changePassword, auditLogs } = useAuthStore();
  const [vals, setVals] = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [strength, setStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSecurityHistory, setShowSecurityHistory] = useState(false);

  const calcStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const handle = async (e) => {
    e.preventDefault();
    if (vals.new !== vals.confirm) { setError('Mật khẩu mới không khớp!'); return; }
    if (vals.new.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    setError('');
    setIsLoading(true);
    const result = await changePassword(vals.old, vals.new);
    setIsLoading(false);
    if (result?.success) {
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      setVals({ old: '', new: '', confirm: '' });
      setStrength(0);
    } else {
      setError(result?.error || 'Đổi mật khẩu thất bại');
    }
  };

  const fields = [
    { id: 'old', label: 'Mật khẩu hiện tại' },
    { id: 'new', label: 'Mật khẩu mới' },
    { id: 'confirm', label: 'Xác nhận mật khẩu mới' },
  ];

  const strengthColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const strengthLabels = ['Yếu', 'Trung bình', 'Tốt', 'Mạnh'];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-1 h-10 rounded-full shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(180deg, #00168d, #7c3aed)' }} />
        <div>
          <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Bảo mật tài khoản</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Cập nhật mật khẩu để bảo vệ tài khoản</p>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-none p-7"
        style={{
          background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(255,255,255,0.7))',
          border: '2px solid rgba(226,232,240,0.7)',
        }}
      >
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.3), transparent)' }} />

        <div className="flex flex-col items-center relative z-10">
          {/* Lock icon */}
          <div className="flex justify-center mb-7">
            <div className="relative">
              <div className="absolute inset-0 rounded-xs blur-xl opacity-30"
                style={{ background: 'linear-gradient(135deg, #00168d, #7c3aed)' }} />
              <div
                className="relative w-14 h-14 rounded-xs flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #00168d, #7c3aed)',
                  boxShadow: '0 8px 24px rgba(0,22,141,0.25)',
                }}
              >
                <Lock size={22} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <form onSubmit={handle} className="w-full max-w-sm space-y-4">
            {fields.map(({ id, label }) => (
              <div key={id} className="relative group">
                <p className="text-[9px] font-black tracking-[0.28em] text-slate-400 uppercase mb-2">
                  {label}
                </p>
                <div
                  className="relative flex items-center rounded-xs overflow-hidden transition-all duration-200 focus-within:shadow-md"
                  style={{ border: '2px solid rgba(226,232,240,0.8)', background: 'rgba(255,255,255,0.8)' }}
                >
                  <input
                    required
                    type={showPwd[id] ? 'text' : 'password'}
                    value={vals[id]}
                    onChange={(e) => {
                      setVals(v => ({ ...v, [id]: e.target.value }));
                      setError('');
                      if (id === 'new') setStrength(calcStrength(e.target.value));
                    }}
                    className="h-12 w-full bg-transparent pl-4 pr-12 text-[14px] text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => ({ ...p, [id]: !p[id] }))}
                    className="absolute right-3.5 text-slate-300 hover:text-primary transition-colors"
                  >
                    {showPwd[id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar for new password */}
                {id === 'new' && vals.new && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i < strength ? strengthColors[strength - 1] : '#e2e8f0' }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold" style={{ color: strengthColors[strength - 1] || '#94a3b8' }}>
                      {strength > 0 ? `Độ mạnh: ${strengthLabels[strength - 1]}` : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xs p-4 flex items-center gap-3"
                  style={{ background: 'rgba(254,226,226,0.8)', border: '2px solid rgba(252,165,165,0.5)' }}
                >
                  <X size={14} className="text-red-500 shrink-0" />
                  <p className="text-[12px] font-bold text-red-600">{error}</p>
                </motion.div>
              )}
              {done && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xs p-4 flex items-center gap-3"
                  style={{ background: 'rgba(209,250,229,0.8)', border: '2px solid rgba(110,231,183,0.5)' }}
                >
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <p className="text-[12px] font-bold text-emerald-700">Mật khẩu đã được cập nhật thành công!</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xs text-[12px] font-black tracking-[0.15em] uppercase text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #00168d, #7c3aed)',
                boxShadow: '0 8px 24px rgba(0,22,141,0.25)',
              }}
            >
              {isLoading
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
                : <><Shield size={14} /> Cập nhật mật khẩu</>
              }
            </button>
            <div className="text-center mt-3">
              <Link to="/forgot-password" className="text-[12px] font-bold text-slate-500 hover:text-primary transition-colors underline decoration-slate-300 underline-offset-4">
                Quên mật khẩu?
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Security log */}
      <div
        className="rounded-xs overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(255,255,255,0.7))',
          border: '2px solid rgba(226,232,240,0.6)',
        }}
      >
        <div
          onClick={() => setShowSecurityHistory(!showSecurityHistory)}
          className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100/60 cursor-pointer select-none"
          style={{ background: 'linear-gradient(90deg, rgba(0,22,141,0.04), transparent)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-xs flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,22,141,0.12), rgba(124,58,237,0.08))' }}
            >
              <Shield size={13} className="text-primary" />
            </div>
            <h3 className="text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase">
              Lịch sử bảo mật
            </h3>
          </div>
          <ChevronDown
            size={15}
            className={`text-slate-400 transition-transform duration-300 ${
              showSecurityHistory ? 'rotate-180' : ''
            }`}
          />
        </div>
        <AnimatePresence initial={false}>
          {showSecurityHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-5 py-4">
                <div className="relative space-y-0 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {auditLogs.filter(l => l.actionType === 'SECURITY').length > 0 && (
                    <div className="absolute left-[7px] top-3 bottom-3 w-px"
                      style={{ background: 'linear-gradient(180deg, #00168d50, #e2e8f0, transparent)' }} />
                  )}
                  {auditLogs.filter(l => l.actionType === 'SECURITY').length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Shield size={24} className="mb-2 opacity-20" />
                      <p className="text-sm font-medium">Chưa có dữ liệu bảo mật</p>
                    </div>
                  )}
                  {auditLogs.filter(l => l.actionType === 'SECURITY').map((log, idx) => (
                    <div key={log.id} className="flex items-start gap-4 py-3.5 group cursor-default">
                      <div className="relative z-10 mt-1.5 shrink-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full border-2 transition-all"
                          style={idx === 0
                            ? { background: '#00168d', borderColor: 'rgba(0,22,141,0.3)', boxShadow: '0 0 8px rgba(0,22,141,0.3)' }
                            : { background: 'white', borderColor: '#cbd5e1' }
                          }
                        />
                      </div>
                      <div className="flex-1 flex items-center justify-between -mt-0.5">
                        <div>
                          <p className="text-[13px] font-bold text-slate-700 group-hover:text-primary transition-colors">{log.actionTitle}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{log.actionDetail}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 ml-4 shrink-0 tabular-nums">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
