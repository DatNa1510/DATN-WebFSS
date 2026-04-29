import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, User, Phone, Building2, Map, Navigation, Star } from 'lucide-react';
import useAddressStore from '../../store/addressStore';
import { toast } from '../../store/toastStore';

const CITIES = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Hải Phòng', 'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Ninh', 'Huế'];

function FloatingInput({ label, icon: Icon, value, onChange, placeholder, type = 'text', required }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;
  const isActive = focused || hasValue;

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden transition-all duration-300"
        style={{
          border: focused ? '2px solid #00168D' : '2px solid rgba(226,232,240,0.8)',
          borderRadius: '2px',
          background: focused ? 'rgba(255,255,255,1)' : 'rgba(248,250,252,0.8)',
          boxShadow: focused ? '0 0 0 4px rgba(0,22,141,0.06)' : 'none',
        }}
      >
        {/* Active top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-300"
          style={{ background: focused ? 'linear-gradient(90deg, #00168d, #7c3aed)' : 'transparent' }}
        />

        {/* Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200">
          <Icon size={15} style={{ color: focused ? '#00168D' : '#94a3b8' }} />
        </div>

        {/* Floating Label */}
        <label
          className="absolute left-10 pointer-events-none font-semibold transition-all duration-200"
          style={{
            top: isActive ? '8px' : '50%',
            transform: isActive ? 'translateY(0)' : 'translateY(-50%)',
            fontSize: isActive ? '10px' : '14px',
            color: focused ? '#00168D' : isActive ? '#64748b' : '#94a3b8',
            letterSpacing: isActive ? '0.1em' : '0',
            textTransform: isActive ? 'uppercase' : 'none',
          }}
        >
          {label}{required && ' *'}
        </label>

        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=""
          className="w-full bg-transparent pr-4 text-[14px] text-slate-800 outline-none"
          style={{ paddingLeft: '40px', paddingTop: '24px', paddingBottom: '10px', fontWeight: 500 }}
        />
      </div>
    </div>
  );
}

function FloatingSelect({ label, icon: Icon, value, onChange, options, required }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden transition-all duration-300"
        style={{
          border: focused ? '2px solid #00168D' : '2px solid rgba(226,232,240,0.8)',
          borderRadius: '2px',
          background: focused ? 'rgba(255,255,255,1)' : 'rgba(248,250,252,0.8)',
          boxShadow: focused ? '0 0 0 4px rgba(0,22,141,0.06)' : 'none',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-300"
          style={{ background: focused ? 'linear-gradient(90deg, #00168d, #7c3aed)' : 'transparent' }}
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon size={15} style={{ color: focused ? '#00168D' : '#94a3b8' }} />
        </div>
        <label
          className="absolute left-10 pointer-events-none font-semibold uppercase tracking-widest transition-all duration-200"
          style={{ top: '8px', fontSize: '10px', color: focused ? '#00168D' : '#64748b' }}
        >
          {label}{required && ' *'}
        </label>
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent pr-8 text-[14px] text-slate-800 outline-none appearance-none cursor-pointer"
          style={{ paddingLeft: '40px', paddingTop: '24px', paddingBottom: '10px', fontWeight: 500 }}
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke={focused ? '#00168D' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function AddressModal({ isOpen, onClose, addressToEdit }) {
  const { addAddress, updateAddress } = useAddressStore();
  const [form, setForm] = useState({
    recipientName: '', phone: '', address: '', district: '', city: 'Hồ Chí Minh', isDefault: false
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!addressToEdit;

  useEffect(() => {
    if (isOpen) {
      setForm(addressToEdit ?? { recipientName: '', phone: '', address: '', district: '', city: 'Hồ Chí Minh', isDefault: false });
    }
  }, [isOpen, addressToEdit]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipientName || !form.phone || !form.address || !form.district) {
      toast.error('Vui lòng điền đủ thông tin bắt buộc');
      return;
    }
    setLoading(true);
    const res = isEdit ? await updateAddress(addressToEdit.id, form) : await addAddress(form);
    setLoading(false);
    if (res.success) {
      toast.success(isEdit ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công');
      onClose();
    } else {
      toast.error(res.error || 'Có lỗi xảy ra');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="w-full max-w-md overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(145deg, #ffffff, #f8faff)',
              borderRadius: '2px',
              boxShadow: '0 32px 80px rgba(0,22,141,0.18), 0 8px 24px rgba(0,0,0,0.12)',
              border: '1px solid rgba(226,232,240,0.6)',
            }}
          >
            {/* Header */}
            <div className="relative px-6 py-5 overflow-hidden" style={{ borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
              {/* Background accent */}
              <div className="absolute inset-0 opacity-5" style={{ background: 'linear-gradient(135deg, #00168D, #7c3aed)' }} />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10" style={{ background: '#00168D' }} />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #00168D, #7c3aed)',
                    borderRadius: '2px',
                    boxShadow: '0 4px 12px rgba(0,22,141,0.3)',
                  }}>
                    <MapPin size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-black text-slate-800 tracking-tight">
                      {isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {isEdit ? 'Cập nhật thông tin giao hàng' : 'Điền thông tin người nhận hàng'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center transition-all hover:bg-slate-100"
                  style={{ borderRadius: '2px' }}
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Row: Name + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <FloatingInput
                  label="Tên người nhận"
                  icon={User}
                  value={form.recipientName}
                  onChange={set('recipientName')}
                  required
                />
                <FloatingInput
                  label="Số điện thoại"
                  icon={Phone}
                  value={form.phone}
                  onChange={set('phone')}
                  type="tel"
                  required
                />
              </div>

              {/* City */}
              <FloatingSelect
                label="Tỉnh / Thành phố"
                icon={Building2}
                value={form.city}
                onChange={set('city')}
                options={CITIES}
                required
              />

              {/* District */}
              <FloatingInput
                label="Quận / Huyện"
                icon={Map}
                value={form.district}
                onChange={set('district')}
                required
              />

              {/* Address */}
              <FloatingInput
                label="Địa chỉ cụ thể"
                icon={Navigation}
                value={form.address}
                onChange={set('address')}
                required
              />

              {/* Default toggle */}
              <label className="flex items-center gap-3 cursor-pointer group py-1">
                <div
                  onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
                  className="relative w-10 h-5 flex-shrink-0 transition-all duration-300"
                  style={{
                    borderRadius: '2px',
                    background: form.isDefault ? 'linear-gradient(135deg, #00168D, #7c3aed)' : 'rgba(226,232,240,1)',
                    boxShadow: form.isDefault ? '0 2px 8px rgba(0,22,141,0.3)' : 'none',
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 bg-white shadow-sm transition-all duration-300"
                    style={{ left: form.isDefault ? 'calc(100% - 18px)' : '2px', borderRadius: '1px' }}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Star size={12} style={{ color: form.isDefault ? '#f59e0b' : '#cbd5e1', fill: form.isDefault ? '#f59e0b' : 'none' }} />
                  <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                    Đặt làm địa chỉ mặc định
                  </span>
                </div>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-white font-black text-[13px] tracking-[0.15em] uppercase transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
                style={{
                  borderRadius: '2px',
                  background: 'linear-gradient(135deg, #00168D, #7c3aed)',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(0,22,141,0.25)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <MapPin size={15} />
                    {isEdit ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
