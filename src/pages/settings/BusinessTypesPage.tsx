import { useState, useEffect } from 'react';
import { useAuth } from '@/AuthContext';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/table/datatable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BusinessType,
    CreateBusinessTypePayload,
    fetchBusinessTypeById,
    useBusinessTypesApi,
} from '@/pages/serviceAPI/BusinessTypesAPI';
import { fetchProductCategories, ProductCategory } from '@/pages/serviceAPI/ProductCategoriesAPI';

// ─── Form state type ───────────────────────────────────────────────────────────

interface BusinessTypeFormData {
    name: string;
    category_id: string; // stored as string for Select component, converted on submit
}

// ─── Page Component ────────────────────────────────────────────────────────────

const BusinessTypesPage = () => {
    const { hasPermission } = useAuth();
    const {
        useGetBusinessTypes,
        useCreateBusinessType,
        useUpdateBusinessType,
        useDeleteBusinessType,
    } = useBusinessTypesApi();

    const { data: businessTypes = [], isLoading: loading } = useGetBusinessTypes();

    const createMutation = useCreateBusinessType();
    const updateMutation = useUpdateBusinessType();
    const deleteMutation = useDeleteBusinessType();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Categories for dropdown
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [formData, setFormData] = useState<BusinessTypeFormData>({
        name: '',
        category_id: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Load categories once on mount (for the dropdown)
    useEffect(() => {
        setCategoriesLoading(true);
        fetchProductCategories()
            .then(setCategories)
            .catch(() => toast.error('Failed to load categories'))
            .finally(() => setCategoriesLoading(false));
    }, []);

    // ─── Table Columns ─────────────────────────────────────────────────────────

    const columns: Column<BusinessType>[] = [
        {
            key: 'name',
            title: 'Business Type',
            dataIndex: 'name',
            sortable: true,
            filterable: true,
            render: (value) => (
                <span className="text-xs font-bold text-gray-900 leading-tight">
                    {value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'}
                </span>
            ),
        },
        {
            key: 'category',
            title: 'Category',
            dataIndex: 'category',
            render: (_value, record) => {
                const categoryName = record.category?.name || '-';
                return (
                    <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 shadow-sm">
                        {categoryName}
                    </span>
                );
            },
        },
        {
            key: 'active',
            title: 'Status',
            dataIndex: 'active',
            render: (value) => (
                <Badge
                    variant={value ? 'default' : 'secondary'}
                    className={`text-[10px] px-2 py-0.5 ${value
                        ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-50'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}
                >
                    {value ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
    ];

    // ─── Handlers ──────────────────────────────────────────────────────────────

    const handleView = async (record: BusinessType) => {
        try {
            const type = await fetchBusinessTypeById(record.id);
            setSelectedType(type);
            setViewDialogOpen(true);
        } catch (error) {
            console.error('Failed to load business type details:', error);
            toast.error('Failed to load business type details', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleEdit = (record: BusinessType) => {
        setIsEditMode(true);
        setSelectedTypeId(record.id);
        setFormData({
            name: record.name,
            category_id: record.category_id ? String(record.category_id) : '',
        });
        setFormErrors({});
        setFormDialogOpen(true);
    };

    const handleDeleteClick = (record: BusinessType) => {
        setSelectedTypeId(record.id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedTypeId) {
            try {
                await deleteMutation.mutateAsync(selectedTypeId);
                toast.success('Business type deleted successfully');
            } catch (error) {
                toast.error('Failed to delete business type', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        setDeleteDialogOpen(false);
        setSelectedTypeId(null);
    };

    const handleAddNew = () => {
        setIsEditMode(false);
        setSelectedTypeId(null);
        setFormData({ name: '', category_id: '' });
        setFormErrors({});
        setFormDialogOpen(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Business type name is required';
        }

        if (!formData.category_id) {
            errors.category_id = 'Category is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const payload: CreateBusinessTypePayload = {
                name: formData.name.trim(),
                category_id: Number(formData.category_id),
            };

            if (isEditMode && selectedTypeId) {
                await updateMutation.mutateAsync({ id: selectedTypeId, payload });
                toast.success('Business type updated successfully');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Business type created successfully');
            }

            setFormDialogOpen(false);
        } catch (error) {
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} business type`, {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Business Types</h1>
                    <p className="text-xs sm:text-sm mt-0.5 text-primary font-medium">
                        Manage business types and their associated categories.
                    </p>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={businessTypes}
                title="Business Types List"
                searchable={true}
                showActions={true}
                showAdd={hasPermission('business_type.create')}
                showExport={true}
                onAdd={hasPermission('business_type.create') ? handleAddNew : undefined}
                onView={handleView}
                onEdit={hasPermission('business_type.update') ? handleEdit : undefined}
                onDelete={hasPermission('business_type.delete') ? handleDeleteClick : undefined}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: businessTypes.length,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                }}
                hoverable
                bordered
                loading={loading}
            />

            {/* ── View Dialog ────────────────────────────────────────────────── */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">Business Type Details</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Detailed view of the selected business type.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedType && (
                        <div className="space-y-3">
                            <Card>
                                <CardHeader className="pb-2 pt-3 px-3">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500">Business Type Name</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {selectedType.name}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500">Category</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {selectedType.category?.name || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <Badge
                                                variant={selectedType.active ? 'default' : 'secondary'}
                                                className={`mt-1 text-[10px] px-2 py-0.5 ${selectedType.active
                                                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-50'
                                                    : 'bg-gray-50 text-gray-500 border border-gray-200'
                                                    }`}
                                            >
                                                {selectedType.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Created At</p>
                                            <p className="text-xs text-gray-600">
                                                {selectedType.created_at
                                                    ? new Date(selectedType.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Last Updated</p>
                                            <p className="text-xs text-gray-600">
                                                {selectedType.updated_at
                                                    ? new Date(selectedType.updated_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Create / Edit Form Dialog ──────────────────────────────────── */}
            <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            {isEditMode ? 'Edit Business Type' : 'Add New Business Type'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {isEditMode
                                ? 'Update the existing business type details.'
                                : 'Provide details for the new business type.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="bt-name" className="text-sm font-medium">
                                Business Type Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="bt-name"
                                placeholder="e.g., Retail, Wholesale, Service"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className={formErrors.name ? 'border-red-500' : ''}
                            />
                            {formErrors.name && (
                                <p className="text-xs text-red-500">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="bt-category" className="text-sm font-medium">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.category_id}
                                onValueChange={(val) =>
                                    setFormData({ ...formData, category_id: val })
                                }
                                disabled={categoriesLoading}
                            >
                                <SelectTrigger
                                    id="bt-category"
                                    className={formErrors.category_id ? 'border-red-500' : ''}
                                >
                                    <SelectValue
                                        placeholder={
                                            categoriesLoading ? 'Loading categories...' : 'Select a category'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                    {!categoriesLoading && categories.length === 0 && (
                                        <div className="px-3 py-2 text-xs text-gray-400">
                                            No categories found
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            {formErrors.category_id && (
                                <p className="text-xs text-red-500">{formErrors.category_id}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setFormDialogOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting
                                ? 'Saving...'
                                : isEditMode
                                    ? 'Update Business Type'
                                    : 'Create Business Type'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the business type.
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

export default BusinessTypesPage;
