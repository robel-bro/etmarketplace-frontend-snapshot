import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from 'react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { QuickViewProvider } from './contexts/QuickViewContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { SavedItemsProvider } from './contexts/SavedItemsContext';
import { ComparisonProvider } from './contexts/ComparisonContext';
import { MaintenanceProvider, useMaintenance } from './contexts/MaintenanceContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import BulkOrderPage from './pages/BulkOrderPage';
import MessagesPage from './pages/MessagesPage';
import CompanyDashboardPage from './pages/CompanyDashboardPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import SellerLayout from './components/seller/SellerLayout';
import DashboardHome from './pages/seller/DashboardHome';
import MembershipPage from './pages/seller/MembershipPage';
import SellerProductsPage from './pages/seller/ProductsPage';
import SellerOrdersPage from './pages/seller/OrdersPage';
import PayoutsPage from './pages/seller/PayoutsPage';
import SettingsPage from './pages/seller/SettingsPage';
import SellerPackagesPage from './pages/seller/PackagesPage';
import SellerPromotionsPage from './pages/seller/SellerPromotionsPage';
import StorePoliciesPage from './pages/seller/StorePoliciesPage';
import AnalyticsPage from './pages/seller/AnalyticsPage';
import SellerSetupPage from './pages/SellerSetupPage';
import PrivateRoute from './components/auth/PrivateRoute';

// Admin imports
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/DashboardHome';
import AdminUsers from './pages/admin/UsersPage';
import AdminSellers from './pages/admin/SellersPage';
import AdminProducts from './pages/admin/ProductsPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import AdminCategories from './pages/admin/CategoriesPage';
import AdminAnnouncements from './pages/admin/AnnouncementsPage';
import PromoCodesPage from './pages/admin/PromoCodesPage';
import AdminSettingsPage from './pages/admin/SettingsPage';
import ReportsPage from './pages/admin/ReportsPage';
import DisputesPage from './pages/admin/DisputesPage';
import LogisticsPartnersPage from './pages/admin/LogisticsPartnersPage';
import PaymentGatewaysPage from './pages/admin/PaymentGatewaysPage';
import PartnerPayoutsPage from './pages/admin/PartnerPayoutsPage';
import FinancialLedgerPage from './pages/admin/FinancialLedgerPage';
import CollectionsPage from './pages/admin/collections/IndexPage';
import AdminMembershipPlans from './pages/admin/MembershipPlansPage';
import ManualDispatchPage from './pages/admin/ManualDispatchPage';
import AdminSellerPayoutsPage from './pages/admin/SellerPayoutsPage';
import ReturnPoliciesPage from './pages/admin/ReturnPoliciesPage';
import LegalPagesPage from './pages/admin/LegalPagesPage';
// ★ NEW import – Admin Packages management
import AdminPackagesPage from './pages/admin/PackagesPage';

// ★ NEW import – Partner real‑time delivery board
import PartnerBoardPage from './pages/partner/BoardPage';

// ★ NEW import – Dedicated COD Collection page
import CodCollectionPage from './pages/admin/CodCollectionPage';

// ★ NEW import – Sub-Admins management
import SubAdminsPage from './pages/admin/SubAdminsPage';

// Dynamic legal page viewer
import LegalPageViewer from './pages/LegalPageViewer';

import WishlistPage from './pages/WishlistPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import BuyerOrdersPage from './pages/OrdersPage';
import InvoicePage from './pages/InvoicePage';

import FindShopPage from './pages/FindShopPage';
import SupplierDirectoryPage from './pages/company/SupplierDirectoryPage';

import FindSupplierPage from './pages/FindSupplierPage';
import TradeAssurancePage from './pages/TradeAssurancePage';
import SellPage from './pages/SellPage';
import HelpCenterPage, { HelpArticlePage } from './pages/HelpCenterPage';
import BuyerCentralPage from './pages/BuyerCentralPage';
import OrderProtectionPage from './pages/OrderProtectionPage';

import AboutUsPage from './pages/AboutUsPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';

