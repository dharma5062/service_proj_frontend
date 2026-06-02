import { useNavigate } from "react-router-dom";
import {
    Briefcase,
    IndianRupee,
    Users,
    ChevronRight,
    Building2,
    LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/AuthContext";

interface SettingCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    path: string;
    colorClass: string;
    reqPerm: string | null;
    adminOnly?: boolean;
}

const SettingCard = ({ title, description, icon: Icon, path, colorClass }: SettingCardProps) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(path)}
            className="group relative flex items-center gap-4 rounded-xl border border-gray-100 p-5 hover:bg-white transition-all cursor-pointer bg-white hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
        >
            <div className={cn("inline-flex w-12 h-12 shrink-0 rounded-xl items-center justify-center transition-all group-hover:scale-110", colorClass)}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-sm leading-none tracking-tight group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                    {description}
                </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5" />
            </div>
        </div>
    );
};

export default function SettingsPage() {
    const { isSuperAdmin, isShopOwner, hasPermission } = useAuth();

    const settingsOptions: SettingCardProps[] = [
        // {
        //     title: "Categories",
        //     description: "Manage product and service categories hierarchy.",
        //     icon: FolderTree,
        //     path: "/dashboard/categories",
        //     colorClass: "bg-primary/10 text-primary group-hover:bg-primary/20",
        //     reqPerm: "category.view",
        // },
        
        // {
        //     title: "Defect Form",
        //     description: "Configure dynamic forms for category defects.",
        //     icon: FileEdit,
        //     path: "/dashboard/shop-defect-form",
        //     colorClass: "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
        //     reqPerm: null,
        //     adminOnly: true,
        // },
        // {
        //     title: "Brands",
        //     description: "Manage business partner and product brands.",
        //     icon: Package,
        //     path: "/dashboard/brand",
        //     colorClass: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
        //     reqPerm: "brand.view",
        // },
        // {
        //     title: "Products",
        //     description: "Add, edit and manage your inventory items.",
        //     icon: ShoppingBag,
        //     path: "/dashboard/product",
        //     colorClass: "bg-green-50 text-green-600 group-hover:bg-green-100",
        //     reqPerm: "product.view",
        // },
        {
            title: "Business Types",
            description: "Define different categories of businesses.",
            icon: Briefcase,
            path: "/dashboard/settings/business-types",
            colorClass: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
            reqPerm: "business_type.view",
        },
        {
            title: "Service Charges",
            description: "Set up default charges for various services.",
            icon: IndianRupee,
            path: "/dashboard/settings/service-charges",
            colorClass: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
            reqPerm: "service_charge.view",
        },
        {
            title: "Customers",
            description: "Manage shop customers and invitations.",
            icon: Users,
            path: "/dashboard/settings/customers",
            colorClass: "bg-teal-50 text-teal-600 group-hover:bg-teal-100",
            reqPerm: "customer.view",
        },
        {
            title: "Company Settings",
            description: "Manage your company profile and branch locations.",
            icon: Building2,
            path: "/dashboard/settings/company-branches",
            colorClass: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
            reqPerm: null,
            adminOnly: true,
        },
        {
            title: "Roles & Privileges",
            description: "Configure user access levels and permissions.",
            icon: Users,
            path: "/dashboard/settings/roles",
            colorClass: "bg-rose-50 text-rose-600 group-hover:bg-rose-100",
            reqPerm: "role.view",
        },
    ];

    const visibleOptions = settingsOptions.filter(item => {
        if (item.adminOnly && !isSuperAdmin && !isShopOwner) return false;
        if (!item.reqPerm) return true;
        return hasPermission(item.reqPerm);
    });

    return (
        <div className="space-y-6">
            <div className="space-y-1 pb-4 border-b">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-xs sm:text-sm mt-0.5 text-primary font-medium">
                    Manage your store configurations and application preferences.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleOptions.map((option) => (
                    <SettingCard key={option.path} {...option} />
                ))}
            </div>
        </div>
    );
}
