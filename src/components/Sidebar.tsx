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
        { icon: Store, label: 'Services', path: '/dashboard/services', reqPerm: 'service.view' },
        { icon: Users, label: 'Staff', path: '/dashboard/staff', reqPerm: 'employee.view' },
        { icon: FolderTree, label: 'Categories', path: '/dashboard/settings/categories', reqPerm: 'category.view' },
        { icon: ShoppingBag, label: 'Products', path: '/dashboard/settings/product', reqPerm: 'product.view' },
        // Reporting & Promotions are owner/admin level; employees need no special permission guard here
        // but we restrict them to sa/so only via the isAdminOrOwner flag
        { icon: BarChart3, label: 'Reporting', path: '/dashboard/reporting', reqPerm: null, adminOnly: true },
        // { icon: Tag, label: 'Promotions', path: '/dashboard/promotions', reqPerm: null, adminOnly: true },
    ];

    const settingsItems = [
        // { icon: FolderTree, label: 'Categories', path: '/dashboard/settings/categories', reqPerm: 'category.view' },
        { icon: FileEdit, label: 'Defect Form', path: '/dashboard/settings/category-form', reqPerm: null, adminOnly: true },
        { icon: Package, label: 'Brand', path: '/dashboard/settings/brand', reqPerm: 'brand.view' },
        // { icon: ShoppingBag, label: 'Product', path: '/dashboard/settings/product', reqPerm: 'product.view' },
        { icon: Briefcase, label: 'Business Types', path: '/dashboard/settings/business-types', reqPerm: 'business_type.view' },
        { icon: IndianRupee, label: 'Service Charges', path: '/dashboard/settings/service-charges', reqPerm: 'service_charge.view' },
        { icon: Users, label: 'Roles & Privileges', path: '/dashboard/settings/roles', reqPerm: 'role.view' },
    ];

    // Determines if a nav/settings item should be visible for the current user
    const isItemVisible = (item: { label: string; reqPerm: string | null; adminOnly?: boolean }) => {
        // adminOnly items are only shown to sa / so
        if (item.adminOnly && !isSuperAdmin && !isShopOwner) return false;

        // Customers only see Dashboard and Services
        if (isCustomer) {
            return ['Dashboard', 'Services'].includes(item.label);
        }

        // reqPerm: null means always visible (already passed adminOnly check)
        if (!item.reqPerm) return true;
        return hasPermission(item.reqPerm);
    };

    const visibleSettingsItems = settingsItems.filter(isItemVisible);

    const isActive = (path: string) => location.pathname === path;

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
                    {navItems.filter(isItemVisible).map((item) => (
                        <SidebarMenuItem key={item.path}>
                            <div
                                title={item.label}
                                className={`flex items-center w-full sidebar-menu-button-compact cursor-pointer ${isActive(item.path) ? 'active' : 'text-gray-500'}`}
                                onClick={() => navigate(item.path)}
                            >
                                <item.icon className="sidebar-icon-compact size-4 shrink-0" />
                                <span className="sidebar-label-compact">{item.label}</span>
                            </div>
                        </SidebarMenuItem>
                    ))}

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
