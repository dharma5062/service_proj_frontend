import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    Settings,
    LogOut,
    Users,
    BarChart3,
    ChevronsUpDown,
    FolderTree,
    FileEdit,
    Package,
    ShoppingBag,
    Check,
    IndianRupee,
    Briefcase,
    FileText,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar as SidebarContainer,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/AuthContext';

// Helper: derive initials from a name string
const getInitials = (name?: string | null): string => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isMobile } = useSidebar();

    // ── Auth context ──────────────────────────────────────────────────────────
    const { user, shop, shops, setShop, logout, hasPermission, isSuperAdmin, isShopOwner, isCustomer } = useAuth();

    const displayName = shop?.name || user?.name || 'My Shop';
    const displayEmail = user?.email || '';
    const displayInitials = getInitials(shop?.name || user?.name);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', reqPerm: null },
        {
            icon: Store,
            label: 'Services',
            reqPerm: 'service.view',
            isDropdown: true,
            menuKey: 'services',
            path: '/dashboard/services',
            subItems: [
                { label: 'Customers', path: '/dashboard/settings/customers', reqPerm: 'customer.view' },
                { label: 'Invoices', path: '/dashboard/invoices', reqPerm: null },
            ]
        },
        ...(isCustomer ? [
            { icon: FileText, label: 'Invoices', path: '/dashboard/invoices', reqPerm: null }
        ] : []),
        {
            icon: Users,
            label: 'Staff',
            reqPerm: 'employee.view',
            isDropdown: true,
            menuKey: 'staff',
            path: '/dashboard/staff',
            subItems: [
                { label: 'Staff List', path: '/dashboard/staff', reqPerm: 'employee.view' },
                { label: 'Dashboard', path: '/dashboard/staff/performance', reqPerm: null, adminOnly: true },
            ]
        },
        { icon: FolderTree, label: 'Categories', path: '/dashboard/categories', reqPerm: 'category.view' },
        { icon: Package, label: 'Brands', path: '/dashboard/brand', reqPerm: 'brand.view' },
        { icon: ShoppingBag, label: 'Products', path: '/dashboard/product', reqPerm: 'product.view' },
        { icon: FileEdit, label: 'Shop Defect Form', path: '/dashboard/shop-defect-form', reqPerm: null, adminOnly: true },
        // Reporting & Promotions are owner/admin level; employees need no special permission guard here
        // but we restrict them to sa/so only via the isAdminOrOwner flag
        { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics', reqPerm: null, adminOnly: true },
        // { icon: Tag, label: 'Promotions', path: '/dashboard/promotions', reqPerm: null, adminOnly: true },
    ];

    const settingsItems = [
        // { icon: FolderTree, label: 'Categories', path: '/dashboard/categories', reqPerm: 'category.view' },
        // { icon: FileEdit, label: 'Defect Form', path: '/dashboard/shop-defect-form', reqPerm: null, adminOnly: true },
        // { icon: Package, label: 'Brand', path: '/dashboard/brand', reqPerm: 'brand.view' },
        // { icon: ShoppingBag, label: 'Product', path: '/dashboard/product', reqPerm: 'product.view' },
        { icon: Briefcase, label: 'Business Types', path: '/dashboard/settings/business-types', reqPerm: 'business_type.view' },
        { icon: IndianRupee, label: 'Service Charges', path: '/dashboard/settings/service-charges', reqPerm: 'service_charge.view' },
        { icon: Users, label: 'Customers', path: '/dashboard/settings/customers', reqPerm: 'customer.view' },
        { icon: Users, label: 'Roles & Privileges', path: '/dashboard/settings/roles', reqPerm: 'role.view' },
    ];

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
        const isServicesActive = ['/dashboard/services', '/dashboard/settings/customers', '/dashboard/invoices'].some(
            p => location.pathname === p || 
                 (p === '/dashboard/invoices' && location.pathname.startsWith('/dashboard/invoice')) || 
                 (p === '/dashboard/services' && location.pathname.startsWith('/dashboard/services/'))
        );
        const isStaffActive = location.pathname.startsWith('/dashboard/staff');
        return {
            services: isServicesActive,
            staff: isStaffActive,
        };
    });

    useEffect(() => {
        const isServicesActive = ['/dashboard/services', '/dashboard/settings/customers', '/dashboard/invoices'].some(
            p => location.pathname === p || 
                 (p === '/dashboard/invoices' && location.pathname.startsWith('/dashboard/invoice')) || 
                 (p === '/dashboard/services' && location.pathname.startsWith('/dashboard/services/'))
        );
        if (isServicesActive) {
            setOpenMenus(prev => ({ ...prev, services: true }));
        }
        if (location.pathname.startsWith('/dashboard/staff')) {
            setOpenMenus(prev => ({ ...prev, staff: true }));
        }
    }, [location.pathname]);

    const toggleMenu = (menuKey: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [menuKey]: !prev[menuKey]
        }));
    };

    // Determines if a nav/settings item should be visible for the current user
    const isItemVisible = (item: any): boolean => {
        // adminOnly items are only shown to sa / so
        if (item.adminOnly && !isSuperAdmin && !isShopOwner) return false;

        // Customers only see Dashboard, Services, and Invoices
        if (isCustomer) {
            return ['Dashboard', 'Services', 'Invoices'].includes(item.label);
        }

        // If it is a dropdown, show it if the parent itself is allowed, or if any subItems are visible
        if (item.isDropdown) {
            const isParentAllowed = !item.reqPerm || hasPermission(item.reqPerm);
            if (isParentAllowed) return true;
            
            if (item.subItems) {
                return item.subItems.some((sub: any) => isItemVisible(sub));
            }
            return false;
        }

        // reqPerm: null means always visible (already passed adminOnly check)
        if (!item.reqPerm) return true;
        return hasPermission(item.reqPerm);
    };

    const visibleSettingsItems = settingsItems.filter(isItemVisible);

    const isActive = (path: string) => {
        if (location.pathname === path) return true;
        if (path === '/dashboard/invoices' && location.pathname.startsWith('/dashboard/invoice')) return true;
        if (path === '/dashboard/services' && location.pathname.startsWith('/dashboard/services/')) return true;
        if (path === '/dashboard/staff' && location.pathname === '/dashboard/staff') return true;
        if (path === '/dashboard/staff/performance' && location.pathname.startsWith('/dashboard/staff/performance')) return true;
        return false;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <SidebarContainer collapsible="icon" className="sidebar-professional">
            {/* Header with Shop / User Info */}
            <SidebarHeader>
                <div>
                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
                                        {shop?.shop_owner?.company_name?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold sidebar-label-compact">{shop?.shop_owner?.company_name || 'Company Name'}</span>
                                        <span className="truncate text-xs text-muted-foreground sidebar-label-compact">{shop?.name || 'Select Branch'}</span>
                                    </div>
                                    {!isCustomer && (isSuperAdmin || isShopOwner) && <ChevronsUpDown className="ml-auto size-4" />}
                                </div>
                            </DropdownMenuTrigger>
                            {!isCustomer && (isSuperAdmin || isShopOwner) && (
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                    align="start"
                                    side={isMobile ? "bottom" : "right"}
                                    sideOffset={4}
                                >
                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                        Branches
                                    </DropdownMenuLabel>
                                    {shops?.map((s) => (
                                        <DropdownMenuItem key={s.id} onClick={() => setShop(s)} className="gap-2 p-2 cursor-pointer">
                                            <div className="flex size-6 items-center justify-center rounded-sm border">
                                                <Store className="size-4 shrink-0" />
                                            </div>
                                            {s.name}
                                            {shop?.id === s.id && <Check className="ml-auto size-4" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            )}
                        </DropdownMenu>
                    </div>
                </div>
            </SidebarHeader>

            {/* Navigation Content */}
            <SidebarContent>
                <SidebarMenu>
                    {navItems.filter(isItemVisible).map((item) => {
                        if (item.isDropdown && !isCustomer) {
                            const isMenuOpen = !!openMenus[item.menuKey!];
                            const isSubActive = item.subItems?.some(sub => isActive(sub.path));
                            const isParentActive = isActive(item.path!);

                            return (
                                <SidebarMenuItem key={item.label}>
                                    <div
                                        title={item.label}
                                        className={`flex items-center justify-between w-full sidebar-menu-button-compact cursor-pointer ${isSubActive || isParentActive ? 'active' : 'text-gray-500'}`}
                                        onClick={() => {
                                            if (item.path) navigate(item.path);
                                            toggleMenu(item.menuKey!);
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="sidebar-icon-compact size-4 shrink-0" />
                                            <span className="sidebar-label-compact">{item.label}</span>
                                        </div>
                                        {isMenuOpen ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        )}
                                    </div>

                                    {isMenuOpen && (
                                        <div className="sidebar-submenu-compact flex flex-col">
                                            {item.subItems
                                                ?.filter(isItemVisible)
                                                .map((sub) => (
                                                    <div
                                                        key={sub.path}
                                                        title={sub.label}
                                                        className={`sidebar-submenu-button-compact cursor-pointer flex items-center ${isActive(sub.path) ? 'active' : 'text-gray-500'}`}
                                                        onClick={() => navigate(sub.path)}
                                                    >
                                                        <span className="sidebar-label-compact">{sub.label}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </SidebarMenuItem>
                            );
                        }

                        const path = item.isDropdown && isCustomer ? '/dashboard/services' : item.path;
                        const label = item.isDropdown && isCustomer ? 'Services' : item.label;

                        return (
                            <SidebarMenuItem key={label}>
                                <div
                                    title={label}
                                    className={`flex items-center w-full sidebar-menu-button-compact cursor-pointer ${isActive(path!) ? 'active' : 'text-gray-500'}`}
                                    onClick={() => navigate(path!)}
                                >
                                    <item.icon className="sidebar-icon-compact size-4 shrink-0" />
                                    <span className="sidebar-label-compact">{label}</span>
                                </div>
                            </SidebarMenuItem>
                        );
                    })}

                    {/* Settings Link — only shown when the user has at least one visible settings item */}
                    {visibleSettingsItems.length > 0 && (
                        <SidebarMenuItem>
                            <div
                                title="Settings"
                                className={`flex items-center w-full sidebar-menu-button-compact cursor-pointer ${isActive('/dashboard/settings') ? 'active' : 'text-gray-500'}`}
                                onClick={() => navigate('/dashboard/settings')}
                            >
                                <Settings className="sidebar-icon-compact size-4 shrink-0" />
                                <span className="sidebar-label-compact">Settings</span>
                            </div>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarContent>

            {/* Footer with User Dropdown */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground sidebar-menu-button-compact"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src="" alt={displayName} />
                                        <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                                            {displayInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold sidebar-label-compact">{displayName}</span>
                                        <span className="truncate text-xs sidebar-label-compact">{displayEmail}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarImage src="" alt={displayName} />
                                            <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                                                {displayInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{displayName}</span>
                                            <span className="truncate text-xs">{displayEmail}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </SidebarContainer>

    );
};

export default Sidebar;
