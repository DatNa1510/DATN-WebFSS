import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';

/**
 * Tawk.to Live Chat Widget - Miễn phí mãi mãi
 *
 * Cách lấy Property ID và Widget ID:
 * 1. Đăng nhập https://dashboard.tawk.to
 * 2. Vào Administration → Property Settings
 * 3. Kéo xuống phần "JavaScript API" hoặc copy từ embed code
 *    Embed code trông như sau:
 *    var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
 *    (function(){...s1.src='https://embed.tawk.to/PROPERTY_ID/WIDGET_ID'...})();
 */

// ← Thay 2 giá trị này sau khi đăng ký Tawk.to
const TAWK_PROPERTY_ID = '6a082e619a5e021c33f4b56f';
const TAWK_WIDGET_ID   = '1jonvach7';

export default function TawkTo() {
  const { user } = useAuthStore();

  useEffect(() => {
    // Tránh inject script 2 lần
    if (document.getElementById('tawkto-script')) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.id = 'tawkto-script';
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById('tawkto-script');
      if (el) el.remove();
    };
  }, []);

  // Tự động gắn thông tin user đã đăng nhập vào cửa sổ chat
  useEffect(() => {
    const setVisitor = () => {
      if (!window.Tawk_API?.setAttributes) return;
      if (user) {
        window.Tawk_API.setAttributes({
          name:  user.fullName || user.email,
          email: user.email,
          ...(user.phone ? { phone: user.phone } : {}),
        }, (err) => { if (err) console.warn('Tawk setAttributes:', err); });
      }
    };

    // Nếu widget đã load thì gọi ngay, nếu chưa thì đợi sự kiện onLoad
    if (window.Tawk_API?.setAttributes) {
      setVisitor();
    } else {
      window.Tawk_API = window.Tawk_API || {};
      const prev = window.Tawk_API.onLoad;
      window.Tawk_API.onLoad = function () {
        if (prev) prev();
        setVisitor();
      };
    }
  }, [user]);

  return null;
}
