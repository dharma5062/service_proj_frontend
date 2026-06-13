import { useState, useMemo } from 'react';
import { useAuth } from '@/AuthContext';
import { useShopsApi, Shop } from '@/pages/serviceAPI/ShopsAPI';
import { useUsersApi } from '@/pages/serviceAPI/UsersAPI';
import { DataTable, Column } from '@/components/ui/table/datatable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, Building2, Edit, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function CompanyBranchesPage() {
    const { isShopOwner, isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const { useGetShops, useUpdateShop, useDeleteShop } = useShopsApi();
    const { data: shopsResponse, isLoading } = useGetShops();
    const updateMutation = useUpdateShop();
    const deleteMutation = useDeleteShop();

    const [activeTab, setActiveTab] = useState('branch');

    // Action States
    // const [viewingShop, setViewingShop] = useState<Shop | null>(null);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [editForm, setEditForm] = useState({
        branchName: '',
        companyName: '',
        address: '',
        phone: '',
        email: '',
        is_main: false,
        upi_id: '',
        upi_name: ''
    });

    const [editingCompany, setEditingCompany] = useState<Shop | null>(null);
    const [companyForm, setCompanyForm] = useState({
        name: '',
        companyName: '',
        address: '',
        phone: '',
        image: null as File | null,
        imageUrl: ''
    });

    useAuth();
    const { updateUser: updateCompanyMutation, deleteUser: deleteCompanyMutation } = useUsersApi();

    const shopsData: Shop[] = shopsResponse?.data?.data || shopsResponse?.data || [];

    // Parse description to handle JSON safely
    const getShopDescription = (description: any) => {
        if (typeof description === 'string') {
            try {
                return JSON.parse(description);
            } catch (e) {
                return { address: description };
            }
        }
        return description || {};
    };

    // Action Handlers

    const handleEdit = (shop: Shop) => {
        const desc = getShopDescription(shop.description);
        setEditForm({
            branchName: shop.name,
            companyName: shop.shop_owner?.company_name || shop.shop_owner?.name || '',
            address: desc?.address || '',
            phone: desc?.phone || '',
            email: desc?.email || '',
            is_main: desc?.is_main === true,
            upi_id: shop.upi_id || '',
            upi_name: shop.upi_name || ''
        });
        setEditingShop(shop);
    };

    const handleDelete = async (shop: Shop) => {
        if (window.confirm(`Are you sure you want to delete branch "${shop.name}"?`)) {
            try {
                await deleteMutation.mutateAsync(shop.id);
                toast.success('Branch deleted successfully');
            } catch (error) {
                toast.error('Failed to delete branch');
            }
        }
    };

    const handleSaveEdit = async () => {
        if (!editingShop) return;
        try {
            const currentDesc = getShopDescription(editingShop.description);
            const updatedDesc = {
                ...currentDesc,
                address: editForm.address,
                phone: editForm.phone,
                email: editForm.email,
                is_main: editForm.is_main
            };

            await updateMutation.mutateAsync({
                id: editingShop.id,
                payload: {
                    name: editForm.branchName,
                    description: updatedDesc,
                    upi_id: editForm.upi_id,
                    upi_name: editForm.upi_name
                }
            });
            toast.success('Branch updated successfully');
            setEditingShop(null);
        } catch (error) {
            toast.error('Failed to update branch');
        }
    };

    // Company Management Handlers
    const handleEditCompany = (shop: Shop) => {
        const owner = shop.shop_owner;
        setCompanyForm({
            name: owner?.name || '',
            companyName: owner?.company_name || '',
            address: owner?.address || '',
            phone: owner?.phone || '',
            image: null,
            imageUrl: owner?.profile_photo_url || ''
        });
        setEditingCompany(shop);
    };

    const handleSaveCompanyEdit = async () => {
        if (!editingCompany || !editingCompany.shop_owner) return;

        try {
            await updateCompanyMutation.mutateAsync({
                id: editingCompany.shop_owner.id,
                payload: {
                    name: companyForm.name,
                    company_name: companyForm.companyName,
                    address: companyForm.address,
                    phone: companyForm.phone,
                    image: companyForm.image
                }
            });
            setEditingCompany(null);
        } catch (error) {
            console.error('Failed to update company:', error);
        }
    };

    const handleDeleteCompany = async (shop: Shop) => {
        if (!shop.shop_owner) return;
        if (window.confirm(`Are you sure you want to delete company "${shop.shop_owner.company_name || shop.shop_owner.name}"? This action cannot be undone.`)) {
            try {
                await deleteCompanyMutation.mutateAsync(shop.shop_owner.id);
            } catch (error) {
                console.error('Failed to delete company:', error);
            }
        }
    };

    // Columns for Branch Tab
    const branchColumns: Column<Shop>[] = [
        {
            key: 'company',
            title: 'Company',
            dataIndex: 'shop_owner',
            sortable: true,
            render: (_, record) => {
                const companyName = record.shop_owner?.company_name || record.shop_owner?.name || 'Unknown Company';
                return <span className="font-medium text-gray-900">{companyName}</span>;
            }
        },
        {
            key: 'branch',
            title: 'Branch Name',
            dataIndex: 'name',
            sortable: true,
            render: (val, record) => {
                const desc = getShopDescription(record.description);
                const isMain = desc?.is_main === true;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{val}</span>
                        {isMain && (
                            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase shadow-sm">Main</span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'address',
            title: 'Address',
            dataIndex: 'description',
            render: (_, record) => {
                const desc = getShopDescription(record.description);
                const address = desc?.address || 'N/A';
                return <span className="text-gray-500 truncate block max-w-[200px] md:max-w-[300px] lg:max-w-[400px]" title={address}>{address}</span>;
            }
        },
        {
            key: 'actions',
            title: 'Actions',
            dataIndex: 'id',
            align: 'center',
            render: (_, record) => (
                <div className="flex items-center justify-center gap-2">
                    {/* <button onClick={() => handleView(record)} className="text-blue-500 hover:text-blue-700 transition-colors" title="View Branch">
                        <Eye className="w-3.5 h-3.5" />
                    </button> */}
                    <button onClick={() => handleEdit(record)} className="text-green-500 hover:text-green-700 transition-colors" title="Edit Branch">
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(record)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete Branch">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )
        }
    ];

    // Deduplicate companies based on shop_owner_id
    const companiesData = useMemo(() => {
        const uniqueCompanies = new Map();
        shopsData.forEach(shop => {
            if (shop.shop_owner && !uniqueCompanies.has(shop.shop_owner.id)) {
                uniqueCompanies.set(shop.shop_owner.id, shop);
            }
        });
        return Array.from(uniqueCompanies.values());
    }, [shopsData]);

    // Columns for Company Tab
    const companyColumns: Column<Shop>[] = [
        {
            key: 'company_name',
            title: 'Company Name',
            dataIndex: 'shop_owner',
            sortable: true,
            render: (_, record) => {
                const companyName = record.shop_owner?.company_name || record.shop_owner?.name || 'Unknown Company';
                const logo = record.shop_owner?.profile_photo_url || null;
                const initials = companyName.substring(0, 2).toUpperCase();

                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 rounded-md border border-gray-100 bg-white">
                            <AvatarImage src={logo} alt={companyName} className="object-contain p-0.5" />
                            <AvatarFallback className="rounded-md bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900">{companyName}</span>
                    </div>
                );
            }
        },
        // {
        //     key: 'website',
        //     title: 'Website',
        //     dataIndex: 'description',
        //     render: (_, record) => {
        //         const desc = getShopDescription(record.description);
        //         const website = desc?.website;
        //         if (website) {
        //             return <a href={website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{website}</a>;
        //         }
        //         return <span className="text-gray-400">N/A</span>;
        //     }
        // },
        {
            key: 'address',
            title: 'Address',
            dataIndex: 'description',
            render: (_, record) => {
                const desc = getShopDescription(record.description);
                const address = desc?.address || 'N/A';
                return <span className="text-gray-500 truncate block max-w-[200px] md:max-w-[300px]">{address}</span>;
            }
        },
        {
            key: 'created_date',
            title: 'Created Date',
            dataIndex: 'shop_owner',
            sortable: true,
            render: (_, record) => {
                const dateString = record.shop_owner?.created_at;
                if (!dateString) return <span className="text-gray-400">N/A</span>;
                const date = new Date(dateString);
                return <span className="text-gray-700">{date.toLocaleDateString()}</span>;
            }
        },
        {
            key: 'actions',
            title: 'Actions',
            dataIndex: 'id',
            align: 'center',
            render: (_, record) => (
                <div className="flex items-center justify-center gap-2">
                    <button 
                        onClick={() => handleEditCompany(record)} 
                        className="text-green-500 hover:text-green-700 transition-colors"
                        title="Edit Company"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={() => handleDeleteCompany(record)} 
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete Company"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )
        }
    ];

    const handleCreate = () => {
        navigate('/onboarding/shop');
    };

    return (
        <div>
            {/* Minimal Header */}
            {/* <div className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <span className="cursor-pointer hover:text-gray-900" onClick={() => navigate('/dashboard/settings')}>Settings</span>
                    <span className="mx-2">&gt;</span>
                    <span className="font-medium text-gray-900">Company</span>
                </div>
            </div> */}

            {/* Custom Tabs implementation imitating the screenshot */}
            <div >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Tabs Header - Segmented Pill style */}
                    <div className="bg-slate-50/70 p-2">
                        <TabsList className="w-full flex justify-between h-auto p-0 bg-transparent gap-2">
                            <TabsTrigger
                                value="branch"
                                className="flex-1 rounded-md py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm border-l-4 border-transparent data-[state=active]:border-l-blue-600 data-[state=active]:text-gray-900 text-gray-500 transition-all font-semibold text-xs"
                            >
                                <Store className="w-4 h-4 mr-2 text-gray-400" />
                                Branch
                            </TabsTrigger>
                            <TabsTrigger
                                value="company"
                                className="flex-1 rounded-md py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm border-l-4 border-transparent data-[state=active]:border-l-blue-600 data-[state=active]:text-gray-900 text-gray-500 transition-all font-semibold text-xs"
                            >
                                <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                Company
                            </TabsTrigger>
                            <TabsTrigger
                                value="access"
                                className="flex-1 rounded-md py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm border-l-4 border-transparent data-[state=active]:border-l-blue-600 data-[state=active]:text-gray-900 text-gray-500 transition-all font-semibold text-xs"
                            >
                                <Lock className="w-4 h-4 mr-2 text-gray-400" />
                                Branch Access
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-4">
                        <TabsContent value="branch" className="m-0 focus-visible:outline-none">
                            <DataTable
                                title="Branch Management"
                                data={shopsData}
                                columns={branchColumns}
                                searchable={true}
                                loading={isLoading}
                                onAdd={handleCreate}
                                showAdd={isSuperAdmin || isShopOwner}
                                density="compact"
                                className="border rounded-md shadow-sm [&_.table-header]:bg-white [&_.table-header-cell]:text-gray-500 [&_.table-header-cell]:font-semibold [&_.table-header-cell]:text-[12px] [&_tr]:border-b [&_th]:border-r [&_td]:border-r [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0"
                            />
                        </TabsContent>

                        <TabsContent value="company" className="m-0 focus-visible:outline-none">
                            <DataTable
                                title="Company Management"
                                data={companiesData}
                                columns={companyColumns}
                                searchable={true}
                                loading={isLoading}
                                density="compact"
                                className="border rounded-md shadow-sm [&_.table-header]:bg-white [&_.table-header-cell]:text-gray-500 [&_.table-header-cell]:font-semibold [&_.table-header-cell]:text-[12px] [&_tr]:border-b [&_th]:border-r [&_td]:border-r [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0"
                            />
                        </TabsContent>

                        <TabsContent value="access" className="m-0 focus-visible:outline-none">
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Lock className="w-8 h-8 text-gray-200 mb-3" />
                                <h3 className="text-sm font-medium text-gray-900">Branch Access Control</h3>
                                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                                    Configure which users have access to specific branches across your organization.
                                </p>
                                <Button variant="outline" className="mt-4 h-8 text-xs">
                                    Configure Access
                                </Button>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* View Shop Dialog */}
            {/* <Dialog open={!!viewingShop} onOpenChange={(open) => !open && setViewingShop(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Branch Details</DialogTitle>
                    </DialogHeader>
                    {viewingShop && (
                        <div className="space-y-4 py-4 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                                <span className="font-semibold text-gray-500">Company</span>
                                <span className="col-span-2">{viewingShop.shop_owner?.company_name || viewingShop.shop_owner?.name || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="font-semibold text-gray-500">Branch Name</span>
                                <span className="col-span-2">{viewingShop.name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="font-semibold text-gray-500">Address</span>
                                <span className="col-span-2">{getShopDescription(viewingShop.description)?.address || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="font-semibold text-gray-500">Status</span>
                                <span className="col-span-2">{viewingShop.active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog> */}

            {/* Edit Shop Dialog */}
            <Dialog open={!!editingShop} onOpenChange={(open) => !open && setEditingShop(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Branch</DialogTitle>
                    </DialogHeader>

                    <DialogDescription className="text-xs text-gray-500 mt-0.5">
                        Update the specific details for this branch. Note that the company name is fixed and managed at the owner level.
                    </DialogDescription>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-0">
                        <div className="space-y-1.5">
                            <Label htmlFor="companyName" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">Company</Label>
                            <Input
                                id="companyName"
                                value={editForm.companyName}
                                disabled
                                className="bg-gray-50 text-gray-500 h-8 text-xs border-gray-200 focus:ring-0"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="branchName" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">Branch Name</Label>
                            <Input
                                id="branchName"
                                value={editForm.branchName}
                                onChange={(e) => setEditForm({ ...editForm, branchName: e.target.value })}
                                placeholder="Enter name"
                                className="h-8 text-xs border-gray-200 focus:border-blue-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">Phone Number</Label>
                            <Input
                                id="phone"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                placeholder="Phone number"
                                className="h-8 text-xs border-gray-200 focus:border-blue-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">Address / Location</Label>
                            <Input
                                id="address"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                placeholder="Street, City, etc."
                                className="h-8 text-xs border-gray-200 focus:border-blue-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="upi_id" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">UPI ID</Label>
                            <Input
                                id="upi_id"
                                value={editForm.upi_id}
                                onChange={(e) => setEditForm({ ...editForm, upi_id: e.target.value })}
                                placeholder="e.g. merchant@upi"
                                className="h-8 text-xs border-gray-200 focus:border-blue-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="upi_name" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">UPI Name</Label>
                            <Input
                                id="upi_name"
                                value={editForm.upi_name}
                                onChange={(e) => setEditForm({ ...editForm, upi_name: e.target.value })}
                                placeholder="e.g. Shop Name"
                                className="h-8 text-xs border-gray-200 focus:border-blue-400"
                            />
                        </div>

                        {/* Main Branch Toggle */}
                        <div className="col-span-1 sm:col-span-2 pt-3 border-t mt-1">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_main"
                                    checked={editForm.is_main}
                                    onChange={(e) => setEditForm({ ...editForm, is_main: e.target.checked })}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <Label htmlFor="is_main" className="text-xs font-bold text-gray-700 cursor-pointer">
                                    Set as Main Branch
                                </Label>
                            </div>
                            <p className="text-[10px] text-gray-400 ml-5.5 mt-0.5">
                                This branch will be the default view upon login.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingShop(null)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={updateMutation.isPending || !editForm.branchName.trim()}>
                            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Company Dialog */}
            <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Company</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 mt-0.5">
                            Modify the primary company profile and contact details for this shop owner.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 py-3">
                        <div className="col-span-1 sm:col-span-2 flex items-center gap-4 pb-3 border-b mb-1">
                            <div className="relative group">
                                <Avatar className="h-12 w-12 rounded-lg border border-gray-200">
                                    <AvatarImage 
                                        src={companyForm.image ? URL.createObjectURL(companyForm.image) : companyForm.imageUrl} 
                                        alt="Company Logo" 
                                        className="object-contain p-1"
                                    />
                                    <AvatarFallback className="rounded-lg bg-gray-50 text-gray-400 text-[10px]">Logo</AvatarFallback>
                                </Avatar>
                                <Label 
                                    htmlFor="logo-upload" 
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer transition-opacity text-[10px]"
                                >
                                    Edit
                                </Label>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <h4 className="text-xs font-semibold text-gray-900">Company Logo</h4>
                                <p className="text-[10px] text-gray-500">Update your corporate branding</p>
                                <input 
                                    id="logo-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setCompanyForm({ ...companyForm, image: file });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="ownerName" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">Owner Name</Label>
                            <Input
                                id="ownerName"
                                value={companyForm.name}
                                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                placeholder="Owner name"
                                className="h-8 text-xs border-gray-200 focus:border-blue-400"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="companyManageName" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">Company Name</Label>
                            <Input
                                id="companyManageName"
                                value={companyForm.companyName}
                                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                                placeholder="Company name"
                                className="h-8 text-xs border-gray-200 focus:border-blue-400"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="companyPhone" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">Contact Phone</Label>
                            <Input
                                id="companyPhone"
                                value={companyForm.phone}
                                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                                placeholder="Phone number"
                                className="h-8 text-xs border-gray-200 focus:border-blue-400"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="companyAddress" className="text-[11px] font-semibold text-gray-500 capitalize tracking-wider">Address</Label>
                            <Input
                                id="companyAddress"
                                value={companyForm.address}
                                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                                placeholder="Company address"
                                className="h-8 text-xs border-gray-200 focus:border-blue-400"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCompany(null)}>Cancel</Button>
                        <Button onClick={handleSaveCompanyEdit} disabled={updateCompanyMutation.isPending || !companyForm.companyName.trim()}>
                            {updateCompanyMutation.isPending ? 'Saving...' : 'Update Company'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
