import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, ChevronDown, Share } from 'lucide-react';
import { contactInfo } from '../../data/mockData';

const containerClass = 'layout-page';

const InstagramIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);

const FacebookIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [activeFaq, setActiveFaq] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const mapAddress = 'Trường Đại học Thủy Lợi, 175 Tây Sơn, Đống Đa, Hà Nội, Việt Nam';
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed`;
  const mapLink = `https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="page-enter bg-white min-h-screen pb-32">
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4" />

        <div className={containerClass}>
          <div className="relative z-10 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 block"
            >
              Liên hệ chúng tôi
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl lg:text-5xl font-bold font-display text-headline mb-6"
            >
              Liên hệ <span className="text-primary italic">ngay</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg leading-relaxed"
            >
              Bạn có câu hỏi, ý tưởng hay chỉ đơn giản muốn chia sẻ về phong cách thời trang? Đừng ngần ngại liên hệ với đội ngũ của FSS.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ===== CONTACT FORM & INFO ===== */}
      <section className="py-20 lg:py-32">
        <div className={containerClass}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10 lg:pt-20"
            >
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-6">Thông tin liên hệ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 rounded-sm border border-slate-100 bg-surface-secondary p-5 shadow-sm">
                    <div className="w-12 h-12 rounded-sm bg-accent-soft flex items-center justify-center text-primary shrink-0">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Địa chỉ</p>
                      <p className="text-slate-900 font-bold text-sm leading-snug">{contactInfo.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-sm border border-slate-100 bg-surface-secondary p-5 shadow-sm">
                    <div className="w-12 h-12 rounded-sm bg-accent-soft flex items-center justify-center text-primary shrink-0">
                      <Phone size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Hotline</p>
                      <p className="text-slate-900 font-bold text-sm leading-snug">{contactInfo.phone}</p>
                      <p className="text-muted-foreground text-xs mt-1">{contactInfo.workingHours}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-sm border border-slate-100 bg-surface-secondary p-5 shadow-sm sm:col-span-2">
                    <div className="w-12 h-12 rounded-sm bg-accent-soft flex items-center justify-center text-primary shrink-0">
                      <Mail size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Email</p>
                      <p className="text-slate-900 font-bold text-sm leading-snug">{contactInfo.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-10">Theo dõi chúng tôi</h3>
                <div className="flex items-center gap-4">
                  <a href="#" className="w-12 h-12 rounded-sm border border-slate-100 flex items-center justify-center text-muted-foreground hover:bg-primary hover:border-primary hover:text-white transition-all shadow-sm">
                    <FacebookIcon size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-sm border border-slate-100 flex items-center justify-center text-muted-foreground hover:bg-primary hover:border-primary hover:text-white transition-all shadow-sm">
                    <InstagramIcon size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-sm border border-slate-100 flex items-center justify-center text-muted-foreground hover:bg-primary hover:border-primary hover:text-white transition-all shadow-sm">
                    <Share size={20} />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Right: Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-sm p-8 lg:p-12 shadow-2xl border border-slate-50 ring-1 ring-black/5"
            >
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                    <Send size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-headline mb-2">Đã gửi tin nhắn!</h3>
                  <p className="text-muted-foreground mb-8">Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-sm hover:bg-secondary transition-all"
                  >
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-slate-600 ml-1 block">Họ và tên</label>
                      <input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-sm text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                        placeholder="Nhập họ và tên của bạn"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-slate-600 ml-1 block">Email</label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-sm text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                        placeholder="Nhập email của bạn"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-600 ml-1 block">Chủ đề</label>
                    <input
                      required
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-sm text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
                      placeholder="Nhập chủ đề của bạn"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-600 ml-1 block">Tin nhắn</label>
                    <textarea
                      required
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-sm text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none resize-none"
                      placeholder="Nhập nội dung tin nhắn của bạn"
                    />
                  </div>
                  <button
                    disabled={isSubmitting}
                    className="w-full py-5 bg-primary text-white font-black text-[13px] uppercase tracking-widest rounded-sm hover:bg-secondary transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Gửi tin nhắn <Send size={18} /></>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MAP SECTION ===== */}
      <section className="py-6 lg:py-10">
        <div className={containerClass}>
          <div className="rounded-sm border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
            <h3 className="text-xl font-bold font-display text-foreground mb-4 uppercase tracking-wider text-sm">XEM BẢN ĐỒ</h3>
            <div className="relative w-full overflow-hidden rounded-sm border border-slate-100">
              <iframe
                title="Google Map - Trường Đại học Thủy Lợi"
                src={mapSrc}
                className="w-full h-[360px] sm:h-[420px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-4 flex items-center justify-end">
              <a
                href={mapLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-surface-secondary text-primary font-bold rounded-sm border border-border hover:bg-accent-soft transition-colors"
              >
                Mở trong Google Maps <ChevronDown className="rotate-[-90deg]" size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="pt-12 pb-20 lg:pt-16 lg:pb-28" style={{ background: 'linear-gradient(180deg, #f0f4ff 0%, #f8faff 100%)' }}>
        <div className={containerClass}>
          <div className="flex flex-col items-center">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold font-display text-slate-800 mb-3">Câu hỏi thường gặp</h2>
              <p className="text-primary font-medium text-sm">Giải đáp nhanh các thắc mắc phổ biến của bạn.</p>
            </div>
            <div className="max-w-3xl w-full">
              {contactInfo.faq.map((item, index) => (
                <div
                  key={index}
                  className={`transition-all duration-200 ${index !== contactInfo.faq.length - 1 ? 'border-b border-slate-200/60' : ''}`}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full px-2 py-5 flex items-center justify-between text-left hover:opacity-70 transition-all"
                  >
                    <span className={`font-semibold text-[15px] pr-4 transition-colors ${activeFaq === index ? 'text-primary' : 'text-slate-800'}`}>{item.q}</span>
                    <div
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-sm transition-all duration-300"
                      style={{
                        background: activeFaq === index ? 'rgba(0,22,141,0.08)' : '#f1f5f9',
                        color: activeFaq === index ? '#00168d' : '#94a3b8',
                        transform: activeFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <ChevronDown size={16} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {activeFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-0 text-slate-600 text-[14px] leading-relaxed">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
