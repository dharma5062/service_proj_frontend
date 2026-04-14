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
    const { user, shop, shops, setShop, logout } = useAuth();

    const displayName = shop?.name || user?.name || 'My Shop';
    const displayEmail = user?.email || '';
    const displayInitials = getInitials(shop?.name || user?.name);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Store, label: 'Services', path: '/dashboard/services' },
        { icon: Users, label: 'Staff', path: '/dashboard/staff' },
        { icon: BarChart3, label: 'Reporting', path: '/dashboard/reporting' },
        { icon: Tag, label: 'Promotions', path: '/dashboard/promotions' },
    ];

    const settingsItems = [
        { icon: FolderTree, label: 'Categories', path: '/dashboard/settings/categories' },
        { icon: FileEdit, label: 'Defect Form Builder', path: '/dashboard/settings/category-form' },
        { icon: Package, label: 'Brand', path: '/dashboard/settings/brand' },
        { icon: ShoppingBag, label: 'Product', path: '/dashboard/settings/product' },
        { icon: IndianRupee, label: 'Service Charges', path: '/dashboard/settings/service-charges' },
        // { icon: Store, label: 'Shop', path: '/dashboard/settings/shop' },
    ];

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
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                                        CO
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{shop?.shop_owner?.company_name || 'Company Name'}</span>
                                        <span className="truncate text-xs text-muted-foreground">{shop?.name || 'Select Branch'}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
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
                        </DropdownMenu>
                    </SidebarMenuItem>

                    {/* Create Shop minimal button */}
                    <SidebarMenuItem className="mt-1">
                        <SidebarMenuButton 
                            onClick={() => navigate('/onboarding/shop')}
                            className="text-primary hover:text-primary hover:bg-primary/10 font-medium cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Create Shop</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Navigation Content */}
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map((item) => (
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

                    {/* Settings Dropdown */}
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
                                    {settingsItems.map((item) => (
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
