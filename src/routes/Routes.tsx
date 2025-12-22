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
import ServicesPage from '@/pages/services/ServicesPage';
import CreateServiceRequest from '@/pages/services/CreateServiceRequest';
// import ViewServiceRequest from '@/pages/services/ViewServiceRequest';
import Dashboard from '@/pages/dashboard/Dashboard';
import InvoiceGenerator from '@/pages/invoice/InvoiceGenerator';
import StaffPage from '@/pages/staff/StaffPage';
// import NotificationCenter from '@/pages/notifications/NotificationCenter';
import ReportingPage from '@/pages/reporting/ReportingPage';
import PromotionsPage from '@/pages/promotions/PromotionsPage';

const RouterComponent: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<LandingPage />} />
                <Route path='/register' element={<Register />} />
                <Route path='/verify-otp' element={<VerifyOtp />} />
                <Route path='/login' element={<Login />} />
                <Route path='/forgot-password' element={<ForgotPassword />} />
                <Route path='/reset-password' element={<ResetPassword />} />

                {/* Protected Routes */}
                <Route path='/dashboard' element={<DashboardLayout />}>
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
                    {/* Add other routes as they are created */}
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default RouterComponent;