import TrackOrderPage from './pages/TrackOrderPage';
import HowToBuyPage from './pages/HowToBuyPage';
import CareersPage from './pages/CareersPage';
import PressPage from './pages/PressPage';
import PartnersPage from './pages/PartnersPage';

import MainCategoryPage from './pages/MainCategoryPage';
import SubCategoryPage from './pages/SubCategoryPage';

import PublicPackagesPage from './pages/PackagesPage';
import PackageDetailPage from './pages/PackageDetailPage';

import ComparePage from './pages/ComparePage';

import SellerProfilePage from './pages/SellerProfilePage';

import AllProductsPage from './pages/AllProductsPage';

import CollectionDetailPage from './pages/CollectionDetailPage';

import SearchPage from './pages/SearchPage';

import PriceAlertsPage from './pages/PriceAlertsPage';
import NotificationsPage from './pages/NotificationsPage';

import MaintenancePage from './pages/MaintenancePage';

import VerifyDeliveryPage from './pages/VerifyDeliveryPage';

// ★ Welcome page (one‑time onboarding)
import WelcomePage from './pages/WelcomePage';

import './lib/i18n';
import { setNavigate } from './lib/navigation';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="text-center py-20">
    <h1 className="text-3xl font-bold mb-4">{title}</h1>
    <p className="text-gray-600 mb-8">This page is under construction.</p>
    <a href="/" className="text-primary-600 hover:underline">Return to Home</a>
  </div>
);

const RouteLogger = () => {
  const location = useLocation();
  useEffect(() => {
    console.log('📍 Current URL:', location.pathname);
  }, [location]);
  return null;
};

const SellerSetupGuard = () => {
  const { user } = useAuth();
  if (user?.roles?.includes('seller')) {
    return <Navigate to="/seller" replace />;
  }
  return <SellerSetupPage />;
};

