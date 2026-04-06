import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, ChevronRight, Package, MapPin, Heart, User, ArrowUpRight, Camera, Ruler, Lock, Eye, EyeOff, Box } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { orders, formatPrice, orderStatusMap } from '../../data/mockData';

function ProfileField({ label, value, editing = false, onChange }) {
  return (
    <div className="pt-16 pb-4 border-b border-secondary/10 hover:border-primary/30 transition-colors group">
      <p className="m-0 text-[10px] font-black tracking-[0.25em] text-primary/60 uppercase group-focus-within:text-primary transition-colors leading-[1.1]">{label}</p>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[18px] md:text-[20px] font-semibold text-primary outline-none leading-[1.2] px-0"
        />
      ) : (
        <p className="text-[18px] md:text-[20px] font-semibold text-primary leading-[1.2]">{value || '—'}</p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateProfile, updateAvatar, logout } = useAuthStore();

  /* sidebar nav state */
  const [sideTab, setSideTab] = useState('profile');

  /* main tabs (only on profile) */
  const [mainTab, setMainTab] = useState('info'); // 'info' | 'security'

  /* editing state */
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '0901234567',
    address: '123 Lê Lợi, Q1, TP.HCM',
    dob: '12 / 05 / 1995',
  });

  // Sync with store if updated externally (like migration)
  useEffect(() => {
    if (user?.name) setForm(f => ({ ...f, name: user.name }));
  }, [user?.name]);

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
    <div className="min-h-screen bg-[#F4F5F7] page-enter">
      <div className="layout-page py-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ============ SIDEBAR ============ */}
          <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 shadow-sm rounded-none overflow-hidden sticky top-24">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            {/* Avatar section */}
            <div className="flex flex-col items-center pt-10 pb-8 px-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
              <div className="relative mb-4 group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div className="w-full h-full bg-primary hidden items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Đổi ảnh đại diện"
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-primary border border-slate-100 hover:bg-primary hover:text-white transition-all duration-300 transform group-hover:scale-110"
                >
                  <Camera size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight mb-2">{user?.name}</h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-none border border-slate-200/50">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  <span className="text-[9px] font-bold tracking-[0.15em] text-primary uppercase">THÀNH VIÊN TỪ 2026</span>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="py-4">
              {sideMenuItems.map((item) => {
                const active = sideTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSideTab(item.id)}
                    className={`w-full flex items-center justify-between px-8 py-4.5 text-[13px] font-bold tracking-wide transition-all duration-150 relative group ${active
                        ? 'text-primary bg-primary/5'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {active && (
                        <motion.div
                          layoutId="side-nav-indicator"
                          className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full"
                        />
                      )}
                      <span className={active ? 'translate-x-1 transition-transform' : 'group-hover:translate-x-1 transition-transform'}>
                        {item.label}
                      </span>
                    </div>
                    {active ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-300 transition-transform group-hover:translate-x-1" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Logout */}
            <div className="px-8 py-6 border-t border-slate-100 mt-4">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-none border border-red-100 text-[11px] font-black text-red-500 uppercase tracking-[0.2em] hover:bg-red-50 transition-all duration-300 active:scale-95"
              >
                <LogOut size={14} strokeWidth={3} />
                Đăng xuất
              </button>
            </div>
          </aside>

          {/* ============ MAIN PANEL ============ */}
          <main className="flex-1 min-h-[700px] overflow-hidden border border-slate-200/80 bg-white shadow-sm flex flex-col rounded-none">

            {/* ---- Profile panel ---- */}
            {sideTab === 'profile' && (
              <>
                {/* Tab bar */}
                <div className="flex items-center gap-10 px-10 pt-8 pb-0 border-b border-slate-100">
                  {[
                    { id: 'info', label: 'Hồ sơ' },
                    { id: 'security', label: 'Bảo mật tài khoản' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setMainTab(t.id);
                        setEditing(false);
                      }}
                      className={`pb-4 text-[13px] font-bold tracking-wider transition-all relative ${mainTab === t.id
                          ? 'text-primary'
                          : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      {t.label.toUpperCase()}
                      {mainTab === t.id && (
                        <motion.div
                          layoutId="profile-tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-none shadow-[0_-4px_10px_rgba(var(--primary-rgb),0.3)]"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* ---- Info sub-tab ---- */}
                {mainTab === 'info' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-10 pt-10 pb-0 flex-1 flex flex-col min-h-full"
                  >
                    {/* Header Info */}
                    <div className="mb-10">
                      <h2 className="text-[22px] font-bold text-primary mb-1">Thông tin cá nhân</h2>
                      <p className="text-[13px] text-slate-400">Quản lý các thông tin cá nhân và thiết lập tài khoản của bạn.</p>
                    </div>

                    {/* Personal Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14">
                      <ProfileField
                        label="HỌ VÀ TÊN"
                        value={form.name}
                        editing={editing}
                        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                      />
                      <ProfileField
                        label="ĐỊA CHỈ EMAIL"
                        value={user?.email}
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
                    </div>

                    <div className="mt-14 flex justify-end">
                      {editing ? (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setEditing(false)}
                            className="px-10 py-4 text-[11px] font-black tracking-[0.2em] uppercase text-slate-500 border border-slate-200 rounded-none hover:bg-slate-50 transition-colors"
                          >
                            HỦY
                          </button>
                          <button
                            onClick={handleSave}
                            className="flex items-center gap-3 px-12 py-4 bg-primary text-white text-[11px] font-black tracking-[0.2em] uppercase hover:bg-primary-700 rounded-none transition-all shadow-lg shadow-primary/20"
                          >
                            LƯU THAY ĐỔI
                            <ArrowUpRight size={15} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditing(true)}
                          className="flex items-center justify-center gap-4 px-12 py-4 bg-primary text-white text-[11px] font-black tracking-[0.2em] uppercase hover:bg-primary-700 transition-all shadow-lg shadow-primary/20 active:scale-95 rounded-none"
                        >
                          CHỈNH SỬA THÔNG TIN
                          <ArrowUpRight size={15} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>

                    {/* Profile Edit History */}
                    <div className="mt-16 bg-slate-50/50 border border-slate-100 rounded-none p-8">
                      <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase mb-6 flex items-center gap-2">
                        <User size={16} className="text-primary/70" />
                        Lịch sử chỉnh sửa hồ sơ
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-200 last:border-0 hover:bg-white transition-colors px-2 -mx-2 rounded-lg group">
                          <div>
                            <p className="text-[14px] font-bold text-slate-700 group-hover:text-primary transition-colors">Cập nhật số điện thoại</p>
                            <p className="text-[12px] text-slate-400 mt-0.5">Hệ thống đã ghi nhận thay đổi</p>
                          </div>
                          <span className="text-[12px] font-bold text-slate-400">10/02/2026</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200 last:border-0 hover:bg-white transition-colors px-2 -mx-2 rounded-lg group">
                          <div>
                            <p className="text-[14px] font-bold text-slate-700 group-hover:text-primary transition-colors">Khởi tạo hồ sơ khách hàng</p>
                            <p className="text-[12px] text-slate-400 mt-0.5">Tài khoản được tạo thành công</p>
                          </div>
                          <span className="text-[12px] font-bold text-slate-400">01/01/2026</span>
                        </div>
                      </div>
                    </div>

                    {/* Smart Fit Recommendation Block - Temporarily hidden */}
                    {/* 
                    <div className="mt-auto -mx-10 border-t-2 border-primary/10 bg-gradient-to-br from-blue-100/40 via-white to-white shadow-inner">
                      ... (content removed for brevity) ...
                    </div>
                    */}
                  </motion.div>
                )}

                {/* ---- Security sub-tab ---- */}
                {mainTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                className="px-10 py-10 space-y-6 flex-1 overflow-auto"
              >
                <div className="mb-10">
                  <h2 className="text-[22px] font-bold text-primary mb-1">Đơn hàng của tôi</h2>
                  <p className="text-[13px] text-slate-400">Xem và quản lý các giao dịch mua sắm của bạn.</p>
                </div>

                <div className="space-y-8 pb-10">
                  {orders.map((order, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-none p-10 hover:shadow-lg transition-all group relative">
                      {/* Header sub-section */}
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-10 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-primary/5 rounded-none flex items-center justify-center text-primary">
                            <Box size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mã đơn hàng</p>
                            <p className="text-[16px] font-black text-slate-800 tracking-tight">{order.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-10">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ngày đặt</p>
                            <p className="text-[14px] font-bold text-slate-600">{order.date}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-none ${order.status === 'delivered' || order.status === 'ĐÃ GIAO' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                              }`}>
                              {orderStatusMap[order.status]?.label || order.status}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Items sub-section */}
                      <div className="space-y-8 mb-10">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-6">
                              <div className="w-20 h-24 bg-slate-50 flex shrink-0 rounded-none overflow-hidden border border-slate-100" />
                              <div>
                                <h4 className="text-[15px] font-black text-slate-800 mb-1.5 uppercase tracking-wide">{item.name}</h4>
                                <p className="text-[13px] text-slate-500 font-medium">Size: {item.size} • Số lượng: {item.qty}</p>
                              </div>
                            </div>
                            <p className="text-[15px] font-black text-slate-700">{formatPrice(item.price)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Footer sub-section */}
                      <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tổng giá trị</p>
                          <p className="text-[22px] font-black text-primary tracking-tighter">{formatPrice(order.total)}</p>
                        </div>
                        <button className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-none text-[11px] font-black text-slate-700 uppercase tracking-widest hover:border-primary hover:text-primary transition-all shadow-sm">
                          CHI TIẾT ĐƠN HÀNG
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ---- Address panel ---- */}
            {sideTab === 'address' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-10 py-10"
              >
                <div className="mb-10">
                  <h2 className="text-[22px] font-bold text-primary mb-1">Sổ địa chỉ</h2>
                  <p className="text-[13px] text-slate-400">Quản lý các địa chỉ nhận hàng của bạn.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 mb-10">
                  <div className="group relative bg-white border-2 border-primary/20 rounded-none p-8 shadow-xl shadow-primary/5">
                    <div className="absolute top-8 right-10">
                      <span className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="w-1.5 h-1.5 bg-primary" />
                        MẶC ĐỊNH
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mt-1">
                        <MapPin size={20} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[16px] font-black text-slate-800 mb-2">Địa chỉ mặc định</h4>
                        <p className="text-[14px] text-slate-600 font-medium leading-relaxed max-w-md">{form.address}</p>
                        <div className="flex items-center gap-6 mt-6">
                          <button className="text-[11px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity">Chỉnh sửa</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="flex items-center gap-3 px-8 py-4 bg-primary text-white text-[11px] font-black tracking-[0.2em] uppercase hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 group rounded-none">
                  + THÊM ĐỊA CHỈ MỚI
                </button>
              </motion.div>
            )}

            {/* ---- Wishlist panel ---- */}
            {sideTab === 'wishlist' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center px-10 py-20 text-center min-h-[400px]">
                <Heart size={44} strokeWidth={3} className="text-[#ff9daf] mb-6 drop-shadow-sm" />
                <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">Danh sách yêu thích</p>
                <p className="text-[14px] text-slate-500 mb-8">Chưa có sản phẩm nào trong danh sách yêu thích.</p>
                <button className="px-10 py-3.5 bg-primary text-white text-[11px] font-bold tracking-widest uppercase hover:bg-primary-700 transition-colors shadow-sm rounded-none">
                  KHÁM PHÁ SẢN PHẨM
                </button>
              </motion.div>
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
    <div className="w-full py-4 space-y-6">
      <div className="bg-white border border-slate-100 shadow-sm rounded-none p-6 md:p-10 relative overflow-hidden">
        {/* Decorative subtle background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-none blur-3xl -mr-32 -mt-32 pointer-events-none" />

        <div className="text-center mb-10 relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center mb-5 text-primary">
            <Lock size={22} strokeWidth={2.5} />
          </div>
          <h2 className="text-[20px] font-bold text-primary mb-2">Thiết Lập Bảo Mật</h2>
          <p className="text-[13px] text-slate-500">
            Vui lòng sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.
          </p>
        </div>

        <form onSubmit={handle} className="relative z-10 w-full max-w-4xl mx-auto">
          <div className="">
            {fields.map(({ id, label }) => (
              <div key={id} className="pt-16">
                <p className="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase ml-1 mb-0 opacity-80 leading-none">{label}</p>
                <div className="relative flex items-center group">
                  <input
                    required
                    type={showPwd[id] ? 'text' : 'password'}
                    value={vals[id]}
                    onChange={(e) => {
                      setVals(v => ({ ...v, [id]: e.target.value }));
                      setError('');
                    }}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50/30 pl-5 pr-12 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => ({ ...p, [id]: !p[id] }))}
                    className="absolute right-5 text-slate-300 hover:text-primary transition-colors"
                  >
                    {showPwd[id] ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 text-center">
              <p className="text-[13px] font-bold text-red-600">{error}</p>
            </div>
          )}
          {done && (
            <div className="bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-[13px] font-bold text-green-600">Mật khẩu đã được cập nhật thành công!</p>
            </div>
          )}

          <div className="pt-6 flex justify-center">
            <button
              type="submit"
              className="w-full max-w-[240px] h-10 flex items-center justify-center rounded-none bg-primary px-8 text-[11px] font-black tracking-[0.25em] uppercase text-white transition-all hover:bg-primary-700 shadow-xl shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
            >
              CẬP NHẬT MẬT KHẨU
            </button>
          </div>
        </form>
      </div>

      {/* Update history block */}
      <div className="bg-slate-50/50 border border-slate-100 rounded-none p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
            <Lock size={18} className="text-primary" />
          </div>
          <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-800 uppercase">
            Lịch sử cập nhật bảo mật
          </h3>
        </div>

        <div className="space-y-0">
          {[
            { title: 'Đăng nhập từ thiết bị mới', detail: 'Hà Nội, Việt Nam • Trình duyệt Chrome', date: '14/03/2026' },
            { title: 'Đổi mật khẩu thành công', detail: 'Đã được thực hiện trên hệ thống FSS', date: '01/01/2026' }
          ].map((log, idx) => (
            <div key={idx} className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0 hover:bg-white/50 px-2 -mx-2 transition-colors rounded-lg group">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                <div>
                  <p className="text-[14px] font-bold text-slate-700">{log.title}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">{log.detail}</p>
                </div>
              </div>
              <span className="text-[12px] font-semibold text-slate-400">{log.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
