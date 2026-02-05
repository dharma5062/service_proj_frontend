import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from '@/pages/auth/Register';
import LandingPage from '@/pages/layout/landing';
import VerifyOtp from '@/pages/auth/VerifyOtp';
import Login from '@/pages/auth/login';
import ForgotPassword from '@/pages/auth/forgotPassword';
import ResetPassword from '@/pages/auth/resetPassword';
import DashboardLayout from '@/pages/layout/DashboardLayout';
import ShopProfile from '@/pages/shop/ShopProfile';
import ShopOnboarding from '@/pages/onboarding/ShopOnboarding';
import ServicesPage from '@/pages/servicesrequest/ServicesPage';
import CreateServiceRequest from '@/pages/servicesrequest/CreateServiceRequest';
// import ViewServiceRequest from '@/pages/services/ViewServiceRequest';
import Dashboard from '@/pages/dashboard/Dashboard';
import InvoiceGenerator from '@/pages/invoice/InvoiceGenerator';
import StaffPage from '@/pages/staff/StaffPage';
// import NotificationCenter from '@/pages/notifications/NotificationCenter';
import ReportingPage from '@/pages/reporting/ReportingPage';
import PromotionsPage from '@/pages/promotions/PromotionsPage';
import ProductCategoriesPage from '@/pages/settings/ProductCategoriesPage';
import CategoryFormsPage from '@/pages/settings/CategoryFormsPage';
import BrandsPage from '@/pages/settings/BrandsPage';
import ProductsPage from '@/pages/settings/ProductsPage';
import CreateProductPage from '@/pages/settings/CreateProductPage';
// import ShopsPage from '@/pages/settings/ShopsPage';
import PrivateRoute from '@/components/routes/PrivateRoute';
import PublicRoute from '@/components/routes/PublicRoute';

const RouterComponent: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path='/' element={<LandingPage />} />
                <Route path='/register' element={<PublicRoute><Register /></PublicRoute>} />
                <Route path='/verify-otp' element={<PublicRoute><VerifyOtp /></PublicRoute>} />
                <Route path='/login' element={<PublicRoute><Login /></PublicRoute>} />
                <Route path='/forgot-password' element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                <Route path='/reset-password' element={<PublicRoute><ResetPassword /></PublicRoute>} />

                {/* Protected Routes */}
                <Route path='/dashboard' element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path='profile' element={<ShopProfile />} />
                    <Route path='staff' element={<StaffPage />} />
                    {/* <Route path='notifications' element={<NotificationCenter />} /> */}
                    <Route path='reporting' element={<ReportingPage />} />
                    <Route path='promotions' element={<PromotionsPage />} />
                    <Route path='services' element={<ServicesPage />} />
                    <Route path='services/create' element={<CreateServiceRequest />} />
                    <Route path='services/edit/:id' element={<CreateServiceRequest />} />
                    {/* <Route path='services/:id' element={<ViewServiceRequest />} /> */}
                    <Route path='invoice/create' element={<InvoiceGenerator />} />
                    <Route path='invoice/:id' element={<InvoiceGenerator />} />
                    {/* Settings Routes */}
                    <Route path='settings/categories' element={<ProductCategoriesPage />} />
                    <Route path='settings/category-form' element={<CategoryFormsPage />} />
                    <Route path='settings/brand' element={<BrandsPage />} />
                    <Route path='settings/product' element={<ProductsPage />} />
                    <Route path='settings/product/create' element={<CreateProductPage />} />
                    {/* <Route path='settings/shop' element={<ShopsPage />} /> */}
                    {/* Add other routes as they are created */}
                </Route>

                {/* Onboarding Routes - Standalone */}
                <Route path='/onboarding/shop' element={<PrivateRoute><ShopOnboarding /></PrivateRoute>} />
            </Routes>
        </BrowserRouter>
    );
};

export default RouterComponent;