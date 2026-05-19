import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, CreditCard, Banknote, Smartphone, MapPin, User, Phone, Mail, Package, AlertCircle, Loader2, Truck, ShieldCheck, ChevronRight, Lock, ArrowLeft, Zap, RotateCcw, Tag, TicketPercent, Clock } from 'lucide-react';
import VoucherModal from '../../components/ui/VoucherModal';
import PaymentModal from '../../components/ui/PaymentModal';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useOrderStore from '../../store/orderStore';
import useAddressStore from '../../store/addressStore';
import { formatPrice } from '../../data/mockData';
import { toast } from '../../store/toastStore';
import AddressModal from '../../components/ui/AddressModal';

const PAYS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', sub: 'Thanh toán bằng tiền mặt khi nhận hàng', icon: Banknote, clr: '#10b981' },
  { id: 'vietqr', label: 'Chuyển khoản (VietQR)', sub: 'Quét mã QR qua PayOS', icon: CreditCard, clr: '#3b82f6' },
  { id: 'momo', label: 'Ví MoMo', sub: 'Thanh toán nhanh qua ứng dụng MoMo', icon: Smartphone, clr: '#ec4899' },
];
const SHIPS = [
  { id: 'fast', label: 'Giao hàng nhanh (trong 24h)', sub: 'Được khuyên dùng, giao hàng nhanh', price: 35000, icon: Truck },
  { id: 'express', label: 'Giao hàng hỏa tốc (1-2 giờ)', sub: 'Giao ngay trong nội thành', price: 65000, icon: Zap },
  { id: 'standard', label: 'Giao hàng tiêu chuẩn (2-4 ngày)', sub: 'Lựa chọn tiết kiệm', price: 15000, icon: Package },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, selectedKeys, fetchCart } = useCartStore();
  const sel = items ? items.filter(i => selectedKeys?.includes(i.key)) : [];
  const { user } = useAuthStore();
  const { placeOrder, isLoading } = useOrderStore();
  const { addresses, fetchAddresses, isLoading: addressLoading } = useAddressStore();
  
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [pay, setPay] = useState('cod');
  const [ship, setShip] = useState('fast');
  const [done, setDone] = useState(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const pendingOrderRef = useRef(null); // lưu order khi chờ QR payment

  useEffect(() => { 
    if (user) {
      fetchAddresses().then(() => {
        const addrList = useAddressStore.getState().addresses;
        if (addrList?.length > 0) {
          const def = addrList.find(a => a.isDefault) || addrList[0];
          setSelectedAddress(def);
        }
      });
    }
  }, [user, fetchAddresses]);
  
  // Auto update selectedAddress if addresses list changes and nothing is selected
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddress(def);
    }
  }, [addresses, selectedAddress]);

  const isOrdering = useRef(false);
  useEffect(() => { if (!done && sel.length === 0 && !isOrdering.current && !isPaymentModalOpen) navigate('/cart', { replace: true }); }, [sel.length, navigate, done, isPaymentModalOpen]);

  const sub = sel?.reduce((s, i) => s + i.price * i.qty, 0) || 0;
  
  // Calculate discount from selectedVoucher
  let disc = 0;
  if (selectedVoucher) {
    if (selectedVoucher.type === 'fixed') disc = selectedVoucher.value;
    if (selectedVoucher.type === 'percent') disc = Math.min(sub * selectedVoucher.value, selectedVoucher.maxDiscount);
  }

  const ships = SHIPS.map(m => ({ ...m, final: m.price }));
  const activeS = ships.find(m => m.id === ship) || ships[0];
  const total = Math.max(5000, sub + activeS.final - disc);
  const valid = !!selectedAddress;

  const handleOrder = async () => {
    isOrdering.current = true;
    if (!valid) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      isOrdering.current = false;
      return;
    }
    setPaymentLoading(true);
    const r = await placeOrder({ recipientName: selectedAddress.recipientName, recipientPhone: selectedAddress.phone, address: selectedAddress.address, district: selectedAddress.district, city: selectedAddress.city, note: '', paymentMethod: pay, shippingMethod: ship, selectedItemIds: sel?.map(i => parseInt(i.key, 10)) || [], voucherCode: selectedVoucher?.code || null });
    
    if (r.success) {
      await fetchCart();
      
      if (pay === 'momo' || pay === 'vietqr') {
        try {
          const res = await fetch(`http://localhost:8080/api/payment/create/${r.order.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${useAuthStore.getState().token}`
            }
          });
          const data = await res.json();
          if (res.ok) {
            if (pay === 'momo') {
              toast.success('Đang chuyển hướng MoMo...');
              window.location.href = data.paymentUrl;
            } else if (pay === 'vietqr') {
              // VietQR: chỉ hiện QR modal, CHƯA hiện done screen
              // Done screen chỉ hiện sau khi thanh toán thành công
              toast.info('Vui lòng hoàn tất thanh toán qua QR để xác nhận đơn hàng.');
              pendingOrderRef.current = r.order;
              setPaymentData(data);
              setIsPaymentModalOpen(true);
              // Không setDone ở đây!
            }
          } else {
            toast.error(data.error || 'Lỗi tạo thanh toán!');
            // Nếu tạo QR thất bại vẫn cho xem đơn
            setDone(r.order);
          }
        } catch (error) {
          toast.error('Lỗi kết nối server thanh toán!');
          setDone(r.order);
        }
      } else {
        // COD
        toast.success('Đặt hàng thành công!');
        setDone(r.order);
      }
    } else {
      toast.error(r.error || 'Đặt hàng thất bại!');
    }
    isOrdering.current = false;
    setPaymentLoading(false);
  };

  const fieldCls = 'w-full px-3 py-2.5 border-2 border-slate-200 text-[14px] text-gray-800 focus:outline-none focus:border-blue-700 transition-all placeholder:text-gray-400 bg-white rounded-none';
  const fieldErrCls = 'w-full px-3 py-2.5 border-2 border-red-500 text-[14px] text-gray-800 focus:outline-none transition-all placeholder:text-gray-400 bg-white rounded-none';

  return (
    <div className="min-h-screen bg-white">
      {done ? (
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: .4 }}
            className="w-full max-w-lg mx-4 p-10 text-center">
            {(pay === 'vietqr' || pay === 'momo') && !isPaid ? (
              <>
                <motion.div 
                  initial={{ scale: 0, opacity: 0, rotate: -45 }} 
                  animate={{ scale: 1, opacity: 1, rotate: 0 }} 
                  transition={{ delay: 0.2, type: 'spring', bounce: 0.6, duration: 0.6 }}
                  className="w-20 h-20 inline-flex items-center justify-center mb-6"
                >
                  <Clock size={72} className="text-amber-500 drop-shadow-sm" />
                </motion.div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Đơn hàng đang chờ thanh toán!</h2>
                <p className="text-gray-500 text-base mb-8">Vui lòng hoàn tất thanh toán để FSS xử lý đơn hàng</p>
              </>
            ) : (
              <>
                <motion.div 
                  initial={{ scale: 0, opacity: 0, rotate: -45 }} 
                  animate={{ scale: 1, opacity: 1, rotate: 0 }} 
                  transition={{ delay: 0.2, type: 'spring', bounce: 0.6, duration: 0.6 }}
                  className="w-20 h-20 inline-flex items-center justify-center mb-6"
                >
                  <CheckCircle2 size={72} className="text-green-500 drop-shadow-sm" />
                </motion.div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Đặt hàng thành công!</h2>
                <p className="text-gray-500 text-base mb-8">Cảm ơn bạn đã mua sắm tại FSS</p>
              </>
            )}
            <div className="bg-gray-50 border border-gray-100 p-5 text-left mb-8 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mã đơn hàng</span>
                <span className="font-mono font-bold text-gray-900">{done.orderCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tổng tiền</span>
                <span className="text-lg font-black text-blue-700 tabular-nums">{formatPrice(done.totalAmount || total)}</span>
              </div>
              {pay === 'vietqr' && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thanh toán</span>
                  {isPaid
                    ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Đã xác nhận</span>
                    : <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"/> Chờ thanh toán</span>
                  }
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {pay === 'vietqr' && paymentData?.qrCode && !isPaid && (
                <button onClick={() => setIsPaymentModalOpen(true)} className="w-full py-4 bg-[#00168D] text-white font-bold text-[14px] hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 mb-2">
                  {isPaymentModalOpen ? 'Đang mở QR...' : 'XEM MÃ QR THANH TOÁN'}
                </button>
              )}
              <Link to="/profile" state={{ tab: 'orders' }} className="w-full py-4 bg-[#00168D] text-white font-bold text-[14px] hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
                XEM ĐƠN HÀNG CỦA TÔI <ChevronRight size={18} />
              </Link>
              <button onClick={() => navigate('/')} className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold text-[14px] hover:bg-gray-50 hover:border-gray-300 transition-colors">
                VỀ TRANG CHỦ
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="layout-page py-8 pb-20">
          {/* Header Breadcrumb */}
          <div className="flex items-center gap-2 mb-10 text-[13px] text-gray-400">
            <Link to="/cart" className="hover:text-blue-700 transition-colors">Giỏ hàng</Link>
            <ChevronRight size={12} />
            <span className="text-gray-800 font-bold">Thanh toán</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* ════ LEFT SECTION ════ */}
            <div className="lg:col-span-7 space-y-12">
              {/* 1. Shipping Information */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-6 rounded-full bg-[#00168D] text-white text-[11px] font-black flex items-center justify-center shrink-0">1</div>
                  <h2 className="text-[16px] font-black text-gray-800 tracking-tight">Thông tin giao hàng</h2>
                </div>
                <div className="space-y-4">
                  {addressLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-600" /></div>
                  ) : addresses.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-[2px] text-center bg-slate-50/50 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-blue-50 flex items-center justify-center mb-4" style={{ borderRadius: '2px' }}>
                        <MapPin size={24} className="text-[#00168D]" />
                      </div>
                      <p className="text-slate-500 text-[14px] font-medium mb-6">Bạn chưa có địa chỉ giao hàng nào.</p>
                      <button 
                        onClick={() => setIsAddressModalOpen(true)} 
                        className="px-8 py-3 bg-[#00168D] text-white text-[13px] font-black tracking-widest hover:bg-blue-800 transition-all"
                        style={{ borderRadius: '2px' }}
                      >
                        THÊM ĐỊA CHỈ MỚI
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3">
                        {addresses.map(addr => (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddress(addr)}
                            className={`p-4 border-2 cursor-pointer transition-all ${selectedAddress?.id === addr.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedAddress?.id === addr.id ? 'border-blue-600' : 'border-slate-300'}`}>
                                {selectedAddress?.id === addr.id && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-[13px] font-bold text-gray-800 mb-1">{addr.recipientName} - {addr.phone}</p>
                                <p className="text-[12px] text-gray-600 leading-relaxed">{addr.address}, {addr.district}, {addr.city}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setIsAddressModalOpen(true)} className="text-[12px] font-bold text-blue-600 mt-2 hover:underline">
                        + Thêm địa chỉ khác
                      </button>
                    </>
                  )}
                </div>
              </section>

              <div className="border-b border-gray-100" />

              {/* 2. Shipping Method */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-6 rounded-full bg-[#00168D] text-white text-[11px] font-black flex items-center justify-center shrink-0">2</div>
                  <h2 className="text-[16px] font-black text-gray-800 tracking-tight">Phương thức vận chuyển</h2>
                </div>
                <div className="space-y-3">
                  {ships.map(m => {
                    const act = ship === m.id; return (
                      <label key={m.id} className={`flex items-center justify-between p-4 cursor-pointer border-2 transition-all ${act ? 'border-blue-700 bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${act ? 'border-blue-700' : 'border-gray-300'}`}>
                            {act && <div className="w-2 h-2 rounded-full bg-blue-700" />}
                          </div>
                          <input type="radio" name="ship" checked={act} onChange={() => setShip(m.id)} className="hidden" />
                          <div>
                            <p className={`text-[14px] font-bold ${act ? 'text-blue-700' : 'text-gray-700'}`}>{m.label}</p>
                            <p className="text-[12px] text-gray-400 mt-0.5">{m.sub}</p>
                          </div>
                        </div>
                        <p className={`text-[14px] font-bold tabular-nums ${m.final === 0 ? 'text-green-600' : 'text-gray-800'}`}>{m.final === 0 ? 'Miễn phí' : formatPrice(m.final)}</p>
                      </label>
                    );
                  })}
                </div>
              </section>

              <div className="border-b border-gray-100" />

              {/* 3. Payment Method */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-6 rounded-full bg-[#00168D] text-white text-[11px] font-black flex items-center justify-center shrink-0">3</div>
                  <h2 className="text-[16px] font-black text-gray-800 tracking-tight">Phương thức thanh toán</h2>
                </div>
                <div className="space-y-3">
                  {PAYS.map(m => {
                    const Icon = m.icon; const act = pay === m.id; return (
                      <label key={m.id} className={`flex items-center gap-4 p-4 cursor-pointer border-2 transition-all ${act ? 'border-blue-700 bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${act ? 'border-blue-700' : 'border-gray-300'}`}>
                          {act && <div className="w-2 h-2 rounded-full bg-blue-700" />}
                        </div>
                        <input type="radio" name="pay" checked={act} onChange={() => setPay(m.id)} className="hidden" />
                        <div className="flex items-center gap-3">
                          <Icon size={20} className={act ? 'text-blue-700' : 'text-gray-400'} />
                          <div>
                            <p className={`text-[14px] font-bold ${act ? 'text-blue-700' : 'text-gray-700'}`}>{m.label}</p>
                            <p className="text-[12px] text-gray-400 mt-0.5">{m.sub}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* ════ RIGHT SIDEBAR ════ */}
            <div className="lg:col-span-5">
              <div className="sticky top-6">
                <div className="py-4 border-b border-gray-200">
                  <h3 className="text-[18px] font-bold text-gray-900 tracking-tight">Tóm tắt đơn hàng</h3>
                </div>
                <div className="py-5 space-y-5 max-h-[400px] overflow-y-auto pr-2">
                  {sel.map(item => (
                    <div key={item.key} className="flex gap-4">
                      <div className="w-20 h-24 border border-gray-200 shrink-0 p-1">
                        <img src={item.product?.images?.[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="text-[15px] font-bold text-gray-900 leading-snug">{item.product?.name}</p>
                          <p className="text-[15px] font-bold text-gray-900 tabular-nums shrink-0">{formatPrice(item.price * item.qty)}</p>
                        </div>
                        <p className="text-[14px] text-gray-500">Màu: Trắng · Size: {item.size}</p>
                        <p className="text-[14px] text-gray-500 mt-0.5">Số lượng: {item.qty}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200" />
                <div className="py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TicketPercent size={16} className="text-[#00168D]" />
                      <span className="text-[15px] font-bold text-gray-900">Mã giảm giá</span>
                    </div>
                  </div>
                  {selectedVoucher ? (
                    <div className="flex items-center justify-between border border-blue-200 bg-blue-50/50 p-3">
                      <div>
                        <p className="text-[14px] font-bold text-blue-700">{selectedVoucher.code}</p>
                        <p className="text-[12px] text-blue-600/80 mt-0.5">{selectedVoucher.title}</p>
                      </div>
                      <button onClick={() => setIsVoucherModalOpen(true)} className="text-[13px] font-bold text-blue-700 hover:text-blue-800">Thay đổi</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsVoucherModalOpen(true)} className="w-full flex items-center justify-between border border-gray-200 p-3 hover:border-blue-600 transition-all group">
                      <span className="text-[14px] text-gray-500 group-hover:text-blue-600">Chọn hoặc nhập mã</span>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600" />
                    </button>
                  )}
                </div>
                <div className="border-t border-gray-200" />
                <div className="py-5 space-y-3">
                  <div className="flex justify-between text-[15px] font-medium text-gray-600"><span>Tạm tính</span><span className="text-gray-900">{formatPrice(sub)}</span></div>
                  <div className="flex justify-between text-[15px] font-medium text-gray-600"><span>Vận chuyển</span><span className="text-gray-900">{formatPrice(activeS.final)}</span></div>
                  <div className="flex justify-between text-[15px] font-medium text-gray-600"><span>Giảm giá</span><span className="text-gray-900">{disc > 0 ? `-${formatPrice(disc)}` : '0 ₫'}</span></div>
                </div>
                <div className="border-t border-gray-200" />
                <div className="py-5 flex justify-between items-center">
                  <span className="text-[18px] font-bold text-gray-900">Tổng cộng</span>
                  <span className="text-[20px] font-bold text-blue-600 tabular-nums">{formatPrice(total)}</span>
                </div>
                <div className="pt-2">
                  <button onClick={handleOrder} disabled={paymentLoading || isLoading || !valid}
                    className={`w-full py-4 font-bold text-[15px] flex items-center justify-center gap-2 transition-all ${valid ? 'bg-[#00168D] text-white hover:bg-blue-800' : 'bg-gray-100 text-gray-400/80 cursor-not-allowed'}`}>
                    {(paymentLoading || isLoading) ? <Loader2 size={18} className="animate-spin" /> : <>ĐẶT HÀNG NGAY <ChevronRight size={18} /></>}
                  </button>
                  <AnimatePresence>
                    {!valid && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 text-red-500 text-[13px] font-bold mt-4">
                        <AlertCircle size={15} /> Vui lòng điền đủ thông tin bắt buộc
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center justify-center gap-6 text-[12px] text-gray-400 font-bold uppercase tracking-wider mt-5">
                    <div className="flex items-center gap-1.5"><Lock size={14} /> BẢO MẬT</div>
                    <div className="flex items-center gap-1.5"><ShieldCheck size={14} /> SSL</div>
                    <div className="flex items-center gap-1.5"><RotateCcw size={14} /> HOÀN HÀNG</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Voucher Modal */}
      <VoucherModal 
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        currentSubtotal={sub}
        selectedVoucher={selectedVoucher}
        onSelect={(voucher) => setSelectedVoucher(voucher)}
      />

      {/* Payment Modal */}
      {isPaymentModalOpen && paymentData?.qrCode && (
        <PaymentModal
          paymentData={paymentData}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentConfirmed={() => {
            setIsPaymentModalOpen(false);
            setIsPaid(true);
            setDone(pendingOrderRef.current); // ← hiện done screen sau khi confirmed
          }}
          amount={pendingOrderRef.current?.totalAmount || total}
          orderCode={paymentData?.transferContent || `FSS-${pendingOrderRef.current?.id}`}
          orderId={pendingOrderRef.current?.id}
        />
      )}

      {/* Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />
    </div>
  );
}
