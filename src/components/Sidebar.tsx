import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard,
    Store,
    Settings,
    LogOut,
    Users,
    BarChart3,
    Tag,
    ChevronsUpDown,
    ChevronDown,
    FolderTree,
    FileEdit,
    Package,
    ShoppingBag,
    Check,
    Plus,
    IndianRupee
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar as SidebarContainer,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
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
    const [settingsOpen, setSettingsOpen] = useState(true);

    // ── Auth context ──────────────────────────────────────────────────────────
    const { user, shop, shops, setShop, logout, hasPermission, isSuperAdmin, isShopOwner, isCustomer } = useAuth();

    const displayName = shop?.name || user?.name || 'My Shop';
    const displayEmail = user?.email || '';
    const displayInitials = getInitials(shop?.name || user?.name);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard',             reqPerm: null },
        { icon: Store,           label: 'Services',   path: '/dashboard/services',    reqPerm: 'service.view' },
        { icon: Users,           label: 'Staff',      path: '/dashboard/staff',       reqPerm: 'employee.view' },
        // Reporting & Promotions are owner/admin level; employees need no special permission guard here
        // but we restrict them to sa/so only via the isAdminOrOwner flag
        { icon: BarChart3,       label: 'Reporting',  path: '/dashboard/reporting',   reqPerm: null, adminOnly: true },
        { icon: Tag,             label: 'Promotions', path: '/dashboard/promotions',  reqPerm: null, adminOnly: true },
    ];

    const settingsItems = [
        { icon: FolderTree,    label: 'Categories',       path: '/dashboard/settings/categories',     reqPerm: 'category.view' },
        { icon: FileEdit,      label: 'Defect Form',      path: '/dashboard/settings/category-form',  reqPerm: null, adminOnly: true },
        { icon: Package,       label: 'Brand',            path: '/dashboard/settings/brand',          reqPerm: 'brand.view' },
        { icon: ShoppingBag,   label: 'Product',          path: '/dashboard/settings/product',        reqPerm: 'product.view' },
        { icon: IndianRupee,   label: 'Service Charges',  path: '/dashboard/settings/service-charges', reqPerm: 'service_charge.view' },
        { icon: Users,         label: 'Roles & Privileges', path: '/dashboard/settings/roles',        reqPerm: 'role.view' },
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
        <SidebarContainer collapsible="icon">
            {/* Header with Shop / User Info */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    disabled={isCustomer}
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                                        CO
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{shop?.shop_owner?.company_name || 'Company Name'}</span>
                                        <span className="truncate text-xs text-muted-foreground">{shop?.name || 'Select Branch'}</span>
                                    </div>
                                    {!isCustomer && <ChevronsUpDown className="ml-auto size-4" />}
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            {!isCustomer && (
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
                    </SidebarMenuItem>

                    {/* Create Shop minimal button */}
                    {(isSuperAdmin || isShopOwner) && (
                        <SidebarMenuItem className="mt-1">
                            <SidebarMenuButton 
                                onClick={() => navigate('/onboarding/shop')}
                                className="text-primary hover:text-primary hover:bg-primary/10 font-medium cursor-pointer"
                            >
                                <Plus className="size-4" />
                                <span>Create Shop</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarHeader>

            {/* Navigation Content */}
            <SidebarContent>
                <SidebarMenu>
                    {navItems.filter(isItemVisible).map((item) => (
                        <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.label}
                                isActive={isActive(item.path)}
                            >
                                <Link to={item.path}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}

                    {/* Settings Dropdown — only shown when the user has at least one visible settings item */}
                    {visibleSettingsItems.length > 0 && (
                        <Collapsible
                            open={settingsOpen}
                            onOpenChange={setSettingsOpen}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip="Settings">
                                        <Settings />
                                        <span>Settings</span>
                                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {visibleSettingsItems.map((item) => (
                                            <SidebarMenuSubItem key={item.path}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isActive(item.path)}
                                                >
                                                    <Link to={item.path}>
                                                        <item.icon />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
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
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
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
