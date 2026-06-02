import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Settings, LogOut, Mail, Shield, Building, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from '@/AuthContext';
import NotificationCenter from '@/pages/notifications/NotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';

// Helper: derive initials from a name string
const getInitials = (name?: string | null): string => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const DashboardLayout = () => {
    const navigate = useNavigate();
    const { user, shop, logout } = useAuth();
    const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
    const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);

    const displayEmail = user?.email || '';
    const displayInitials = getInitials(shop?.name || user?.name);

    const location = useLocation();

    // Helper: generate breadcrumbs from current path
    const getBreadcrumbs = () => {
        const pathnames = location.pathname.split('/').filter((x) => x);
        return pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;

            // Map segment names to readable titles
            const titles: Record<string, string> = {
                dashboard: 'Dashboard',
                settings: 'Settings',
                categories: 'Categories',
                products: 'Products',
                roles: 'Roles',
                permissions: 'Permissions',
                staff: 'Staff',
                reporting: 'Reporting',
                invoice: 'Invoice',
                promotions: 'Promotions',
                create: 'Create',
                edit: 'Edit',
                view: 'View',
                'business-types': 'Business Types',
                'shop-defect-form': 'Shop Defect Form',
                'company-branches': 'Company Branches',
            };

            return {
                title: titles[value] || value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' '),
                to,
                last,
            };
        });
    };

    const breadcrumbs = getBreadcrumbs();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <SidebarProvider>
            <Sidebar />
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
                <header className="navbar-professional flex h-14 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-14 border-b border-navbar-border">
                    {/* Left side - Sidebar trigger */}
                    <div className="navbar-left flex items-center gap-3 px-4">
                        <SidebarTrigger className="-ml-1 navbar-trigger" />
                        <Separator orientation="vertical" className="mr-2 h-4 opacity-30 bg-white/20" />
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            {breadcrumbs.map((breadcrumb, index) => (
                                <React.Fragment key={breadcrumb.to}>
                                    {index > 0 && (
                                        <ChevronRight className="h-3.5 w-3.5 text-white/40 shrink-0" />
                                    )}
                                    <button
                                        onClick={() => navigate(breadcrumb.to)}
                                        className={`text-sm font-medium transition-colors cursor-pointer truncate max-w-[120px] md:max-w-[180px] ${breadcrumb.last
                                            ? 'text-white'
                                            : 'text-white/60 hover:text-white'
                                            }`}
                                    >
                                        {breadcrumb.title}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Right side - Notifications and Profile */}
                    <div className="navbar-right flex items-center gap-1 px-4">
                        {/* Notification Sheet */}
                        <Sheet open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md navbar-icon-button relative">
                                    <Bell className="h-4 w-4 navbar-icon" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 border border-white"></span>
                                        </span>
                                    )}
                                    <span className="sr-only">Notifications</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0 border-l shadow-2xl flex flex-col bg-white">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Notifications</SheetTitle>
                                    <SheetDescription>Your recent notifications</SheetDescription>
                                </SheetHeader>
                                <NotificationCenter
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    loading={loading}
                                    markRead={markRead}
                                    markAllRead={markAllRead}
                                    onClose={() => setIsNotificationOpen(false)}
                                />
                            </SheetContent>
                        </Sheet>

                        {/* Settings Icon */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-md navbar-icon-button"
                                        onClick={() => navigate('/dashboard/settings')}
                                    >
                                        <Settings className="h-4 w-4 navbar-icon" />
                                        <span className="sr-only">Settings</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="navbar-tooltip">
                                    <p>Settings</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Profile Section via Sheet */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 ml-1 rounded-md navbar-profile-trigger p-0 group overflow-hidden">
                                    <Avatar className="h-7 w-7 rounded-lg border navbar-avatar transition-transform duration-200 group-hover:scale-110">
                                        <AvatarFallback className="rounded-lg text-[10px] bg-primary text-white font-bold">
                                            {displayInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="sr-only">Profile</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-80 p-0 sm:max-w-sm border-l shadow-2xl">
                                <SheetHeader className="p-6 bg-slate-50/50 border-b">
                                    <div className="flex flex-col items-center text-center space-y-3">
                                        <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-md ring-4 ring-primary/5">
                                            <AvatarFallback className="rounded-2xl bg-primary text-white text-xl font-bold">
                                                {displayInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <SheetTitle className="text-lg font-bold text-gray-900">{user?.name || 'User Profile'}</SheetTitle>
                                            <SheetDescription className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                                                <Mail className="h-3 w-3" />
                                                {displayEmail}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>

                                <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-250px)]">
                                    {/* Account Details Group */}
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Account Overview</h4>

                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                        <Shield className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-600">User Role</span>
                                                </div>
                                                <span className="text-[10px] font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-tight">
                                                    {user?.user_type === 'sa' ? 'Super Admin' :
                                                        user?.user_type === 'so' ? 'Shop Owner' :
                                                            user?.user_type === 'se' ? 'Employee' : 'General User'}
                                                </span>
                                            </div>

                                            {shop && (
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                            <Building className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-600">Primary Business</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-100 truncate max-w-[100px]">
                                                        {shop.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Settings Shortcut */}
                                    <div className="space-y-3 pt-2">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Quick Actions</h4>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start h-11 text-xs font-semibold rounded-xl border-gray-100 bg-white hover:bg-gray-50 hover:text-primary transition-all"
                                            onClick={() => navigate('/dashboard/settings')}
                                        >
                                            <Settings className="mr-3 h-4 w-4 text-gray-400" />
                                            System Settings
                                        </Button>
                                    </div>
                                </div>

                                {/* Persistent Footer Actions */}
                                <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
                                    <Button
                                        variant="destructive"
                                        className="w-full h-11 text-xs font-bold rounded-xl shadow-lg shadow-red-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out from Account
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>
                <ScrollArea className="flex-1 min-h-0" style={{ backgroundColor: "#f2f7fa" }}>
                    <main className="p-4 min-h-full">
                        <Outlet />
                    </main>
                </ScrollArea>
            </SidebarInset>
        </SidebarProvider>

    );
};

export default DashboardLayout;
