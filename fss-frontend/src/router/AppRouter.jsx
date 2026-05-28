import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';

// Layouts
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AdminLayout from '../components/layout/AdminLayout';
import ScrollToTop from '../components/layout/ScrollToTop';
import TawkTo from '../components/ui/TawkTo';

// Auth
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Customer
import HomePage from '../pages/customer/HomePage';
import ProductListPage from '../pages/customer/ProductListPage';
import ProductDetailPage from '../pages/customer/ProductDetailPage';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import ProfilePage from '../pages/customer/ProfilePage';
import PaymentResultPage from '../pages/customer/PaymentResultPage';
import VisualSearchPage from '../pages/customer/VisualSearchPage';
import BlogPage from '../pages/customer/BlogPage';
import BlogDetailPage from '../pages/customer/BlogDetailPage';
import ContactPage from '../pages/customer/ContactPage';
import OrderSuccessPage from '../pages/customer/OrderSuccessPage';

// Admin
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminAccounts from '../pages/admin/AdminAccounts';
import AdminVouchers from '../pages/admin/AdminVouchers';

// Cart Drawer
import CartDrawer from '../components/ui/CartDrawer';
import ToastContainer from '../components/ui/ToastContainer';

// Protected routes
function CustomerRoute() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

// Customer layout with header/footer
function CustomerLayout() {
  useEffect(() => {
    // Thu nhỏ toàn bộ giao diện khách hàng về 95% bằng cách giảm base font-size
    // Tailwind sử dụng rem cho margin, padding, width, height, text-size nên mọi thứ sẽ thu nhỏ đều
    document.documentElement.style.fontSize = '95%';
    
    return () => {
      // Trả lại 100% (hoặc bỏ trống để dùng mặc định 16px) khi thoát khỏi giao diện KH (ví dụ sang trang Admin)
      document.documentElement.style.fontSize = '';
    };
  }, []);

  return (
    <>
      <Header />
      <CartDrawer />
      <ToastContainer />
      <main className="w-full min-w-0 pb-40">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

// TawkTo chat - ẩn trên trang admin
function TawkWrapper() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  
  React.useEffect(() => {
    if (isAdmin) {
      document.body.classList.add('hide-tawk');
    } else {
      document.body.classList.remove('hide-tawk');
    }
    return () => document.body.classList.remove('hide-tawk');
  }, [isAdmin]);

  return (
    <>
      <style>{`
        body.hide-tawk iframe[title*="chat"], 
        body.hide-tawk iframe[src*="tawk.to"], 
        body.hide-tawk .tawk-widget-wrapper {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>
      <TawkTo hide={isAdmin} />
    </>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Auth routes (no header/footer) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="accounts" element={<AdminAccounts />} />
            <Route path="vouchers" element={<AdminVouchers />} />
          </Route>
        </Route>

        {/* Customer routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/visual-search" element={<VisualSearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Protected customer routes */}
          <Route element={<CustomerRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:id" element={<OrderSuccessPage />} />
            <Route path="/payment-result" element={<PaymentResultPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<ProfilePage />} />
            <Route path="/address" element={<ProfilePage />} />
            <Route path="/wishlist" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TawkWrapper />
    </BrowserRouter>
  );
}