function AppContent() {
  const { enabled: maintenanceMode } = useMaintenance();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  // Pre‑auth welcome carousel (skip if authenticated)
  useEffect(() => {
    if (user) return; // ★ IMPORTANT FIX: don't redirect logged-in users

    const hasSeen = localStorage.getItem('has_seen_welcome');
    if (
      hasSeen !== 'true' &&
      location.pathname !== '/welcome' &&
      location.pathname !== '/login' &&
      location.pathname !== '/register' &&
      location.pathname !== '/forgot-password'
    ) {
      navigate('/welcome', { replace: true });
    }
  }, [location.pathname, navigate, user]);

  // Special case: company subdomain pages
  if (location.pathname.startsWith('/company/')) {
    return <CompanyProfilePage />;
  }

  // Maintenance mode
  if (maintenanceMode && !user?.roles?.includes('admin')) {
    return <MaintenancePage />;
  }

  // Standalone delivery verification (existing)
  if (location.pathname === '/verify-delivery') {
    return <VerifyDeliveryPage />;
  }

  // Standalone partner board – ★ NEW
  if (location.pathname === '/partner/board') {
    return (
      <PrivateRoute>
        <PartnerBoardPage />
      </PrivateRoute>
    );
  }

  // Standalone seller setup
  if (location.pathname === '/seller-setup') {
    return <SellerSetupPage />;
  }

  // Standalone invoices
  if (location.pathname.startsWith('/invoices/')) {
    return (
      <Routes>
        <Route path="/invoices/:orderId" element={<InvoicePage />} />
      </Routes>
    );
  }

  // Standalone admin statement
  if (location.pathname === '/admin/cod-statement') {
    return <LogisticsPartnersPage standalone />;
  }

  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Public welcome page (no auth required) */}
        <Route path="/welcome" element={<WelcomePage />} />

        <Route
          path="/company/dashboard"
          element={
            <PrivateRoute requiredRole="company">
              <CompanyDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/bulk-order"
          element={
            <PrivateRoute requiredRole="company">
              <BulkOrderPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/messages"
          element={
            <PrivateRoute requiredRole="company">
              <MessagesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/suppliers"
          element={
            <PrivateRoute requiredRole="company">
              <SupplierDirectoryPage />
            </PrivateRoute>
          }
        />

        <Route path="/company/:companyId" element={<CompanyProfilePage />} />

        <Route path="/bulk-order" element={<BulkOrderPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/find-shop" element={<FindShopPage />} />
        <Route path="/shop/:sellerId" element={<SellerProfilePage />} />
        <Route path="/trade-assurance" element={<TradeAssurancePage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/help/:articleId" element={<HelpArticlePage />} />
        <Route path="/buyer-central" element={<BuyerCentralPage />} />
        <Route path="/order-protection" element={<OrderProtectionPage />} />
        <Route path="/orders" element={<BuyerOrdersPage />} />

        <Route
          path="/seller-setup"
          element={
            <PrivateRoute>
              <SellerSetupGuard />
            </PrivateRoute>
          }
        />

        <Route path="/category/:id" element={<MainCategoryPage />} />
        <Route path="/categories/:id" element={<MainCategoryPage />} />
        <Route path="/subcategory/:id" element={<SubCategoryPage />} />
        <Route path="/packages" element={<PublicPackagesPage />} />
        <Route path="/packages/:id" element={<PackageDetailPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/seller-profile/:sellerId" element={<SellerProfilePage />} />
        <Route path="/products/:tab" element={<AllProductsPage />} />
        <Route path="/products" element={<Navigate to="/products/new-arrivals" replace />} />
        <Route path="/all-products" element={<Navigate to="/products/new-arrivals" replace />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/price-alerts" element={<PriceAlertsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/track" element={<TrackOrderPage />} />
        <Route path="/how-to-buy" element={<HowToBuyPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/partners" element={<PartnersPage />} />

        {/* Dynamic legal pages */}
        <Route path="/terms" element={<LegalPageViewer />} />
        <Route path="/privacy" element={<LegalPageViewer />} />
        <Route path="/cookies" element={<LegalPageViewer />} />
        <Route path="/protection" element={<LegalPageViewer />} />
        <Route path="/ip-policy" element={<LegalPageViewer />} />
        <Route path="/shipping" element={<LegalPageViewer />} />
        <Route path="/returns" element={<LegalPageViewer />} />

        <Route
          path="/seller"
          element={
            <PrivateRoute requiredRole="seller">
              <SellerLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
          <Route path="payouts" element={<PayoutsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="packages" element={<SellerPackagesPage />} />
          <Route path="promotions" element={<SellerPromotionsPage />} />
          <Route path="policies" element={<StorePoliciesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <PrivateRoute requiredRole={['admin', 'sub_admin']}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="vendors" element={<AdminSellers />} />
          <Route path="products" element={<AdminProducts />} />
          {/* ★ NEW admin packages route */}
          <Route path="packages" element={<AdminPackagesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="promo-codes" element={<PromoCodesPage />} />
          <Route path="logistics-partners" element={<LogisticsPartnersPage />} />
          <Route path="partner-payouts" element={<PartnerPayoutsPage />} />
          <Route path="financial-ledger" element={<FinancialLedgerPage />} />
          <Route path="payment-gateways" element={<PaymentGatewaysPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="disputes" element={<DisputesPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="membership-plans" element={<AdminMembershipPlans />} />
          <Route path="manual-dispatches" element={<ManualDispatchPage />} />
          <Route path="payouts" element={<AdminSellerPayoutsPage />} />
          <Route path="return-policies" element={<ReturnPoliciesPage />} />
          <Route path="legal-pages" element={<LegalPagesPage />} />
          {/* ★ NEW sub-admins route */}
          <Route path="sub-admins" element={<SubAdminsPage />} />
          <Route path="cod-collection" element={<CodCollectionPage />} />
        </Route>

        <Route path="/suppliers" element={<PlaceholderPage title="Find Supplier" />} />
        <Route path="/sitemap" element={<PlaceholderPage title="Sitemap" />} />
        <Route path="*" element={<RouteLogger />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <SavedItemsProvider>
            <WishlistProvider>
              <ComparisonProvider>
                <QuickViewProvider>
                  <MaintenanceProvider>
                    <AppContent />
                  </MaintenanceProvider>
                </QuickViewProvider>
              </ComparisonProvider>
            </WishlistProvider>
          </SavedItemsProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;