import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';

const InstagramIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);
const FacebookIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
const YoutubeIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
);

const footerLinks = {
  'Sản phẩm': [
    { label: 'Áo thun', path: '/products?category=ao-thun' },
    { label: 'Áo sơ mi', path: '/products?category=ao-so-mi' },
    { label: 'Quần jean', path: '/products?category=quan-jean' },
    { label: 'Váy & Đầm', path: '/products?category=vay' },
    { label: 'Áo khoác', path: '/products?category=ao-khoac' },
  ],
  'Hỗ trợ': [
    { label: 'Hướng dẫn mua hàng', path: '/help/guide' },
    { label: 'Chính sách đổi trả', path: '/help/return-policy' },
    { label: 'Tra cứu đơn hàng', path: '/orders' },
    { label: 'FAQs', path: '/help/faq' },
  ],
  'Về FSS': [
    { label: 'Giới thiệu', path: '/about' },
    { label: 'Blog thời trang', path: '/blog' },
    { label: 'Liên hệ', path: '/contact' },
    { label: 'Tuyển dụng', path: '/careers' },
  ],
};

const socials = [
  { icon: InstagramIcon, href: '#', label: 'Instagram', color: 'hover:text-pink-400' },
  { icon: FacebookIcon, href: '#', label: 'Facebook', color: 'hover:text-blue-400' },
  { icon: YoutubeIcon, href: '#', label: 'Youtube', color: 'hover:text-red-400' },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#12228d] to-[#1e3b87] text-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="layout-page pt-16 pb-12 lg:pt-20 lg:pb-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-4 mb-6 group">
              <div className="w-16 h-16 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <img src="/logo.png" alt="FSS" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-xs text-white/70 tracking-widest font-bold uppercase">Fashion Shopping</p>
                <p className="text-3xl font-semibold tracking-tight leading-none">Sense</p>
              </div>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm mb-6 mt-3">
              Nền tảng mua sắm thời trang thông minh — kết hợp AI tìm kiếm sản phẩm tương đồng để mang đến trải nghiệm mua sắm tốt nhất.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors">
                <Phone size={16} className="text-white/40 shrink-0" />
                <span className="font-medium">0858317285</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors">
                <Mail size={16} className="text-white/40 shrink-0" />
                <span className="font-medium">ndat45489@gmail.com</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-white/70 hover:text-white transition-colors">
                <MapPin size={16} className="text-white/40 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed max-w-xs">Đại học thủy lợi, Tây Sơn, Hà Nội</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="lg:pl-4 lg:pt-8">
              <h4 className="font-semibold text-xs tracking-widest uppercase text-white/80 mb-6">{section}</h4>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-white/60 hover:text-white hover:pl-1 transition-all font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="layout-page pt-10 pb-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <p className="text-white/50 text-xs tracking-widest uppercase font-semibold">
            © 2026 FASHION SHOPPING SENSE. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-5">
            {socials.map(({ icon: Icon, href, label, color }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className={`text-white/40 ${color} transition-all hover:scale-110 hover:text-white`}
                title={label}
              >
                <Icon size={20} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
