import { useState, useEffect } from 'react';
import { useAuth } from '@/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/table/tableComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Brand,
    fetchBrandById,
    CreateBrandPayload,
    useBrandsApi
} from '@/pages/serviceAPI/BrandsAPI';
import { ImageIcon } from 'lucide-react';

interface BrandFormData {
    name: string;
    brand_logo: File | null;
    is_active: boolean;
}

const BrandsPage = () => {
    const { shopId } = useAuth();
    const { useGetBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } = useBrandsApi();
    const { data: brands = [], isLoading: loading } = useGetBrands();

    const createMutation = useCreateBrand();
    const updateMutation = useUpdateBrand();
    const deleteMutation = useDeleteBrand();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset pagination when branch changes
    useEffect(() => {
        setCurrentPage(1);
        setFormDialogOpen(false);
        setViewDialogOpen(false);
    }, [shopId]);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<BrandFormData>({
        name: '',
        brand_logo: null,
        is_active: true,
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const columns: Column<Brand>[] = [
        {
            key: 'name',
            title: 'Brand Name',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value, record) => (
                <div className="flex items-center gap-3">
                    {record.brand_logo ? (
                        <img
                            src={record.brand_logo}
                            alt={value}
                            className="w-10 h-10 rounded-md object-cover border border-gray-200"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                    <span className="font-bold text-gray-900 text-xs">{value}</span>
                </div>
            ),
        },
        {
            key: 'is_active',
            title: 'Status',
            dataIndex: 'is_active',
            sortable: true,
            filterable: true,
            filterOptions: [
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' },
            ],
            render: (value) => (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
    ];

    const handleView = async (record: Brand) => {
        try {
            const brand = await fetchBrandById(record.id);
            setSelectedBrand(brand);
            setViewDialogOpen(true);
        } catch (error) {
            toast.error('Failed to load brand details');
        }
    };

    const handleEdit = (record: Brand) => {
        setIsEditMode(true);
        setSelectedBrandId(record.id);
        setFormData({
            name: record.name,
            brand_logo: null,
            is_active: Boolean(record.is_active),
        });
        // Set preview to existing logo if available
        setLogoPreview(record.brand_logo || null);
        setFormDialogOpen(true);
    };

    const handleDeleteClick = (record: Brand) => {
        setSelectedBrandId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedBrandId) {
            try {
                await deleteMutation.mutateAsync(selectedBrandId);
                toast.success('Brand deleted successfully');
            } catch (error) {
                toast.error('Failed to delete brand', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedBrandId(null);
    };

    const handleAddNew = () => {
        setIsEditMode(false);
        setSelectedBrandId(null);
        setFormData({
            name: '',
            brand_logo: null,
            is_active: true,
        });
        setLogoPreview(null);
        setFormErrors({});
        setFormDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            // Validate file size (e.g., max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setFormData({ ...formData, brand_logo: file });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Brand name is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const payload: CreateBrandPayload = {
                name: formData.name,
                brand_logo: formData.brand_logo,
                is_active: formData.is_active ? 1 : 0,
            };

            if (isEditMode && selectedBrandId) {
                await updateMutation.mutateAsync({ id: selectedBrandId, payload });
                toast.success('Brand updated successfully');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Brand created successfully');
            }

            setFormDialogOpen(false);
        } catch (error) {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} brand`, {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Brands</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-blue-600">Manage product brands and logos.</p>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={brands}
                title="Brands List"
                searchable={true}
                showActions={true}
                showAdd={true}
                showExport={true}
                onAdd={handleAddNew}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: brands.length,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
                loading={loading}
            />

            {/* View Brand Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Brand Details</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            View brand information
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBrand && (
                        <div className="space-y-3">
                            {/* Basic Info */}
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-xs font-bold">Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500">Brand Name</p>
                                            <p className="text-sm font-medium">{selectedBrand.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <Badge className={selectedBrand.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                                {selectedBrand.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        {selectedBrand.brand_logo && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500 mb-2">Brand Logo</p>
                                                <img
                                                    src={selectedBrand.brand_logo}
                                                    alt={selectedBrand.name}
                                                    className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Form Dialog */}
            <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            {isEditMode ? 'Edit Brand' : 'Create New Brand'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {isEditMode ? 'Update brand information' : 'Add a new brand'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Brand Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Samsung, LG, Sony"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={formErrors.name ? 'border-red-500' : ''}
                            />
                            {formErrors.name && (
                                <p className="text-xs text-red-500">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Brand Logo */}
                        <div className="space-y-2">
                            <Label htmlFor="brand_logo" className="text-sm font-medium">
                                Brand Logo
                            </Label>
                            <Input
                                id="brand_logo"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="cursor-pointer"
                            />
                            <p className="text-xs text-gray-500">Upload brand logo (JPG, PNG, max 5MB)</p>

                            {/* Logo Preview */}
                            {logoPreview && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                                    <img
                                        src={logoPreview}
                                        alt="Logo preview"
                                        className="w-32 h-32 rounded-lg object-cover border border-gray-200"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_active" className="text-sm font-medium">
                                    Active Status
                                </Label>
                                <p className="text-xs text-gray-500">Enable this brand for use</p>
                            </div>
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Saving...' : isEditMode ? 'Update Brand' : 'Create Brand'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the brand.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default BrandsPage;
