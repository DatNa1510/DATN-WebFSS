import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronRight, Package, MapPin, Heart, User, ArrowUpRight, Camera, Ruler, Lock, Eye, EyeOff, Box, Shield, Clock } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { orders, formatPrice, orderStatusMap } from '../../data/mockData';

function ProfileField({ label, value, editing = false, onChange, icon, className = "" }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
      <div className="relative pt-5 pb-4 px-4 border border-slate-100 rounded-xl bg-white/60 hover:border-primary/20 hover:shadow-sm transition-all duration-300 group-focus-within:border-primary/40 group-focus-within:shadow-md group-focus-within:shadow-primary/5">
        <p className="m-0 text-[9px] font-black tracking-[0.25em] text-primary/50 uppercase group-focus-within:text-primary transition-colors leading-[1.1] mb-2">{label}</p>
        {editing ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-[15px] md:text-[16px] font-semibold text-primary outline-none leading-[1.2] px-0"
          />
        ) : (
          <p className="text-[15px] md:text-[16px] font-semibold text-slate-700 leading-[1.2]">{value || '—'}</p>
        )}
      </div>
    </div>
  );
}

const sideMenuIcons = {
  profile: User,
  orders: Box,
  address: MapPin,
  wishlist: Heart,
};

export default function ProfilePage() {
  const { user, updateProfile, updateAvatar, logout } = useAuthStore();

  const [sideTab, setSideTab] = useState('profile');
  const [mainTab, setMainTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '0901234567',
    address: '123 Lê Lợi, Q1, TP.HCM',
    dob: '12 / 05 / 1995',
    gender: 'Nam',
    bio: 'Đam mê thời trang và trải nghiệm những phong cách mới. Luôn tìm kiếm những bộ trang phục phù hợp với cá tính.',
  });

  useEffect(() => {
    if (user?.name || user?.email) {
      setForm(f => ({ ...f, name: user?.name || f.name, email: user?.email || f.email }));
    }
  }, [user?.name, user?.email]);

  const fileInputRef = useRef(null);

  const handleSave = () => {
    updateProfile({ name: form.name });
    setEditing(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Vui lòng chọn file ảnh!'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File quá lớn (tối đa 5MB)!'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => updateAvatar(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sideMenuItems = [
    { id: 'profile', label: 'Hồ sơ của tôi' },
    { id: 'orders', label: 'Đơn hàng của tôi' },
    { id: 'address', label: 'Số địa chỉ' },
    { id: 'wishlist', label: 'Danh sách yêu thích' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-[#f4f5f7] to-slate-200/70 page-enter">
      <div className="layout-page py-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ============ SIDEBAR ============ */}
          <aside className="w-full lg:w-72 shrink-0 sticky top-24 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset',
              borderRadius: '0',
            }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            {/* Avatar section */}
            <div className="flex flex-col items-center pt-10 pb-8 px-6 border-b border-white/60 relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

              <div className="relative mb-5 group z-10">
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 scale-110 animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-2 ring-primary/10">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div className="w-full h-full bg-primary hidden items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Đổi ảnh đại diện"
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-primary border border-slate-100 hover:bg-primary hover:text-white transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-primary/20"
                >
                  <Camera size={14} strokeWidth={2.5} />
                </button>
              </div>

              <div className="text-center z-10">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-2">{user?.name}</h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.08), rgba(var(--primary-rgb),0.04))',
                    border: '1px solid rgba(var(--primary-rgb),0.15)',
                  }}
                >
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black tracking-[0.15em] text-primary uppercase">THÀNH VIÊN TỪ 2026</span>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="py-3">
              {sideMenuItems.map((item) => {
                const active = sideTab === item.id;
                const Icon = sideMenuIcons[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => setSideTab(item.id)}
                    className={`w-full flex items-center justify-between px-6 py-3.5 text-[13px] font-bold tracking-wide transition-all duration-200 relative group ${active
                      ? 'text-primary'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    {/* Active background */}
                    {active && (
                      <motion.div
                        layoutId="side-nav-bg"
                        className="absolute inset-x-3 inset-y-1 rounded-xl bg-primary/8 border border-primary/10"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    {!active && (
                      <div className="absolute inset-x-3 inset-y-1 rounded-xl bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}

                    <div className="flex items-center gap-3 relative z-10">
                      {active && (
                        <motion.div
                          layoutId="side-nav-indicator"
                          className="absolute -left-3 w-1 h-5 bg-primary rounded-r-full"
                        />
                      )}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${active ? 'bg-primary/10 text-primary' : 'bg-transparent text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                        }`}>
                        <Icon size={14} strokeWidth={2.5} />
                      </div>
                      <span className={`transition-transform duration-200 ${active ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`}>
                        {item.label}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <ChevronRight size={14} className={`transition-transform ${active ? 'text-primary/40' : 'text-slate-300 group-hover:translate-x-0.5'}`} />
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="flex-1" />

            {/* Logout */}
            <div className="px-6 py-5 border-t border-slate-100/80 mt-2">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-100 text-[11px] font-black text-red-500 uppercase tracking-[0.2em] hover:bg-red-50 hover:border-red-200 transition-all duration-200 active:scale-95 group"
              >
                <LogOut size={13} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />
                Đăng xuất
              </button>
            </div>
          </aside>

          {/* ============ MAIN PANEL ============ */}
          <main className="flex-1 min-h-[700px] overflow-hidden flex flex-col rounded-none"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            }}
          >

            {/* ---- Profile panel ---- */}
            {sideTab === 'profile' && (
              <>
                {/* Tab bar */}
                <div className="flex items-center gap-8 px-10 pt-8 pb-0 border-b border-slate-100/80">
                  {[
                    { id: 'info', label: 'Hồ sơ', icon: User },
                    { id: 'security', label: 'Bảo mật tài khoản', icon: Shield },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setMainTab(t.id);
                        setEditing(false);
                      }}
                      className={`pb-4 text-[12px] font-bold tracking-wider transition-all relative flex items-center gap-2 ${mainTab === t.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      <t.icon size={13} strokeWidth={2.5} />
                      {t.label.toUpperCase()}
                      {mainTab === t.id && (
                        <motion.div
                          layoutId="profile-tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
                          style={{ boxShadow: '0 -4px 12px rgba(var(--primary-rgb),0.25)' }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* ---- Info sub-tab ---- */}
                {mainTab === 'info' && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-10 pt-10 pb-10 flex-1 flex flex-col"
                  >
                    {/* Header */}
                    <div className="mb-8 flex items-start justify-between">
                      <div>
                        <h2 className="text-[20px] font-black text-primary mb-0 uppercase tracking-tight">Thông tin cá nhân</h2>
                        <p className="text-[13px] text-slate-400 leading-tight">Quản lý các thông tin cá nhân và thiết lập tài khoản của bạn.</p>
                      </div>
                      {/* Decorative accent */}
                      <div className="hidden md:flex items-center gap-1 opacity-20">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-primary" style={{ opacity: 1 - i * 0.2 }} />
                        ))}
                      </div>
                    </div>

                    {/* Personal Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <ProfileField
                        label="HỌ VÀ TÊN"
                        value={form.name}
                        editing={editing}
                        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                      />
                      <ProfileField
                        label="ĐỊA CHỈ EMAIL"
                        value={form.email}
                        editing={editing}
                        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                      />
                      <ProfileField
                        label="SỐ ĐIỆN THOẠI"
                        value={form.phone}
                        editing={editing}
                        onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                      />
                      <ProfileField
                        label="NGÀY SINH"
                        value={form.dob}
                        editing={editing}
                        onChange={(v) => setForm((f) => ({ ...f, dob: v }))}
                      />
                      <ProfileField
                        label="GIỚI TÍNH"
                        value={form.gender}
                        editing={editing}
                        onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                      />
                      <ProfileField
                        label="TIỂU SỬ"
                        value={form.bio}
                        editing={editing}
                        onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
                        className="md:col-span-2"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end mb-10">
                      <AnimatePresence mode="wait">
                        {editing ? (
                          <motion.div
                            key="editing"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center gap-3"
                          >
                            <button
                              onClick={() => setEditing(false)}
                              className="px-8 py-3 text-[11px] font-black tracking-[0.2em] uppercase text-slate-500 border border-slate-200 rounded-none hover:bg-slate-50 hover:border-slate-300 transition-all"
                            >
                              HỦY
                            </button>
                            <button
                              onClick={handleSave}
                              className="flex items-center gap-2.5 px-10 py-3 bg-primary text-white text-[11px] font-black tracking-[0.2em] uppercase hover:bg-primary-700 rounded-none transition-all shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0"
                            >
                              LƯU THAY ĐỔI
                              <ArrowUpRight size={14} strokeWidth={2.5} />
                            </button>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="view"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            onClick={() => setEditing(true)}
                            className="flex items-center justify-center gap-3 px-10 py-3 bg-primary text-white text-[11px] font-black tracking-[0.2em] uppercase hover:bg-primary-700 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 rounded-none"
                          >
                            Chỉnh sửa thông tin
                            <ArrowUpRight size={14} strokeWidth={2.5} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Profile Edit History - Timeline style */}
                    <div className="rounded-none overflow-hidden border border-slate-100"
                      style={{
                        background: 'linear-gradient(135deg, rgba(248,250,252,0.8), rgba(255,255,255,0.9))',
                      }}
                    >
                      <div className="px-6 py-4 border-b border-slate-100/80 flex items-center gap-2.5"
                        style={{
                          background: 'linear-gradient(to right, rgba(var(--primary-rgb),0.04), transparent)',
                        }}
                      >
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Clock size={12} className="text-primary" />
                        </div>
                        <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-600 uppercase">Lịch sử chỉnh sửa hồ sơ</h3>
                      </div>

                      <div className="px-6 py-4">
                        {/* Timeline */}
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-primary/30 via-slate-200 to-transparent" />

                          <div className="space-y-0">
                            {[
                              { title: 'Cập nhật số điện thoại', detail: 'Hệ thống đã ghi nhận thay đổi', date: '10/02/2026' },
                              { title: 'Khởi tạo hồ sơ khách hàng', detail: 'Tài khoản được tạo thành công', date: '01/01/2026' },
                            ].map((log, idx) => (
                              <div key={idx} className="flex items-start gap-4 py-3.5 group cursor-default">
                                {/* Timeline dot */}
                                <div className="relative z-10 mt-1 shrink-0">
                                  <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${idx === 0
                                    ? 'bg-primary border-primary/30 shadow-sm shadow-primary/30'
                                    : 'bg-white border-slate-300 group-hover:border-primary/50'
                                    }`} />
                                </div>
                                {/* Content */}
                                <div className="flex-1 flex items-center justify-between min-w-0 -mt-0.5">
                                  <div>
                                    <p className="text-[13.5px] font-bold text-slate-700 group-hover:text-primary transition-colors leading-snug">{log.title}</p>
                                    <p className="text-[11.5px] text-slate-400 mt-0.5">{log.detail}</p>
                                  </div>
                                  <span className="text-[11px] font-semibold text-slate-400 ml-4 shrink-0 tabular-nums">{log.date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ---- Security sub-tab ---- */}
                {mainTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-10 pt-5 pb-12"
                  >
                    <PasswordSection />
                  </motion.div>
                )}
              </>
            )}

            {/* ---- Orders panel ---- */}
            {sideTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="px-10 py-10 space-y-6 flex-1 overflow-auto"
              >
                <div className="mb-8">
                  <h2 className="text-[22px] font-black text-primary mb-1.5 uppercase tracking-tight">Đơn hàng của tôi</h2>
                  <p className="text-[13px] text-slate-400">Xem và quản lý các giao dịch mua sắm của bạn.</p>
                </div>

                <div className="space-y-5 pb-10">
                  {orders.map((order, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="border border-slate-150 rounded-none p-8 hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 group relative overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.7)' }}
                    >
                      {/* Hover accent line */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="flex flex-wrap justify-between items-start gap-4 mb-8 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-primary/6 rounded-xl flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary/10 transition-colors">
                            <Box size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã đơn hàng</p>
                            <p className="text-[15px] font-black text-slate-800 tracking-tight">{order.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày đặt</p>
                            <p className="text-[13px] font-bold text-slate-600">{order.date}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${order.status === 'delivered' || order.status === 'ĐÃ GIAO'
                              ? 'bg-green-50 text-green-600 border border-green-100'
                              : 'bg-orange-50 text-orange-600 border border-orange-100'
                              }`}>
                              {orderStatusMap[order.status]?.label || order.status}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 mb-8">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              <div className="w-18 h-22 bg-slate-50 flex shrink-0 rounded-none overflow-hidden border border-slate-100 w-[72px] h-[88px]" />
                              <div>
                                <h4 className="text-[14px] font-black text-slate-800 mb-1 uppercase tracking-wide">{item.name}</h4>
                                <p className="text-[12px] text-slate-500 font-medium">Size: {item.size} • Số lượng: {item.qty}</p>
                              </div>
                            </div>
                            <p className="text-[14px] font-black text-slate-700">{formatPrice(item.price)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng giá trị</p>
                          <p className="text-[20px] font-black text-primary tracking-tighter">{formatPrice(order.total)}</p>
                        </div>
                        <button className="flex items-center gap-2.5 px-7 py-3 bg-white border border-slate-200 rounded-none text-[11px] font-black text-slate-700 uppercase tracking-widest hover:border-primary hover:text-primary transition-all shadow-sm hover:shadow-md hover:shadow-primary/10 group/btn">
                          CHI TIẾT ĐƠN HÀNG
                          <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ---- Address panel ---- */}
            {sideTab === 'address' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="px-10 py-10"
              >
                <div className="mb-8">
                  <h2 className="text-[22px] font-black text-primary mb-1.5 uppercase tracking-tight">Sổ địa chỉ</h2>
                  <p className="text-[13px] text-slate-400">Quản lý các địa chỉ nhận hàng của bạn.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 mb-8">
                  <div className="group relative border-2 border-primary/15 rounded-none p-8 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8"
                    style={{ background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.02), rgba(255,255,255,0.95))' }}
                  >
                    {/* Top-right gradient accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-11 h-11 bg-primary/8 rounded-full text-primary shadow-sm border border-primary/12 group-hover:bg-primary/12 transition-all duration-300 shrink-0 flex items-center justify-center">
                        <MapPin size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-[15px] font-black text-slate-800">Địa chỉ mặc định</h4>
                          <span className="flex items-center gap-1.5 text-primary text-[9px] font-black uppercase tracking-[0.2em] bg-primary/8 border border-primary/15 px-2.5 py-1 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            MẶC ĐỊNH
                          </span>
                        </div>
                        <p className="text-[13.5px] text-slate-600 font-medium leading-relaxed">{form.address}</p>
                        <div className="flex items-center gap-5 mt-4">
                          <button className="text-[11px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity border-b border-primary/30 pb-0.5">
                            Chỉnh sửa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="flex items-center gap-3 px-8 py-3.5 bg-primary text-white text-[11px] font-black tracking-[0.2em] uppercase hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group rounded-none">
                  + THÊM ĐỊA CHỈ MỚI
                </button>
              </motion.div>
            )}

            {/* ---- Wishlist panel ---- */}
            {sideTab === 'wishlist' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center px-10 py-24 text-center min-h-[450px]"
              >
                {/* Glow ring */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-full bg-pink-100/60 blur-2xl scale-150" />
                  <Heart size={64} strokeWidth={1.5} className="text-[#ff9daf] relative z-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0 8px 16px rgba(255,157,175,0.4))' }} />
                </div>
                <p className="text-[12px] font-black tracking-[0.25em] text-slate-400 uppercase mb-3">Danh sách yêu thích</p>
                <p className="text-[16px] text-slate-500 mb-8 max-w-xs leading-relaxed">Chưa có sản phẩm nào trong danh sách yêu thích.</p>
                <button className="px-10 py-3.5 bg-primary text-white text-[11px] font-black tracking-widest uppercase hover:bg-primary-700 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 rounded-none">
                  KHÁM PHÁ SẢN PHẨM
                </button>
              </motion.div>
            )}
            {/* Smart Fit sticky footer for the profile info tab */}
            {sideTab === 'profile' && mainTab === 'info' && (
              <div className="mt-auto w-full rounded-[5px] border-t border-slate-100 px-10 py-8 md:px-12 md:py-10 relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(240,244,248,1) 100%)' }}
              >
                {/* Bright Neon Orbs */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-400/20 rounded-full blur-[70px] pointer-events-none group-hover:bg-blue-400/20 transition-colors duration-700" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-[70px] pointer-events-none group-hover:bg-pink-400/20 transition-colors duration-700" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-violet-400/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex items-center gap-2 mb-6 relative z-10">
                  <div className="w-2 h-2 rounded-full bg-violet-600 shadow-[0_0_8px_1px_rgba(139,92,246,0.5)] animate-pulse" />
                  <span className="text-[10px] font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500 uppercase">
                    SMART FIT RECOMMENDATION
                  </span>
                </div>

                <h3 className="text-[26px] md:text-[30px] font-bold text-slate-800 leading-[1.2] tracking-tight mb-4 max-w-2xl relative z-10">
                  Dựa trên đơn hàng trước, size <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500 font-black" style={{ filter: 'drop-shadow(0 4px 12px rgba(139,92,246,0.25))' }}>XL</span> sẽ vừa vặn nhất với bạn.
                </h3>

                <p className="text-[14px] text-slate-500 mb-8 max-w-xl leading-relaxed relative z-10 font-medium">
                  AI của chúng tôi đã phân tích lịch sử mua sắm và các số đo của bạn để tối ưu hóa trải nghiệm.
                </p>

                <button className="relative z-10 text-[11px] font-black tracking-[0.2em] text-violet-600 uppercase border-b-2 border-violet-600/30 pb-1 hover:text-pink-600 hover:border-pink-500 hover:shadow-[0_4px_12px_rgba(236,72,153,0.2)] transition-all duration-300">
                  XEM CHI TIẾT SỐ ĐO
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ---- Password change section ---- */
function PasswordSection() {
  const [vals, setVals] = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => {
    e.preventDefault();
    if (vals.new !== vals.confirm) {
      setError('Mật khẩu mới không khớp!');
      return;
    }
    if (vals.new.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    setError('');
    setDone(true);
    setTimeout(() => setDone(false), 2500);
    setVals({ old: '', new: '', confirm: '' });
  };

  const fields = [
    { id: 'old', label: 'Mật khẩu hiện tại' },
    { id: 'new', label: 'Mật khẩu mới' },
    { id: 'confirm', label: 'Xác nhận mật khẩu mới' },
  ];

  return (
    <div className="w-full py-4 space-y-5">
      <div className="border border-slate-100 rounded-none p-7 md:p-10 relative overflow-hidden flex flex-col items-center"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.7))' }}
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-primary/4 rounded-full blur-3xl -mr-28 -mt-28 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/3 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="text-center mb-10 relative z-10 flex flex-col items-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150" />
            <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-lg border border-slate-100">
              <Lock size={22} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-[20px] font-bold text-primary mb-2">Thiết Lập Bảo Mật</h2>
          <p className="text-[13px] text-slate-500 max-w-xs leading-relaxed">
            Vui lòng sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.
          </p>
        </div>

        <form onSubmit={handle} className="relative z-10 w-full max-w-sm space-y-4">
          {fields.map(({ id, label }) => (
            <div key={id} className="relative group">
              <p className="text-[9px] font-black tracking-[0.3em] text-primary/50 uppercase mb-1.5 mt-0 group-focus-within:text-primary transition-colors leading-none" style={{ margin: 0, marginBottom: '6px' }}>{label}</p>
              <div className="relative flex items-center">
                <input
                  required
                  type={showPwd[id] ? 'text' : 'password'}
                  value={vals[id]}
                  onChange={(e) => {
                    setVals(v => ({ ...v, [id]: e.target.value }));
                    setError('');
                  }}
                  className="h-12 w-full rounded-none border border-slate-200 bg-white/80 pl-5 pr-12 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/8 focus:shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => ({ ...p, [id]: !p[id] }))}
                  className="absolute right-4 text-slate-300 hover:text-primary transition-colors"
                >
                  {showPwd[id] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="bg-red-50 border border-red-200 p-4 text-center rounded-none"
              >
                <p className="text-[13px] font-bold text-red-600">{error}</p>
              </motion.div>
            )}
            {done && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="bg-green-50 border border-green-200 p-4 text-center rounded-none"
              >
                <p className="text-[13px] font-bold text-green-600">Mật khẩu đã được cập nhật thành công!</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-3 flex justify-center">
            <button
              type="submit"
              className="w-[220px] h-10 flex items-center justify-center rounded-none bg-primary px-8 text-[11px] font-black tracking-[0.25em] uppercase text-white transition-all hover:bg-primary-700 shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
            >
              CẬP NHẬT MẬT KHẨU
            </button>
          </div>
        </form>
      </div>

      {/* Security history - Timeline */}
      <div className="border border-slate-100 rounded-none overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(248,250,252,0.8), rgba(255,255,255,0.9))' }}
      >
        <div className="px-6 py-4 border-b border-slate-100/80 flex items-center gap-2.5"
          style={{ background: 'linear-gradient(to right, rgba(var(--primary-rgb),0.04), transparent)' }}
        >
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield size={12} className="text-primary" />
          </div>
          <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-600 uppercase">Lịch sử cập nhật bảo mật</h3>
        </div>

        <div className="px-6 py-4">
          <div className="relative">
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-primary/30 via-slate-200 to-transparent" />
            <div className="space-y-0">
              {[
                { title: 'Đăng nhập từ thiết bị mới', detail: 'Hà Nội, Việt Nam • Trình duyệt Chrome', date: '14/03/2026' },
                { title: 'Đổi mật khẩu thành công', detail: 'Đã được thực hiện trên hệ thống FSS', date: '01/01/2026' },
              ].map((log, idx) => (
                <div key={idx} className="flex items-start gap-4 py-3.5 group cursor-default">
                  <div className="relative z-10 mt-1 shrink-0">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${idx === 0
                      ? 'bg-primary border-primary/30 shadow-sm shadow-primary/30'
                      : 'bg-white border-slate-300 group-hover:border-primary/50'
                      }`} />
                  </div>
                  <div className="flex-1 flex items-center justify-between -mt-0.5">
                    <div>
                      <p className="text-[13.5px] font-bold text-slate-700 group-hover:text-primary transition-colors leading-snug">{log.title}</p>
                      <p className="text-[11.5px] text-slate-400 mt-0.5">{log.detail}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 ml-4 shrink-0 tabular-nums">{log.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
