import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';

// Layouts
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AdminLayout from '../components/layout/AdminLayout';
import ScrollToTop from '../components/layout/ScrollToTop';

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
    </BrowserRouter>
  );
}
